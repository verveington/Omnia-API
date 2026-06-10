import { buildCommandSuggestions } from "./native-cdp-action-recorder.js";
import { buildApiObservations, isApiUrl } from "./native-cdp-api-recorder.js";
import { buildCommandCatalog, mergeSuggestionsIntoCatalog } from "./native-cdp-command-catalog.js";

export function createLearningSession(seed = {}) {
  return {
    active: Boolean(seed.active),
    learnedEventCount: Number.isInteger(seed.learnedEventCount) ? seed.learnedEventCount : 0,
    learnedApiEventCount: Number.isInteger(seed.learnedApiEventCount) ? seed.learnedApiEventCount : 0,
    lastLearnedAt: seed.lastLearnedAt || null,
    catalog: buildCommandCatalog(seed.catalog),
  };
}

export function learnFromRecordingSnapshot(session, snapshot, { now = new Date().toISOString() } = {}) {
  const current = createLearningSession(session);
  const events = Array.isArray(snapshot?.events) ? snapshot.events : [];
  const eventCount = Number.isInteger(snapshot?.eventCount) ? snapshot.eventCount : events.length;
  const newEvents = events.slice(current.learnedEventCount);
  const apiEvents = apiEventsFromSnapshot(snapshot, events);
  const apiEventCount = Number.isInteger(snapshot?.apiEventCount) ? snapshot.apiEventCount : apiEvents.length;
  const newApiEvents = apiEvents.slice(0, apiEventCount).slice(current.learnedApiEventCount);
  const apiObservations = buildApiObservations(newApiEvents);
  const firstRoute = newEvents.find((event) => event?.path)?.path || "";
  const learnedSuggestions = buildCommandSuggestions(newEvents).map((suggestion) => ({
    ...suggestion,
    executor: apiObservations.length ? "hybrid" : "ui",
    safety: "safe",
    context: { route: firstRoute },
    apiObservations,
  }));
  const catalog = mergeSuggestionsIntoCatalog(current.catalog, learnedSuggestions, { now });

  return {
    learnedSuggestions,
    session: createLearningSession({
      ...current,
      active: Boolean(snapshot?.active),
      learnedEventCount: eventCount,
      learnedApiEventCount: apiEventCount,
      lastLearnedAt: learnedSuggestions.length ? now : current.lastLearnedAt,
      catalog,
    }),
  };
}

export function learnFromExplorerClicks(session, clicked, {
  apiEvents = [],
  apiEventCount,
  apiObservations,
  now = new Date().toISOString(),
} = {}) {
  const current = createLearningSession(session);
  const observations = Array.isArray(apiObservations) ? apiObservations : buildApiObservations(apiEvents);
  const suggestions = (clicked || [])
    .filter((target) => target?.kind !== "menu")
    .map((target) => ({
      command: target.label,
      reason: "Auto-Explorer",
      executor: observations.length ? "hybrid" : "ui",
      safety: "safe",
      context: { route: target.path || "" },
      apiObservations: observations,
    }));

  const knownCommands = new Set(current.catalog.commands.map((entry) => entry.command));
  const catalog = suggestions.length
    ? mergeSuggestionsIntoCatalog(current.catalog, suggestions, { now })
    : current.catalog;
  const catalogChanged = JSON.stringify(catalog.commands) !== JSON.stringify(current.catalog.commands);
  const learnedSuggestions = catalog.commands
    .filter((entry) => !knownCommands.has(entry.command))
    .map((entry) => ({
      command: entry.command,
      reason: "Auto-Explorer",
      executor: entry.executor,
      apiObservations: entry.apiObservations,
    }));

  return {
    catalogChanged,
    learnedSuggestions,
    session: createLearningSession({
      ...current,
      active: false,
      learnedApiEventCount: Number.isInteger(apiEventCount) ? apiEventCount : current.learnedApiEventCount,
      lastLearnedAt: catalogChanged ? now : current.lastLearnedAt,
      catalog,
    }),
  };
}

function apiEventsFromSnapshot(snapshot, events) {
  if (Array.isArray(snapshot?.apiEvents)) return snapshot.apiEvents;
  if (Array.isArray(snapshot?.apiRecording?.events)) return snapshot.apiRecording.events;
  if (Array.isArray(snapshot?.apiSnapshot?.events)) return snapshot.apiSnapshot.events;
  if (Array.isArray(events) && events.length > 0 && events.every(isApiRecorderEvent)) return events;
  return [];
}

function isApiRecorderEvent(event) {
  if (!["request", "response"].includes(event?.type)) return false;
  return isApiUrl(event.url) || isApiUrl(event.path) || isApiUrl(event.normalizedPath);
}
