/**
 * Пресетные карты
 *
 * 10 готовых карт с нарастающей сложностью.
 * Все маршруты цикличные (loop: true), все остановки связаны.
 *
 * Сложность: 1-3 (easy), 4-6 (medium), 7-10 (hard)
 *
 * @module features/map-save/model
 */

import type { PresetMap } from './types';

// Общие настройки спавна для всех остановок
const DEFAULT_SPAWN = { morning: 20, day: 20, evening: 20, night: 20 }; // 3 пасс/мин

/**
 * Уровень 1: "Учебный круг" (4 остановки, 1 маршрут)
 * Простой кольцевой маршрут для обучения
 */
const tutorialMap: PresetMap = {
  id: 'tutorial',
  name: 'Учебный круг',
  description: 'Простой кольцевой маршрут: 4 остановки',
  difficulty: 'easy',
  data: {
    stops: [
      { id: 'stop_t1', name: 'Вокзал', x: 300, y: 200, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_t2', name: 'Парк', x: 500, y: 200, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_t3', name: 'ТЦ "Плаза"', x: 500, y: 400, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_t4', name: 'Школа', x: 300, y: 400, spawnRates: DEFAULT_SPAWN },
    ],
    routes: [
      {
        id: 'route_t1',
        name: 'Кольцо А',
        stopIds: ['stop_t1', 'stop_t2', 'stop_t3', 'stop_t4'],
        color: '#4CAF50',
        loop: true,
      },
    ],
    buses: [],
    camera: { x: 400, y: 300, scale: 1.2 },
  },
};

/**
 * Уровень 2: "Пригород" (5 остановок, 1 маршрут)
 * Удлинённый маршрут с большим расстоянием
 */
const suburbanMap: PresetMap = {
  id: 'suburban',
  name: 'Пригород',
  description: 'Удлинённый маршрут: 5 остановок',
  difficulty: 'easy',
  data: {
    stops: [
      { id: 'stop_s1', name: 'Центр', x: 200, y: 300, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_s2', name: 'Рынок', x: 350, y: 300, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_s3', name: 'Стадион', x: 500, y: 300, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_s4', name: 'Университет', x: 650, y: 300, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_s5', name: 'Аэропорт', x: 800, y: 300, spawnRates: { ...DEFAULT_SPAWN, morning: 4, evening: 5 } },
    ],
    routes: [
      {
        id: 'route_s1',
        name: 'Пригородный экспресс',
        stopIds: ['stop_s1', 'stop_s2', 'stop_s3', 'stop_s4', 'stop_s5'],
        color: '#2196F3',
        loop: true,
      },
    ],
    buses: [],
    camera: { x: 500, y: 300, scale: 1 },
  },
};

/**
 * Уровень 3: "Квартал" (6 остановок, 2 маршрута)
 * Два простых маршрута с одной пересадкой
 */
const quarterMap: PresetMap = {
  id: 'quarter',
  name: 'Квартал',
  description: 'Два маршрута: 6 остановок, 1 пересадка',
  difficulty: 'easy',
  data: {
    stops: [
      { id: 'stop_q1', name: 'Главная', x: 400, y: 300, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_q2', name: 'Северная', x: 400, y: 150, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_q3', name: 'Восточная', x: 550, y: 300, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_q4', name: 'Южная', x: 400, y: 450, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_q5', name: 'Западная', x: 250, y: 300, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_q6', name: 'Парковая', x: 550, y: 150, spawnRates: DEFAULT_SPAWN },
    ],
    routes: [
      {
        id: 'route_q1',
        name: 'Север-Юг',
        stopIds: ['stop_q2', 'stop_q1', 'stop_q4'],
        color: '#FF5722',
        loop: true,
      },
      {
        id: 'route_q2',
        name: 'Восток-Запад',
        stopIds: ['stop_q5', 'stop_q1', 'stop_q3', 'stop_q6'],
        color: '#9C27B0',
        loop: true,
      },
    ],
    buses: [],
    camera: { x: 400, y: 300, scale: 1.1 },
  },
};

/**
 * Уровень 4: "Район" (8 остановок, 2 маршрута)
 * Два пересекающихся маршрута
 */
const districtMap: PresetMap = {
  id: 'district',
  name: 'Район',
  description: 'Два маршрута: 8 остановок, 2 пересадки',
  difficulty: 'medium',
  data: {
    stops: [
      { id: 'stop_d1', name: 'Центральная', x: 400, y: 300, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_d2', name: 'Парк Победы', x: 400, y: 150, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_d3', name: 'Технопарк', x: 550, y: 200, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_d4', name: 'Больница', x: 550, y: 300, spawnRates: { ...DEFAULT_SPAWN, morning: 4, day: 6 } },
      { id: 'stop_d5', name: 'ТЦ "Галерея"', x: 400, y: 450, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_d6', name: 'Ж/Д Вокзал', x: 250, y: 300, spawnRates: { ...DEFAULT_SPAWN, morning: 5, evening: 5 } },
      { id: 'stop_d7', name: 'Школа №5', x: 250, y: 150, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_d8', name: 'Пляж', x: 550, y: 450, spawnRates: { ...DEFAULT_SPAWN, day: 8, evening: 6 } },
    ],
    routes: [
      {
        id: 'route_d1',
        name: 'Зелёная линия',
        stopIds: ['stop_d2', 'stop_d3', 'stop_d4', 'stop_d8', 'stop_d5', 'stop_d1'],
        color: '#4CAF50',
        loop: true,
      },
      {
        id: 'route_d2',
        name: 'Синяя линия',
        stopIds: ['stop_d7', 'stop_d2', 'stop_d1', 'stop_d6', 'stop_d5'],
        color: '#2196F3',
        loop: true,
      },
    ],
    buses: [],
    camera: { x: 400, y: 300, scale: 1 },
  },
};

/**
 * Уровень 5: "Перекрёсток" (9 остановок, 3 маршрута)
 * Три маршрута с несколькими пересадками
 */
const crossroadMap: PresetMap = {
  id: 'crossroad',
  name: 'Перекрёсток',
  description: 'Три маршрута: 9 остановок, пересадочный узел',
  difficulty: 'medium',
  data: {
    stops: [
      { id: 'stop_x1', name: 'Хаба', x: 400, y: 300, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_x2', name: 'Север-1', x: 400, y: 150, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_x3', name: 'Север-2', x: 550, y: 150, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_x4', name: 'Восток', x: 550, y: 300, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_x5', name: 'Юг-1', x: 550, y: 450, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_x6', name: 'Юг-2', x: 400, y: 450, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_x7', name: 'Запад', x: 250, y: 300, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_x8', name: 'Запад-2', x: 250, y: 150, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_x9', name: 'Запад-3', x: 250, y: 450, spawnRates: DEFAULT_SPAWN },
    ],
    routes: [
      {
        id: 'route_x1',
        name: 'Кольцо А',
        stopIds: ['stop_x1', 'stop_x2', 'stop_x3', 'stop_x4'],
        color: '#FF5722',
        loop: true,
      },
      {
        id: 'route_x2',
        name: 'Кольцо Б',
        stopIds: ['stop_x1', 'stop_x4', 'stop_x5', 'stop_x6', 'stop_x9'],
        color: '#9C27B0',
        loop: true,
      },
      {
        id: 'route_x3',
        name: 'Кольцо В',
        stopIds: ['stop_x1', 'stop_x7', 'stop_x8', 'stop_x2'],
        color: '#FFC107',
        loop: true,
      },
    ],
    buses: [],
    camera: { x: 400, y: 300, scale: 1 },
  },
};

/**
 * Уровень 6: "Сетка" (12 остановок, 3 маршрута)
 * Сетка 4x3 с тремя маршрутами
 */
const gridMap: PresetMap = {
  id: 'grid',
  name: 'Сетка',
  description: 'Сетка 4x3: 12 остановок, 3 маршрута',
  difficulty: 'medium',
  data: {
    stops: [
      { id: 'stop_g1', name: 'A1', x: 200, y: 150, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_g2', name: 'A2', x: 350, y: 150, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_g3', name: 'A3', x: 500, y: 150, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_g4', name: 'A4', x: 650, y: 150, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_g5', name: 'B1', x: 200, y: 300, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_g6', name: 'B2', x: 350, y: 300, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_g7', name: 'B3', x: 500, y: 300, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_g8', name: 'B4', x: 650, y: 300, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_g9', name: 'C1', x: 200, y: 450, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_g10', name: 'C2', x: 350, y: 450, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_g11', name: 'C3', x: 500, y: 450, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_g12', name: 'C4', x: 650, y: 450, spawnRates: DEFAULT_SPAWN },
    ],
    routes: [
      {
        id: 'route_g1',
        name: 'Горизонталь',
        stopIds: ['stop_g1', 'stop_g2', 'stop_g3', 'stop_g4', 'stop_g8', 'stop_g7', 'stop_g6', 'stop_g5'],
        color: '#00BCD4',
        loop: true,
      },
      {
        id: 'route_g2',
        name: 'Вертикаль',
        stopIds: ['stop_g5', 'stop_g6', 'stop_g7', 'stop_g8', 'stop_g12', 'stop_g11', 'stop_g10', 'stop_g9'],
        color: '#E91E63',
        loop: true,
      },
      {
        id: 'route_g3',
        name: 'Диагональ',
        stopIds: ['stop_g1', 'stop_g5', 'stop_g9', 'stop_g10', 'stop_g11', 'stop_g12', 'stop_g8', 'stop_g4'],
        color: '#FF9800',
        loop: true,
      },
    ],
    buses: [],
    camera: { x: 425, y: 300, scale: 0.9 },
  },
};

/**
 * Уровень 7: "Метро" (14 остановок, 4 маршрута)
 * Четыре маршрута с множественными пересадками
 */
const metroMap: PresetMap = {
  id: 'metro',
  name: 'Метро',
  description: 'Четыре маршрута: 14 остановок, 4 пересадки',
  difficulty: 'hard',
  data: {
    stops: [
      { id: 'stop_m1', name: 'Центральная', x: 400, y: 300, spawnRates: { ...DEFAULT_SPAWN, morning: 6, evening: 6 } },
      { id: 'stop_m2', name: 'Вокзал', x: 400, y: 150, spawnRates: { ...DEFAULT_SPAWN, morning: 5, evening: 5 } },
      { id: 'stop_m3', name: 'Аэропорт', x: 700, y: 150, spawnRates: { ...DEFAULT_SPAWN, morning: 5, day: 4 } },
      { id: 'stop_m4', name: 'Парк', x: 700, y: 300, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_m5', name: 'Стадион', x: 700, y: 450, spawnRates: { ...DEFAULT_SPAWN, evening: 7 } },
      { id: 'stop_m6', name: 'ТЦ', x: 400, y: 450, spawnRates: { ...DEFAULT_SPAWN, day: 7, evening: 7 } },
      { id: 'stop_m7', name: 'Университет', x: 150, y: 450, spawnRates: { ...DEFAULT_SPAWN, morning: 5 } },
      { id: 'stop_m8', name: 'Больница', x: 150, y: 300, spawnRates: { ...DEFAULT_SPAWN, day: 6 } },
      { id: 'stop_m9', name: 'Школа', x: 150, y: 150, spawnRates: { ...DEFAULT_SPAWN, morning: 6 } },
      { id: 'stop_m10', name: 'Порт', x: 550, y: 225, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_m11', name: 'Бизнес-центр', x: 550, y: 375, spawnRates: { ...DEFAULT_SPAWN, morning: 6, evening: 6 } },
      { id: 'stop_m12', name: 'Музей', x: 275, y: 225, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_m13', name: 'Зоопарк', x: 275, y: 375, spawnRates: { ...DEFAULT_SPAWN, day: 5 } },
      { id: 'stop_m14', name: 'Пляж', x: 850, y: 300, spawnRates: { ...DEFAULT_SPAWN, day: 8, evening: 6 } },
    ],
    routes: [
      {
        id: 'route_m1',
        name: 'Красная линия',
        stopIds: ['stop_m1', 'stop_m2', 'stop_m3', 'stop_m4', 'stop_m14'],
        color: '#F44336',
        loop: true,
      },
      {
        id: 'route_m2',
        name: 'Синяя линия',
        stopIds: ['stop_m1', 'stop_m10', 'stop_m11', 'stop_m5', 'stop_m6'],
        color: '#2196F3',
        loop: true,
      },
      {
        id: 'route_m3',
        name: 'Зелёная линия',
        stopIds: ['stop_m7', 'stop_m6', 'stop_m1', 'stop_m2', 'stop_m9'],
        color: '#4CAF50',
        loop: true,
      },
      {
        id: 'route_m4',
        name: 'Жёлтая линия',
        stopIds: ['stop_m8', 'stop_m12', 'stop_m2', 'stop_m10', 'stop_m11', 'stop_m13'],
        color: '#FFEB3B',
        loop: true,
      },
    ],
    buses: [],
    camera: { x: 500, y: 300, scale: 0.85 },
  },
};

/**
 * Уровень 8: "Мегаполис" (16 остановок, 4 маршрута)
 * Большая карта с длинными маршрутами
 */
const megapolisMap: PresetMap = {
  id: 'megapolis',
  name: 'Мегаполис',
  description: 'Четыре маршрута: 16 остановок, сложная сеть',
  difficulty: 'hard',
  data: {
    stops: [
      { id: 'stop_p1', name: 'Главный вокзал', x: 400, y: 300, spawnRates: { ...DEFAULT_SPAWN, morning: 7, evening: 7 } },
      { id: 'stop_p2', name: 'Северный порт', x: 400, y: 100, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_p3', name: 'Аэропорт', x: 750, y: 100, spawnRates: { ...DEFAULT_SPAWN, morning: 6 } },
      { id: 'stop_p4', name: 'Технопарк', x: 750, y: 250, spawnRates: { ...DEFAULT_SPAWN, morning: 6, day: 5 } },
      { id: 'stop_p5', name: 'Бизнес-квартал', x: 750, y: 400, spawnRates: { ...DEFAULT_SPAWN, morning: 7, evening: 7 } },
      { id: 'stop_p6', name: 'Южный терминал', x: 750, y: 550, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_p7', name: 'Пляжный район', x: 400, y: 550, spawnRates: { ...DEFAULT_SPAWN, day: 7, evening: 6 } },
      { id: 'stop_p8', name: 'Старый город', x: 100, y: 550, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_p9', name: 'Западный рынок', x: 100, y: 400, spawnRates: { ...DEFAULT_SPAWN, day: 6 } },
      { id: 'stop_p10', name: 'Больница', x: 100, y: 250, spawnRates: { ...DEFAULT_SPAWN, day: 6 } },
      { id: 'stop_p11', name: 'Университет', x: 100, y: 100, spawnRates: { ...DEFAULT_SPAWN, morning: 6 } },
      { id: 'stop_p12', name: 'Парк культуры', x: 250, y: 200, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_p13', name: 'Стадион', x: 600, y: 200, spawnRates: { ...DEFAULT_SPAWN, evening: 8 } },
      { id: 'stop_p14', name: 'Концертный зал', x: 600, y: 450, spawnRates: { ...DEFAULT_SPAWN, evening: 7 } },
      { id: 'stop_p15', name: 'Выставочный центр', x: 250, y: 450, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_p16', name: 'Олимпийская деревня', x: 550, y: 325, spawnRates: DEFAULT_SPAWN },
    ],
    routes: [
      {
        id: 'route_p1',
        name: 'Северное кольцо',
        stopIds: ['stop_p1', 'stop_p2', 'stop_p3', 'stop_p4', 'stop_p13', 'stop_p12'],
        color: '#E91E63',
        loop: true,
      },
      {
        id: 'route_p2',
        name: 'Восточное кольцо',
        stopIds: ['stop_p4', 'stop_p5', 'stop_p16', 'stop_p14', 'stop_p6', 'stop_p3'],
        color: '#3F51B5',
        loop: true,
      },
      {
        id: 'route_p3',
        name: 'Южное кольцо',
        stopIds: ['stop_p1', 'stop_p16', 'stop_p5', 'stop_p6', 'stop_p7', 'stop_p8', 'stop_p15'],
        color: '#009688',
        loop: true,
      },
      {
        id: 'route_p4',
        name: 'Западное кольцо',
        stopIds: ['stop_p1', 'stop_p12', 'stop_p11', 'stop_p10', 'stop_p9', 'stop_p15', 'stop_p8'],
        color: '#FF5722',
        loop: true,
      },
    ],
    buses: [],
    camera: { x: 425, y: 325, scale: 0.75 },
  },
};

/**
 * Уровень 9: "Агломерация" (18 остановок, 5 маршрутов)
 * Пять маршрутов с высокой сложностью
 */
const agglomerationMap: PresetMap = {
  id: 'agglomeration',
  name: 'Агломерация',
  description: 'Пять маршрутов: 18 остановок, высокая сложность',
  difficulty: 'hard',
  data: {
    stops: [
      { id: 'stop_a1', name: 'Центр', x: 450, y: 300, spawnRates: { ...DEFAULT_SPAWN, morning: 8, evening: 8 } },
      { id: 'stop_a2', name: 'Север-1', x: 450, y: 150, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_a3', name: 'Север-2', x: 600, y: 150, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_a4', name: 'Север-3', x: 750, y: 150, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_a5', name: 'Восток-1', x: 750, y: 300, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_a6', name: 'Восток-2', x: 750, y: 450, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_a7', name: 'Юг-1', x: 600, y: 450, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_a8', name: 'Юг-2', x: 450, y: 450, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_a9', name: 'Юг-3', x: 300, y: 450, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_a10', name: 'Запад-1', x: 150, y: 450, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_a11', name: 'Запад-2', x: 150, y: 300, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_a12', name: 'Запад-3', x: 150, y: 150, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_a13', name: 'СЗ-1', x: 300, y: 150, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_a14', name: 'СВ-1', x: 600, y: 225, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_a15', name: 'СВ-2', x: 675, y: 300, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_a16', name: 'ЮВ-1', x: 675, y: 375, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_a17', name: 'ЮЗ-1', x: 300, y: 375, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_a18', name: 'СЗ-2', x: 375, y: 225, spawnRates: DEFAULT_SPAWN },
    ],
    routes: [
      {
        id: 'route_a1',
        name: 'Внешнее кольцо',
        stopIds: ['stop_a1', 'stop_a2', 'stop_a3', 'stop_a4', 'stop_a5', 'stop_a6', 'stop_a7', 'stop_a8', 'stop_a9', 'stop_a10', 'stop_a11', 'stop_a12'],
        color: '#F44336',
        loop: true,
      },
      {
        id: 'route_a2',
        name: 'Внутреннее кольцо',
        stopIds: ['stop_a1', 'stop_a18', 'stop_a13', 'stop_a12', 'stop_a11', 'stop_a10', 'stop_a9', 'stop_a8'],
        color: '#2196F3',
        loop: true,
      },
      {
        id: 'route_a3',
        name: 'Северо-восточная',
        stopIds: ['stop_a1', 'stop_a18', 'stop_a14', 'stop_a15', 'stop_a5', 'stop_a4'],
        color: '#4CAF50',
        loop: true,
      },
      {
        id: 'route_a4',
        name: 'Юго-западная',
        stopIds: ['stop_a1', 'stop_a17', 'stop_a10', 'stop_a9', 'stop_a8'],
        color: '#FF9800',
        loop: true,
      },
      {
        id: 'route_a5',
        name: 'Юго-восточная',
        stopIds: ['stop_a1', 'stop_a18', 'stop_a14', 'stop_a16', 'stop_a7', 'stop_a6'],
        color: '#9C27B0',
        loop: true,
      },
    ],
    buses: [],
    camera: { x: 450, y: 300, scale: 0.7 },
  },
};

/**
 * Уровень 10: "Империя" (20 остановок, 6 маршрутов)
 * Максимальная сложность: 6 маршрутов, 20 остановок
 */
const empireMap: PresetMap = {
  id: 'empire',
  name: 'Империя',
  description: 'Шесть маршрутов: 20 остановок, максимальная сложность',
  difficulty: 'hard',
  data: {
    stops: [
      { id: 'stop_e1', name: 'Имперский центр', x: 500, y: 300, spawnRates: { ...DEFAULT_SPAWN, morning: 10, evening: 10 } },
      { id: 'stop_e2', name: 'Космопорт', x: 500, y: 100, spawnRates: { ...DEFAULT_SPAWN, morning: 7 } },
      { id: 'stop_e3', name: 'Небоскрёбы', x: 700, y: 100, spawnRates: { ...DEFAULT_SPAWN, morning: 8, evening: 8 } },
      { id: 'stop_e4', name: 'Технополис', x: 900, y: 100, spawnRates: { ...DEFAULT_SPAWN, morning: 7, day: 6 } },
      { id: 'stop_e5', name: 'Научный квартал', x: 900, y: 250, spawnRates: { ...DEFAULT_SPAWN, day: 7 } },
      { id: 'stop_e6', name: 'Деловой центр', x: 900, y: 400, spawnRates: { ...DEFAULT_SPAWN, morning: 8, evening: 8 } },
      { id: 'stop_e7', name: 'Портовая зона', x: 900, y: 550, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_e8', name: 'Курортный район', x: 700, y: 550, spawnRates: { ...DEFAULT_SPAWN, day: 8, evening: 7 } },
      { id: 'stop_e9', name: 'Олимпийский парк', x: 500, y: 550, spawnRates: { ...DEFAULT_SPAWN, evening: 8 } },
      { id: 'stop_e10', name: 'Исторический центр', x: 300, y: 550, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_e11', name: 'Арт-квартал', x: 100, y: 550, spawnRates: { ...DEFAULT_SPAWN, day: 6, evening: 6 } },
      { id: 'stop_e12', name: 'Западный терминал', x: 100, y: 400, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_e13', name: 'Медицинский центр', x: 100, y: 250, spawnRates: { ...DEFAULT_SPAWN, day: 7 } },
      { id: 'stop_e14', name: 'Образовательный хаб', x: 100, y: 100, spawnRates: { ...DEFAULT_SPAWN, morning: 7 } },
      { id: 'stop_e15', name: 'Парк развлечений', x: 300, y: 100, spawnRates: { ...DEFAULT_SPAWN, day: 8, evening: 8 } },
      { id: 'stop_e16', name: 'Спортивный комплекс', x: 700, y: 225, spawnRates: { ...DEFAULT_SPAWN, evening: 9 } },
      { id: 'stop_e17', name: 'Выставочный комплекс', x: 700, y: 375, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_e18', name: 'Конгресс-центр', x: 300, y: 375, spawnRates: { ...DEFAULT_SPAWN, morning: 6 } },
      { id: 'stop_e19', name: 'Ботанический сад', x: 300, y: 225, spawnRates: DEFAULT_SPAWN },
      { id: 'stop_e20', name: 'Речной вокзал', x: 500, y: 175, spawnRates: DEFAULT_SPAWN },
    ],
    routes: [
      {
        id: 'route_e1',
        name: 'Северное экспресс',
        stopIds: ['stop_e1', 'stop_e20', 'stop_e2', 'stop_e3', 'stop_e4', 'stop_e5'],
        color: '#D32F2F',
        loop: true,
      },
      {
        id: 'route_e2',
        name: 'Восточное кольцо',
        stopIds: ['stop_e5', 'stop_e6', 'stop_e7', 'stop_e8', 'stop_e17', 'stop_e16'],
        color: '#1976D2',
        loop: true,
      },
      {
        id: 'route_e3',
        name: 'Южное кольцо',
        stopIds: ['stop_e1', 'stop_e17', 'stop_e8', 'stop_e9', 'stop_e10', 'stop_e11'],
        color: '#388E3C',
        loop: true,
      },
      {
        id: 'route_e4',
        name: 'Западное кольцо',
        stopIds: ['stop_e1', 'stop_e18', 'stop_e11', 'stop_e12', 'stop_e13', 'stop_e14'],
        color: '#FBC02D',
        loop: true,
      },
      {
        id: 'route_e5',
        name: 'Северо-западная',
        stopIds: ['stop_e1', 'stop_e19', 'stop_e14', 'stop_e15', 'stop_e2', 'stop_e20'],
        color: '#7B1FA2',
        loop: true,
      },
      {
        id: 'route_e6',
        name: 'Центральная связка',
        stopIds: ['stop_e1', 'stop_e18', 'stop_e10', 'stop_e9', 'stop_e17', 'stop_e6', 'stop_e16', 'stop_e3'],
        color: '#0097A7',
        loop: true,
      },
    ],
    buses: [],
    camera: { x: 500, y: 325, scale: 0.65 },
  },
};

// Экспорт всех пресетов в порядке возрастания сложности
export const presetMaps: PresetMap[] = [
  tutorialMap,      // Уровень 1: 4 остановки, 1 маршрут
  suburbanMap,      // Уровень 2: 5 остановок, 1 маршрут
  quarterMap,       // Уровень 3: 6 остановок, 2 маршрута
  districtMap,      // Уровень 4: 8 остановок, 2 маршрута
  crossroadMap,     // Уровень 5: 9 остановок, 3 маршрута
  gridMap,          // Уровень 6: 12 остановок, 3 маршрута
  metroMap,         // Уровень 7: 14 остановок, 4 маршрута
  megapolisMap,     // Уровень 8: 16 остановок, 4 маршрута
  agglomerationMap, // Уровень 9: 18 остановок, 5 маршрутов
  empireMap,        // Уровень 10: 20 остановок, 6 маршрутов
];

// Экспорт отдельных пресетов
export {
  tutorialMap,
  suburbanMap,
  quarterMap,
  districtMap,
  crossroadMap,
  gridMap,
  metroMap,
  megapolisMap,
  agglomerationMap,
  empireMap,
};
