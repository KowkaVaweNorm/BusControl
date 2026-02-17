/**
 * Bus Entity
 *
 * Сущность автобуса — основной управляемый объект игрока.
 *
 * @module entities/Bus
 */

export interface BusConfig {
  id: string;
  maxSpeed: number;
  acceleration: number;
  braking: number;
  turnSpeed: number;
  passengerCapacity: number;
}

export interface BusState {
  position: { x: number; y: number };
  rotation: number;
  speed: number;
  fuel: number;
  passengers: number;
  damage: number;
}

export class BusEntity {
  public readonly config: BusConfig;
  public state: BusState;

  constructor(config: Partial<BusConfig> = {}) {
    this.config = {
      id: config.id ?? 'bus_1',
      maxSpeed: config.maxSpeed ?? 100,
      acceleration: config.acceleration ?? 50,
      braking: config.braking ?? 80,
      turnSpeed: config.turnSpeed ?? 2,
      passengerCapacity: config.passengerCapacity ?? 30,
    };

    this.state = {
      position: { x: 0, y: 0 },
      rotation: 0,
      speed: 0,
      fuel: 100,
      passengers: 0,
      damage: 0,
    };
  }

  /**
   * Обновление состояния автобуса
   */
  public update(deltaTime: number): void {
    // Базовая физика движения
    const { speed, rotation } = this.state;

    // Обновление позиции на основе скорости и направления
    if (speed !== 0) {
      const rad = (rotation * Math.PI) / 180;
      this.state.position.x += Math.sin(rad) * speed * deltaTime;
      this.state.position.y -= Math.cos(rad) * speed * deltaTime;
    }

    // Трение
    this.state.speed *= 0.98;
  }

  /**
   * Ускорение
   */
  public accelerate(deltaTime: number): void {
    this.state.speed = Math.min(
      this.state.speed + this.config.acceleration * deltaTime,
      this.config.maxSpeed
    );
  }

  /**
   * Торможение
   */
  public brake(deltaTime: number): void {
    this.state.speed = Math.max(
      this.state.speed - this.config.braking * deltaTime,
      -this.config.maxSpeed / 2
    );
  }

  /**
   * Поворот
   */
  public turn(direction: number, deltaTime: number): void {
    const turnAmount = this.config.turnSpeed * direction * deltaTime;
    this.state.rotation = (this.state.rotation + turnAmount) % 360;
  }

  /**
   * Посадка пассажиров
   */
  public boardPassengers(count: number): number {
    const availableSpace = this.config.passengerCapacity - this.state.passengers;
    const boarded = Math.min(count, availableSpace);
    this.state.passengers += boarded;
    return boarded;
  }

  /**
   * Высадка пассажиров
   */
  public disembarkPassengers(count: number): number {
    const disembarked = Math.min(count, this.state.passengers);
    this.state.passengers -= disembarked;
    return disembarked;
  }

  /**
   * Получение текущего состояния
   */
  public getState(): BusState {
    return { ...this.state };
  }

  /**
   * Сброс состояния
   */
  public reset(): void {
    this.state = {
      position: { x: 0, y: 0 },
      rotation: 0,
      speed: 0,
      fuel: 100,
      passengers: 0,
      damage: 0,
    };
  }
}
