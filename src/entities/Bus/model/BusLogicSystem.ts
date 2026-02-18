/**
 * Система логики автобусов
 * Управляет состояниями: ожидание -> выбор следующей точки -> старт.
 * @module entities/bus/model
 */

import type { System, SystemContext } from '@/shared/lib/game-core/EntityManagerService';
import { entityManagerService } from '@/shared/lib/game-core/EntityManagerService';
import { BUS_COMPONENTS, BusState, type BusDataComponent, type BusVelocityComponent } from './BusComponents';
import { ROUTE_COMPONENTS, type RouteDataComponent } from '@/entities/Route/model/RouteComponents';

export const busLogicSystem: System = {
  name: 'BusLogicSystem',
  requiredComponents: [BUS_COMPONENTS.DATA, BUS_COMPONENTS.VELOCITY],

  update: (context: SystemContext, entities: number[]) => {
    const { deltaTime } = context;

    for (const entityId of entities) {
      const data = entityManagerService.getComponent<BusDataComponent>(entityId, BUS_COMPONENTS.DATA);
      const vel = entityManagerService.getComponent<BusVelocityComponent>(entityId, BUS_COMPONENTS.VELOCITY);

      if (!data || !vel) continue;

      if (data.state === BusState.STOPPED) {
        // Отсчет таймера
        data.waitTimer -= deltaTime;

        if (data.waitTimer <= 0) {
          // Время вышло, едем дальше
          advanceToNextStop(data, vel);
        }
      } else if (data.state === BusState.IDLE && data.routeId && !isAtFinalStop(data)) {
        // Если назначен маршрут, но стоит (например, только создали) - начинаем движение
        // НЕ начинаем движение если уже на конечной остановке!
        advanceToNextStop(data, vel);
      }
    }
  },
};

/**
 * Проверка, находится ли автобус на конечной остановке маршрута
 */
function isAtFinalStop(data: BusDataComponent): boolean {
  const routes = entityManagerService.getEntitiesWithComponents(ROUTE_COMPONENTS.DATA);
  for (const id of routes) {
    const r = entityManagerService.getComponent<RouteDataComponent>(id, ROUTE_COMPONENTS.DATA);
    if (r && r.id === data.routeId) {
      // Если это последняя остановка и маршрут не зациклен
      return data.currentStopIndex >= r.stopIds.length - 1 && !r.loop;
    }
  }
  return false;
}

function advanceToNextStop(data: BusDataComponent, vel: BusVelocityComponent) {
  if (!data.routeId) {
    data.state = BusState.IDLE;
    return;
  }

  // Найти маршрут
  const routes = entityManagerService.getEntitiesWithComponents(ROUTE_COMPONENTS.DATA);
  let routeLen = 0;
  let isLoop = false;

  for (const id of routes) {
    const r = entityManagerService.getComponent<RouteDataComponent>(id, ROUTE_COMPONENTS.DATA);
    if (r && r.id === data.routeId) {
      routeLen = r.stopIds.length;
      isLoop = r.loop || false;
      break;
    }
  }

  if (routeLen === 0) {
    data.state = BusState.IDLE;
    return;
  }

  // Увеличиваем индекс только если не первая остановка
  // При старте currentStopIndex = 0, едем к первой остановке
  if (data.state === BusState.STOPPED) {
    data.currentStopIndex++;
  }

  if (data.currentStopIndex >= routeLen) {
    if (isLoop) {
      data.currentStopIndex = 0;
    } else {
      // Конец маршрута, стоим
      data.currentStopIndex = routeLen - 1;
      data.state = BusState.IDLE;
      vel.isMoving = false;
      return;
    }
  }

  data.state = BusState.MOVING_TO_STOP;
  vel.isMoving = true;
  vel.speed = 0;
}
