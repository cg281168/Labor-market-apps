
import { IndicatorType, CharacteristicType, DataPoint, FrequencyType } from '../types';

const MOCK_REGIONS = ["Madrid", "Catalonia", "Andalusia", "Basque Country", "Valencia", "Galicia", "Castile and León", "Canary Islands", "Murcia", "Aragon"];
const MOCK_EDUCATION = ["Primary", "Secondary", "Vocational Training", "Higher Education"];
const MOCK_AGE_GROUPS = ["16-24", "25-54", "55+"];
const MOCK_GENDERS = ["Male", "Female"];

export const getAvailableItems = (characteristic: CharacteristicType): string[] => {
  switch (characteristic) {
    case CharacteristicType.REGION: return MOCK_REGIONS;
    case CharacteristicType.EDUCATION: return MOCK_EDUCATION;
    case CharacteristicType.AGE_GROUP: return MOCK_AGE_GROUPS;
    case CharacteristicType.GENDER: return MOCK_GENDERS;
    default: return [];
  }
};

export const fetchLaborData = async (
  indicator: IndicatorType,
  characteristic: CharacteristicType,
  frequency: FrequencyType,
  startYear: number,
  endYear: number,
  minAge: number,
  maxAge: number
): Promise<DataPoint[]> => {
  const data: DataPoint[] = [];
  const categories = getAvailableItems(characteristic);

  // Demographic adjustments based on age selection
  // In Spain, youth (16-25) unemployment is historically very high (~30%+)
  // Prime age (25-54) is lower (~10-12%)
  const ageCenter = (minAge + maxAge) / 2;
  const isYouthFocus = maxAge <= 30;
  const isSeniorFocus = minAge >= 55;

  let baseValue = 15; // Default for unemployment
  if (indicator === IndicatorType.LABOR_FORCE_RATE) baseValue = 58;
  if (indicator === IndicatorType.EMPLOYMENT_RATE) baseValue = 50;

  // Age-based base value adjustment
  if (indicator === IndicatorType.UNEMPLOYMENT_RATE) {
    if (isYouthFocus) baseValue = 32;
    else if (isSeniorFocus) baseValue = 12;
    else if (ageCenter > 30 && ageCenter < 50) baseValue = 11;
  } else if (indicator === IndicatorType.LABOR_FORCE_RATE) {
    if (isYouthFocus) baseValue = 35; // Many are studying
    else if (isSeniorFocus) baseValue = 25; // Many are retiring
    else baseValue = 82; // Prime age high participation
  }

  categories.forEach((cat) => {
    const seed = cat.length + indicator.length;
    let currentVal = baseValue + ((seed % 8) - 4);
    
    if (cat === "Madrid" || cat === "Basque Country") currentVal -= 3;
    if (cat === "Andalusia" || cat === "Canary Islands") currentVal += 5;
    if (cat === "Higher Education") currentVal -= 6;

    for (let year = startYear; year <= endYear; year++) {
      const cycleImpact = (y: number) => {
        if (indicator === IndicatorType.UNEMPLOYMENT_RATE) {
          if (y < 2008) return -5;
          if (y >= 2008 && y < 2013) return (y - 2008) * 3;
          if (y >= 2013 && y < 2020) return 15 - (y - 2013) * 1.5;
          if (y === 2020) return 3;
          return -2;
        }
        return 0;
      };

      if (frequency === FrequencyType.ANNUAL) {
        const volatility = (Math.sin(year + seed) * 0.4);
        const value = Math.max(2, currentVal + cycleImpact(year) + volatility);
        data.push({
          period: `${year}`,
          year,
          category: cat,
          value: parseFloat(value.toFixed(2))
        });
      } else {
        for (let q = 1; q <= 4; q++) {
          const seasonal = Math.sin(q * 1.5) * 0.5;
          const volatility = (Math.sin(year * 4 + q + seed) * 0.3);
          const value = Math.max(2, currentVal + cycleImpact(year) + seasonal + volatility);
          data.push({
            period: `${year}Q${q}`,
            year,
            category: cat,
            value: parseFloat(value.toFixed(2))
          });
        }
      }
    }
  });

  return data;
};
