import { injectStyleOnce } from "./domStyle";

export type ChallengeResult = {
  correct: boolean;
  close: boolean;
  message?: string;
};

export type Challenge =
  | {
      id?: string;
      question?: string;
      prompt?: string;
      type?: "custom";
      check: (state: unknown) => ChallengeResult;
      hints?: string[];
      hint?: string;
      explanation?: string;
      initialState?: unknown;
    }
  | {
      id?: string;
      question?: string;
      prompt?: string;
      type: "angle";
      answer: number;
      tolerance?: number;
      hints?: string[];
      hint?: string;
      explanation?: string;
      initialState?: unknown;
    }
  | {
      id?: string;
      question?: string;
      prompt?: string;
      type: "phase";
      answer: number;
      tolerance?: number;
      hints?: string[];
      hint?: string;
      explanation?: string;
      initialState?: unknown;
    }
  | {
      id?: string;
      question?: string;
      prompt?: string;
      type: "position";
      answer: { x: number; y: number } | [number, number];
      tolerance?: number;
      hints?: string[];
      hint?: string;
      explanation?: string;
      initialState?: unknown;
    }
  | {
      id?: string;
      question?: string;
      prompt?: string;
      type: "boolean";
      answer: boolean;
      hints?: string[];
      hint?: string;
      explanation?: string;
      initialState?: unknown;
    };

export type ChallengeStats = {
  correct: number;
  incorrect: number;
  skipped: number;
  hintsUsed: number;
  totalAttempts: number;
};

export type ChallengeOptions = {
  onCorrect?: (challenge: Required<Challenge> & { id: string }, userAnswer: unknown) => void;
  onIncorrect?: (
    challenge: Required<Challenge> & { id: string },
    userAnswer: unknown,
    result: ChallengeResult
  ) => void;
  onComplete?: (stats: ChallengeStats) => void;
  onProgress?: (current: number, total: number, challenge: Challenge | null) => void;
  onStop?: () => void;
  container?: HTMLElement;
  showUI?: boolean;
  getState?: () => unknown;
  setState?: (state: unknown) => void;
};

type InternalChallenge = Required<Challenge> & { id: string; tolerance: number; hints: string[] };

const DEFAULT_TOLERANCES: Record<string, number> = {
  angle: 15,
  phase: 0.1,
  position: 20,
  boolean: 0
};

function parseNumberAnswer(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseBooleanAnswer(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
    return null;
  }
  if (typeof value !== "string") return null;
  const norm = value.trim().toLowerCase();
  if (["t", "true", "y", "yes", "1"].includes(norm)) return true;
  if (["f", "false", "n", "no", "0"].includes(norm)) return false;
  return null;
}

