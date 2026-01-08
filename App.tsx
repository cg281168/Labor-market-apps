
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { IndicatorType, CharacteristicType, DataPoint, FrequencyType, Language, WageType } from './types';
import { fetchLaborData, getAvailableItems } from './services/ineService';
import ChartContainer from './components/ChartContainer';
import AnalysisPanel from './components/AnalysisPanel';
import { translations } from './translations';

const App: React.FC = () => {
  // Initialize language from localStorage or default to Galician
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('iberiadata_pref_lang');
    if (saved && Object.values(Language).includes(saved as Language)) {
      return saved as Language;
    }
    return Language.GL;
  });

  const [indicator, setIndicator] = useState<IndicatorType>(IndicatorType.UNEMPLOYMENT_RATE);
  const [wageType, setWageType] = useState<WageType>(WageType.CONSTANT);
  const [characteristic, setCharacteristic] = useState<CharacteristicType>(CharacteristicType.REGION);
  const [frequency, setFrequency] = useState<FrequencyType>(FrequencyType.QUARTERLY);
  const [startYear, setStartYear] = useState<number>(2014);
  const [endYear, setEndYear] = useState<number>(2024);
  const [minAge, setMinAge] = useState<number>(16);
  const [maxAge, setMaxAge] = useState<number>(64);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line');
  const [showEvents, setShowEvents] = useState<boolean>(true);
  const [rawData, setRawData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const t = translations[language];
  const allItems = useMemo(() => getAvailableItems(characteristic), [characteristic]);

  // Persist language preference
  useEffect(() => {
    localStorage.setItem('iberiadata_pref_lang', language);
  }, [language]);

  useEffect(() => {
    // Select Total and major regions by default
    setSelectedItems(allItems.slice(0, 4));
  }, [allItems]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const fetched = await fetchLaborData(indicator, characteristic, frequency, startYear, endYear, minAge, maxAge, wageType);
      setRawData(fetched);
    } catch (err) {
      console.error("Failed to load INE data", err);
    } finally {
      setLoading(false);
    }
  }, [indicator, characteristic, frequency, startYear, endYear, minAge, maxAge, wageType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredData = useMemo(() => {
    return rawData.filter(d => selectedItems.includes(d.category));
  }, [rawData, selectedItems]);

  const toggleItem = (item: string) => {
    setSelectedItems(prev => 
      prev.includes(item) 
        ? prev.filter(i => i !== item) 
        : [...prev, item]
    );
  };

  const years = Array.from({ length: 23 }, (_, i) => 2002 + i);
  const ageOptions = [16, 20, 25, 30, 35, 45, 55, 65, 75];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <i className="fa-solid fa-building-columns text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{t.appName}</h1>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest leading-none">{t.tagline}</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center bg-slate-100 p-1 rounded-lg gap-1">
              {Object.values(Language).map(lang => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                    language === lang ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            <div className="h-6 w-[1px] bg-slate-200 mx-2"></div>

            <div className="flex bg-slate-100 p-1 rounded-lg">
              {Object.values(FrequencyType).map(f => (
                <button
                  key={f}
                  onClick={() => setFrequency(f)}
                  className={`px-4 py-1 rounded-md text-xs font-bold transition-all ${
                    frequency === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {t.frequencies[f]}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-sm bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
              <select 
                value={startYear} 
                onChange={e => setStartYear(Number(e.target.value))}
                className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer"
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              <span className="text-slate-300">→</span>
              <select 
                value={endYear} 
                onChange={e => setEndYear(Number(e.target.value))}
                className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer"
              >
                {years.filter(y => y >= startYear).map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 space-y-6">
          <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t.config}</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t.metric}</label>
                <select 
                  value={indicator}
                  onChange={(e) => setIndicator(e.target.value as IndicatorType)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                >
                  {Object.values(IndicatorType).map(type => (
                    <option key={type} value={type}>{t.indicators[type]}</option>
                  ))}
                </select>
              </div>

              {indicator === IndicatorType.MONTHLY_WAGE && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t.wageType}</label>
                  <div className="flex bg-slate-100 p-1 rounded-lg">
                    {Object.values(WageType).map(w => (
                      <button
                        key={w}
                        onClick={() => setWageType(w)}
                        className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${
                          wageType === w ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {w === WageType.NOMINAL ? t.nominal : t.constant}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t.breakdown}</label>
                <select 
                  value={characteristic}
                  onChange={(e) => setCharacteristic(e.target.value as CharacteristicType)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                >
                  {Object.values(CharacteristicType).map(type => (
                    <option key={type} value={type}>{t.characteristics[type]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t.filterItems}</label>
                <div className="max-h-[180px] overflow-y-auto pr-2 space-y-1 custom-scrollbar">
                  {allItems.map(item => (
                    <label key={item} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group">
                      <input 
                        type="checkbox" 
                        checked={selectedItems.includes(item)}
                        onChange={() => toggleItem(item)}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className={`text-sm ${selectedItems.includes(item) ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
                        {t.itemLabels[item] || item}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="mt-2 flex justify-between px-1">
                  <button onClick={() => setSelectedItems(allItems)} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-tight">{t.selectAll}</button>
                  <button onClick={() => setSelectedItems([])} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-tight">{t.clear}</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t.visualization}</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['line', 'bar', 'area'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setChartType(type)}
                      className={`py-2 rounded-lg text-[10px] font-bold uppercase border transition-all ${
                        chartType === type ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl p-6 text-white shadow-lg overflow-hidden relative">
            <div className="relative z-10">
              <h3 className="font-bold mb-1 text-lg">{t.historicalAnalysis}</h3>
              <p className="text-xs text-indigo-100 mb-4 leading-relaxed">
                Visualizing labor market evolution. Direct integration with official INE JSON-stat API.
              </p>
              <div className="flex items-center gap-2 bg-white/10 w-fit px-3 py-1 rounded-full border border-white/20">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                <span className="text-[10px] font-bold uppercase tracking-wider">Live API Data</span>
              </div>
            </div>
            <i className="fa-solid fa-server absolute bottom-[-10px] right-[-10px] text-8xl text-indigo-400 opacity-10 rotate-12"></i>
          </div>
        </aside>

        <section className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {t.indicators[indicator]}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-bold uppercase tracking-wider border border-indigo-100">
                    {t.characteristics[characteristic]}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs text-slate-500 font-medium">
                    Official INE Data ({t.frequencies[frequency]})
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                <button className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors rounded-md hover:bg-white shadow-sm">
                  <i className="fa-solid fa-share mr-2"></i> {t.exportCsv}
                </button>
              </div>
            </div>

            {loading ? (
              <div className="h-[450px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
                  <p className="text-slate-400 text-sm font-medium">Retrieving real-time data from INEBase...</p>
                </div>
              </div>
            ) : filteredData.length > 0 ? (
              <ChartContainer data={filteredData} indicator={indicator} chartType={chartType} showEvents={showEvents} language={language} />
            ) : (
              <div className="h-[450px] flex flex-col items-center justify-center text-slate-400 gap-4">
                <i className="fa-solid fa-filter-circle-xmark text-5xl opacity-20"></i>
                <div className="text-center">
                  <p className="font-semibold text-slate-600">No data found</p>
                  <p className="text-xs">Adjust filters or select items to display data.</p>
                </div>
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
               <span className="text-[10px] text-slate-400 italic">
                Source: INE (Instituto Nacional de Estadística) - EPA & ETCL Series.
              </span>
              <a href="https://www.ine.es" target="_blank" rel="noreferrer" className="text-[10px] font-bold text-indigo-600 hover:underline">ine.es</a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <AnalysisPanel 
                indicator={indicator} 
                characteristic={characteristic} 
                data={filteredData} 
                ageRange={{ min: minAge, max: maxAge }} 
                language={language}
             />
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-clock-rotate-left text-indigo-400"></i>
                  {t.longTermTrends}
                </h3>
                <div className="space-y-4 text-sm text-slate-600">
                  <p>
                    {t.dynamicFilter === 'Filtro Dinámico' ? 'Analizando series históricas dende' : 'Analyzing historical series since'} <span className="font-bold text-slate-800">{startYear}</span>.
                  </p>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">API Information</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed italic">
                      "Data is fetched directly from the JSON-stat API. Inflation adjustments are calculated using the General CPI index (Base 2021) to ensure accurate cross-temporal wage comparisons."
                    </p>
                  </div>
                </div>
             </div>
          </div>
        </section>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
};

export default App;
