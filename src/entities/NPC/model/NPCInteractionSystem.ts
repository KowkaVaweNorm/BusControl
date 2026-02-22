/**
 * Система взаимодействия автобусов и пассажиров
 * Логика посадки и высадки.
 * @module entities/npc/model
 */

import type { System, SystemContext } from '@/shared/lib/game-core/EntityManagerService';
import { entityManagerService } from '@/shared/lib/game-core/EntityManagerService';
import { BUS_COMPONENTS, BusState, type BusDataComponent, type BusPositionComponent } from '@/entities/Bus/model/BusComponents';
import { NPC_COMPONENTS, NPCState, type NPCDataComponent, type NPCPositionComponent } from './NPCComponents';
import { STOP_COMPONENTS, type StopDataComponent } from '@/entities/stop/model/StopComponents';
import { ROUTE_COMPONENTS, type RouteDataComponent } from '@/entities/Route/model/RouteComponents';
import { gameEventBusService, GameEventType } from '@/shared/lib/game-core/GameEventBusService';

export const npcInteractionSystem: System = {
  name: 'NPCInteractionSystem',
  requiredComponents: [BUS_COMPONENTS.DATA],

  update: (_context: SystemContext, entities: number[]) => {
    for (const busEntityId of entities) {
      const busData = entityManagerService.getComponent<BusDataComponent>(busEntityId, BUS_COMPONENTS.DATA);

      if (!busData || busData.state !== BusState.STOPPED) {
        continue;
      }

      // Нам нужно знать ID текущей остановки, где стоит автобус
      const currentStopId = getCurrentStopId(busData);
      if (!currentStopId) continue;

      // 1. ВЫСАДКА (Alighting) - пассажиры выходят на своей остановке
      unloadPassengers(busEntityId, busData, currentStopId);

      // 2. ПОСАДКА (Boarding) - сажаем пассажиров на всех остановках кроме конечной
      const isFinalStop = isFinalStopForRoute(busData);
      if (!isFinalStop) {
        loadPassengers(busEntityId, busData, currentStopId);
      }
    }
  },
};

/**
 * Получить ID текущей остановки автобуса
 */
function getCurrentStopId(busData: BusDataComponent): string | null {
  if (!busData.routeId) return null;

  const routes = entityManagerService.getEntitiesWithComponents(ROUTE_COMPONENTS.DATA);
  for (const rId of routes) {
    const rComp = entityManagerService.getComponent<RouteDataComponent>(rId, ROUTE_COMPONENTS.DATA);
    if (rComp && rComp.id === busData.routeId) {
      if (busData.currentStopIndex < rComp.stopIds.length) {
        return rComp.stopIds[busData.currentStopIndex];
      }
    }
  }
  return null;
}

/**
 * Проверить, является ли текущая остановка конечной для маршрута
 */
function isFinalStopForRoute(busData: BusDataComponent): boolean {
  if (!busData.routeId) return false;

  const routes = entityManagerService.getEntitiesWithComponents(ROUTE_COMPONENTS.DATA);
  for (const rId of routes) {
    const rComp = entityManagerService.getComponent<RouteDataComponent>(rId, ROUTE_COMPONENTS.DATA);
    if (rComp && rComp.id === busData.routeId) {
      // Если это последняя остановка в маршруте и маршрут не зациклен
      return busData.currentStopIndex >= rComp.stopIds.length - 1 && !rComp.loop;
    }
  }
  return false;
}

/**
 * Высадка пассажиров, достигших цели
 */
