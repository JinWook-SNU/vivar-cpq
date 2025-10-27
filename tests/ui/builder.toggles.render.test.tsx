import { render, screen } from "@testing-library/react";
import FeatureToggles from "@/components/cpq/FeatureToggles";

test("renders all toggles", () => {
  render(<FeatureToggles />);
  [
    "Dimension",
    "AR (placeholder)",
    "Fullscreen",
    "Screenshot",
    "Color",
    "Option",
    "Presets",
    "AI Suggestions",
    "AI Catalog",
  ].forEach((label) => expect(screen.getByText(label)).toBeInTheDocument());
});
