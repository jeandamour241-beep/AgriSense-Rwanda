import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CropRecommendationDto {
  @IsString()
  s1q2: string;

  @IsString()
  season: string;

  @IsOptional()
  @IsNumber()
  s2q2?: number;

  @IsOptional()
  @IsString()
  s4q13?: string;

  @IsOptional()
  @IsString()
  s4q1?: string;

  @IsOptional()
  @IsString()
  s4q6?: string;
}
