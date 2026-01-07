
import { IndicatorType, CharacteristicType, DataPoint, FrequencyType, WageType } from '../types';

const MOCK_REGIONS = ["Total", "Madrid", "Catalonia", "Andalusia", "Basque Country", "Valencia", "Galicia", "Castile and León", "Canary Islands", "Murcia", "Aragon"];
const MOCK_EDUCATION = ["Total", "Primary", "Secondary", "Vocational Training", "Higher Education"];
const MOCK_AGE_GROUPS = ["Total", "16-24", "25-54", "55+"];
const MOCK_GENDERS = ["Total", "Male", "Female"];

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
  maxAge: number,
  wageType?: WageType
): Promise<DataPoint[]> => {
  const data: DataPoint[] = [];
  const categories = getAvailableItems(characteristic);

  // Demographic adjustments based on age selection
  const ageCenter = (minAge + maxAge) / 2;
  const isYouthFocus = maxAge <= 30;
  const isSeniorFocus = minAge >= 55;

  let baseValue = 15; 
  if (indicator === IndicatorType.LABOR_FORCE_RATE) baseValue = 58;
  if (indicator === IndicatorType.EMPLOYMENT_RATE) baseValue = 50;
  
  // Adjusted base for 2002 to reach ~2385.6 in 2024 for Total
  if (indicator === IndicatorType.MONTHLY_WAGE) baseValue = 1350; 

  // Age-based base value adjustment
  if (indicator === IndicatorType.UNEMPLOYMENT_RATE) {
    if (isYouthFocus) baseValue = 32;
    else if (isSeniorFocus) baseValue = 12;
    else if (ageCenter > 30 && ageCenter < 50) baseValue = 11;
  } else if (indicator === IndicatorType.LABOR_FORCE_RATE) {
    if (isYouthFocus) baseValue = 35;
    else if (isSeniorFocus) baseValue = 25;
    else baseValue = 82;
  } else if (indicator === IndicatorType.MONTHLY_WAGE) {
    if (isYouthFocus) baseValue = 950; 
    else if (isSeniorFocus) baseValue = 1750; 
    else baseValue = 1525; // Aligned baseline for general population (16-64)
  }

  const inflationFactor = (year: number) => {
    // Reference year is 2024 (multiplier 1.0)
    const annualRate = 0.022; 
    return Math.pow(1 + annualRate, 2024 - year);
  };

  categories.forEach((cat) => {
    const seed = cat.length + indicator.length;
    
    // Per-category adjustments
    let catAdjustment = 0;
    if (cat !== "Total") {
      catAdjustment = (seed % 8) - 4;
      if (indicator === IndicatorType.MONTHLY_WAGE) {
        catAdjustment = ((seed % 20) - 10) * 40; 
        if (cat === "Madrid" || cat === "Basque Country") catAdjustment += 400;
        if (cat === "Andalusia" || cat === "Canary Islands") catAdjustment -= 250;
        if (cat === "Higher Education") catAdjustment += 800;
        if (cat === "Primary") catAdjustment -= 400;
      } else {
        if (cat === "Madrid" || cat === "Basque Country") catAdjustment -= 3;
        if (cat === "Andalusia" || cat === "Canary Islands") catAdjustment += 5;
        if (cat === "Higher Education") catAdjustment -= 6;
      }
    }

    for (let year = startYear; year <= endYear; year++) {
      const yearIndex = year - 2002;
      
      const cycleImpact = (y: number) => {
        if (indicator === IndicatorType.UNEMPLOYMENT_RATE) {
          if (y < 2008) return -5;
          if (y >= 2008 && y < 2013) return (y - 2008) * 3;
          if (y >= 2013 && y < 2020) return 15 - (y - 2013) * 1.5;
          if (y === 2020) return 3;
          return -2;
        }
        if (indicator === IndicatorType.MONTHLY_WAGE) {
           // Refined growth to hit ~2385.6 target in 2024
           let growth = yearIndex * 35; 
           if (y >= 2008 && y < 2014) growth -= (y - 2008) * 12; 
           if (y >= 2021) growth += (y - 2021) * 30; // Post-covid adjustment
           return growth;
        }
        return 0;
      };

      if (frequency === FrequencyType.ANNUAL) {
        const volatilitySeed = (Math.sin(year + seed) * 0.4);
        let value: number;
        if (indicator === IndicatorType.MONTHLY_WAGE) {
          const volatility = volatilitySeed * 15;
          const nominalValue = Math.max(700, baseValue + catAdjustment + cycleImpact(year) + volatility);
          value = wageType === WageType.CONSTANT ? nominalValue * inflationFactor(year) : nominalValue;
        } else {
          value = Math.max(2, baseValue + catAdjustment + cycleImpact(year) + volatilitySeed);
        }
        
        data.push({
          period: `${year}`,
          year,
          category: cat,
          value: parseFloat(value.toFixed(2))
        });
      } else {
        for (let q = 1; q <= 4; q++) {
          const seasonal = Math.sin(q * 1.5) * 0.5;
          const volatilitySeed = (Math.sin(year * 4 + q + seed) * 0.3);
          let value: number;
          if (indicator === IndicatorType.MONTHLY_WAGE) {
            const volatility = volatilitySeed * 10;
            const nominalValue = Math.max(700, baseValue + catAdjustment + cycleImpact(year) + (seasonal * 10) + volatility);
            value = wageType === WageType.CONSTANT ? nominalValue * inflationFactor(year) : nominalValue;
          } else {
            value = Math.max(2, baseValue + catAdjustment + cycleImpact(year) + seasonal + volatilitySeed);
          }

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
