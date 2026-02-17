/**
 * NPC Entity
 *
 * Сущность неигрового персонажа (пешеходы, пассажиры).
 *
 * @module entities/NPC
 */

export enum NPCType {
  PEDESTRIAN = 'pedestrian',
  PASSENGER = 'passenger',
  DRIVER = 'driver',
}

export interface NPCConfig {
  id: string;
  type: NPCType;
  moveSpeed: number;
  waitTime: number;
}

export interface NPCState {
  position: { x: number; y: number };
  isMoving: boolean;
  targetPosition?: { x: number; y: number };
  waitTimer: number;
}

export class NPCEntity {
  public readonly config: NPCConfig;
  public state: NPCState;

  constructor(config: Partial<NPCConfig> = {}) {
    this.config = {
      id: config.id ?? 'npc_1',
      type: config.type ?? NPCType.PEDESTRIAN,
      moveSpeed: config.moveSpeed ?? 30,
      waitTime: config.waitTime ?? 2,
    };

    this.state = {
      position: { x: 0, y: 0 },
      isMoving: false,
      waitTimer: 0,
    };
  }

  /**
   * Обновление состояния NPC
   */
  public update(deltaTime: number): void {
    if (this.state.isMoving && this.state.targetPosition) {
      this.moveToTarget(deltaTime);
    } else {
      this.state.waitTimer += deltaTime;

      if (this.state.waitTimer >= this.config.waitTime) {
        this.pickNewTarget();
      }
    }
  }

  /**
   * Движение к цели
   */
  private moveToTarget(deltaTime: number): void {
    if (!this.state.targetPosition) return;

    const dx = this.state.targetPosition.x - this.state.position.x;
    const dy = this.state.targetPosition.y - this.state.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 1) {
      this.state.isMoving = false;
      this.state.position = { ...this.state.targetPosition };
      this.state.targetPosition = undefined;
      this.state.waitTimer = 0;
    } else {
      const moveX = (dx / distance) * this.config.moveSpeed * deltaTime;
      const moveY = (dy / distance) * this.config.moveSpeed * deltaTime;

      this.state.position.x += moveX;
      this.state.position.y += moveY;
    }
  }

  /**
   * Выбор новой случайной цели
   */
  private pickNewTarget(): void {
    const angle = Math.random() * Math.PI * 2;
    const distance = 50 + Math.random() * 100;

    this.state.targetPosition = {
      x: this.state.position.x + Math.cos(angle) * distance,
      y: this.state.position.y + Math.sin(angle) * distance,
    };
    this.state.isMoving = true;
    this.state.waitTimer = 0;
  }

  /**
   * Установка позиции
   */
  public setPosition(x: number, y: number): void {
    this.state.position = { x, y };
  }

  /**
   * Получение текущего состояния
   */
  public getState(): NPCState {
    return { ...this.state };
  }
}
