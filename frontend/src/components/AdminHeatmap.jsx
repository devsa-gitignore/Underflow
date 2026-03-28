import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { AlertCircle, TrendingUp, Users, AlertTriangle } from 'lucide-react';

const AdminHeatmap = () => {
  const [heatmapData, setHeatmapData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [selectedVillage, setSelectedVillage] = useState(null);
  const [villageDetails, setVillageDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mapContainer = useRef(null);
  const map = useRef(null);
  const heatmapLayer = useRef(null);

  // Fetch heatmap data
  useEffect(() => {
    const fetchHeatmapData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/admin/heatmap-data');
        setHeatmapData(response.data.data);
        setSummary(response.data.summary);
        setError(null);
      } catch (err) {
        setError('Failed to load heatmap data: ' + err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmapData();
  }, []);

  // Initialize map with Leaflet (if available, otherwise use canvas heatmap)
  useEffect(() => {
    if (!heatmapData || !mapContainer.current) return;

    // For now, create a simple canvas-based heatmap visualization
    const canvas = document.getElementById('heatmap-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#f3f4f6';
    ctx.fillRect(0, 0, width, height);

    // Draw map bounds (simplified India map area)
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 50, width - 100, height - 100);

    // Draw villages as colored circles based on severity
    heatmapData.forEach((village) => {
      // Map coordinates to canvas
      const x = 50 + ((village.coordinates.lng - 73.5) / 1.5) * (width - 100);
      const y = 50 + (18 - village.coordinates.lat) * (height - 100) / 2;

      // Color based on severity
      let color;
      if (village.severityScore < 0.3) {
        color = '#22c55e'; // GREEN - Low
      } else if (village.severityScore < 0.6) {
        color = '#eab308'; // YELLOW - Moderate
      } else {
        color = '#ef4444'; // RED - High
      }

      // Draw circle
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 15 + village.totalCases, 0, Math.PI * 2);
      ctx.fill();

      // Draw border
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text label
      ctx.fillStyle = '#000';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(village.village.substring(0, 4), x, y - 8);
      ctx.fillText(`${village.totalCases}`, x, y + 8);
    });

    // Draw legend
    const legendX = width - 180;
    const legendY = height - 120;
    ctx.fillStyle = '#fff';
    ctx.fillRect(legendX - 10, legendY - 10, 170, 110);
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.strokeRect(legendX - 10, legendY - 10, 170, 110);

    ctx.fillStyle = '#000';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Severity:', legendX, legendY + 5);

    const legendItems = [
      { color: '#22c55e', label: 'Low Risk', y: legendY + 25 },
      { color: '#eab308', label: 'Moderate', y: legendY + 45 },
      { color: '#ef4444', label: 'High Risk', y: legendY + 65 }
    ];

    legendItems.forEach((item) => {
      ctx.fillStyle = item.color;
      ctx.fillRect(legendX, item.y - 8, 12, 12);
      ctx.fillStyle = '#000';
      ctx.font = '11px Arial';
      ctx.fillText(item.label, legendX + 18, item.y - 2);
    });
  }, [heatmapData]);

  // Fetch village details when clicked
  const handleVillageClick = async (village) => {
    try {
      setSelectedVillage(village.village);
      const response = await axios.get(
        `http://localhost:5000/admin/village-details/${village.village}`
      );
      setVillageDetails(response.data);
    } catch (err) {
      setError('Failed to load village details: ' + err.message);
    }
  };

  // Get severity label
  const getSeverityLabel = (score) => {
    if (score < 0.3) return 'LOW';
    if (score < 0.6) return 'MODERATE';
    return 'HIGH';
  };

  // Get severity color
  const getSeverityColor = (score) => {
    if (score < 0.3) return 'text-green-600';
    if (score < 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading heatmap data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
        <div className="flex">
          <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
          <div>
            <p className="font-semibold text-red-800">Error</p>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Case Severity Heatmap</h1>
          <p className="text-gray-600">Real-time geographic distribution of patient risk levels</p>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Villages</p>
                  <p className="text-3xl font-bold text-gray-900">{summary.totalVillages}</p>
                </div>
                <Users className="h-10 w-10 text-blue-500 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Cases</p>
                  <p className="text-3xl font-bold text-gray-900">{summary.totalCases}</p>
                </div>
                <TrendingUp className="h-10 w-10 text-green-500 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">High-Risk Cases</p>
                  <p className="text-3xl font-bold text-red-600">{summary.totalHighRisk}</p>
                </div>
                <AlertTriangle className="h-10 w-10 text-red-500 opacity-20" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Avg. Severity</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {(summary.averageSeverity * 100).toFixed(0)}%
                  </p>
                </div>
                <AlertCircle className="h-10 w-10 text-yellow-500 opacity-20" />
              </div>
            </div>
          </div>
        )}

        {/* Heatmap Canvas */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Geographic Heatmap</h2>
          <canvas
            id="heatmap-canvas"
            className="w-full border border-gray-200 rounded"
            width="1000"
            height="600"
          />
        </div>

        {/* Village Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Village List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Village Breakdown</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {heatmapData?.map((village) => (
                  <div
                    key={village.village}
                    onClick={() => handleVillageClick(village)}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{village.village}</h3>
                        <p className="text-sm text-gray-600">
                          {village.totalCases} cases | {village.highRiskCount} high-risk
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${getSeverityColor(village.severityScore)}`}>
                          {getSeverityLabel(village.severityScore)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {village.highRiskPercentage.toFixed(1)}% high-risk
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Village Details Panel */}
          <div className="bg-white rounded-lg shadow p-6 h-fit">
            {villageDetails ? (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {villageDetails.village} Details
                </h2>

                <div className="space-y-3 mb-6">
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-xs text-gray-600">Total Cases</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {villageDetails.summary.total}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-red-50 p-3 rounded">
                      <p className="text-xs text-gray-600">High Risk</p>
                      <p className="text-xl font-bold text-red-600">
                        {villageDetails.summary.highRisk}
                      </p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded">
                      <p className="text-xs text-gray-600">Moderate</p>
                      <p className="text-xl font-bold text-yellow-600">
                        {villageDetails.summary.moderateRisk}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Recent Cases</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {villageDetails.patients?.slice(0, 10).map((patient, idx) => (
                      <div key={idx} className="text-sm border-l-2 border-gray-200 pl-3 py-2">
                        <p className="font-medium text-gray-900">{patient.name}</p>
                        <p className="text-xs text-gray-600">Age: {patient.age}</p>
                        <span
                          className={`inline-block text-xs font-semibold px-2 py-1 rounded mt-1 ${
                            patient.currentRiskLevel === 'HIGH'
                              ? 'bg-red-100 text-red-700'
                              : patient.currentRiskLevel === 'MODERATE'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {patient.currentRiskLevel}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">Select a village to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHeatmap;
