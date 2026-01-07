
import React, { useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  AreaChart, Area, BarChart, Bar, ReferenceArea, Label 
} from 'recharts';
import { DataPoint, ChartDataItem, IndicatorType } from '../types';

interface ChartContainerProps {
  data: DataPoint[];
  indicator: IndicatorType;
  chartType: 'line' | 'bar' | 'area';
  showEvents?: boolean;
}

const ChartContainer: React.FC<ChartContainerProps> = ({ data, indicator, chartType, showEvents }) => {
  const chartData = useMemo(() => {
    const periods: string[] = Array.from(new Set(data.map(d => d.period)));
    const categories: string[] = Array.from(new Set(data.map(d => d.category)));
    
    return periods.map(period => {
      const item: ChartDataItem = { period };
      categories.forEach(cat => {
        const found = data.find(d => d.period === period && d.category === cat);
        if (found) {
          item[cat] = found.value;
        }
      });
      return item;
    });
  }, [data]);

  const categories = useMemo<string[]>(() => Array.from(new Set(data.map(d => d.category))), [data]);
  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  // Determine if we are looking at quarterly or annual data based on the first period string
  const isQuarterly = chartData.length > 0 && chartData[0].period.includes('Q');

  const recessionAreas = useMemo(() => {
    if (!showEvents) return [];
    
    const events = [
      {
        name: 'Great Recession',
        start: isQuarterly ? '2008Q2' : '2008',
        end: isQuarterly ? '2013Q4' : '2013',
        color: '#f1f5f9'
      },
      {
        name: 'COVID-19',
        start: isQuarterly ? '2020Q1' : '2020',
        end: isQuarterly ? '2021Q2' : '2021',
        color: '#f1f5f9'
      }
    ];

    // Only return events that overlap with current chart data range
    const availablePeriods = chartData.map(d => d.period);
    return events.filter(event => 
      availablePeriods.includes(event.start) || 
      availablePeriods.includes(event.end) ||
      (availablePeriods[0] < event.start && availablePeriods[availablePeriods.length-1] > event.end)
    );
  }, [showEvents, isQuarterly, chartData]);

  const renderEvents = () => (
    <>
      {recessionAreas.map((area) => (
        <ReferenceArea 
          key={area.name}
          x1={area.start} 
          x2={area.end} 
          fill={area.color} 
          fillOpacity={0.6}
          stroke="none"
          ifOverflow="extendDomain"
        >
          <Label 
            value={area.name} 
            position="top" 
            offset={10} 
            fontSize={10} 
            fontWeight={600}
            fill="#94a3b8" 
          />
        </ReferenceArea>
      ))}
    </>
  );

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 20, right: 30, left: 0, bottom: 0 },
    };

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              {categories.map((cat, idx) => (
                <linearGradient key={`grad-${cat}`} id={`color${idx}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={colors[idx % colors.length]} stopOpacity={0.1}/>
                  <stop offset="95%" stopColor={colors[idx % colors.length]} stopOpacity={0}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} minTickGap={30} />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} unit="%" />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend verticalAlign="top" height={36}/>
            {renderEvents()}
            {categories.map((cat, idx) => (
              <Area 
                key={cat} 
                type="monotone" 
                dataKey={cat} 
                stroke={colors[idx % colors.length]} 
                fillOpacity={1} 
                fill={`url(#color${idx})`} 
                strokeWidth={2}
                animationDuration={1000}
              />
            ))}
          </AreaChart>
        );
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} minTickGap={30} />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} unit="%" />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend verticalAlign="top" height={36}/>
            {renderEvents()}
            {categories.map((cat, idx) => (
              <Bar 
                key={cat} 
                dataKey={cat} 
                fill={colors[idx % colors.length]} 
                radius={[4, 4, 0, 0]} 
                animationDuration={1000}
              />
            ))}
          </BarChart>
        );
      default:
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="period" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} minTickGap={30} />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} unit="%" />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend verticalAlign="top" height={36}/>
            {renderEvents()}
            {categories.map((cat, idx) => (
              <Line 
                key={cat} 
                type="monotone" 
                dataKey={cat} 
                stroke={colors[idx % colors.length]} 
                strokeWidth={2.5} 
                dot={{ r: 3, fill: colors[idx % colors.length] }}
                activeDot={{ r: 5, strokeWidth: 0 }}
                animationDuration={1000}
              />
            ))}
          </LineChart>
        );
    }
  };

  return (
    <div className="w-full h-[400px] md:h-[500px]">
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};

export default ChartContainer;
