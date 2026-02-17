/**
 * Компоненты для сущности Route (Маршрут)
 * @module entities/route/model
 */

import type { Component } from '../../../shared/lib/game-core/EntityManagerService';

/**
 * Данные маршрута
 */
export interface RouteDataComponent extends Component {
  id: string;
  name: string;
  stopIds: string[]; // Упорядоченный список ID остановок
  color: string; // Цвет линии маршрута
  isActive: boolean; // Активен ли маршрут (ездят ли автобусы)
  loop: boolean; // Зациклен ли маршрут (возвращаться в начало)
}

/**
 * Типы компонентов для удобного импорта
 */
export const ROUTE_COMPONENTS = {
  DATA: 'route_data',
} as const;
