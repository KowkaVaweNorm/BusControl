/**
 * GameEventBusService
 *
 * Шина событий для коммуникации между Canvas-движком и React-интерфейсом.
 * Реализует паттерн Pub/Sub (Publisher-Subscriber) для развязывания
 * компонентов системы.
 *
 * @module shared/lib/game-core
 */

// ============================================
// Типы событий
// ============================================

/**
 * Базовый интерфейс для всех событий
 */
export interface GameEvent<T = unknown> {
  /** Тип события */
  type: GameEventType;
  /** Данные события */
  payload: T;
  /** Время создания события */
  timestamp: number;
}

/**
 * Типы событий игры
 */
export enum GameEventType {
  // === Состояние игры ===
  GAME_STARTED = 'game:started',
  GAME_PAUSED = 'game:paused',
  GAME_RESUMED = 'game:resumed',
  GAME_STOPPED = 'game:stopped',
  GAME_OVER = 'game:over',

  // === Экономика ===
  MONEY_CHANGED = 'economy:money_changed',
  INCOME_RECEIVED = 'economy:income_received',
  EXPENSE_PAID = 'economy:expense_paid',

  // === Автобусы ===
  BUS_PURCHASED = 'bus:purchased',
  BUS_SOLD = 'bus:sold',
  BUS_CREATED = 'bus:created',
  BUS_DESTROYED = 'bus:destroyed',
  BUS_STATE_CHANGED = 'bus:state_changed',
  BUS_ARRIVED_AT_STOP = 'bus:arrived_at_stop',
  BUS_LEFT_STOP = 'bus:left_stop',

  // === Пассажиры (NPC) ===
  NPC_CREATED = 'npc:created',
  NPC_DESTROYED = 'npc:destroyed',
  NPC_BOARDED_BUS = 'npc:boarded_bus',
  NPC_LEFT_BUS = 'npc:left_bus',
  NPC_ARRIVED_AT_DESTINATION = 'npc:arrived_at_destination',
  NPC_GAVE_UP = 'npc:gave_up',

  // === Остановки и маршруты ===
  STOP_CREATED = 'stop:created',
  STOP_UPDATED = 'stop:updated',
  STOP_DESTROYED = 'stop:destroyed',
  ROUTE_CREATED = 'route:created',
  ROUTE_UPDATED = 'route:updated',
  ROUTE_DESTROYED = 'route:destroyed',

  // === События мира ===
  EVENT_STARTED = 'world:event_started',
  EVENT_ENDED = 'world:event_ended',
  TRAFFIC_JAM = 'world:traffic_jam',
  ACCIDENT = 'world:accident',
  PEAK_HOURS = 'world:peak_hours',

  // === UI ===
  UI_NOTIFICATION = 'ui:notification',
  UI_ERROR = 'ui:error',
}

/**
 * Типы данных для различных событий
 */
export interface GameEventMap {
  [GameEventType.GAME_STARTED]: { level: number };
  [GameEventType.GAME_PAUSED]: { reason: string };
  [GameEventType.GAME_RESUMED]: undefined;
  [GameEventType.GAME_STOPPED]: undefined;
  [GameEventType.GAME_OVER]: { reason: string; score: number };

  [GameEventType.MONEY_CHANGED]: { amount: number; total: number; source: string };
  [GameEventType.INCOME_RECEIVED]: { amount: number; source: string };
  [GameEventType.EXPENSE_PAID]: { amount: number; reason: string };

  [GameEventType.BUS_PURCHASED]: { busId: string; cost: number; type: string };
  [GameEventType.BUS_SOLD]: { busId: string; refund: number };
  [GameEventType.BUS_CREATED]: { busId: string; entityId: number };
  [GameEventType.BUS_DESTROYED]: { busId: string; entityId: number };
  [GameEventType.BUS_STATE_CHANGED]: { busId: string; oldState: string; newState: string };
  [GameEventType.BUS_ARRIVED_AT_STOP]: { busId: string; stopId: string };
  [GameEventType.BUS_LEFT_STOP]: { busId: string; stopId: string };

  [GameEventType.NPC_CREATED]: { npcId: string; stopId: string };
  [GameEventType.NPC_DESTROYED]: { npcId: string; reason: string };
  [GameEventType.NPC_BOARDED_BUS]: { npcId: string; busId: string; stopId: string };
  [GameEventType.NPC_LEFT_BUS]: { npcId: string; busId: string; stopId: string };
  [GameEventType.NPC_ARRIVED_AT_DESTINATION]: { npcId: string; stopId: string };
  [GameEventType.NPC_GAVE_UP]: { npcId: string; stopId: string; waitTime: number };

