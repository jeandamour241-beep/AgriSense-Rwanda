import { Module } from '@nestjs/common';
import { DataExplorerController } from './data-explorer.controller.js';
import { DataExplorerService } from './data-explorer.service.js';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [DataExplorerController],
  providers: [DataExplorerService]
})
export class DataExplorerModule {}
