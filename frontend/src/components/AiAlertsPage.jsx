import React, { useState, useEffect, useMemo } from 'react';
import { Area } from '@ant-design/charts';

export default function AiAlertsPage({ alerts = [], mlInsights }) {
  const [filter, setFilter] = useState('All');
  const [selectedId, setSelectedId] = useState(null);
  const [ackedStatus, setAckedStatus] = useState({});

  const [persistentAlerts, setPersistentAlerts] = useState([]);
  const [suppressedAlerts, setSuppressedAlerts] = useState(new Set());

  // 1. Process incoming alerts & latch them
  useEffect(() => {
    const list = [];
    
    // Add ML Anomaly
    if (mlInsights?.is_anomaly) {
      list.push({
        id: 'ml-anomaly',
        level: 'High',
        title: 'AI Anomaly Detected - turbine_01',
        desc: mlInsights.diagnosis || 'Abnormal pattern detected',
        time: new Date().toLocaleTimeString(),
        source: 'TURBINE 01',
        duration: `Anomaly Score: ${(mlInsights.anomaly_score || 0).toFixed(3)}`,
        actions: mlInsights.action_required ? [mlInsights.action_required, "Review sensor trends for the past hour"] : [
          "Reduce feed rate by 15% and monitor temperature zones.",
          "Review sensor trends for the past hour",
          "Check maintenance logs for recent work",
          "Verify calibration of top contributing sensors"
        ],
        logData: {
          "Auto-generated alert for persistent anomaly": "",
          "Duration": "3 seconds",
          "Anomaly Score": (mlInsights.anomaly_score || 0).toFixed(3),
          "Threshold": "0.650",
          "Confidence": "78.3%",
          "Stability": "68.7%",
        }
      });
    }

    // Add normal alerts
    alerts.forEach((a) => {
      if (a.level === 'ok') return;
      const mappedLevel = a.level === 'critical' ? 'High' : (a.level === 'warning' ? 'Warning' : 'Low');
      list.push({
        id: `rule-${a.title}`,
        level: mappedLevel,
        title: `${a.title} - turbine_01`,
        desc: a.desc,
        time: new Date().toLocaleTimeString(),
        source: 'TURBINE 01',
        duration: 'Threshold violation event',
        actions: [
          `Investigate ${a.title}`,
          "Check physical sensors for irregularities",
          "Verify SCADA readings"
        ],
        logData: {
          "Rule-based threshold alert": "",
          "Alert Type": mappedLevel,
          "Description": a.desc,
        }
      });
    });

    setSuppressedAlerts(prevSuppressed => {
      const nextSuppressed = new Set(prevSuppressed);
      let suppressedChanged = false;
      
      // If a suppressed alert is no longer in the live telemetry stream, clear its suppression
      // This allows it to re-trigger if the same issue happens again later.
      for (const id of prevSuppressed) {
        if (!list.find(a => a.id === id)) {
          nextSuppressed.delete(id);
          suppressedChanged = true;
        }
      }

      setPersistentAlerts(prevPersist => {
        const nextPersist = [...prevPersist];
        let persistChanged = false;
        
        list.forEach(item => {
          // Add if not already active and not actively suppressed
          if (!nextPersist.find(n => n.id === item.id) && !nextSuppressed.has(item.id)) {
            nextPersist.unshift(item);
            persistChanged = true;
          }
        });
        
        return persistChanged ? nextPersist : prevPersist;
      });

      return suppressedChanged ? nextSuppressed : prevSuppressed;
    });
  }, [alerts, mlInsights]);

  const activeAlerts = persistentAlerts;

  // 2. Filter Alerts
  const filteredAlerts = useMemo(() => {
    if (filter === 'All') return activeAlerts;
    return activeAlerts.filter(a => a.level === filter);
  }, [activeAlerts, filter]);

  // 3. Current Selected Alert
  const selectedAlert = useMemo(() => {
    const found = filteredAlerts.find(a => a.id === selectedId);
    return found || filteredAlerts[0] || null;
  }, [filteredAlerts, selectedId]);

  useEffect(() => {
    if (selectedAlert && selectedAlert.id !== selectedId) {
      setSelectedId(selectedAlert.id);
    } else if (!selectedAlert) {
      setSelectedId(null);
    }
  }, [selectedAlert, selectedId]);

  // Actions
  const handleAcknowledge = (id) => {
    setAckedStatus(prev => ({ ...prev, [id]: 'Done' }));
    setTimeout(() => {
      setPersistentAlerts(prev => prev.filter(a => a.id !== id));
      setSuppressedAlerts(prev => new Set([...prev, id]));
      setAckedStatus(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }, 800);
  };

  const handleDelete = (id) => {
    setPersistentAlerts(prev => prev.filter(a => a.id !== id));
    setSuppressedAlerts(prev => new Set([...prev, id]));
  };

  const handleClearAll = () => {
    const currentIds = filteredAlerts.map(a => a.id);
    setPersistentAlerts(prev => prev.filter(a => !currentIds.includes(a.id)));
    setSuppressedAlerts(prev => new Set([...prev, ...currentIds]));
  };

  const chartData = [
    { sensor: 'vibration', impact: 8 },
    { sensor: 'kiln', impact: 7.2 },
    { sensor: 'exhaust', impact: 6.4 },
    { sensor: 'temperature', impact: 4.8 },
    { sensor: 'feed', impact: 4.3 },
  ];

  const chartColor = '#00d4ff';

  const chartConfig = {
    data: chartData,
    xField: 'sensor',
    yField: 'impact',
    smooth: true,
    point: { size: 5, shape: 'circle', style: { fill: chartColor, stroke: '#0b121a', lineWidth: 2 } },
    line: { style: { stroke: chartColor, lineWidth: 3 } },
    style: { fill: `linear-gradient(-90deg, rgba(0,212,255,0.01) 0%, ${chartColor}60 100%)` },
    scale: { y: { domain: [0, 9] } },
    axis: {
      x: { 
        label: { style: { fill: '#a3c4d4', fontSize: 11, fontWeight: 'bold' } },
        line: null,
        tickLine: null,
      },
      y: { 
        label: { style: { fill: '#a3c4d4', fontSize: 12 } }, 
        grid: null,
        line: null,
        tickLine: null,
        tickCount: 4 
      }
    },
    theme: { view: { viewFill: 'transparent' } },
    height: 180,
  };

  return (
    <div className="flex flex-col h-full bg-[#0b121a] text-white p-6 font-sans rounded-xl shadow-2xl w-full" style={{ minHeight: "800px" }}>
      
      {/* TOP HEADER */}
      <div className="flex justify-between items-center mb-8 pb-4">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00d4ff] shadow-[0_0_8px_#00d4ff]"></span>
          <span className="text-[#00d4ff] font-bold text-sm">Connected</span>
          <span className="text-[#6a9bb5] text-sm ml-2">Last update: 0s ago</span>
        </div>
        <div className="text-[#00d4ff] font-bold text-[15px]">
          Active Alerts: {activeAlerts.length}
        </div>
      </div>

      <div className="flex gap-6 items-start h-full">
        
        {/* LEFT COLUMN */}
        <div className="w-[280px] flex flex-col gap-4 bg-[#141d26] rounded-xl p-5 shrink-0 shadow-lg" style={{ border: '1px solid #1c2a38' }}>
          <h3 className="text-sm font-bold tracking-wide mb-3 text-white">Alert Filter Controls</h3>
          
          <button 
            onClick={() => setFilter('High')}
            className={`py-3 rounded-lg border font-bold text-sm transition-all cursor-pointer ${filter === 'High' ? 'border-red-500 bg-red-500/20 text-red-400' : 'border-red-500/50 bg-[#2a1317] text-red-500 hover:bg-red-500/10'}`}
          >
            High ({activeAlerts.filter(a => a.level === 'High').length})
          </button>
          <button 
            onClick={() => setFilter('Warning')}
            className={`py-3 rounded-lg border font-bold text-sm transition-all cursor-pointer ${filter === 'Warning' ? 'border-amber-500 bg-amber-500/20 text-amber-400' : 'border-amber-500/50 bg-[#2b2111] text-amber-500 hover:bg-amber-500/10'}`}
          >
            Warning ({activeAlerts.filter(a => a.level === 'Warning').length})
          </button>
          <button 
            onClick={() => setFilter('Low')}
            className={`py-3 rounded-lg border font-bold text-sm transition-all cursor-pointer ${filter === 'Low' ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400' : 'border-cyan-500/50 bg-[#0e2730] text-cyan-500 hover:bg-cyan-500/10'}`}
          >
            Low ({activeAlerts.filter(a => a.level === 'Low').length})
          </button>

          <button 
            onClick={handleClearAll}
            className="mt-4 py-3 rounded-lg border border-red-500/40 bg-[#1b1216] text-red-500 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer hover:bg-red-500/10"
          >
            <span className="text-lg leading-none">≡</span> Clear All Alerts
          </button>
          
          {filter !== 'All' && (
             <button 
               onClick={() => setFilter('All')}
               className="mt-2 py-2 rounded-lg border border-[#1c2a38] text-[#6a9bb5] font-bold text-sm hover:text-white"
             >
               Show All
             </button>
          )}
        </div>

        {/* MIDDLE COLUMN */}
        <div className="flex-1 min-w-[350px] flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {filteredAlerts.length === 0 ? (
            <div className="bg-[#141d26] rounded-xl p-8 text-center text-[#6a9bb5] shadow-lg" style={{ border: '1px solid #1c2a38' }}>
              No active alerts in this category.
            </div>
          ) : (
            filteredAlerts.map(alert => {
              const isSelected = selectedAlert?.id === alert.id;
              const bColor = alert.level === 'High' ? '#ef4444' : alert.level === 'Warning' ? '#f59e0b' : '#00d4ff';
              
              return (
                <div 
                  key={alert.id}
                  onClick={() => setSelectedId(alert.id)}
                  className={`bg-[#141d26] rounded-xl p-6 relative cursor-pointer transition-all ${isSelected ? 'scale-[1.02]' : 'hover:scale-[1.01]'}`} 
                  style={{ 
                    border: `1px solid ${bColor}`,
                    boxShadow: isSelected ? `0 0 20px ${bColor}25` : 'none'
                  }}
                >
                  <h4 className="text-[17px] font-bold mb-2 text-white">{alert.title}</h4>
                  <p className="text-[#a3c4d4] text-[15px] mb-8">{alert.desc}</p>
                  <div className="text-[12px] font-bold tracking-widest uppercase" style={{ color: bColor }}>
                    {alert.source} • {alert.time}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(alert.id); }}
                    className="absolute top-5 right-5 text-[#6a9bb5] hover:text-white transition-colors cursor-pointer text-xl"
                  >
                    ✕
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="w-[500px] flex flex-col gap-6 bg-[#141d26] rounded-xl p-6 shrink-0 shadow-lg" style={{ border: `1px solid ${selectedAlert?.level === 'High' ? '#ef4444' : selectedAlert?.level === 'Warning' ? '#f59e0b' : '#00d4ff'}` }}>
          
          {selectedAlert ? (
            <>
              <div className="mb-2">
                <h3 className="text-[18px] font-bold mb-4 text-white">Sensor Impact Analysis</h3>
                <div className="rounded-lg" style={{ background: '#0d131a', padding: '16px 8px 0 8px', margin: '0 -8px' }}>
                  <Area {...chartConfig} />
                </div>
              </div>

              <div className="flex flex-col gap-2 pb-2">
                {selectedAlert.actions.map((text, i) => (
                  <div key={i} className="bg-[#0b121a] rounded-md p-3.5 flex items-start gap-4" style={{ border: '1px solid #1c2a38' }}>
                    <span className="text-amber-500 font-bold text-[17px] leading-none mt-0.5">›</span>
                    <p className="text-[14px] text-[#e8f4f8]">{text}</p>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="text-[18px] font-bold mb-4 text-white">Full Event Log</h3>
                <div className="bg-[#0b121a] rounded-lg p-5" style={{ border: '1px solid #1c2a38' }}>
                  <p className="text-[14px] text-[#a3c4d4] font-mono leading-relaxed">
                    {Object.entries(selectedAlert.logData).map(([k, v]) => (
                      <React.Fragment key={k}>
                        {k}{v ? `: ${v}` : ''}<br/>
                      </React.Fragment>
                    ))}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 mt-2">
                <button 
                  onClick={() => handleAcknowledge(selectedAlert.id)}
                  className="flex-1 py-3 rounded-lg border border-[#00d4ff] bg-[#0b121a] text-[#00d4ff] font-bold text-[15px] cursor-pointer hover:bg-[#00d4ff]/10 transition-colors"
                >
                  {ackedStatus[selectedAlert.id] || "Acknowledge"}
                </button>
                <button 
                  onClick={() => handleDelete(selectedAlert.id)}
                  className="flex-1 py-3 rounded-lg border border-red-500 bg-[#0b121a] text-red-500 font-bold text-[15px] cursor-pointer hover:bg-red-500/10 transition-colors"
                >
                  Delete
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-[#6a9bb5]">
              Select an alert to view details
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
