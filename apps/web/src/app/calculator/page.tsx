'use client';

import { useState } from 'react';
import type { CalculatorRun, RoofType } from '@brighten/shared';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';

const ROOF_TYPES: RoofType[] = ['composition', 'tile', 'metal', 'flat'];

interface FormState {
  systemSizeKw: string;
  panelCount: string;
  roofType: RoofType;
  hasBattery: boolean;
  hasEvCharger: boolean;
  hasMonitoring: boolean;
}

export default function CalculatorPage() {
  const [form, setForm] = useState<FormState>({
    systemSizeKw: '',
    panelCount: '',
    roofType: 'composition',
    hasBattery: false,
    hasEvCharger: false,
    hasMonitoring: false,
  });
  const [result, setResult] = useState<CalculatorRun | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/calculator/estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemSizeKw: parseFloat(form.systemSizeKw),
          panelCount: parseInt(form.panelCount, 10),
          roofType: form.roofType,
          hasBattery: form.hasBattery,
          hasEvCharger: form.hasEvCharger,
          hasMonitoring: form.hasMonitoring,
        }),
      });

      const json = await res.json() as { data?: CalculatorRun; error?: { message: string } };

      if (!res.ok) {
        setError(json.error?.message ?? 'Unknown error');
      } else {
        setResult(json.data ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Install Calculator</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">System Size (kW)</label>
            <input
              type="number"
              step="0.1"
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              value={form.systemSizeKw}
              onChange={(e) => setForm({ ...form, systemSizeKw: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Panel Count</label>
            <input
              type="number"
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              value={form.panelCount}
              onChange={(e) => setForm({ ...form, panelCount: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Roof Type</label>
          <select
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            value={form.roofType}
            onChange={(e) => setForm({ ...form, roofType: e.target.value as RoofType })}
          >
            {ROOF_TYPES.map((rt) => (
              <option key={rt} value={rt}>{rt.charAt(0).toUpperCase() + rt.slice(1)}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          {[
            { key: 'hasBattery', label: 'Battery Storage' },
            { key: 'hasEvCharger', label: 'EV Charger' },
            { key: 'hasMonitoring', label: 'Monitoring System' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-yellow-500"
                checked={form[key as keyof FormState] as boolean}
                onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
              />
              {label}
            </label>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-2 px-4 rounded-md text-sm transition-colors disabled:opacity-50"
        >
          {loading ? 'Calculating…' : 'Calculate Estimate'}
        </button>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>
        )}
      </form>

      {result && (
        <div className="mt-6 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="font-semibold mb-4">Estimate Results</h2>
          <dl className="space-y-3">
            {[
              { label: 'Estimated Labour Hours', value: `${result.estimatedLaborHours} h` },
              { label: 'Estimated Material Cost', value: `$${result.estimatedMaterialCost.toLocaleString()}` },
              { label: 'Estimated Labour Cost', value: `$${result.estimatedLaborCost.toLocaleString()}` },
              { label: 'Estimated Total Cost', value: `$${result.estimatedTotalCost.toLocaleString()}`, bold: true },
            ].map(({ label, value, bold }) => (
              <div key={label} className="flex justify-between text-sm">
                <dt className="text-gray-500">{label}</dt>
                <dd className={bold ? 'font-bold text-base' : 'font-medium'}>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
