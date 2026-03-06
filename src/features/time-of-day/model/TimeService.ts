/**
 * TimeService
 *
 * Сервис управления игровым временем и временем суток.
 * - Хранит текущее время (часы, минуты, дни)
 * - Управляет скоростью течения времени
 * - Определяет период суток (утро/день/вечер/ночь)
 * - Публикует события смены времени/периода
 *
 * @module features/time-of-day/model
 */

import { gameEventBusService } from '@/shared/lib/game-core/GameEventBusService';
import type {
  TimeOfDay,
  TimeServiceConfig,
  TimeChangedEvent,
  PeriodChangedEvent,
  DayChangedEvent,
} from './types';
import { TimePeriod, TimeEventType } from './types';

// Конфигурация по умолчанию
const DEFAULT_CONFIG: TimeServiceConfig = {
  timeScale: 1, // 1 сек реального = 1 мин игрового
  startTime: { hours: 8, minutes: 0 }, // 08:00 (по умолчанию)
  randomStartTime: false, // Случайное время старта (отключено по умолчанию)
  enableLogging: false,
};

// Границы периодов суток

export class TimeService {
  private config: TimeServiceConfig;
  private currentTime: TimeOfDay;
  private currentPeriod: TimePeriod;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private isRunning: boolean = false;

  constructor(config?: Partial<TimeServiceConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    // Инициализируем время дефолтным (будет перезаписано в initialize)
    this.currentTime = {
      hours: 8,
      minutes: 0,
      day: 1,
    };
    this.currentPeriod = TimePeriod.MORNING;
  }

  /**
   * Инициализация сервиса (запуск времени)
   */
  public initialize(config?: Partial<TimeServiceConfig>): void {
    if (this.isRunning) {
      console.warn('[TimeService] Already running');
      return;
    }

    // Обновляем конфиг если передан
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    // Определяем начальное время (здесь генерируем случайное!)
    let startConfig: { hours: number; minutes: number };
    
    if (this.config.randomStartTime) {
      // Генерируем случайное время от 06:00 до 22:59
      startConfig = this.getRandomStartTime();
    } else {
      // Используем заданное время (по умолчанию 08:00)
      startConfig = this.config.startTime || { hours: 8, minutes: 0 };
    }
    
    // Устанавливаем время
    this.currentTime = {
      hours: startConfig.hours,
      minutes: startConfig.minutes,
      day: 1,
    };
    this.currentPeriod = this.calculatePeriod(this.currentTime.hours);

    this.isRunning = true;
    this.startTimer();
    
    // Логируем один раз при старте (даже если enableLogging = false)
    const randomInfo = this.config.randomStartTime ? ' (random)' : '';
    console.log(`[TimeService] Initialized${randomInfo}: ${this.formatTime()} (${this.getPeriodName()})`);
  }

  /**
   * Сгенерировать случайное время старта (06:00 - 22:59)
   * @returns Объект { hours, minutes }
   */
  private getRandomStartTime(): { hours: number; minutes: number } {
    const hours = Math.floor(Math.random() * 17) + 6; // 6-22 (17 вариантов)
    const minutes = Math.floor(Math.random() * 60);   // 0-59
    return { hours, minutes };
  }

  /**
   * Запустить таймер времени
   */
  private startTimer(): void {
    // Обновляем время каждую секунду реального времени
    this.timerId = setInterval(() => {
      this.tick();
    }, 1000);
  }

