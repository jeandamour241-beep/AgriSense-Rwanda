import {
  BadGatewayException,
  Injectable,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { IrrigationDto } from './dto/irrigation.dto.js';

@Injectable()
export class IrrigationService {
  constructor(
    private readonly httpService: HttpService,
  ) {}

  async recommend(dto: IrrigationDto) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          'http://localhost:8000/irrigation/recommend',
          dto,
        ),
      );

      return response.data;
    } catch (error) {
      console.error(
        'Python AI service error',
        // error?.message,
      );

      throw new BadGatewayException(
        'AI irrigation recommendation service is unavailable.',
      );
    }
  }
}