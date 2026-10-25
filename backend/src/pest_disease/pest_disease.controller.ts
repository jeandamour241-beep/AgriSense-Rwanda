import {
  Body,
  Controller,
  Post,
} from '@nestjs/common';

import { PestDiseaseDto } from './dto/pest-disease.dto.js';
import { PestDiseaseService } from './pest_disease.service.js';

@Controller('pest-disease')
export class PestDiseaseController {
  constructor(
    private readonly pestDiseaseService: PestDiseaseService,
  ) {}

  @Post()
  async recommend(
    @Body() dto: PestDiseaseDto,
  ) {
    return this.pestDiseaseService.recommend(dto);
  }
}
