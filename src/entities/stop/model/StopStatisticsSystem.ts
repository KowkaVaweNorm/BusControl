/**
 * Система агрегации статистики остановок
 * Вычисляет среднюю загруженность всех остановок и количество перегруженных
 * Запускается раз в 1 секунду для производительности
 * @module entities/stop/model
 */

import type { System, SystemContext } from '@/shared/lib/game-core/EntityManagerService';
import { entityManagerService } from '@/shared/lib/game-core/EntityManagerService';
import { gameStateStore } from '@/app/store/GameStateStore';
import {
  STOP_COMPONENTS,
  STOP_CAPACITY,
  OVERLOAD_THRESHOLD,
  type StopDataComponent,
} from './StopComponents';

// Таймер для запуска агрегации раз в 1 секунду
const AGGREGATION_INTERVAL = 1.0; // 1 секунда
let aggregationTimer = 0;

/**
 * Сбросить таймер агрегации
 */
export function resetAggregationTimer(): void {
  aggregationTimer = 0;
}

export const stopStatisticsSystem: System = {
  name: 'StopStatisticsSystem',
  requiredComponents: [STOP_COMPONENTS.DATA],

  update: (context: SystemContext, entities: number[]) => {
    const { deltaTime } = context;

    // Обновляем таймер
    aggregationTimer += deltaTime;

    // Запускаем агрегацию только раз в интервал
    if (aggregationTimer < AGGREGATION_INTERVAL) {
      return;
    }

    aggregationTimer = 0;

    // Агрегация данных по всем остановкам
    let totalOccupancy = 0;
    let overloadedCount = 0;
    let activeStopsCount = 0;

    for (const stopEntityId of entities) {
      const stopData = entityManagerService.getComponent<StopDataComponent>(
        stopEntityId,
        STOP_COMPONENTS.DATA
      );

      if (!stopData) continue;

      activeStopsCount++;

      // Расчёт загруженности этой остановки
      const occupancy = stopData.waitingPassengers / STOP_CAPACITY;
      totalOccupancy += occupancy;

      // Проверка на перегрузку
      if (occupancy >= OVERLOAD_THRESHOLD) {
        overloadedCount++;
      }
    }

    // Вычисление средней загруженности (в процентах)
    const averageOccupancy = activeStopsCount > 0
      ? (totalOccupancy / activeStopsCount) * 100
      : 0;

    // Обновление GameStateStore
    gameStateStore.setAverageStopOccupancy(averageOccupancy);
    gameStateStore.setOverloadedStopsCount(overloadedCount);
  },
};
