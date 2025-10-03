export interface SysSettings {
  totalFloors: number;
  numberOfElevators: number;
}

export interface ElevatorState {
  id: number;
  currentFloor: number;
  targetFloors: number[];
  movingDirection: "up" | "down" | "idle";
  status?: "moving" | "stopped"

}