const CHALLENGE_CSS = `
.cp-challenge-panel {
  background: color-mix(in srgb, var(--cp-bg1) 94%, transparent);
  border: 1px solid color-mix(in srgb, var(--cp-accent) 55%, var(--cp-border));
  border-radius: var(--cp-r-3);
  padding: var(--cp-space-4);
  margin-bottom: var(--cp-space-4);
  box-shadow: 0 0 24px color-mix(in srgb, var(--cp-accent) 18%, transparent);
}

.cp-challenge-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--cp-space-3);
  margin-bottom: var(--cp-space-3);
}

.cp-challenge-badge {
  background: var(--cp-accent);
  color: var(--cp-bg0);
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.cp-challenge-close {
  background: transparent;
  border: 1px solid var(--cp-border);
  color: var(--cp-muted);
  border-radius: 9999px;
  width: 44px;
  height: 44px;
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 1;
  display: grid;
  place-items: center;
}

.cp-challenge-close:hover {
  border-color: var(--cp-accent);
  color: var(--cp-text);
}

.cp-challenge-close:focus-visible,
.cp-challenge-btn:focus-visible {
  outline: 2px solid var(--cp-focus);
  outline-offset: 2px;
}

.cp-challenge-number {
  font-size: 0.9rem;
  color: var(--cp-muted);
  margin-bottom: var(--cp-space-2);
}

.cp-challenge-question {
  font-size: 1rem;
  color: var(--cp-text);
  margin-bottom: var(--cp-space-2);
}

.cp-challenge-hint {
  background: color-mix(in srgb, var(--cp-accent2) 10%, transparent);
  border-left: 3px solid var(--cp-accent2);
  padding: 0.75rem;
  border-radius: 10px;
  margin-bottom: var(--cp-space-3);
  font-size: 0.95rem;
  color: var(--cp-text);
}

.cp-challenge-feedback {
  padding: 0.75rem;
  border-radius: 10px;
  margin-bottom: var(--cp-space-3);
  font-size: 0.95rem;
}

.cp-challenge-feedback.correct {
  background: color-mix(in srgb, var(--cp-success) 12%, transparent);
  border-left: 3px solid var(--cp-success);
  color: color-mix(in srgb, var(--cp-success) 88%, var(--cp-text));
}

.cp-challenge-feedback.incorrect {
  background: color-mix(in srgb, var(--cp-danger) 12%, transparent);
  border-left: 3px solid var(--cp-danger);
  color: color-mix(in srgb, var(--cp-danger) 88%, var(--cp-text));
}

.cp-challenge-feedback.close {
  background: color-mix(in srgb, var(--cp-warning) 12%, transparent);
  border-left: 3px solid var(--cp-warning);
  color: color-mix(in srgb, var(--cp-warning) 92%, var(--cp-text));
}

.cp-challenge-actions,
.cp-challenge-nav {
  display: flex;
  gap: var(--cp-space-2);
  align-items: center;
  flex-wrap: wrap;
}

.cp-challenge-nav {
  margin-top: var(--cp-space-3);
  padding-top: var(--cp-space-3);
  border-top: 1px solid var(--cp-border);
}

.cp-challenge-progress {
  flex: 1;
  text-align: center;
  font-size: 0.9rem;
  color: var(--cp-muted);
}

.cp-challenge-btn {
  padding: 0.5rem 0.9rem;
  border-radius: 10px;
  border: 1px solid var(--cp-border);
  background: color-mix(in srgb, var(--cp-bg2) 78%, transparent);
  color: var(--cp-text);
  cursor: pointer;
  font-size: 0.95rem;
}

.cp-challenge-btn:hover:not(:disabled) {
  border-color: var(--cp-accent);
}

.cp-challenge-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.cp-challenge-btn.primary {
  background: var(--cp-accent);
  color: var(--cp-bg0);
  border-color: var(--cp-accent);
  font-weight: 700;
}

.cp-challenge-complete {
  text-align: center;
  padding: var(--cp-space-4);
}

.cp-challenge-complete h3 {
  color: var(--cp-success);
  margin-bottom: var(--cp-space-3);
}

.cp-challenge-complete .stats {
  color: var(--cp-muted);
  font-size: 0.95rem;
}
`;

function ensureStyles(): void {
  injectStyleOnce({ id: "cp-runtime-challenge-engine", cssText: CHALLENGE_CSS });
}

function normalizeChallenge(raw: Challenge, i: number): InternalChallenge {
  const id = raw.id || `challenge-${i + 1}`;
  const question = (raw as any).question ?? (raw as any).prompt ?? "";

  const hints: string[] =
    (raw as any).hints ??
    (typeof (raw as any).hint === "string" ? [(raw as any).hint] : []);

  const type = (raw as any).type ?? (typeof (raw as any).check === "function" ? "custom" : undefined);

  const tolerance = (raw as any).tolerance ?? DEFAULT_TOLERANCES[type ?? ""] ?? 0;

  return {
    ...(raw as any),
    id,
    question,
    type,
    hints,
    tolerance,
    answer: (raw as any).answer,
    explanation: (raw as any).explanation ?? "",
    initialState: (raw as any).initialState
  };
}

export class ChallengeEngine {
  static create(config: {
    challenges: Challenge[];
    getState?: () => unknown;
    setState?: (state: unknown) => void;
    container?: HTMLElement;
  }): ChallengeEngine {
    return new ChallengeEngine(config.challenges, {
      container: config.container,
      getState: config.getState,
      setState: config.setState,
      showUI: true
    });
  }

  private challenges: InternalChallenge[];
  private options: ChallengeOptions;
  private currentIndex: number;
  private isActiveFlag: boolean;
  private hintsUsed: number;
  private attempts: number;
  private stats: ChallengeStats;
  private ui: HTMLElement | null;
  private previousActiveEl: HTMLElement | null;

