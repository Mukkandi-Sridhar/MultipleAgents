import React from 'react';
import type { ChartDataPoint } from '../../types';

interface SVGChartProps {
  data: ChartDataPoint[];
}

export const SVGChart: React.FC<SVGChartProps> = ({ data }) => {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const chartHeight = 200;
  const chartWidth = 500;
  const paddingLeft = 60;
  const paddingBottom = 40;
  const paddingTop = 20;
  const paddingRight = 20;

  const graphWidth = chartWidth - paddingLeft - paddingRight;
  const graphHeight = chartHeight - paddingTop - paddingBottom;

  const barWidth = (graphWidth / data.length) * 0.6;
  const barSpacing = (graphWidth / data.length) * 0.4;

  return (
    <div className="glass-panel rounded-3xl p-6 shadow-glow-purple/10">
      <h4 className="text-xs font-bold text-slate-400 mb-6 uppercase tracking-widest flex items-center space-x-2">
        <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
        <span>Metrics Chart Visualizer</span>
      </h4>
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto min-w-[400px] text-slate-400"
        >
          {/* Gradients Definition */}
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="1" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="hoverGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="1" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.6" />
            </linearGradient>
            <filter id="shadowGlow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#8b5cf6" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Y Axis Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = paddingTop + graphHeight * (1 - ratio);
            const val = (maxValue * ratio).toFixed(0);
            return (
              <g key={idx}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  className="stroke-white/5"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 4}
                  className="fill-slate-500 text-[10px] font-semibold font-mono"
                  textAnchor="end"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Render Bars */}
          {data.map((d, i) => {
            const barHeight = (d.value / maxValue) * graphHeight;
            const x = paddingLeft + i * (barWidth + barSpacing) + barSpacing / 2;
            const y = paddingTop + graphHeight - barHeight;

            return (
              <g key={i} className="group cursor-pointer">
                {/* Visual Glow on Hover */}
                <rect
                  x={x - 2}
                  y={y - 2}
                  width={barWidth + 4}
                  height={barHeight + 2}
                  rx="6"
                  className="fill-brand-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                />
                {/* Real Bar with Gradient & DropShadow */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx="4"
                  fill="url(#barGradient)"
                  className="group-hover:fill-[url(#hoverGradient)] transition-all duration-300"
                  filter="url(#shadowGlow)"
                />
                {/* X Axis Labels */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - paddingBottom + 18}
                  className="fill-slate-400 text-[10px] font-semibold tracking-wider group-hover:fill-brand-300 transition-colors duration-200"
                  textAnchor="middle"
                >
                  {d.label.length > 8 ? `${d.label.slice(0, 7)}…` : d.label}
                </text>
                {/* Tooltip text */}
                <text
                  x={x + barWidth / 2}
                  y={y - 8}
                  className="fill-brand-300 text-[9px] font-bold font-mono opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  textAnchor="middle"
                >
                  {d.value.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* X Axis Base line */}
          <line
            x1={paddingLeft}
            y1={chartHeight - paddingBottom}
            x2={chartWidth - paddingRight}
            y2={chartHeight - paddingBottom}
            className="stroke-white/10"
            strokeWidth="1.5"
          />
        </svg>
      </div>
    </div>
  );
};
