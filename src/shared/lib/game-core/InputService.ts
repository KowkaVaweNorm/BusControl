/**
 * InputService
 *
 * Обрабатывает события мыши, клавиатуры и тач-событий.
 * Конвертирует экранные координаты в координаты игрового мира.
 * Реализует паттерн Command для игровых действий.
 *
 * @module shared/lib/game-core
 */

import { canvasRendererService } from './CanvasRendererService';
import { gameEventBusService, GameEventType } from './GameEventBusService';

// ============================================
// Типы ввода
// ============================================

/**
 * Типы кнопок мыши
 */
export enum MouseButton {
  LEFT = 0,
  MIDDLE = 1,
  RIGHT = 2,
}

/**
 * Типы клавиш-модификаторов
 */
export interface ModifierKeys {
  shift: boolean;
  ctrl: boolean;
  alt: boolean;
  meta: boolean;
}

/**
 * Состояние клавиатуры
 */
export interface KeyboardState {
  keys: Set<string>;
  modifiers: ModifierKeys;
}

/**
 * Состояние мыши
 */
export interface MouseState {
  x: number;
  y: number;
  worldX: number;
  worldY: number;
  buttons: Set<MouseButton>;
  isDragging: boolean;
  dragStartX: number;
  dragStartY: number;
  dragStartWorldX: number;
  dragStartWorldY: number;
}

/**
 * Типы событий ввода
 */
export enum InputEventType {
  MOUSE_DOWN = 'input:mouse_down',
  MOUSE_UP = 'input:mouse_up',
  MOUSE_MOVE = 'input:mouse_move',
  MOUSE_CLICK = 'input:mouse_click',
  MOUSE_DOUBLE_CLICK = 'input:mouse_double_click',
  MOUSE_WHEEL = 'input:mouse_wheel',
  KEY_DOWN = 'input:key_down',
  KEY_UP = 'input:key_up',
  TOUCH_START = 'input:touch_start',
  TOUCH_MOVE = 'input:touch_move',
  TOUCH_END = 'input:touch_end',
}

/**
 * Данные события ввода
 */
export interface InputEvent<T = unknown> {
  type: InputEventType;
  payload: T;
  timestamp: number;
  modifiers: ModifierKeys;
}

/**
 * Конфигурация InputService
 */
export interface InputServiceConfig {
  /** Чувствительность колесика мыши для зума */
  zoomSensitivity: number;
  /** Задержка для определения клика (мс) */
  clickDelay: number;
  /** Минимальное расстояние для драга (пиксели) */
  dragThreshold: number;
  /** Включить ли обработку клавиатуры */
  enableKeyboard: boolean;
  /** Включить ли обработку тач-событий */
  enableTouch: boolean;
  /** Включить ли логирование */
  enableLogging: boolean;
}

/**
 * Обработчик событий ввода
 */
export type InputEventHandler<T extends InputEventType> = (
  event: InputEvent<InputEventMap[T]>
) => void;

/**
 * Маппинг типов событий на данные
 */
export interface InputEventMap {
  [InputEventType.MOUSE_DOWN]: {
    button: MouseButton;
    x: number;
    y: number;
    worldX: number;
    worldY: number;
  };
  [InputEventType.MOUSE_UP]: {
    button: MouseButton;
    x: number;
    y: number;
    worldX: number;
    worldY: number;
  };
  [InputEventType.MOUSE_MOVE]: {
    x: number;
    y: number;
    worldX: number;
    worldY: number;
    deltaX: number;
    deltaY: number;
  };
  [InputEventType.MOUSE_CLICK]: {
    button: MouseButton;
    x: number;
    y: number;
    worldX: number;
    worldY: number;
    clickCount: number;
  };
  [InputEventType.MOUSE_DOUBLE_CLICK]: {
    button: MouseButton;
    x: number;
    y: number;
    worldX: number;
    worldY: number;
  };
  [InputEventType.MOUSE_WHEEL]: {
    deltaX: number;
    deltaY: number;
    deltaZ: number;
  };
  [InputEventType.KEY_DOWN]: {
    key: string;
    code: string;
    repeat: boolean;
  };
  [InputEventType.KEY_UP]: {
    key: string;
    code: string;
  };
  [InputEventType.TOUCH_START]: {
    x: number;
    y: number;
    worldX: number;
    worldY: number;
    touchId: number;
  };
  [InputEventType.TOUCH_MOVE]: {
    x: number;
    y: number;
    worldX: number;
    worldY: number;
    touchId: number;
    deltaX: number;
    deltaY: number;
  };
  [InputEventType.TOUCH_END]: {
    x: number;
    y: number;
    worldX: number;
    worldY: number;
    touchId: number;
  };
}

