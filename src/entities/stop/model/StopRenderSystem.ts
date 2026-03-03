/**
 * Система рендеринга остановок
 * @module entities/stop/model
 */

import type { System, SystemContext } from '../../../shared/lib/game-core/EntityManagerService';
import { canvasRendererService } from '../../../shared/lib/game-core/CanvasRendererService';
import { inputService } from '../../../shared/lib/game-core/InputService';
import { stopEditorService } from '@/features/stop-editor';
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

    // Получаем позицию курсора в мировых координатах (уже конвертировано в InputService)
    const mouseState = inputService.getMouseState();
    const worldMouseX = mouseState.worldX;
    const worldMouseY = mouseState.worldY;

    // Отслеживаем, находится ли курсор над остановкой
    let hoveredStopId: string | null = null;

    // Получаем ID выделенной остановки (открыт редактор)
    const selectedStopId = stopEditorService.getSelectedStopId();

    try {
      for (const entityId of entities) {
        const pos = entityManager.getComponent<StopPositionComponent>(
          entityId,
          STOP_COMPONENTS.POSITION
        );
        const data = entityManager.getComponent<StopDataComponent>(entityId, STOP_COMPONENTS.DATA);

        if (!pos || !data) continue;

        // Проверяем, находится ли курсор над этой остановкой
        const dx = worldMouseX - pos.x;
        const dy = worldMouseY - pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const isHovered = distance <= data.radius;
        const isSelected = selectedStopId === data.id;

        if (isHovered) {
          hoveredStopId = data.id;
        }

        // 1. Рисуем зону остановки (полупрозрачный круг)
        canvasRendererService.drawCircle(ctx, pos.x, pos.y, data.radius, {
          fillColor: data.color + '40',
          strokeColor: isSelected ? '#00ffff' : isHovered ? '#ffffff' : data.color,
          strokeWidth: isSelected ? 5 : isHovered ? 4 : 2,
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

        // 5. Визуальная подсказка при наведении (иконка карандаша)
        if (isHovered) {
          ctx.save();
          ctx.shadowColor = 'black';
          ctx.shadowBlur = 4;
          ctx.fillStyle = '#ffff00';
          ctx.font = '16px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('✏️', pos.x + data.radius - 15, pos.y - data.radius + 15);
          ctx.restore();
          ctx.shadowBlur = 0;
        }
      }

      // Меняем курсор при наведении на остановку
      if (hoveredStopId) {
        canvasRendererService.setCursor('pointer');
      } else {
        canvasRendererService.setCursor('default');
      }
    } finally {
      // Восстанавливаем контекст после трансформации камеры
      ctx.restore();
    }
  },
};
