/**
 * PlayerProgressService
 *
 * Сервис управления прогрессом прохождения игры.
 * Отвечает за сохранение и загрузку прогресса, синхронизацию с картами,
 * миграцию данных и валидацию.
 *
 * Хранение: localStorage (отдельно от карт)
 * Ключ: 'bus-control-player-progress-v1'
 *
 * @module features/player-progress/model
 */

import {
  CURRENT_SAVE_VERSION,
  DEFAULT_PROGRESS,
  type PlayerProgress,
  type CompletedLevel,
} from '@/shared/types/game-settings';
import { presetMaps } from '@/features/map-save/model/preset-maps';

const PROGRESS_STORAGE_KEY = 'bus-control-player-progress-v1';

// Версии сохранений которые поддерживают миграцию
const SUPPORTED_SAVE_VERSIONS = ['1.0.0', '1.1.0'];

export class PlayerProgressService {
  private progress: PlayerProgress;

  constructor() {
    this.progress = this.loadProgress();
    console.log('[PlayerProgressService] Initialized', {
      balance: this.progress.currentBalance,
      completedLevels: this.progress.completedLevels.length,
      unlockedMaps: this.progress.unlockedMaps,
    });
  }

  // ============================================
  // Основные методы
  // ============================================

  /**
   * Получить текущий прогресс
   */
  public getProgress(): PlayerProgress {
    return { ...this.progress };
  }

  /**
   * Обновить прогресс (для сложных случаев)
   */
  public updateProgress(updates: Partial<PlayerProgress>): void {
    this.progress = {
      ...this.progress,
      ...updates,
    };
    this.saveProgress();
    console.log('[PlayerProgressService] Progress updated');
  }

  /**
   * Получить текущий баланс игрока
   */
  public getBalance(): number {
    return this.progress.currentBalance;
  }

  /**
   * Обновить баланс
   */
  public setBalance(amount: number): void {
    this.progress.currentBalance = amount;
    this.saveProgress();
    console.log(`[PlayerProgressService] Balance updated: ${amount}`);
  }

  /**
   * Изменить баланс (добавить/вычесть)
   */
  public modifyBalance(delta: number): void {
    this.progress.currentBalance += delta;
    this.saveProgress();
    console.log(`[PlayerProgressService] Balance modified: ${delta > 0 ? '+' : ''}${delta}`);
  }

  /**
   * Установить активный уровень
   */
  public setActiveLevel(levelId: string): void {
    // Проверка что уровень существует
    if (!this.levelExists(levelId)) {
      console.error(`[PlayerProgressService] Level "${levelId}" does not exist`);
      return;
    }

    this.progress.lastActiveLevelId = levelId;
    this.saveProgress();
    console.log(`[PlayerProgressService] Active level set: ${levelId}`);
  }

  /**
   * Завершить уровень
   */
  public completeLevel(data: Omit<CompletedLevel, 'completedAt'>): void {
    // Проверка что уровень существует
    if (!this.levelExists(data.levelId)) {
      console.error(`[PlayerProgressService] Cannot complete non-existent level: ${data.levelId}`);
      return;
    }

    const completedLevel: CompletedLevel = {
      ...data,
      completedAt: Date.now(),
    };

    // Добавляем в список завершенных
    this.progress.completedLevels.push(completedLevel);

    // Обновляем последний активный уровень
    this.progress.lastActiveLevelId = data.levelId;

    // Сохраняем баланс с завершения уровня
    this.progress.currentBalance = data.finalBalance;

    // Сохраняем
    this.saveProgress();

    console.log(`[PlayerProgressService] Level completed: ${data.levelId}`, {
      status: data.status,
      balance: data.finalBalance,
      passengers: data.passengersDelivered,
    });
  }

  /**
   * Разблокировать карту
   */
  public unlockMap(mapId: string): void {
    if (!this.levelExists(mapId)) {
      console.warn(`[PlayerProgressService] Cannot unlock non-existent map: ${mapId}`);
      return;
    }

    if (!this.progress.unlockedMaps.includes(mapId)) {
      this.progress.unlockedMaps.push(mapId);
      this.saveProgress();
      console.log(`[PlayerProgressService] Map unlocked: ${mapId}`);
    }
  }

