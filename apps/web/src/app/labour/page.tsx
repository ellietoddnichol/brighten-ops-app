import type { LabourEntry } from '@brighten/shared';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';

async function getLabourEntries(): Promise<LabourEntry[]> {
  try {
    const res = await fetch(`${API_URL}/api/labour`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json() as { data: LabourEntry[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

function fmt(date: Date | string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function LabourPage() {
  const entries = await getLabourEntries();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Labour Entries</h1>
        <span className="text-sm text-gray-500">{entries.length} entries</span>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {entries.length === 0 ? (
          <p className="px-4 py-8 text-center text-gray-400 text-sm">No labour entries found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Employee</th>
                <th className="px-4 py-2 font-medium">Job</th>
                <th className="px-4 py-2 font-medium">Clock In</th>
                <th className="px-4 py-2 font-medium">Clock Out</th>
                <th className="px-4 py-2 font-medium">Hours</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{entry.employeeId}</td>
                  <td className="px-4 py-2 font-mono text-gray-500">{entry.jobId}</td>
                  <td className="px-4 py-2">{fmt(entry.clockIn)}</td>
                  <td className="px-4 py-2">{fmt(entry.clockOut)}</td>
                  <td className="px-4 py-2">{entry.hoursWorked != null ? `${entry.hoursWorked} h` : '—'}</td>
                  <td className="px-4 py-2">
                    {entry.clockOut ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Complete</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">Open</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
