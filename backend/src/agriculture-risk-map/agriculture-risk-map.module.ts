import { Module } from '@nestjs/common';
import { AgricultureRiskMapController } from './agriculture-risk-map.controller.js';
import { AgricultureRiskMapService } from './agriculture-risk-map.service.js';

@Module({
  controllers: [AgricultureRiskMapController],
  providers: [AgricultureRiskMapService]
})
export class AgricultureRiskMapModule {}
