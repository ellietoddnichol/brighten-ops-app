import type { Employee } from '@brighten/shared';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';

async function getEmployees(): Promise<Employee[]> {
  try {
    const res = await fetch(`${API_URL}/api/employees`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json() as { data: Employee[] };
    return json.data ?? [];
  } catch {
    return [];
  }
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  DISPATCHER: 'Dispatcher',
  FIELD_TECH: 'Field Tech',
};

export default async function EmployeesPage() {
  const employees = await getEmployees();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Employees</h1>
        <span className="text-sm text-gray-500">{employees.length} total</span>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {employees.length === 0 ? (
          <p className="px-4 py-8 text-center text-gray-400 text-sm">No employees found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">ID</th>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Role</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-gray-500">{emp.employeeNumber}</td>
                  <td className="px-4 py-2 font-medium">{emp.firstName} {emp.lastName}</td>
                  <td className="px-4 py-2 text-gray-500">{emp.email}</td>
                  <td className="px-4 py-2">{ROLE_LABELS[emp.role] ?? emp.role}</td>
                  <td className="px-4 py-2">
                    {emp.active ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Active</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">Inactive</span>
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
