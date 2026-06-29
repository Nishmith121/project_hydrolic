import React, { useState, useEffect, useMemo } from 'react';

// ── Diagnostic data for each alert type ──
const ALERT_DIAGNOSTICS = {
  'vibration': {
    rootCause: 'Excessive shaft vibration caused by misalignment between the turbine runner and the generator coupling. This typically occurs due to wear on guide bearings or imbalance in the runner blades after prolonged operation.',
    howToFix: [
      'Shut down the turbine and perform a laser alignment check on the shaft coupling.',
      'Inspect guide bearings for wear — replace if clearance exceeds 0.15mm.',
      'Run a dynamic balancing test on the runner and add counterweights if needed.',
      'Check foundation bolts for looseness and re-torque to manufacturer spec.',
    ],
    consequences: 'If left unresolved, excessive vibration will cause accelerated wear on bearings, seals, and shaft. This can lead to catastrophic bearing failure, shaft fracture, flooding of the turbine pit, and potential structural damage to the powerhouse.',
    timeline: '24–48 hours',
    timelineNote: 'Vibration above 4.5 mm/s can cause bearing failure within 2–5 days of continuous operation.',
    estimatedCost: '₹2,50,000 – ₹8,00,000',
    costBreakdown: 'Bearing replacement: ₹1,50,000 | Shaft realignment service: ₹80,000 | Dynamic balancing: ₹1,20,000 | If shaft fracture occurs: ₹25,00,000+',
  },
  'bearing': {
    rootCause: 'Bearing temperature is rising above safe operating limits. This is typically caused by insufficient lubrication, contaminated oil, excessive axial thrust load, or worn bearing surfaces creating metal-to-metal contact.',
    howToFix: [
      'Check oil level and quality — drain and replace if contaminated or degraded.',
      'Inspect the oil cooling system for blockages or pump failure.',
      'Measure bearing clearance with dial gauges — replace if beyond tolerance.',
      'Verify thrust bearing alignment and check for abnormal axial loads.',
    ],
    consequences: 'Overheated bearings will seize, causing the shaft to lock up suddenly. This can destroy the bearing housing, damage the shaft journal, and force an emergency shutdown. In worst case, it leads to turbine runaway if the wicket gates fail to close.',
    timeline: '12–24 hours',
    timelineNote: 'Bearing temperatures above 75°C indicate imminent failure risk. Above 85°C, shutdown is mandatory.',
    estimatedCost: '₹3,00,000 – ₹12,00,000',
    costBreakdown: 'Oil change + flush: ₹40,000 | Bearing replacement: ₹5,00,000 | Cooling system repair: ₹1,50,000 | If seizure occurs: ₹35,00,000+',
  },
  'stator': {
    rootCause: 'Stator winding temperature exceeds the thermal class rating. Causes include overloading the generator beyond rated capacity, failure of the cooling system (air or water-cooled), insulation degradation from moisture ingress, or short-circuit between winding turns.',
    howToFix: [
      'Reduce generator load to 80% of rated capacity immediately.',
      'Inspect and clean the stator cooling ducts and heat exchangers.',
      'Perform insulation resistance test (Megger test) on all phases.',
      'Check for moisture ingress and run space heaters if the unit is offline.',
    ],
    consequences: 'Continued operation with high stator temperature will cause insulation breakdown, leading to inter-turn short circuits, phase-to-ground faults, or a complete winding burnout. Generator rewinding requires months of downtime and costs crores.',
    timeline: '6–12 hours',
    timelineNote: 'Above 130°C (Class B insulation), insulation life halves for every 10°C increase. Immediate action required.',
    estimatedCost: '₹1,00,000 – ₹5,00,000',
    costBreakdown: 'Cooling system repair: ₹80,000 | Insulation treatment: ₹1,20,000 | If winding burns out: ₹1,50,00,000+ (full rewind)',
  },
  'shaft': {
    rootCause: 'Shaft run-out (eccentricity) has exceeded acceptable limits. This indicates the shaft is wobbling during rotation, likely due to a bent shaft section, worn journal surfaces, or damage from a previous vibration event.',
    howToFix: [
      'Measure shaft run-out at multiple points using dial indicators.',
      'If run-out exceeds 0.2mm, schedule shaft straightening or machining.',
      'Inspect coupling alignment between turbine and generator shafts.',
      'Check for cracks using dye penetrant or ultrasonic testing.',
    ],
    consequences: 'A shaft with excessive run-out will cause uneven bearing loading, vibration, and accelerated seal wear. If a crack is present and undetected, the shaft can fracture during operation, resulting in catastrophic failure, flooding, and potential injury.',
    timeline: '3–7 days',
    timelineNote: 'Run-out above 0.15mm requires monitoring every 4 hours. Above 0.25mm, shutdown is recommended.',
    estimatedCost: '₹5,00,000 – ₹20,00,000',
    costBreakdown: 'Shaft machining/grinding: ₹3,00,000 | NDT inspection: ₹50,000 | If shaft replacement needed: ₹50,00,000+',
  },
  'frequency': {
    rootCause: 'Generator output frequency has deviated from the grid standard (50 Hz). This is caused by governor malfunction, sudden load changes, wicket gate actuator failure, or loss of grid synchronization signal.',
    howToFix: [
      'Check the governor control system for error codes and recalibrate PID settings.',
      'Verify wicket gate actuator response — all gates should move uniformly.',
      'Inspect the speed sensor (MPU) on the shaft for correct signal output.',
      'If grid-connected, check synchronization relay and breaker status.',
    ],
    consequences: 'Frequency deviation beyond ±1.5 Hz will trigger automatic grid disconnection by the protection relay. Sustained off-frequency operation damages generator windings, causes resonance in the powerhouse structure, and may result in heavy penalties from the grid operator.',
    timeline: '1–4 hours',
    timelineNote: 'Grid operators impose penalties for frequency deviation beyond ±0.5 Hz. Automatic disconnection occurs at ±3 Hz.',
    estimatedCost: '₹50,000 – ₹3,00,000',
    costBreakdown: 'Governor recalibration: ₹40,000 | Speed sensor replacement: ₹25,000 | Grid penalty per incident: ₹1,00,000–5,00,000',
  },
  'anomaly': {
    rootCause: 'The AI/ML model has detected an abnormal pattern across multiple sensor readings that does not match any known operating profile. This could indicate early-stage degradation, sensor drift, unusual environmental conditions, or a developing mechanical fault.',
    howToFix: [
      'Review the top contributing sensors identified by the ML model.',
      'Cross-reference with SCADA trends for the past 24 hours.',
      'Perform a physical inspection of the turbine hall for unusual sounds or smells.',
      'If sensor drift is suspected, recalibrate the affected sensors.',
      'Schedule a comprehensive condition-based maintenance inspection.',
    ],
    consequences: 'AI anomalies are early warnings. Ignoring them means the underlying issue will progress until it triggers a hard threshold alert. By that point, the damage is often more severe and costly. Early intervention based on AI predictions can prevent 60-80% of unplanned outages.',
    timeline: '2–5 days',
    timelineNote: 'AI anomalies typically precede actual failures by 3–10 days. This is your window for proactive maintenance.',
    estimatedCost: '₹30,000 – ₹2,00,000',
    costBreakdown: 'Inspection and diagnostics: ₹30,000 | Sensor recalibration: ₹20,000 | Preventive repair (avg): ₹1,50,000 | If ignored until failure: ₹10,00,000+',
  },
  'default': {
    rootCause: 'A sensor reading has exceeded its configured threshold. This may be caused by equipment degradation, environmental changes, or sensor malfunction.',
    howToFix: [
      'Verify the sensor reading with a portable calibration instrument.',
      'Inspect the physical equipment associated with this reading.',
      'Check historical trends to determine if this is a gradual or sudden change.',
      'Consult the O&M manual for corrective procedures specific to this parameter.',
    ],
    consequences: 'Operating outside safe parameter ranges causes accelerated wear and reduces equipment lifespan. Continued operation may lead to forced shutdown, component damage, and loss of generation revenue.',
    timeline: '1–3 days',
    timelineNote: 'Monitor the parameter closely. If it continues to worsen, schedule maintenance within 24 hours.',
    estimatedCost: '₹50,000 – ₹5,00,000',
    costBreakdown: 'Varies based on specific component affected. Early intervention significantly reduces cost.',
  },
};

