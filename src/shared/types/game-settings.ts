/**
 * Типы для настроек игры и прогресса
 * @module shared/types
 */

/**
 * Данные о завершенном уровне
 */
export interface CompletedLevel {
  /** ID карты/уровня */
  levelId: string;
  /** Баланс игрока на момент завершения */
  finalBalance: number;
  /** Перевезено пассажиров за сессию */
  passengersDelivered: number;
  /** Количество жалоб за сессию */
  complaints: number;
  /** Длительность сессии (мс) */
  duration: number;
  /** Причина завершения (если проигрыш) */
  reason?: string;
  /** Дата завершения */
  completedAt: number;
  /** Статус завершения */
  status: 'won' | 'lost' | 'abandoned';
}

/**
 * Настройки игры (сохраняются в localStorage)
 */
export interface GameSettings {
  /** Громкость музыки (0-1) */
  musicVolume: number;
  /** Громкость эффектов (0-1) */
  sfxVolume: number;
  /** Язык интерфейса */
  language: 'ru' | 'en';
  /** Полноэкранный режим */
  fullscreen: boolean;
}

/**
 * Прогресс игрока (сохраняется в localStorage)
 */
export interface PlayerProgress {
  /** Всего перевезено пассажиров */
  totalPassengers: number;
  /** Всего заработано денег */
  totalMoneyEarned: number;
  /** Всего жалоб получено */
  totalComplaints: number;
  /** Открытые карты (ID карт) */
  unlockedMaps: string[];
  /** Доступные автобусы (ID типов) */
  unlockedBusTypes: string[];
  /** Улучшения автобусов */
  busUpgrades: BusUpgradeData[];
  /** Завершенные уровни */
  completedLevels: CompletedLevel[];
  /** Последний активный уровень (ID) */
  lastActiveLevelId: string | null;
  /** Текущий баланс (сохраняется между сессиями) */
  currentBalance: number;
  /** Версия сохранения (для миграции) */
  saveVersion: string;
}

/**
 * Данные об улучшении автобуса
 */
export interface BusUpgradeData {
  /** ID типа автобуса */
  busTypeId: string;
  /** Уровень улучшения (0 - базовый) */
  level: number;
  /** Улучшенная вместимость */
  capacity?: number;
  /** Улучшенная скорость */
  speed?: number;
  /** Улучшенная цена покупки */
  cost?: number;
}

/**
 * Данные автобуса в автопарке
 */
export interface GarageBus {
  /** Уникальный ID автобуса в гараже */
  id: string;
  /** Тип автобуса (ссылка на тип) */
  typeId: string;
  /** Текущий уровень улучшений */
  upgradeLevel: number;
  /** Пройдено километров */
  mileage: number;
  /** Перевезено пассажиров этим автобусом */
  passengersDelivered: number;
  /** Дата получения */
  acquiredAt: number;
}

/**
 * Тип автобуса (доступные для покупки)
 */
export interface BusType {
  /** Уникальный ID типа */
  id: string;
  /** Название */
  name: string;
  /** Описание */
  description: string;
  /** Базовая вместимость */
  baseCapacity: number;
  /** Базовая скорость */
  baseSpeed: number;
  /** Базовая цена */
  baseCost: number;
  /** Цвет по умолчанию */
  defaultColor: string;
  /** Максимальный уровень улучшения */
  maxUpgradeLevel: number;
  /** Стоимость улучшения за уровень */
  upgradeCostPerLevel: number;
}

/**
 * Настройки по умолчанию
 */
export const DEFAULT_SETTINGS: GameSettings = {
  musicVolume: 0.5,
  sfxVolume: 0.7,
  language: 'ru',
  fullscreen: false,
};

/**
 * Текущая версия сохранения (для миграции)
 */
export const CURRENT_SAVE_VERSION = '1.1.0';

/**
 * Пустой прогресс (для новой игры)
 */
export const DEFAULT_PROGRESS: PlayerProgress = {
  totalPassengers: 0,
  totalMoneyEarned: 0,
  totalComplaints: 0,
  unlockedMaps: ['tutorial'], // Только учебная карта открыта
  unlockedBusTypes: ['standard'], // Только стандартный автобус
  busUpgrades: [],
  completedLevels: [],
  lastActiveLevelId: null,
  currentBalance: 5000, // Стартовый баланс
  saveVersion: CURRENT_SAVE_VERSION,
};
