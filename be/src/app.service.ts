import { Injectable } from '@nestjs/common';
import { Elevator } from './elevator.model';
import { Server } from 'socket.io';

@Injectable()
export class AppService {
  private elevators: Map<number, Elevator> = new Map();
  private numberOfFloors: number = 0;

  initializeElevators(
    totalFloors: number,
    numberOfElevators: number,
    positions: number[],
  ) {
    this.numberOfFloors = totalFloors;

    this.elevators.clear();

    for (let i = 0; i < numberOfElevators; i++) {
      const startFloor = positions[i] ?? 0;
      const elevator = new Elevator(i, startFloor);
      this.elevators.set(i, elevator);
    }

    console.log(
      `Added ${numberOfElevators} elevators on ${totalFloors} floors`,
    );
  }

  getElevators(): Elevator[] {
    return Array.from(this.elevators.values());
  }

  getNumberOfFloors(): number {
    return this.numberOfFloors;
  }

  callElevator(requestFloor: number): Elevator | null {
    if (this.elevators.size === 0) return null;

    const elevatorsArray = Array.from(this.elevators.values());

    let bestElevator: Elevator | null = null;
    let bestScore = Infinity;

    elevatorsArray.forEach((elevator) => {
      // Distance-based scoring
      const distance = Math.abs(elevator.currentFloor - requestFloor);
      const queueLength =
        elevator.targetFloorsUp.length + elevator.targetFloorsDown.length;
      const score = distance + queueLength * 2;

      if (score < bestScore) {
        bestScore = score;
        bestElevator = elevator;
      }
    });

    if (!bestElevator) return null;

    // Jeśli request jest w górę od aktualnego piętra → targetFloorsUp
    if (requestFloor > bestElevator.currentFloor) {
      bestElevator.targetFloorsUp.push(requestFloor);
      bestElevator.targetFloorsUp.sort((a, b) => a - b);
    }
    // Jeśli request jest w dół → targetFloorsDown
    else if (requestFloor < bestElevator.currentFloor) {
      bestElevator.targetFloorsDown.push(requestFloor);
      bestElevator.targetFloorsDown.sort((a, b) => b - a);
    }
    // jeśli winda już jest na piętrze, ignorujemy
    else {
      return bestElevator;
    }

    // Jeśli winda była idle, ustaw kierunek
    if (bestElevator.movingDirection === 'idle') {
      bestElevator.movingDirection =
        requestFloor > bestElevator.currentFloor ? 'up' : 'down';
    }

    return bestElevator;
  }

  moveElevators(server?: Server) {
    this.elevators.forEach((elevator) => {
      let queue: number[];

      // choose current queue based on moving direction
      if (elevator.movingDirection === 'up') queue = elevator.targetFloorsUp;
      else if (elevator.movingDirection === 'down')
        queue = elevator.targetFloorsDown;
      else {
        // idle, pick next available queue
        if (elevator.targetFloorsUp.length > 0) {
          elevator.movingDirection = 'up';
          queue = elevator.targetFloorsUp;
        } else if (elevator.targetFloorsDown.length > 0) {
          elevator.movingDirection = 'down';
          queue = elevator.targetFloorsDown;
        } else {
          elevator.movingDirection = 'idle';
          return;
        }
      }

      if (queue.length === 0) {
        elevator.movingDirection = 'idle';
        return;
      }

      const nextFloor = queue[0];

      if (elevator.pausing) {
        elevator.pausing = false;
        if (server) {
          server.emit('elevatorUpdate', {
            elevatorId: elevator.id,
            currentFloor: elevator.currentFloor,
            movingDirection: 'idle',
          });
          server.emit('elevatorStopped', {
            elevatorId: elevator.id,
            floor: elevator.currentFloor,
          });
        }
        return;
      }

      const previousFloor = elevator.currentFloor;

      if (elevator.currentFloor < nextFloor) {
        elevator.currentFloor++;
        elevator.movingDirection = 'up';
      } else if (elevator.currentFloor > nextFloor) {
        elevator.currentFloor--;
        elevator.movingDirection = 'down';
      } else {
        // reached floor
        queue.shift();
        elevator.pausing = true;
        if (server) {
          server.emit('elevatorStopped', {
            elevatorId: elevator.id,
            floor: elevator.currentFloor,
          });
          server.emit('panelButtonReset', {
            elevatorId: elevator.id,
            floor: elevator.currentFloor,
          });
        }

        // switch direction if current queue is empty
        if (
          elevator.movingDirection === 'up' &&
          elevator.targetFloorsUp.length === 0 &&
          elevator.targetFloorsDown.length > 0
        ) {
          elevator.movingDirection = 'down';
        } else if (
          elevator.movingDirection === 'down' &&
          elevator.targetFloorsDown.length === 0 &&
          elevator.targetFloorsUp.length > 0
        ) {
          elevator.movingDirection = 'up';
        } else if (
          elevator.targetFloorsUp.length === 0 &&
          elevator.targetFloorsDown.length === 0
        ) {
          elevator.movingDirection = 'idle';
        }
      }

      if (server && previousFloor !== elevator.currentFloor) {
        server.emit('elevatorUpdate', {
          elevatorId: elevator.id,
          currentFloor: elevator.currentFloor,
          movingDirection: elevator.movingDirection,
        });
      }
    });
  }

  addPanelRequest(elevatorId: number, floor: number): Elevator | null {
    const elevator = this.elevators.get(elevatorId);
    if (!elevator) return null;

    // ignore if already on the floor or already in any queue
    if (
      elevator.currentFloor === floor ||
      elevator.targetFloorsUp.includes(floor) ||
      elevator.targetFloorsDown.includes(floor)
    )
      return elevator;

    if (elevator.movingDirection === 'idle') {
      elevator.movingDirection = elevator.currentFloor < floor ? 'up' : 'down';
    }

    if (floor > elevator.currentFloor) {
      elevator.targetFloorsUp.push(floor);
      elevator.targetFloorsUp.sort((a, b) => a - b); // always ascending
    } else if (floor < elevator.currentFloor) {
      elevator.targetFloorsDown.push(floor);
      elevator.targetFloorsDown.sort((a, b) => b - a); // always descending
    }

    return elevator;
  }
}
