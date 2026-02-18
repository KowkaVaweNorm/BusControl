/**
 * EconomyListener
 *
 * Слушатель событий экономики для начисления денег.
 * Обрабатывает события от пассажиров и покупок.
 *
 * @module features/economy/model
 */

import { gameEventBusService, GameEventType } from '@/shared/lib/game-core/GameEventBusService';
import { gameStateStore } from '@/app/store/GameStateStore';

const REWARD_PER_PASSENGER = 5; // $5 за поездку
const BUS_PURCHASE_COST = 100;  // $100 за автобус

let unsubscribeArrived: (() => void) | null = null;
let unsubscribeBusCreated: (() => void) | null = null;

/**
 * Инициализация слушателей экономики
 */
export function initEconomyListener(): void {
  // Подписка на прибытие пассажира к цели
  unsubscribeArrived = gameEventBusService.subscribe(
    GameEventType.NPC_ARRIVED_AT_DESTINATION,
    (event) => {
      const { npcId, stopId } = event.payload;
      
      gameStateStore.addMoney(REWARD_PER_PASSENGER);
      
      console.log(
        `[Economy] Passenger ${npcId} arrived at ${stopId}. ` +
        `Reward: $${REWARD_PER_PASSENGER}. Total: $${gameStateStore.getState().money}`
      );
    }
  );

  // Подписка на создание автобуса (расход)
  unsubscribeBusCreated = gameEventBusService.subscribe(
    GameEventType.BUS_CREATED,
    (event) => {
      const { busId } = event.payload;
      
      if (gameStateStore.spendMoney(BUS_PURCHASE_COST)) {
        console.log(
          `[Economy] Bus ${busId} purchased. Cost: $${BUS_PURCHASE_COST}. ` +
          `Balance: $${gameStateStore.getState().money}`
        );
      } else {
        console.warn(`[Economy] Not enough money to buy bus ${busId}`);
      }
    }
  );

  console.log('[Economy] Economy listener initialized');
}

/**
 * Очистка слушателей (для React Strict Mode)
 */
export function cleanupEconomyListener(): void {
  unsubscribeArrived?.();
  unsubscribeBusCreated?.();
  unsubscribeArrived = null;
  unsubscribeBusCreated = null;
  
  console.log('[Economy] Economy listener cleaned up');
}
