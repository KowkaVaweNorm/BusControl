/**
 * Система рендеринга автобусов
 * @module entities/bus/model
 */

import type { System, SystemContext } from '@/shared/lib/game-core/EntityManagerService';
import { canvasRendererService } from '@/shared/lib/game-core/CanvasRendererService';
import { entityManagerService } from '@/shared/lib/game-core/EntityManagerService';
import { BUS_COMPONENTS, BusState, type BusPositionComponent, type BusDataComponent } from './BusComponents';

export const busRenderSystem: System = {
  name: 'BusRenderSystem',
  requiredComponents: [BUS_COMPONENTS.POSITION, BUS_COMPONENTS.DATA],

  update: (_context: SystemContext, entities: number[]) => {
    const ctx = canvasRendererService.getLayerContext('entities');
    if (!ctx) return;

    try {
      for (const entityId of entities) {
        const pos = entityManagerService.getComponent<BusPositionComponent>(entityId, BUS_COMPONENTS.POSITION);
        const data = entityManagerService.getComponent<BusDataComponent>(entityId, BUS_COMPONENTS.DATA);

        if (!pos || !data) continue;

        const width = 40;
        const height = 20;

        // Сохраняем контекст для трансформации
        ctx.save();
        
        // Перемещаем pivot point в центр автобуса
        ctx.translate(pos.x, pos.y);
        ctx.rotate(pos.rotation);

        // Рисуем корпус (центрируем относительно 0,0 так как мы сделали translate)
        canvasRendererService.drawRect(ctx, -width / 2, -height / 2, width, height, {
          fillColor: data.color,
          strokeColor: '#000000',
          strokeWidth: 2,
          borderRadius: 4,
        });

        // Рисуем "фары" или направление (чтобы понять где перед)
        // Перед справа (по направлению вращения)
        ctx.fillStyle = '#ffff00'; // Желтые фары
        ctx.fillRect(width / 2 - 2, -height / 2 + 2, 2, 4);
        ctx.fillRect(width / 2 - 2, height / 2 - 6, 2, 4);

        // Полоска загрузки пассажиров (если стоит)
        if (data.state === BusState.STOPPED) {
          // Рисуем поверх, но уже без вращения? Или с вращением?
          // Давайте нарисуем над автобусом (локально Y -height)
          const loadPercent = data.passengers / data.capacity;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-width/2, -height/2 - 8, width, 4);
          ctx.fillStyle = '#00ff00';
          ctx.fillRect(-width/2, -height/2 - 8, width * loadPercent, 4);
        }

        ctx.restore();

        // Подпись ID или кол-ва пассажиров (не вращается)
        canvasRendererService.drawText(ctx, `${data.passengers}/${data.capacity}`, pos.x, pos.y - 25, {
          color: '#ffffff',
          fontSize: 12,
          align: 'center',
        });
      }
    } finally {
      ctx.restore(); // Восстанавливаем контекст после трансформации камеры
    }
  },
};
