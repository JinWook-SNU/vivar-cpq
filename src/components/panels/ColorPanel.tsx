"use client";

import ProductColorPanel from "@/components/panels/ProductColorPanel";

export default function ColorPanel() {
  return (
    <div className="flex flex-col gap-4" data-testid="panel-color-group">
      <ProductColorPanel />
    </div>
  );
}

export { ProductColorPanel };