  constructor(challenges: Challenge[], options: ChallengeOptions = {}) {
    if (!Array.isArray(challenges) || challenges.length === 0) {
      throw new Error("ChallengeEngine requires a non-empty array of challenges");
    }

    this.challenges = challenges.map(normalizeChallenge);
    this.options = { showUI: true, ...options };
    this.currentIndex = -1;
    this.isActiveFlag = false;
    this.hintsUsed = 0;
    this.attempts = 0;
    this.stats = { correct: 0, incorrect: 0, skipped: 0, hintsUsed: 0, totalAttempts: 0 };
    this.ui = null;
    this.previousActiveEl = null;

    this.start = this.start.bind(this);
    this.check = this.check.bind(this);
    this.skip = this.skip.bind(this);
    this.getHint = this.getHint.bind(this);
    this.reset = this.reset.bind(this);
    this.stop = this.stop.bind(this);
  }

  private restoreFocus(): void {
    if (this.previousActiveEl && document.contains(this.previousActiveEl)) {
      this.previousActiveEl.focus();
    }
    this.previousActiveEl = null;
  }

  private fireStop(): void {
    this.options.onStop?.();
  }

  start(): Challenge | null {
    this.isActiveFlag = true;
    if (this.currentIndex < 0) this.currentIndex = 0;

    if (this.options.showUI && this.options.container && !this.ui) {
      this.createUi();
    }

    this.hintsUsed = 0;
    this.attempts = 0;

    const challenge = this.getCurrentChallenge();
    if (challenge?.initialState !== undefined && this.options.setState) {
      this.options.setState(challenge.initialState);
    }

    if (this.ui) {
      this.previousActiveEl = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      this.ui.style.display = "block";
      this.updateUi();
      const closeBtn = this.ui.querySelector<HTMLButtonElement>(".cp-challenge-close");
      if (closeBtn) closeBtn.focus();
      else this.ui.focus();
    }

    this.fireProgress();
    return challenge;
  }

  check(userAnswer: unknown): ChallengeResult {
    if (!this.isActiveFlag || this.currentIndex < 0) {
      return { correct: false, close: false, message: "No active challenge" };
    }

    const challenge = this.getCurrentChallenge();
    if (!challenge) return { correct: false, close: false, message: "No active challenge" };

    this.attempts += 1;
    this.stats.totalAttempts += 1;

    const result = this.evaluateAnswer(challenge, userAnswer);

    if (result.correct) {
      this.stats.correct += 1;
      this.options.onCorrect?.(challenge, userAnswer);
      if (this.ui) this.showFeedback("correct", result.message || challenge.explanation || "Correct!");

      if (this.currentIndex < this.challenges.length - 1) {
        window.setTimeout(() => this.nextChallenge(), 1500);
      } else {
        window.setTimeout(() => this.complete(), 1500);
      }
    } else {
      this.stats.incorrect += 1;
      this.options.onIncorrect?.(challenge, userAnswer, result);
      if (this.ui) this.showFeedback(result.close ? "close" : "incorrect", result.message || "Not quite. Try again.");
    }

    return result;
  }

  skip(): Challenge | null {
    if (!this.isActiveFlag || this.currentIndex < 0) return null;
    this.stats.skipped += 1;
    if (this.currentIndex < this.challenges.length - 1) return this.nextChallenge();
    this.complete();
    return null;
  }

  getHint(): string | null {
    if (!this.isActiveFlag || this.currentIndex < 0) return null;
    const challenge = this.getCurrentChallenge();
    if (!challenge) return null;
    if (this.hintsUsed >= challenge.hints.length) return null;

    const hint = challenge.hints[this.hintsUsed];
    this.hintsUsed += 1;
    this.stats.hintsUsed += 1;
    if (this.ui) this.showHint(hint);
    return hint;
  }

  getCurrentChallenge(): InternalChallenge | null {
    if (this.currentIndex < 0 || this.currentIndex >= this.challenges.length) return null;
    return this.challenges[this.currentIndex];
  }

  getProgress(): { current: number; total: number; percent: number; stats: ChallengeStats } {
    return {
      current: this.currentIndex + 1,
      total: this.challenges.length,
      percent: Math.round(((this.currentIndex + 1) / this.challenges.length) * 100),
      stats: { ...this.stats }
    };
  }

  reset(): void {
    this.currentIndex = -1;
    this.isActiveFlag = false;
    this.hintsUsed = 0;
    this.attempts = 0;
    this.stats = { correct: 0, incorrect: 0, skipped: 0, hintsUsed: 0, totalAttempts: 0 };

    if (this.ui) {
      this.ui.style.display = "none";
      this.clearFeedback();
      this.clearHint();
      this.ui.remove();
      this.ui = null;
    }

    this.restoreFocus();
    this.fireStop();
  }

