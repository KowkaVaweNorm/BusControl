/**
 * Мок-данные для автопарка (заглушки до реализации системы покупки/прокачки)
 * 
 * ПРИМЕЧАНИЕ: Эти данные используются только для демонстрации UI.
 * Реальные данные загружаются из PlayerProgressService.
 */

import type { BusData } from './types';
import {
  BUS_TYPES_CONFIG,
  type BusTypeId,
  getUpgradeForLevel,
  getBaseUpgradeCost,
  getMaxUpgradeLevel,
} from '@/entities/Bus/model/BusTypes';

// Начальный баланс (заглушка, в реальности берётся из PlayerProgressService)
export const INITIAL_BALANCE = 5000;

/**
 * Сгенерировать данные автобуса для отображения в UI гаража
 * 
 * @param busTypeId - ID типа автобуса
 * @param isPurchased - куплен ли автобус
 * @param level - текущий уровень (1-5)
 * @param isActive - находится ли на маршруте
 * @param totalIncome - общий доход
 * @returns Данные для UI
 */
export function generateBusData(
  busTypeId: string,
  isPurchased: boolean = false,
  level: number = 1,
  isActive: boolean = false,
  totalIncome: number = 0
): BusData {
  const config = BUS_TYPES_CONFIG.find((c) => c.id === busTypeId);
  
  if (!config) {
    throw new Error(`Unknown bus type: ${busTypeId}`);
  }

  const nextUpgrade = getUpgradeForLevel(busTypeId as BusTypeId, level + 1);
  const upgradeCost = nextUpgrade ? getBaseUpgradeCost(level + 1) : 0;

  return {
    busTypeId: busTypeId as BusTypeId,
    id: `mock_${busTypeId}`,
    name: config.name,
    icon: config.icon,
    capacity: config.baseCapacity,
    speed: config.baseSpeed,
    comfort: config.comfort,
    level,
    maxLevel: getMaxUpgradeLevel(),
    upgradeCost,
    isPurchased,
    isActive,
    totalIncome,
    basePrice: config.basePrice,
  };
}

/**
 * Мок-данные для демонстрации UI (все автобусы не куплены)
 */
export const MOCK_BUSES: BusData[] = BUS_TYPES_CONFIG.map((config) =>
  generateBusData(config.id, false, 1, false, 0)
);

/**
 * Получить цвет прогресс-бара в зависимости от уровня
 */
export function getProgressBarClass(level: number, maxLevel: number): string {
  const percent = level / maxLevel;
  if (percent <= 0.4) return 'easy';
  if (percent <= 0.8) return 'medium';
  return 'hard';
}

/**
 * Получить описание текущего улучшения
 * 
 * @param busTypeId - ID типа автобуса
 * @param level - текущий уровень
 * @returns Описание улучшения
 */
export function getUpgradeDescription(busTypeId: string, level: number = 1): string {
  const upgrade = getUpgradeForLevel(busTypeId as BusTypeId, level);
  return upgrade?.description ?? 'Неизвестно';
}

/**
 * Получить множитель дохода
 * 
 * @param busTypeId - ID типа автобуса
 * @param level - текущий уровень
 * @returns Множитель дохода (1.0-1.5)
 */
export function getIncomeMultiplier(busTypeId: string, level: number): number {
  const upgrade = getUpgradeForLevel(busTypeId as BusTypeId, level);
  return upgrade?.incomeMultiplier ?? 1.0;
}
