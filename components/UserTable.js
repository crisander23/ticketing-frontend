'use client';
export default function UserTable({ rows = [] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--line)] bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
          <tr>
            <th className="px-4 py-3 text-left">ID</th>
            <th className="px-4 py-3 text-left">Name</th>
            <th className="px-4 py-3 text-left">Email</th>
            <th className="px-4 py-3 text-left">Position</th>
            <th className="px-4 py-3 text-left">Type</th>
            <th className="px-4 py-3 text-left">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--line)]">
          {rows.length === 0 && (
            <tr><td className="px-4 py-4 text-center text-gray-500" colSpan={6}>No users.</td></tr>
          )}
          {rows.map((u) => (
            <tr key={u.user_id}>
              <td className="px-4 py-3">{u.user_id}</td>
              <td className="px-4 py-3">{(u.first_name || '') + ' ' + (u.last_name || '')}</td>
              <td className="px-4 py-3">{u.email}</td>
              <td className="px-4 py-3">{u.position || 'N/A'}</td>
              <td className="px-4 py-3">{u.user_type}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                  u.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>{u.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
