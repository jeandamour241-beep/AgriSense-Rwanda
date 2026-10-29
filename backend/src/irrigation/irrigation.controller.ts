import { Body, Controller, Post } from '@nestjs/common';
import { IrrigationService } from './irrigation.service.js';
import { IrrigationDto } from './dto/irrigation.dto.js';

@Controller('irrigation')
export class IrrigationController {
  constructor(
    private readonly irrigationService: IrrigationService,
  ) {}

  @Post()
  async recommend(@Body() dto: IrrigationDto) {
    return this.irrigationService.recommend(dto);
  }
}