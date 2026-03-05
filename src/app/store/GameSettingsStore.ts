/**
 * GameSettingsStore
 *
 * Хранилище настроек игры и прогресса игрока.
 * Сохраняет данные в localStorage.
 *
 * @module app/store
 */

import type { GameSettings, PlayerProgress, BusUpgradeData } from '@/shared/types/game-settings';
import { DEFAULT_SETTINGS, DEFAULT_PROGRESS, CURRENT_SAVE_VERSION } from '@/shared/types/game-settings';
import { playerProgressService } from '@/features/player-progress';

const SETTINGS_STORAGE_KEY = 'bus-control-settings-v1';
const PROGRESS_STORAGE_KEY = 'bus-control-progress-v1';

export class GameSettingsStore {
  private settings: GameSettings;

  constructor() {
    // Загрузка настроек
    const savedSettings = this.loadSettings();
    this.settings = savedSettings || { ...DEFAULT_SETTINGS };

    // Синхронизация с playerProgressService при инициализации
    this.syncWithProgressService();
  }

  /**
   * Синхронизация с playerProgressService
   * (для обратной совместимости со старыми сохранениями)
   */
  private syncWithProgressService(): void {
    try {
      // Проверяем есть ли данные в старом хранилище
      const oldProgressData = localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (oldProgressData) {
        const oldProgress = JSON.parse(oldProgressData) as Partial<PlayerProgress>;

        // Если в старом хранилище версия меньше или отсутствует - мигрируем
        if (!oldProgress.saveVersion || oldProgress.saveVersion < CURRENT_SAVE_VERSION) {
          console.log('[GameSettingsStore] Migrating old progress data to PlayerProgressService');

          // Импортируем в новый сервис
          const importResult = playerProgressService.importProgress(oldProgressData);
          if (importResult.success) {
            // Очищаем старое хранилище
            localStorage.removeItem(PROGRESS_STORAGE_KEY);
            console.log('[GameSettingsStore] Old progress data migrated successfully');
          }
        }
      }

      // Валидация прогресса
      const validation = playerProgressService.validateProgress();
      if (!validation.isValid) {
        console.warn('[GameSettingsStore] Progress validation issues:', validation.issues);
      }
    } catch (e) {
      console.error('[GameSettingsStore] Sync with progress service failed:', e);
    }
  }

  // ============================================
  // Настройки
  // ============================================

  /**
   * Получить текущие настройки
   */
  public getSettings(): GameSettings {
    return { ...this.settings };
  }

  /**
   * Обновить настройки
   */
  public updateSettings(updates: Partial<GameSettings>): void {
    this.settings = {
      ...this.settings,
      ...updates,
    };
    this.saveSettings();
  }

