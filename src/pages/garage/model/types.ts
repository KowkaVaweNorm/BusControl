/**
 * Типы для страницы гаража (автопарк)
 */

export type ComfortClass = 'A+' | 'A' | 'B' | 'C' | 'D';

export interface BusData {
  id: string;
  name: string;
  icon: string;
  capacity: number; // Вместимость (чел.)
  speed: number; // Скорость (км/ч)
  comfort: ComfortClass; // Класс комфорта
  level: number; // Текущий уровень прокачки
  maxLevel: number; // Максимальный уровень
  upgradeCost: number; // Стоимость прокачки
}

export interface GarageState {
  balance: number;
  buses: BusData[];
}
