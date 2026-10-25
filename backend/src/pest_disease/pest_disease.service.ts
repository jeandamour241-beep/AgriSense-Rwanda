import {
  BadGatewayException,
  Injectable,
} from '@nestjs/common';

import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

import { PestDiseaseDto } from './dto/pest-disease.dto.js';

@Injectable()
export class PestDiseaseService {
  constructor(
    private readonly httpService: HttpService,
  ) {}

  async recommend(dto: PestDiseaseDto) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          'http://localhost:8000/pest-disease/recommend',
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
        'AI pest/disease early warning service is unavailable.',
      );
    }
  }
}