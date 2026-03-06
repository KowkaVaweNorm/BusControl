/**
 * Типы для страницы гаража (автопарк)
 */

import type { BusTypeId, ComfortClass } from '@/entities/Bus/model/BusTypes';

export type { ComfortClass } from '@/entities/Bus/model/BusTypes';

/**
 * Данные об улучшении для отображения в UI
 */
export interface UpgradeInfo {
  level: number;
  description: string;
  incomeMultiplier: number;
  cost: number;
  isMaxLevel: boolean;
}

/**
 * Данные автобуса для отображения в гараже
 * 
 * @property busTypeId - ID типа автобуса (liaz, paz, volgabus, kamaz)
 * @property isPurchased - куплен ли автобус игроком
 * @property isActive - находится ли автобус сейчас на маршруте
 * @property totalIncome - общий доход заработанный этим автобусом
 */
export interface BusData {
  busTypeId: BusTypeId;
  id: string; // Уникальный ID экземпляра автобуса
  name: string;
  icon: string;
  capacity: number; // Вместимость (чел.)
  speed: number; // Скорость (пикселей/сек)
  comfort: ComfortClass; // Класс комфорта
  level: number; // Текущий уровень прокачки (1-5)
  maxLevel: number; // Максимальный уровень
  upgradeCost: number; // Стоимость следующей прокачки
  isPurchased: boolean; // Куплен ли автобус
  isActive: boolean; // Находится ли на маршруте
  totalIncome: number; // Общий доход
  basePrice: number; // Базовая стоимость покупки
}

export interface GarageState {
  balance: number;
  buses: BusData[];
}

/**
 * Данные для сохранения автобуса в PlayerProgress
 * 
 * @property busTypeId - ID типа автобуса
 * @property purchasedAt - время покупки (timestamp)
 * @property totalIncome - общий доход этим автобусом
 * @property isActive - находится ли на маршруте
 * 
 * ПРИМЕЧАНИЕ: level больше не хранится в SavedBus!
 * Уровень прокачки хранится глобально в busUpgrades для типа.
 */
export interface SavedBus {
  busTypeId: BusTypeId;
  purchasedAt: number;
  totalIncome: number;
  isActive: boolean;
}
