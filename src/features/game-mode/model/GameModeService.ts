/**
 * GameModeService
 *
 * Сервис управления режимами игры:
 * - Viewer (зритель) - только просмотр статистики, без редактирования
 * - Developer (разработчик) - полный доступ к редактору карт
 *
 * Режим определяется по:
 * 1. Переменной окружения VITE_DEVELOPER_MODE
 * 2. LocalStorage (для разблокировки после прохождения)
 * 3. Флагу "все карты пройдены"
 *
 * @module features/game-mode/model
 */

import { playerProgressService } from '@/features/player-progress';
import { presetMaps } from '@/features/map-save/model/preset-maps';

const STORAGE_KEY = 'bus-control-developer-mode';

/**
 * Режимы игры
 */
export enum GameMode {
  /** Режим зрителя - только просмотр статистики */
  VIEWER = 'viewer',
  /** Режим разработчика - полный доступ к редактору */
  DEVELOPER = 'developer',
}

export class GameModeService {
  private mode: GameMode;
  private isInitialized: boolean = false;

  constructor() {
    // По умолчанию viewer режим
    this.mode = GameMode.VIEWER;
  }

  /**
   * Инициализация сервиса
   * Вызывать при старте приложения
   */
  public initialize(): void {
    if (this.isInitialized) {
      return; // Уже инициализировано, не перезаписываем
    }

    // 1. Проверка localStorage (приоритет 1 - выбор пользователя)
    const savedMode = localStorage.getItem(STORAGE_KEY);
    if (savedMode) {
      this.mode = savedMode as GameMode;
      console.log(`[GameModeService] Mode loaded from localStorage: ${this.mode}`);
      this.isInitialized = true;
      return;
    }

    // 2. Проверка переменной окружения (приоритет 2 - только для первой инициализации)
    const envMode = import.meta.env.VITE_DEVELOPER_MODE;
    if (envMode === 'true') {
      this.mode = GameMode.DEVELOPER;
      console.log('[GameModeService] Developer mode enabled via ENV');
      this.isInitialized = true;
      return;
    }

    // 3. Проверка прохождения всех карт (приоритет 3)
    if (this.allMapsCompleted()) {
      this.mode = GameMode.DEVELOPER;
      localStorage.setItem(STORAGE_KEY, GameMode.DEVELOPER);
      console.log('[GameModeService] Developer mode unlocked - all maps completed');
      this.isInitialized = true;
      return;
    }

    // По умолчанию - viewer режим
    this.mode = GameMode.VIEWER;
    console.log('[GameModeService] Viewer mode (default)');
    this.isInitialized = true;
  }

  /**
   * Получить текущий режим
   */
  public getMode(): GameMode {
    return this.mode;
  }

  /**
   * Проверить является ли режим разработчиком
   */
  public isDeveloper(): boolean {
    return this.mode === GameMode.DEVELOPER;
  }

  /**
   * Проверить является ли режим зрителем
   */
  public isViewer(): boolean {
    return this.mode === GameMode.VIEWER;
  }

  /**
   * Установить режим (вручную)
   */
  public setMode(newMode: GameMode): void {
    this.mode = newMode;
    localStorage.setItem(STORAGE_KEY, newMode);
    console.log(`[GameModeService] Mode set to: ${newMode}`);
  }

  /**
   * Включить режим разработчика
   */
  public enableDeveloper(): void {
    this.setMode(GameMode.DEVELOPER);
  }

  /**
   * Выключить режим разработчика (вернуть viewer)
   */
  public disableDeveloper(): void {
    this.setMode(GameMode.VIEWER);
  }

  /**
   * Проверить пройдены ли все карты
   */
  private allMapsCompleted(): boolean {
    const progress = playerProgressService.getProgress();
    const allMapIds = presetMaps.map((map) => map.id);

    // Проверяем что каждая карта есть в completedLevels
    return allMapIds.every((mapId) =>
      progress.completedLevels.some((level) => level.levelId === mapId)
    );
  }

  /**
   * Разблокировать режим разработчика
   * (после прохождения всех карт)
   */
  public unlockDeveloper(): void {
    if (this.allMapsCompleted()) {
      this.enableDeveloper();
      console.log('[GameModeService] Developer mode unlocked!');
    } else {
      console.warn('[GameModeService] Cannot unlock - not all maps completed');
    }
  }

  /**
   * Сбросить режим (для тестов)
   */
  public reset(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.mode = GameMode.VIEWER;
    this.isInitialized = false;
    console.log('[GameModeService] Reset to viewer mode');
  }
}

// Экспорт единственного экземпляра
export const gameModeService = new GameModeService();
