import { useState, useEffect } from 'react';
import { 
  History, 
  Download, 
  Trash2, 
  Search, 
  ShieldCheck, 
  AlertTriangle,
  Award
} from 'lucide-react';
import { ScanRecord, CATEGORY_DETAILS, AppPage } from '../types';
import { storageService } from '../services/storageService';
import { soundService } from '../services/soundService';

interface HistoryViewProps {
  onNavigate?: (page: AppPage) => void;
}

export function HistoryView({ onNavigate }: HistoryViewProps) {
  const [records, setRecords] = useState<ScanRecord[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  useEffect(() => {
    setRecords(storageService.getHistory());
  }, []);

  const handleExportCsv = () => {
    soundService.playScanBeep();
    storageService.exportCsv(filteredRecords);
  };

  const handleClearHistory = () => {
    storageService.clearAllHistory();
    setRecords([]);
    setShowClearConfirm(false);
    soundService.playTempleBell(0.9);
  };

  const filteredRecords = records.filter((r) => {
    const matchesCategory = filterCategory === 'ALL' || r.category === filterCategory;
    const matchesSearch =
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.screenTimeString.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.teluguMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.arduinoCommand.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6" id="history-view-container">
      {/* Header Bar */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#ffd700]/30 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#35101a] text-[#ffd700] border border-[#ffd700]/50 shadow-md">
              <History className="h-4 w-4" />
            </div>
            <h2 className="font-royal text-xl sm:text-2xl font-bold text-[#ffd700] tracking-wide">
              Scan History &amp; Activity Records
            </h2>
          </div>
          <p className="font-sans text-xs text-[#e8cba4]/80 mt-1">
            Digital wellbeing evaluation logs and hardware door control records.
          </p>
        </div>

        {/* Action Buttons: Export CSV & Clear */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {onNavigate && (
            <button
              onClick={() => onNavigate('certificate')}
              id="history-award-certificate-btn"
              className="flex items-center space-x-1.5 rounded-xl border-2 border-[#ffd700] bg-gradient-to-r from-amber-600 via-[#c22846] to-amber-700 px-3.5 py-2 text-xs sm:text-sm font-bold text-white shadow-md hover:scale-105 transition-all font-sans"
            >
              <Award className="h-4 w-4 text-[#ffd700]" />
              <span>Award Certificate</span>
            </button>
          )}

          <button
            onClick={handleExportCsv}
            disabled={filteredRecords.length === 0}
            id="export-csv-btn"
            className="flex flex-1 sm:flex-initial items-center justify-center space-x-2 rounded-xl border border-[#ffd700]/60 bg-[#2b0c16] px-4 py-2 text-xs sm:text-sm font-bold text-[#ffd700] hover:bg-[#3d1220] shadow-md disabled:opacity-50 transition-all font-sans"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowClearConfirm(true)}
            disabled={records.length === 0}
            id="clear-history-btn"
            className="flex items-center justify-center space-x-1.5 rounded-xl border border-rose-500/50 bg-rose-950/80 px-3 py-2 text-xs sm:text-sm font-semibold text-rose-300 hover:bg-rose-900 disabled:opacity-50 transition-all shadow-md font-sans"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline font-sans">Clear History</span>
          </button>
        </div>
      </div>

      {/* Privacy Notice Card */}
      <div className="mb-6 flex items-center space-x-3 rounded-xl border border-emerald-500/50 bg-emerald-950/90 p-3 text-emerald-300 shadow-md">
        <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400" />
        <div className="text-xs font-sans">
          <span className="font-bold">Privacy Guarantee: </span>
          Photos are processed in browser memory and never uploaded or stored. Only screen time numbers and categories are recorded locally.
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-12 font-sans">
        {/* Search Input */}
        <div className="relative sm:col-span-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#ffd700]/60" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search User ID, screen time, or hardware command..."
            className="w-full rounded-xl border border-[#ffd700]/40 bg-[#1e060e] pl-9 pr-4 py-2 text-xs sm:text-sm text-[#f5f2ed] placeholder-[#e8cba4]/40 focus:border-[#ffd700] focus:outline-none shadow-md font-sans"
          />
        </div>

        {/* Category Filters */}
        <div className="flex items-center space-x-1 sm:col-span-6 overflow-x-auto pb-1 sm:pb-0 font-sans">
          <button
            onClick={() => setFilterCategory('ALL')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              filterCategory === 'ALL'
                ? 'bg-[#ffd700] text-black shadow-md'
                : 'bg-[#250912] text-[#e8cba4] hover:bg-[#350d1a] border border-[#ffd700]/30'
            }`}
          >
            All ({records.length})
          </button>
          <button
            onClick={() => setFilterCategory('0_TO_3_HOURS')}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
              filterCategory === '0_TO_3_HOURS'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-emerald-950/80 text-emerald-300 hover:bg-emerald-900 border border-emerald-500/40'
            }`}
          >
            0-3h ({records.filter((r) => r.category === '0_TO_3_HOURS' || r.category === '1_TO_3_DAYS' || r.category === 'HEALTHY').length})
          </button>
          <button
            onClick={() => setFilterCategory('3_TO_5_HOURS')}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
              filterCategory === '3_TO_5_HOURS'
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-sky-950/80 text-sky-300 hover:bg-sky-900 border border-sky-500/40'
            }`}
          >
            3-5h ({records.filter((r) => r.category === '3_TO_5_HOURS' || r.category === '3_TO_5_DAYS').length})
          </button>
          <button
            onClick={() => setFilterCategory('5_PLUS_HOURS')}
            className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
              filterCategory === '5_PLUS_HOURS'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-rose-950/80 text-rose-300 hover:bg-rose-900 border border-rose-500/40'
            }`}
          >
            5+h ({records.filter((r) => r.category === '5_PLUS_HOURS' || r.category === '7_PLUS_DAYS' || r.category === '5_TO_7_DAYS' || r.category === 'HIGH_RISK' || r.category === 'WARNING').length})
          </button>
        </div>
      </div>

      {/* History Data Table */}
      <div className="overflow-hidden rounded-2xl border border-[#ffd700]/40 bg-[#220710] shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm font-sans">
            <thead className="border-b border-[#ffd700]/30 bg-[#2e0b17] text-[#ffd700] uppercase font-mono text-[11px]">
              <tr>
                <th className="px-4 py-3.5">User ID</th>
                <th className="px-4 py-3.5">Age Group</th>
                <th className="px-4 py-3.5">Date &amp; Time</th>
                <th className="px-4 py-3.5">Screen Time</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Guidance Message</th>
                <th className="px-4 py-3.5">Door Action</th>
                <th className="px-4 py-3.5">Arduino Command</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ffd700]/10 text-[#f5f2ed]">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((r) => {
                  const details = CATEGORY_DETAILS[r.category] || CATEGORY_DETAILS['0_TO_3_HOURS'];
                  const isHealthy = r.category === '0_TO_3_HOURS' || r.category === '1_TO_3_DAYS' || r.category === 'HEALTHY';
                  const isModerate = r.category === '3_TO_5_HOURS' || r.category === '3_TO_5_DAYS';

                  return (
                    <tr key={r.id} className="hover:bg-[#340d1a] transition-colors">
                      {/* User ID */}
                      <td className="px-4 py-3.5 font-mono font-bold text-[#ffd700]">
                        {r.id}
                      </td>

                      {/* Age Group */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="rounded-full bg-[#140306] border border-[#ffd700]/50 px-2 py-0.5 font-mono text-xs font-bold text-[#ffd700]">
                          {r.ageGroup || 'General'}
                        </span>
                      </td>

                      {/* Date & Time */}
                      <td className="px-4 py-3.5 text-[#e8cba4] whitespace-nowrap">
                        <div className="font-sans font-medium text-white">
                          {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-[10px] text-[#e8cba4]/60">
                          {new Date(r.timestamp).toLocaleDateString()}
                        </div>
                      </td>

                      {/* Screen Time */}
                      <td className="px-4 py-3.5 font-mono text-base font-black text-[#ffd700]">
                        {r.screenTimeString}
                        <div className="text-[10px] text-[#e8cba4]/60 font-sans">
                          {r.confidence}% Conf.
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center space-x-1 rounded-full px-2.5 py-1 text-xs font-bold ${
                          isHealthy
                            ? 'bg-emerald-950 border border-emerald-500 text-emerald-300' 
                            : isModerate
                            ? 'bg-sky-950 border border-sky-500 text-sky-300'
                            : 'bg-rose-950 border border-rose-500 text-rose-300'
                        }`}>
                          {isHealthy ? <ShieldCheck className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                          <span className="font-sans">{details.ageLabel || details.labelEnglish}</span>
                        </span>
                      </td>

                      {/* Guidance Message */}
                      <td className="px-4 py-3.5 max-w-xs font-sans text-xs text-[#e8cba4] leading-relaxed">
                        {r.teluguMessage}
                      </td>

                      {/* Door Action */}
                      <td className="px-4 py-3.5 font-sans text-xs text-white whitespace-nowrap font-medium">
                        {r.doorAction}
                      </td>

                      {/* Arduino Command */}
                      <td className="px-4 py-3.5 font-mono text-xs whitespace-nowrap">
                        <span className="rounded bg-[#160408] px-2 py-0.5 border border-[#ffd700]/40 text-[#ffd700] font-bold">
                          {r.arduinoCommand}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-[#e8cba4]/70">
                    <History className="mx-auto h-8 w-8 text-[#ffd700] mb-2" />
                    <p className="font-sans text-sm">No records match the selected filter</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 font-sans">
          <div className="max-w-md w-full rounded-2xl border-2 border-rose-500 bg-[#220710] p-6 text-center space-y-4 shadow-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-950 text-rose-400 border border-rose-500">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="font-royal text-lg font-bold text-[#ffd700] tracking-wide">
              Clear All History Records?
            </h3>
            <p className="font-sans text-xs text-[#e8cba4]">
              This action cannot be undone. All saved scan evaluations will be permanently deleted.
            </p>
            <div className="flex items-center justify-center space-x-3 pt-2 font-sans">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="rounded-xl border border-[#ffd700]/40 bg-[#160408] px-4 py-2 text-xs font-semibold text-[#ffd700] hover:bg-[#2b0c16]"
              >
                Cancel
              </button>
              <button
                onClick={handleClearHistory}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 shadow-md"
              >
                Clear All Records
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
