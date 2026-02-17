/**
 * GameStateStore
 *
 * Центральное хранилище состояния игры.
 * Управляет глобальным состоянием: текущая сцена, игровые объекты, прогресс.
 *
 * @module app/store
 */

export interface GameState {
  /** Текущая сцена/экран */
  currentScene: string;
  /** Состояние паузы */
  isPaused: boolean;
  /** Счёт игрока */
  score: number;
  /** Уровень */
  level: number;
  /** Время игры (мс) */
  gameTime: number;
}

export type GameStateListener = (state: GameState) => void;

export class GameStateStore {
  private state: GameState = {
    currentScene: 'menu',
    isPaused: false,
    score: 0,
    level: 1,
    gameTime: 0,
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
  public setScene(scene: string): void {
    this.setState({ currentScene: scene });
  }

  /**
   * Добавление очков
   */
  public addScore(points: number): void {
    this.setState({ score: this.state.score + points });
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
}

// Экспорт единственного экземпляра
export const gameStateStore = new GameStateStore();
