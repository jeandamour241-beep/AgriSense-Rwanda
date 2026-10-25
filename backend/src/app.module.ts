import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { CropRecommendationModule } from './crop-recommendation/crop-recommendation.module.js';
import { IrrigationModule } from './irrigation/irrigation.module.js';
import { PestDiseaseModule } from './pest_disease/pest_disease.module.js';
import { FertilizerModule } from './fertilizer/fertilizer.module.js';
import { DataExplorerModule } from './data-explorer/data-explorer.module.js';
import { AgricultureRiskMapModule } from './agriculture-risk-map/agriculture-risk-map.module.js';
import { AppController } from './app.controller.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    CropRecommendationModule,
    IrrigationModule,
    PestDiseaseModule,
    FertilizerModule,
    DataExplorerModule,
    AgricultureRiskMapModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
