import { ChallengeEngine, createDemoModes } from "@cosmic/runtime";

export type StubPedagogyArgs = {
  slug: string;
  title: string;
  station: {
    steps: string[];
    synthesisPromptHtml: string;
  };
  challenges: Array<
    | {
        prompt: string;
        type: "boolean";
        answer: boolean;
        hints?: string[];
        explanation?: string;
      }
    | {
        prompt: string;
        type: "angle";
        answer: number;
        tolerance?: number;
        hints?: string[];
        explanation?: string;
      }
  >;
};

type ChallengeCheckRequestedEvent = CustomEvent<{
  challenge?: { type?: string; question?: string; prompt?: string };
}>;

function getControlsBody(): HTMLElement {
  const controlsBody =
    document.querySelector<HTMLElement>(".cp-demo__controls .cp-panel-body");
  if (!controlsBody) throw new Error("Missing controls container for pedagogy.");
  return controlsBody;
}

function getButton(id: string): HTMLButtonElement {
  const el = document.querySelector<HTMLButtonElement>(`#${id}`);
  if (!el) throw new Error(`Missing required button: #${id}`);
  return el;
}

function promptBoolean(promptText: string): boolean | null {
  const raw = window.prompt(`${promptText}\n\nEnter: T/F`);
  if (raw === null) return null;
  const norm = raw.trim().toLowerCase();
  if (["t", "true", "y", "yes", "1"].includes(norm)) return true;
  if (["f", "false", "n", "no", "0"].includes(norm)) return false;
  return null;
}

function promptNumber(promptText: string): number | null {
  const raw = window.prompt(`${promptText}\n\nEnter a number:`);
  if (raw === null) return null;
  const value = Number(raw.trim());
  return Number.isFinite(value) ? value : null;
}

export function initStubPedagogyModes(args: StubPedagogyArgs): void {
  const stationModeButton = getButton("stationMode");
  const challengeModeButton = getButton("challengeMode");
  const helpButton = getButton("help");

  const demoModes = createDemoModes({
    help: {
      title: "Help / Shortcuts",
      subtitle: "Keyboard shortcuts work when focus is not in an input field.",
      sections: [
        {
          heading: "Shortcuts",
          type: "shortcuts",
          items: [
            { key: "?", action: "Toggle help" },
            { key: "g", action: "Toggle station mode" }
          ]
        },
        {
          heading: "Status",
          type: "bullets",
          items: [
            "This demo’s simulation is still being migrated.",
            "Station Mode and Challenge Mode are available for note-taking and concept checks."
          ]
        }
      ]
    },
    station: {
      title: `Station Mode: ${args.title}`,
      subtitle: "Add notes as you work, then copy CSV or print.",
      steps: args.station.steps,
      columns: [{ key: "note", label: "Observation / Claim" }],
      getSnapshotRow() {
        const note = window.prompt("Enter a short observation/claim to add as a row:");
        if (!note) return null;
        const trimmed = note.trim();
        if (trimmed.length === 0) return null;
        return { note: trimmed };
      },
      snapshotLabel: "Add row (note)",
      synthesisPrompt: args.station.synthesisPromptHtml
    }
  });

  demoModes.bindButtons({
    helpButton,
    stationButton: stationModeButton
  });

  const controlsBody = getControlsBody();
  const challengeEngine = new ChallengeEngine(args.challenges as any, {
    container: controlsBody,
    showUI: true
  });

  controlsBody.addEventListener("challengeCheckRequested", (event) => {
    const detail = (event as ChallengeCheckRequestedEvent).detail;
    const challenge: any = detail?.challenge;
    if (!challenge) return;

    const promptText = String(challenge.question ?? challenge.prompt ?? "Enter your answer.");

    if (challenge.type === "boolean") {
      const value = promptBoolean(promptText);
      if (value === null) {
        challengeEngine.check(undefined);
        return;
      }
      challengeEngine.check(value);
      return;
    }

    if (challenge.type === "angle" || challenge.type === "phase") {
      const value = promptNumber(promptText);
      if (value === null) {
        challengeEngine.check(undefined);
        return;
      }
      challengeEngine.check(value);
      return;
    }

    const raw = window.prompt(promptText);
    if (raw === null) {
      challengeEngine.check(undefined);
      return;
    }
    challengeEngine.check(raw);
  });

  challengeModeButton.addEventListener("click", () => {
    if (challengeEngine.isActive()) {
      challengeEngine.stop();
    } else {
      challengeEngine.start();
    }
  });
}

