import { CheckCircleOutlined, WarningOutlined, AlertOutlined, ToolOutlined } from "@ant-design/icons";

export default function DiagnosticPanel({ ml_insights }) {
  const isAnomaly = ml_insights?.is_anomaly;

  if (!isAnomaly) {
    return (
      <div className="h-full rounded-xl border border-green-500/30 bg-gradient-to-br from-green-500/10 to-[#0b2236]/80 p-5 flex items-center gap-4 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
        <CheckCircleOutlined className="text-3xl text-green-500" />
        <div>
          <h3 className="text-green-500 font-bold text-sm tracking-wider uppercase m-0 leading-tight">
            System Optimal
          </h3>
          <p className="text-[#6a9bb5] text-sm m-0 mt-1">
            No maintenance actions required.
          </p>
        </div>
      </div>
    );
  }

  const isCritical = ml_insights.action_required?.toUpperCase().includes("CRITICAL");
  const borderColor = isCritical ? "border-red-500/50" : "border-amber-500/50";
  const glowColor = isCritical ? "shadow-[0_0_20px_rgba(239,68,68,0.2)]" : "shadow-[0_0_20px_rgba(245,158,11,0.2)]";
  const bgGradient = isCritical ? "from-red-500/10" : "from-amber-500/10";
  const iconColor = isCritical ? "text-red-500" : "text-amber-500";
  const Icon = isCritical ? AlertOutlined : WarningOutlined;

  return (
    <div className={`h-full relative rounded-xl border ${borderColor} bg-gradient-to-br ${bgGradient} to-[#071a2b] p-6 flex flex-col ${glowColor} overflow-hidden`}>
      {/* Top Banner Indicator */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${isCritical ? "bg-red-500" : "bg-amber-500"}`} />

      {/* Header */}
      <div className="flex items-center gap-4 mb-5">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center border ${borderColor} bg-[#071a2b]/80 ${iconColor} text-2xl`}>
          <Icon />
        </div>
        <div>
          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase mb-1 ${isCritical ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"}`}>
            {isCritical ? "CRITICAL ACTION REQUIRED" : "MAINTENANCE WARNING"}
          </span>
          <h2 className="text-[#e8f4f8] text-lg font-bold m-0 tracking-wide uppercase">
            Work Order Ticket
          </h2>
        </div>
      </div>

      {/* Details Container */}
      <div className="flex-1 bg-[#071a2b]/60 border border-[#164260] rounded-lg p-5 flex flex-col gap-4 mb-5">
        <div>
          <span className="block text-[10px] text-[#6a9bb5] uppercase tracking-widest mb-1 font-semibold">
            Fault Diagnosis
          </span>
          <div className="text-[#e8f4f8] text-base font-medium">
            {ml_insights.diagnosis || "Unknown Fault Detected"}
          </div>
        </div>

        <div>
          <span className="block text-[10px] text-[#6a9bb5] uppercase tracking-widest mb-1 font-semibold">
            Prescribed Action
          </span>
          <div className={`text-base font-bold flex items-start gap-2 ${iconColor}`}>
            <ToolOutlined className="mt-1" />
            <span>{ml_insights.action_required || "Investigate system components immediately."}</span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button className={`w-full py-3 rounded-lg font-bold text-sm uppercase tracking-widest transition-all duration-200 cursor-pointer ${
        isCritical 
          ? "bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]" 
          : "bg-amber-500 hover:bg-amber-600 text-[#071a2b] shadow-[0_0_15px_rgba(245,158,11,0.4)]"
      }`}>
        Acknowledge & Dispatch
      </button>
    </div>
  );
}