  /**
   * Проверить разблокировку карты
   */
  public isMapUnlocked(mapId: string): boolean {
    return this.progress.unlockedMaps.includes(mapId);
  }

  /**
   * Получить статистику по завершенным уровням
   */
  public getCompletedLevelsStats(): {
    total: number;
    won: number;
    lost: number;
    abandoned: number;
  } {
    const stats = {
      total: this.progress.completedLevels.length,
      won: 0,
      lost: 0,
      abandoned: 0,
    };

    this.progress.completedLevels.forEach((level) => {
      stats[level.status]++;
    });

    return stats;
  }

  /**
   * Получить последнюю сессию на уровне
   */
  public getLastSessionOnLevel(levelId: string): CompletedLevel | undefined {
    return this.progress.completedLevels
      .filter((l) => l.levelId === levelId)
      .sort((a, b) => b.completedAt - a.completedAt)[0];
  }

  /**
   * Сбросить прогресс (новая игра)
   */
  public resetProgress(): void {
    this.progress = {
      ...DEFAULT_PROGRESS,
      saveVersion: CURRENT_SAVE_VERSION,
    };
    this.saveProgress();
    console.log('[PlayerProgressService] Progress reset');
  }

  // ============================================
  // Валидация и синхронизация
  // ============================================

  /**
   * Проверить существует ли уровень/карта
   */
  public levelExists(levelId: string): boolean {
    return presetMaps.some((map) => map.id === levelId);
  }

  /**
   * Получить все доступные ID карт
   */
  public getAllMapIds(): string[] {
    return presetMaps.map((map) => map.id);
  }

  /**
   * Синхронизировать прогресс с доступными картами
   * Удаляет несуществующие карты из unlockedMaps и completedLevels
   */
  public syncWithMaps(): void {
    const validMapIds = this.getAllMapIds();
    let hasChanges = false;

    // Проверка unlockedMaps
    const beforeUnlocked = this.progress.unlockedMaps.length;
    this.progress.unlockedMaps = this.progress.unlockedMaps.filter((id) => validMapIds.includes(id));
    if (this.progress.unlockedMaps.length !== beforeUnlocked) {
      hasChanges = true;
      console.warn(
        `[PlayerProgressService] Removed invalid maps from unlockedMaps: ${beforeUnlocked} -> ${this.progress.unlockedMaps.length}`
      );
    }

    // Проверка lastActiveLevelId
    if (
      this.progress.lastActiveLevelId &&
      !validMapIds.includes(this.progress.lastActiveLevelId)
    ) {
      this.progress.lastActiveLevelId = null;
      hasChanges = true;
      console.warn('[PlayerProgressService] Cleared invalid lastActiveLevelId');
    }

    // Проверка completedLevels
    const beforeCompleted = this.progress.completedLevels.length;
    this.progress.completedLevels = this.progress.completedLevels.filter((level) =>
      validMapIds.includes(level.levelId)
    );
    if (this.progress.completedLevels.length !== beforeCompleted) {
      hasChanges = true;
      console.warn(
        `[PlayerProgressService] Removed invalid levels from completedLevels: ${beforeCompleted} -> ${this.progress.completedLevels.length}`
      );
    }

    if (hasChanges) {
      this.saveProgress();
      console.log('[PlayerProgressService] Progress synced with maps');
    }
  }

