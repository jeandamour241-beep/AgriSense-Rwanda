import { Type } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsString,
} from 'class-validator';

export class FertilizerDto {
  @IsString()
  @IsNotEmpty()
  s1q1: string;

  @IsString()
  @IsNotEmpty()
  s1q2: string;

  @IsString()
  @IsNotEmpty()
  s1q3: string;

  @IsIn(['Season A', 'Season B', 'Season C'])
  season: string;

  @Type(() => Number)
  @IsNumber()
  s2q2: number;

  @IsString()
  @IsNotEmpty()
  s2q4: string;

  @IsString()
  @IsNotEmpty()
  s2q7: string;

  @IsString()
  @IsNotEmpty()
  s2q11: string;

  @IsString()
  @IsNotEmpty()
  s4q1: string;

  @IsString()
  @IsNotEmpty()
  s4q6: string;
}