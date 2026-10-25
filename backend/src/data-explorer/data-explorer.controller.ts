
import { Controller, Get, Query } from '@nestjs/common';
import { DataExplorerService } from './data-explorer.service.js';

@Controller('data-explorer')
export class DataExplorerController {
  constructor(
    private readonly dataExplorerService: DataExplorerService,
  ) {}

  @Get('filters')
  getFilters() {
    return this.dataExplorerService.getFilters();
  }

  @Get('overview')
  getOverview(
    @Query('province') province?: string,
    @Query('district') district?: string,
    @Query('crop') crop?: string,
    @Query('season') season?: string,
  ) {
    return this.dataExplorerService.getOverview({
      province,
      district,
      crop,
      season,
    });
  }

  @Get('crops')
  getCrops(
    @Query('province') province?: string,
    @Query('district') district?: string,
    @Query('season') season?: string,
    @Query('limit') limit?: string,
  ) {
    return this.dataExplorerService.getCrops({
      province,
      district,
      season,
      limit: limit ? Number(limit) : 15,
    });
  }

  @Get('districts')
  getDistricts(
    @Query('crop') crop?: string,
    @Query('season') season?: string,
    @Query('province') province?: string,
    @Query('limit') limit?: string,
  ) {
    return this.dataExplorerService.getDistricts({
      crop,
      season,
      province,
      limit: limit ? Number(limit) : 30,
    });
  }

  @Get('seasons')
  getSeasons(
    @Query('district') district?: string,
    @Query('crop') crop?: string,
    @Query('province') province?: string,
  ) {
    return this.dataExplorerService.getSeasons({
      district,
      crop,
      province,
    });
  }

  @Get('table')
  getTable(
    @Query('province') province?: string,
    @Query('district') district?: string,
    @Query('crop') crop?: string,
    @Query('season') season?: string,
    @Query('page') page?: string,
    @Query('page_size') pageSize?: string,
  ) {
    return this.dataExplorerService.getTable({
      province,
      district,
      crop,
      season,
      page: page ? Number(page) : 1,
      page_size: pageSize ? Number(pageSize) : 20,
    });
  }
}