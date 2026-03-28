import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Flame, MapPinned } from 'lucide-react';

const fallbackData = [
  { area: 'Ward 4, Palghar', totalCases: 22, criticalCases: 3, highCases: 7, mediumCases: 8, lowCases: 4, severityScore: 78 },
  { area: 'Ward 5, Palghar', totalCases: 14, criticalCases: 1, highCases: 5, mediumCases: 4, lowCases: 4, severityScore: 64 },
  { area: 'Ward 2, Palghar', totalCases: 11, criticalCases: 0, highCases: 2, mediumCases: 4, lowCases: 5, severityScore: 45 },
  { area: 'Ward 6, Palghar', totalCases: 8, criticalCases: 2, highCases: 2, mediumCases: 2, lowCases: 2, severityScore: 69 },
  { area: 'Ward 1, Palghar', totalCases: 6, criticalCases: 0, highCases: 1, mediumCases: 2, lowCases: 3, severityScore: 38 },
  { area: 'Ward 3, Palghar', totalCases: 10, criticalCases: 1, highCases: 2, mediumCases: 4, lowCases: 3, severityScore: 55 },
];

const scoreColor = (score) => {
  if (score >= 76) return 'bg-red-600 text-white';
  if (score >= 56) return 'bg-orange-500 text-white';
  if (score >= 36) return 'bg-yellow-400 text-slate-900';
  return 'bg-emerald-400 text-slate-900';
};

const scoreLabel = (score) => {
  if (score >= 76) return 'Critical';
  if (score >= 56) return 'High';
  if (score >= 36) return 'Moderate';
  return 'Low';
};

export default function AdminHeatmap() {
  const [areas, setAreas] = useState([]);
  const [summary, setSummary] = useState({ totalAreas: 0, totalCases: 0, totalCritical: 0, averageSeverity: 0 });
  const [loading, setLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    const fetchHeatmap = async () => {
      try {
        const token = localStorage.getItem('swasthya_token');
        const response = await fetch('http://localhost:5000/admin/heatmap', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Heatmap API unavailable');
        }

        const payload = await response.json();
        setAreas(payload.data || []);
        setSummary(payload.summary || { totalAreas: 0, totalCases: 0, totalCritical: 0, averageSeverity: 0 });
      } catch {
        setIsFallback(true);
        setAreas(fallbackData);
        setSummary({
          totalAreas: fallbackData.length,
          totalCases: fallbackData.reduce((acc, item) => acc + item.totalCases, 0),
          totalCritical: fallbackData.reduce((acc, item) => acc + item.criticalCases, 0),
          averageSeverity: Math.round(
            fallbackData.reduce((acc, item) => acc + item.severityScore, 0) / fallbackData.length
          ),
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmap();
  }, []);

  const topCriticalArea = useMemo(() => {
    if (!areas.length) return null;
    return [...areas].sort((a, b) => b.severityScore - a.severityScore)[0];
  }, [areas]);

  if (loading) {
    return (
      <section className="bg-white border border-slate-200 rounded-2xl p-5">
        <p className="text-sm text-slate-500">Loading area severity heatmap...</p>
      </section>
    );
  }

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <MapPinned size={18} className="text-teal-600" />
            Area Severity Heatmap
          </h3>
          <p className="text-xs text-slate-500 mt-1">Disease burden intensity by area based on case risk profile.</p>
        </div>
        {isFallback && (
          <span className="text-xs font-medium px-2.5 py-1 rounded bg-amber-100 text-amber-800 w-fit">
            Demo data
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
          <p className="text-[11px] uppercase font-semibold text-slate-500">Areas</p>
          <p className="text-xl font-bold text-slate-900">{summary.totalAreas}</p>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
          <p className="text-[11px] uppercase font-semibold text-slate-500">Total Cases</p>
          <p className="text-xl font-bold text-slate-900">{summary.totalCases}</p>
        </div>
        <div className="rounded-xl bg-red-50 border border-red-200 p-3">
          <p className="text-[11px] uppercase font-semibold text-red-600">Critical Cases</p>
          <p className="text-xl font-bold text-red-700">{summary.totalCritical}</p>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
          <p className="text-[11px] uppercase font-semibold text-slate-500">Avg Severity</p>
          <p className="text-xl font-bold text-slate-900">{summary.averageSeverity}%</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {areas.map((area) => (
          <button
            type="button"
            key={area.area}
            title={`${area.area} - ${area.severityScore}% severity`}
            className={`rounded-xl p-3 text-left transition-transform hover:-translate-y-0.5 ${scoreColor(area.severityScore)}`}
          >
            <p className="text-[11px] font-semibold truncate">{area.area}</p>
            <p className="text-xl font-bold leading-tight mt-1">{area.severityScore}%</p>
            <p className="text-[11px] opacity-90 mt-1">{scoreLabel(area.severityScore)}</p>
          </button>
        ))}
      </div>

      {topCriticalArea && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-start gap-2">
          <Flame size={16} className="text-red-600 mt-0.5" />
          <p className="text-sm text-slate-700">
            Highest burden area: <span className="font-semibold">{topCriticalArea.area}</span> with{' '}
            <span className="font-semibold">{topCriticalArea.severityScore}% severity</span> and{' '}
            <span className="font-semibold">{topCriticalArea.criticalCases}</span> critical cases.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 text-[11px]">
        <span className="px-2 py-1 rounded bg-red-600 text-white">76-100 Critical</span>
        <span className="px-2 py-1 rounded bg-orange-500 text-white">56-75 High</span>
        <span className="px-2 py-1 rounded bg-yellow-400 text-slate-900">36-55 Moderate</span>
        <span className="px-2 py-1 rounded bg-emerald-400 text-slate-900">0-35 Low</span>
      </div>

      {areas.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 flex items-center gap-2">
          <AlertTriangle size={16} /> No area data available yet. Add patient and risk records to populate the heatmap.
        </div>
      )}
    </section>
  );
}
