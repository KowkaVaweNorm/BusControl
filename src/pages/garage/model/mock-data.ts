/**
 * Мок-данные для автопарка (заглушки до реализации системы покупки/прокачки)
 */

import type { BusData } from './types';

export const MOCK_BUSES: BusData[] = [
  {
    id: 'liaz',
    name: 'ЛиАЗ-5292',
    icon: '🚌',
    capacity: 110,
    speed: 75,
    comfort: 'B',
    level: 3,
    maxLevel: 5,
    upgradeCost: 1000,
  },
  {
    id: 'paz',
    name: 'ПАЗ Vector',
    icon: '🚐',
    capacity: 68,
    speed: 85,
    comfort: 'C',
    level: 2,
    maxLevel: 5,
    upgradeCost: 1000,
  },
  {
    id: 'volgabus',
    name: 'Volgabus-5270',
    icon: '🚍',
    capacity: 95,
    speed: 80,
    comfort: 'A',
    level: 4,
    maxLevel: 5,
    upgradeCost: 1000,
  },
  {
    id: 'kamaz',
    name: 'КАМАЗ-6282',
    icon: '⚡🚌',
    capacity: 85,
    speed: 90,
    comfort: 'A+',
    level: 5,
    maxLevel: 5,
    upgradeCost: 1000,
  },
];

// Начальный баланс (заглушка)
export const INITIAL_BALANCE = 5000;

/**
 * Получить цвет прогресс-бара в зависимости от уровня
 */
export function getProgressBarClass(level: number, maxLevel: number): string {
  const percent = level / maxLevel;
  if (percent <= 0.4) return 'easy';
  if (percent <= 0.8) return 'medium';
  return 'hard';
}
