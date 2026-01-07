
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { IndicatorType, CharacteristicType, DataPoint, FrequencyType } from './types';
import { fetchLaborData, getAvailableItems } from './services/ineService';
import ChartContainer from './components/ChartContainer';
import AnalysisPanel from './components/AnalysisPanel';

const App: React.FC = () => {
  const [indicator, setIndicator] = useState<IndicatorType>(IndicatorType.UNEMPLOYMENT_RATE);
  const [characteristic, setCharacteristic] = useState<CharacteristicType>(CharacteristicType.REGION);
  const [frequency, setFrequency] = useState<FrequencyType>(FrequencyType.QUARTERLY);
  const [startYear, setStartYear] = useState<number>(2005);
  const [endYear, setEndYear] = useState<number>(2024);
  const [minAge, setMinAge] = useState<number>(16);
  const [maxAge, setMaxAge] = useState<number>(64);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line');
  const [showEvents, setShowEvents] = useState<boolean>(true);
  const [rawData, setRawData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const allItems = useMemo(() => getAvailableItems(characteristic), [characteristic]);

  useEffect(() => {
    setSelectedItems(allItems.slice(0, 3));
  }, [allItems]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const fetched = await fetchLaborData(indicator, characteristic, frequency, startYear, endYear, minAge, maxAge);
      setRawData(fetched);
    } catch (err) {
      console.error("Failed to load INE data", err);
    } finally {
      setLoading(false);
    }
  }, [indicator, characteristic, frequency, startYear, endYear, minAge, maxAge]);

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
              <i className="fa-solid fa-chart-pie text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">IberiaData</h1>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest leading-none">INE Labor Intelligence</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {Object.values(FrequencyType).map(f => (
                <button
                  key={f}
                  onClick={() => setFrequency(f)}
                  className={`px-4 py-1 rounded-md text-xs font-bold transition-all ${
                    frequency === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {f}
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
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Configuration</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Metric</label>
                <select 
                  value={indicator}
                  onChange={(e) => setIndicator(e.target.value as IndicatorType)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                >
                  {Object.values(IndicatorType).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Age Range Filter</label>
                <div className="flex items-center gap-2">
                  <select 
                    value={minAge} 
                    onChange={e => setMinAge(Number(e.target.value))}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                  >
                    {ageOptions.map(age => <option key={age} value={age}>Min: {age}</option>)}
                  </select>
                  <span className="text-slate-400 text-xs">to</span>
                  <select 
                    value={maxAge} 
                    onChange={e => setMaxAge(Number(e.target.value))}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                  >
                    {ageOptions.filter(a => a > minAge).map(age => <option key={age} value={age}>Max: {age === 75 ? '75+' : age}</option>)}
                    {maxAge === 64 && !ageOptions.includes(64) && <option value={64}>Max: 64</option>}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Breakdown</label>
                <select 
                  value={characteristic}
                  onChange={(e) => setCharacteristic(e.target.value as CharacteristicType)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                >
                  {Object.values(CharacteristicType).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Filter Items</label>
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
                        {item}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="mt-2 flex justify-between px-1">
                  <button onClick={() => setSelectedItems(allItems)} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-tight">Select All</button>
                  <button onClick={() => setSelectedItems([])} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-tight">Clear</button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <label className="block text-sm font-semibold text-slate-700 mb-3">Contextual Layers</label>
                <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-xs font-medium text-slate-600">Recession Markers</span>
                  <button 
                    onClick={() => setShowEvents(!showEvents)}
                    className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${showEvents ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${showEvents ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Visualization</label>
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
              <h3 className="font-bold mb-1 text-lg">Demographic Shift</h3>
              <p className="text-xs text-indigo-100 mb-4 leading-relaxed">
                Refining analysis for ages {minAge}-{maxAge}. Observe how participation varies by generation.
              </p>
              <div className="flex items-center gap-2 bg-white/10 w-fit px-3 py-1 rounded-full border border-white/20">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                <span className="text-[10px] font-bold uppercase tracking-wider">Dynamic Filter</span>
              </div>
            </div>
            <i className="fa-solid fa-users-line absolute bottom-[-10px] right-[-10px] text-8xl text-indigo-400 opacity-10 rotate-12"></i>
          </div>
        </aside>

        <section className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{indicator}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-bold uppercase tracking-wider border border-indigo-100">
                    {characteristic}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs text-slate-500 font-medium">
                    Ages {minAge}-{maxAge} ({frequency})
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                <button className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors rounded-md hover:bg-white shadow-sm">
                  <i className="fa-solid fa-share mr-2"></i> Export CSV
                </button>
              </div>
            </div>

            {loading ? (
              <div className="h-[450px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
                  <p className="text-slate-400 text-sm font-medium">Aggregating historical EPA datasets...</p>
                </div>
              </div>
            ) : filteredData.length > 0 ? (
              <ChartContainer data={filteredData} indicator={indicator} chartType={chartType} showEvents={showEvents} />
            ) : (
              <div className="h-[450px] flex flex-col items-center justify-center text-slate-400 gap-4">
                <i className="fa-solid fa-filter-circle-xmark text-5xl opacity-20"></i>
                <div className="text-center">
                  <p className="font-semibold text-slate-600">No items selected</p>
                  <p className="text-xs">Please select at least one {characteristic} from the sidebar to visualize.</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <AnalysisPanel 
                indicator={indicator} 
                characteristic={characteristic} 
                data={filteredData} 
                ageRange={{ min: minAge, max: maxAge }} 
             />
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <i className="fa-solid fa-clock-rotate-left text-indigo-400"></i>
                  Long-term Trends
                </h3>
                <div className="space-y-4 text-sm text-slate-600">
                  <p>
                    Analyzing workers from <span className="font-bold text-slate-800">{minAge}</span> to <span className="font-bold text-slate-800">{maxAge}</span> years old. This provides a granular look at economic participation.
                  </p>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Historical Context</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed italic">
                      "EPA data includes specific micro-data for the selected age cohort, allowing for precise comparison of demographic segments across the {startYear}-{endYear} horizon."
                    </p>
                  </div>
                  <div className="pt-2">
                    <button className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors">
                      Download Full Methodology
                    </button>
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
