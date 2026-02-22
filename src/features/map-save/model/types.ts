/**
 * Типы данных для системы сохранения карт
 * @module features/map-save/model
 */

export const SAVE_VERSION = '1.0.0';
export const STORAGE_KEY = 'bus-control-save-v1';

/**
 * Сохранённая остановка
 */
export interface SavedStop {
  id: string;
  name: string;
  x: number;
  y: number;
  spawnRates?: { // Настройки спавна пассажиров (опционально, для обратной совместимости)
    morning: number;
    day: number;
    evening: number;
    night: number;
  };
}

/**
 * Сохранённый маршрут
 */
export interface SavedRoute {
  id: string;
  name: string;
  stopIds: string[]; // Массив ID остановок по порядку
  color: string;
  loop: boolean;
}

/**
 * Сохранённый автобус (опционально, для продолжения трафика)
 */
export interface SavedBus {
  id: string;
  routeId: string; // ID маршрута
  currentStopIndex: number; // Текущая остановка (индекс в маршруте)
  passengers: number; // Пассажиры внутри
}

/**
 * Данные сохранения карты
 */
export interface MapSaveData {
  version: string; // Версия формата сохранения
  mapName: string; // Название карты
  createdAt: number; // Дата создания (timestamp)
  modifiedAt: number; // Дата последнего изменения

  // Игровые объекты
  stops: SavedStop[];
  routes: SavedRoute[];
  buses: SavedBus[]; // Опционально: если пусто - игрок сам добавляет автобусы

  // Настройки камеры (опционально)
  camera?: {
    x: number;
    y: number;
    scale: number;
  };

  // Опции карты
  options?: {
    autoSaveEnabled: boolean; // Включено ли автосохранение
    autoSaveInterval: number; // Интервал автосохранения (сек)
    preserveBuses: boolean; // Сохранять ли автобусы (false = только остановки и маршруты)
  };
}

/**
 * Пресетная карта (для загрузки из файла)
 */
export interface PresetMap {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  data: {
    stops: SavedStop[];
    routes: SavedRoute[];
    buses?: SavedBus[];
    camera?: {
      x: number;
      y: number;
      scale: number;
    };
  };
}

/**
 * Метаданные сохранения (для списка сохранений)
 */
export interface SaveMetadata {
  mapName: string;
  modifiedAt: number;
  stopsCount: number;
  routesCount: number;
  busesCount: number;
}
