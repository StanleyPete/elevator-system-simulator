import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InitialData } from './types';
import { AppService } from './app.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ElevatorGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;
  constructor(private readonly appService: AppService) {}
  afterInit() {
    setInterval(() => {
      this.appService.moveElevators(this.server);
    }, 1500);
  }
  //CONNECT
  handleConnection(client: Socket) {
    console.log(`Client: ${client.id} connected`);
    client.emit('welcome', { message: 'Witaj w serwerze WebSocket 🚀' });
  }

  //DISCONNECT
  handleDisconnect(client: Socket) {
    console.log(`Klient rozłączony: ${client.id}`);
  }

  // INITIAL DATA
  @SubscribeMessage('initial-data')
  handleInitialData(@MessageBody() data: InitialData) {
    this.appService.initializeElevators(
      data.totalFloors,
      data.numberOfElevators,
      data.positions,
    );
    const elevators = this.appService.getElevators();
    console.log(elevators);
    console.log('Number of floors:', this.appService.getNumberOfFloors());

    this.server.emit('elevatorMove', { elevatorId: 1, floor: data });
  }

  //CALL ELEVATOR
  @SubscribeMessage('call-elevator')
  handleCallElevator(@MessageBody() data: { floor: number }) {
    const elevator = this.appService.callElevator(data.floor);
    if (elevator) {
      this.server.emit('elevatorUpdate', {
        elevators: Array.from(this.appService.getElevators()),
      });
    }
  }

  //PANEL CALL
  @SubscribeMessage('panel-call')
  handlePanelCall(@MessageBody() data: { elevatorId: number; floor: number }) {
    const elevator = this.appService.addPanelRequest(
      data.elevatorId,
      data.floor,
    );
    if (elevator) {
      this.server.emit('elevatorUpdate', {
        elevatorId: elevator.id,
        currentFloor: elevator.currentFloor,
        movingDirection: elevator.movingDirection,
      });
    }
  }
}
