
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { IndicatorType, CharacteristicType, DataPoint } from '../types';

interface AnalysisPanelProps {
  indicator: IndicatorType;
  characteristic: CharacteristicType;
  data: DataPoint[];
  ageRange?: { min: number, max: number };
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ indicator, characteristic, data, ageRange }) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const generateAnalysis = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const latestData = data.slice(-5); // Get a sample of latest data
      const dataSummary = latestData.map(d => `${d.category} (${d.period}): ${d.value}%`).join(', ');

      const prompt = `Analyze the following Spanish labor market data from INE (EPA).
      Indicator: ${indicator}
      Dimension: ${characteristic}
      Population Segment: Age ${ageRange?.min || 16} to ${ageRange?.max || 75}+
      Key Data Points: ${dataSummary}
      
      Provide a professional economic summary in 3 short paragraphs:
      1. Overall trend for this specific age segment.
      2. Notable disparities between ${characteristic} categories.
      3. A brief forward-looking economic insight for Spain regarding this demographic.
      Use professional tone. If the segment is very young or very old, mention the specific structural challenges (e.g. youth unemployment or early retirement).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setAnalysis(response.text || 'No analysis available.');
    } catch (error) {
      console.error("Analysis failed:", error);
      setAnalysis("Unable to generate analysis at this moment. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <i className="fa-solid fa-microchip text-indigo-500"></i>
          AI Economic Insights
        </h3>
        {!analysis && !loading && (
          <button 
            onClick={generateAnalysis}
            className="text-sm px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
          >
            Generate Report
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto min-h-[200px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="text-sm animate-pulse">Economist AI is thinking...</p>
          </div>
        ) : analysis ? (
          <div className="prose prose-slate prose-sm max-w-none text-slate-600 leading-relaxed whitespace-pre-line">
            {analysis}
            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Powered by Gemini 3</span>
              <button 
                onClick={() => setAnalysis('')}
                className="text-xs text-indigo-600 hover:underline"
              >
                Clear
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center px-4">
            <i className="fa-solid fa-chart-line text-4xl mb-3 opacity-20"></i>
            <p className="text-sm">Click the button above to receive a personalized AI analysis for the selected age group.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisPanel;
