/**
 * Компоненты для сущности Stop (Остановка)
 * @module entities/stop/model
 */

import type { Component } from '../../../shared/lib/game-core/EntityManagerService';

/**
 * Позиция остановки в мире
 */
export interface StopPositionComponent extends Component {
  x: number;
  y: number;
}

/**
 * Данные остановки
 */
export interface StopDataComponent extends Component {
  id: string;
  name: string;
  radius: number; // Радиус зоны остановки (для попадания автобуса)
  color: string; // Цвет отрисовки
  waitingPassengers: number; // Счетчик ожидающих (пока просто число)
}

/**
 * Типы компонентов для удобного импорта в других местах
 */
export const STOP_COMPONENTS = {
  POSITION: 'stop_position',
  DATA: 'stop_data',
} as const;
