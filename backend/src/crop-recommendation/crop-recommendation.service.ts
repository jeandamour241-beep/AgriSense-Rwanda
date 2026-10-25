import {
  BadGatewayException,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CropRecommendationDto } from './dto/crop-recommendation.dto.js';


@Injectable()
export class CropRecommendationService {
  constructor(
    private readonly httpService: HttpService,
  ) {}

  async recommend(dto: CropRecommendationDto) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          'http://localhost:8000/crop-recommendation',
          dto,
        ),
      );

      return response.data;
    } catch (error: any) {
      const upstreamStatus = error?.response?.status;
      const upstreamData = error?.response?.data;
      const detail =
        upstreamData?.detail ?? upstreamData?.message ?? error?.message;

      if (upstreamStatus) {
        throw new HttpException(
          {
            message: typeof detail === 'string' ? detail : 'Crop recommendation failed.',
            details: upstreamData,
          },
          upstreamStatus,
        );
      }

      throw new BadGatewayException(
        `AI recommendation service is unavailable: ${error?.message ?? 'connection failed'}`,
      );
    }
  }
}
