import React, { useState } from 'react';
import { Area } from '@ant-design/charts';

export default function AiAlertsPage({ alerts = [], mlInsights }) {
  const [filter, setFilter] = useState('All');
  const [selectedId, setSelectedId] = useState(null);

  // Format alerts to match the screenshot
  const allAlerts = [];
  
  if (mlInsights?.is_anomaly) {
    allAlerts.push({
      id: 'ml-1',
      level: 'High',
      title: 'AI Anomaly Detected - turbine_01',
      desc: mlInsights.diagnosis || 'Abnormal pattern detected',
      time: new Date().toLocaleTimeString(),
      source: 'TURBINE 01',
      duration: 'Anomaly persisted for 12 seconds'
    });
  }
  
  alerts.forEach((a, i) => {
    if (a.level === 'ok') return;
    allAlerts.push({
      id: `rule-${i}`,
      level: a.level === 'critical' ? 'High' : (a.level === 'warning' ? 'Warning' : 'Low'),
      title: `${a.title} - turbine_01`,
      desc: a.desc,
      time: new Date().toLocaleTimeString(),
      source: 'TURBINE 01',
      duration: 'Threshold violation event'
    });
  });

  const filteredAlerts = filter === 'All' ? allAlerts : allAlerts.filter(a => a.level === filter);
  const selectedAlert = filteredAlerts.find(a => a.id === selectedId) || filteredAlerts[0] || null;

  // Mock chart data for Sensor Impact Analysis
  const chartData = [
    { sensor: 'vibration', impact: 7.2 },
    { sensor: 'bearing_temp', impact: 6.8 },
    { sensor: 'flow_rate', impact: 5.5 },
    { sensor: 'stator_temp', impact: 4.8 },
    { sensor: 'frequency', impact: 4.5 },
  ];

  const chartColor = selectedAlert?.level === 'High' ? '#ef4444' : selectedAlert?.level === 'Warning' ? '#f59e0b' : '#22d3ee';

  const config = {
    data: chartData,
    xField: 'sensor',
    yField: 'impact',
    smooth: true,
    point: { size: 4, shape: 'circle', style: { fill: chartColor } },
    line: { style: { stroke: chartColor, lineWidth: 3 } },
    style: { fill: `linear-gradient(-90deg, transparent 0%, ${chartColor}30 100%)` },
    scale: { y: { domain: [0, 10] } },
    axis: {
      x: { label: { style: { fill: '#6a9bb5', fontSize: 10 } } },
      y: { label: { style: { fill: '#6a9bb5', fontSize: 10 } }, grid: { style: { stroke: '#164260' } } }
    },
    theme: { view: { viewFill: 'transparent' } },
    height: 180,
  };

  return (
    <div className="flex gap-6 items-start text-[#e8f4f8] font-sans h-full">
      
      {/* LEFT COLUMN: Filters */}
      <div className="w-64 flex flex-col gap-4 bg-[#0b2236]/80 border border-[#164260] rounded-xl p-5 shrink-0 shadow-lg">
        <h3 className="text-sm font-bold tracking-wide mb-2">Alert Filter Controls</h3>
        
        <button 
          onClick={() => setFilter('High')}
          className={`py-3 rounded-lg border font-bold text-sm tracking-widest transition-all cursor-pointer ${filter === 'High' ? 'bg-red-500/20 border-red-500 text-red-400' : 'border-red-500/30 text-red-500 hover:bg-red-500/10'}`}
        >
          High
        </button>
        <button 
          onClick={() => setFilter('Warning')}
          className={`py-3 rounded-lg border font-bold text-sm tracking-widest transition-all cursor-pointer ${filter === 'Warning' ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'border-amber-500/30 text-amber-500 hover:bg-amber-500/10'}`}
        >
          Warning
        </button>
        <button 
          onClick={() => setFilter('Low')}
          className={`py-3 rounded-lg border font-bold text-sm tracking-widest transition-all cursor-pointer ${filter === 'Low' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'border-cyan-500/30 text-cyan-500 hover:bg-cyan-500/10'}`}
        >
          Low
        </button>

        <button 
          onClick={() => setFilter('All')}
          className={`mt-4 py-3 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 font-bold text-sm tracking-widest flex items-center justify-center gap-2 hover:bg-red-500/10 transition-all cursor-pointer`}
        >
          <span>≡</span> Clear All Alerts
        </button>
      </div>

      {/* MIDDLE COLUMN: Alert List */}
      <div className="flex-1 flex flex-col gap-4 min-w-[350px]">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 text-center text-[#6a9bb5] border border-[#164260] rounded-xl bg-[#0b2236]/80 shadow-lg">
            No active alerts in this category.
          </div>
        ) : (
          filteredAlerts.map(alert => {
            const isHigh = alert.level === 'High';
            const isWarn = alert.level === 'Warning';
            const isSelected = selectedAlert?.id === alert.id;
            const colorClass = isHigh ? 'border-l-red-500 text-red-500' : isWarn ? 'border-l-amber-500 text-amber-500' : 'border-l-cyan-500 text-cyan-500';
            const bgClass = isSelected ? 'bg-[#0f2d44]' : 'bg-[#0b2236]/90';
            
            return (
              <div 
                key={alert.id} 
                onClick={() => setSelectedId(alert.id)}
                className={`${bgClass} border border-[#164260] border-l-4 rounded-xl p-5 relative shadow-md transition-all hover:-translate-y-0.5 cursor-pointer ${colorClass}`}
              >
                <h4 className="text-[15px] font-bold mb-1.5 text-white">{alert.title}</h4>
                <p className="text-[#a3c4d4] text-xs mb-3">{alert.duration}</p>
                <div className={`text-[10px] font-bold tracking-widest uppercase ${isHigh ? 'text-red-500' : isWarn ? 'text-amber-500' : 'text-cyan-500'}`}>
                  {alert.source} • {alert.time}
                </div>
                <button className="absolute top-4 right-4 text-[#6a9bb5] hover:text-white transition-colors cursor-pointer text-lg">
                  ✕
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* RIGHT COLUMN: AI Analysis */}
      <div className="w-[500px] flex flex-col gap-6 bg-[#0b2236]/80 border border-[#164260] rounded-xl p-6 shrink-0 shadow-lg">
        {selectedAlert ? (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">{selectedAlert.title}</h2>
              <span className={`px-4 py-1 rounded font-bold tracking-wider text-xs ${selectedAlert.level === 'High' ? 'bg-red-500 text-white' : selectedAlert.level === 'Warning' ? 'bg-amber-500 text-[#071a2b]' : 'bg-cyan-500 text-[#071a2b]'}`}>
                {selectedAlert.level}
              </span>
            </div>

            {/* Chart Section */}
            <div>
              <h3 className="text-sm font-bold mb-4 text-white">Sensor Impact Analysis</h3>
              <div className="bg-[#071a2b]/80 border border-[#164260] rounded-xl p-4">
                <Area {...config} />
              </div>
            </div>

            {/* Root Cause */}
            <div>
              <h3 className="text-sm font-bold mb-3 text-white">Root-Cause Analysis</h3>
              <div className="bg-[#071a2b]/80 border border-[#164260] rounded-xl p-4">
                <p className="text-sm text-[#e8f4f8] mb-2 font-medium">
                  {selectedAlert.level === 'High' && mlInsights?.diagnosis 
                    ? mlInsights.diagnosis 
                    : "Abnormal pattern detected in telemetry stream during recent operation cycle."}
                </p>
                <p className="text-xs text-[#6a9bb5]">Top contributing sensors: vibration_mms, bearing_temp_c, active_power_mw</p>
              </div>
            </div>

            {/* Recommended Actions */}
            <div>
              <h3 className="text-sm font-bold mb-3 text-white">Recommended Actions</h3>
              <div className="flex flex-col gap-2">
                <div className="bg-[#071a2b]/80 border border-[#164260] rounded-xl p-3.5 flex items-start gap-3">
                  <span className="text-amber-500 font-bold">›</span>
                  <p className="text-sm text-[#e8f4f8]">
                    {selectedAlert.level === 'High' && mlInsights?.action_required 
                      ? mlInsights.action_required 
                      : "Immediate inspection of physical components recommended. Adjust flow rate and monitor temperatures."}
                  </p>
                </div>
                <div className="bg-[#071a2b]/80 border border-[#164260] rounded-xl p-3.5 flex items-start gap-3">
                  <span className="text-amber-500 font-bold">›</span>
                  <p className="text-sm text-[#e8f4f8]">Review sensor trends for the past hour</p>
                </div>
                <div className="bg-[#071a2b]/80 border border-[#164260] rounded-xl p-3.5 flex items-start gap-3">
                  <span className="text-amber-500 font-bold">›</span>
                  <p className="text-sm text-[#e8f4f8]">Check maintenance logs for recent work</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-[#6a9bb5]">
            Select an alert to view AI analysis
          </div>
        )}
      </div>
    </div>
  );
}
