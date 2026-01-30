import { initStubDemo } from "../../shared/stub-demo";
import { initStubPedagogyModes } from "../../shared/stub-modes";

initStubDemo({
  slug: "angular-size",
  title: "Angular Size: The Sky’s Ruler",
  oneLiner: "Compare apparent sizes and see why distance matters."
});

initStubPedagogyModes({
  slug: "angular-size",
  title: "Angular Size: The Sky’s Ruler",
  station: {
    steps: [
      "This simulation is still migrating. Use the station card page for the full activity.",
      "Use the note rows to capture predictions, observations, and claims as you discuss.",
      "When the simulation lands, add a row each time you change (size, distance) to compare angular size."
    ],
    synthesisPromptHtml:
      "<p><strong>Synthesis:</strong> In one sentence, explain why an object can look smaller even when it is physically larger.</p>"
  },
  challenges: [
    {
      type: "boolean",
      prompt: "If an object’s distance doubles but its physical size stays the same, its angular size is cut in half.",
      answer: true,
      hints: ["Use the small-angle relationship: θ ≈ D / d."]
    },
    {
      type: "boolean",
      prompt: "If two objects have the same angular size and one is farther away, the farther one must be physically larger.",
      answer: true,
      hints: ["Same θ but larger d implies larger D."]
    },
    {
      type: "boolean",
      prompt: "For small angles, angular size depends mostly on the ratio D/d, not on D or d separately.",
      answer: true
    }
  ]
});
