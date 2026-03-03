/**
 * GameSettingsStore
 *
 * Хранилище настроек игры и прогресса игрока.
 * Сохраняет данные в localStorage.
 *
 * @module app/store
 */

import type { GameSettings, PlayerProgress, BusUpgradeData } from '@/shared/types/game-settings';
import { DEFAULT_SETTINGS, DEFAULT_PROGRESS } from '@/shared/types/game-settings';

const SETTINGS_STORAGE_KEY = 'bus-control-settings-v1';
const PROGRESS_STORAGE_KEY = 'bus-control-progress-v1';

export class GameSettingsStore {
  private settings: GameSettings;
  private progress: PlayerProgress;

  constructor() {
    // Загрузка настроек
    const savedSettings = this.loadSettings();
    this.settings = savedSettings || { ...DEFAULT_SETTINGS };

    // Загрузка прогресса
    const savedProgress = this.loadProgress();
    this.progress = savedProgress || { ...DEFAULT_PROGRESS };
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
  // Прогресс
  // ============================================

  /**
   * Получить текущий прогресс
   */
  public getProgress(): PlayerProgress {
    return { ...this.progress };
  }

  /**
   * Обновить прогресс
   */
  public updateProgress(updates: Partial<PlayerProgress>): void {
    this.progress = {
      ...this.progress,
      ...updates,
    };
    this.saveProgress();
  }

  /**
   * Добавить статистику
   */
  public addStats(
    delta: Partial<Pick<PlayerProgress, 'totalPassengers' | 'totalMoneyEarned' | 'totalComplaints'>>
  ): void {
    this.progress = {
      ...this.progress,
      totalPassengers: this.progress.totalPassengers + (delta.totalPassengers ?? 0),
      totalMoneyEarned: this.progress.totalMoneyEarned + (delta.totalMoneyEarned ?? 0),
      totalComplaints: this.progress.totalComplaints + (delta.totalComplaints ?? 0),
    };
    this.saveProgress();
  }

  /**
   * Разблокировать карту
   */
  public unlockMap(mapId: string): void {
    if (!this.progress.unlockedMaps.includes(mapId)) {
      this.progress.unlockedMaps.push(mapId);
      this.saveProgress();
    }
  }

  /**
   * Проверить разблокировку карты
   */
  public isMapUnlocked(mapId: string): boolean {
    return this.progress.unlockedMaps.includes(mapId);
  }

  /**
   * Разблокировать тип автобуса
   */
  public unlockBusType(busTypeId: string): void {
    if (!this.progress.unlockedBusTypes.includes(busTypeId)) {
      this.progress.unlockedBusTypes.push(busTypeId);
      this.saveProgress();
    }
  }

  /**
   * Проверить разблокировку типа автобуса
   */
  public isBusTypeUnlocked(busTypeId: string): boolean {
    return this.progress.unlockedBusTypes.includes(busTypeId);
  }

  /**
   * Обновить улучшение автобуса
   */
  public updateBusUpgrade(upgrade: BusUpgradeData): void {
    const existingIndex = this.progress.busUpgrades.findIndex(
      (u) => u.busTypeId === upgrade.busTypeId
    );

    if (existingIndex >= 0) {
      this.progress.busUpgrades[existingIndex] = upgrade;
    } else {
      this.progress.busUpgrades.push(upgrade);
    }

    this.saveProgress();
  }

  /**
   * Получить улучшение автобуса
   */
  public getBusUpgrade(busTypeId: string): BusUpgradeData | undefined {
    return this.progress.busUpgrades.find((u) => u.busTypeId === busTypeId);
  }

  /**
   * Сохранить прогресс в localStorage
   */
  private saveProgress(): void {
    try {
      localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(this.progress));
    } catch (e) {
      console.warn('[GameSettingsStore] Failed to save progress:', e);
    }
  }

  /**
   * Загрузить прогресс из localStorage
   */
  private loadProgress(): PlayerProgress | null {
    try {
      const data = localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (data) {
        return JSON.parse(data) as PlayerProgress;
      }
    } catch (e) {
      console.warn('[GameSettingsStore] Failed to load progress:', e);
    }
    return null;
  }

  /**
   * Сбросить прогресс (для новой игры)
   */
  public resetProgress(): void {
    this.progress = { ...DEFAULT_PROGRESS };
    this.saveProgress();
  }
}

// Экспорт единственного экземпляра
export const gameSettingsStore = new GameSettingsStore();
