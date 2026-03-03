/**
 * Типы для главного меню (выбор карты/города)
 */

export type DifficultyLevel = 'легкий' | 'средний' | 'сложный';

export interface CityData {
  id: string;
  name: string;
  stops: number;
  routes: number;
  difficulty: DifficultyLevel;
}

export interface MenuState {
  selectedCityId: string | null;
  isStarted: boolean;
}
