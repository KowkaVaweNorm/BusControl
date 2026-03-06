/**
 * Типы автобусов и система улучшений
 * 
 * Конфигурация всех доступных типов автобусов и их характеристик.
 * Улучшения независимы и легко расширяемы — можно добавлять/удалять/менять
 * без изменения основной логики.
 * 
 * @module entities/bus/model
 */

// ============================================
// Типы и интерфейсы
// ============================================

/**
 * Класс комфорта автобуса
 */
export type ComfortClass = 'A+' | 'A' | 'B' | 'C' | 'D';

/**
 * Уникальный идентификатор типа автобуса
 */
export type BusTypeId = 'liaz' | 'paz' | 'volgabus' | 'kamaz';

/**
 * Конфигурация улучшения автобуса
 * 
 * @property incomeMultiplier - множитель дохода (1.0 = базовый, 1.5 = +50%)
 * @property description - название улучшения (например, "Телевизор с рекламой")
 * @property costMultiplier - множитель стоимости прокачки (опционально)
 */
export interface UpgradeConfig {
  level: number;
  incomeMultiplier: number;
  description: string;
  costMultiplier?: number; // Опционально: если нужно менять стоимость прокачки
}

/**
 * Конфигурация типа автобуса
 * 
 * @property id - уникальный идентификатор
 * @property name - отображаемое название
 * @property icon - эмодзи/иконка для UI
 * @property baseCapacity - базовая вместимость (пассажиров)
 * @property baseSpeed - базовая скорость (пикселей/сек)
 * @property comfort - класс комфорта
 * @property basePrice - базовая стоимость покупки (₽)
 * @property color - цвет для рендеринга (hex)
 * @property upgrades - массив улучшений по уровням
 */
export interface BusTypeConfig {
  id: BusTypeId;
  name: string;
  icon: string;
  baseCapacity: number;
  baseSpeed: number;
  comfort: ComfortClass;
  basePrice: number;
  color: string;
  upgrades: UpgradeConfig[];
}

// ============================================
// Конфигурация улучшений (легко редактировать)
// ============================================

/**
 * Базовая линия улучшений для всех автобусов
 * 
 * Чтобы добавить новое улучшение:
 * 1. Добавить новый объект в массив UPGRADES_BASE
 * 2. Указать уникальный level (1-5)
 * 3. Настроить incomeMultiplier (1.0 = без бонуса)
 * 4. Добавить описание
 * 
 * Чтобы изменить баланс:
 * - Менять incomeMultiplier для нужного уровня
 */
export const UPGRADES_BASE: UpgradeConfig[] = [
  {
    level: 1,
    incomeMultiplier: 1.0,
    description: 'Базовая комплектация',
  },
  {
    level: 2,
    incomeMultiplier: 1.1,
    description: 'Кондиционер',
  },
  {
    level: 3,
    incomeMultiplier: 1.2,
    description: 'Wi-Fi для пассажиров',
  },
  {
    level: 4,
    incomeMultiplier: 1.3,
    description: 'USB-зарядки на сиденьях',
  },
  {
    level: 5,
    incomeMultiplier: 1.5,
    description: 'Телевизор с рекламой',
  },
];

// ============================================
// Конфигурация типов автобусов
// ============================================

/**
 * Все доступные типы автобусов
 * 
 * Чтобы добавить новый автобус:
 * 1. Добавить новый объект в BUS_TYPES_CONFIG
 * 2. Указать уникальный id (добавить в BusTypeId)
 * 3. Настроить характеристики
 * 4. Выбрать цвет для рендеринга
 * 
 * Чтобы удалить автобус:
 * - Удалить из массива
 * - Обновить BusTypeId (убрать из union type)
 */
