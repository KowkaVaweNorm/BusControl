/**
 * GameOverSystem
 *
 * Система проверки условий завершения игры (Game Over).
 * Проверяет условия проигрыша каждый кадр и инициирует завершение игры.
 *
 * @module features/game-over/model
 */

import type { System, SystemContext } from '@/shared/lib/game-core/EntityManagerService';
import { gameStateStore } from '@/app/store/GameStateStore';
import { gameLoopService } from '@/shared/lib/game-core/GameLoopService';
import { gameEventBusService, GameEventType } from '@/shared/lib/game-core/GameEventBusService';
import {
  GameOverCondition,
  DEFAULT_GAME_OVER_CONFIG,
  type GameOverConfig,
  type GameOverCheckResult,
} from './types';

// Флаг для предотвращения повторного срабатывания
let isGameOverTriggered = false;

// Конфигурация системы
let config: GameOverConfig = { ...DEFAULT_GAME_OVER_CONFIG };

/**
 * Проверить все условия проигрыша
 */
function checkGameOverConditions(): GameOverCheckResult {
  const state = gameStateStore.getState();

  // Условие 1: Максимальное количество жалоб
  if (state.totalComplaints >= config.maxComplaints) {
    return {
      isGameOver: true,
      reason: `Достигнуто ${config.maxComplaints} жалоб горожан`,
      condition: GameOverCondition.MAX_COMPLAINTS,
    };
  }

  // Условие 2: Банкротство (пока отключено)
  if (config.enableBankruptcy && state.money < 0) {
    return {
      isGameOver: true,
      reason: 'Банкротство (отрицательный баланс)',
      condition: GameOverCondition.BANKRUPTCY,
    };
  }

  // Условие 3: Истекло время (пока отключено)
  if (config.timeLimit !== null && state.gameTime >= config.timeLimit) {
    return {
      isGameOver: true,
      reason: 'Истекло время игры',
      condition: GameOverCondition.TIME_EXPIRED,
    };
  }

  // Никаких условий не сработало
  return {
    isGameOver: false,
    reason: null,
    condition: null,
  };
}

/**
 * Завершить игру
 */
function triggerGameOver(reason: string): void {
  if (isGameOverTriggered) {
    return; // Защита от повторного срабатывания
  }

  isGameOverTriggered = true;

  console.log('[GameOverSystem] Game Over triggered:', reason);

  // 1. Устанавливаем состояние Game Over
  gameStateStore.setGameOver(reason);

  // 2. Публикуем событие
  gameEventBusService.publish(GameEventType.GAME_OVER, {
    reason,
    score: gameStateStore.getState().score,
  });

  // 3. Останавливаем игровой цикл (пауза)
  gameLoopService.pause();
}

/**
 * Сбросить состояние системы (для новой игры)
 */
export function resetGameOverSystem(): void {
  isGameOverTriggered = false;
  console.log('[GameOverSystem] Reset');
}

/**
 * Обновить конфигурацию системы
 */
export function setGameOverConfig(newConfig: Partial<GameOverConfig>): void {
  config = {
    ...config,
    ...newConfig,
  };
  console.log('[GameOverSystem] Config updated:', config);
}

/**
 * Получить текущую конфигурацию
 */
export function getGameOverConfig(): GameOverConfig {
  return { ...config };
}

/**
 * Основная система (для регистрации в ECS)
 */
export const gameOverSystem: System = {
  name: 'GameOverSystem',
  requiredComponents: [], // Не требует компонентов, проверяет глобальное состояние

  update: (_context: SystemContext) => {
    // Если игра уже завершена - не проверяем
    if (isGameOverTriggered) {
      return;
    }

    // Проверяем условия проигрыша
    const result = checkGameOverConditions();

    if (result.isGameOver && result.reason) {
      triggerGameOver(result.reason);
    }
  },
};
