import { Controller, Get, Query } from '@nestjs/common';
import { AgricultureRiskMapService } from './agriculture-risk-map.service.js';

@Controller('agriculture-risk-map')
export class AgricultureRiskMapController {
  constructor(private readonly riskMapService: AgricultureRiskMapService) {}

  @Get('boundaries')
  getBoundaries() {
    return this.riskMapService.getBoundaries();
  }

  @Get('summary')
  getSummary() {
    return this.riskMapService.getSummary();
  }

  @Get('districts')
  getDistricts() {
    return this.riskMapService.getDistricts();
  }

  @Get('district-names')
  getDistrictNames() {
    return this.riskMapService.getDistrictNames();
  }

  @Get('indicators')
  getIndicators(
    @Query('module') module: string,
    @Query('season') season: string,
  ) {
    return this.riskMapService.getIndicators(module, season);
  }
}