function getDiagnostics(alertTitle) {
  const t = (alertTitle || '').toLowerCase();
  if (t.includes('vibration')) return ALERT_DIAGNOSTICS.vibration;
  if (t.includes('bearing')) return ALERT_DIAGNOSTICS.bearing;
  if (t.includes('stator') || t.includes('winding')) return ALERT_DIAGNOSTICS.stator;
  if (t.includes('shaft') || t.includes('run-out') || t.includes('runout')) return ALERT_DIAGNOSTICS.shaft;
  if (t.includes('frequency')) return ALERT_DIAGNOSTICS.frequency;
  if (t.includes('anomaly') || t.includes('ai ')) return ALERT_DIAGNOSTICS.anomaly;
  return ALERT_DIAGNOSTICS.default;
}

// ── Detail Row Component ──
function DetailSection({ icon, label, children, borderColor }) {
  return (
    <div className="rounded-2xl p-4" style={{
      border: `2px solid ${borderColor || 'rgba(22, 66, 96, 0.2)'}`,
      background: 'linear-gradient(145deg, rgba(11, 34, 54, 0.9), rgba(7, 26, 43, 0.9))',
      boxShadow: '4px 4px 8px rgba(0,0,0,0.3), inset 2px 2px 4px rgba(255,255,255,0.03)'
    }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[16px]">{icon}</span>
        <span className="text-[13px] font-bold uppercase tracking-wider text-[#6a9bb5]">{label}</span>
      </div>
      <div className="text-[14px] text-[#c8dce6] leading-relaxed">{children}</div>
    </div>
  );
}

export default function AiAlertsPage({ alerts = [], mlInsights }) {
  const [filter, setFilter] = useState('All');
  const [selectedId, setSelectedId] = useState(null);
  const [ackedStatus, setAckedStatus] = useState({});
  const [persistentAlerts, setPersistentAlerts] = useState([]);
  const [suppressedAlerts, setSuppressedAlerts] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);

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
      });
    });

    setSuppressedAlerts(prevSuppressed => {
      const nextSuppressed = new Set(prevSuppressed);
      let suppressedChanged = false;
      
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

  // 3. Selected alert — only when user clicks
  const selectedAlert = useMemo(() => {
    if (!selectedId) return null;
    return filteredAlerts.find(a => a.id === selectedId) || null;
  }, [filteredAlerts, selectedId]);

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
      if (selectedId === id) setSelectedId(null);
    }, 800);
  };

  const handleDelete = (id) => {
    setPersistentAlerts(prev => prev.filter(a => a.id !== id));
    setSuppressedAlerts(prev => new Set([...prev, id]));
    if (selectedId === id) setSelectedId(null);
  };

  const handleClearAll = () => {
    const currentIds = filteredAlerts.map(a => a.id);
    setPersistentAlerts(prev => prev.filter(a => !currentIds.includes(a.id)));
    setSuppressedAlerts(prev => new Set([...prev, ...currentIds]));
    setSelectedId(null);
  };

  const diag = selectedAlert ? getDiagnostics(selectedAlert.title) : null;
  const levelColors = { High: '#ef4444', Warning: '#f59e0b', Low: '#00d4ff' };

  return (
    <div className="flex flex-col h-full bg-[#0b121a] text-white p-6 font-sans rounded-xl shadow-2xl w-full" style={{ minHeight: "800px" }}>
      
      {/* TOP HEADER */}
      <div className="flex justify-between items-center mb-6 pb-4">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00d4ff] shadow-[0_0_8px_#00d4ff]"></span>
          <span className="text-[#00d4ff] font-bold text-sm">Connected</span>
          <span className="text-[#6a9bb5] text-sm ml-2">Last update: 0s ago</span>
        </div>
        
        <div className="flex items-center gap-4 relative">
          <div className="text-[#00d4ff] font-bold text-[15px]">
            Active Alerts: {activeAlerts.length}
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="py-2 px-4 rounded-lg text-sm font-bold border border-[#00d4ff] text-[#00d4ff] hover:bg-[#00d4ff]/10 transition-colors cursor-pointer flex items-center gap-2"
          >
            Filter: {filter} <span className="text-[10px]">▼</span>
          </button>

          {showFilters && (
            <div className="absolute top-[120%] right-0 w-[240px] z-50 rounded-xl p-4 flex flex-col gap-3"
                 style={{ 
                   border: '1px solid rgba(22, 66, 96, 0.8)',
                   background: 'linear-gradient(145deg, rgba(13, 42, 62, 0.98), rgba(7, 26, 43, 0.99))',
                   boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.7), inset 1px 1px 2px rgba(255, 255, 255, 0.08)'
                 }}>
              
              <button 
                onClick={() => { setFilter('All'); setShowFilters(false); }}
                className={`py-2 rounded-lg border font-bold text-sm transition-all cursor-pointer ${filter === 'All' ? 'border-[#00d4ff] bg-[#00d4ff]/20 text-[#00d4ff]' : 'border-[#00d4ff]/30 text-[#6a9bb5] hover:text-white hover:border-[#00d4ff]/60'}`}
              >
                All ({activeAlerts.length})
              </button>

              <button 
                onClick={() => { setFilter('High'); setShowFilters(false); }}
                className={`py-2 rounded-lg border font-bold text-sm transition-all cursor-pointer ${filter === 'High' ? 'border-red-500 bg-red-500/20 text-red-400' : 'border-red-500/50 bg-[#2a1317] text-red-500 hover:bg-red-500/10'}`}
              >
                High ({activeAlerts.filter(a => a.level === 'High').length})
              </button>

              <button 
                onClick={() => { setFilter('Warning'); setShowFilters(false); }}
                className={`py-2 rounded-lg border font-bold text-sm transition-all cursor-pointer ${filter === 'Warning' ? 'border-amber-500 bg-amber-500/20 text-amber-400' : 'border-amber-500/50 bg-[#2b2111] text-amber-500 hover:bg-amber-500/10'}`}
              >
                Warning ({activeAlerts.filter(a => a.level === 'Warning').length})
              </button>

              <button 
                onClick={() => { setFilter('Low'); setShowFilters(false); }}
                className={`py-2 rounded-lg border font-bold text-sm transition-all cursor-pointer ${filter === 'Low' ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400' : 'border-cyan-500/50 bg-[#0e2730] text-cyan-500 hover:bg-cyan-500/10'}`}
              >
                Low ({activeAlerts.filter(a => a.level === 'Low').length})
              </button>

              <div className="h-[1px] w-full bg-[#1c2a38] my-1"></div>

              <button 
                onClick={() => { handleClearAll(); setShowFilters(false); }}
                className="py-2 rounded-lg border border-red-500/40 bg-[#1b1216] text-red-500 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer hover:bg-red-500/10"
              >
                <span className="text-lg leading-none">≡</span> Clear All Alerts
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-6 items-start h-full">

        {/* ── ALERTS LIST (left side) ── */}
        <div className={`flex flex-col gap-5 overflow-y-auto py-4 px-3 transition-all duration-300 ${selectedAlert ? 'w-[360px] shrink-0' : 'flex-1'}`} style={{ maxHeight: 'calc(100vh - 200px)', overflow: 'visible auto' }}>
          {filteredAlerts.length === 0 ? (
            <div className="bg-[#141d26] rounded-2xl p-8 text-center text-[#6a9bb5] shadow-lg" style={{ border: '2px solid rgba(22, 66, 96, 0.2)' }}>
              No active alerts in this category.
            </div>
          ) : (
            filteredAlerts.map(alert => {
              const isSelected = selectedAlert?.id === alert.id;
              const bColor = levelColors[alert.level] || '#00d4ff';
              
              return (
                <div 
                  key={alert.id}
                  onClick={() => setSelectedId(isSelected ? null : alert.id)}
                  className="rounded-2xl p-5 relative cursor-pointer" 
                  style={{ 
                    border: `1px solid ${isSelected ? bColor : bColor + '35'}`,
                    borderTop: `2px solid ${isSelected ? bColor : bColor + '50'}`,
                    borderLeft: `2px solid ${isSelected ? bColor : bColor + '50'}`,
                    background: isSelected 
                      ? 'linear-gradient(145deg, rgba(20, 42, 58, 0.95), rgba(11, 22, 34, 0.98))' 
                      : 'linear-gradient(145deg, rgba(26, 36, 48, 0.9), rgba(13, 20, 28, 0.95))',
                    boxShadow: isSelected 
                      ? `0 0 20px ${bColor}25, 6px 6px 14px rgba(0,0,0,0.6), inset 2px 2px 5px rgba(255,255,255,0.08), inset -3px -3px 7px rgba(0,0,0,0.5)` 
                      : '5px 5px 12px rgba(0,0,0,0.45), -3px -3px 8px rgba(255,255,255,0.03), inset 2px 2px 4px rgba(255,255,255,0.05), inset -2px -2px 5px rgba(0,0,0,0.35)',
                    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = `0 8px 25px rgba(0,0,0,0.5), 0 0 18px ${bColor}20, inset 2px 2px 5px rgba(255,255,255,0.07), inset -2px -2px 5px rgba(0,0,0,0.35)`;
                      e.currentTarget.style.borderColor = bColor + '80';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '5px 5px 12px rgba(0,0,0,0.45), -3px -3px 8px rgba(255,255,255,0.03), inset 2px 2px 4px rgba(255,255,255,0.05), inset -2px -2px 5px rgba(0,0,0,0.35)';
                      e.currentTarget.style.borderColor = bColor + '35';
                    }
                  }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider" style={{
                      background: bColor + '20',
                      color: bColor,
                      border: `1px solid ${bColor}50`
                    }}>
                      {alert.level}
                    </span>
                    <span className="text-[11px] text-[#6a9bb5] font-bold tracking-wider">{alert.source}</span>
                  </div>
                  <h4 className="text-[15px] font-bold mb-1 text-white pr-8">{alert.title}</h4>
                  <p className="text-[#a3c4d4] text-[13px] mb-2 line-clamp-2">{alert.desc}</p>
                  <div className="text-[11px] text-[#6a9bb5]">
                    {alert.time} {isSelected && <span className="text-[#00d4ff] ml-2">◀ Viewing</span>}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(alert.id); }}
                    className="absolute top-4 right-4 text-[#6a9bb5] hover:text-white transition-colors cursor-pointer text-lg"
                  >
                    ✕
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* ── DETAIL PANEL (right side — only when alert is clicked) ── */}
        {selectedAlert && diag && (() => {
          const bColor = levelColors[selectedAlert.level] || '#00d4ff';
          return (
            <div className="flex-1 flex flex-col gap-4 rounded-2xl p-6 overflow-y-auto transition-all duration-300" 
                 style={{ 
                   maxHeight: 'calc(100vh - 200px)',
                   border: `2px solid ${bColor}30`,
                   background: 'linear-gradient(145deg, rgba(13, 42, 62, 0.9), rgba(7, 26, 43, 0.95))',
                   boxShadow: '8px 8px 16px rgba(0, 0, 0, 0.45), -4px -4px 12px rgba(255, 255, 255, 0.02), inset 2px 2px 4px rgba(255, 255, 255, 0.04)'
                 }}>
              
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-[20px] font-bold text-white mb-1">{selectedAlert.title}</h2>
                  <p className="text-[14px] text-[#a3c4d4]">{selectedAlert.desc}</p>
                </div>
                <button onClick={() => setSelectedId(null)} className="text-[#6a9bb5] hover:text-white text-xl cursor-pointer shrink-0 ml-4">✕</button>
              </div>

              {/* Alert Level Badge */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: bColor + '15', border: `2px solid ${bColor}40` }}>
                  <span className="w-3 h-3 rounded-full" style={{ background: bColor, boxShadow: `0 0 8px ${bColor}` }}></span>
                  <span className="text-[14px] font-bold" style={{ color: bColor }}>Alert Level: {selectedAlert.level}</span>
                </div>
                <span className="text-[12px] text-[#6a9bb5]">{selectedAlert.source} • {selectedAlert.time}</span>
              </div>

              {/* Root Cause */}
              <DetailSection icon="🔍" label="Root Cause Analysis" borderColor={bColor + '25'}>
                {diag.rootCause}
              </DetailSection>

              {/* How to Fix */}
              <DetailSection icon="🔧" label="How to Fix" borderColor="#22c55e30">
                <div className="flex flex-col gap-2 mt-1">
                  {diag.howToFix.map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="text-[#22c55e] font-bold text-[13px] mt-0.5 shrink-0">{i + 1}.</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </DetailSection>

              {/* Timeline */}
              <DetailSection icon="⏱️" label="Time to Fix" borderColor="#f59e0b30">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[22px] font-bold text-[#f59e0b]">{diag.timeline}</span>
                </div>
                <span className="text-[13px] text-[#a3c4d4]">{diag.timelineNote}</span>
              </DetailSection>

              {/* Consequences */}
              <DetailSection icon="⚠️" label="What Happens If Not Fixed" borderColor="#ef444430">
                <span className="text-[#fca5a5]">{diag.consequences}</span>
              </DetailSection>

              {/* Estimated Cost */}
              <DetailSection icon="💰" label="Estimated Repair Cost" borderColor="#22d3ee30">
                <div className="text-[20px] font-bold text-[#22d3ee] mb-2">{diag.estimatedCost}</div>
                <span className="text-[13px] text-[#a3c4d4]">{diag.costBreakdown}</span>
              </DetailSection>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-2">
                <button 
                  onClick={() => handleAcknowledge(selectedAlert.id)}
                  className="flex-1 py-3 rounded-xl border border-[#00d4ff] bg-[#0b121a] text-[#00d4ff] font-bold text-[15px] cursor-pointer hover:bg-[#00d4ff]/10 transition-colors"
                >
                  {ackedStatus[selectedAlert.id] || "Acknowledge & Resolve"}
                </button>
                <button 
                  onClick={() => handleDelete(selectedAlert.id)}
                  className="flex-1 py-3 rounded-xl border border-red-500 bg-[#0b121a] text-red-500 font-bold text-[15px] cursor-pointer hover:bg-red-500/10 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          );
        })()}

        {/* No selection message — only show when there ARE alerts but none selected */}
        {!selectedAlert && filteredAlerts.length > 0 && (
          <div className="flex-1 flex items-center justify-center rounded-2xl p-8" style={{
            border: '2px solid rgba(22, 66, 96, 0.15)',
            background: 'linear-gradient(145deg, rgba(13, 42, 62, 0.5), rgba(7, 26, 43, 0.5))',
          }}>
            <div className="text-center">
              <div className="text-[40px] mb-4 opacity-30">🔔</div>
              <p className="text-[#6a9bb5] text-[16px]">Click on any alert to view full diagnosis</p>
              <p className="text-[#4a7a90] text-[13px] mt-2">Root cause • Fix steps • Timeline • Cost estimate</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