export const BUS_TYPES_CONFIG: BusTypeConfig[] = [
  {
    id: 'liaz',
    name: 'ЛиАЗ-5292',
    icon: '🚌',
    baseCapacity: 110,
    baseSpeed: 40, // 🐌 Очень медленный (тяжёлый, вместительный)
    comfort: 'B',
    basePrice: 500,
    color: '#ffcc00', // Жёлтый
    upgrades: UPGRADES_BASE,
  },
  {
    id: 'paz',
    name: 'ПАЗ Vector',
    icon: '🚐',
    baseCapacity: 68,
    baseSpeed: 150, // 🏎️ Очень быстрый (маленький, юркий) - в 3.75 раза быстрее ЛиАЗ!
    comfort: 'C',
    basePrice: 300,
    color: '#ff6600', // Оранжевый
    upgrades: UPGRADES_BASE,
  },
  {
    id: 'volgabus',
    name: 'Volgabus-5270',
    icon: '🚍',
    baseCapacity: 95,
    baseSpeed: 60, // Медленный (большой городской автобус)
    comfort: 'A',
    basePrice: 700,
    color: '#00aa00', // Зелёный
    upgrades: UPGRADES_BASE,
  },
  {
    id: 'kamaz',
    name: 'КАМАЗ-6282',
    icon: '⚡🚌',
    baseCapacity: 85,
    baseSpeed: 110, // Быстрый (современный, манёвренный)
    comfort: 'A+',
    basePrice: 1000,
    color: '#0066ff', // Синий
    upgrades: UPGRADES_BASE,
  },
];

// ============================================
// Утилиты для работы с типами автобусов
// ============================================

/**
 * Получить конфигурацию типа автобуса по ID
 * 
 * @param busTypeId - ID типа автобуса
 * @returns Конфигурация или undefined если не найден
 */
export function getBusTypeConfig(busTypeId: BusTypeId): BusTypeConfig | undefined {
  return BUS_TYPES_CONFIG.find((config) => config.id === busTypeId);
}

/**
 * Получить все доступные ID типов автобусов
 */
export function getAllBusTypeIds(): BusTypeId[] {
  return BUS_TYPES_CONFIG.map((config) => config.id);
}

/**
 * Получить улучшение для уровня
 *
 * @param busTypeId - ID типа автобуса
 * @param level - уровень (0-5), 0 = без улучшений
 * @returns Конфигурация улучшения или undefined
 */
export function getUpgradeForLevel(busTypeId: BusTypeId, level: number): UpgradeConfig | undefined {
  const config = getBusTypeConfig(busTypeId);
  if (!config) return undefined;

  // level = 0 не имеет улучшения, возвращаем undefined
  if (level === 0) return undefined;

  return config.upgrades.find((upgrade) => upgrade.level === level);
}

/**
 * Получить множитель дохода для автобуса
 * 
 * @param busTypeId - ID типа автобуса
 * @param level - текущий уровень
 * @returns Множитель дохода (1.0 - 1.5)
 */
export function getIncomeMultiplier(busTypeId: BusTypeId, level: number): number {
  const upgrade = getUpgradeForLevel(busTypeId, level);
  return upgrade?.incomeMultiplier ?? 1.0;
}

/**
 * Получить описание текущего улучшения
 * 
 * @param busTypeId - ID типа автобуса
 * @param level - текущий уровень
 * @returns Описание улучшения
 */
export function getUpgradeDescription(busTypeId: BusTypeId, level: number): string {
  const upgrade = getUpgradeForLevel(busTypeId, level);
  return upgrade?.description ?? 'Неизвестно';
}

/**
 * Проверить, доступен ли следующий уровень улучшения
 * 
 * @param level - текущий уровень
 * @returns true если можно улучшить
 */
export function canUpgrade(level: number): boolean {
  return level < UPGRADES_BASE.length;
}

/**
 * Получить максимальный уровень улучшения
 */
export function getMaxUpgradeLevel(): number {
  return Math.max(...UPGRADES_BASE.map((u) => u.level));
}

/**
 * Получить базовую стоимость прокачки (может быть изменена для конкретного автобуса)
 * 
 * @param level - уровень на который прокачиваем (не текущий!)
 * @returns Стоимость прокачки
 */
export function getBaseUpgradeCost(level: number): number {
  const upgrade = UPGRADES_BASE.find((u) => u.level === level);
  if (upgrade?.costMultiplier) {
    // Если указан кастомный множитель
    return Math.floor(500 * upgrade.costMultiplier);
  }
  // Базовая стоимость: 500 * уровень
  return 500 * level;
}
