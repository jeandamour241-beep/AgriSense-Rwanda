import { Module } from '@nestjs/common';
import { CropRecommendationController } from './crop-recommendation.controller.js';
import { CropRecommendationService } from './crop-recommendation.service.js';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [CropRecommendationController],
  providers: [CropRecommendationService]
})
export class CropRecommendationModule {}
