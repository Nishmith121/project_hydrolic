import React, { useRef } from 'react';
import html2pdf from 'html2pdf.js';

export default function ReportGenerator() {
  const reportRef = useRef(null);

  const downloadPDF = () => {
    if (!reportRef.current) return;
    
    const opt = {
      margin:       10,
      filename:     `Hydro_Turbine_Analytics_Report_${new Date().toISOString().split('T')[0]}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, backgroundColor: '#0b121a', useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };
    
    html2pdf().set(opt).from(reportRef.current).save();
  };

  return (
    <div style={{ marginTop: 24, paddingBottom: 40 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 style={{ color: '#e8f4f8', fontSize: 18, margin: 0, fontWeight: 'bold' }}>Comprehensive Analytics Report</h3>
          <p style={{ color: '#6a9bb5', fontSize: 13, marginTop: 4 }}>Export historical data and turbine efficiency metrics to PDF</p>
        </div>
        <button 
          onClick={downloadPDF}
          style={{
            padding: '12px 24px',
            borderRadius: 8,
            border: '1px solid #00d4ff',
            background: 'rgba(0, 212, 255, 0.1)',
            color: '#00d4ff',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.3s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0, 212, 255, 0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(0, 212, 255, 0.1)'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Export PDF Report
        </button>
      </div>

      <div 
        ref={reportRef} 
        style={{ 
          background: '#141d26', 
          border: '1px solid #1c2a38', 
          borderRadius: 12, 
          padding: 32 
        }}
      >
        <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid #1c2a38' }} data-html2canvas-ignore="false">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ color: '#ffffff', margin: 0, fontSize: 26, fontWeight: 'bold', letterSpacing: '-0.5px' }}>Hydro Turbine 01</h2>
              <h3 style={{ color: '#00d4ff', margin: '4px 0 0 0', fontSize: 18 }}>Performance & Efficiency Report</h3>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#6a9bb5', fontSize: 12, textTransform: 'uppercase', letterSpacing: '1px' }}>Generated On</div>
              <div style={{ color: '#e8f4f8', fontSize: 16, fontWeight: 'bold' }}>{new Date().toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 40 }}>
            <div style={{ background: '#0b121a', padding: 20, borderRadius: 8, border: '1px solid #1c2a38' }}>
                <div style={{ color: '#6a9bb5', fontSize: 12, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.5px' }}>Weekly Efficiency</div>
                <div style={{ color: '#10b981', fontSize: 32, fontWeight: 'bold' }}>94.2%</div>
                <div style={{ color: '#10b981', fontSize: 13, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
                  +1.2% vs last week
                </div>
            </div>
            <div style={{ background: '#0b121a', padding: 20, borderRadius: 8, border: '1px solid #1c2a38' }}>
                <div style={{ color: '#6a9bb5', fontSize: 12, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.5px' }}>Monthly Efficiency</div>
                <div style={{ color: '#10b981', fontSize: 32, fontWeight: 'bold' }}>93.8%</div>
                <div style={{ color: '#ef4444', fontSize: 13, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline><polyline points="16 17 22 17 22 11"></polyline></svg>
                  -0.4% vs last month
                </div>
            </div>
            <div style={{ background: '#0b121a', padding: 20, borderRadius: 8, border: '1px solid #1c2a38' }}>
                <div style={{ color: '#6a9bb5', fontSize: 12, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.5px' }}>YTD Efficiency</div>
                <div style={{ color: '#f59e0b', fontSize: 32, fontWeight: 'bold' }}>91.5%</div>
                <div style={{ color: '#a3c4d4', fontSize: 13, marginTop: 6 }}>
                  Maintained steady average
                </div>
            </div>
            <div style={{ background: '#0b121a', padding: 20, borderRadius: 8, border: '1px solid #1c2a38' }}>
                <div style={{ color: '#6a9bb5', fontSize: 12, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.5px' }}>Total Energy (YTD)</div>
                <div style={{ color: '#00d4ff', fontSize: 32, fontWeight: 'bold' }}>1.42 GWh</div>
                <div style={{ color: '#a3c4d4', fontSize: 13, marginTop: 6 }}>
                  14,200 hours online
                </div>
            </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 24 }}>
          <div style={{ background: '#0b121a', padding: 24, borderRadius: 8, border: '1px solid #1c2a38' }}>
             <h4 style={{ color: '#e8f4f8', margin: '0 0 24px 0', fontSize: 17, fontWeight: 'bold' }}>Downtime Analysis (Last 30 Days)</h4>
             <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a3c4d4', fontSize: 14, marginBottom: 8 }}>
                     <span>Scheduled Maintenance</span>
                     <span style={{ fontWeight: 'bold' }}>12 hrs (40%)</span>
                   </div>
                   <div style={{ width: '100%', height: 8, background: '#1c2a38', borderRadius: 4 }}>
                     <div style={{ width: '40%', height: '100%', background: '#00d4ff', borderRadius: 4 }}></div>
                   </div>
                </div>
                <div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a3c4d4', fontSize: 14, marginBottom: 8 }}>
                     <span>Sensor Faults</span>
                     <span style={{ fontWeight: 'bold' }}>8 hrs (26%)</span>
                   </div>
                   <div style={{ width: '100%', height: 8, background: '#1c2a38', borderRadius: 4 }}>
                     <div style={{ width: '26%', height: '100%', background: '#f59e0b', borderRadius: 4 }}></div>
                   </div>
                </div>
                <div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a3c4d4', fontSize: 14, marginBottom: 8 }}>
                     <span>Grid Instability Drops</span>
                     <span style={{ fontWeight: 'bold' }}>6 hrs (20%)</span>
                   </div>
                   <div style={{ width: '100%', height: 8, background: '#1c2a38', borderRadius: 4 }}>
                     <div style={{ width: '20%', height: '100%', background: '#ef4444', borderRadius: 4 }}></div>
                   </div>
                </div>
                <div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a3c4d4', fontSize: 14, marginBottom: 8 }}>
                     <span>Other</span>
                     <span style={{ fontWeight: 'bold' }}>4 hrs (14%)</span>
                   </div>
                   <div style={{ width: '100%', height: 8, background: '#1c2a38', borderRadius: 4 }}>
                     <div style={{ width: '14%', height: '100%', background: '#6a9bb5', borderRadius: 4 }}></div>
                   </div>
                </div>
             </div>
          </div>
          <div style={{ background: '#0b121a', padding: 24, borderRadius: 8, border: '1px solid #1c2a38' }}>
             <h4 style={{ color: '#e8f4f8', margin: '0 0 24px 0', fontSize: 17, fontWeight: 'bold' }}>Financial Impact & AI Optimization</h4>
             <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
               <li style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                 <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: 8, borderRadius: 8 }}>
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                 </div>
                 <div>
                   <div style={{ color: '#e8f4f8', fontSize: 15, fontWeight: 'bold', marginBottom: 4 }}>Revenue Recovered: $42,500</div>
                   <div style={{ color: '#a3c4d4', fontSize: 14, lineHeight: 1.5 }}>Saved via AI predictive alerts preventing 3 major turbine unplanned outages.</div>
                 </div>
               </li>
               <li style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                 <div style={{ background: 'rgba(0, 212, 255, 0.15)', color: '#00d4ff', padding: 8, borderRadius: 8 }}>
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                 </div>
                 <div>
                   <div style={{ color: '#e8f4f8', fontSize: 15, fontWeight: 'bold', marginBottom: 4 }}>Efficiency Gains</div>
                   <div style={{ color: '#a3c4d4', fontSize: 14, lineHeight: 1.5 }}>Improved water-to-wire efficiency by 1.2% through dynamic AI wicket gate tuning.</div>
                 </div>
               </li>
               <li style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                 <div style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: 8, borderRadius: 8 }}>
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
                 </div>
                 <div>
                   <div style={{ color: '#e8f4f8', fontSize: 15, fontWeight: 'bold', marginBottom: 4 }}>Maintenance Savings</div>
                   <div style={{ color: '#a3c4d4', fontSize: 14, lineHeight: 1.5 }}>Reduced scheduled inspections by 15% via proactive condition-based monitoring.</div>
                 </div>
               </li>
             </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