// ============================================
// Сервис ввода
// ============================================

export class InputService {
  private targetElement: HTMLElement | null = null;
  private isInitialized: boolean = false;
  private isEnabled: boolean = true;

  // Привязанные обработчики событий (для корректной отписки)
  private boundHandleMouseDown?: (e: MouseEvent) => void;
  private boundHandleMouseUp?: (e: MouseEvent) => void;
  private boundHandleMouseMove?: (e: MouseEvent) => void;
  private boundHandleWheel?: (e: WheelEvent) => void;
  private boundHandleDoubleClick?: (e: MouseEvent) => void;
  private boundHandleContextMenu?: (e: MouseEvent) => void;
  private boundHandleKeyDown?: (e: KeyboardEvent) => void;
  private boundHandleKeyUp?: (e: KeyboardEvent) => void;
  private boundHandleTouchStart?: (e: TouchEvent) => void;
  private boundHandleTouchMove?: (e: TouchEvent) => void;
  private boundHandleTouchEnd?: (e: TouchEvent) => void;
  private boundHandleWindowBlur?: () => void;

  private keyboardState: KeyboardState = {
    keys: new Set(),
    modifiers: { shift: false, ctrl: false, alt: false, meta: false },
  };

  private mouseState: MouseState = {
    x: 0,
    y: 0,
    worldX: 0,
    worldY: 0,
    buttons: new Set(),
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    dragStartWorldX: 0,
    dragStartWorldY: 0,
  };

  private clickTimeouts: Map<number, ReturnType<typeof setTimeout>> = new Map();
  private lastMousePosition = { x: 0, y: 0 };

  private subscribers: Map<InputEventType, Set<InputEventHandler<InputEventType>>> = new Map();

  private readonly config: InputServiceConfig;

  constructor(config?: Partial<InputServiceConfig>) {
    this.config = {
      zoomSensitivity: config?.zoomSensitivity ?? 0.001,
      clickDelay: config?.clickDelay ?? 250,
      dragThreshold: config?.dragThreshold ?? 5,
      enableKeyboard: config?.enableKeyboard ?? true,
      enableTouch: config?.enableTouch ?? true,
      enableLogging: config?.enableLogging ?? false,
    };

    // Инициализация мапы подписчиков
    Object.values(InputEventType).forEach((eventType) => {
      this.subscribers.set(eventType as InputEventType, new Set());
    });

    // Заранее создаём привязанные обработчики (для корректной отписки)
    this.boundHandleMouseDown = this.handleMouseDown.bind(this);
    this.boundHandleMouseUp = this.handleMouseUp.bind(this);
    this.boundHandleMouseMove = this.handleMouseMove.bind(this);
    this.boundHandleWheel = this.handleWheel.bind(this);
    this.boundHandleDoubleClick = this.handleDoubleClick.bind(this);
    this.boundHandleContextMenu = this.handleContextMenu.bind(this);
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    this.boundHandleKeyUp = this.handleKeyUp.bind(this);
    this.boundHandleTouchStart = this.handleTouchStart.bind(this);
    this.boundHandleTouchMove = this.handleTouchMove.bind(this);
    this.boundHandleTouchEnd = this.handleTouchEnd.bind(this);
    this.boundHandleWindowBlur = this.handleWindowBlur.bind(this);
  }

