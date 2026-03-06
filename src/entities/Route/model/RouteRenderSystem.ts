/**
 * Система рендеринга маршрутов
 * @module entities/route/model
 */

import type { System, SystemContext } from '../../../shared/lib/game-core/EntityManagerService';
import { canvasRendererService } from '../../../shared/lib/game-core/CanvasRendererService';
import { entityManagerService } from '../../../shared/lib/game-core/EntityManagerService';
import { inputService, MouseButton } from '../../../shared/lib/game-core/InputService';
import { ROUTE_COMPONENTS, type RouteDataComponent } from './RouteComponents';
import {
  STOP_COMPONENTS,
  type StopPositionComponent,
  type StopDataComponent,
} from '../../../entities/stop/model/StopComponents';
import { routeEditorService } from '@/features/route-editor';

export const routeRenderSystem: System = {
  name: 'RouteRenderSystem',
  requiredComponents: [ROUTE_COMPONENTS.DATA],

  update: (context: SystemContext, entities: number[]) => {
    const { entityManager } = context;
    const ctx = canvasRendererService.getLayerContext('roads'); // Рисуем на слое дорог

    if (!ctx) return;

    // Получаем позицию курсора в мировых координатах
    const mouseState = inputService.getMouseState();
    const worldMouseX = mouseState.worldX;
    const worldMouseY = mouseState.worldY;

    // Отслеживаем hovered маршрут (только один!)
    let hoveredRouteId: string | null = null;

    try {
      // Первый проход: находим первый маршрут под курсором
      for (const entityId of entities) {
        const routeData = entityManager.getComponent<RouteDataComponent>(
          entityId,
          ROUTE_COMPONENTS.DATA
        );
        if (!routeData || routeData.stopIds.length < 2) continue;

        // Проверяем наведение на маршрут (работает в любом режиме)
        const isHovered = isMouseOverRoute(routeData, worldMouseX, worldMouseY);
        
        if (isHovered && !hoveredRouteId) {
          // Запоминаем ПЕРВЫЙ найденный маршрут и прекращаем поиск
          hoveredRouteId = routeData.id;
          break; // Важно: останавливаемся на первом совпадении
        }
      }

      // Второй проход: рендерим все маршруты
      for (const entityId of entities) {
        const routeData = entityManager.getComponent<RouteDataComponent>(
          entityId,
          ROUTE_COMPONENTS.DATA
        );
        if (!routeData || routeData.stopIds.length < 2) continue;

        // Только один маршрут может быть hovered
        const isHovered = hoveredRouteId === routeData.id;

        // Стили для разных состояний
        const baseWidth = isHovered ? 6 : 4;
        const opacity = isHovered ? 1.0 : 0.8;
        const glowEffect = isHovered;

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
              width: baseWidth,
              dashed: false,
              opacity,
            });

            // Рисуем белую обводку при наведении (аккуратное свечение)
            if (glowEffect) {
              canvasRendererService.drawLine(ctx, startPos.x, startPos.y, endPos.x, endPos.y, {
                color: '#ffffff',
                width: baseWidth + 3,
                dashed: false,
                opacity: 0.5,
              });
            }

            // Рисуем маленькую точку в середине сегмента
            const midX = (startPos.x + endPos.x) / 2;
            const midY = (startPos.y + endPos.y) / 2;
            canvasRendererService.drawCircle(ctx, midX, midY, isHovered ? 5 : 3, { 
              fillColor: isHovered ? '#ffffff' : routeData.color,
            });
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
              width: baseWidth,
              dashed: true, // Пунктиром покажем замыкание
              opacity,
            });

            // Белая обводка при наведении (аккуратное свечение)
            if (glowEffect) {
              canvasRendererService.drawLine(ctx, lastPos.x, lastPos.y, firstPos.x, firstPos.y, {
                color: '#ffffff',
                width: baseWidth + 3,
                dashed: true,
                opacity: 0.5,
              });
            }
          }
        }

        // Подпись маршрута — посередине всех сегментов
        const labelPos = calculateRouteLabelPosition(routeData);
        if (labelPos) {
          if (isHovered) {
            // Выделенное название: белая тень + жирный шрифт
            ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
            ctx.shadowBlur = 12;
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 18px Arial';
          } else {
            // Обычное название: чёрная тень
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 4;
            ctx.fillStyle = routeData.color;
            ctx.font = 'bold 16px Arial';
          }
          ctx.textAlign = 'center';
          ctx.fillText(routeData.name, labelPos.x, labelPos.y - 20);

          // Сбрасываем shadowBlur после текста (важно для следующих маршрутов!)
          ctx.shadowBlur = 0;
          ctx.shadowColor = 'transparent';
        }
      }

      // Меняем курсор при наведении на маршрут
      if (hoveredRouteId) {
        canvasRendererService.setCursor('pointer');
      }

      // Обработка клика по маршруту (открытие редактора)
      if (hoveredRouteId && inputService.isMouseButtonPressed(MouseButton.LEFT)) {
        // Находим данные маршрута
        for (const entityId of entities) {
          const routeData = entityManager.getComponent<RouteDataComponent>(
            entityId,
            ROUTE_COMPONENTS.DATA
          );
          if (routeData && routeData.id === hoveredRouteId) {
            // Открываем редактор маршрута
            routeEditorService.open(routeData.id, routeData.name);
            break;
          }
        }
      }
    } finally {
      ctx.restore(); // Восстанавливаем контекст после трансформации камеры
    }
  },
};

/**
 * Проверка, находится ли курсор над маршрутом
 * Проверяем расстояние от точки мыши до каждого сегмента маршрута
 */
function isMouseOverRoute(
  routeData: RouteDataComponent,
  mouseX: number,
  mouseY: number,
  threshold: number = 15
): boolean {
  for (let i = 0; i < routeData.stopIds.length - 1; i++) {
    const startStopId = routeData.stopIds[i];
    const endStopId = routeData.stopIds[i + 1];

    const startPos = findStopPosition(startStopId);
    const endPos = findStopPosition(endStopId);

    if (startPos && endPos) {
      const distance = distanceToSegment(
        mouseX,
        mouseY,
        startPos.x,
        startPos.y,
        endPos.x,
        endPos.y
      );
      if (distance <= threshold) {
        return true;
      }
    }
  }

  // Проверка замыкающего сегмента для зацикленных маршрутов
  if (routeData.loop && routeData.stopIds.length > 2) {
    const lastStopId = routeData.stopIds[routeData.stopIds.length - 1];
    const firstStopId = routeData.stopIds[0];

    const lastPos = findStopPosition(lastStopId);
    const firstPos = findStopPosition(firstStopId);

    if (lastPos && firstPos) {
      const distance = distanceToSegment(
        mouseX,
        mouseY,
        lastPos.x,
        lastPos.y,
        firstPos.x,
        firstPos.y
      );
      if (distance <= threshold) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Вычислить расстояние от точки до отрезка
 */
function distanceToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    // Отрезок вырожден в точку
    return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  }

  // Проекция точки на прямую
  let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
  t = Math.max(0, Math.min(1, t));

  // Ближайшая точка на отрезке
  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;

  return Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);
}

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
function calculateRouteLabelPosition(
  routeData: RouteDataComponent
): { x: number; y: number } | null {
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
