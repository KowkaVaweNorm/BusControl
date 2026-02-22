/**
 * Компоненты для сущности Stop (Остановка)
 * @module entities/stop/model
 */

import type { Component } from '../../../shared/lib/game-core/EntityManagerService';
import { TimePeriod } from '@/features/time-of-day';

/**
 * Позиция остановки в мире
 */
export interface StopPositionComponent extends Component {
  x: number;
  y: number;
}

/**
 * Настройки спавна пассажиров для периода суток
 */
export interface SpawnRates {
  [TimePeriod.MORNING]: number;   // интервал в секундах
  [TimePeriod.DAY]: number;
  [TimePeriod.EVENING]: number;
  [TimePeriod.NIGHT]: number;
}

/**
 * Данные остановки
 */
export interface StopDataComponent extends Component {
  id: string;
  name: string;
  radius: number; // Радиус зоны остановки (для попадания автобуса)
  color: string; // Цвет отрисовки
  waitingPassengers: number; // Счетчик ожидающих (пока просто число)
  spawnRates: SpawnRates; // Настройки спавна по периодам суток
}

/**
 * Значения спавна по умолчанию
 * ~3 пассажира в минуту = интервал 20 секунд
 */
export const DEFAULT_SPAWN_RATES: SpawnRates = {
  [TimePeriod.MORNING]: 20.0,   // Утро: 3 пасс/мин
  [TimePeriod.DAY]: 20.0,       // День: 3 пасс/мин
  [TimePeriod.EVENING]: 20.0,   // Вечер: 3 пасс/мин
  [TimePeriod.NIGHT]: 20.0,     // Ночь: 3 пасс/мин
};

/**
 * Типы компонентов для удобного импорта в других местах
 */
export const STOP_COMPONENTS = {
  POSITION: 'stop_position',
  DATA: 'stop_data',
} as const;