  /**
   * Инициализация сервиса ввода
   */
  public initialize(targetElementId: string): void {
    if (this.isInitialized) {
      console.warn('[InputService] Already initialized');
      return;
    }

    this.targetElement = document.getElementById(targetElementId);
    if (!this.targetElement) {
      console.error('[InputService] Target element not found:', targetElementId);
      return;
    }

    // Предотвращение стандартного поведения
    this.targetElement.style.touchAction = 'none';
    this.targetElement.style.userSelect = 'none';

    // Пересоздание мапы подписчиков (важно для React Strict Mode!)
    this.subscribers.clear();
    Object.values(InputEventType).forEach((eventType) => {
      this.subscribers.set(eventType as InputEventType, new Set());
    });

    // Регистрация обработчиков событий
    this.attachEventListeners();

    this.isInitialized = true;
    console.log('[InputService] Initialized');
  }

  /**
   * Привязка обработчиков событий
   */
  private attachEventListeners(): void {
    if (!this.targetElement) return;

    // Мышь
    this.targetElement.addEventListener('mousedown', this.boundHandleMouseDown!);
    this.targetElement.addEventListener('mouseup', this.boundHandleMouseUp!);
    this.targetElement.addEventListener('mousemove', this.boundHandleMouseMove!);
    this.targetElement.addEventListener('wheel', this.boundHandleWheel!);
    this.targetElement.addEventListener('dblclick', this.boundHandleDoubleClick!);
    this.targetElement.addEventListener('contextmenu', this.boundHandleContextMenu!);

    // Клавиатура (на window для глобального перехвата)
    if (this.config.enableKeyboard) {
      window.addEventListener('keydown', this.boundHandleKeyDown!);
      window.addEventListener('keyup', this.boundHandleKeyUp!);
    }

    // Тач
    if (this.config.enableTouch) {
      this.targetElement.addEventListener('touchstart', this.boundHandleTouchStart!, {
        passive: false,
      });
      this.targetElement.addEventListener('touchmove', this.boundHandleTouchMove!, {
        passive: false,
      });
      this.targetElement.addEventListener('touchend', this.boundHandleTouchEnd!, {
        passive: false,
      });
    }

    // Очистка при уходе со страницы
    window.addEventListener('blur', this.boundHandleWindowBlur!);
  }

  /**
   * Отвязка обработчиков событий
   */
  private detachEventListeners(): void {
    if (!this.targetElement) return;

    this.targetElement.removeEventListener('mousedown', this.boundHandleMouseDown!);
    this.targetElement.removeEventListener('mouseup', this.boundHandleMouseUp!);
    this.targetElement.removeEventListener('mousemove', this.boundHandleMouseMove!);
    this.targetElement.removeEventListener('wheel', this.boundHandleWheel!);
    this.targetElement.removeEventListener('dblclick', this.boundHandleDoubleClick!);
    this.targetElement.removeEventListener('contextmenu', this.boundHandleContextMenu!);

    if (this.config.enableKeyboard) {
      window.removeEventListener('keydown', this.boundHandleKeyDown!);
      window.removeEventListener('keyup', this.boundHandleKeyUp!);
    }

    if (this.config.enableTouch) {
      this.targetElement.removeEventListener('touchstart', this.boundHandleTouchStart!);
      this.targetElement.removeEventListener('touchmove', this.boundHandleTouchMove!);
      this.targetElement.removeEventListener('touchend', this.boundHandleTouchEnd!);
    }

    window.removeEventListener('blur', this.boundHandleWindowBlur!);
  }

  // ============================================
  // Обработчики мыши
  // ============================================

  private handleMouseDown(event: MouseEvent): void {
    if (!this.isEnabled) return;

    const { x, y, worldX, worldY } = this.getCoordinates(event);
    const button = event.button as MouseButton;

    this.mouseState.buttons.add(button);

    // Запоминаем начало драга для ЛЮБОЙ кнопки мыши (важно для камеры)
    this.mouseState.dragStartX = x;
    this.mouseState.dragStartY = y;
    this.mouseState.dragStartWorldX = worldX;
    this.mouseState.dragStartWorldY = worldY;

    // Сбрасываем флаг драга, он установится в mousemove если сдвинем
    this.mouseState.isDragging = false;

    this.publishEvent(InputEventType.MOUSE_DOWN, {
      button,
      x,
      y,
      worldX,
      worldY,
    });
  }