  /**
   * Проверить и исправить рассинхронизацию
   * Возвращает отчет о найденных проблемах
   */
  public validateProgress(): {
    isValid: boolean;
    issues: string[];
    fixed: boolean;
  } {
    const issues: string[] = [];
    const validMapIds = this.getAllMapIds();

    // Проверка версии
    if (!SUPPORTED_SAVE_VERSIONS.includes(this.progress.saveVersion)) {
      issues.push(`Unsupported save version: ${this.progress.saveVersion}`);
    }

    // Проверка lastActiveLevelId
    if (
      this.progress.lastActiveLevelId &&
      !validMapIds.includes(this.progress.lastActiveLevelId)
    ) {
      issues.push(`Invalid lastActiveLevelId: ${this.progress.lastActiveLevelId}`);
    }

    // Проверка unlockedMaps
    const invalidUnlocked = this.progress.unlockedMaps.filter(
      (id) => !validMapIds.includes(id)
    );
    if (invalidUnlocked.length > 0) {
      issues.push(`Invalid unlocked maps: ${invalidUnlocked.join(', ')}`);
    }

    // Проверка completedLevels
    const invalidCompleted = this.progress.completedLevels.filter(
      (level) => !validMapIds.includes(level.levelId)
    );
    if (invalidCompleted.length > 0) {
      issues.push(
        `Invalid completed levels: ${invalidCompleted.map((l) => l.levelId).join(', ')}`
      );
    }

    // Проверка баланса (не должен быть отрицательным)
    if (this.progress.currentBalance < -10000) {
      issues.push(`Suspicious balance: ${this.progress.currentBalance}`);
    }

    const isValid = issues.length === 0;

    // Автоматическое исправление
    if (!isValid) {
      this.syncWithMaps();
      console.log('[PlayerProgressService] Auto-fixed validation issues');
    }

    return {
      isValid,
      issues,
      fixed: !isValid,
    };
  }

  // ============================================
  // Миграция данных
  // ============================================

  /**
   * Миграция данных между версиями
   */
  private migrateData(data: Partial<PlayerProgress>): PlayerProgress {
    const version = data.saveVersion || '1.0.0';

    // Миграция с 1.0.0 на 1.1.0
    if (version === '1.0.0') {
      console.log('[PlayerProgressService] Migrating from 1.0.0 to 1.1.0');

      // Добавляем новые поля
      const migrated = {
        ...DEFAULT_PROGRESS,
        ...data,
        saveVersion: CURRENT_SAVE_VERSION,
      };

      return migrated;
    }

    // Если версия актуальная
    if (version === CURRENT_SAVE_VERSION) {
      return {
        ...DEFAULT_PROGRESS,
        ...data,
      };
    }

    // Если версия новее - используем что есть
    console.warn(
      `[PlayerProgressService] Save version ${version} is newer than expected ${CURRENT_SAVE_VERSION}`
    );
    return {
      ...DEFAULT_PROGRESS,
      ...data,
    } as PlayerProgress;
  }

  // ============================================
  // Сохранение и загрузка
  // ============================================

  /**
   * Сохранить прогресс в localStorage
   */
  private saveProgress(): void {
    try {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(this.progress));
    } catch (e) {
      console.error('[PlayerProgressService] Failed to save progress:', e);
    }
  }

  /**
   * Загрузить прогресс из localStorage
   */
  private loadProgress(): PlayerProgress {
    try {
      const data = localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data) as Partial<PlayerProgress>;
        // Миграция данных
        return this.migrateData(parsed);
      }
    } catch (e) {
      console.error('[PlayerProgressService] Failed to load progress:', e);
    }

    // Возвращаем прогресс по умолчанию
    return {
      ...DEFAULT_PROGRESS,
      saveVersion: CURRENT_SAVE_VERSION,
    };
  }

  /**
   * Экспорт прогресса в JSON (для бэкапа)
   */
  public exportProgress(): string {
    return JSON.stringify(this.progress, null, 2);
  }

  /**
   * Импорт прогресса из JSON (восстановление)
   */
  public importProgress(json: string): { success: boolean; error?: string } {
    try {
      const data = JSON.parse(json) as Partial<PlayerProgress>;

      // Валидация обязательных полей
      if (!data.currentBalance || !data.saveVersion) {
        return { success: false, error: 'Invalid data format' };
      }

      // Миграция
      this.progress = this.migrateData(data);
      this.saveProgress();

      // Валидация после импорта
      const validation = this.validateProgress();
      if (!validation.isValid) {
        console.warn('[PlayerProgressService] Imported data has issues:', validation.issues);
      }

      console.log('[PlayerProgressService] Progress imported successfully');
      return { success: true };
    } catch (e) {
      console.error('[PlayerProgressService] Failed to import progress:', e);
      return { success: false, error: (e as Error).message };
    }
  }
}

// Экспорт единственного экземпляра
export const playerProgressService = new PlayerProgressService();
