/**
 * Система спавна пассажиров
 * Создает новых NPC на остановках через определенные интервалы.
 * @module entities/npc/model
 */

import type { System, SystemContext } from '@/shared/lib/game-core/EntityManagerService';
import { entityManagerService } from '@/shared/lib/game-core/EntityManagerService';
import { STOP_COMPONENTS, type StopDataComponent, type StopPositionComponent } from '@/entities/stop/model/StopComponents';
import { NPC_COMPONENTS, NPCState } from './NPCComponents';

export interface SpawnerConfig {
  spawnInterval: number; // Секунды между попытками спавна
  maxPassengersPerStop: number; // Лимит очереди на остановке
}

// Кэш всех остановок для выбора цели
let allStopsCache: Array<{ id: string; entityId: number }> | null = null;

// Локальный таймер системы (вне объекта для избежания проблем с типами)
let spawnTimer = 0;

/**
 * Очистить кэш остановок (вызывать при создании/удалении остановок)
 */
export function clearStopsCache(): void {
  allStopsCache = null;
}

/**
 * Сбросить таймер спавна
 */
export function resetSpawnTimer(): void {
  spawnTimer = 0;
}

export const npcSpawnerSystem: System = {
  name: 'NPCSpawnerSystem',
  requiredComponents: [STOP_COMPONENTS.DATA, STOP_COMPONENTS.POSITION],

  update: (context: SystemContext, entities: number[]) => {
    const { deltaTime } = context;
    const config: SpawnerConfig = { spawnInterval: 2.0, maxPassengersPerStop: 10 };

    spawnTimer += deltaTime;

    if (spawnTimer < config.spawnInterval) {
      return;
    }

    spawnTimer = 0;

    // Проходим по всем остановкам
    for (const stopEntityId of entities) {
      const stopData = entityManagerService.getComponent<StopDataComponent>(stopEntityId, STOP_COMPONENTS.DATA);
      const stopPos = entityManagerService.getComponent<StopPositionComponent>(stopEntityId, STOP_COMPONENTS.POSITION);

      if (!stopData || !stopPos) continue;

      // Проверка лимита очереди
      if (stopData.waitingPassengers >= config.maxPassengersPerStop) {
        continue;
      }

      // Шанс спавна (100% пока интервал большой)
      spawnNPC(stopData.id, stopPos.x, stopPos.y);

      // Обновляем счетчик в остановке (визуально)
      stopData.waitingPassengers++;
    }
  },
};

function spawnNPC(stopId: string, x: number, y: number): void {
  const entityId = entityManagerService.createEntity();
  if (entityId === -1) return;

  const npcId = `npc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

  // Инициализация кэша остановок при необходимости
  if (!allStopsCache) {
    allStopsCache = [];
    const stops = entityManagerService.getEntitiesWithComponents(STOP_COMPONENTS.DATA, STOP_COMPONENTS.POSITION);
    for (const id of stops) {
      const sData = entityManagerService.getComponent<StopDataComponent>(id, STOP_COMPONENTS.DATA);
      if (sData) {
        allStopsCache.push({ id: sData.id, entityId: id });
      }
    }
  }

  // Случайная цель (любая другая остановка)
  let targetStopId: string | null = null;

  if (allStopsCache.length > 1) {
    // Выбираем случайную остановку, отличную от текущей
    let attempts = 0;
    while (attempts < 5) {
      const randomEntry = allStopsCache[Math.floor(Math.random() * allStopsCache.length)];
      if (randomEntry.id !== stopId) {
        targetStopId = randomEntry.id;
        break;
      }
      attempts++;
    }
    // Если не удалось выбрать другую остановку, берём любую (баг фича для MVP)
    if (!targetStopId && allStopsCache.length > 0) {
      targetStopId = allStopsCache[0]?.id ?? null;
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

  // console.log(`[NPC] Spawned ${npcId} at ${stopId}, wants to go to ${targetStopId}`);
}
