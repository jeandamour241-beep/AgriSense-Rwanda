import { Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsString,
} from 'class-validator';

export class PestDiseaseDto {
  @IsString()
  s1q1: string;

  @IsString()
  s1q2: string;

  @IsString()
  s1q3: string;

  @IsIn(['Season A', 'Season B', 'Season C'])
  season: string;

  @Type(() => Number)
  @IsNumber()
  s2q2: number;

  @IsString()
  s2q4: string;

  @IsString()
  s2q7: string;

  @IsString()
  s2q11: string;

  @IsString()
  s3q1: string;

  @IsString()
  s3q7: string;

  @IsString()
  s3q8: string;

  @IsString()
  s3q9: string;

  @IsString()
  s4q1: string;

  @IsString()
  s4q2: string;

  @IsString()
  s4q3: string;

  @IsString()
  s4q4: string;

  @IsString()
  s4q6: string;

  @IsString()
  s4q8: string;

  @IsString()
  s4q13: string;
}