  [GameEventType.STOP_CREATED]: { stopId: string; name: string };
  [GameEventType.STOP_UPDATED]: { stopId: string; changes: Record<string, unknown> };
  [GameEventType.STOP_DESTROYED]: { stopId: string };
  [GameEventType.ROUTE_CREATED]: { routeId: string; name: string };
  [GameEventType.ROUTE_UPDATED]: { routeId: string; changes: Record<string, unknown> };
  [GameEventType.ROUTE_DESTROYED]: { routeId: string };

  [GameEventType.EVENT_STARTED]: { eventId: string; eventName: string; duration: number };
  [GameEventType.EVENT_ENDED]: { eventId: string; eventName: string };
  [GameEventType.TRAFFIC_JAM]: { location: string; severity: number };
  [GameEventType.ACCIDENT]: { location: string; severity: number };
  [GameEventType.PEAK_HOURS]: { startTime: number; endTime: number };

  [GameEventType.UI_NOTIFICATION]: { message: string; type: 'info' | 'success' | 'warning' };
  [GameEventType.UI_ERROR]: { message: string; code: string };
}

/**
 * Тип подписчика (callback)
 */
export type EventCallback<T extends GameEventType> = (event: GameEvent<GameEventMap[T]>) => void;

/**
 * Конфигурация Event Bus
 */
export interface GameEventBusConfig {
  /** Максимальное количество событий в истории */
  maxHistorySize: number;
  /** Включить логирование событий */
  enableLogging: boolean;
}

// ============================================
// Сервис Event Bus
// ============================================

export class GameEventBusService {
  private subscribers: Map<GameEventType, Set<EventCallback<GameEventType>>> = new Map();
  private eventHistory: GameEvent<unknown>[] = [];
  private isInitialized: boolean = false;

  private readonly config: GameEventBusConfig;

  constructor(config?: Partial<GameEventBusConfig>) {
    this.config = {
      maxHistorySize: config?.maxHistorySize ?? 100,
      enableLogging: config?.enableLogging ?? false,
    };
  }

  /**
   * Инициализация сервиса
   */
  public initialize(): void {
    if (this.isInitialized) {
      console.warn('[GameEventBusService] Already initialized');
      return;
    }

    // Пересоздание мапы подписчиков (важно для React Strict Mode!)
    this.subscribers.clear();

    // Инициализация всех типов событий
    Object.values(GameEventType).forEach((eventType) => {
      this.subscribers.set(eventType as GameEventType, new Set());
    });

    this.eventHistory = [];
    this.isInitialized = true;

    console.log('[GameEventBusService] Initialized');
  }

  /**
   * Подписка на событие
   */
  public subscribe<T extends GameEventType>(eventType: T, callback: EventCallback<T>): () => void {
    if (!this.isInitialized) {
      console.error('[GameEventBusService] Not initialized');
      return () => {};
    }

    const subscribers = this.subscribers.get(eventType);
    if (!subscribers) {
      console.error('[GameEventBusService] Unknown event type:', eventType);
      return () => {};
    }

    subscribers.add(callback as EventCallback<GameEventType>);

    // Возвращаем функцию отписки
    return () => {
      subscribers.delete(callback as EventCallback<GameEventType>);
    };
  }

  /**
   * Отписка от события
   */
  public unsubscribe<T extends GameEventType>(eventType: T, callback: EventCallback<T>): void {
    const subscribers = this.subscribers.get(eventType);
    if (subscribers) {
      subscribers.delete(callback as EventCallback<GameEventType>);
    }
  }

  /**
   * Отписка от всех событий
   */
  public unsubscribeAll(): void {
    this.subscribers.forEach((subscribers) => {
      subscribers.clear();
    });
    console.log('[GameEventBusService] All subscribers removed');
  }

