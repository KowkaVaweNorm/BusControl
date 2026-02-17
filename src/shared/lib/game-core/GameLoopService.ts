/**
 * GameLoopService
 *
 * Управляет игровым циклом с фиксированным шагом времени для логики
 * и переменным для рендеринга. Это критично для симуляций, чтобы
 * скорость игры не зависела от FPS.
 *
 * @module shared/lib/game-core
 */

export type GameLoopCallback = (deltaTime: number) => void;

export interface GameLoopConfig {
  /** Фиксированный шаг времени для логики (в секундах) */
  fixedTimeStep: number;
  /** Максимальное количество обновлений логики за один кадр рендера */
  maxUpdatesPerFrame: number;
}

export class GameLoopService {
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private animationFrameId: number | null = null;

  private lastTime: number = 0;
  private accumulator: number = 0;

  private readonly config: GameLoopConfig;

  private logicCallbacks: GameLoopCallback[] = [];
  private renderCallbacks: GameLoopCallback[] = [];

  constructor(config?: Partial<GameLoopConfig>) {
    this.config = {
      fixedTimeStep: config?.fixedTimeStep ?? 1 / 60, // 60 updates per second
      maxUpdatesPerFrame: config?.maxUpdatesPerFrame ?? 5,
    };
  }

  /**
   * Подписка на логику (фиксированный шаг)
   * Вызывается с постоянной частотой независимо от FPS
   */
  public subscribeToLogic(callback: GameLoopCallback): void {
    this.logicCallbacks.push(callback);
  }

  /**
   * Подписка на рендер (переменный шаг)
   * Вызывается каждый кадр
   */
  public subscribeToRender(callback: GameLoopCallback): void {
    this.renderCallbacks.push(callback);
  }

  /**
   * Отписка от логики
   */
  public unsubscribeFromLogic(callback: GameLoopCallback): void {
    const index = this.logicCallbacks.indexOf(callback);
    if (index !== -1) {
      this.logicCallbacks.splice(index, 1);
    }
  }

  /**
   * Отписка от рендера
   */
  public unsubscribeFromRender(callback: GameLoopCallback): void {
    const index = this.renderCallbacks.indexOf(callback);
    if (index !== -1) {
      this.renderCallbacks.splice(index, 1);
    }
  }

  /**
   * Запуск игрового цикла
   */
  public start(): void {
    if (this.isRunning) {
      console.warn('[GameLoopService] Already running');
      return;
    }

    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    this.accumulator = 0;

    this.animationFrameId = requestAnimationFrame(this.loop.bind(this));

    console.log('[GameLoopService] Started');
  }

  /**
   * Остановка игрового цикла
   */
  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    this.isPaused = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    console.log('[GameLoopService] Stopped');
  }

  /**
   * Пауза игрового цикла (логика и рендер останавливаются)
   */
  public pause(): void {
    if (!this.isRunning || this.isPaused) {
      return;
    }

    this.isPaused = true;
    console.log('[GameLoopService] Paused');
  }

  /**
   * Возобновление игрового цикла
   */
  public resume(): void {
    if (!this.isRunning || !this.isPaused) {
      return;
    }

    this.isPaused = false;
    this.lastTime = performance.now();

    console.log('[GameLoopService] Resumed');
  }

  /**
   * Основной цикл игры
   */
  private loop(currentTime: number): void {
    if (!this.isRunning) {
      return;
    }

    this.animationFrameId = requestAnimationFrame(this.loop.bind(this));

    if (this.isPaused) {
      return;
    }

    // Расчет дельты времени в секундах
    let deltaTime = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Ограничение максимального deltaTime (защита от "спайков" при переключении вкладок)
    if (deltaTime > 0.25) {
      deltaTime = 0.25;
    }

    // Накопление времени для фиксированного шага логики
    this.accumulator += deltaTime;

    // Выполнение логики с фиксированным шагом
    let updatesCount = 0;
    while (
      this.accumulator >= this.config.fixedTimeStep &&
      updatesCount < this.config.maxUpdatesPerFrame
    ) {
      this.executeLogic(this.config.fixedTimeStep);
      this.accumulator -= this.config.fixedTimeStep;
      updatesCount++;
    }

    // Выполнение рендера с переменной дельтой
    this.executeRender(deltaTime);

    // Предупреждение если не успеваем обрабатывать логику
    if (updatesCount >= this.config.maxUpdatesPerFrame) {
      console.warn(
        `[GameLoopService] Performance warning: ${updatesCount} updates in one frame. ` +
          `Consider optimizing logic or reducing object count.`
      );
      // Сбрасываем аккумулятор чтобы избежать "спирали смерти"
      this.accumulator = 0;
    }
  }

  /**
   * Выполнение всех подписчиков логики
   */
  private executeLogic(deltaTime: number): void {
    for (const callback of this.logicCallbacks) {
      try {
        callback(deltaTime);
      } catch (error) {
        console.error('[GameLoopService] Logic callback error:', error);
      }
    }
  }

  /**
   * Выполнение всех подписчиков рендера
   */
  private executeRender(deltaTime: number): void {
    for (const callback of this.renderCallbacks) {
      try {
        callback(deltaTime);
      } catch (error) {
        console.error('[GameLoopService] Render callback error:', error);
      }
    }
  }

  /**
   * Геттеры для состояния сервиса
   */
  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  public getFixedTimeStep(): number {
    return this.config.fixedTimeStep;
  }

  /**
   * Очистка всех подписчиков (важно для React Strict Mode!)
   */
  public clearSubscribers(): void {
    this.logicCallbacks = [];
    this.renderCallbacks = [];
    console.log('[GameLoopService] Subscribers cleared');
  }
}

// Экспорт единственного экземпляра для использования в приложении
export const gameLoopService = new GameLoopService();