function unloadPassengers(busEntityId: number, busData: BusDataComponent, stopId: string): void {
  const allNpcs = entityManagerService.getEntitiesWithComponents(NPC_COMPONENTS.DATA, NPC_COMPONENTS.POSITION);
  let unloadedCount = 0;

  // Проверяем, является ли эта остановка конечной для маршрута
  const isFinalStop = isFinalStopForRoute(busData);

  for (const npcId of allNpcs) {
    const npcData = entityManagerService.getComponent<NPCDataComponent>(npcId, NPC_COMPONENTS.DATA);
    const npcPos = entityManagerService.getComponent<NPCPositionComponent>(npcId, NPC_COMPONENTS.POSITION);

    if (!npcData || !npcPos) continue;

    // Если пассажир в этом автобусе
    if (npcData.state === NPCState.ON_BUS && npcData.busEntityId === busEntityId) {
      // На конечной остановке высаживаем ВСЕХ, иначе только тех, у кого цель - эта остановка
      if (isFinalStop || npcPos.targetStopId === stopId) {
        // Высаживаем
        npcData.state = NPCState.ARRIVED;
        npcData.busEntityId = null;
        npcData.currentStopId = null; // Важно: не присваиваем stopId, чтобы не считался ожидающим
        unloadedCount++;

        // Уменьшаем счётчик пассажиров в автобусе на 1
        busData.passengers = Math.max(0, busData.passengers - 1);

        // ЭКОНОМИКА: Начисляем деньги! (5₽ бонус за доставку)
        const reward = 5;
        gameEventBusService.publish(GameEventType.MONEY_CHANGED, {
          amount: reward,
          total: 0, // Total вычислит стор
          source: 'passenger_delivery',
        });
        gameEventBusService.publish(GameEventType.NPC_ARRIVED_AT_DESTINATION, {
          npcId: npcData.id,
          stopId: stopId,
        });

        // Визуально: телепортируем чуть в сторону от остановки
        npcPos.x += 10;

        // Удаляем сущность через 500мс (чтобы игрок увидел момент высадки)
        setTimeout(() => {
          if (entityManagerService.hasEntity(npcId)) {
            entityManagerService.destroyEntity(npcId);
          }
        }, 500);
      }
    }
  }

  if (unloadedCount > 0) {
    console.log(`[Bus ${busData.id}] Unloaded ${unloadedCount} passengers at stop ${stopId}`);
  }
}

/**
 * Посадка пассажиров в автобус
 */
function loadPassengers(busEntityId: number, busData: BusDataComponent, stopId: string): void {
  if (busData.passengers >= busData.capacity) {
    return; // Автобус полон
  }

  const allNpcs = entityManagerService.getEntitiesWithComponents(NPC_COMPONENTS.DATA, NPC_COMPONENTS.POSITION);
  let boardedCount = 0;

  for (const npcId of allNpcs) {
    if (busData.passengers >= busData.capacity) break;

    const npcData = entityManagerService.getComponent<NPCDataComponent>(npcId, NPC_COMPONENTS.DATA);
    const npcPos = entityManagerService.getComponent<NPCPositionComponent>(npcId, NPC_COMPONENTS.POSITION);

    if (!npcData || !npcPos) continue;

    // Если пассажир ждет на этой остановке
    if (npcData.state === NPCState.WAITING && npcData.currentStopId === stopId) {

      // Сажаем
      npcData.state = NPCState.ON_BUS;
      npcData.busEntityId = busEntityId;

      // Обновляем данные автобуса
      busData.passengers++;
      boardedCount++;

      // Обновляем данные остановки (уменьшаем очередь)
      updateStopQueue(stopId, -1);

      // Визуально: телепортируем в центр автобуса
      const busPos = entityManagerService.getComponent<BusPositionComponent>(busEntityId, BUS_COMPONENTS.POSITION);
      if (busPos) {
        npcPos.x = busPos.x;
        npcPos.y = busPos.y;
      }

      // ОПЛАТА ПРИ ПОСАДКЕ: 35₽ за поездку
      const fare = 35;
      gameEventBusService.publish(GameEventType.MONEY_CHANGED, {
        amount: fare,
        total: 0,
        source: 'passenger_fare',
      });
      gameEventBusService.publish(GameEventType.NPC_BOARDED_BUS, {
        npcId: npcData.id,
        busId: busData.id,
        stopId: stopId,
      });
    }
  }

  if (boardedCount > 0) {
    console.log(`[Bus ${busData.id}] Boarded ${boardedCount} passengers, total: ${busData.passengers}/${busData.capacity}`);
  }
}

/**
 * Обновить счетчик очереди на остановке
 */
function updateStopQueue(stopId: string, delta: number): void {
  const stops = entityManagerService.getEntitiesWithComponents(STOP_COMPONENTS.DATA);
  for (const id of stops) {
    const data = entityManagerService.getComponent<StopDataComponent>(id, STOP_COMPONENTS.DATA);
    if (data && data.id === stopId) {
      data.waitingPassengers = Math.max(0, data.waitingPassengers + delta);
      break;
    }
  }
}