  /**
   * Сохранить настройки в localStorage
   */
  private saveSettings(): void {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
    } catch (e) {
      console.warn('[GameSettingsStore] Failed to save settings:', e);
    }
  }

  /**
   * Загрузить настройки из localStorage
   */
  private loadSettings(): GameSettings | null {
    try {
      const data = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (data) {
        return JSON.parse(data) as GameSettings;
      }
    } catch (e) {
      console.warn('[GameSettingsStore] Failed to load settings:', e);
    }
    return null;
  }

  // ============================================
  // Прогресс (делегирование в playerProgressService)
  // ============================================

  /**
   * Получить текущий прогресс
   */
  public getProgress(): PlayerProgress {
    return playerProgressService.getProgress();
  }

  /**
   * Получить текущий баланс
   */
  public getBalance(): number {
    return playerProgressService.getBalance();
  }

  /**
   * Установить баланс
   */
  public setBalance(amount: number): void {
    playerProgressService.setBalance(amount);
  }

  /**
   * Изменить баланс
   */
  public modifyBalance(delta: number): void {
    playerProgressService.modifyBalance(delta);
  }

  /**
   * Обновить прогресс (объединение с текущим)
   */
  public updateProgress(updates: Partial<PlayerProgress>): void {
    const current = playerProgressService.getProgress();
    const updated = { ...current, ...updates };

    // Применяем каждое поле отдельно через соответствующие методы
    if (updates.currentBalance !== undefined) {
      playerProgressService.setBalance(updates.currentBalance);
    }
    if (updates.lastActiveLevelId !== undefined) {
      playerProgressService.setActiveLevel(updates.lastActiveLevelId);
    }
    // Остальные поля можно добавить по мере необходимости
  }

  /**
   * Добавить статистику
   */
  public addStats(
    delta: Partial<Pick<PlayerProgress, 'totalPassengers' | 'totalMoneyEarned' | 'totalComplaints'>>
  ): void {
    const current = playerProgressService.getProgress();
    playerProgressService.updateProgress({
      totalPassengers: current.totalPassengers + (delta.totalPassengers ?? 0),
      totalMoneyEarned: current.totalMoneyEarned + (delta.totalMoneyEarned ?? 0),
      totalComplaints: current.totalComplaints + (delta.totalComplaints ?? 0),
    });
  }

  /**
   * Разблокировать карту
   */
  public unlockMap(mapId: string): void {
    playerProgressService.unlockMap(mapId);
  }

  /**
   * Проверить разблокировку карты
   */
  public isMapUnlocked(mapId: string): boolean {
    return playerProgressService.isMapUnlocked(mapId);
  }

  /**
   * Разблокировать тип автобуса
   */
  public unlockBusType(busTypeId: string): void {
    const current = playerProgressService.getProgress();
    if (!current.unlockedBusTypes.includes(busTypeId)) {
      current.unlockedBusTypes.push(busTypeId);
      // Пока сохраняем напрямую, т.к. в сервисе нет такого метода
      this.saveProgressDirectly(current);
    }
  }

  /**
   * Проверить разблокировку типа автобуса
   */
  public isBusTypeUnlocked(busTypeId: string): boolean {
    return playerProgressService.getProgress().unlockedBusTypes.includes(busTypeId);
  }

  /**
   * Обновить улучшение автобуса
   */
  public updateBusUpgrade(upgrade: BusUpgradeData): void {
    const current = playerProgressService.getProgress();
    const existingIndex = current.busUpgrades.findIndex(
      (u) => u.busTypeId === upgrade.busTypeId
    );

    if (existingIndex >= 0) {
      current.busUpgrades[existingIndex] = upgrade;
    } else {
      current.busUpgrades.push(upgrade);
    }

    this.saveProgressDirectly(current);
  }

  /**
   * Получить улучшение автобуса
   */
  public getBusUpgrade(busTypeId: string): BusUpgradeData | undefined {
    return playerProgressService.getProgress().busUpgrades.find(
      (u) => u.busTypeId === busTypeId
    );
  }

  /**
   * Прямое сохранение прогресса (для сложных случаев)
   */
  private saveProgressDirectly(progress: PlayerProgress): void {
    try {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      console.warn('[GameSettingsStore] Failed to save progress:', e);
    }
  }

  /**
   * Сбросить прогресс (для новой игры)
   */
  public resetProgress(): void {
    playerProgressService.resetProgress();
  }

  /**
   * Завершить уровень (для Game Over)
   */
  public completeLevel(data: {
    levelId: string;
    finalBalance: number;
    passengersDelivered: number;
    complaints: number;
    duration: number;
    reason?: string;
    status: 'won' | 'lost' | 'abandoned';
  }): void {
    playerProgressService.completeLevel(data);
  }

  /**
   * Получить статистику завершенных уровней
   */
  public getCompletedLevelsStats(): {
    total: number;
    won: number;
    lost: number;
    abandoned: number;
  } {
    return playerProgressService.getCompletedLevelsStats();
  }

  /**
   * Установить активный уровень
   */
  public setActiveLevel(levelId: string): void {
    playerProgressService.setActiveLevel(levelId);
  }

  /**
   * Получить последний активный уровень
   */
  public getLastActiveLevel(): string | null {
    return playerProgressService.getProgress().lastActiveLevelId;
  }
}

// Экспорт единственного экземпляра
export const gameSettingsStore = new GameSettingsStore();
