/**
 * Компоненты для сущности NPC (Пассажир)
 * @module entities/npc/model
 */

import type { Component } from '@/shared/lib/game-core/EntityManagerService';

export enum NPCState {
  WAITING = 'waiting',       // Ждет на остановке
  BOARDING = 'boarding',     // В процессе посадки (анимация)
  ON_BUS = 'on_bus',         // Едет в автобусе
  ALIGHTING = 'alighting',   // В процессе высадки
  ARRIVED = 'arrived'        // Добрался до цели (удалить сущность)
}

/**
 * Позиция (может меняться: остановка -> внутри автобуса)
 */
export interface NPCPositionComponent extends Component {
  x: number;
  y: number;
  targetStopId: string | null; // ID остановки назначения
}

/**
 * Данные пассажира
 */
export interface NPCDataComponent extends Component {
  id: string;
  state: NPCState;
  currentStopId: string | null; // Где сейчас ждет или откуда сел
  busEntityId: number | null;   // ID автобуса, в котором находится (если on_bus)
  patience: number;             // Сколько готов ждать (сек) - для MVP пока не используем строго
  spawnTime: number;            // Время появления
}

export const NPC_COMPONENTS = {
  POSITION: 'npc_position',
  DATA: 'npc_data',
} as const;
