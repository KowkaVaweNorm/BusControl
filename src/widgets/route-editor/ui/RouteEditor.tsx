import { useState, useEffect, useCallback } from 'react';
import { routeEditorService, type BusGroup } from '@/features/route-editor';
import { gameEventBusService, GameEventType } from '@/shared/lib/game-core/GameEventBusService';
import { entityManagerService } from '@/shared/lib/game-core/EntityManagerService';
import { BUS_COMPONENTS, type BusDataComponent } from '@/entities/Bus/model/BusComponents';
import cls from './RouteEditor.module.scss';

/**
 * Склонение слов для числительных
 * @param count - количество
 * @param one - форма для 1 (автобус)
 * @param two - форма для 2-4 (автобуса)
 * @param five - форма для 5-20 (автобусов)
 */
function declension(count: number, one: string, two: string, five: string): string {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return five;
  }

  if (lastDigit === 1) {
    return one;
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return two;
  }

  return five;
}

export const RouteEditor = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [routeId, setRouteId] = useState('');
  const [busGroups, setBusGroups] = useState<BusGroup[]>([]);
  const [actualBusesOnRoute, setActualBusesOnRoute] = useState<Map<string, number>>(new Map());

  // Функция подсчёта автобусов на маршруте напрямую из сущностей
  const countBusesOnRoute = useCallback(() => {
    if (!routeId) return;

    const busEntities = entityManagerService.getEntitiesWithComponents(BUS_COMPONENTS.DATA);
    const busesCount = new Map<string, number>();

    for (const entityId of busEntities) {
      const busData = entityManagerService.getComponent<BusDataComponent>(
        entityId,
        BUS_COMPONENTS.DATA
      );

      if (busData && busData.routeId === routeId) {
        const current = busesCount.get(busData.busTypeId) || 0;
        busesCount.set(busData.busTypeId, current + 1);
      }
    }

    setActualBusesOnRoute(busesCount);
  }, [routeId]);

  useEffect(() => {
    // Подписка на открытие редактора маршрута
    const unsubscribeOpened = gameEventBusService.subscribe(
      GameEventType.ROUTE_EDITOR_OPENED,
      () => {
        setIsOpen(true);
        const data = routeEditorService.getRouteData();
        if (data) {
          setRouteName(data.routeName);
          setRouteId(data.routeId);
          setBusGroups(data.busGroups);
          // СРАЗУ считаем автобусы на маршруте (без задержки)
          countBusesOnRoute();
        }
      }
    );

    // Подписка на закрытие редактора маршрута
    const unsubscribeClosed = gameEventBusService.subscribe(
      GameEventType.ROUTE_EDITOR_CLOSED,
      () => {
        setIsOpen(false);
        setRouteId('');
        setActualBusesOnRoute(new Map());
      }
    );

    // Таймер для обновления состояния (проверка открытия/закрытия)
    const interval = setInterval(() => {
      const nowOpen = routeEditorService.getIsOpen();
      if (nowOpen !== isOpen) {
        setIsOpen(nowOpen);
        if (nowOpen) {
          const data = routeEditorService.getRouteData();
          if (data) {
            setRouteName(data.routeName);
            setRouteId(data.routeId);
            setBusGroups(data.busGroups);
            // СРАЗУ считаем автобусы на маршруте (без задержки)
            countBusesOnRoute();
          }
        }
      }
    }, 100); // Увеличили частоту проверки до 100мс

    return () => {
      unsubscribeOpened();
      unsubscribeClosed();
      clearInterval(interval);
    };
  }, [isOpen, countBusesOnRoute]);

  // Обновление счётчика автобусов на маршруте каждые 200мс
  useEffect(() => {
    if (!isOpen || !routeId) return;

    const updateInterval = setInterval(() => {
      countBusesOnRoute();

      // Также обновляем данные из RouteEditorService
      const data = routeEditorService.getRouteData();
      if (data) {
        setBusGroups(data.busGroups);
      }
    }, 200); // Увеличили частоту обновления до 200мс (было 1000мс)

    return () => clearInterval(updateInterval);
  }, [isOpen, routeId, countBusesOnRoute]);

  const handleClose = () => {
    routeEditorService.close();
  };

  const handleAddBus = (typeId: string) => {
    routeEditorService.addBusToRoute(typeId);
    // Обновляем списки
    const data = routeEditorService.getRouteData();
    if (data) {
      setBusGroups(data.busGroups);
    }
  };

  const handleRemoveBus = (typeId: string) => {
    routeEditorService.removeBusFromRoute(typeId);
    // Обновляем списки
    const data = routeEditorService.getRouteData();
    if (data) {
      setBusGroups(data.busGroups);
    }
  };

  if (!isOpen) return null;

  // Считаем общее количество автобусов на маршруте из реальных сущностей
  const totalBuses = Array.from(actualBusesOnRoute.values()).reduce((sum, count) => sum + count, 0);
  const busWord = declension(totalBuses, 'автобус', 'автобуса', 'автобусов');

  return (
    <div className={cls.container}>
      <div className={cls.panel}>
        <div className={cls.header}>
          <h3 className={cls.title}>
            <span>🚌</span>
            Управление маршрутом
          </h3>
          <button className={cls.closeButton} onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className={cls.routeInfo}>
          <div className={cls.routeName}>{routeName}</div>
          <div className={cls.busCount}>
            🚌 {totalBuses} {busWord} на маршруте
          </div>
        </div>

        {/* Список типов автобусов */}
        <div className={cls.section}>
          <div className={cls.sectionTitle}>🚌 Автобусы на маршруте:</div>
          {busGroups.length > 0 ? (
            <div className={cls.busList}>
              {busGroups.map((group) => {
                // Берём реальное количество автобусов этого типа на ЭТОМ маршруте
                const actualCount = actualBusesOnRoute.get(group.typeId) || 0;
                // Доступно = все автобусы типа - занято на всех маршрутах
                const available = group.total - group.onRoute;

                return (
                  <div key={group.typeId} className={cls.busGroupItem}>
                    <div className={cls.busGroupInfo}>
                      <div className={cls.busGroupHeader}>
                        <span className={cls.busName}>{group.typeName}</span>
                      </div>
                      <div className={cls.busGroupStats}>
                        👥 {group.capacity} | ⚡ {group.speed} | 🔼 Lvl {group.level} | 💰 x{group.incomeMultiplier.toFixed(1)}
                      </div>
                      <div className={cls.busGroupAvailability}>
                        <span className={cls.available}>Доступно: {available}</span>
                        <span className={cls.used}>Использовано: {group.onRoute}</span>
                      </div>
                    </div>
                    <div className={cls.busGroupControls}>
                      <button
                        className={`${cls.controlButton} ${cls.removeButton}`}
                        onClick={() => handleRemoveBus(group.typeId)}
                        disabled={actualCount <= 0}
                        title="Убрать 1 автобус"
                      >
                        −
                      </button>
                      <button
                        className={`${cls.controlButton} ${cls.addButton}`}
                        onClick={() => handleAddBus(group.typeId)}
                        disabled={available <= 0}
                        title="Добавить 1 автобус"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={cls.empty}>Нет автобусов в автопарке</div>
          )}
        </div>

        <div className={cls.footer}>
          <div className={cls.footerText}>
            💡 Кнопки +/− добавляют или убирают по одному автобусу
          </div>
          <button className={cls.saveButton} onClick={handleClose}>
            ✕ Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
