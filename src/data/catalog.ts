import { PRODUCT_SWATCHES } from "@/components/panels/colorPalettes";

export const CATALOG_DATA = {
  products: [
    {
      id: "configurator-pro",
      name: "Configurator Pro",
      description: "Flagship sales demo with presets, AI stubs, and export tooling.",
      modules: ["viewer", "pricing", "export"],
    },
    {
      id: "configurator-lite",
      name: "Configurator Lite",
      description: "Lean package for quick color + option toggles.",
      modules: ["viewer", "options"],
    },
  ],
  modules: [
    {
      id: "viewer",
      name: "3D Viewer",
      status: "ready",
      owner: "immersive@vivar.dev",
    },
    {
      id: "pricing",
      name: "Pricing Engine",
      status: "beta",
      owner: "pricing@vivar.dev",
    },
    {
      id: "export",
      name: "Export & Reporting",
      status: "alpha",
      owner: "ops@vivar.dev",
    },
    {
      id: "options",
      name: "Color & Options",
      status: "ready",
      owner: "ux@vivar.dev",
    },
  ],
  colors: PRODUCT_SWATCHES,
  options: [
    { id: "spoiler", name: "Rear Spoiler", category: "aero" },
    { id: "roofRack", name: "Roof Rack", category: "utility" },
  ],
  presets: [
    { id: "minimal", name: "Minimal", color: "#f5f5f5" },
    { id: "sport", name: "Sport", color: "#ff6b6b" },
    { id: "adventure", name: "Adventure", color: "#1e90ff" },
  ],
};