  stop(): void {
    this.isActiveFlag = false;
    if (this.ui) this.ui.style.display = "none";
    this.restoreFocus();
    this.fireStop();
  }

  isRunning(): boolean {
    return this.isActiveFlag;
  }

  isActive(): boolean {
    return this.isActiveFlag;
  }

  private evaluateAnswer(challenge: InternalChallenge, userAnswer: unknown): ChallengeResult {
    const type = (challenge as any).type;

    if (type === "custom" && typeof (challenge as any).check === "function") {
      const state =
        userAnswer !== undefined
          ? userAnswer
          : this.options.getState
            ? this.options.getState()
            : {};
      return (challenge as any).check(state);
    }

    if (type === "angle") {
      const user = parseNumberAnswer(userAnswer);
      if (user === null) {
        return { correct: false, close: false, message: "Enter a number to check your answer." };
      }
      return this.checkAngle(user, (challenge as any).answer as number, challenge.tolerance);
    }

    if (type === "phase") {
      const user = parseNumberAnswer(userAnswer);
      if (user === null) {
        return { correct: false, close: false, message: "Enter a number to check your answer." };
      }
      return this.checkPhase(user, (challenge as any).answer as number, challenge.tolerance);
    }

    if (type === "position") {
      return this.checkPosition(userAnswer as any, (challenge as any).answer as any, challenge.tolerance);
    }

    if (type === "boolean") {
      const user = parseBooleanAnswer(userAnswer);
      if (user === null) {
        return { correct: false, close: false, message: "Enter true/false to check your answer." };
      }
      return this.checkBoolean(user, Boolean((challenge as any).answer));
    }

    const ok = userAnswer === (challenge as any).answer;
    return { correct: ok, close: false, message: ok ? "Correct!" : "Incorrect." };
  }

  private checkAngle(userAngle: number, correctAngle: number, tolerance: number): ChallengeResult {
    const normalizeAngle = (a: number) => ((a % 360) + 360) % 360;
    const user = normalizeAngle(userAngle);
    const correct = normalizeAngle(correctAngle);

    let diff = Math.abs(user - correct);
    if (diff > 180) diff = 360 - diff;

    const isCorrect = diff <= tolerance;
    const isClose = diff <= tolerance * 2;

    return {
      correct: isCorrect,
      close: !isCorrect && isClose,
      message: isCorrect ? `Correct! Angle: ${user.toFixed(0)}°` : isClose ? `Close! You're ${diff.toFixed(0)}° off.` : `Off by ${diff.toFixed(0)}°. Try again.`
    };
  }

  private checkPhase(userPhase: number, correctPhase: number, tolerance: number): ChallengeResult {
    const normalizePhase = (p: number) => ((p % 1) + 1) % 1;
    const user = normalizePhase(userPhase);
    const correct = normalizePhase(correctPhase);

    let diff = Math.abs(user - correct);
    if (diff > 0.5) diff = 1 - diff;

    const isCorrect = diff <= tolerance;
    const isClose = diff <= tolerance * 2;

    return {
      correct: isCorrect,
      close: !isCorrect && isClose,
      message: isCorrect ? "Correct phase!" : isClose ? `Close! Phase is ${(diff * 100).toFixed(0)}% off.` : "Try a different phase position."
    };
  }

  private checkPosition(
    userPos: { x: number; y: number } | [number, number],
    correctPos: { x: number; y: number } | [number, number],
    tolerance: number
  ): ChallengeResult {
    const getCoords = (pos: any) => (Array.isArray(pos) ? { x: pos[0], y: pos[1] } : { x: pos?.x ?? 0, y: pos?.y ?? 0 });
    const user = getCoords(userPos);
    const correct = getCoords(correctPos);
    const dx = user.x - correct.x;
    const dy = user.y - correct.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const isCorrect = distance <= tolerance;
    const isClose = distance <= tolerance * 2;

    return {
      correct: isCorrect,
      close: !isCorrect && isClose,
      message: isCorrect ? "Correct position!" : isClose ? `Close! ${distance.toFixed(0)} units away.` : `Position is ${distance.toFixed(0)} units off.`
    };
  }

