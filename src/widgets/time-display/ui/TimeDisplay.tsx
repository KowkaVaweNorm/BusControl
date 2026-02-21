import { useState, useEffect } from 'react';
import { timeService, TimeEventType } from '@/features/time-of-day';
import { gameEventBusService } from '@/shared/lib/game-core/GameEventBusService';
import cls from './TimeDisplay.module.scss';

export const TimeDisplay = () => {
  const [time, setTime] = useState(timeService.formatTime());
  const [period, setPeriod] = useState(timeService.getPeriodName());
  const [day, setDay] = useState(timeService.getTime().day);

  useEffect(() => {
    // Подписка на событие изменения времени
    const unsubscribeTime = gameEventBusService.subscribe(
      TimeEventType.TIME_CHANGED as any,
      (event: any) => {
        setTime(timeService.formatTime());
        setPeriod(timeService.getPeriodName());
        setDay(event.payload.day);
      }
    );

    // Подписка на событие смены периода
    const unsubscribePeriod = gameEventBusService.subscribe(
      TimeEventType.PERIOD_CHANGED as any,
      () => {
        setPeriod(timeService.getPeriodName());
      }
    );

    // Интервал для синхронизации (на случай если события не сработали)
    const syncInterval = setInterval(() => {
      setTime(timeService.formatTime());
      setPeriod(timeService.getPeriodName());
      setDay(timeService.getTime().day);
    }, 100);

    return () => {
      unsubscribeTime();
      unsubscribePeriod();
      clearInterval(syncInterval);
    };
  }, []);

  return (
    <div className={cls.container}>
      <div className={cls.timeWidget}>
        <span className={cls.time}>{time}</span>
        <span className={cls.period}>{period}</span>
        <span className={cls.day}>День {day}</span>
      </div>
    </div>
  );
};