  private handleMouseUp(event: MouseEvent): void {
    if (!this.isEnabled) return;

    const { x, y, worldX, worldY } = this.getCoordinates(event);
    const button = event.button as MouseButton;

    this.mouseState.buttons.delete(button);

    // Проверка на клик (не драг)
    const wasDragging = this.mouseState.isDragging;
    this.mouseState.isDragging = false;

    this.publishEvent(InputEventType.MOUSE_UP, {
      button,
      x,
      y,
      worldX,
      worldY,
    });

    // Если не был драгом — это клик
    if (!wasDragging) {
      this.handleClick(button, x, y, worldX, worldY);
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    if (!this.isEnabled) return;

    const { x, y, worldX, worldY } = this.getCoordinates(event);
    const deltaX = x - this.lastMousePosition.x;
    const deltaY = y - this.lastMousePosition.y;

    this.mouseState.x = x;
    this.mouseState.y = y;
    this.mouseState.worldX = worldX;
    this.mouseState.worldY = worldY;

    // Проверка на драг: если зажата ЛЮБАЯ кнопка и ещё не дражим
    if (this.mouseState.buttons.size > 0 && !this.mouseState.isDragging) {
      const dragDistance = Math.sqrt(
        Math.pow(x - this.mouseState.dragStartX, 2) + Math.pow(y - this.mouseState.dragStartY, 2)
      );

      if (dragDistance > this.config.dragThreshold) {
        this.mouseState.isDragging = true;
      }
    }

    this.lastMousePosition = { x, y };

    this.publishEvent(InputEventType.MOUSE_MOVE, {
      x,
      y,
      worldX,
      worldY,
      deltaX,
      deltaY,
    });
  }

  private handleWheel(event: WheelEvent): void {
    if (!this.isEnabled) return;

    event.preventDefault();

    // Зум колесиком
    if (event.ctrlKey || event.metaKey) {
      const zoomDelta = -event.deltaY * this.config.zoomSensitivity;
      const currentScale = canvasRendererService.getViewport().scale;
      const newScale = Math.max(0.1, Math.min(3, currentScale + zoomDelta));
      canvasRendererService.setCameraScale(newScale);
    }

    this.publishEvent(InputEventType.MOUSE_WHEEL, {
      deltaX: event.deltaX,
      deltaY: event.deltaY,
      deltaZ: event.deltaZ,
    });
  }

  private handleDoubleClick(event: MouseEvent): void {
    if (!this.isEnabled) return;

    const { x, y, worldX, worldY } = this.getCoordinates(event);
    const button = event.button as MouseButton;

    // Отмена ожидающего клика
    const timeout = this.clickTimeouts.get(button);
    if (timeout) {
      clearTimeout(timeout);
      this.clickTimeouts.delete(button);
    }

    this.publishEvent(InputEventType.MOUSE_DOUBLE_CLICK, {
      button,
      x,
      y,
      worldX,
      worldY,
    });
  }

  private handleContextMenu(event: MouseEvent): void {
    if (!this.isEnabled) return;
    event.preventDefault();
  }

  private handleClick(
    button: MouseButton,
    x: number,
    y: number,
    worldX: number,
    worldY: number
  ): void {
    // Отмена предыдущего таймера
    const existingTimeout = this.clickTimeouts.get(button);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.clickTimeouts.delete(button);

      // Это двойной клик (обработан отдельно)
      return;
    }

    // Установка таймера для определения одиночного клика
    const timeout = setTimeout(() => {
      this.publishEvent(InputEventType.MOUSE_CLICK, {
        button,
        x,
        y,
        worldX,
        worldY,
        clickCount: 1,
      });

      this.clickTimeouts.delete(button);
    }, this.config.clickDelay);

    this.clickTimeouts.set(button, timeout);
  }

