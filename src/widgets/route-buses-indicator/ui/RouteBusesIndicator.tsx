import { useState, useEffect } from 'react';
import { entityManagerService } from '@/shared/lib/game-core/EntityManagerService';
import { ROUTE_COMPONENTS, type RouteDataComponent } from '@/entities/Route/model/RouteComponents';
import { BUS_COMPONENTS, type BusDataComponent } from '@/entities/Bus/model/BusComponents';
import type { RouteBusInfo } from '../model/types';
import cls from './RouteBusesIndicator.module.scss';

export const RouteBusesIndicator = () => {
  const [routes, setRoutes] = useState<RouteBusInfo[]>([]);

  useEffect(() => {
    // Обновление списка маршрутов
    const updateRoutes = () => {
      const routeEntities = entityManagerService.getEntitiesWithComponents(ROUTE_COMPONENTS.DATA);
      const busEntities = entityManagerService.getEntitiesWithComponents(BUS_COMPONENTS.DATA);

      const routeInfoList: RouteBusInfo[] = [];

      for (const routeEntityId of routeEntities) {
        const routeData = entityManagerService.getComponent<RouteDataComponent>(
          routeEntityId,
          ROUTE_COMPONENTS.DATA
        );

        if (!routeData) continue;

        // Считаем автобусы на этом маршруте
        const busesOnRoute = new Map<string, { count: number; level: number }>();

        for (const busEntityId of busEntities) {
          const busData = entityManagerService.getComponent<BusDataComponent>(
            busEntityId,
            BUS_COMPONENTS.DATA
          );

          if (busData && busData.routeId === routeData.id) {
            const existing = busesOnRoute.get(busData.busTypeId) || { count: 0, level: busData.level };
            existing.count++;
            busesOnRoute.set(busData.busTypeId, existing);
          }
        }

        // Формируем информацию о типах автобусов
        const busTypes: Array<{ typeId: string; typeName: string; count: number; level: number }> = Array.from(busesOnRoute.entries()).map(([typeId, data]) => {
          // Получаем название типа из конфигурации
          const typeName = typeId.toUpperCase(); // Упрощённо, можно улучшить
          return {
            typeId,
            typeName,
            count: data.count,
            level: data.level,
          };
        });

        const totalBuses = busTypes.reduce((sum, t) => sum + t.count, 0);

        routeInfoList.push({
          routeId: routeData.id,
          routeName: routeData.name,
          busCount: totalBuses,
          busTypes,
        });
      }

      setRoutes(routeInfoList);
    };

    // Первоначальное обновление
    updateRoutes();

    // Таймер для периодического обновления (каждую секунду)
    const interval = setInterval(updateRoutes, 1000);

    return () => clearInterval(interval);
  }, []);

  if (routes.length === 0) {
    return null;
  }

  return (
    <div className={cls.container}>
      <div className={cls.header}>
        <span className={cls.icon}>🚌</span>
        <span className={cls.title}>Маршруты</span>
      </div>
      <div className={cls.routesList}>
        {routes.map((route) => (
          <div key={route.routeId} className={cls.routeItem}>
            <div className={cls.routeHeader}>
              <span className={cls.routeName}>{route.routeName}</span>
              <span className={cls.routeBusCount}>{route.busCount}</span>
            </div>
            {route.busTypes.length > 0 && (
              <div className={cls.busTypes}>
                {route.busTypes.map((busType) => (
                  <div key={busType.typeId} className={cls.busTypeItem}>
                    <span className={cls.busTypeIcon}>🚌</span>
                    <span className={cls.busTypeCount}>
                      {busType.count}× {busType.typeName}
                    </span>
                    {busType.level > 1 && (
                      <span className={cls.busTypeLevel}>🔼{busType.level}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
