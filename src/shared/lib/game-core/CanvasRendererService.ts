/**
 * CanvasRendererService
 *
 * Управляет Canvas контекстом, слоями отрисовки и базовыми примитивами.
 * Изолирует логику рисования от игровой логики для возможности будущей
 * замены рендерера (например, на WebGL) без изменения кода сущностей.
 *
 * @module shared/lib/game-core
 */

export interface RenderLayer {
  /** Уникальное имя слоя */
  name: string;
  /** Порядок отрисовки (меньше = рисуется раньше) */
  order: number;
  /** Флаг видимости слоя */
  visible: boolean;
  /** Canvas элемент для этого слоя */
  canvas: HTMLCanvasElement;
  /** 2D контекст для этого слоя */
  ctx: CanvasRenderingContext2D;
}

export interface Viewport {
  /** Позиция камеры по X */
  x: number;
  /** Позиция камеры по Y */
  y: number;
  /** Масштаб (zoom) */
  scale: number;
  /** Ширина видимой области */
  width: number;
  /** Высота видимой области */
  height: number;
}

export interface CanvasRendererConfig {
  /** Ширина Canvas */
  width: number;
  /** Высота Canvas */
  height: number;
  /** Список слоев для инициализации */
  layers: string[];
  /** Цвет фона (для clears) */
  backgroundColor: string;
}

export type RenderCallback = (ctx: CanvasRenderingContext2D, viewport: Viewport) => void;

export class CanvasRendererService {
  private container: HTMLElement | null = null;
  private layers: Map<string, RenderLayer> = new Map();
  private renderCallbacks: Map<string, RenderCallback[]> = new Map();
  private viewport: Viewport = {
    x: 0,
    y: 0,
    scale: 1,
    width: 0,
    height: 0,
  };

  private readonly config: CanvasRendererConfig;
  private isInitialized: boolean = false;

  constructor(config?: Partial<CanvasRendererConfig>) {
    this.config = {
      width: config?.width ?? 1920,
      height: config?.height ?? 1080,
      layers: config?.layers ?? ['background', 'roads', 'entities', 'ui'],
      backgroundColor: config?.backgroundColor ?? '#1a1a2e',
    };
  }

  /**
   * Инициализация рендерера (создание Canvas элементов)
   */
  public initialize(containerId: string): void {
    if (this.isInitialized) {
      console.warn('[CanvasRendererService] Already initialized');
      return;
    }

    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error('[CanvasRendererService] Container not found:', containerId);
      return;
    }

    // Очистка контейнера
    this.container.innerHTML = '';
    this.container.style.position = 'relative';
    this.container.style.overflow = 'hidden';

    // Инициализация слоев
    this.config.layers.forEach((layerName) => {
      this.createLayer(layerName);
    });

    // Установка viewport
    this.viewport.width = this.config.width;
    this.viewport.height = this.config.height;