  /**
   * Публикация события
   */
  public publish<T extends GameEventType>(eventType: T, payload: GameEventMap[T]): void {
    if (!this.isInitialized) {
      console.error('[GameEventBusService] Not initialized');
      return;
    }

    const event: GameEvent<GameEventMap[T]> = {
      type: eventType,
      payload,
      timestamp: Date.now(),
    };

    // Логирование (в режиме разработки)
    if (this.config.enableLogging) {
      console.log('[GameEventBusService] Event published:', event);
    }

    // Добавление в историю
    this.addToHistory(event);

    // Уведомление подписчиков
    const subscribers = this.subscribers.get(eventType);
    if (subscribers && subscribers.size > 0) {
      subscribers.forEach((callback) => {
        try {
          callback(event as GameEvent<GameEventMap[GameEventType]>);
        } catch (error) {
          console.error('[GameEventBusService] Subscriber callback error:', eventType, error);
        }
      });
    }
  }

  /**
   * Добавление события в историю
   */
  private addToHistory(event: GameEvent<unknown>): void {
    this.eventHistory.push(event);

    // Ограничение размера истории
    if (this.eventHistory.length > this.config.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  /**
   * Получение истории событий
   */
  public getHistory(options?: {
    eventType?: GameEventType;
    limit?: number;
    fromTimestamp?: number;
  }): GameEvent<unknown>[] {
    let history = [...this.eventHistory];

    if (options?.eventType) {
      history = history.filter((event) => event.type === options.eventType);
    }

    if (options?.fromTimestamp) {
      history = history.filter((event) => event.timestamp >= options.fromTimestamp!);
    }

    if (options?.limit) {
      history = history.slice(-options.limit);
    }

    return history;
  }

  /**
   * Очистка истории событий
   */
  public clearHistory(): void {
    this.eventHistory = [];
    console.log('[GameEventBusService] History cleared');
  }

  /**
   * Получение количества подписчиков на событие
   */
  public getSubscriberCount(eventType: GameEventType): number {
    const subscribers = this.subscribers.get(eventType);
    return subscribers ? subscribers.size : 0;
  }

  /**
   * Получение общего количества подписчиков
   */
  public getTotalSubscriberCount(): number {
    let total = 0;
    this.subscribers.forEach((subscribers) => {
      total += subscribers.size;
    });
    return total;
  }

  /**
   * Проверка инициализации
   */
  public getIsInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Очистка сервиса
   */
  public cleanup(): void {
    this.unsubscribeAll();
    this.clearHistory();
    this.isInitialized = false;
    console.log('[GameEventBusService] Cleaned up');
  }

  /**
   * Получение конфигурации
   */
  public getConfig(): GameEventBusConfig {
    return { ...this.config };
  }
}

// ============================================
// Хелперы для публикации событий
// ============================================

/**
 * Хелпер для публикации событий экономики
 */
export function publishMoneyEvent(
  eventBus: GameEventBusService,
  amount: number,
  total: number,
  source: string
): void {
  eventBus.publish(GameEventType.MONEY_CHANGED, { amount, total, source });
}

/**
 * Хелпер для публикации событий автобусов
 */
export function publishBusEvent(
  eventBus: GameEventBusService,
  eventType:
    | GameEventType.BUS_PURCHASED
    | GameEventType.BUS_SOLD
    | GameEventType.BUS_CREATED
    | GameEventType.BUS_DESTROYED,
  busId: string,
  extra?: Record<string, unknown>
): void {
  eventBus.publish(eventType, { busId, ...extra } as GameEventMap[typeof eventType]);
}

/**
 * Хелпер для публикации событий NPC
 */
export function publishNPCEvent(
  eventBus: GameEventBusService,
  eventType:
    | GameEventType.NPC_CREATED
    | GameEventType.NPC_DESTROYED
    | GameEventType.NPC_BOARDED_BUS
    | GameEventType.NPC_LEFT_BUS,
  npcId: string,
  extra?: Record<string, unknown>
): void {
  eventBus.publish(eventType, { npcId, ...extra } as GameEventMap[typeof eventType]);
}

/**
 * Хелпер для публикации UI уведомлений
 */
export function publishNotification(
  eventBus: GameEventBusService,
  message: string,
  type: 'info' | 'success' | 'warning' = 'info'
): void {
  eventBus.publish(GameEventType.UI_NOTIFICATION, { message, type });
}

/**
 * Хелпер для публикации UI ошибок
 */
export function publishError(
  eventBus: GameEventBusService,
  message: string,
  code: string = 'UNKNOWN_ERROR'
): void {
  eventBus.publish(GameEventType.UI_ERROR, { message, code });
}

// Экспорт единственного экземпляра для использования в приложении
export const gameEventBusService = new GameEventBusService({
  enableLogging: import.meta.env.DEV,
});
