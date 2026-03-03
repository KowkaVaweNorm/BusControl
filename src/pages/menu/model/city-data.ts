/**
 * Данные городов/карт для главного меню
 * Генерируются на основе пресетных карт из preset-maps.ts
 */

import type { CityData } from './types';
import { presetMaps } from '@/features/map-save/model/preset-maps';

/**
 * Преобразовать пресетную карту в формат для меню
 */
function presetToCityData(
  presetId: string,
  name: string,
  stops: number,
  routes: number,
  difficulty: string
): CityData {
  return {
    id: presetId,
    name,
    stops,
    routes,
    difficulty: difficulty as 'легкий' | 'средний' | 'сложный',
  };
}

/**
 * Список городов для меню (на основе пресетов)
 */
export const CITIES_DATA: CityData[] = presetMaps.map((preset) =>
  presetToCityData(
    preset.id,
    preset.name,
    preset.data.stops.length,
    preset.data.routes.length,
    preset.difficulty
  )
);

/**
 * Получить город по ID
 */
export function getCityById(cityId: string): CityData | undefined {
  return CITIES_DATA.find((city) => city.id === cityId);
}

/**
 * Получить цвет линии маршрута в зависимости от сложности
 */
export function getRouteColorByDifficulty(difficulty: string): string {
  switch (difficulty) {
    case 'легкий':
      return '#4CAF50';
    case 'средний':
      return '#FFC107';
    case 'сложный':
      return '#F44336';
    default:
      return '#FFC107';
  }
}

/**
 * Получить пресет карты по ID города
 */
export function getPresetByCityId(cityId: string): string | null {
  const preset = presetMaps.find((p) => p.id === cityId);
  return preset ? preset.id : null;
}
