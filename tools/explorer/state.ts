import {
  candidateLabel,
  classifyCandidate,
  labelFromPath,
  normalizedRole,
  pathnameOf,
  safeLabel,
  type CandidateInput,
  type ExploreTarget,
} from "./policies.ts";
import { redactUrl } from "../redact.ts";
import type { UiSnapshot } from "./ui-snapshot.ts";

export type BlockedRequest = {
  timestamp?: string;
  method: string;
  url: string;
  reason: string;
  resourceType?: string;
};

export type ExplorerResult = {
  startedAt: string;
  finishedAt: string;
  startUrl: string;
  finalUrl: string;
  logFile: string;
  clicked: Array<ExploreTarget & { urlAfter?: string }>;
  discoveredTargets: DiscoveredTarget[];
  uiSnapshots?: UiSnapshot[];
  skipped: Array<{ label: string; path?: string; reason: string }>;
  blockedRequests: BlockedRequest[];
  stopReason: string;
};

export type DiscoveredTarget = Pick<ExploreTarget, "kind" | "key" | "label" | "path" | "reason"> & {
  seenCount: number;
  clicked: boolean;
};

export type ExplorerState = {
  clicked: ExplorerResult["clicked"];
  discoveredTargets: DiscoveredTarget[];
  skipped: ExplorerResult["skipped"];
  blockedRequests: BlockedRequest[];
  uiSnapshots: UiSnapshot[];
  visited: Set<string>;
  rememberSkipped: (rawCandidates: CandidateInput[]) => void;
  rememberDiscoveredTargets: (targets: ExploreTarget[]) => void;
  recordClicked: (target: ExploreTarget & { urlAfter?: string }) => void;
  recordBlockedRequest: (request: BlockedRequest) => void;
  recordUiSnapshot: (snapshot: UiSnapshot) => void;
  finish: (input: { finalUrl: string; finishedAt?: string; stopReason: string }) => ExplorerResult;
};

export function createExplorerState(input: {
  startedAt?: string;
  startUrl: string;
  logFile: string;
}): ExplorerState {
  const startedAt = input.startedAt || new Date().toISOString();
  const startUrl = redactUrl(input.startUrl);
  const clicked: ExplorerResult["clicked"] = [];
  const discoveredTargetsByKey = new Map<string, DiscoveredTarget>();
  const skipped: ExplorerResult["skipped"] = [];
  const blockedRequests: BlockedRequest[] = [];
  const uiSnapshots: UiSnapshot[] = [];
  const skippedKeys = new Set<string>();
  const visited = new Set<string>();

  return {
    clicked,
    get discoveredTargets(): DiscoveredTarget[] {
      return [...discoveredTargetsByKey.values()];
    },
    skipped,
    blockedRequests,
    uiSnapshots,
    visited,
    rememberSkipped(rawCandidates: CandidateInput[]): void {
      for (const raw of rawCandidates) {
        const classification = classifyCandidate(raw);
        if (classification.allowed) continue;

        const pathName = pathnameOf(raw.href || raw.path || "");
        if (classification.reason === "dangerous-route" && (!pathName || pathName === "/")) continue;
        if (classification.reason === "unsupported-target" && !pathName) continue;

        const label = safeLabel(candidateLabel(raw) || labelFromPath(pathName) || normalizedRole(raw));
        if (!label || label.length > 120) continue;

        const key = `${label}\0${pathName}\0${classification.reason}`;
        if (skippedKeys.has(key)) continue;
        skippedKeys.add(key);
        skipped.push({ label, path: pathName, reason: classification.reason });
      }
    },
    rememberDiscoveredTargets(targets: ExploreTarget[]): void {
      for (const target of targets) {
        const existing = discoveredTargetsByKey.get(target.key);
        if (existing) {
          existing.seenCount += 1;
          continue;
        }
        discoveredTargetsByKey.set(target.key, {
          kind: target.kind,
          key: target.key,
          label: target.label,
          path: target.path,
          reason: target.reason,
          seenCount: 1,
          clicked: false,
        });
      }
    },
    recordClicked(target: ExploreTarget & { urlAfter?: string }): void {
      clicked.push({
        ...target,
        urlAfter: target.urlAfter ? redactUrl(target.urlAfter) : target.urlAfter,
      });
      const discovered = discoveredTargetsByKey.get(target.key);
      if (discovered) {
        discovered.clicked = true;
      } else {
        discoveredTargetsByKey.set(target.key, {
          kind: target.kind,
          key: target.key,
          label: target.label,
          path: target.path,
          reason: target.reason,
          seenCount: 1,
          clicked: true,
        });
      }
    },
    recordBlockedRequest(request: BlockedRequest): void {
      blockedRequests.push({
        ...request,
        url: redactUrl(request.url),
      });
    },
    recordUiSnapshot(snapshot: UiSnapshot): void {
      uiSnapshots.push(snapshot);
    },
    finish({ finalUrl, finishedAt, stopReason }): ExplorerResult {
      return {
        startedAt,
        finishedAt: finishedAt || new Date().toISOString(),
        startUrl,
        finalUrl: redactUrl(finalUrl),
        logFile: input.logFile,
        clicked,
        discoveredTargets: [...discoveredTargetsByKey.values()],
        uiSnapshots: uiSnapshots.length > 0 ? [...uiSnapshots] : undefined,
        skipped,
        blockedRequests,
        stopReason,
      };
    },
  };
}