  private checkBoolean(user: boolean, correct: boolean): ChallengeResult {
    return { correct: user === correct, close: false, message: user === correct ? "Correct!" : "Not quite." };
  }

  private nextChallenge(): InternalChallenge | null {
    this.currentIndex += 1;
    this.hintsUsed = 0;
    this.attempts = 0;

    const challenge = this.getCurrentChallenge();
    if (challenge?.initialState !== undefined && this.options.setState) {
      this.options.setState(challenge.initialState);
    }

    if (this.ui) {
      this.updateUi();
      this.clearFeedback();
      this.clearHint();
    }

    this.fireProgress();
    return challenge;
  }

  private goToPrevious(): InternalChallenge | null {
    if (this.currentIndex <= 0) return this.getCurrentChallenge();
    this.currentIndex -= 1;
    this.hintsUsed = 0;
    this.attempts = 0;
    if (this.ui) {
      this.updateUi();
      this.clearFeedback();
      this.clearHint();
    }
    this.fireProgress();
    return this.getCurrentChallenge();
  }

  private goToNext(): InternalChallenge | null {
    if (this.currentIndex >= this.challenges.length - 1) {
      this.complete();
      return null;
    }
    return this.nextChallenge();
  }

  private complete(): void {
    this.isActiveFlag = false;
    const finalStats = this.getProgress().stats;
    this.options.onComplete?.(finalStats);
    if (this.ui) this.showCompletion(finalStats);
  }

  private fireProgress(): void {
    this.options.onProgress?.(this.currentIndex + 1, this.challenges.length, this.getCurrentChallenge());
  }

  private createUi(): void {
    ensureStyles();
    const container = this.options.container;
    if (!container) return;

    const wrapper = document.createElement("div");
    wrapper.className = "cp-challenge-panel";
    wrapper.setAttribute("role", "dialog");
    wrapper.setAttribute("aria-label", "Challenge Mode");
    wrapper.setAttribute("aria-modal", "true");
    wrapper.tabIndex = -1;
    wrapper.innerHTML = `
      <div class="cp-challenge-header">
        <span class="cp-challenge-badge">Challenge Mode</span>
        <button class="cp-challenge-close" type="button" aria-label="Exit challenge mode">&times;</button>
      </div>
      <div class="cp-challenge-content">
        <div class="cp-challenge-number"></div>
        <div class="cp-challenge-question"></div>
        <div class="cp-challenge-hint" style="display: none;"></div>
        <div class="cp-challenge-feedback" style="display: none;"></div>
      </div>
      <div class="cp-challenge-actions">
        <button class="cp-challenge-btn hint-btn" type="button">Show Hint</button>
        <button class="cp-challenge-btn skip-btn" type="button">Skip</button>
        <button class="cp-challenge-btn check-btn primary" type="button">Check Answer</button>
      </div>
      <div class="cp-challenge-nav">
        <button class="cp-challenge-btn prev-btn" type="button" disabled>&larr; Previous</button>
        <span class="cp-challenge-progress"></span>
        <button class="cp-challenge-btn next-btn" type="button">Next &rarr;</button>
      </div>
    `;

    wrapper.querySelector(".cp-challenge-close")?.addEventListener("click", () => this.stop());
    wrapper.querySelector(".hint-btn")?.addEventListener("click", () => this.getHint());
    wrapper.querySelector(".skip-btn")?.addEventListener("click", () => this.skip());
    wrapper.querySelector(".prev-btn")?.addEventListener("click", () => this.goToPrevious());
    wrapper.querySelector(".next-btn")?.addEventListener("click", () => this.goToNext());

    wrapper.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        this.stop();
        return;
      }

      if (event.key !== "Tab") return;
      const focusables = Array.from(
        wrapper.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => {
        if (el.hasAttribute("disabled")) return false;
        if (el.getAttribute("aria-hidden") === "true") return false;
        const style = window.getComputedStyle(el);
        return style.display !== "none" && style.visibility !== "hidden";
      });

