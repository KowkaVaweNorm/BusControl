/**
 * CameraController
 *
 * Управляет состоянием камеры (позиция, зум) на основе событий ввода.
 * Связывает InputService и CanvasRendererService.
 * Реализует логику зума в точку курсора и ограничения границ.
 *
 * @module shared/lib/game-core
 */

import { inputService, InputEventType, MouseButton } from './InputService';
import { canvasRendererService } from './CanvasRendererService';

export interface CameraConfig {
  /** Минимальный масштаб */
  minScale: number;
  /** Максимальный масштаб */
  maxScale: number;
  /** Чувствительность зума колесиком */
  zoomSensitivity: number;
  /** Чувствительность перетаскивания */
  panSensitivity: number;
  /** Границы мира (если нужно ограничить камеру) */
  worldBounds?: { width: number; height: number };
}

export class CameraController {
  private isInitialized: boolean = false;
  private unsubscribeFunctions: (() => void)[] = [];
  private boundHandleMouseMove?: (event: any) => void;
  private boundHandleWheel?: (event: any) => void;

  private readonly config: CameraConfig;

  constructor(config?: Partial<CameraConfig>) {
    this.config = {
      minScale: config?.minScale ?? 0.2,
      maxScale: config?.maxScale ?? 5.0,
      zoomSensitivity: config?.zoomSensitivity ?? 0.001,
      panSensitivity: config?.panSensitivity ?? 1.0,
      worldBounds: config?.worldBounds,
    };

    // Заранее создаём привязанные обработчики
    this.boundHandleMouseMove = this.handleMouseMove.bind(this);
    this.boundHandleWheel = this.handleWheel.bind(this);
  }

  /**
   * Инициализация контроллера (подписка на события)
   */
  public initialize(): void {
    // Отписка от старых подписок (важно для React Strict Mode!)
    this.cleanup();

    // Подписка на перетаскивание (Drag)
    const unsubMouseMove = inputService.subscribe(
      InputEventType.MOUSE_MOVE,
      this.boundHandleMouseMove!
    );
    this.unsubscribeFunctions.push(unsubMouseMove);

    // Подписка на колесико (Zoom)
    const unsubWheel = inputService.subscribe(InputEventType.MOUSE_WHEEL, this.boundHandleWheel!);
    this.unsubscribeFunctions.push(unsubWheel);

    this.isInitialized = true;
    console.log('[CameraController] Initialized');
  }

  /**
   * Обработка движения мыши для панорамирования
   */
  private handleMouseMove(event: any): void {
    const mouseState = inputService.getMouseState();
    const viewport = canvasRendererService.getViewport();

    // Используем ТОЛЬКО среднюю кнопку (MouseButton.MIDDLE = 1) для драга карты
    if (mouseState.buttons.has(MouseButton.MIDDLE)) {
      // Учитываем масштаб: при зуме движение должно быть медленнее
      // Делим на scale, чтобы на любом зуме мышь передвигала карту на одинаковое расстояние
      const deltaX = (event.payload.deltaX * this.config.panSensitivity) / viewport.scale;
      const deltaY = (event.payload.deltaY * this.config.panSensitivity) / viewport.scale;

      this.pan(-deltaX, -deltaY);
    }
  }

  /**
   * Обработка колесика для зума
   */
  private handleWheel(event: any): void {
    const { deltaY } = event.payload;

    // Получаем текущие координаты мыши для зума в точку курсора
    const mouseState = inputService.getMouseState();
    const screenX = mouseState.x;
    const screenY = mouseState.y;

    this.zoom(deltaY, screenX, screenY);
  }

  /**
   * Панорамирование камеры
   * @param dx Смещение по X
   * @param dy Смещение по Y
   */
  public pan(dx: number, dy: number): void {
    const viewport = canvasRendererService.getViewport();

    let newX = viewport.x + dx;
    let newY = viewport.y + dy;

    canvasRendererService.setCameraPosition(newX, newY);
  }

  /**
   * Зумирование камеры в точку экрана
   * @param deltaDeltaY Дельта колесика
   * @param screenX Экранная координата X центра зума
   * @param screenY Экранная координата Y центра зума
   */
  public zoom(deltaDeltaY: number, screenX: number, screenY: number): void {
    const viewport = canvasRendererService.getViewport();
    const currentScale = viewport.scale;

    // Вычисляем новый масштаб
    const zoomFactor = Math.exp(-deltaDeltaY * this.config.zoomSensitivity);
    let newScale = currentScale * zoomFactor;

    // Ограничиваем зум
    newScale = Math.max(this.config.minScale, Math.min(this.config.maxScale, newScale));

    // Если масштаб не изменился значительно, выходим
    if (Math.abs(newScale - currentScale) < 0.001) {
      return;
    }

    // === МАГИЯ ЗУМА В ТОЧКУ КУРСОРА ===
    // 1. Получаем мировые координаты точки под курсором ДО зума
    const worldBefore = canvasRendererService.screenToWorld(screenX, screenY);

    // 2. Применяем новый масштаб
    canvasRendererService.setCameraScale(newScale);

    // 3. Получаем мировые координаты той же точки экрана ПОСЛЕ зума (при старом смещении)
    // Но нам нужно скорректировать смещение камеры так, чтобы мировые координаты под курсором не изменились

    // Формула коррекции позиции:
    // Новая позиция = Старая позиция + (МирДо - МирПосле) * Масштаб (упрощенно)
    // Более точно через экранные координаты:

    // const viewportAfter = canvasRendererService.getViewport();
    const worldAfter = canvasRendererService.screenToWorld(screenX, screenY);

    const dx = worldBefore.x - worldAfter.x;
    const dy = worldBefore.y - worldAfter.y;

    canvasRendererService.setCameraPosition(viewport.x + dx, viewport.y + dy);
    // =========================================
  }

  /**
   * Сброс камеры в начальное состояние
   */
  public reset(): void {
    canvasRendererService.setCameraPosition(0, 0);
    canvasRendererService.setCameraScale(1.0);
    console.log('[CameraController] Camera reset');
  }

  /**
   * Очистка (отписка от событий)
   */
  public cleanup(): void {
    this.unsubscribeFunctions.forEach((unsub) => unsub());
    this.unsubscribeFunctions = [];
    this.isInitialized = false;
    console.log('[CameraController] Cleaned up');
  }

  public getIsInitialized(): boolean {
    return this.isInitialized;
  }
}

// Экспорт единственного экземпляра
export const cameraController = new CameraController();
