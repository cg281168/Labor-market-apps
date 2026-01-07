
export enum Language {
  EN = 'en',
  ES = 'es',
  GL = 'gl',
  EU = 'eu',
  CA = 'ca',
}

export enum IndicatorType {
  UNEMPLOYMENT_RATE = 'Unemployment Rate',
  LABOR_FORCE_RATE = 'Labor Force Rate',
  EMPLOYMENT_RATE = 'Employment Rate',
}

export enum CharacteristicType {
  REGION = 'Autonomous Community',
  EDUCATION = 'Education Level',
  AGE_GROUP = 'Age Group',
  GENDER = 'Gender',
}

export enum FrequencyType {
  QUARTERLY = 'Quarterly',
  ANNUAL = 'Annual',
}

export interface DataPoint {
  period: string;
  value: number;
  category: string;
  year: number;
}

export interface INESeries {
  Nombre: string;
  COD: string;
  Data: Array<{
    Fecha: number;
    Anyo: number;
    FK_Periodo: number;
    Valor: number;
    NombrePeriodo: string;
  }>;
}

export interface ChartDataItem {
  period: string;
  [key: string]: string | number;
}
