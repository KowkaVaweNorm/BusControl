/**
 * Типы условий для Game Over
 * @module features/game-over/model
 */

/**
 * Типы условий проигрыша
 */
export enum GameOverCondition {
  /** Достигнуто максимальное количество жалоб */
  MAX_COMPLAINTS = 'max_complaints',
  /** Игрок банкрот (деньги < 0) */
  BANKRUPTCY = 'bankruptcy',
  /** Истекло время (если есть лимит) */
  TIME_EXPIRED = 'time_expired',
}

/**
 * Конфигурация условий проигрыша
 */
export interface GameOverConfig {
  /** Максимальное количество жалоб для проигрыша */
  maxComplaints: number;
  /** Включить условие банкротства */
  enableBankruptcy: boolean;
  /** Включить условие по времени (мс) */
  timeLimit: number | null;
}

/**
 * Конфигурация по умолчанию
 */
export const DEFAULT_GAME_OVER_CONFIG: GameOverConfig = {
  maxComplaints: 10,
  enableBankruptcy: false, // Пока не используется
  timeLimit: null, // Пока не используется
};

/**
 * Результат проверки условия проигрыша
 */
export interface GameOverCheckResult {
  /** Игра завершена */
  isGameOver: boolean;
  /** Причина проигрыша (если есть) */
  reason: string | null;
  /** Тип условия (если сработало) */
  condition: GameOverCondition | null;
}
