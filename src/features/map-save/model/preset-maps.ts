/**
 * Пресетные карты
 * 
 * Готовые конфигурации карт для быстрой загрузки.
 * Формат совместим с MapSaveData для возможного экспорта в JSON.
 * 
 * @module features/map-save/model
 */

import type { PresetMap } from './types';

/**
 * Пресет 1: Simple (Обучающая)
 * 4 остановки, 1 линейный маршрут
 * Идеально для знакомства с игрой
 */
const simpleMap: PresetMap = {
  id: 'simple',
  name: 'Simple Route',
  description: 'Обучающая карта: 4 остановки, 1 простой маршрут',
  difficulty: 'easy',
  data: {
    stops: [
      { id: 'stop_s1', name: 'Start Station', x: 200, y: 300 },
      { id: 'stop_s2', name: 'Park Avenue', x: 400, y: 300 },
      { id: 'stop_s3', name: 'Shopping Mall', x: 600, y: 300 },
      { id: 'stop_s4', name: 'End Terminal', x: 800, y: 300 },
    ],
    routes: [
      {
        id: 'route_s1',
        name: 'Line 1',
        stopIds: ['stop_s1', 'stop_s2', 'stop_s3', 'stop_s4'],
        color: '#00aaff',
        loop: false,
      },
    ],
    buses: [],
    camera: {
      x: 400,
      y: 300,
      scale: 1,
    },
  },
};

/**
 * Пресет 2: City (Городская)
 * 8 остановок, 2 маршрута с пересадкой
 * Средняя сложность
 */
const cityMap: PresetMap = {
  id: 'city',
  name: 'City Network',
  description: 'Городская сеть: 8 остановок, 2 маршрута с пересадочным узлом',
  difficulty: 'medium',
  data: {
    stops: [
      { id: 'stop_c1', name: 'Central Station', x: 400, y: 300 },
      { id: 'stop_c2', name: 'North Park', x: 400, y: 150 },
      { id: 'stop_c3', name: 'University', x: 250, y: 150 },
      { id: 'stop_c4', name: 'Hospital', x: 250, y: 300 },
      { id: 'stop_c5', name: 'South Mall', x: 400, y: 450 },
      { id: 'stop_c6', name: 'East Side', x: 600, y: 300 },
      { id: 'stop_c7', name: 'Business Center', x: 600, y: 150 },
      { id: 'stop_c8', name: 'West End', x: 200, y: 450 },
    ],
    routes: [
      {
        id: 'route_c1',
        name: 'North-South Line',
        stopIds: ['stop_c2', 'stop_c1', 'stop_c5'],
        color: '#ff6600',
        loop: false,
      },
      {
        id: 'route_c2',
        name: 'East-West Line',
        stopIds: ['stop_c3', 'stop_c4', 'stop_c1', 'stop_c6', 'stop_c7'],
        color: '#00aa44',
        loop: false,
      },
    ],
    buses: [],
    camera: {
      x: 400,
      y: 300,
      scale: 1,
    },
  },
};

/**
 * Пресет 3: Complex (Сложная)
 * 12 остановок, 4 маршрута включая зацикленный
 * Высокая сложность, много пересадок
 */
const complexMap: PresetMap = {
  id: 'complex',
  name: 'Metro Hub',
  description: 'Метро-узел: 12 остановок, 4 маршрута, зацикленная линия',
  difficulty: 'hard',
  data: {
    stops: [
      { id: 'stop_m1', name: 'Main Terminal', x: 500, y: 400 },
      { id: 'stop_m2', name: 'Airport', x: 800, y: 200 },
      { id: 'stop_m3', name: 'Train Station', x: 200, y: 200 },
      { id: 'stop_m4', name: 'Port', x: 800, y: 600 },
      { id: 'stop_m5', name: 'Old Town', x: 200, y: 600 },
      { id: 'stop_m6', name: 'Business District', x: 500, y: 200 },
      { id: 'stop_m7', name: 'Stadium', x: 700, y: 400 },
      { id: 'stop_m8', name: 'Zoo', x: 300, y: 400 },
      { id: 'stop_m9', name: 'Beach', x: 700, y: 600 },
      { id: 'stop_m10', name: 'Museum', x: 300, y: 200 },
      { id: 'stop_m11', name: 'Convention Center', x: 600, y: 500 },
      { id: 'stop_m12', name: 'Tech Park', x: 400, y: 300 },
    ],
    routes: [
      {
        id: 'route_m1',
        name: 'Airport Express',
        stopIds: ['stop_m1', 'stop_m6', 'stop_m2'],
        color: '#ff0000',
        loop: false,
      },
      {
        id: 'route_m2',
        name: 'Harbor Line',
        stopIds: ['stop_m3', 'stop_m1', 'stop_m7', 'stop_m4'],
        color: '#0066ff',
        loop: false,
      },
      {
        id: 'route_m3',
        name: 'Historic Circle',
        stopIds: ['stop_m5', 'stop_m8', 'stop_m10', 'stop_m6', 'stop_m1'],
        color: '#ff9900',
        loop: true, // Зацикленный маршрут!
      },
      {
        id: 'route_m4',
        name: 'Suburban Link',
        stopIds: ['stop_m9', 'stop_m11', 'stop_m12', 'stop_m1', 'stop_m5'],
        color: '#9900ff',
        loop: false,
      },
    ],
    buses: [],
    camera: {
      x: 500,
      y: 400,
      scale: 0.8,
    },
  },
};

/**
 * Пресет 4: Grid (Сетка)
 * 9 остановок в форме сетки 3x3
 * Для тестирования и экспериментов
 */
const gridMap: PresetMap = {
  id: 'grid',
  name: 'Grid Test',
  description: 'Тестовая сетка 3x3: 9 остановок для экспериментов',
  difficulty: 'medium',
  data: {
    stops: [
      { id: 'stop_g1', name: 'G1', x: 200, y: 200 },
      { id: 'stop_g2', name: 'G2', x: 400, y: 200 },
      { id: 'stop_g3', name: 'G3', x: 600, y: 200 },
      { id: 'stop_g4', name: 'G4', x: 200, y: 400 },
      { id: 'stop_g5', name: 'G5', x: 400, y: 400 },
      { id: 'stop_g6', name: 'G6', x: 600, y: 400 },
      { id: 'stop_g7', name: 'G7', x: 200, y: 600 },
      { id: 'stop_g8', name: 'G8', x: 400, y: 600 },
      { id: 'stop_g9', name: 'G9', x: 600, y: 600 },
    ],
    routes: [
      {
        id: 'route_g1',
        name: 'Horizontal',
        stopIds: ['stop_g1', 'stop_g2', 'stop_g3'],
        color: '#00ff00',
        loop: false,
      },
      {
        id: 'route_g2',
        name: 'Vertical',
        stopIds: ['stop_g1', 'stop_g4', 'stop_g7'],
        color: '#0000ff',
        loop: false,
      },
      {
        id: 'route_g3',
        name: 'Diagonal Loop',
        stopIds: ['stop_g7', 'stop_g8', 'stop_g9', 'stop_g6', 'stop_g3', 'stop_g2', 'stop_g1'],
        color: '#ffff00',
        loop: true,
      },
    ],
    buses: [],
    camera: {
      x: 400,
      y: 400,
      scale: 1,
    },
  },
};

// Экспорт всех пресетов
export const presetMaps: PresetMap[] = [
  simpleMap,
  cityMap,
  complexMap,
  gridMap,
];

// Экспорт отдельных пресетов для импорта
export { simpleMap, cityMap, complexMap, gridMap };
