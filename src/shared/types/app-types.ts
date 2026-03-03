/**
 * Типы для навигации по страницам/сценам приложения
 * @module shared/types
 */

/**
 * Доступные страницы приложения
 * 
 * - `menu` — главное меню (выбор карты, настройки, автопарк)
 * - `game` — игровой процесс (Canvas с игрой)
 * - `garage` — автопарк (управление и улучшение автобусов)
 */
export type AppScene = 'menu' | 'game' | 'garage';

/**
 * Доступные пресетные карты для выбора в меню
 * Использует ID из preset-maps.ts
 */
export type PresetMapId = 
  | 'tutorial'
  | 'suburbs'
  | 'downtown'
  | 'airport'
  | 'seaside'
  | 'industrial'
  | 'university'
  | 'metro'
  | 'stadium'
  | 'city';

/**
 * Параметры для запуска игры
 */
export interface GameLaunchParams {
  /** ID пресетной карты (если новая игра) */
  mapId?: PresetMapId | null;
  /** Загрузить последнее сохранение (если true) */
  loadSave?: boolean;
}
