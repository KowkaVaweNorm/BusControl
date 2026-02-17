/**
 * Route Entity
 *
 * Сущность маршрута — определяет путь движения автобуса,
 * остановки и контрольные точки.
 *
 * @module entities/Route
 */

export interface RoutePoint {
  id: string;
  x: number;
  y: number;
  type: 'start' | 'checkpoint' | 'stop' | 'finish';
  name?: string;
}

export interface RouteConfig {
  id: string;
  name: string;
  points: RoutePoint[];
  difficulty: number;
  estimatedTime: number;
}

export interface RouteState {
  currentPointIndex: number;
  completedPoints: string[];
  isCompleted: boolean;
  progress: number;
}

export class RouteEntity {
  public readonly config: RouteConfig;
  public state: RouteState;

  constructor(config: Partial<RouteConfig> = {}) {
    this.config = {
      id: config.id ?? 'route_1',
      name: config.name ?? 'Маршрут №1',
      points: config.points ?? [],
      difficulty: config.difficulty ?? 1,
      estimatedTime: config.estimatedTime ?? 300,
    };

    this.state = {
      currentPointIndex: 0,
      completedPoints: [],
      isCompleted: false,
      progress: 0,
    };
  }

  /**
   * Обновление состояния маршрута
   */
  public update(playerPosition: { x: number; y: number }): void {
    if (this.state.isCompleted) return;

    const currentPoint = this.config.points[this.state.currentPointIndex];
    if (!currentPoint) return;

    // Проверка достижения точки
    const dx = playerPosition.x - currentPoint.x;
    const dy = playerPosition.y - currentPoint.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 10) {
      this.reachPoint(currentPoint.id);
    }

    // Обновление прогресса
    this.updateProgress();
  }

  /**
   * Достижение точки маршрута
   */
  private reachPoint(pointId: string): void {
    if (!this.state.completedPoints.includes(pointId)) {
      this.state.completedPoints.push(pointId);
    }

    this.state.currentPointIndex++;

    if (this.state.currentPointIndex >= this.config.points.length) {
      this.state.isCompleted = true;
      this.state.progress = 100;
    }
  }

  /**
   * Обновление прогресса прохождения
   */
  private updateProgress(): void {
    const totalPoints = this.config.points.length;
    const completedCount = this.state.completedPoints.length;
    this.state.progress = Math.round((completedCount / totalPoints) * 100);
  }

  /**
   * Получение текущей целевой точки
   */
  public getCurrentTarget(): RoutePoint | null {
    if (this.state.isCompleted) return null;
    return this.config.points[this.state.currentPointIndex] ?? null;
  }

  /**
   * Получение всех остановок на маршруте
   */
  public getStops(): RoutePoint[] {
    return this.config.points.filter((point) => point.type === 'stop');
  }

  /**
   * Сброс состояния маршрута
   */
  public reset(): void {
    this.state = {
      currentPointIndex: 0,
      completedPoints: [],
      isCompleted: false,
      progress: 0,
    };
  }

  /**
   * Получение текущего состояния
   */
  public getState(): RouteState {
    return { ...this.state };
  }
}
