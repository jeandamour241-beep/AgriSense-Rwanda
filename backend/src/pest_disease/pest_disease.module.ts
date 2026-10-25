import { Module } from '@nestjs/common';
import { PestDiseaseController } from './pest_disease.controller.js';
import { PestDiseaseService } from './pest_disease.service.js';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [PestDiseaseController],
  providers: [PestDiseaseService]
})
export class PestDiseaseModule {}
