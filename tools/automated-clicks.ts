export const MIN_AUTOMATED_CLICK_PAUSE_MS = 2000;

export type AutomatedClickThrottle = {
  lastClickAt: number | null;
  minPauseMs: number;
  now: () => number;
};

export function createAutomatedClickThrottle(input: {
  minPauseMs?: number;
  now?: () => number;
} = {}): AutomatedClickThrottle {
  return {
    lastClickAt: null,
    minPauseMs: input.minPauseMs ?? MIN_AUTOMATED_CLICK_PAUSE_MS,
    now: input.now || (() => Date.now()),
  };
}

export async function runThrottledAutomatedClick(
  page: any,
  throttle: AutomatedClickThrottle,
  click: () => Promise<void>,
): Promise<void> {
  if (throttle.lastClickAt !== null) {
    const elapsed = throttle.now() - throttle.lastClickAt;
    const remaining = throttle.minPauseMs - elapsed;
    if (remaining > 0) await waitForAutomatedClickPause(page, remaining);
  }

  await click();
  throttle.lastClickAt = throttle.now();
}

async function waitForAutomatedClickPause(page: any, ms: number): Promise<void> {
  if (typeof page.waitForTimeout === "function") {
    await page.waitForTimeout(ms);
    return;
  }
  await new Promise((resolve) => setTimeout(resolve, ms));
}