  /**
   * Остановить таймер времени
   */
  private stopTimer(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * Тик времени (вызывается каждую секунду)
   */
  private tick(): void {
    const oldPeriod = this.currentPeriod;
    const oldDay = this.currentTime.day;

    // Увеличиваем время на timeScale минут
    this.currentTime.minutes += this.config.timeScale;

    // Обработка перехода минут в часы
    if (this.currentTime.minutes >= 60) {
      const hoursToAdd = Math.floor(this.currentTime.minutes / 60);
      this.currentTime.minutes = this.currentTime.minutes % 60;
      this.currentTime.hours += hoursToAdd;
    }

    // Обработка перехода часов в дни
    if (this.currentTime.hours >= 24) {
      this.currentTime.hours = this.currentTime.hours % 24;
      this.currentTime.day += 1;
    }

    // Пересчёт периода суток
    this.currentPeriod = this.calculatePeriod(this.currentTime.hours);

    // Публикация события изменения времени
    this.publishTimeChanged();

    // Публикация события смены периода
    if (oldPeriod !== this.currentPeriod) {
      this.publishPeriodChanged(oldPeriod);
    }

    // Публикация события смены дня
    if (oldDay !== this.currentTime.day) {
      this.publishDayChanged(oldDay);
    }
  }

  /**
   * Рассчитать период суток по часу
   */
  private calculatePeriod(hours: number): TimePeriod {
    // Ночь: 22:00 - 06:00
    if (hours >= 22 || hours < 6) {
      return TimePeriod.NIGHT;
    }
    // Утро: 06:00 - 12:00
    if (hours >= 6 && hours < 12) {
      return TimePeriod.MORNING;
    }
    // День: 12:00 - 18:00
    if (hours >= 12 && hours < 18) {
      return TimePeriod.DAY;
    }
    // Вечер: 18:00 - 22:00
    return TimePeriod.EVENING;
  }

  /**
   * Публикация события изменения времени
   */
  private publishTimeChanged(): void {
    const event: TimeChangedEvent = {
      hours: this.currentTime.hours,
      minutes: this.currentTime.minutes,
      day: this.currentTime.day,
      period: this.currentPeriod,
    };

    // Используем кастомный тип события для времени
    gameEventBusService.publish(TimeEventType.TIME_CHANGED as any, event);
  }

  /**
   * Публикация события смены периода
   */
  private publishPeriodChanged(oldPeriod: TimePeriod): void {
    const event: PeriodChangedEvent = {
      oldPeriod,
      newPeriod: this.currentPeriod,
      hours: this.currentTime.hours,
      minutes: this.currentTime.minutes,
    };

    gameEventBusService.publish(TimeEventType.PERIOD_CHANGED as any, event);
    this.log(`Period changed: ${oldPeriod} → ${this.currentPeriod}`);
  }

  /**
   * Публикация события смены дня
   */
  private publishDayChanged(oldDay: number): void {
    const event: DayChangedEvent = {
      oldDay,
      newDay: this.currentTime.day,
    };

    gameEventBusService.publish(TimeEventType.DAY_CHANGED as any, event);
    this.log(`Day changed: ${oldDay} → ${this.currentTime.day}`);
  }

  /**
   * Остановить время
   */
  public pause(): void {
    if (!this.isRunning) return;

    this.stopTimer();
    this.isRunning = false;
    this.log('TimeService paused');
  }

  /**
   * Возобновить время
   */
  public resume(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.startTimer();
    this.log('TimeService resumed');
  }

  /**
   * Установить скорость времени
   */
  public setTimeScale(scale: number): void {
    this.config.timeScale = Math.max(0.1, scale);
    this.log(`Time scale set to: ${this.config.timeScale} min/sec`);
  }

  /**
   * Установить конкретное время
   */
  public setTime(hours: number, minutes: number): void {
    this.currentTime.hours = Math.max(0, Math.min(23, hours));
    this.currentTime.minutes = Math.max(0, Math.min(59, minutes));
    this.currentPeriod = this.calculatePeriod(this.currentTime.hours);
    this.log(`Time set manually: ${this.formatTime()}`);
  }

  /**
   * Пропустить время вперёд (для тестов)
   */
  public skipTime(hours: number, minutes: number = 0): void {
    let newMinutes = this.currentTime.minutes + minutes;
    let newHours = this.currentTime.hours + hours;

    if (newMinutes >= 60) {
      newHours += Math.floor(newMinutes / 60);
      newMinutes = newMinutes % 60;
    }

    this.setTime(newHours, newMinutes);
  }

  /**
   * Получить текущее время
   */
  public getTime(): TimeOfDay {
    return { ...this.currentTime };
  }

  /**
   * Получить текущий период суток
   */
  public getPeriod(): TimePeriod {
    return this.currentPeriod;
  }

  /**
   * Получить скорость времени
   */
  public getTimeScale(): number {
    return this.config.timeScale;
  }

  /**
   * Проверка, запущено ли время
   */
  public isTimeRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Форматировать время в строку ЧЧ:ММ
   */
  public formatTime(): string {
    const h = String(this.currentTime.hours).padStart(2, '0');
    const m = String(this.currentTime.minutes).padStart(2, '0');
    return `${h}:${m}`;
  }

  /**
   * Получить название периода суток (для UI)
   */
  public getPeriodName(): string {
    const names: Record<TimePeriod, string> = {
      [TimePeriod.NIGHT]: 'Ночь',
      [TimePeriod.MORNING]: 'Утро',
      [TimePeriod.DAY]: 'День',
      [TimePeriod.EVENING]: 'Вечер',
    };
    return names[this.currentPeriod];
  }

  /**
   * Логирование
   */
  private log(message: string): void {
    if (this.config.enableLogging) {
      console.log(`[TimeService] ${message}`);
    }
  }

  /**
   * Сбросить время к начальному значению
   */
  public reset(): void {
    // Если randomStartTime — генерируем новое случайное, иначе используем startTime
    let startConfig: { hours: number; minutes: number };
    
    if (this.config.randomStartTime) {
      startConfig = this.getRandomStartTime();
      console.log(`[TimeService] Reset to random: ${this.formatTime()} (${this.getPeriodName()})`);
    } else {
      startConfig = this.config.startTime || { hours: 8, minutes: 0 };
      this.log(`Time reset: ${this.formatTime()}`);
    }
    
    this.currentTime = {
      hours: startConfig.hours,
      minutes: startConfig.minutes,
      day: 1,
    };
    this.currentPeriod = this.calculatePeriod(this.currentTime.hours);
  }

  /**
   * Очистка сервиса
   */
  public cleanup(): void {
    this.stopTimer();
    this.isRunning = false;
    this.log('TimeService cleaned up');
  }
}

// Экспорт единственного экземпляра
export const timeService = new TimeService();

// Экспорт TimePeriod для использования в других модулях
export { TimePeriod };
