import { Module } from '@nestjs/common';

import { AppService } from './app.service';
import { ElevatorGateway } from './elevator.gateway';

@Module({
  imports: [],
  providers: [AppService, ElevatorGateway],
})
export class AppModule {}
