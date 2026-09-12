import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Activity, ChevronDown, ChevronUp, Gauge, Zap } from 'lucide-react';

export interface TelemetrySample {
  time: number;
  speed: number;
  throttle: number; // 0 to 100
}

interface RealtimeTelemetryChartProps {
  speed: number;
  throttle: number; // 0 to 100
  speedLimit: number;
  isExpandedDefault?: boolean;
}

export const RealtimeTelemetryChart: React.FC<RealtimeTelemetryChartProps> = ({
  speed,
  throttle,
  speedLimit,
  isExpandedDefault = true
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(isExpandedDefault);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dataRef = useRef<TelemetrySample[]>([]);
  const MAX_SAMPLES = 40;

  // Append new sample on tick / prop changes
  useEffect(() => {
    const now = Date.now();
    const cleanSpeed = Math.max(0, Math.round(speed));
    const cleanThrottle = Math.max(0, Math.min(100, Math.round(throttle)));

    const currentData = dataRef.current;
    currentData.push({
      time: now,
      speed: cleanSpeed,
      throttle: cleanThrottle
    });

    if (currentData.length > MAX_SAMPLES) {
      currentData.shift();
    }
  }, [speed, throttle]);

  // Periodic D3 render loop for high-performance 60fps graph updates without React re-render thrashing
  useEffect(() => {
    if (!isExpanded) return;

    let animId: number;

    const renderChart = () => {
      const svg = d3.select(svgRef.current);
      if (svg.empty()) return;

      const width = 280;
      const height = 80;
      const margin = { top: 8, right: 10, bottom: 18, left: 28 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      const samples = dataRef.current;
      if (samples.length < 2) return;

      // Ensure SVG viewbox and structure
      svg.attr('viewBox', `0 0 ${width} ${height}`);

      let g = svg.select<SVGGElement>('g.chart-content');
      if (g.empty()) {
        svg.selectAll('*').remove();

        // Add defs for gradient
        const defs = svg.append('defs');
        const speedGrad = defs.append('linearGradient')
          .attr('id', 'speed-area-gradient')
          .attr('x1', '0%').attr('y1', '0%')
          .attr('x2', '0%').attr('y2', '100%');

        speedGrad.append('stop')
          .attr('offset', '0%')
          .attr('stop-color', '#0284c7')
          .attr('stop-opacity', 0.4);

        speedGrad.append('stop')
          .attr('offset', '100%')
          .attr('stop-color', '#0284c7')
          .attr('stop-opacity', 0.0);

        g = svg.append('g')
          .attr('class', 'chart-content')
          .attr('transform', `translate(${margin.left},${margin.top})`);

        // Add grid lines group
        g.append('g').attr('class', 'grid');
        // Add speed area
        g.append('path').attr('class', 'speed-area').attr('fill', 'url(#speed-area-gradient)');
        // Add speed limit guideline
        g.append('line').attr('class', 'speed-limit-line');
        // Add speed line
        g.append('path').attr('class', 'speed-line')
          .attr('fill', 'none')
          .attr('stroke', '#38bdf8')
          .attr('stroke-width', 2)
          .attr('stroke-linecap', 'round');
        // Add throttle line
        g.append('path').attr('class', 'throttle-line')
          .attr('fill', 'none')
          .attr('stroke', '#10b981')
          .attr('stroke-width', 1.75)
          .attr('stroke-dasharray', '3 2')
          .attr('stroke-linecap', 'round');

        // Axes
        g.append('g').attr('class', 'y-axis').attr('color', '#64748b');
      }

      // Scales
      const xScale = d3.scaleLinear()
        .domain([0, MAX_SAMPLES - 1])
        .range([0, innerWidth]);

      // Y Scale up to max(80, speedLimit + 10)
      const maxVal = Math.max(80, speedLimit + 10);
      const yScale = d3.scaleLinear()
        .domain([0, maxVal])
        .range([innerHeight, 0]);

      // Grid line at 40 and 60
      const gridG = g.select('g.grid');
      gridG.selectAll('*').remove();
      [20, 40, 60].forEach(level => {
        if (level < maxVal) {
          gridG.append('line')
            .attr('x1', 0)
            .attr('x2', innerWidth)
            .attr('y1', yScale(level))
            .attr('y2', yScale(level))
            .attr('stroke', '#334155')
            .attr('stroke-width', 0.5)
            .attr('stroke-dasharray', '2 2');
        }
      });

      // Speed Limit reference line
      g.select('line.speed-limit-line')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', yScale(speedLimit))
        .attr('y2', yScale(speedLimit))
        .attr('stroke', '#ef4444')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4 3')
        .attr('opacity', 0.85);

      // Line generators
      const speedLineGenerator = d3.line<TelemetrySample>()
        .x((_, i) => xScale(i))
        .y(d => yScale(d.speed))
        .curve(d3.curveMonotoneX);

      const speedAreaGenerator = d3.area<TelemetrySample>()
        .x((_, i) => xScale(i))
        .y0(innerHeight)
        .y1(d => yScale(d.speed))
        .curve(d3.curveMonotoneX);

      const throttleLineGenerator = d3.line<TelemetrySample>()
        .x((_, i) => xScale(i))
        .y(d => yScale((d.throttle / 100) * maxVal))
        .curve(d3.curveMonotoneX);

      // Update paths
      g.select('path.speed-area').datum(samples).attr('d', speedAreaGenerator);
      g.select('path.speed-line').datum(samples).attr('d', speedLineGenerator);
      g.select('path.throttle-line').datum(samples).attr('d', throttleLineGenerator);

      // Y-axis tick labels
      const yAxis = d3.axisLeft(yScale)
        .ticks(3)
        .tickSize(-3)
        .tickFormat(d => `${d}`);

      g.select<SVGGElement>('g.y-axis')
        .call(yAxis)
        .call(axis => axis.select('.domain').remove())
        .call(axis => axis.selectAll('text').attr('font-size', '8px').attr('fill', '#94a3b8'));
    };

    const interval = setInterval(renderChart, 100);
    return () => {
      clearInterval(interval);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isExpanded, speedLimit]);

  const currentSpeed = Math.max(0, Math.round(speed));
  const currentThrottle = Math.max(0, Math.min(100, Math.round(throttle)));

  return (
    <div
      id="realtime-telemetry-panel"
      className="bg-slate-950/95 border border-slate-800 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md transition-all duration-200"
    >
      {/* Header bar with toggle */}
      <button
        type="button"
        id="toggle-telemetry-chart-btn"
        onClick={() => setIsExpanded(prev => !prev)}
        className="w-full px-2.5 py-1.5 flex items-center justify-between bg-slate-900/90 hover:bg-slate-850 transition-colors border-b border-slate-800/80 text-left"
        title="Toggle Real-Time D3.js Telemetry Graph"
      >
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-200">
            Live Telemetry
          </span>
          <span className="text-[9px] font-mono text-cyan-400 font-bold bg-cyan-950/70 px-1 py-0.2 rounded border border-cyan-800/40">
            D3.js
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Metrics */}
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className="text-cyan-300 font-bold flex items-center gap-0.5">
              <Gauge className="w-2.5 h-2.5" />
              {currentSpeed} <span className="text-[8px] text-slate-400">km/h</span>
            </span>
            <span className="text-emerald-400 font-bold flex items-center gap-0.5">
              <Zap className="w-2.5 h-2.5" />
              {currentThrottle}%
            </span>
          </div>

          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          )}
        </div>
      </button>

      {/* Collapsible Chart Canvas & Legend */}
      {isExpanded && (
        <div className="p-2 flex flex-col gap-1">
          {/* Legend row */}
          <div className="flex items-center justify-between text-[9px] font-mono px-1">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-1 text-cyan-300">
                <span className="w-2 h-0.5 bg-cyan-400 rounded-full inline-block" />
                Speed ({currentSpeed} km/h)
              </span>
              <span className="flex items-center gap-1 text-emerald-300">
                <span className="w-2 h-0.5 bg-emerald-400 border-b border-dashed border-emerald-400 rounded-full inline-block" />
                Throttle ({currentThrottle}%)
              </span>
            </div>
            <span className="flex items-center gap-1 text-red-400">
              <span className="w-2 h-0.5 bg-red-500 rounded-full inline-block" />
              Limit ({speedLimit})
            </span>
          </div>

          {/* D3 SVG Container */}
          <div className="w-full h-20 bg-slate-900/60 rounded-lg p-0.5 border border-slate-800/50 flex items-center justify-center">
            <svg
              ref={svgRef}
              className="w-full h-full"
              preserveAspectRatio="none"
            />
          </div>
        </div>
      )}
    </div>
  );
};
