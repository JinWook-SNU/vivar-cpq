import { CATALOG_DATA } from "@/data/catalog";

export default function ProductsPage() {
  const moduleMap = new Map(
    CATALOG_DATA.modules.map((catalogModule) => [catalogModule.id, catalogModule])
  );

  return (
    <div className="space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-neutral-900">Demo Products</h1>
        <p className="text-sm text-neutral-600">
          Internal catalogue used to assemble sales-ready configurator experiences. Modules listed
          below reflect the current build target for each product.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {CATALOG_DATA.products.map((product) => (
          <article
            key={product.id}
            className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">{product.name}</h2>
                <p className="text-xs uppercase tracking-wide text-neutral-500">{product.id}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-neutral-600">{product.description}</p>
            <div className="mt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Modules
              </h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {product.modules.map((moduleId) => {
                  const catalogModule = moduleMap.get(moduleId);
                  return (
                    <li
                      key={moduleId}
                      className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs text-neutral-700"
                    >
                      <span className="font-semibold">{catalogModule?.name ?? moduleId}</span>
                      <span className="ml-2 text-[11px] uppercase text-neutral-500">
                        {catalogModule?.status ?? "tbd"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
