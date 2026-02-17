/**
 * Система рендеринга маршрутов
 * @module entities/route/model
 */

import type { System, SystemContext } from '../../../shared/lib/game-core/EntityManagerService';
import { canvasRendererService } from '../../../shared/lib/game-core/CanvasRendererService';
import { entityManagerService } from '../../../shared/lib/game-core/EntityManagerService';
import { ROUTE_COMPONENTS, type RouteDataComponent } from './RouteComponents';
import {
  STOP_COMPONENTS,
  type StopPositionComponent,
  type StopDataComponent,
} from '../../../entities/stop/model/StopComponents';

export const routeRenderSystem: System = {
  name: 'RouteRenderSystem',
  requiredComponents: [ROUTE_COMPONENTS.DATA],

  update: (context: SystemContext, entities: number[]) => {
    const { entityManager } = context;
    const ctx = canvasRendererService.getLayerContext('roads'); // Рисуем на слое дорог

    if (!ctx) return;

    try {
      for (const entityId of entities) {
        const routeData = entityManager.getComponent<RouteDataComponent>(
          entityId,
          ROUTE_COMPONENTS.DATA
        );
        if (!routeData || routeData.stopIds.length < 2) continue;

        // Проходим по всем парам остановок и рисуем линии
        for (let i = 0; i < routeData.stopIds.length - 1; i++) {
          const startStopId = routeData.stopIds[i];
          const endStopId = routeData.stopIds[i + 1];

          const startPos = findStopPosition(startStopId);
          const endPos = findStopPosition(endStopId);

          if (startPos && endPos) {
            // Рисуем основную линию
            canvasRendererService.drawLine(ctx, startPos.x, startPos.y, endPos.x, endPos.y, {
              color: routeData.color,
              width: 4,
              dashed: false,
            });

            // Рисуем маленькую точку в середине сегмента
            const midX = (startPos.x + endPos.x) / 2;
            const midY = (startPos.y + endPos.y) / 2;
            canvasRendererService.drawCircle(ctx, midX, midY, 3, { fillColor: '#ffffff' });
          }
        }

        // Если маршрут зациклен, рисуем линию от последней к первой
        if (routeData.loop && routeData.stopIds.length > 2) {
          const lastStopId = routeData.stopIds[routeData.stopIds.length - 1];
          const firstStopId = routeData.stopIds[0];

          const lastPos = findStopPosition(lastStopId);
          const firstPos = findStopPosition(firstStopId);

          if (lastPos && firstPos) {
            canvasRendererService.drawLine(ctx, lastPos.x, lastPos.y, firstPos.x, firstPos.y, {
              color: routeData.color,
              width: 4,
              dashed: true, // Пунктиром покажем замыкание
            });
          }
        }

        // Подпись маршрута — посередине всех сегментов
        const labelPos = calculateRouteLabelPosition(routeData);
        if (labelPos) {
          // Ручная тень для текста
          ctx.shadowColor = 'black';
          ctx.shadowBlur = 4;
          ctx.fillStyle = routeData.color;
          ctx.font = 'bold 16px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(routeData.name, labelPos.x, labelPos.y - 20);
        }
      }
    } finally {
      ctx.restore(); // Восстанавливаем контекст после трансформации камеры
    }
  },
};

/**
 * Вспомогательная функция поиска позиции остановки по ID
 * В реальном проекте лучше использовать индекс или мапу для производительности,
 * но для MVP перебор допустим.
 */
function findStopPosition(stopId: string): { x: number; y: number } | null {
  const allStops = entityManagerService.getEntitiesWithComponents(
    STOP_COMPONENTS.POSITION,
    STOP_COMPONENTS.DATA
  );

  for (const entityId of allStops) {
    const data = entityManagerService.getComponent<StopDataComponent>(
      entityId,
      STOP_COMPONENTS.DATA
    );
    if (data && data.id === stopId) {
      const pos = entityManagerService.getComponent<StopPositionComponent>(
        entityId,
        STOP_COMPONENTS.POSITION
      );
      if (pos) return { x: pos.x, y: pos.y };
    }
  }
  return null;
}

/**
 * Вычисляет среднюю позицию маршрута для отображения названия
 * Берёт среднее арифметическое всех остановок маршрута
 */
function calculateRouteLabelPosition(routeData: RouteDataComponent): { x: number; y: number } | null {
  if (routeData.stopIds.length === 0) return null;

  let totalX = 0;
  let totalY = 0;
  let count = 0;

  for (const stopId of routeData.stopIds) {
    const pos = findStopPosition(stopId);
    if (pos) {
      totalX += pos.x;
      totalY += pos.y;
      count++;
    }
  }

  if (count === 0) return null;

  return {
    x: totalX / count,
    y: totalY / count,
  };
}
