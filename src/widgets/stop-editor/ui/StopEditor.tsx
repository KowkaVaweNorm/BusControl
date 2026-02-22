import { useState, useEffect } from 'react';
import { stopEditorService, StopEditorEventType } from '@/features/stop-editor';
import { gameEventBusService } from '@/shared/lib/game-core/GameEventBusService';
import { TimePeriod } from '@/features/time-of-day';
import type { SpawnRates } from '@/entities/stop/model/StopComponents';
import cls from './StopEditor.module.scss';

const PERIOD_ICONS: Record<TimePeriod, string> = {
  [TimePeriod.MORNING]: '🌅',
  [TimePeriod.DAY]: '☀️',
  [TimePeriod.EVENING]: '🌇',
  [TimePeriod.NIGHT]: '🌙',
};

const PERIOD_NAMES: Record<TimePeriod, string> = {
  [TimePeriod.MORNING]: 'Утро (06-12)',
  [TimePeriod.DAY]: 'День (12-18)',
  [TimePeriod.EVENING]: 'Вечер (18-22)',
  [TimePeriod.NIGHT]: 'Ночь (22-06)',
};

export const StopEditor = () => {
  const [isOpen, setIsOpen] = useState(stopEditorService.getIsOpen());
  const [stopName, setStopName] = useState('');
  const [spawnRates, setSpawnRates] = useState<SpawnRates>({
    [TimePeriod.MORNING]: 20,
    [TimePeriod.DAY]: 20,
    [TimePeriod.EVENING]: 20,
    [TimePeriod.NIGHT]: 20,
  });
  const [waitingPassengers, setWaitingPassengers] = useState(0);

  useEffect(() => {
    // Подписка на открытие редактора
    const unsubscribeOpened = gameEventBusService.subscribe(
      StopEditorEventType.OPENED as any,
      () => {
        setIsOpen(true);
        updateStopData();
      }
    );

    // Подписка на закрытие редактора
    const unsubscribeClosed = gameEventBusService.subscribe(
      StopEditorEventType.CLOSED as any,
      () => {
        setIsOpen(false);
      }
    );

    // Подписка на обновления (если данные изменились извне)
    const unsubscribeUpdated = gameEventBusService.subscribe(
      StopEditorEventType.UPDATED as any,
      () => {
        updateStopData();
      }
    );

    // Таймер для обновления счётчика пассажиров (10 раз в секунду)
    const updateInterval = setInterval(() => {
      // Всегда обновляем, если редактор открыт (проверяем через сервис)
      if (stopEditorService.getIsOpen()) {
        const count = stopEditorService.getWaitingPassengers();
        setWaitingPassengers(count);
      }
    }, 100);

    const updateStopData = () => {
      const data = stopEditorService.getStopData();
      if (data) {
        setStopName(data.name);
        setWaitingPassengers(data.waitingPassengers);
        setSpawnRates({
          [TimePeriod.MORNING]: data.spawnRates?.morning ?? 20,
          [TimePeriod.DAY]: data.spawnRates?.day ?? 20,
          [TimePeriod.EVENING]: data.spawnRates?.evening ?? 20,
          [TimePeriod.NIGHT]: data.spawnRates?.night ?? 20,
        });
      }
    };

    return () => {
      unsubscribeOpened();
      unsubscribeClosed();
      unsubscribeUpdated();
      clearInterval(updateInterval);
    };
  }, []);

  const handleClose = () => {
    stopEditorService.close();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setStopName(newName);
    stopEditorService.updateStopName(newName);
  };

  const handleSave = () => {
    // Данные сохраняются автоматически при изменении через updateStopName и updateSpawnRates
    // Здесь просто закрываем редактор с подтверждением
    stopEditorService.close();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter сохраняет и закрывает
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={cls.container}>
      <div className={cls.panel} onKeyDown={handleKeyDown} tabIndex={-1}>
        <div className={cls.header}>
          <h3 className={cls.title}>
            <span>🚏</span>
            Редактор остановки
          </h3>
          <button className={cls.closeButton} onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className={cls.section}>
          <label className={cls.label}>Название</label>
          <input
            type="text"
            className={cls.nameInput}
            value={stopName}
            onChange={handleNameChange}
            placeholder="Введите название"
          />
        </div>

        <div className={cls.section}>
          <div className={cls.passengerCounter}>
            <span className={cls.passengerIcon}>👥</span>
            <span className={cls.passengerCount}>{waitingPassengers}</span>
            <span className={cls.passengerLabel}>пассажиров ожидает</span>
            <span className={cls.passengerMax}>/ 100</span>
          </div>
        </div>

        <div className={cls.section}>
          <label className={cls.label}>👥 Спавн пассажиров</label>
          <div className={cls.sliderGroup}>
            {/* Используем значения enum, а не ключи */}
            {[TimePeriod.MORNING, TimePeriod.DAY, TimePeriod.EVENING, TimePeriod.NIGHT].map((period) => {
              const rate = spawnRates[period as keyof SpawnRates] ?? 20;
              // Конвертируем интервал (сек) в пассажиров в минуту
              const passengersPerMinute = Math.round(60 / rate);
              return (
                <div key={period} className={cls.sliderItem}>
                  <div className={cls.sliderHeader}>
                    <span className={cls.sliderLabel}>
                      <span className={cls.icon}>{PERIOD_ICONS[period]}</span>
                      {PERIOD_NAMES[period]}
                    </span>
                    <span className={cls.sliderValue}>
                      {passengersPerMinute} пасс/мин
                    </span>
                  </div>
                  <input
                    type="range"
                    className={cls.slider}
                    min="0"
                    max="120"
                    step="1"
                    value={String(passengersPerMinute)}
                    onChange={(e) => {
                      const newPassengersPerMin = parseInt(e.target.value, 10);
                      // Конвертируем обратно в интервал: 60 / passengersPerMinute
                      const newInterval = newPassengersPerMin > 0 ? 60 / newPassengersPerMin : 60;
                      const newRates = { ...spawnRates, [period]: newInterval };
                      setSpawnRates(newRates);
                      stopEditorService.updateSpawnRates(newRates);
                    }}
                  />
                  <div className={cls.sliderSubtext}>
                    Интервал: {rate.toFixed(1)} сек
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={cls.section}>
          <button className={cls.saveButton} onClick={handleSave}>
            💾 Сохранить
          </button>
        </div>
      </div>
    </div>
  );
};
