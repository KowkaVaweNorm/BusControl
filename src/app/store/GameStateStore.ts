/**
 * GameStateStore
 *
 * Центральное хранилище состояния игры.
 * Управляет глобальным состоянием: текущая сцена, игровые объекты, прогресс.
 *
 * @module app/store
 */

import type { AppScene } from '@/shared/types/app-types';

export interface GameState {
  /** Текущая сцена/экран */
  currentScene: AppScene;
  /** Состояние паузы */
  isPaused: boolean;
  /** Счёт игрока */
  score: number;
  /** Уровень */
  level: number;
  /** Время игры (мс) */
  gameTime: number;
  /** Деньги игрока */
  money: number;
  /** Перевезено пассажиров */
  totalPassengersDelivered: number;
  /** Активных автобусов */
  activeBuses: number;
  /** Всего остановок */
  totalStops: number;
  /** Сообщение для отображения */
  message: string;

  // Система загруженности остановок и жалоб
  totalComplaints: number; // Всего жалоб горожан
  averageStopOccupancy: number; // Средняя загруженность остановок (%)
  overloadedStopsCount: number; // Количество перегруженных остановок
}

export type GameStateListener = (state: GameState) => void;

export class GameStateStore {
  private state: GameState = {
    currentScene: 'menu',
    isPaused: false,
    score: 0,
    level: 1,
    gameTime: 0,
    money: 5000, // Стартовый капитал (5000₽)
    totalPassengersDelivered: 0,
    activeBuses: 0,
    totalStops: 0,
    message: '',
    totalComplaints: 0,
    averageStopOccupancy: 0,
    overloadedStopsCount: 0,
  };

  private listeners: Set<GameStateListener> = new Set();

  /**
   * Подписка на изменения состояния
   */
  public subscribe(listener: GameStateListener): () => void {
    this.listeners.add(listener);

    // Возвращаем функцию отписки
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Получение текущего состояния
   */
  public getState(): GameState {
    return { ...this.state };
  }

  /**
   * Обновление состояния
   */
  public setState(updates: Partial<GameState>): void {
    this.state = {
      ...this.state,
      ...updates,
    };

    this.notifyListeners();
  }

  /**
   * Уведомление подписчиков
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      listener(this.getState());
    });
  }

  /**
   * Сброс состояния к начальному
   */
  public reset(): void {
    this.state = {
      currentScene: 'menu',
      isPaused: false,
      score: 0,
      level: 1,
      gameTime: 0,
      money: 5000,
      totalPassengersDelivered: 0,
      activeBuses: 0,
      totalStops: 0,
      message: '',
      totalComplaints: 0,
      averageStopOccupancy: 0,
      overloadedStopsCount: 0,
    };
    this.notifyListeners();
  }

  /**
   * Переключение паузы
   */
  public togglePause(): void {
    this.setState({ isPaused: !this.state.isPaused });
  }

  /**
   * Изменение сцены
   */
  public setScene(scene: AppScene): void {
    this.setState({ currentScene: scene });
  }

  /**
   * Добавление очков
   */
  public addScore(points: number): void {
    this.setState({ score: this.state.score + points });
  }

  /**
   * Добавление денег
   */
  public addMoney(amount: number): void {
    this.setState({ money: this.state.money + amount });
  }

  /**
   * Трата денег
   */
  public spendMoney(amount: number): boolean {
    if (this.state.money >= amount) {
      this.setState({ money: this.state.money - amount });
      return true;
    }
    return false;
  }

  /**
   * Переход на следующий уровень
   */
  public nextLevel(): void {
    this.setState({ level: this.state.level + 1 });
  }

  /**
   * Обновление времени игры
   */
  public updateGameTime(deltaTime: number): void {
    this.setState({ gameTime: this.state.gameTime + deltaTime });
  }

  /**
   * Увеличить счётчик перевезённых пассажиров
   */
  public addPassengerDelivered(): void {
    this.setState({ totalPassengersDelivered: this.state.totalPassengersDelivered + 1 });
  }

  /**
   * Установить количество активных автобусов
   */
  public setActiveBuses(count: number): void {
    this.setState({ activeBuses: count });
  }

  /**
   * Увеличить количество активных автобусов
   */
  public incrementActiveBuses(): void {
    this.setState({ activeBuses: this.state.activeBuses + 1 });
  }

  /**
   * Уменьшить количество активных автобусов
   */
  public decrementActiveBuses(): void {
    this.setState({ activeBuses: Math.max(0, this.state.activeBuses - 1) });
  }

  /**
   * Установить количество остановок
   */
  public setTotalStops(count: number): void {
    this.setState({ totalStops: count });
  }

  /**
   * Увеличить количество остановок
   */
  public incrementTotalStops(): void {
    this.setState({ totalStops: this.state.totalStops + 1 });
  }

  /**
   * Уменьшить количество остановок
   */
  public decrementTotalStops(): void {
    this.setState({ totalStops: Math.max(0, this.state.totalStops - 1) });
  }

  /**
   * Установить сообщение
   */
  public setMessage(message: string): void {
    this.setState({ message });
  }

  /**
   * Очистить сообщение
   */
  public clearMessage(): void {
    this.setState({ message: '' });
  }

  // ============================================
  // Методы для системы загруженности и жалоб
  // ============================================

  /**
   * Добавить жалобу (увеличить счётчик)
   */
  public addComplaint(): void {
    this.setState({ totalComplaints: this.state.totalComplaints + 1 });
  }

  /**
   * Установить среднюю загруженность остановок (%)
   */
  public setAverageStopOccupancy(percent: number): void {
    this.setState({ averageStopOccupancy: Math.max(0, Math.min(100, percent)) });
  }

  /**
   * Установить количество перегруженных остановок
   */
  public setOverloadedStopsCount(count: number): void {
    this.setState({ overloadedStopsCount: Math.max(0, count) });
  }
}

// Экспорт единственного экземпляра
export const gameStateStore = new GameStateStore();
