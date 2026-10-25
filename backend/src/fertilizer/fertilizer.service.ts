import {
  BadGatewayException,
  Injectable,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { FertilizerDto } from './dto/fertilizer.dto.js';

@Injectable()
export class FertilizerService {
  constructor(
    private readonly httpService: HttpService,
  ) {}

  async recommend(dto: FertilizerDto) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          'http://127.0.0.1:8000/fertilizer/recommend',
          dto,
        ),
      );

      const result = response.data;

      if (!result?.success) {
        console.error(
          'Python fertilizer service returned an error:',
          result?.error,
        );

        throw new BadGatewayException(
          result?.error ||
            'Fertilizer recommendation failed.',
        );
      }

      return result;
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }

    //   console.error(
    //     'Fertilizer AI service error:',
    //     error?.response?.data || error?.message || error,
    //   );

      throw new BadGatewayException(
        'AI fertilizer recommendation service is unavailable.',
      );
    }
  }
}