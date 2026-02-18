/**
 * Система рендеринга остановок
 * @module entities/stop/model
 */

import type { System, SystemContext } from '../../../shared/lib/game-core/EntityManagerService';
import { canvasRendererService } from '../../../shared/lib/game-core/CanvasRendererService';
import {
  STOP_COMPONENTS,
  type StopPositionComponent,
  type StopDataComponent,
} from './StopComponents';

export const stopRenderSystem: System = {
  name: 'StopRenderSystem',
  requiredComponents: [STOP_COMPONENTS.POSITION, STOP_COMPONENTS.DATA],

  update: (context: SystemContext, entities: number[]) => {
    const { entityManager } = context;
    const ctx = canvasRendererService.getLayerContext('entities');

    if (!ctx) return;

    try {
      for (const entityId of entities) {
        const pos = entityManager.getComponent<StopPositionComponent>(
          entityId,
          STOP_COMPONENTS.POSITION
        );
        const data = entityManager.getComponent<StopDataComponent>(entityId, STOP_COMPONENTS.DATA);

        if (!pos || !data) continue;

        // 1. Рисуем зону остановки (полупрозрачный круг)
        canvasRendererService.drawCircle(ctx, pos.x, pos.y, data.radius, {
          fillColor: data.color + '40',
          strokeColor: data.color,
          strokeWidth: 2,
        });

        // 2. Рисуем центр (маркер)
        canvasRendererService.drawCircle(ctx, pos.x, pos.y, 5, {
          fillColor: '#ffffff',
        });

        // 3. Рисуем название (надпись над остановкой)
        ctx.save();
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(data.name, pos.x, pos.y - data.radius - 8);
        ctx.restore();
        
        // Сбрасываем shadowBlur после рисования текста (важно для следующих итераций!)
        ctx.shadowBlur = 0;

        // 4. Если есть пассажиры, рисуем счетчик
        if (data.waitingPassengers > 0) {
          canvasRendererService.drawText(
            ctx,
            `👥 ${data.waitingPassengers}`,
            pos.x,
            pos.y + data.radius + 15,
            {
              color: '#ffff00',
              fontSize: 14,
              align: 'center',
              baseline: 'top',
            }
          );
        }
      }
    } finally {
      // Восстанавливаем контекст после трансформации камеры
      ctx.restore();
    }
  },
};
