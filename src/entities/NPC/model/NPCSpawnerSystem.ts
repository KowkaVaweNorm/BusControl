/**
 * Система спавна пассажиров
 * Создает новых NPC на остановках через определенные интервалы.
 * @module entities/npc/model
 */

import type { System, SystemContext } from '@/shared/lib/game-core/EntityManagerService';
import { entityManagerService } from '@/shared/lib/game-core/EntityManagerService';
import { STOP_COMPONENTS, type StopDataComponent, type StopPositionComponent } from '@/entities/stop/model/StopComponents';
import { NPC_COMPONENTS, NPCState } from './NPCComponents';
import { ROUTE_COMPONENTS, type RouteDataComponent } from '@/entities/Route/model/RouteComponents';
import { timeService } from '@/features/time-of-day';

export interface SpawnerConfig {
  maxPassengersPerStop: number; // Лимит очереди на остановке
}

// Локальный таймер системы (вне объекта для избежания проблем с типами)
// Хранит время до следующего спавна для каждой остановки
const spawnTimers: Map<string, number> = new Map();

/**
 * Сбросить таймеры спавна
 */
export function resetSpawnTimer(): void {
  spawnTimers.clear();
}

/**
 * Найти все остановки, которые находятся дальше по маршруту от текущей
 * Возвращает массив ID остановок, до которых можно доехать из текущей точки
 */
function getFutureStopsFromStop(currentStopId: string): string[] {
  const futureStops = new Set<string>();
  const routes = entityManagerService.getEntitiesWithComponents(ROUTE_COMPONENTS.DATA);

  for (const routeEntityId of routes) {
    const routeData = entityManagerService.getComponent<RouteDataComponent>(routeEntityId, ROUTE_COMPONENTS.DATA);
    if (!routeData) continue;

    // Находим индекс текущей остановки в маршруте
    const currentIndex = routeData.stopIds.indexOf(currentStopId);
    if (currentIndex === -1) continue; // Эта остановка не на данном маршруте

    // Добавляем все остановки, которые идут после текущей
    for (let i = currentIndex + 1; i < routeData.stopIds.length; i++) {
      futureStops.add(routeData.stopIds[i]);
    }
  }

  return Array.from(futureStops);
}

export const npcSpawnerSystem: System = {
  name: 'NPCSpawnerSystem',
  requiredComponents: [STOP_COMPONENTS.DATA, STOP_COMPONENTS.POSITION],

  update: (context: SystemContext, entities: number[]) => {
    const { deltaTime } = context;
    const config: SpawnerConfig = { maxPassengersPerStop: 100 }; // Лимит: 100 пассажиров на остановке

    // Получаем текущий период суток
    const currentPeriod = timeService.getPeriod();

    // Проходим по всем остановкам
    for (const stopEntityId of entities) {
      const stopData = entityManagerService.getComponent<StopDataComponent>(stopEntityId, STOP_COMPONENTS.DATA);
      const stopPos = entityManagerService.getComponent<StopPositionComponent>(stopEntityId, STOP_COMPONENTS.POSITION);

      if (!stopData || !stopPos) continue;

      // Проверка лимита очереди
      if (stopData.waitingPassengers >= config.maxPassengersPerStop) {
        continue;
      }

      // Получаем интервал спавна для текущего периода
      const spawnInterval = stopData.spawnRates[currentPeriod] || 5.0;

      // Инициализируем таймер если нужно
      if (!spawnTimers.has(stopData.id)) {
        spawnTimers.set(stopData.id, 0);
      }

      // Обновляем таймер
      let timer = spawnTimers.get(stopData.id)! + deltaTime;

      if (timer >= spawnInterval) {
        // Время спавна!
        timer = 0;
        spawnNPC(stopData.id, stopPos.x, stopPos.y);
        stopData.waitingPassengers++;
      }

      spawnTimers.set(stopData.id, timer);
    }
  },
};

function spawnNPC(stopId: string, x: number, y: number): void {
  const entityId = entityManagerService.createEntity();
  if (entityId === -1) return;

  const npcId = `npc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

  // Находим остановки, до которых можно доехать из текущей (только дальше по маршруту!)
  const futureStops = getFutureStopsFromStop(stopId);

  // Случайная цель (только из остановок дальше по маршруту)
  let targetStopId: string | null = null;

  if (futureStops.length > 0) {
    // Выбираем случайную остановку из доступных
    const randomIndex = Math.floor(Math.random() * futureStops.length);
    targetStopId = futureStops[randomIndex];
  } else {
    // Если нет маршрутов из этой остановки — пассажир не появится (нет спроса)
    // Или можно выбрать любую другую остановку как fallback
    const allStops = entityManagerService.getEntitiesWithComponents(STOP_COMPONENTS.DATA, STOP_COMPONENTS.POSITION);
    const otherStops = allStops.filter((id) => {
      const data = entityManagerService.getComponent<StopDataComponent>(id, STOP_COMPONENTS.DATA);
      return data && data.id !== stopId;
    });

    if (otherStops.length > 0) {
      const randomIndex = Math.floor(Math.random() * otherStops.length);
      const data = entityManagerService.getComponent<StopDataComponent>(otherStops[randomIndex], STOP_COMPONENTS.DATA);
      targetStopId = data?.id ?? null;
    }
  }

  entityManagerService.addComponent(entityId, NPC_COMPONENTS.POSITION, {
    x: x + (Math.random() - 0.5) * 20, // Небольшой разброс вокруг центра
    y: y + (Math.random() - 0.5) * 20,
    targetStopId: targetStopId,
  });

  entityManagerService.addComponent(entityId, NPC_COMPONENTS.DATA, {
    id: npcId,
    state: NPCState.WAITING,
    currentStopId: stopId,
    busEntityId: null,
    patience: 30 + Math.random() * 30,
    spawnTime: Date.now(),
  });
}