      if (focusables.length === 0) {
        event.preventDefault();
        wrapper.focus();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (event.shiftKey) {
        if (active === first || active === wrapper) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    wrapper.querySelector(".check-btn")?.addEventListener("click", () => {
      const challenge = this.getCurrentChallenge();
      if (challenge && (challenge as any).type === "custom" && typeof (challenge as any).check === "function") {
        const state = this.options.getState ? this.options.getState() : {};
        this.check(state);
      } else {
        const event = new CustomEvent("challengeCheckRequested", { detail: { challenge } });
        container.dispatchEvent(event);
      }
    });

    container.insertBefore(wrapper, container.firstChild);
    this.ui = wrapper;
  }

  private updateUi(): void {
    if (!this.ui) return;
    const challenge = this.getCurrentChallenge();
    if (!challenge) return;

    const numberEl = this.ui.querySelector<HTMLElement>(".cp-challenge-number");
    const questionEl = this.ui.querySelector<HTMLElement>(".cp-challenge-question");
    const progressEl = this.ui.querySelector<HTMLElement>(".cp-challenge-progress");
    const prevBtn = this.ui.querySelector<HTMLButtonElement>(".prev-btn");
    const nextBtn = this.ui.querySelector<HTMLButtonElement>(".next-btn");
    const hintBtn = this.ui.querySelector<HTMLButtonElement>(".hint-btn");

    if (numberEl) numberEl.textContent = `Challenge ${this.currentIndex + 1} of ${this.challenges.length}`;
    if (questionEl) questionEl.textContent = (challenge as any).question ?? "";
    if (progressEl) progressEl.textContent = `${this.currentIndex + 1} / ${this.challenges.length}`;

    if (prevBtn) prevBtn.disabled = this.currentIndex === 0;
    if (nextBtn) nextBtn.textContent = this.currentIndex === this.challenges.length - 1 ? "Finish" : "Next →";

    if (hintBtn) {
      const hints = (challenge as any).hints as string[];
      if (hints.length === 0) {
        hintBtn.style.display = "none";
      } else {
        hintBtn.style.display = "";
        hintBtn.textContent =
          this.hintsUsed > 0 ? `Next Hint (${hints.length - this.hintsUsed} left)` : "Show Hint";
        hintBtn.disabled = this.hintsUsed >= hints.length;
      }
    }
  }

  private showFeedback(type: "correct" | "incorrect" | "close", message: string): void {
    if (!this.ui) return;
    const feedback = this.ui.querySelector<HTMLElement>(".cp-challenge-feedback");
    if (!feedback) return;
    feedback.className = `cp-challenge-feedback ${type}`;
    const prefix =
      type === "correct" ? "Correct!" : type === "close" ? "Close!" : "Not quite.";
    feedback.innerHTML = `<strong>${prefix}</strong> ${message}`;
    feedback.style.display = "block";
  }

  private clearFeedback(): void {
    if (!this.ui) return;
    const feedback = this.ui.querySelector<HTMLElement>(".cp-challenge-feedback");
    if (!feedback) return;
    feedback.style.display = "none";
  }

  private showHint(text: string): void {
    if (!this.ui) return;
    const hint = this.ui.querySelector<HTMLElement>(".cp-challenge-hint");
    if (!hint) return;
    hint.textContent = text;
    hint.style.display = "block";

    const challenge = this.getCurrentChallenge();
    const hintBtn = this.ui.querySelector<HTMLButtonElement>(".hint-btn");
    if (challenge && hintBtn) {
      if (this.hintsUsed >= challenge.hints.length) {
        hintBtn.disabled = true;
        hintBtn.textContent = "No more hints";
      } else {
        hintBtn.disabled = false;
        hintBtn.textContent = `Next Hint (${challenge.hints.length - this.hintsUsed} left)`;
      }
    }
  }

  private clearHint(): void {
    if (!this.ui) return;
    const hint = this.ui.querySelector<HTMLElement>(".cp-challenge-hint");
    if (!hint) return;
    hint.style.display = "none";
  }

  private showCompletion(stats: ChallengeStats): void {
    if (!this.ui) return;
    const content = this.ui.querySelector<HTMLElement>(".cp-challenge-content");
    const actions = this.ui.querySelector<HTMLElement>(".cp-challenge-actions");
    const nav = this.ui.querySelector<HTMLElement>(".cp-challenge-nav");
    if (!content) return;

    content.innerHTML = `
      <div class="cp-challenge-complete">
        <h3>All challenges complete!</h3>
        <div class="stats">
          Correct: ${stats.correct}<br/>
          Skipped: ${stats.skipped}<br/>
          Hints used: ${stats.hintsUsed}<br/>
          Total attempts: ${stats.totalAttempts}
        </div>
      </div>
    `;
    if (actions) actions.style.display = "none";
    if (nav) nav.style.display = "none";
  }
}
