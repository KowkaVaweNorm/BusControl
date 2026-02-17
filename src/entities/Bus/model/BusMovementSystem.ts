/**
 * Система движения автобусов
 * Обновляет позицию и угол поворота на основе вектора движения.
 * @module entities/bus/model
 */

import type { System, SystemContext } from '@/shared/lib/game-core/EntityManagerService';
import { entityManagerService } from '@/shared/lib/game-core/EntityManagerService';
import { BUS_COMPONENTS, BusState, type BusPositionComponent, type BusVelocityComponent, type BusDataComponent } from './BusComponents';
import { ROUTE_COMPONENTS, type RouteDataComponent } from '@/entities/Route/model/RouteComponents';
import { STOP_COMPONENTS, type StopPositionComponent, type StopDataComponent } from '@/entities/stop/model/StopComponents';

export const busMovementSystem: System = {
  name: 'BusMovementSystem',
  requiredComponents: [BUS_COMPONENTS.POSITION, BUS_COMPONENTS.VELOCITY, BUS_COMPONENTS.DATA],

  update: (context: SystemContext, entities: number[]) => {
    const { deltaTime } = context;

    for (const entityId of entities) {
      const pos = entityManagerService.getComponent<BusPositionComponent>(entityId, BUS_COMPONENTS.POSITION);
      const vel = entityManagerService.getComponent<BusVelocityComponent>(entityId, BUS_COMPONENTS.VELOCITY);
      const data = entityManagerService.getComponent<BusDataComponent>(entityId, BUS_COMPONENTS.DATA);

      if (!pos || !vel || !data || data.state !== BusState.MOVING_TO_STOP) {
        continue;
      }

      // 1. Найти целевую остановку
      const targetStopPos = getTargetStopPosition(data.routeId, data.currentStopIndex);

      if (!targetStopPos) {
        // Маршрут сломан или закончился
        data.state = BusState.IDLE;
        vel.isMoving = false;
        vel.speed = 0;
        continue;
      }

      // 2. Вычислить вектор направления
      const dx = targetStopPos.x - pos.x;
      const dy = targetStopPos.y - pos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // 3. Проверка достижения цели (радиус остановки ~40, считаем что доехали если < 5 пикселей)
      if (distance < 5) {
        pos.x = targetStopPos.x;
        pos.y = targetStopPos.y;
        data.state = BusState.STOPPED;
        vel.isMoving = false;
        vel.speed = 0;
        data.waitTimer = data.waitTimeRequired; // Начинаем таймер ожидания
        console.log(`[Bus ${data.id}] Arrived at stop index ${data.currentStopIndex}`);
        continue;
      }

      // 4. Нормализация вектора направления
      const moveX = (dx / distance);
      const moveY = (dy / distance);

      // 5. Расчет расстояния торможения
      // Формула: d = v² / (2 * a), где v - текущая скорость, a - ускорение торможения
      const brakingDistance = (vel.speed * vel.speed) / (2 * vel.acceleration);

      // 6. Логика ускорения / торможения
      // Если до остановки меньше расстояния торможения + небольшой запас (10px) — тормозим
      const brakingStartDistance = brakingDistance + 10;

      if (distance < brakingStartDistance) {
        // Торможение: уменьшаем скорость пропорционально оставшемуся расстоянию
        const targetSpeed = Math.sqrt(2 * vel.acceleration * (distance - 5)); // 5 — минимальное расстояние остановки
        vel.speed = Math.max(0, Math.min(vel.speed, targetSpeed));
        
        // Если скорость почти нулевая — останавливаемся полностью
        if (vel.speed < 5) {
          vel.speed = 0;
        }
      } else {
        // Разгон: увеличиваем скорость до максимума
        if (vel.speed < vel.maxSpeed) {
          vel.speed += vel.acceleration * deltaTime;
          if (vel.speed > vel.maxSpeed) vel.speed = vel.maxSpeed;
        }
      }

      // Обновление позиции
      pos.x += moveX * vel.speed * deltaTime;
      pos.y += moveY * vel.speed * deltaTime;

      // 7. Обновление угла поворота (atan2 возвращает радианы)
      pos.rotation = Math.atan2(dy, dx);
    }
  },
};

// Вспомогательная функция поиска координат цели
function getTargetStopPosition(routeId: string | null, stopIndex: number): { x: number, y: number } | null {
  if (!routeId) return null;

  // Находим сущность маршрута
  const routes = entityManagerService.getEntitiesWithComponents(ROUTE_COMPONENTS.DATA);
  let routeData: RouteDataComponent | null = null;

  for (const id of routes) {
    const r = entityManagerService.getComponent<RouteDataComponent>(id, ROUTE_COMPONENTS.DATA);
    if (r && r.id === routeId) {
      routeData = r;
      break;
    }
  }

  if (!routeData || stopIndex >= routeData.stopIds.length) {
    // Если индекс вышел за пределы, можно зациклить или остановить
    // Для MVP просто вернем null (автобус остановится)
    // В будущем: если loop=true, то индекс = 0
    return null; 
  }

  const targetStopId = routeData.stopIds[stopIndex];

  // Ищем координаты этой остановки
  const stops = entityManagerService.getEntitiesWithComponents(STOP_COMPONENTS.POSITION, STOP_COMPONENTS.DATA);
  for (const id of stops) {
    const sData = entityManagerService.getComponent<StopDataComponent>(id, STOP_COMPONENTS.DATA);
    if (sData && sData.id === targetStopId) {
      return entityManagerService.getComponent<StopPositionComponent>(id, STOP_COMPONENTS.POSITION);
    }
  }

  return null;
}
