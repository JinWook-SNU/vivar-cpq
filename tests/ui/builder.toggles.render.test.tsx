import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import FeatureToggles from "@/components/cpq/FeatureToggles";

describe("FeatureToggles", () => {
  it("renders all toggles and persistence controls", () => {
    render(<FeatureToggles />);

    const labels = [
      "Dimension",
      "AR (placeholder)",
      "Fullscreen",
      "Screenshot",
      "Color",
      "Option",
      "Presets",
      "AI Suggestions",
      "AI Catalog",
    ];

    labels.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });

    expect(screen.getByTestId("save-blueprint")).toBeInTheDocument();
    expect(screen.getByTestId("load-blueprint")).toBeInTheDocument();
    expect(screen.getByTestId("saved-at")).toHaveTextContent("Not saved yet");
  });
});
