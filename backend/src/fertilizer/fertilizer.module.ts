import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { FertilizerController } from './fertilizer.controller.js';
import { FertilizerService } from './fertilizer.service.js';

@Module({
  imports: [HttpModule],
  controllers: [FertilizerController],
  providers: [FertilizerService],
  exports: [FertilizerService],
})
export class FertilizerModule {}