  // ============================================
  // Обработчики клавиатуры
  // ============================================

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isEnabled || !this.config.enableKeyboard) return;

    this.keyboardState.keys.add(event.key.toLowerCase());
    this.updateModifiers(event);

    this.publishEvent(InputEventType.KEY_DOWN, {
      key: event.key,
      code: event.code,
      repeat: event.repeat,
    });
  }

  private handleKeyUp(event: KeyboardEvent): void {
    if (!this.isEnabled || !this.config.enableKeyboard) return;

    this.keyboardState.keys.delete(event.key.toLowerCase());
    this.updateModifiers(event);

    this.publishEvent(InputEventType.KEY_UP, {
      key: event.key,
      code: event.code,
    });
  }

  private updateModifiers(event: KeyboardEvent | MouseEvent): void {
    this.keyboardState.modifiers = {
      shift: event.shiftKey,
      ctrl: event.ctrlKey,
      alt: event.altKey,
      meta: event.metaKey,
    };
  }

  // ============================================
  // Обработчики тач-событий
  // ============================================

  private handleTouchStart(event: TouchEvent): void {
    if (!this.isEnabled || !this.config.enableTouch) return;
    event.preventDefault();

    const touch = event.touches[0];
    if (!touch) return;

    const rect = this.targetElement?.getBoundingClientRect();
    if (!rect) return;

    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    const worldCoords = canvasRendererService.screenToWorld(x, y);

    this.mouseState.x = x;
    this.mouseState.y = y;
    this.mouseState.worldX = worldCoords.x;
    this.mouseState.worldY = worldCoords.y;
    this.mouseState.dragStartX = x;
    this.mouseState.dragStartY = y;
    this.mouseState.dragStartWorldX = worldCoords.x;
    this.mouseState.dragStartWorldY = worldCoords.y;

    this.publishEvent(InputEventType.TOUCH_START, {
      x,
      y,
      worldX: worldCoords.x,
      worldY: worldCoords.y,
      touchId: touch.identifier,
    });
  }

  private handleTouchMove(event: TouchEvent): void {
    if (!this.isEnabled || !this.config.enableTouch) return;
    event.preventDefault();

    const touch = event.touches[0];
    if (!touch) return;

    const rect = this.targetElement?.getBoundingClientRect();
    if (!rect) return;

    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    const worldCoords = canvasRendererService.screenToWorld(x, y);

    const deltaX = x - this.lastMousePosition.x;
    const deltaY = y - this.lastMousePosition.y;

    this.mouseState.x = x;
    this.mouseState.y = y;
    this.mouseState.worldX = worldCoords.x;
    this.mouseState.worldY = worldCoords.y;
    this.mouseState.isDragging = true;

    this.lastMousePosition = { x, y };

    this.publishEvent(InputEventType.TOUCH_MOVE, {
      x,
      y,
      worldX: worldCoords.x,
      worldY: worldCoords.y,
      touchId: touch.identifier,
      deltaX,
      deltaY,
    });
  }

  private handleTouchEnd(event: TouchEvent): void {
    if (!this.isEnabled || !this.config.enableTouch) return;
    event.preventDefault();

    const touch = event.changedTouches[0];
    if (!touch) return;

    const rect = this.targetElement?.getBoundingClientRect();
    if (!rect) return;

    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    const worldCoords = canvasRendererService.screenToWorld(x, y);

    this.mouseState.isDragging = false;

    this.publishEvent(InputEventType.TOUCH_END, {
      x,
      y,
      worldX: worldCoords.x,
      worldY: worldCoords.y,
      touchId: touch.identifier,
    });
  }

  // ============================================
  // Системные обработчики
  // ============================================

  private handleWindowBlur(): void {
    // Сброс всех зажатых клавиш при потере фокуса
    this.keyboardState.keys.clear();
    this.mouseState.buttons.clear();
    this.mouseState.isDragging = false;

    // НЕ очищаем таймеры кликов — иначе клик не сработает при потере фокуса
    // this.clickTimeouts.forEach((timeout) => clearTimeout(timeout));
    // this.clickTimeouts.clear();
  }

  // ============================================
  // Подписка на события
  // ============================================

  /**
   * Подписка на событие ввода
   */
  public subscribe<T extends InputEventType>(
    eventType: T,
    callback: InputEventHandler<T>
  ): () => void {
    const subscribers = this.subscribers.get(eventType);
    if (!subscribers) {
      console.error('[InputService] Unknown event type:', eventType);
      return () => {};
    }

    subscribers.add(callback as InputEventHandler<InputEventType>);

    return () => {
      subscribers.delete(callback as InputEventHandler<InputEventType>);
    };
  }

  /**
   * Отписка от события
   */
  public unsubscribe<T extends InputEventType>(eventType: T, callback: InputEventHandler<T>): void {
    const subscribers = this.subscribers.get(eventType);
    if (subscribers) {
      subscribers.delete(callback as InputEventHandler<InputEventType>);
    }
  }

  /**
   * Публикация события
   */
  private publishEvent<T extends InputEventType>(type: T, payload: InputEventMap[T]): void {
    const event: InputEvent<InputEventMap[T]> = {
      type,
      payload,
      timestamp: Date.now(),
      modifiers: { ...this.keyboardState.modifiers },
    };

    const subscribers = this.subscribers.get(type);

    if (subscribers && subscribers.size > 0) {
      subscribers.forEach((callback) => {
        try {
          callback(event as InputEvent<InputEventMap[InputEventType]>);
        } catch (error) {
          console.error('[InputService] Subscriber callback error:', type, error);
        }
      });
    }

    // Публикация в глобальный Event Bus для React
    this.publishToGameEventBus(type, payload);
  }

  /**
   * Публикация в глобальный GameEventBus
   */
  private publishToGameEventBus<T extends InputEventType>(
    type: T,
    payload: InputEventMap[T]
  ): void {
    // Маппинг InputEventType на GameEventType
    const eventMap: Partial<Record<InputEventType, GameEventType>> = {
      [InputEventType.MOUSE_CLICK]: GameEventType.UI_NOTIFICATION,
      [InputEventType.MOUSE_DOUBLE_CLICK]: GameEventType.UI_NOTIFICATION,
      [InputEventType.KEY_DOWN]: GameEventType.UI_NOTIFICATION,
    };

    const gameEventType = eventMap[type];
    if (gameEventType) {
      gameEventBusService.publish(gameEventType, {
        message: `Input: ${type}`,
        type: 'info',
      } as never);
    }
  }

  // ============================================
  // Геттеры состояния
  // ============================================

  /**
   * Получение состояния клавиатуры
   */
  public getKeyboardState(): KeyboardState {
    return {
      keys: new Set(this.keyboardState.keys),
      modifiers: { ...this.keyboardState.modifiers },
    };
  }

  /**
   * Получение состояния мыши
   */
  public getMouseState(): MouseState {
    return { ...this.mouseState };
  }

  /**
   * Проверка нажатия клавиши
   */
  public isKeyPressed(key: string): boolean {
    return this.keyboardState.keys.has(key.toLowerCase());
  }

  /**
   * Проверка нажатия кнопки мыши
   */
  public isMouseButtonPressed(button: MouseButton): boolean {
    return this.mouseState.buttons.has(button);
  }

  /**
   * Получение координат с учетом Canvas
   */
  public getCoordinates(event: MouseEvent | Touch): {
    x: number;
    y: number;
    worldX: number;
    worldY: number;
  } {
    const rect = this.targetElement?.getBoundingClientRect();
    if (!rect) {
      return { x: 0, y: 0, worldX: 0, worldY: 0 };
    }

    const clientX = 'clientX' in event ? event.clientX : 0;
    const clientY = 'clientY' in event ? event.clientY : 0;

    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const worldCoords = canvasRendererService.screenToWorld(x, y);

    return { x, y, worldX: worldCoords.x, worldY: worldCoords.y };
  }

  /**
   * Включить/выключить ввод
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log('[InputService] Enabled:', enabled);
  }

  public getIsEnabled(): boolean {
    return this.isEnabled;
  }

  public getIsInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Очистка сервиса
   */
  public cleanup(): void {
    this.detachEventListeners();
    this.subscribers.forEach((subscribers) => subscribers.clear());
    this.subscribers.clear();
    this.clickTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.clickTimeouts.clear();
    this.isInitialized = false;
    console.log('[InputService] Cleaned up');
  }

  /**
   * Получение конфигурации
   */
  public getConfig(): InputServiceConfig {
    return { ...this.config };
  }
}

// Экспорт единственного экземпляра для использования в приложении
export const inputService = new InputService({
  enableLogging: import.meta.env.DEV,
});
