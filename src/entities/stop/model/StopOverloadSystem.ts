/**
 * Система мониторинга перегрузки остановок
 * Отслеживает загруженность остановок и генерирует жалобы при перегрузке >50% более 10 секунд
 * @module entities/stop/model
 */

import type { System, SystemContext } from '@/shared/lib/game-core/EntityManagerService';
import { entityManagerService } from '@/shared/lib/game-core/EntityManagerService';
import { gameEventBusService, GameEventType } from '@/shared/lib/game-core/GameEventBusService';
import {
  STOP_COMPONENTS,
  STOP_CAPACITY,
  OVERLOAD_THRESHOLD,
  COMPLAINT_DELAY,
  type StopDataComponent,
} from './StopComponents';

// Локальная мапа для отслеживания последнего времени генерации жалобы (защита от спама)
const lastComplaintTime: Map<string, number> = new Map();

/**
 * Сбросить таймеры жалоб (для использования при загрузке карты)
 */
export function resetComplaintTimers(): void {
  lastComplaintTime.clear();
}

export const stopOverloadSystem: System = {
  name: 'StopOverloadSystem',
  requiredComponents: [STOP_COMPONENTS.DATA],

  update: (context: SystemContext, entities: number[]) => {
    const { deltaTime } = context;
    const now = Date.now();

    for (const stopEntityId of entities) {
      const stopData = entityManagerService.getComponent<StopDataComponent>(
        stopEntityId,
        STOP_COMPONENTS.DATA
      );

      if (!stopData) continue;

      // Расчёт загруженности остановки
      const occupancyPercent = (stopData.waitingPassengers / STOP_CAPACITY) * 100;
      const isOverloaded = stopData.waitingPassengers >= STOP_CAPACITY * OVERLOAD_THRESHOLD;

      if (isOverloaded) {
        // Увеличиваем таймер перегрузки
        stopData.overloadTimer += deltaTime;

        // Публикуем событие о перегрузке (для UI виджета)
        // Но не чаще чем раз в 0.5 секунды чтобы не спамить
        const lastOverloadEvent = lastComplaintTime.get(`overload_${stopData.id}`) || 0;
        if (now - lastOverloadEvent > 500) {
          gameEventBusService.publish(GameEventType.STOP_OVERLOADED, {
            stopId: stopData.id,
            stopName: stopData.name,
            waitingPassengers: stopData.waitingPassengers,
            occupancyPercent,
            overloadTimer: stopData.overloadTimer,
          });
          lastComplaintTime.set(`overload_${stopData.id}`, now);
        }

        // Проверка на генерацию жалобы
        if (stopData.overloadTimer >= COMPLAINT_DELAY) {
          // Генерируем жалобу
          stopData.complaintCount++;
          stopData.overloadTimer = 0; // Сброс таймера после жалобы

          // Публикуем событие о жалобе
          gameEventBusService.publish(GameEventType.COMPLAINT_ADDED, {
            stopId: stopData.id,
            stopName: stopData.name,
            waitingPassengers: stopData.waitingPassengers,
            totalComplaints: stopData.complaintCount,
          });
        }
      } else {
        // Если не перегружена - уменьшаем таймер (но не ниже 0)
        // Это даёт "передышку" - если очередь уменьшилась, таймер сбрасывается
        stopData.overloadTimer = Math.max(0, stopData.overloadTimer - deltaTime * 2);
      }
    }
  },
};
