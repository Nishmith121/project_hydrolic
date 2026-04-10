import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { THR, getStatus, fmt } from '../config';

// Helper to generate fake events
function generateEvents(count) {
    const eventTypes = [
        "Minor vibration threshold crossed.",
        "Bearing temperature fluctuation (+2.4°C/hr).",
        "Wicket gate actuator latency detected (150ms).",
        "Cooling water flow restriction detected.",
        "Grid frequency deviation (49.8 Hz).",
        "Routine automated cleaning cycle initiated.",
        "Stator winding temp reached 85°C temporarily.",
        "Active power dropped by 4% due to load change.",
        "Draft tube pressure anomaly."
    ];
    let evs = [];
    for(let i=0; i<count; i++) {
        let hr = Math.floor(Math.random() * 24).toString().padStart(2, '0');
        let min = Math.floor(Math.random() * 60).toString().padStart(2, '0');
        let type = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        evs.push(`${hr}:${min} - ${type} Action taken: Automated stabilization / Logged.`);
    }
    if (evs.length === 0) evs.push("No significant anomalies or alerts detected.");
    // Sort by time
    evs.sort((a,b) => a.substring(0,5).localeCompare(b.substring(0,5)));
    return evs;
}

// Data simulation engine for breakdowns
function generateHistoricalBreakdown(timeframe, basePower, baseVib, baseTemp) {
    let periods = [];
    if (timeframe === 'Daily') {
        periods = [
            { name: 'Shift 1: Midnight - 06:00', alerts: 1 },
            { name: 'Shift 2: 06:00 - 12:00', alerts: 0 },
            { name: 'Shift 3: 12:00 - 18:00', alerts: 2 },
            { name: 'Shift 4: 18:00 - Midnight', alerts: 0 }
        ];
    } else if (timeframe === 'Weekly') {
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        periods = days.map(d => ({ name: d, alerts: Math.floor(Math.random() * 4) }));
    } else if (timeframe === 'Monthly') {
        // Break into 30 days
        for (let i = 1; i <= 30; i++) {
            periods.push({ name: `Day ${i}`, alerts: Math.floor(Math.random() * 3) });
        }
    } else if (timeframe === 'Yearly') {
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        periods = months.map(m => ({ name: m, alerts: Math.floor(Math.random() * 15) }));
    }
    
    // Fill in mock data
    return periods.map(p => {
        const powerVar = basePower * (0.85 + Math.random() * 0.3); 
        const vibVar = baseVib * (0.8 + Math.random() * 0.6);
        const tempVar = baseTemp * (0.9 + Math.random() * 0.2);
        return {
            ...p,
            avgPower: powerVar,
            avgVib: vibVar,
            avgTemp: tempVar,
            events: generateEvents(p.alerts)
        };
    });
}


