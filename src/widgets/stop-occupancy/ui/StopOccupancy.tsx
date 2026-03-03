import { useEffect, useState } from 'react';
import { gameStateStore } from '@/app/store/GameStateStore';
import cls from './StopOccupancy.module.scss';

export const StopOccupancy = () => {
  const [averageOccupancy, setAverageOccupancy] = useState(0);
  const [overloadedCount, setOverloadedCount] = useState(0);

  useEffect(() => {
    // Берём актуальное состояние при монтировании
    const state = gameStateStore.getState();
    setAverageOccupancy(state.averageStopOccupancy);
    setOverloadedCount(state.overloadedStopsCount);

    // Подписка на изменения стора
    const unsubscribe = gameStateStore.subscribe((newState) => {
      setAverageOccupancy(newState.averageStopOccupancy);
      setOverloadedCount(newState.overloadedStopsCount);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Определение цвета в зависимости от загруженности
  const getOccupancyColor = (): string => {
    if (averageOccupancy < 30) return 'var(--preset-route-green)';
    if (averageOccupancy < 60) return 'var(--preset-route-orange)';
    return 'var(--preset-route-red)';
  };

  const getOccupancyClass = (): string => {
    if (averageOccupancy < 30) return cls.low;
    if (averageOccupancy < 60) return cls.medium;
    return cls.high;
  };

  return (
    <div className={cls.panel}>
      <div className={cls.title}>📊 Загруженность остановок</div>
      <div className={cls.row}>
        <span className={cls.label}>Средняя:</span>
        <span className={`${cls.value} ${getOccupancyClass()}`}>
          {averageOccupancy.toFixed(1)}%
        </span>
      </div>
      <div className={cls.row}>
        <span className={cls.label}>Перегружено:</span>
        <span className={cls.value}>{overloadedCount}</span>
      </div>
      <div className={cls.progressBar}>
        <div
          className={cls.progressFill}
          style={{
            width: `${Math.min(100, averageOccupancy)}%`,
            backgroundColor: getOccupancyColor(),
          }}
        />
      </div>
    </div>
  );
};