    this.isInitialized = true;
    console.log('[CanvasRendererService] Initialized');
  }

  /**
   * Создание слоя
   */
  private createLayer(name: string): void {
    const canvas = document.createElement('canvas');
    canvas.width = this.config.width;
    canvas.height = this.config.height;
    canvas.style.position = 'absolute';
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.pointerEvents = 'none'; // Слои не перехватывают клики

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('[CanvasRendererService] Failed to get 2D context for layer:', name);
      return;
    }

    const order = this.config.layers.indexOf(name);
    canvas.style.zIndex = order.toString();

    const layer: RenderLayer = {
      name,
      order,
      visible: true,
      canvas,
      ctx,
    };

    this.layers.set(name, layer);
    this.renderCallbacks.set(name, []);
    this.container?.appendChild(canvas);

    console.log('[CanvasRendererService] Layer created:', name);
  }

  /**
   * Подписка на рендер конкретного слоя
   */
  public subscribeToLayer(layerName: string, callback: RenderCallback): void {
    const callbacks = this.renderCallbacks.get(layerName);
    if (callbacks) {
      callbacks.push(callback);
    } else {
      console.error('[CanvasRendererService] Layer not found:', layerName);
    }
  }

  /**
   * Отписка от рендера слоя
   */
  public unsubscribeFromLayer(layerName: string, callback: RenderCallback): void {
    const callbacks = this.renderCallbacks.get(layerName);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Очистка всех слоев
   */
  public clearAll(): void {
    this.layers.forEach((layer) => {
      if (layer.visible) {
        layer.ctx.clearRect(0, 0, this.config.width, this.config.height);

        // Закраска фона для background слоя
        if (layer.name === 'background') {
          layer.ctx.fillStyle = this.config.backgroundColor;
          layer.ctx.fillRect(0, 0, this.config.width, this.config.height);
        }
      }
    });
  }

  /**
   * Рендер всех слоев (вызывается из GameLoop)
   */
  public render(): void {
    if (!this.isInitialized) {
      return;
    }

    // Сортировка слоев по порядку отрисовки
    const sortedLayers = Array.from(this.layers.values()).sort((a, b) => a.order - b.order);

    // Выполнение колбэков рендера для каждого слоя
    sortedLayers.forEach((layer) => {
      if (!layer.visible) {
        return;
      }

      const callbacks = this.renderCallbacks.get(layer.name);
      if (callbacks) {
        // Сохраняем состояние контекста
        layer.ctx.save();

        // Применяем трансформации камеры
        this.applyViewportTransform(layer.ctx);

        // Выполняем колбэки
        callbacks.forEach((callback) => {
          try {
            callback(layer.ctx, this.viewport);
          } catch (error) {
            console.error('[CanvasRendererService] Render callback error:', error);
          }
        });

        // Восстанавливаем состояние контекста
        layer.ctx.restore();
      }
    });
  }

  /**
   * Применение трансформаций камеры к контексту
   */
  private applyViewportTransform(ctx: CanvasRenderingContext2D): void {
    const centerX = this.config.width / 2;
    const centerY = this.config.height / 2;

    ctx.translate(centerX, centerY);
    ctx.scale(this.viewport.scale, this.viewport.scale);
    ctx.translate(-centerX - this.viewport.x, -centerY - this.viewport.y);
  }

  // ============================================
  // Утилиты для рисования примитивов
  // ============================================

  /**
   * Рисование прямоугольника
   */
  public drawRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    options: {
      fillColor?: string;
      strokeColor?: string;
      strokeWidth?: number;
      borderRadius?: number;
    } = {}
  ): void {
    ctx.beginPath();

    if (options.borderRadius && options.borderRadius > 0) {
      // Прямоугольник с закругленными углами
      const r = options.borderRadius;
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + width - r, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + r);
      ctx.lineTo(x + width, y + height - r);
      ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
      ctx.lineTo(x + r, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
    } else {
      // Обычный прямоугольник
      ctx.rect(x, y, width, height);
    }

    if (options.fillColor) {
      ctx.fillStyle = options.fillColor;
      ctx.fill();
    }

    if (options.strokeColor && options.strokeWidth) {
      ctx.strokeStyle = options.strokeColor;
      ctx.lineWidth = options.strokeWidth;
      ctx.stroke();
    }

    ctx.closePath();
  }

  /**
   * Рисование круга
   */
  public drawCircle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    options: {
      fillColor?: string;
      strokeColor?: string;
      strokeWidth?: number;
    } = {}
  ): void {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);

    if (options.fillColor) {
      ctx.fillStyle = options.fillColor;
      ctx.fill();
    }

    if (options.strokeColor && options.strokeWidth) {
      ctx.strokeStyle = options.strokeColor;
      ctx.lineWidth = options.strokeWidth;
      ctx.stroke();
    }

    ctx.closePath();
  }

  /**
   * Рисование линии
   */
  public drawLine(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    options: {
      color?: string;
      width?: number;
      dashed?: boolean;
    } = {}
  ): void {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);

    if (options.dashed) {
      ctx.setLineDash([5, 5]);
    }

    ctx.strokeStyle = options.color ?? '#ffffff';
    ctx.lineWidth = options.width ?? 1;
    ctx.stroke();

    if (options.dashed) {
      ctx.setLineDash([]);
    }

    ctx.closePath();
  }

  /**
   * Рисование текста
   */
  public drawText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    options: {
      color?: string;
      fontSize?: number;
      fontFamily?: string;
      align?: CanvasTextAlign;
      baseline?: CanvasTextBaseline;
    } = {}
  ): void {
    ctx.fillStyle = options.color ?? '#ffffff';
    ctx.font = `${options.fontSize ?? 16}px ${options.fontFamily ?? 'Arial'}`;
    ctx.textAlign = options.align ?? 'left';
    ctx.textBaseline = options.baseline ?? 'top';
    ctx.fillText(text, x, y);
  }

  /**
   * Рисование изображения (спрайта)
   */
  public drawImage(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement | HTMLCanvasElement,
    x: number,
    y: number,
    width?: number,
    height?: number,
    options: {
      rotation?: number;
      opacity?: number;
    } = {}
  ): void {
    ctx.save();

    if (options.opacity !== undefined) {
      ctx.globalAlpha = options.opacity;
    }

    if (options.rotation) {
      ctx.translate(x + width! / 2, y + height! / 2);
      ctx.rotate(options.rotation);
      ctx.translate(-(x + width! / 2), -(y + height! / 2));
    }

    if (width && height) {
      ctx.drawImage(image, x, y, width, height);
    } else {
      ctx.drawImage(image, x, y);
    }

    ctx.restore();
  }

  // ============================================
  // Управление viewport (камерой)
  // ============================================

  /**
   * Установка позиции камеры
   */
  public setCameraPosition(x: number, y: number): void {
    this.viewport.x = x;
    this.viewport.y = y;
  }

  /**
   * Установка масштаба камеры
   */
  public setCameraScale(scale: number): void {
    this.viewport.scale = Math.max(0.1, Math.min(3, scale));
  }

  /**
   * Получение текущего viewport
   */
  public getViewport(): Viewport {
    return { ...this.viewport };
  }

  /**
   * Конвертация экранных координат в мировые
   */
  public screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    const centerX = this.config.width / 2;
    const centerY = this.config.height / 2;

    const worldX = (screenX - centerX) / this.viewport.scale + centerX + this.viewport.x;
    const worldY = (screenY - centerY) / this.viewport.scale + centerY + this.viewport.y;

    return { x: worldX, y: worldY };
  }

  /**
   * Конвертация мировых координат в экранные
   */
  public worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    const centerX = this.config.width / 2;
    const centerY = this.config.height / 2;

    const screenX = (worldX - centerX - this.viewport.x) * this.viewport.scale + centerX;
    const screenY = (worldY - centerY - this.viewport.y) * this.viewport.scale + centerY;

    return { x: screenX, y: screenY };
  }

  // ============================================
  // Управление слоями
  // ============================================

  /**
   * Показать/скрыть слой
   */
  public setLayerVisible(layerName: string, visible: boolean): void {
    const layer = this.layers.get(layerName);
    if (layer) {
      layer.visible = visible;
      layer.canvas.style.display = visible ? 'block' : 'none';
    } else {
      console.error('[CanvasRendererService] Layer not found:', layerName);
    }
  }

  /**
   * Получить контекст слоя (для прямого доступа)
   * Возвращает контекст с уже применённой трансформацией камеры
   * Система рендеринга должна вызвать ctx.restore() после завершения рисования
   */
  public getLayerContext(layerName: string): CanvasRenderingContext2D | null {
    const layer = this.layers.get(layerName);
    if (!layer) return null;
    
    // Применяем трансформацию камеры к контексту слоя
    this.applyLayerTransform(layer.ctx);
    
    return layer.ctx;
  }

  /**
   * Применение трансформаций камеры к контексту слоя
   * Вызывается перед рисованием объектов на слое
   * После рисования необходимо вызвать ctx.restore()
   */
  private applyLayerTransform(ctx: CanvasRenderingContext2D): void {
    const centerX = this.config.width / 2;
    const centerY = this.config.height / 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(this.viewport.scale, this.viewport.scale);
    ctx.translate(-centerX - this.viewport.x, -centerY - this.viewport.y);
  }

  /**
   * Очистить конкретный слой
   */
  public clearLayer(layerName: string): void {
    const layer = this.layers.get(layerName);
    if (layer) {
      layer.ctx.clearRect(0, 0, this.config.width, this.config.height);
    }
  }

  /**
   * Ресайз Canvas (при изменении размера окна)
   */
  public resize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;
    this.viewport.width = width;
    this.viewport.height = height;

    this.layers.forEach((layer) => {
      layer.canvas.width = width;
      layer.canvas.height = height;
    });
  }

  /**
   * Геттеры состояния
   */
  public getIsInitialized(): boolean {
    return this.isInitialized;
  }

  public getConfig(): CanvasRendererConfig {
    return { ...this.config };
  }
}

// Экспорт единственного экземпляра для использования в приложении
// Конфигурация будет установлена при инициализации через метод setConfig
export const canvasRendererService = new CanvasRendererService();

/**
 * Хелпер для настройки рендерера перед инициализацией
 */
export function configureCanvasRenderer(config: Partial<CanvasRendererConfig>): void {
  // Пересоздаем экземпляр с новым конфигом (костыль, но для MVP сойдет)
  // В идеале — добавить метод setConfig в класс
  Object.assign((canvasRendererService as any).config, {
    width: config.width ?? 1920,
    height: config.height ?? 1080,
    layers: config.layers ?? ['background', 'roads', 'entities', 'ui'],
    backgroundColor: config.backgroundColor ?? '#1a1a2e',
  });
}
