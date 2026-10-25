import { Module } from '@nestjs/common';
import { IrrigationController } from './irrigation.controller.js';
import { IrrigationService } from './irrigation.service.js';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [IrrigationController],
  providers: [IrrigationService]
})
export class IrrigationModule {}
