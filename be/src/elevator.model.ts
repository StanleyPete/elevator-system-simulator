export class Elevator {
  id: number;
  currentFloor: number;
  targetFloorsUp: number[];
  targetFloorsDown: number[];
  movingDirection: 'up' | 'down' | 'idle';
  pausing: boolean;

  constructor(id: number, startFloor: number = 0) {
    this.id = id;
    this.currentFloor = startFloor;
    this.targetFloorsUp = [];
    this.targetFloorsDown = [];
    this.movingDirection = 'idle';
    this.pausing = false;
  }
}
