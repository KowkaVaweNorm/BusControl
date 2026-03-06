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
import { entityManagerService } from '@/shared/lib/game-core/EntityManagerService';
import { BUS_COMPONENTS, type BusDataComponent } from '@/entities/Bus/model/BusComponents';

const BASE_FARE_PER_PASSENGER = 35; // Базовая стоимость посадки (35₽)
const BASE_REWARD_PER_PASSENGER = 5; // Базовый бонус за доставку (5₽)
const BUS_PURCHASE_COST = 1000; // 1000₽ за автобус
const COMPLAINT_PENALTY = 50; // 50₽ штраф за жалобу

let unsubscribeBoarded: (() => void) | null = null;
let unsubscribeArrived: (() => void) | null = null;
let unsubscribeBusCreated: (() => void) | null = null;
let unsubscribeStopCreated: (() => void) | null = null;
let unsubscribeBusDestroyed: (() => void) | null = null;
let unsubscribeStopDestroyed: (() => void) | null = null;
let unsubscribeMoneyChanged: (() => void) | null = null;
let unsubscribeComplaintAdded: (() => void) | null = null;

/**
 * Получить множитель дохода для автобуса по busId
 */
function getBusIncomeMultiplierByBusId(busId: string): number {
  const busEntities = entityManagerService.getEntitiesWithComponents(BUS_COMPONENTS.DATA);
  
  for (const entityId of busEntities) {
    const busData = entityManagerService.getComponent<BusDataComponent>(
      entityId,
      BUS_COMPONENTS.DATA
    );
    if (busData && busData.id === busId) {
      return busData.incomeMultiplier ?? 1.0;
    }
  }
  
  return 1.0;
}

/**
 * Инициализация слушателей экономики
 */
export function initEconomyListener(): void {
  // Подписка на посадку пассажира (оплата проезда)
  unsubscribeBoarded = gameEventBusService.subscribe(GameEventType.NPC_BOARDED_BUS, (event) => {
    const { busId } = event.payload;

    // Получаем множитель дохода автобуса по busId
    const incomeMultiplier = getBusIncomeMultiplierByBusId(busId);

    // Рассчитываем итоговую сумму с учётом прокачки
    const fare = Math.floor(BASE_FARE_PER_PASSENGER * incomeMultiplier);

    gameStateStore.addMoney(fare);
  });

  // Подписка на прибытие пассажира к цели (бонус)
  unsubscribeArrived = gameEventBusService.subscribe(
    GameEventType.NPC_ARRIVED_AT_DESTINATION,
    (event) => {
      const { busId } = event.payload;

      // Получаем множитель дохода автобуса по busId
      const incomeMultiplier = getBusIncomeMultiplierByBusId(busId);

      // Рассчитываем бонус с учётом прокачки
      const reward = Math.floor(BASE_REWARD_PER_PASSENGER * incomeMultiplier);

      gameStateStore.addMoney(reward);
      gameStateStore.addPassengerDelivered();
    }
  );

  // Подписка на создание автобуса (расход)
  unsubscribeBusCreated = gameEventBusService.subscribe(GameEventType.BUS_CREATED, (event) => {
    const { busId } = event.payload;

    if (gameStateStore.spendMoney(BUS_PURCHASE_COST)) {
      // Тихая покупка
    } else {
      console.warn(`[Economy] Not enough money to buy bus ${busId}`);
    }
  });

  // Подписка на создание остановки (обновление счётчика)
  unsubscribeStopCreated = gameEventBusService.subscribe(GameEventType.STOP_CREATED, () => {
    gameStateStore.incrementTotalStops();
  });

  // Подписка на создание автобуса (обновление счётчика) - отдельная подписка
  gameEventBusService.subscribe(GameEventType.BUS_CREATED, () => {
    gameStateStore.incrementActiveBuses();
  });

  // Подписка на удаление автобуса
  unsubscribeBusDestroyed = gameEventBusService.subscribe(GameEventType.BUS_DESTROYED, () => {
    gameStateStore.decrementActiveBuses();
  });

  // Подписка на удаление остановки
  unsubscribeStopDestroyed = gameEventBusService.subscribe(GameEventType.STOP_DESTROYED, () => {
    gameStateStore.decrementTotalStops();
  });

  // Подписка на изменение денег (отключено - нет спама)

  // Подписка на жалобы (штраф)
  unsubscribeComplaintAdded = gameEventBusService.subscribe(
    GameEventType.COMPLAINT_ADDED,
    (_event) => {
      gameStateStore.addComplaint();
      gameStateStore.spendMoney(COMPLAINT_PENALTY);
    }
  );
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
  unsubscribeComplaintAdded?.();
  unsubscribeBoarded = null;
  unsubscribeArrived = null;
  unsubscribeBusCreated = null;
  unsubscribeStopCreated = null;
  unsubscribeBusDestroyed = null;
  unsubscribeStopDestroyed = null;
  unsubscribeMoneyChanged = null;
  unsubscribeComplaintAdded = null;

  console.log('[Economy] Economy listener cleaned up');
}
