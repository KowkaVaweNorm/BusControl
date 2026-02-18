/**
 * Система рендеринга NPC
 * @module entities/npc/model
 */

import type { System, SystemContext } from '@/shared/lib/game-core/EntityManagerService';
import { canvasRendererService } from '@/shared/lib/game-core/CanvasRendererService';
import { entityManagerService } from '@/shared/lib/game-core/EntityManagerService';
import { NPC_COMPONENTS, NPCState, type NPCDataComponent, type NPCPositionComponent } from './NPCComponents';

export const npcRenderSystem: System = {
  name: 'NPCRenderSystem',
  requiredComponents: [NPC_COMPONENTS.POSITION, NPC_COMPONENTS.DATA],

  update: (_context: SystemContext, entities: number[]) => {
    const ctx = canvasRendererService.getLayerContext('entities');
    if (!ctx) return;

    try {
      for (const entityId of entities) {
        const pos = entityManagerService.getComponent<NPCPositionComponent>(entityId, NPC_COMPONENTS.POSITION);
        const data = entityManagerService.getComponent<NPCDataComponent>(entityId, NPC_COMPONENTS.DATA);

        if (!pos || !data) continue;

        // Не рисуем тех, кто уже прибыл и ждет удаления
        if (data.state === NPCState.ARRIVED) continue;

        const radius = 4;
        let color = '#ffffff'; // Ждущий - белый

        if (data.state === NPCState.ON_BUS) {
          color = '#00aaff'; // В автобусе - синий
        } else if (data.state === NPCState.WAITING) {
          color = '#ffffff';
        } else if (data.state === NPCState.BOARDING) {
          color = '#ffff00'; // Посадка - желтый
        } else if (data.state === NPCState.ALIGHTING) {
          color = '#ff8800'; // Высадка - оранжевый
        }

        canvasRendererService.drawCircle(ctx, pos.x, pos.y, radius, {
          fillColor: color,
          strokeColor: '#000000',
          strokeWidth: 1,
        });

        // Если ждет, рисуем маленький индикатор цели (пурпурная точка над головой)
        if (data.state === NPCState.WAITING && data.targetStopId) {
          ctx.fillStyle = '#ff00ff';
          ctx.fillRect(pos.x - 1, pos.y - 8, 2, 2);
        }
      }
    } finally {
      ctx.restore(); // Восстанавливаем контекст после трансформации камеры
    }
  },
};
