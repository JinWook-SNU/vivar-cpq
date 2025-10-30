import { CATALOG_DATA } from "@/data/catalog";

export default function ModulesPage() {
  return (
    <div className="space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-900">Modules</h1>
        <p className="text-sm text-neutral-600">
          Lightweight admin overview of configurable modules powering the sales demo. The data is
          mocked for milestone tracking purposes only.
        </p>
      </header>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-neutral-200 text-sm">
          <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3">Module</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Owner</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {CATALOG_DATA.modules.map((module) => (
              <tr key={module.id} className="text-neutral-700">
                <td className="px-4 py-3">
                  <div className="font-medium text-neutral-900">{module.name}</div>
                  <div className="text-xs uppercase tracking-wide text-neutral-500">{module.id}</div>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs uppercase text-neutral-600">
                    {module.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <a href={`mailto:${module.owner}`} className="text-blue-600 hover:underline">
                    {module.owner}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
