import { Body, Controller, Post } from '@nestjs/common';
import { CropRecommendationService } from './crop-recommendation.service.js';
import { CropRecommendationDto } from './dto/crop-recommendation.dto.js';

@Controller('crop-recommendation')
export class CropRecommendationController {
  constructor(
    private readonly cropRecommendationService: CropRecommendationService,
  ) {}

  // @Post()
  // async recommend(@Body() dto: CropRecommendationDto) {
  //   return this.cropRecommendationService.recommend(dto);
  // }
}
