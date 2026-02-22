import { useEffect, useState } from 'react';
import { gameStateStore, type GameState } from '@/app/store/GameStateStore';
import cls from './StatsPanel.module.scss';

export const StatsPanel = () => {
  const [state, setState] = useState<GameState>(gameStateStore.getState());

  useEffect(() => {
    // Берём актуальное состояние при монтировании
    setState(gameStateStore.getState());
    
    // Подписка на изменения стора
    const unsubscribe = gameStateStore.subscribe((newState) => {
      setState(newState);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className={cls.panel}>
      <div className={cls.row}>
        <span className={cls.label}>💰 Баланс:</span>
        <span className={cls.valueMoney}>{state.money}₽</span>
      </div>
      
      <div className={cls.row}>
        <span className={cls.label}>👥 Перевезено:</span>
        <span className={cls.value}>{state.totalPassengersDelivered}</span>
      </div>

      <div className={cls.row}>
        <span className={cls.label}>🚌 Автобусов:</span>
        <span className={cls.value}>{state.activeBuses}</span>
      </div>

      <div className={cls.row}>
        <span className={cls.label}>🚏 Остановок:</span>
        <span className={cls.value}>{state.totalStops}</span>
      </div>

      {state.message && (
        <div className={cls.notification}>
          {state.message}
        </div>
      )}
    </div>
  );
};
