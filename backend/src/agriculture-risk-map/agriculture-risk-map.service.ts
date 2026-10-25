import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

interface DistrictFeature {
  type: 'Feature';
  properties?: {
    shapeName?: string;
    shapeISO?: string;
    shapeID?: string;
    shapeGroup?: string;
    shapeType?: string;
    [key: string]: unknown;
  };
  geometry?: {
    type: string;
    coordinates: unknown;
  } | null;
}

interface DistrictGeoJSON {
  type: 'FeatureCollection';
  features: DistrictFeature[];
}
interface DistrictSeasonSummary {
  district_clean: string;
  season: string;
  total_observed: number;
  reported_cases: number;
  reported_rate_pct: number | null;
  data_status: string;
}

type RiskMapModule = 'pest_disease' | 'irrigation';

@Injectable()
export class AgricultureRiskMapService {
  private readonly geoJsonPath = join(
    process.cwd(),
    'src',
    'agriculture-risk-map',
    'data',
    'rwanda_districts2.geojson',
  );
  private readonly pestSummaryPath = join(
    process.cwd(),
    'src',
    'agriculture-risk-map',
    'data',
    'pest_district_season_summary.csv',
  );
  private readonly irrigationSummaryPath = join(
    process.cwd(),
    'src',
    'agriculture-risk-map',
    'data',
    'irrigation_district_season_summary.csv',
  );

  getBoundaries() {
    if (!existsSync(this.geoJsonPath)) {
      throw new InternalServerErrorException(
        'Rwanda district GeoJSON file was not found.',
      );
    }

    try {
      const raw = readFileSync(this.geoJsonPath, 'utf8');
      const data = JSON.parse(raw) as DistrictGeoJSON;

      if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
        throw new Error(
          'GeoJSON must contain a FeatureCollection and features array.',
        );
      }

      const features = data.features.map((feature) => ({
        ...feature,
        properties: {
          ...feature.properties,
          // Standardize the district name for our API.
          district: feature.properties?.shapeName?.trim() ?? null,
          districtId: feature.properties?.shapeID ?? null,
          province: null,
        },
      }));

      return {
        type: 'FeatureCollection',
        features,
      };
    } catch {
      throw new InternalServerErrorException(
        'Unable to read the district GeoJSON file. Check that it is valid JSON.',
      );
    }
  }

  getSummary() {
    const geoJson = this.getBoundaries();

    return {
      totalFeatures: geoJson.features.length,
      message: 'District boundary data loaded successfully.',
    };
  }

  getDistricts() {
    const geoJson = this.getBoundaries();

    return geoJson.features.map((feature, index) => ({
      index: index + 1,
      geometryType: feature.geometry?.type ?? null,
      properties: feature.properties ?? {},
    }));
  }

  getDistrictNames() {
    const geoJson = this.getBoundaries();

    return {
      totalFeatures: geoJson.features.length,
      districts: geoJson.features.map((feature, index) => ({
        index: index + 1,
        name: feature.properties?.district ?? null,
        districtId: feature.properties?.districtId ?? null,
      })),
    };
  }

  getIndicators(module: string, season: string) {
    const validModules: RiskMapModule[] = ['pest_disease', 'irrigation'];

    const validSeasons = ['Season A', 'Season B', 'Season C'];

    if (!validModules.includes(module as RiskMapModule)) {
      throw new BadRequestException(
        'Module must be pest_disease or irrigation.',
      );
    }

    if (!validSeasons.includes(season)) {
      throw new BadRequestException(
        'Season must be Season A, Season B, or Season C.',
      );
    }

    const selectedModule = module as RiskMapModule;

    const summaryPath =
      selectedModule === 'pest_disease'
        ? this.pestSummaryPath
        : this.irrigationSummaryPath;

    const moduleLabel =
      selectedModule === 'pest_disease' ? 'Pest summary' : 'Irrigation summary';

    const indicatorType =
      selectedModule === 'pest_disease'
        ? 'historical_reported_occurrence'
        : 'historical_reported_irrigation_use';

    if (!existsSync(summaryPath)) {
      throw new InternalServerErrorException(
        `${moduleLabel} CSV was not found. Check the file path.`,
      );
    }

    try {
      const raw = readFileSync(summaryPath, 'utf8')
        .replace(/^\uFEFF/, '')
        .trim();

      const lines = raw.split(/\r?\n/);

      if (lines.length < 2) {
        throw new Error(`${moduleLabel} CSV is empty.`);
      }

      const headers = lines[0].split(',').map((h) => h.trim());

      const requiredColumns = [
        'district_clean',
        'season',
        'total_observed',
        'reported_cases',
        'reported_rate_pct',
        'data_status',
      ];

      for (const column of requiredColumns) {
        if (!headers.includes(column)) {
          throw new Error(`Missing CSV column: ${column}`);
        }
      }

      const columnIndex = (name: string) => headers.indexOf(name);

      const parseNullableNumber = (
        value: string | undefined,
      ): number | null => {
        if (value === undefined || value.trim() === '') {
          return null;
        }

        const parsed = Number(value);

        return Number.isFinite(parsed) ? parsed : null;
      };

      const summaries = new Map<string, DistrictSeasonSummary>();

      for (const line of lines.slice(1)) {
        if (!line.trim()) continue;

        const values = line.split(',');

        const rowSeason = values[columnIndex('season')]?.trim();

        if (rowSeason !== season) continue;

        const districtName = values[columnIndex('district_clean')]?.trim();

        if (!districtName) continue;

        const totalObserved =
          parseNullableNumber(values[columnIndex('total_observed')]) ?? 0;

        const reportedCases = parseNullableNumber(
          values[columnIndex('reported_cases')],
        );

        const reportedRatePct = parseNullableNumber(
          values[columnIndex('reported_rate_pct')],
        );

        const row: DistrictSeasonSummary = {
          district_clean: districtName,
          season: rowSeason,
          total_observed: totalObserved,
          reported_cases: reportedCases ?? 0,
          reported_rate_pct: reportedRatePct,
          data_status: values[columnIndex('data_status')]?.trim() || 'NO_DATA',
        };

        summaries.set(districtName.toLowerCase(), row);
      }

      const geoJson = this.getBoundaries();

      const features = geoJson.features.map((feature) => {
        const district = String(feature.properties?.district ?? '').trim();

        const districtKey = district.toLowerCase();
        const summary = summaries.get(districtKey);

        const hasObservations = !!summary && summary.total_observed > 0;

        return {
          ...feature,
          properties: {
            ...feature.properties,
            riskIndicator: {
              module: selectedModule,
              season,

              observedCount: hasObservations ? summary.total_observed : 0,

              // Do not represent missing observations as zero cases.
              reportedCases: hasObservations ? summary.reported_cases : null,

              reportedRatePct: hasObservations
                ? summary.reported_rate_pct
                : null,

              dataStatus: summary?.data_status ?? 'NO_DATA',
              indicatorType,
            },
          },
        };
      });

      return {
        type: 'FeatureCollection',
        module: selectedModule,
        season,
        totalDistricts: features.length,
        indicatorType,
        features,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Unable to process ${moduleLabel} CSV. Check its columns and contents.`,
      );
    }
  }
}
