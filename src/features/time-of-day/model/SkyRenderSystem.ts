/**
 * SkyRenderSystem
 *
 * Система рендеринга неба и фона в зависимости от времени суток.
 * Меняет цвет неба плавно от периода суток.
 *
 * @module features/time-of-day/model
 */

import type { System, SystemContext } from '@/shared/lib/game-core/EntityManagerService';
import { canvasRendererService } from '@/shared/lib/game-core/CanvasRendererService';
import { timeService, TimePeriod } from './TimeService';

// Цвета неба для разных периодов суток (в формате RGBA)
const SKY_COLORS: Record<TimePeriod, { r: number; g: number; b: number }> = {
  [TimePeriod.NIGHT]: { r: 10, g: 10, b: 30 },      // Тёмно-синяя ночь
  [TimePeriod.MORNING]: { r: 255, g: 200, b: 100 }, // Тёплый рассвет
  [TimePeriod.DAY]: { r: 135, g: 206, b: 235 },     // Голубое небо
  [TimePeriod.EVENING]: { r: 255, g: 140, b: 80 },  // Оранжевый закат
};

export const skyRenderSystem: System = {
  name: 'SkyRenderSystem',
  requiredComponents: [],

  update: (_context: SystemContext, _entities: number[]) => {
    // Используем "сырой" контекст без трансформации камеры
    const ctx = canvasRendererService.getRawLayerContext('background');

    if (!ctx) return;

    const period = timeService.getPeriod();
    const skyColor = SKY_COLORS[period as TimePeriod];

    // Получаем размеры Canvas
    const config = canvasRendererService.getConfig();
    const width = config.width;
    const height = config.height;

    // Рисуем градиентное небо (без трансформации камеры!)
    const gradient = ctx.createLinearGradient(0, 0, 0, height);

    // Верхняя часть неба (темнее)
    gradient.addColorStop(0, `rgb(${skyColor.r * 0.7}, ${skyColor.g * 0.7}, ${skyColor.b * 0.7})`);
    // Средняя часть
    gradient.addColorStop(0.5, `rgb(${skyColor.r}, ${skyColor.g}, ${skyColor.b})`);
    // Нижняя часть (светлее)
    gradient.addColorStop(1, `rgb(${Math.min(255, skyColor.r * 1.2)}, ${Math.min(255, skyColor.g * 1.2)}, ${Math.min(255, skyColor.b * 1.2)})`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Добавляем звёзды ночью
    if (period === TimePeriod.NIGHT) {
      drawStars(ctx, width, height);
    }

    // Добавляем солнце или луну
    drawCelestialBody(ctx, width, height);
  },
};

/**
 * Нарисовать звёзды на небе
 */
function drawStars(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  // Используем детерминированный "случайный" генератор для звёзд
  // (чтобы звёзды не мерцали при каждом кадре)
  const starCount = 100;
  const seed = 12345; // Фиксированный seed для постоянства

  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';

  for (let i = 0; i < starCount; i++) {
    // Псевдослучайные координаты на основе seed
    const x = ((Math.sin(seed + i) * 10000) % width + width) % width;
    const y = ((Math.cos(seed + i * 2) * 10000) % (height / 2) + height / 2) % (height / 2);
    const size = ((Math.sin(seed + i * 3) * 2) + 1);

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Нарисовать солнце или луну
 */
function drawCelestialBody(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const time = timeService.getTime();
  const hours = time.hours + time.minutes / 60;

  // Вычисляем позицию небесного тела по дуге
  // 6:00 = восход (справа), 12:00 = зенит, 18:00 = закат (слева), ночь = снизу
  let angle: number;
  let isSun = true;

  if (hours >= 6 && hours < 18) {
    // День - солнце
    isSun = true;
    // Угол от 0 (восход) до PI (закат)
    angle = ((hours - 6) / 12) * Math.PI;
  } else {
    // Ночь - луна
    isSun = false;
    // Угол для луны (движется в противоположную сторону)
    angle = ((hours + 6) % 24 / 12) * Math.PI;
  }

  // Позиция по дуге
  const arcRadius = Math.min(width, height) * 0.4;
  const centerX = width / 2;
  const centerY = height * 0.8;

  const x = centerX + Math.cos(angle) * arcRadius;
  const y = centerY - Math.sin(angle) * arcRadius * 0.6; // Сплюснутая дуга

  const radius = 30;

  if (isSun) {
    // Солнце с сиянием
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
    gradient.addColorStop(0, 'rgba(255, 255, 200, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 200, 100, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 150, 50, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
    ctx.fill();

    // Ядро солнца
    ctx.fillStyle = '#ffff80';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Луна с кратерами
    const gradient = ctx.createRadialGradient(x - 5, y - 5, 0, x, y, radius);
    gradient.addColorStop(0, 'rgba(220, 220, 255, 1)');
    gradient.addColorStop(1, 'rgba(180, 180, 200, 1)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Кратеры
    ctx.fillStyle = 'rgba(150, 150, 170, 0.5)';
    const craters = [
      { dx: -10, dy: -5, r: 5 },
      { dx: 8, dy: 8, r: 7 },
      { dx: -5, dy: 12, r: 4 },
      { dx: 12, dy: -8, r: 3 },
    ];

    for (const crater of craters) {
      ctx.beginPath();
      ctx.arc(x + crater.dx, y + crater.dy, crater.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
