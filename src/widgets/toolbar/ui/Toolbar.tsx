import { useEffect, useState } from 'react';
import { mapEditorService, EditorMode } from '@/features/map-editor/model/MapEditorService';
import { gameEventBusService, GameEventType } from '@/shared/lib/game-core/GameEventBusService';
import { gameStateStore } from '@/app/store/GameStateStore';
import cls from './Toolbar.module.scss';

// Константа стоимости автобуса
const BUS_COST = 1000;

export const Toolbar = () => {
  const [currentMode, setCurrentMode] = useState<EditorMode>(mapEditorService.getMode());
  const [money, setMoney] = useState(gameStateStore.getState().money);

  useEffect(() => {
    // Подписка на изменения денег для актуализации кнопки покупки
    const unsubMoney = gameStateStore.subscribe((state) => {
      setMoney(state.money);
    });

    // Таймер для обновления состояния режима (если вдруг изменилось извне)
    const interval = setInterval(() => {
      setCurrentMode(mapEditorService.getMode());
    }, 500);

    return () => {
      unsubMoney();
      clearInterval(interval);
    };
  }, []);

  const handleSetMode = (mode: EditorMode) => {
    mapEditorService.setMode(mode);
    setCurrentMode(mode);
  };

  const handleBuyBus = () => {
    if (money < BUS_COST) {
      gameEventBusService.publish(GameEventType.UI_NOTIFICATION, {
        message: 'Недостаточно средств!',
        type: 'warning',
      });
      return;
    }

    // Списываем деньги через стор
    const success = gameStateStore.spendMoney(BUS_COST);
    
    if (success) {
      // Пытаемся создать автобус на первый доступный маршрут
      const busId = mapEditorService.createBusOnFirstRoute();

      if (busId) {
        gameEventBusService.publish(GameEventType.UI_NOTIFICATION, {
          message: 'Автобус куплен и отправлен на линию!',
          type: 'success',
        });
      } else {
        // Если не удалось создать (нет маршрутов), возвращаем деньги
        gameStateStore.addMoney(BUS_COST);
        gameEventBusService.publish(GameEventType.UI_NOTIFICATION, {
          message: 'Нет созданных маршрутов!',
          type: 'warning',
        });
      }
    }
  };

  return (
    <div className={cls.toolbar}>
      <div className={cls.section}>
        <span className={cls.title}>Режимы:</span>
        <button
          className={`${cls.button} ${currentMode === EditorMode.IDLE ? cls.active : ''}`}
          onClick={() => handleSetMode(EditorMode.IDLE)}
        >
          🖱️ Просмотр
        </button>
        <button
          className={`${cls.button} ${currentMode === EditorMode.PLACING_STOP ? cls.active : ''}`}
          onClick={() => handleSetMode(EditorMode.PLACING_STOP)}
        >
          🚏 Остановки
        </button>
        <button
          className={`${cls.button} ${currentMode === EditorMode.DRAWING_ROUTE ? cls.active : ''}`}
          onClick={() => handleSetMode(EditorMode.DRAWING_ROUTE)}
        >
          🛣️ Маршруты
        </button>
      </div>

      <div className={cls.separator}></div>

      <div className={cls.section}>
        <span className={cls.title}>Транспорт:</span>
        <button
          className={`${cls.button} ${cls.buyButton}`}
          onClick={handleBuyBus}
          disabled={money < BUS_COST}
        >
          🚌 Купить ({BUS_COST}₽)
        </button>
      </div>
      
      <div className={cls.hint}>
        💡 ЛКМ по остановке — редактировать | ПКМ по маршруту — создать автобус
      </div>
    </div>
  );
};
