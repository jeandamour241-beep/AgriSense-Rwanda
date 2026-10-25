import { IsNumber, IsOptional, IsString } from 'class-validator';

export class IrrigationDto {
  @IsString()
  s1q1: string;

  @IsString()
  s1q2: string;

  @IsString()
  s1q3: string;

  @IsString()
  season: string;

  @IsNumber()
  s2q2: number;

  @IsString()
  s2q4: string;

  @IsString()
  s2q7: string;

  @IsString()
  s2q11: string;

  @IsString()
  @IsOptional()
  s4q1?: string;

  @IsString()
  @IsOptional()
  s4q6?: string;
}