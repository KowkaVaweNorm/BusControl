/**
 * ResourceLoaderService
 *
 * Управляет загрузкой, кэшированием и доступом к игровым ресурсам
 * (изображения, спрайты, аудио). Реализует паттерн Singleton с ленивой загрузкой.
 *
 * В MVP возвращает цветные заглушки (placeholders), если ассет не найден,
 * но архитектура готова к работе с реальными файлами.
 *
 * @module shared/lib/game-core
 */

import { gameEventBusService, GameEventType } from './GameEventBusService';

// ============================================
// Типы ресурсов
// ============================================

export enum ResourceType {
  IMAGE = 'image',
  SPRITE_SHEET = 'sprite_sheet',
  AUDIO = 'audio',
  JSON = 'json',
  FONT = 'font',
}

export interface ResourceMetadata {
  id: string;
  type: ResourceType;
  src: string;
  status: 'pending' | 'loading' | 'loaded' | 'error';
  loadedAt?: number;
  error?: string;
}

export interface ImageResource extends ResourceMetadata {
  type: ResourceType.IMAGE | ResourceType.SPRITE_SHEET;
  data: HTMLImageElement;
  width: number;
  height: number;
}

export interface AudioResource extends ResourceMetadata {
  type: ResourceType.AUDIO;
  data: HTMLAudioElement;
  duration: number;
}

export interface JsonResource extends ResourceMetadata {
  type: ResourceType.JSON;
  data: Record<string, unknown>;
}

export type GameResource = ImageResource | AudioResource | JsonResource;

export interface ResourceMap {
  [key: string]: GameResource;
}

// ============================================
// Конфигурация загрузки
// ============================================

export interface ResourceLoaderConfig {
  /** Базовый путь к ассетам */
  basePath: string;
  /** Таймаут загрузки (мс) */
  timeout: number;
  /** Количество повторных попыток при ошибке */
  retries: number;
  /** Задержка между попытками (мс) */
  retryDelay: number;
  /** Включить логирование */
  enableLogging: boolean;
  /** Использовать заглушки вместо реальных файлов (для MVP) */
  usePlaceholders: boolean;
}

export interface LoadProgress {
  total: number;
  loaded: number;
  failed: number;
  percent: number;
}

// ============================================
// Сервис загрузки
// ============================================

export class ResourceLoaderService {
  private resources: Map<string, GameResource> = new Map();
  private loadQueue: Map<string, Promise<GameResource>> = new Map();
  private isInitialized: boolean = false;

  private readonly config: ResourceLoaderConfig;

  constructor(config?: Partial<ResourceLoaderConfig>) {
    this.config = {
      basePath: config?.basePath ?? '/assets/',
      timeout: config?.timeout ?? 10000,
      retries: config?.retries ?? 3,
      retryDelay: config?.retryDelay ?? 1000,
      enableLogging: config?.enableLogging ?? false,
      usePlaceholders: config?.usePlaceholders ?? true, // По умолчанию true для MVP
    };
  }

  /**
   * Инициализация сервиса
   */
  public initialize(): void {
    if (this.isInitialized) {
      console.warn('[ResourceLoaderService] Already initialized');
      return;
    }

    this.resources.clear();
    this.loadQueue.clear();
    this.isInitialized = true;

    console.log('[ResourceLoaderService] Initialized', {
      basePath: this.config.basePath,
      usePlaceholders: this.config.usePlaceholders,
    });
  }

  /**
   * Регистрация ресурса в системе (без загрузки)
   */
  public registerResource(id: string, type: ResourceType, src: string): void {
    if (this.resources.has(id)) {
      console.warn('[ResourceLoaderService] Resource already registered:', id);
      return;
    }

    const metadata: ResourceMetadata = {
      id,
      type,
      src,
      status: 'pending',
    };

    // Создаем "пустой" ресурс, который будет заполнен при загрузке
    // Тип приводится позже, здесь используем any для базовой структуры
    this.resources.set(id, metadata as GameResource);
  }

