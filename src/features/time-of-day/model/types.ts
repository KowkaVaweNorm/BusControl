/**
 * Типы данных для системы времени суток
 * @module features/time-of-day/model
 */

/**
 * Периоды суток
 */
export enum TimePeriod {
  NIGHT = 'night',     // 22:00 - 06:00
  MORNING = 'morning', // 06:00 - 12:00
  DAY = 'day',         // 12:00 - 18:00
  EVENING = 'evening', // 18:00 - 22:00
}

/**
 * Текущее время суток
 */
export interface TimeOfDay {
  hours: number;   // 0-23
  minutes: number; // 0-59
  day: number;     // Номер дня
}

/**
 * Конфигурация TimeService
 */
export interface TimeServiceConfig {
  /** Скорость течения времени: 1 сек реального = X мин игрового (по умолчанию 1) */
  timeScale: number;
  /** Начальное время (по умолчанию 08:00) */
  startTime: { hours: number; minutes: number };
  /** Включить ли логирование */
  enableLogging: boolean;
}

/**
 * События системы времени
 */
export enum TimeEventType {
  /** Время изменилось (каждую минуту) */
  TIME_CHANGED = 'time:changed',
  /** Период суток изменился */
  PERIOD_CHANGED = 'time:period_changed',
  /** Наступил новый день */
  DAY_CHANGED = 'time:day_changed',
}

/**
 * Данные события времени
 */
export interface TimeChangedEvent {
  hours: number;
  minutes: number;
  day: number;
  period: TimePeriod;
}

/**
 * Данные события смены периода
 */
export interface PeriodChangedEvent {
  oldPeriod: TimePeriod;
  newPeriod: TimePeriod;
  hours: number;
  minutes: number;
}

/**
 * Данные события смены дня
 */
export interface DayChangedEvent {
  oldDay: number;
  newDay: number;
}
