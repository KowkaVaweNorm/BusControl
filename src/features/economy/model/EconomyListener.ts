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

const FARE_PER_PASSENGER = 2; // $2 за посадку
const REWARD_PER_PASSENGER = 5; // $5 бонус за доставку
const BUS_PURCHASE_COST = 100;  // $100 за автобус

let unsubscribeBoarded: (() => void) | null = null;
let unsubscribeArrived: (() => void) | null = null;
let unsubscribeBusCreated: (() => void) | null = null;
let unsubscribeStopCreated: (() => void) | null = null;
let unsubscribeBusDestroyed: (() => void) | null = null;
let unsubscribeStopDestroyed: (() => void) | null = null;
let unsubscribeMoneyChanged: (() => void) | null = null;

/**
 * Инициализация слушателей экономики
 */
export function initEconomyListener(): void {
  // Подписка на посадку пассажира (оплата проезда)
  unsubscribeBoarded = gameEventBusService.subscribe(
    GameEventType.NPC_BOARDED_BUS,
    (event) => {
      const { npcId, busId, stopId } = event.payload;

      gameStateStore.addMoney(FARE_PER_PASSENGER);

      console.log(
        `[Economy] Passenger ${npcId} boarded bus ${busId} at ${stopId}. ` +
        `Fare: $${FARE_PER_PASSENGER}. Balance: $${gameStateStore.getState().money}`
      );
    }
  );

  // Подписка на прибытие пассажира к цели (бонус)
  unsubscribeArrived = gameEventBusService.subscribe(
    GameEventType.NPC_ARRIVED_AT_DESTINATION,
    (event) => {
      const { npcId, stopId } = event.payload;

      gameStateStore.addMoney(REWARD_PER_PASSENGER);
      gameStateStore.addPassengerDelivered();

      console.log(
        `[Economy] Passenger ${npcId} arrived at ${stopId}. ` +
        `Reward: $${REWARD_PER_PASSENGER}. Balance: $${gameStateStore.getState().money}`
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

  // Подписка на создание остановки (обновление счётчика)
  unsubscribeStopCreated = gameEventBusService.subscribe(
    GameEventType.STOP_CREATED,
    () => {
      gameStateStore.incrementTotalStops();
    }
  );

  // Подписка на создание автобуса (обновление счётчика) - отдельная подписка
  gameEventBusService.subscribe(
    GameEventType.BUS_CREATED,
    () => {
      gameStateStore.incrementActiveBuses();
    }
  );

  // Подписка на удаление автобуса
  unsubscribeBusDestroyed = gameEventBusService.subscribe(
    GameEventType.BUS_DESTROYED,
    () => {
      gameStateStore.decrementActiveBuses();
    }
  );

  // Подписка на удаление остановки
  unsubscribeStopDestroyed = gameEventBusService.subscribe(
    GameEventType.STOP_DESTROYED,
    () => {
      gameStateStore.decrementTotalStops();
    }
  );

  // Подписка на изменение денег (для отладки)
  unsubscribeMoneyChanged = gameEventBusService.subscribe(
    GameEventType.MONEY_CHANGED,
    (_event) => {
      // Тихое логирование - только для отладки
      // const { amount, source } = event.payload;
      // console.log(`[Economy] Money changed: ${amount > 0 ? '+' : ''}${amount} (${source})`);
    }
  );

  console.log('[Economy] Economy listener initialized');
}

/**
 * Очистка слушателей (для React Strict Mode)
 */
export function cleanupEconomyListener(): void {
  unsubscribeBoarded?.();
  unsubscribeArrived?.();
  unsubscribeBusCreated?.();
  unsubscribeStopCreated?.();
  unsubscribeBusDestroyed?.();
  unsubscribeStopDestroyed?.();
  unsubscribeMoneyChanged?.();
  unsubscribeBoarded = null;
  unsubscribeArrived = null;
  unsubscribeBusCreated = null;
  unsubscribeStopCreated = null;
  unsubscribeBusDestroyed = null;
  unsubscribeStopDestroyed = null;
  unsubscribeMoneyChanged = null;

  console.log('[Economy] Economy listener cleaned up');
}
