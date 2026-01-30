import { initStubDemo } from "../../shared/stub-demo";
import { initStubPedagogyModes } from "../../shared/stub-modes";

initStubDemo({
  slug: "seasons",
  title: "Seasons: Why Tilt Matters",
  oneLiner: "Test how tilt changes sunlight angle and day length across the year."
});

initStubPedagogyModes({
  slug: "seasons",
  title: "Seasons: Why Tilt Matters",
  station: {
    steps: [
      "This simulation is still migrating. Use the station card page for the full activity.",
      "Use the note rows to capture: (1) a prediction about seasons, (2) evidence, (3) a corrected explanation.",
      "When the simulation lands, add note rows at solstices/equinoxes and compare hemispheres."
    ],
    synthesisPromptHtml:
      "<p><strong>Synthesis:</strong> In one sentence, explain the main reason Earth has seasons.</p>"
  },
  challenges: [
    {
      type: "boolean",
      prompt: "Seasons are mainly caused by Earth being closer to the Sun in summer and farther in winter.",
      answer: false,
      hints: ["Earth–Sun distance changes are small; hemispheres have opposite seasons."]
    },
    {
      type: "boolean",
      prompt: "When it is summer in the Northern Hemisphere, it is winter in the Southern Hemisphere.",
      answer: true
    },
    {
      type: "angle",
      prompt: "About how many degrees is Earth’s axial tilt?",
      answer: 23.5,
      tolerance: 2
    }
  ]
});