export default function ReportGenerator({ latest, history, activeUnit = "turbine_01" }) {
  const [timeframe, setTimeframe] = useState('Weekly');
  const [isGenerating, setIsGenerating] = useState(false);

  // Baseline data from latest reading
  const power = latest?.active_power_mw || 120;
  const isAnomaly = latest?.ml_insights?.is_anomaly;
  
  // Current active alerts (simplified mock based on anomaly status)
  let activeAlertsCount = 0;
  if (latest?.vibration_mms > THR.vibration.warn) activeAlertsCount++;
  if (latest?.bearing_temp_c > THR.bearing.warn) activeAlertsCount++;
  if (latest?.stator_winding_temp_c > THR.stator.warn) activeAlertsCount++;
  if (latest?.shaft_runout_mm > THR.shaft.warn) activeAlertsCount++;

  // Mock scaling based on selected timeframe
  let hours = 24;
  let resolvedBase = 2;
  if (timeframe === 'Weekly') { hours = 24 * 7; resolvedBase = 14; }
  else if (timeframe === 'Monthly') { hours = 24 * 30; resolvedBase = 58; }
  else if (timeframe === 'Yearly') { hours = 24 * 365; resolvedBase = 684; }

  // Calculations
  const totalEnergyMWh = Math.round(power * hours);
  const pricePerMWh = 45.0; // Mock electricity price ($45/MWh)
  const totalIncomeFormatted = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(totalEnergyMWh * pricePerMWh);
  const energyFormatted = new Intl.NumberFormat('en-US').format(totalEnergyMWh);

  const downloadPDF = () => {
    setIsGenerating(true);
    
    setTimeout(() => {
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // --- PAGE 1: COVER & EXECUTIVE SUMMARY ---
        doc.setFillColor(11, 18, 26);
        doc.rect(0, 0, pageWidth, 40, 'F');
        
        doc.setFontSize(24);
        doc.setTextColor(255, 255, 255);
        doc.text(`HYDRO TURBINE REPORT`, 14, 22);
        
        doc.setFontSize(12);
        doc.setTextColor(200, 200, 200);
        doc.text(`Unit: ${activeUnit.replace('_', ' ').toUpperCase()} | Period: ${timeframe}`, 14, 30);
        
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 50);

        // Financial & Generation Summary
        doc.setFontSize(18);
        doc.setTextColor(30, 40, 50);
        doc.text('Financial & Generation Summary', 14, 65);
        
        doc.setFontSize(12);
        doc.setTextColor(60, 60, 60);
        doc.text(`Total Power Generated: ${energyFormatted} MWh`, 14, 75);
        doc.text(`Total Income Generated: ${totalIncomeFormatted}`, 14, 83);
        doc.text(`Turbine Efficiency: ${isAnomaly ? '88.4%' : '94.2%'}`, 14, 91);

        // Maintenance Summary
        doc.setFontSize(18);
        doc.setTextColor(30, 40, 50);
        doc.text('Maintenance & Diagnostics Summary', 14, 110);

        doc.setFontSize(12);
        doc.setTextColor(60, 60, 60);
        doc.text(`Active Alerts: ${activeAlertsCount}`, 14, 120);
        doc.text(`Alerts Resolved (${timeframe}): ${resolvedBase}`, 14, 128);
        doc.text(`Overall Status: ${isAnomaly ? 'CRITICAL - Anomaly Detected' : 'Healthy - All Systems Normal'}`, 14, 136);
        
        if (isAnomaly) {
            doc.setTextColor(220, 38, 38); 
            const diagnosis = latest?.ml_insights?.diagnosis || 'Unknown Anomaly';
            const action = latest?.ml_insights?.action_required || 'Inspect system immediately.';
            const actionLines = doc.splitTextToSize(`Action Required: ${action}`, 180);
            
            doc.text(`Diagnosis: ${diagnosis}`, 14, 144);
            doc.text(actionLines, 14, 152);
        } else {
            doc.setTextColor(22, 163, 74);
            doc.text(`AI Recommendation: No action required. Turbine operating optimally.`, 14, 144);
        }

        // Current Telemetry
        doc.setFontSize(18);
        doc.setTextColor(30, 40, 50);
        doc.text('Latest Live Telemetry Snapshot', 14, 170);

        const tableData = [
            ['Rotational Speed', `${fmt(latest?.rotational_speed_rpm)}`, 'RPM', 'normal'],
            ['Active Power', `${fmt(latest?.active_power_mw)}`, 'MW', 'normal'],
            ['Vibration', `${fmt(latest?.vibration_mms, 2)}`, 'mm/s', getStatus(latest?.vibration_mms, THR.vibration)],
            ['Bearing Temp', `${fmt(latest?.bearing_temp_c)}`, '°C', getStatus(latest?.bearing_temp_c, THR.bearing)],
            ['Stator Winding Temp', `${fmt(latest?.stator_winding_temp_c)}`, '°C', getStatus(latest?.stator_winding_temp_c, THR.stator)],
            ['Shaft Run-out', `${fmt(latest?.shaft_runout_mm, 2)}`, 'mm', getStatus(latest?.shaft_runout_mm, THR.shaft)],
            ['Water Flow Rate', `${fmt(latest?.water_flow_rate_m3s)}`, 'm³/s', 'normal'],
            ['Draft Tube Pressure', `${fmt(latest?.draft_tube_pressure_bar, 2)}`, 'bar', 'normal'],
        ];

        autoTable(doc, {
            startY: 175,
            head: [['Sensor Name', 'Value', 'Unit', 'Status']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [11, 18, 26], textColor: [255, 255, 255] },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 70 }, 3: { fontStyle: 'bold', textTransform: 'uppercase' } },
            didParseCell: function(data) {
                if (data.section === 'body' && data.column.index === 3) {
                    if (data.cell.raw === 'critical') data.cell.styles.textColor = [239, 68, 68];
                    else if (data.cell.raw === 'warning') data.cell.styles.textColor = [245, 158, 11];
                    else if (data.cell.raw === 'normal') data.cell.styles.textColor = [34, 197, 94];
                }
            }
        });


        // --- PAGES 2 to X: COMPREHENSIVE BREAKDOWN ---
        const periods = generateHistoricalBreakdown(timeframe, power, latest?.vibration_mms || 3.0, latest?.bearing_temp_c || 65.0);
        
        // For monthly, grouping 2 days per page so it doesn't take 30 pages. Weekly takes 7 pages (1 per day).
        const itemsPerPage = timeframe === 'Monthly' ? 3 : 1; 

        for (let i = 0; i < periods.length; i += itemsPerPage) {
            doc.addPage();
            
            // Header for breakdown pages
            doc.setFillColor(240, 245, 250);
            doc.rect(0, 0, pageWidth, 25, 'F');
            doc.setFontSize(14);
            doc.setTextColor(30, 40, 50);
            doc.text(`Comprehensive Breakdown - Page ${doc.internal.getNumberOfPages()}`, 14, 16);

            let currentY = 35;

            for (let j = 0; j < itemsPerPage; j++) {
                if (i + j >= periods.length) break;
                const p = periods[i + j];
                
                doc.setFontSize(16);
                doc.setTextColor(11, 18, 26);
                doc.text(`Period: ${p.name}`, 14, currentY);
                
                doc.setFontSize(11);
                doc.setTextColor(60, 60, 60);
                doc.text(`Avg Power: ${fmt(p.avgPower)} MW   |   Avg Vibration: ${fmt(p.avgVib, 2)} mm/s   |   Avg Bearing Temp: ${fmt(p.avgTemp, 1)} °C`, 14, currentY + 8);
                
                doc.setFontSize(12);
                doc.setTextColor(30, 40, 50);
                doc.text(`Logged Events & Corrected Alerts:`, 14, currentY + 18);

                const eventRows = p.events.map(ev => [ev]);
                
                autoTable(doc, {
                    startY: currentY + 22,
                    head: [['Time & Event Description / Action Taken']],
                    body: eventRows,
                    theme: 'striped',
                    headStyles: { fillColor: [40, 60, 80], textColor: [255, 255, 255] },
                    margin: { bottom: 15 },
                });
                
                currentY = doc.lastAutoTable.finalY + 15;
            }
        }

        // --- FINAL PAGE: PREDICTIVE RECOMMENDATIONS ---
        doc.addPage();
        doc.setFillColor(11, 18, 26);
        doc.rect(0, 0, pageWidth, 25, 'F');
        doc.setFontSize(16);
        doc.setTextColor(255, 255, 255);
        doc.text(`Predictive AI Maintenance Recommendations`, 14, 16);

        doc.setFontSize(12);
        doc.setTextColor(40, 40, 40);
        let recommendations = [];
        if (isAnomaly) {
            recommendations = [
                "1. IMMEDIATE ACTION REQUIRED: Execute emergency inspection based on active anomaly.",
                "2. Schedule deep mechanical diagnostics on bearings and shaft alignment within 24 hours.",
                "3. Perform manual override of wicket gates to test actuator responsiveness.",
                "4. Review vibration harmonic spectrum (FFT) for cavitation signatures."
            ];
        } else {
            recommendations = [
                "1. Routine Maintenance: System is tracking healthy. Next scheduled inspection in 45 days.",
                "2. Optimal Efficiency: Current gate openings and power output are within 99% of theoretical maximum.",
                "3. Oil Analysis: Recommend sampling governor oil in the next 2 weeks as a precaution.",
                "4. Sensor Calibration: Plan to recalibrate vibration probes during the next seasonal outage."
            ];
        }

        let yPos = 40;
        recommendations.forEach(rec => {
            doc.text(rec, 14, yPos);
            yPos += 12;
        });

        // --- ADD GLOBAL FOOTER TO ALL PAGES ---
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(9);
            doc.setTextColor(150, 150, 150);
            doc.text(`Virtual Hydraulic Turbine SCADA - Confidential`, 14, pageHeight - 10);
            doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, pageHeight - 10);
        }

        // 5. Save the PDF
        doc.save(`Comprehensive_Hydro_Report_${activeUnit}_${timeframe}_${new Date().toISOString().split('T')[0]}.pdf`);
        setIsGenerating(false);
    }, 100); // slight timeout to allow React to render loading state
  };

  return (
    <div style={{ marginTop: 24, paddingBottom: 40 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h3 style={{ color: '#e8f4f8', fontSize: 18, margin: 0, fontWeight: 'bold' }}>Formal Analytics Report</h3>
          <p style={{ color: '#6a9bb5', fontSize: 13, marginTop: 4 }}>Generate a multi-page, text-selectable PDF with complete day-by-day breakdowns.</p>
        </div>
      </div>

      <div style={{ background: '#141d26', border: '1px solid #1c2a38', borderRadius: 12, padding: 32 }}>
          
        {/* Settings Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid #1c2a38' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ color: '#a3c4d4', fontSize: 14, fontWeight: 'bold' }}>Select Timeframe:</div>
            <select 
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              style={{
                background: '#0b121a',
                border: '1px solid #1c2a38',
                color: '#e8f4f8',
                padding: '10px 16px',
                borderRadius: 8,
                fontSize: 15,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="Daily">Daily Report</option>
              <option value="Weekly">Weekly Report (Detailed)</option>
              <option value="Monthly">Monthly Report (Detailed)</option>
              <option value="Yearly">Yearly Report (Detailed)</option>
            </select>
          </div>
          
          <button 
            onClick={downloadPDF}
            disabled={isGenerating}
            style={{
              padding: '12px 24px',
              borderRadius: 8,
              border: '1px solid #00d4ff',
              background: isGenerating ? '#1c2a38' : 'rgba(0, 212, 255, 0.1)',
              color: isGenerating ? '#6a9bb5' : '#00d4ff',
              fontWeight: 'bold',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.3s'
            }}
          >
            {isGenerating ? (
                <>Generating {timeframe === 'Weekly' ? '9' : (timeframe === 'Monthly' ? '12' : '6')}+ Pages...</>
            ) : (
                <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="12" y1="18" x2="12" y2="12"></line>
                  <polyline points="9 15 12 18 15 15"></polyline>
                </svg>
                Download Comprehensive PDF
                </>
            )}
          </button>
        </div>

        {/* Preview of what will be in the report */}
        <div style={{ marginBottom: 16 }}>
            <h4 style={{ color: '#e8f4f8', margin: '0 0 16px 0', fontSize: 15, textTransform: 'uppercase', letterSpacing: '1px' }}>Preview: {timeframe} Financial Summary</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                
                <div style={{ background: '#0b121a', padding: 20, borderRadius: 8, border: '1px solid #1c2a38' }}>
                    <div style={{ color: '#6a9bb5', fontSize: 12, textTransform: 'uppercase', marginBottom: 8 }}>Power Generated</div>
                    <div style={{ color: '#00d4ff', fontSize: 24, fontWeight: 'bold' }}>{energyFormatted} MWh</div>
                </div>
                
                <div style={{ background: '#0b121a', padding: 20, borderRadius: 8, border: '1px solid #1c2a38' }}>
                    <div style={{ color: '#6a9bb5', fontSize: 12, textTransform: 'uppercase', marginBottom: 8 }}>Income Generated</div>
                    <div style={{ color: '#10b981', fontSize: 24, fontWeight: 'bold' }}>{totalIncomeFormatted}</div>
                </div>

                <div style={{ background: '#0b121a', padding: 20, borderRadius: 8, border: '1px solid #1c2a38' }}>
                    <div style={{ color: '#6a9bb5', fontSize: 12, textTransform: 'uppercase', marginBottom: 8 }}>Alerts Resolved</div>
                    <div style={{ color: '#a78bfa', fontSize: 24, fontWeight: 'bold' }}>{resolvedBase}</div>
                </div>

                <div style={{ background: '#0b121a', padding: 20, borderRadius: 8, border: '1px solid #1c2a38' }}>
                    <div style={{ color: '#6a9bb5', fontSize: 12, textTransform: 'uppercase', marginBottom: 8 }}>Active Alerts</div>
                    <div style={{ color: activeAlertsCount > 0 ? '#ef4444' : '#10b981', fontSize: 24, fontWeight: 'bold' }}>{activeAlertsCount}</div>
                </div>
            </div>
        </div>
        
        <div style={{ marginTop: 24, background: 'rgba(0, 212, 255, 0.05)', padding: 16, borderRadius: 8, border: '1px dashed #1c2a38' }}>
            <div style={{ color: '#a3c4d4', fontSize: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                This comprehensive report will contain multiple pages breaking down operations into individual periods (days/weeks) with complete event logs and AI predictive maintenance recommendations.
            </div>
        </div>

      </div>
    </div>
  );
}
