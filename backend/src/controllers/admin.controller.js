import asyncHandler from 'express-async-handler';
import Patient from '../models/Patient.js';

const riskWeight = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

const normalizeArea = (doc) => {
  const village = (doc.village || '').trim();
  const region = (doc.region || '').trim();
  if (village && region) return `${village}, ${region}`;
  if (village) return village;
  if (region) return region;
  return 'Unknown Area';
};

// @desc    Area-wise severity data for heatmap
// @route   GET /admin/heatmap
// @access  Private (Admin)
export const getAreaSeverityHeatmap = asyncHandler(async (req, res) => {
  const regionFilter = req.query.region ? String(req.query.region).trim() : null;

  const query = { isDeleted: false };
  if (regionFilter) {
    query.region = regionFilter;
  }

  const patients = await Patient.find(query).select('village region currentRiskLevel').lean();

  const areaMap = new Map();

  for (const patient of patients) {
    const area = normalizeArea(patient);
    const level = (patient.currentRiskLevel || 'LOW').toUpperCase();
    const weight = riskWeight[level] || 1;

    if (!areaMap.has(area)) {
      areaMap.set(area, {
        area,
        totalCases: 0,
        weightedSeverityTotal: 0,
        riskBreakdown: {
          LOW: 0,
          MEDIUM: 0,
          HIGH: 0,
          CRITICAL: 0,
        },
      });
    }

    const bucket = areaMap.get(area);
    bucket.totalCases += 1;
    bucket.weightedSeverityTotal += weight;

    if (bucket.riskBreakdown[level] === undefined) {
      bucket.riskBreakdown[level] = 0;
    }
    bucket.riskBreakdown[level] += 1;
  }

  const areas = Array.from(areaMap.values()).map((item) => {
    const averageRiskWeight = item.totalCases > 0 ? item.weightedSeverityTotal / item.totalCases : 1;
    const severityScore = Math.round((averageRiskWeight / 4) * 100);

    return {
      area: item.area,
      totalCases: item.totalCases,
      criticalCases: item.riskBreakdown.CRITICAL,
      highCases: item.riskBreakdown.HIGH,
      mediumCases: item.riskBreakdown.MEDIUM,
      lowCases: item.riskBreakdown.LOW,
      averageRiskWeight: Number(averageRiskWeight.toFixed(2)),
      severityScore,
      riskBreakdown: item.riskBreakdown,
    };
  });

  areas.sort((a, b) => b.severityScore - a.severityScore || b.totalCases - a.totalCases);

  const summary = {
    totalAreas: areas.length,
    totalCases: areas.reduce((sum, area) => sum + area.totalCases, 0),
    totalCritical: areas.reduce((sum, area) => sum + area.criticalCases, 0),
    averageSeverity:
      areas.length > 0
        ? Number((areas.reduce((sum, area) => sum + area.severityScore, 0) / areas.length).toFixed(1))
        : 0,
  };

  res.status(200).json({
    success: true,
    summary,
    data: areas,
  });
});
