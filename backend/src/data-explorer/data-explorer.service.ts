
import {
  Injectable,
  BadGatewayException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class DataExplorerService {
  private readonly baseUrl =
    process.env.AI_ML_API_URL ?? 'http://127.0.0.1:8000';

  constructor(private readonly httpService: HttpService) {}

  private async request(
    endpoint: string,
    params: Record<string, string | number | undefined> = {},
  ) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(
          `${this.baseUrl}/data-explorer/${endpoint}`,
          { params },
        ),
      );

      return response.data;
    } catch {
      throw new BadGatewayException(
        'Failed to retrieve agriculture data from the AI/ML service.',
      );
    }
  }

  getFilters() {
    return this.request('filters');
  }

  getOverview(params: Record<string, string | undefined>) {
    return this.request('overview', params);
  }

  getCrops(
    params: Record<string, string | number | undefined>,
  ) {
    return this.request('crops', params);
  }

  getDistricts(
    params: Record<string, string | number | undefined>,
  ) {
    return this.request('districts', params);
  }

  getSeasons(params: Record<string, string | undefined>) {
    return this.request('seasons', params);
  }

  getTable(
    params: Record<string, string | number | undefined>,
  ) {
    return this.request('table', params);
  }
}