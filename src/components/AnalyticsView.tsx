import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  PieChart as PieIcon, 
  TrendingUp, 
  Users, 
  Clock, 
  Download,
  Sparkles,
  Flame,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { ScanRecord } from '../types';
import { storageService } from '../services/storageService';
import { soundService } from '../services/soundService';

export function AnalyticsView() {
  const [records, setRecords] = useState<ScanRecord[]>([]);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  useEffect(() => {
    setRecords(storageService.getHistory());
  }, []);

  const handleResetData = () => {
    storageService.clearAllHistory();
    setRecords([]);
    setShowResetConfirm(false);
    soundService.playTempleBell(0.9);
  };

  const totalScans = records.length;
  const isHealthyCat = (c: string) => c === '0_TO_3_HOURS' || c === '1_TO_3_DAYS' || c === 'HEALTHY';
  const isModerateCat = (c: string) => c === '3_TO_5_HOURS' || c === '3_TO_5_DAYS';
  const isOveruseCat = (c: string) => c === '5_PLUS_HOURS' || c === '7_PLUS_DAYS' || c === '5_TO_7_DAYS' || c === 'WARNING' || c === 'HIGH_RISK';

  const healthyScans = records.filter((r) => isHealthyCat(r.category)).length;
  const warningScans = records.filter((r) => isModerateCat(r.category)).length;
  const highRiskScans = records.filter((r) => isOveruseCat(r.category)).length;

  // Age group counts
  const kidsCount = records.filter((r) => r.ageGroup === '0-12').length;
  const youthCount = records.filter((r) => r.ageGroup === '13-21').length;
  const adultCount = records.filter((r) => r.ageGroup === '21+').length;

  const healthyPct = totalScans > 0 ? Math.round((healthyScans / totalScans) * 100) : 0;
  const warningPct = totalScans > 0 ? Math.round((warningScans / totalScans) * 100) : 0;
  const highRiskPct = totalScans > 0 ? Math.round((highRiskScans / totalScans) * 100) : 0;

  const totalMinutes = records.reduce((acc, curr) => acc + curr.screenTimeMinutes, 0);
  const avgMinutes = totalScans > 0 ? Math.round(totalMinutes / totalScans) : 0;
  const avgHours = (avgMinutes / 60).toFixed(1);

  // Overall Digital Wellbeing Index (0 - 100%)
  const wellbeingScore = totalScans > 0 
    ? Math.round((healthyScans * 100 + warningScans * 50 + highRiskScans * 10) / totalScans)
    : 85;

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6" id="analytics-view-container">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#ffd700]/30 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#35101a] text-[#ffd700] border border-[#ffd700]/50 shadow-md">
              <BarChart3 className="h-4 w-4" />
            </div>
            <h2 className="font-royal text-xl sm:text-2xl font-bold text-[#ffd700] tracking-wide">
              Digital Wellbeing Analytics &amp; Insights
            </h2>
          </div>
          <p className="font-sans text-xs text-[#e8cba4]/80 mt-1">
            Screen time statistics, healthy usage habits, and behavioral trends.
          </p>
        </div>

        {/* Action Buttons: Export CSV & Reset Data */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={() => storageService.exportCsv(records)}
            disabled={records.length === 0}
            id="analytics-export-csv-btn"
            className="flex flex-1 sm:flex-initial items-center justify-center space-x-2 rounded-xl border border-[#ffd700]/60 bg-[#2b0c16] px-4 py-2 text-xs sm:text-sm font-bold text-[#ffd700] hover:bg-[#3d1220] shadow-md disabled:opacity-50 transition-all font-sans"
          >
            <Download className="h-4 w-4" />
            <span>Export Report</span>
          </button>

          <button
            onClick={() => setShowResetConfirm(true)}
            disabled={records.length === 0}
            id="analytics-reset-btn"
            className="flex items-center justify-center space-x-1.5 rounded-xl border border-rose-500/50 bg-rose-950/80 px-3.5 py-2 text-xs sm:text-sm font-bold text-rose-300 hover:bg-rose-900 disabled:opacity-50 transition-all shadow-md font-sans"
            title="Reset Analytics Data"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset Data</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {/* Wellbeing Score Card */}
        <div className="rounded-2xl p-4 border border-[#ffd700]/40 bg-[#220710] shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs text-[#e8cba4] font-medium">Wellbeing Score</span>
            <Sparkles className="h-4 w-4 text-[#ffd700]" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="font-mono text-3xl font-black text-[#ffd700]">{wellbeingScore}%</span>
            <span className="text-xs text-emerald-400 font-bold">Healthy</span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#160408] border border-[#ffd700]/20">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-[#ffd700]"
              style={{ width: `${wellbeingScore}%` }}
            />
          </div>
        </div>

        {/* Average Screen Time */}
        <div className="rounded-2xl p-4 border border-[#ffd700]/40 bg-[#220710] shadow-xl">
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs text-[#e8cba4] font-medium">Average Screen Time</span>
            <Clock className="h-4 w-4 text-[#ffd700]" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="font-mono text-3xl font-black text-[#ffd700]">{avgHours}</span>
            <span className="text-xs text-[#e8cba4]">Hours / Day</span>
          </div>
          <p className="mt-3 text-[10px] text-[#e8cba4]/60 font-sans">
            Target: Under 3.0h daily
          </p>
        </div>

        {/* Total Scans */}
        <div className="rounded-2xl p-4 border border-[#ffd700]/40 bg-[#220710] shadow-xl">
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs text-[#e8cba4] font-medium">Total Evaluated</span>
            <Users className="h-4 w-4 text-[#ffd700]" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="font-mono text-3xl font-black text-white">{totalScans}</span>
            <span className="text-xs text-emerald-400 font-bold">Scans</span>
          </div>
          <p className="mt-3 text-[10px] text-[#e8cba4]/60 font-sans">
            Unique phone scan records
          </p>
        </div>

        {/* High Risk Alerts */}
        <div className="rounded-2xl p-4 border border-rose-500/40 bg-[#220710] shadow-xl">
          <div className="flex items-center justify-between">
            <span className="font-sans text-xs text-[#e8cba4] font-medium">Overuse Alerts</span>
            <Flame className="h-4 w-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="font-mono text-3xl font-black text-rose-400">{highRiskScans}</span>
            <span className="text-xs text-rose-400 font-bold">&gt; 5 Hours</span>
          </div>
          <p className="mt-3 text-[10px] text-[#e8cba4]/60 font-sans">
            Requires mindful screen pauses
          </p>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 mb-6">
        {/* Category Breakdown Proportions (7 Cols) */}
        <div className="rounded-2xl p-5 border border-[#ffd700]/40 bg-[#220710] shadow-xl lg:col-span-7">
          <h3 className="font-royal text-base font-bold text-[#ffd700] mb-4 flex items-center space-x-2 tracking-wide">
            <PieIcon className="h-4 w-4 text-[#ffd700]" />
            <span>Screen Time Category Distribution</span>
          </h3>

          {/* Progress Stack Bars */}
          <div className="space-y-4 font-sans">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-emerald-300">Healthy (0 - 3 Hours — 8s Full Open)</span>
                <span className="font-mono text-emerald-300">{healthyScans} users ({healthyPct}%)</span>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full bg-emerald-950 border border-emerald-500/40">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                  style={{ width: `${healthyPct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-sky-300">Moderate (3 - 5 Hours — 4s Gentle Open)</span>
                <span className="font-mono text-sky-300">{warningScans} users ({warningPct}%)</span>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full bg-sky-950 border border-sky-500/40">
                <div
                  className="h-full bg-sky-500 transition-all duration-500 rounded-full"
                  style={{ width: `${warningPct}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-rose-300">Overuse (5+ Hours — Auto-Close 26s)</span>
                <span className="font-mono text-rose-300">{highRiskScans} users ({highRiskPct}%)</span>
              </div>
              <div className="h-4 w-full overflow-hidden rounded-full bg-rose-950 border border-rose-500/40">
                <div
                  className="h-full bg-rose-500 transition-all duration-500 rounded-full"
                  style={{ width: `${highRiskPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Age Demographics Strip */}
          <div className="mt-5 p-3 rounded-xl bg-[#140306]/70 border border-[#ffd700]/25 font-sans">
            <div className="text-[11px] font-bold text-[#ffd700] mb-2 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-[#ffd700]" />
              <span>Age Demographics (0-12 / 13-21 / 21+)</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-[#250d18] p-2 border border-pink-500/40">
                <div className="font-mono font-bold text-pink-300 text-sm">{kidsCount}</div>
                <div className="text-[10px] text-[#e8cba4]/75 font-semibold">Age 0-12 (Children)</div>
              </div>
              <div className="rounded-lg bg-[#141b2c] p-2 border border-cyan-500/40">
                <div className="font-mono font-bold text-cyan-300 text-sm">{youthCount}</div>
                <div className="text-[10px] text-[#e8cba4]/75 font-semibold">Age 13-21 (Youth)</div>
              </div>
              <div className="rounded-lg bg-[#26080b] p-2 border border-red-500/40">
                <div className="font-mono font-bold text-red-300 text-sm">{adultCount}</div>
                <div className="text-[10px] text-[#e8cba4]/75 font-semibold">Age 21+ (Adults)</div>
              </div>
            </div>
          </div>

          {/* Proportional Donut representation */}
          <div className="mt-5 pt-3 border-t border-[#ffd700]/20 grid grid-cols-3 gap-2 text-center font-sans">
            <div className="rounded-xl bg-emerald-950/80 p-2.5 border border-emerald-500/50">
              <div className="text-[10px] text-emerald-300 font-medium">0-3h Full Darshanam</div>
              <div className="font-mono text-base font-black text-emerald-400">{healthyPct}%</div>
              <div className="text-[9px] text-emerald-300/70 font-mono">OPEN_FULL (8s)</div>
            </div>
            <div className="rounded-xl bg-sky-950/80 p-2.5 border border-sky-500/50">
              <div className="text-[10px] text-sky-300 font-medium">3-5h Moderate</div>
              <div className="font-mono text-base font-black text-sky-400">{warningPct}%</div>
              <div className="text-[9px] text-sky-300/70 font-mono">OPEN_SLOW (4s)</div>
            </div>
            <div className="rounded-xl bg-rose-950/80 p-2.5 border border-rose-500/50">
              <div className="text-[10px] text-rose-300 font-medium">5+h Auto-Close</div>
              <div className="font-mono text-base font-black text-rose-400">{highRiskPct}%</div>
              <div className="text-[9px] text-rose-300/70 font-mono">26s CLOSE</div>
            </div>
          </div>
        </div>

        {/* Recent Evaluation Distribution (5 Cols) */}
        <div className="rounded-2xl p-5 border border-[#ffd700]/40 bg-[#220710] shadow-xl lg:col-span-5 flex flex-col justify-between">
          <div>
            <h3 className="font-royal text-base font-bold text-[#ffd700] mb-3 flex items-center space-x-2 tracking-wide">
              <TrendingUp className="h-4 w-4 text-[#ffd700]" />
              <span>Evaluation Trends</span>
            </h3>

            <p className="font-sans text-xs text-[#e8cba4] leading-relaxed mb-4">
              To support healthy digital habits, under 2 hours of mobile usage and at least 1 hour of active physical outdoor play are recommended daily.
            </p>

            {/* Visual Bar Graph */}
            {records.length > 0 ? (
              <div className="flex h-36 items-end justify-between space-x-2 rounded-xl bg-[#160408] p-3 border border-[#ffd700]/30 font-sans">
                {records.slice(0, 7).reverse().map((item, idx) => {
                  const heightPct = Math.min(100, Math.max(15, (item.screenTimeMinutes / 420) * 100));
                  const color = item.category === 'HEALTHY' ? 'bg-emerald-500' : item.category === 'WARNING' ? 'bg-amber-500' : 'bg-rose-500';
                  return (
                    <div key={item.id} className="flex flex-1 flex-col items-center h-full justify-end group">
                      <span className="text-[9px] font-mono text-[#ffd700] mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.screenTimeString}
                      </span>
                      <div
                        className={`w-full rounded-t-md ${color} transition-all group-hover:brightness-110 shadow-xs`}
                        style={{ height: `${heightPct}%` }}
                      />
                      <span className="mt-1 font-mono text-[9px] text-[#e8cba4]/70">
                        #{idx + 1}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-36 flex-col items-center justify-center rounded-xl bg-[#160408] p-3 border border-[#ffd700]/20 text-center font-sans">
                <BarChart3 className="h-7 w-7 text-[#ffd700]/40 mb-1" />
                <p className="text-xs text-[#e8cba4]/70">No scan records available</p>
                <span className="text-[10px] text-[#e8cba4]/50">Scan a device screen to view statistics</span>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-[#ffd700]/20 text-center font-sans">
            <span className="text-[11px] text-[#ffd700] font-semibold">
              Lord Ganesha's blessings for a balanced, bright future!
            </span>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 font-sans">
          <div className="max-w-md w-full rounded-2xl border-2 border-rose-500 bg-[#220710] p-6 text-center space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-950 text-rose-400 border border-rose-500">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="font-royal text-lg font-bold text-[#ffd700] tracking-wide">
              Reset Analytics &amp; History Data?
            </h3>
            <p className="font-sans text-xs text-[#e8cba4] leading-relaxed">
              This action cannot be undone. All saved scan evaluations and analytics trends will be permanently removed.
            </p>
            <div className="flex items-center justify-center space-x-3 pt-2 font-sans">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="rounded-xl border border-[#ffd700]/40 bg-[#160408] px-4 py-2 text-xs font-semibold text-[#ffd700] hover:bg-[#2b0c16]"
              >
                Cancel
              </button>
              <button
                onClick={handleResetData}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 shadow-md"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
