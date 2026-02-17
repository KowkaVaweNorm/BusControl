/**
 * Компоненты для сущности Bus (Автобус)
 * @module entities/bus/model
 */

import type { Component } from '@/shared/lib/game-core/EntityManagerService';

export enum BusState {
  IDLE = 'idle',           // Стоит без дела (нет маршрута)
  MOVING_TO_STOP = 'moving_to_stop', // Едет к следующей остановке
  STOPPED = 'stopped',     // Остановился для посадки/высадки
  RETURNING = 'returning'  // (Опционально) Возвращается в депо
}

/**
 * Позиция и ориентация
 */
export interface BusPositionComponent extends Component {
  x: number;
  y: number;
  rotation: number; // Угол в радианах
}

/**
 * Физика движения
 */
export interface BusVelocityComponent extends Component {
  speed: number;        // Текущая скорость
  maxSpeed: number;     // Максимальная скорость
  acceleration: number; // Ускорение
  isMoving: boolean;
}

/**
 * Игровые данные автобуса
 */
export interface BusDataComponent extends Component {
  id: string;
  routeId: string | null; // ID текущего маршрута (null если свободен)
  currentStopIndex: number; // Индекс текущей цели в списке остановок маршрута
  state: BusState;
  capacity: number;     // Вместимость
  passengers: number;   // Текущее кол-во пассажиров
  color: string;
  waitTimer: number;    // Таймер ожидания на остановке (сек)
  waitTimeRequired: number; // Сколько нужно ждать (сек)
}

export const BUS_COMPONENTS = {
  POSITION: 'bus_position',
  VELOCITY: 'bus_velocity',
  DATA: 'bus_data',
} as const;
