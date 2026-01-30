import { initStubDemo } from "../../shared/stub-demo";
import { initStubPedagogyModes } from "../../shared/stub-modes";

initStubDemo({
  slug: "eclipse-geometry",
  title: "Eclipse Geometry: Shadows in Space",
  oneLiner: "Investigate alignment, shadow cones, and why eclipses aren’t monthly."
});

initStubPedagogyModes({
  slug: "eclipse-geometry",
  title: "Eclipse Geometry: Shadows in Space",
  station: {
    steps: [
      "This simulation is still migrating. Use the station card page for the full activity.",
      "Use the note rows to record: (1) a claim about why eclipses are rare, (2) a supporting reason.",
      "When the simulation lands, add note rows for different tilts/alignment conditions you test."
    ],
    synthesisPromptHtml:
      "<p><strong>Synthesis:</strong> Why doesn’t a solar eclipse happen at every New Moon?</p>"
  },
  challenges: [
    {
      type: "boolean",
      prompt: "If the Moon’s orbit had zero tilt relative to Earth’s orbital plane, we would have eclipses at every New Moon and Full Moon.",
      answer: true,
      hints: ["Without tilt, the Moon would always cross the ecliptic line at New/Full."]
    },
    {
      type: "boolean",
      prompt: "Moon phases are caused by Earth’s shadow falling on the Moon.",
      answer: false,
      hints: ["Earth’s shadow matters only during eclipses; phases are mostly illumination geometry."]
    },
    {
      type: "angle",
      prompt: "About how many degrees is the Moon’s orbital inclination relative to the ecliptic?",
      answer: 5.1,
      tolerance: 2
    }
  ]
});
