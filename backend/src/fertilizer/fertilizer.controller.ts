import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';

import { FertilizerService } from './fertilizer.service.js';
import { FertilizerDto } from './dto/fertilizer.dto.js';

@Controller('fertilizer')
export class FertilizerController {
  constructor(
    private readonly fertilizerService: FertilizerService,
  ) {}

  @Post()
  async recommend(@Body() dto: FertilizerDto) {
    return this.fertilizerService.recommend(dto);
  }
}