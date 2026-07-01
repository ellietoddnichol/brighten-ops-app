import type { Job } from '@brighten/shared';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';

async function getJobs(): Promise<Job[]> {
  try {
    const res = await fetch(`${API_URL}/api/jobs`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json() as { data: Job[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

function StatusBadge({ status }: { status: string }) {
  const colours: Record<string, string> = {
    SCHEDULED: 'bg-blue-100 text-blue-800',
    IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
    COMPLETE: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colours[status] ?? 'bg-gray-100'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

export default async function JobsPage() {
  const jobs = await getJobs();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Jobs</h1>
        <span className="text-sm text-gray-500">{jobs.length} total</span>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {jobs.length === 0 ? (
          <p className="px-4 py-8 text-center text-gray-400 text-sm">No jobs found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Job #</th>
                <th className="px-4 py-2 font-medium">Customer</th>
                <th className="px-4 py-2 font-medium">Address</th>
                <th className="px-4 py-2 font-medium">System</th>
                <th className="px-4 py-2 font-medium">Roof</th>
                <th className="px-4 py-2 font-medium">Budgeted h</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono font-medium">{job.jobNumber}</td>
                  <td className="px-4 py-2">{job.customerName}</td>
                  <td className="px-4 py-2 text-gray-500">{job.city}, {job.state}</td>
                  <td className="px-4 py-2">{job.systemSizeKw} kW / {job.panelCount} panels</td>
                  <td className="px-4 py-2 capitalize">{job.roofType}</td>
                  <td className="px-4 py-2">{job.budgetedHours ?? '—'}</td>
                  <td className="px-4 py-2"><StatusBadge status={job.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