  /**
   * Загрузка одного ресурса
   */
  public async loadResource(id: string): Promise<GameResource> {
    // Проверка кэша
    const cached = this.resources.get(id);
    if (cached && cached.status === 'loaded') {
      if (this.config.enableLogging) {
        console.log('[ResourceLoaderService] Cache hit:', id);
      }
      return cached;
    }

    // Проверка активной загрузки (deduplication)
    const activeLoad = this.loadQueue.get(id);
    if (activeLoad) {
      if (this.config.enableLogging) {
        console.log('[ResourceLoaderService] Waiting for active load:', id);
      }
      return activeLoad;
    }

    const resource = this.resources.get(id);
    if (!resource) {
      const error = `Resource not registered: ${id}`;
      console.error('[ResourceLoaderService]', error);
      throw new Error(error);
    }

    // Начало загрузки
    resource.status = 'loading';
    const loadPromise = this.performLoadWithRetry(id, resource, 0);

    this.loadQueue.set(id, loadPromise);

    try {
      const result = await loadPromise;
      this.loadQueue.delete(id);
      return result;
    } catch (error) {
      this.loadQueue.delete(id);
      resource.status = 'error';
      resource.error = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  /**
   * Реализация загрузки с повторными попытками
   */
  private async performLoadWithRetry(
    id: string,
    resource: ResourceMetadata,
    attempt: number
  ): Promise<GameResource> {
    try {
      let data: unknown;

      if (this.config.usePlaceholders) {
        data = await this.createPlaceholder(resource);
      } else {
        data = await this.fetchRealResource(resource);
      }

      // Обновление ресурса данными
      const loadedResource = {
        ...resource,
        status: 'loaded' as const,
        loadedAt: Date.now(),
        data,
        ...this.getResourceDimensions(data, resource.type),
      } as GameResource;

      this.resources.set(id, loadedResource);

      if (this.config.enableLogging) {
        console.log('[ResourceLoaderService] Loaded:', id);
      }

      // Событие для UI (прогресс бар)
      gameEventBusService.publish(GameEventType.UI_NOTIFICATION, {
        message: `Loaded: ${id}`,
        type: 'info',
      });

      return loadedResource;
    } catch (error) {
      if (attempt < this.config.retries) {
        if (this.config.enableLogging) {
          console.warn(
            `[ResourceLoaderService] Retry ${attempt + 1}/${this.config.retries} for ${id}`
          );
        }
        await this.sleep(this.config.retryDelay * (attempt + 1));
        return this.performLoadWithRetry(id, resource, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Создание заглушки (Placeholder) для MVP
   */
  private createPlaceholder(
    resource: ResourceMetadata
  ): Promise<HTMLImageElement | HTMLAudioElement | Record<string, unknown>> {
    return new Promise((resolve) => {
      if (resource.type === ResourceType.IMAGE || resource.type === ResourceType.SPRITE_SHEET) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          // Генерация цвета на основе ID
          const hash = this.hashString(resource.id);
          const color = `hsl(${hash % 360}, 70%, 50%)`;

          ctx.fillStyle = color;
          ctx.fillRect(0, 0, 64, 64);

          ctx.fillStyle = '#ffffff';
          ctx.font = '12px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(resource.id.substring(0, 3), 32, 32);

          // Рамка
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.strokeRect(0, 0, 64, 64);
        }

        const img = new Image();
        img.src = canvas.toDataURL();
        img.onload = () => resolve(img);
      } else if (resource.type === ResourceType.AUDIO) {
        // Пустой аудио элемент для MVP
        resolve(new Audio());
      } else if (resource.type === ResourceType.JSON) {
        resolve({ placeholder: true, id: resource.id });
      } else {
        resolve({} as Record<string, unknown>);
      }
    });
  }

  /**
   * Загрузка реального ресурса (если usePlaceholders = false)
   */
  private async fetchRealResource(resource: ResourceMetadata): Promise<unknown> {
    const url = `${this.config.basePath}${resource.src}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      if (resource.type === ResourceType.IMAGE || resource.type === ResourceType.SPRITE_SHEET) {
        return await this.loadImage(url, controller.signal);
      } else if (resource.type === ResourceType.AUDIO) {
        return await this.loadAudio(url, controller.signal);
      } else if (resource.type === ResourceType.JSON) {
        return await this.loadJson(url, controller.signal);
      }
      throw new Error(`Unsupported resource type: ${resource.type}`);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private loadImage(src: string, signal: AbortSignal): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
      img.onabort = () => reject(new Error(`Image load aborted: ${src}`));

      if (signal.aborted) {
        reject(new Error('Aborted'));
        return;
      }
      signal.addEventListener('abort', () => {
        reject(new Error('Aborted'));
      });

      img.src = src;
    });
  }

  private loadAudio(src: string, signal: AbortSignal): Promise<HTMLAudioElement> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.oncanplaythrough = () => resolve(audio);
      audio.onerror = () => reject(new Error(`Failed to load audio: ${src}`));

      if (signal.aborted) {
        reject(new Error('Aborted'));
        return;
      }
      signal.addEventListener('abort', () => {
        reject(new Error('Aborted'));
      });

      audio.src = src;
      audio.load();
    });
  }

  private async loadJson(src: string, signal: AbortSignal): Promise<Record<string, unknown>> {
    const response = await fetch(src, { signal });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Массовая загрузка ресурсов
   */
  public async loadAll(resourceIds: string[]): Promise<LoadProgress> {
    const total = resourceIds.length;
    let loaded = 0;
    let failed = 0;

    const promises = resourceIds.map(async (id) => {
      try {
        await this.loadResource(id);
        loaded++;
      } catch (error) {
        failed++;
        console.error(`[ResourceLoaderService] Failed to load ${id}:`, error);
      }

      // Публикация прогресса
      const progress: LoadProgress = {
        total,
        loaded,
        failed,
        percent: Math.round(((loaded + failed) / total) * 100),
      };

      // Можно публиковать событие прогресса, если нужно для UI лоадера
      // gameEventBusService.publish(...)

      return progress;
    });

    await Promise.all(promises);

    const finalProgress: LoadProgress = {
      total,
      loaded,
      failed,
      percent: 100,
    };

    console.log('[ResourceLoaderService] Bulk load complete:', finalProgress);
    return finalProgress;
  }

  /**
   * Получение ресурса (синхронно, должен быть загружен)
   */
  public getResource<T extends GameResource>(id: string): T | null {
    const resource = this.resources.get(id);
    if (!resource) {
      console.warn('[ResourceLoaderService] Resource not found:', id);
      return null;
    }
    if (resource.status !== 'loaded') {
      console.warn('[ResourceLoaderService] Resource not loaded yet:', id);
      return null;
    }
    return resource as T;
  }

  /**
   * Получение изображения для рендеринга
   */
  public getImage(id: string): HTMLImageElement | null {
    const resource = this.getResource<ImageResource>(id);
    return resource?.data as HTMLImageElement | null;
  }

  /**
   * Утилита: хеш строки для генерации цветов
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Утилита: получение размеров
   */
  private getResourceDimensions(
    data: unknown,
    type: ResourceType
  ): Partial<{ width: number; height: number; duration: number }> {
    if (type === ResourceType.IMAGE || type === ResourceType.SPRITE_SHEET) {
      const img = data as HTMLImageElement;
      return { width: img.width, height: img.height };
    }
    if (type === ResourceType.AUDIO) {
      const audio = data as HTMLAudioElement;
      return { duration: audio.duration || 0 };
    }
    return {};
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Очистка кэша
   */
  public clearCache(): void {
    this.resources.forEach((resource) => {
      if (resource.type === ResourceType.IMAGE || resource.type === ResourceType.SPRITE_SHEET) {
        // Очистка src для освобождения памяти
        (resource.data as HTMLImageElement).src = '';
      } else if (resource.type === ResourceType.AUDIO) {
        (resource.data as HTMLAudioElement).src = '';
        (resource.data as HTMLAudioElement).load();
      }
    });
    this.resources.clear();
    this.loadQueue.clear();
    console.log('[ResourceLoaderService] Cache cleared');
  }

  public getIsInitialized(): boolean {
    return this.isInitialized;
  }

  public getLoadingStatus(id: string): 'pending' | 'loading' | 'loaded' | 'error' | 'unknown' {
    const resource = this.resources.get(id);
    return resource ? resource.status : 'unknown';
  }

  public getConfig(): ResourceLoaderConfig {
    return { ...this.config };
  }
}

// Экспорт единственного экземпляра
export const resourceLoaderService = new ResourceLoaderService({
  usePlaceholders: true, // Важно для MVP
  enableLogging: import.meta.env.DEV,
});
