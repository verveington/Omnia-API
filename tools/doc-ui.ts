import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { normalizeObservedPath } from "./api-paths.ts";
import { isApiTrafficRecord } from "./api-traffic.ts";
import {
  buildOmniaRelationships,
  type RelationshipEndpoint,
  type RelationshipStepFlow,
  type RelationshipTransition,
} from "./omnia-relationships.ts";
import { redactText, redactUiLabel, redactUrl } from "./redact.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..");
const defaultDocsDir = path.join(workspaceRoot, "docs");
const defaultRecordingsDir = path.join(defaultDocsDir, "recordings");

export type DocUiOptions = {
  flowDataFile: string;
  flowHtmlFile: string;
  swaggerHtmlFile: string;
  openapiJsonFile: string;
  observedOpenapiFile: string;
  recordingsDir: string;
};

export type FlowUiInput = {
  manifestFile?: string;
  manifest?: unknown;
  logFile?: string;
  records?: Record<string, unknown>[];
};

export type FlowUiData = {
  generatedAt: string;
  summary: {
    recordings: number;
    apiResponses: number;
    uniqueEndpoints: number;
    missingExpectedEndpoints: number;
    downloads: number;
    relationships: number;
  };
  globalEndpoints: FlowUiEndpoint[];
  recordings: FlowUiRecording[];
};

export type FlowUiRecording = {
  id: string;
  label: string;
  mode: string;
  purpose: string;
  status: string;
  auditStatus: string;
  startedAt: string;
  completedAt: string;
  durationSeconds: number | null;
  artifacts: Record<string, string>;
  expectedEndpoints: FlowUiExpectedEndpoint[];
  impact: FlowUiImpact;
  endpoints: FlowUiEndpoint[];
  steps: FlowUiStep[];
  relationships: FlowUiRelationships;
};

export type FlowUiExpectedEndpoint = {
  method: string;
  path: string;
  observed: boolean;
  source: string;
};

export type FlowUiImpact = {
  targetResponses: number;
  targetEndpointCount: number;
  newEndpointCount: number;
  newKnownInventoryCount: number;
  coverageDeltaPercent: number;
  downloads: number;
  topAreas: Array<{ area: string; endpointCount: number; newEndpointCount: number; responseCount: number }>;
};

export type FlowUiEndpoint = {
  key: string;
  method: string;
  host: string;
  path: string;
  statuses: number[];
  count: number;
  resourceTypes: string[];
  steps: string[];
};

export type FlowUiStep = {
  name: string;
  startedAt: string;
  offset: string;
  apiCalls: FlowUiApiCall[];
  uiSnapshots: FlowUiSnapshot[];
  downloads: FlowUiDownload[];
  events: FlowUiEvent[];
};

export type FlowUiApiCall = {
  offset: string;
  method: string;
  host: string;
  path: string;
  status: number | null;
  resourceType: string;
};

export type FlowUiSnapshot = {
  offset: string;
  path: string;
  title: string;
  headings: string[];
  actions: string[];
  formLabels: string[];
  tableHeaders: string[];
};

export type FlowUiDownload = {
  offset: string;
  url: string;
  extension: string;
};

export type FlowUiEvent = {
  offset: string;
  kind: string;
  detail: string;
};

export type FlowUiRelationships = {
  responseCount: number;
  domainCount: number;
  transitions: RelationshipTransition[];
  stepFlows: RelationshipStepFlow[];
};

type MutableEndpoint = Omit<FlowUiEndpoint, "statuses" | "resourceTypes" | "steps"> & {
  statusSet: Set<number>;
  resourceTypeSet: Set<string>;
  stepSet: Set<string>;
};

if (isMainModule()) {
  const options = parseDocUiArgs(process.argv.slice(2));
  const inputs = loadFlowUiInputs(options.recordingsDir);
  const data = buildFlowUiData(inputs, { generatedAt: new Date(), workspaceRoot });
  writeDocUiArtifacts(data, options);
  console.log(`Flow-UI Daten: ${options.flowDataFile}`);
  console.log(`Flow-UI HTML: ${options.flowHtmlFile}`);
  console.log(`Swagger/OpenAPI HTML: ${options.swaggerHtmlFile}`);
}

export function parseDocUiArgs(argv: string[]): DocUiOptions {
  return {
    flowDataFile: path.resolve(valueAfter(argv, "--flow-data") || path.join(defaultDocsDir, "flow-ui-data.json")),
    flowHtmlFile: path.resolve(valueAfter(argv, "--flow-html") || path.join(defaultDocsDir, "flow-ui.html")),
    swaggerHtmlFile: path.resolve(valueAfter(argv, "--swagger-html") || path.join(defaultDocsDir, "swagger-ui.html")),
    openapiJsonFile: path.resolve(valueAfter(argv, "--openapi-json") || path.join(defaultDocsDir, "openapi.cumulative.json")),
    observedOpenapiFile: path.resolve(valueAfter(argv, "--observed-openapi") || path.join(workspaceRoot, "openapi", "omnia-observed.openapi.yaml")),
    recordingsDir: path.resolve(valueAfter(argv, "--recordings-dir") || defaultRecordingsDir),
  };
}

export function buildFlowUiData(
  inputs: FlowUiInput[],
  options: { generatedAt?: Date | string; workspaceRoot?: string } = {},
): FlowUiData {
  const generatedAt = normalizedDate(options.generatedAt).toISOString();
  const root = options.workspaceRoot || workspaceRoot;
  const recordings = inputs
    .map((input) => buildFlowUiRecording(input, root))
    .filter((recording) => recording.steps.length > 0 || recording.endpoints.length > 0 || Object.keys(recording.artifacts).length > 0)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt) || b.label.localeCompare(a.label));
  const globalEndpoints = mergeEndpoints(recordings.flatMap((recording) => recording.endpoints));

  return {
    generatedAt,
    summary: {
      recordings: recordings.length,
      apiResponses: recordings.reduce((sum, recording) => sum + recording.endpoints.reduce((inner, endpoint) => inner + endpoint.count, 0), 0),
      uniqueEndpoints: globalEndpoints.length,
      missingExpectedEndpoints: recordings.reduce(
        (sum, recording) => sum + recording.expectedEndpoints.filter((endpoint) => endpoint.observed === false).length,
        0,
      ),
      downloads: recordings.reduce((sum, recording) => sum + recording.steps.reduce((inner, step) => inner + step.downloads.length, 0), 0),
      relationships: recordings.reduce((sum, recording) => sum + recording.relationships.transitions.length, 0),
    },
    globalEndpoints,
    recordings,
  };
}

export function buildFlowUiHtml(options: { dataFile?: string } = {}): string {
  const dataFile = options.dataFile || "flow-ui-data.json";
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Optica Omnia Flow UI</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f7f9;
      --panel: #ffffff;
      --panel-2: #f0f4f7;
      --text: #16202a;
      --muted: #647180;
      --border: #d8dee6;
      --blue: #1f5eff;
      --teal: #007a72;
      --amber: #a05a00;
      --red: #b42318;
      --green: #1d7f43;
      --shadow: 0 12px 30px rgba(22, 32, 42, 0.08);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--bg); color: var(--text); }
    header { position: sticky; top: 0; z-index: 10; display: flex; gap: 18px; align-items: center; justify-content: space-between; padding: 14px 20px; border-bottom: 1px solid var(--border); background: rgba(255,255,255,0.94); backdrop-filter: blur(10px); }
    h1 { margin: 0; font-size: 18px; line-height: 1.2; font-weight: 720; }
    h2 { margin: 0 0 12px; font-size: 14px; line-height: 1.25; font-weight: 720; }
    h3 { margin: 0; font-size: 13px; line-height: 1.25; font-weight: 720; }
    a { color: var(--blue); text-decoration: none; }
    a:hover { text-decoration: underline; }
    .subtle { color: var(--muted); font-size: 12px; }
    .layout { display: grid; grid-template-columns: minmax(280px, 370px) minmax(420px, 1fr) minmax(320px, 450px); gap: 14px; padding: 14px; min-height: calc(100vh - 58px); }
    .panel { background: var(--panel); border: 1px solid var(--border); border-radius: 8px; box-shadow: var(--shadow); min-width: 0; }
    .panel-head { padding: 14px; border-bottom: 1px solid var(--border); }
    .panel-body { padding: 14px; }
    .filters { display: grid; grid-template-columns: 1fr 130px; gap: 10px; }
    input, select { width: 100%; height: 36px; padding: 0 10px; border: 1px solid var(--border); border-radius: 6px; background: #fff; color: var(--text); font: inherit; font-size: 13px; }
    .stats { display: grid; grid-template-columns: repeat(6, minmax(110px, 1fr)); gap: 10px; min-width: 680px; }
    .stat { padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; background: var(--panel-2); }
    .stat strong { display: block; font-size: 18px; line-height: 1.1; }
    .recording-list, .timeline, .detail { display: grid; gap: 10px; }
    .recording { width: 100%; text-align: left; border: 1px solid var(--border); border-radius: 8px; background: #fff; padding: 10px; cursor: pointer; }
    .recording[aria-selected="true"] { border-color: var(--blue); box-shadow: 0 0 0 2px rgba(31,94,255,0.12); }
    .recording-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
    .pill { display: inline-flex; align-items: center; height: 22px; padding: 0 7px; border-radius: 999px; border: 1px solid var(--border); background: #fff; color: var(--muted); font-size: 11px; font-weight: 650; white-space: nowrap; }
    .pill.good { color: var(--green); border-color: rgba(29,127,67,0.25); background: rgba(29,127,67,0.08); }
    .pill.warn { color: var(--amber); border-color: rgba(160,90,0,0.28); background: rgba(160,90,0,0.08); }
    .pill.bad { color: var(--red); border-color: rgba(180,35,24,0.25); background: rgba(180,35,24,0.08); }
    .step { border: 1px solid var(--border); border-radius: 8px; background: #fff; overflow: hidden; }
    .step-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 12px; background: var(--panel-2); }
    .step-body { padding: 10px 12px; display: grid; gap: 8px; }
    .api-row { display: grid; grid-template-columns: 56px 52px minmax(0, 1fr) 58px; gap: 8px; align-items: center; padding: 7px 8px; border: 1px solid var(--border); border-radius: 6px; background: #fff; font-size: 12px; }
    code { overflow-wrap: anywhere; font-family: "SFMono-Regular", Consolas, ui-monospace, monospace; font-size: 12px; }
    .method { font-weight: 780; color: var(--teal); }
    .status { justify-self: end; font-weight: 720; }
    .status.error { color: var(--red); }
    .empty { padding: 16px; color: var(--muted); border: 1px dashed var(--border); border-radius: 8px; background: #fff; }
    .links { display: flex; flex-wrap: wrap; gap: 8px; }
    .links a { display: inline-flex; align-items: center; min-height: 28px; padding: 0 9px; border: 1px solid var(--border); border-radius: 6px; background: #fff; font-size: 12px; }
    .endpoint-list { display: grid; gap: 6px; max-height: 34vh; overflow: auto; }
    .endpoint { padding: 8px; border: 1px solid var(--border); border-radius: 6px; background: #fff; }
    .snapshot { padding: 8px; border-left: 3px solid var(--teal); background: #f8fbfb; font-size: 12px; }
    .relationship-list { display: grid; gap: 8px; }
    .relationship { padding: 9px; border: 1px solid var(--border); border-radius: 6px; background: #fff; }
    .relationship-title { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 5px; }
    .relationship-flow { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 6px; }
    .relationship-flow code { padding: 2px 5px; border: 1px solid var(--border); border-radius: 5px; background: var(--panel-2); }
    .relationship-arrow { color: var(--muted); font-weight: 760; }
    @media (max-width: 1100px) { .layout { grid-template-columns: 1fr; } .stats { min-width: 0; grid-template-columns: repeat(2, 1fr); } header { align-items: flex-start; flex-direction: column; } }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>Optica Omnia Flow UI</h1>
      <div class="subtle">Read-only Timeline aus redaktierten Recording-Artefakten</div>
    </div>
    <div class="stats" id="summaryStats" aria-label="Zusammenfassung"></div>
  </header>
  <main class="layout">
    <section class="panel">
      <div class="panel-head">
        <h2>Recordings</h2>
        <div class="filters">
          <input id="recordingSearch" type="search" placeholder="Recording, Zweck, Endpoint">
          <select id="statusFilter">
            <option value="">Alle Status</option>
            <option value="completed">completed</option>
            <option value="blocked">blocked</option>
            <option value="failed">failed</option>
          </select>
          <select id="methodFilter">
            <option value="">Alle Methoden</option>
            <option>GET</option>
            <option>POST</option>
            <option>PUT</option>
            <option>PATCH</option>
            <option>DELETE</option>
          </select>
          <select id="expectedFilter">
            <option value="">Alle Erwartungen</option>
            <option value="missing">fehlende erwartete Endpunkte</option>
            <option value="observed">erwartete Endpunkte beobachtet</option>
          </select>
        </div>
      </div>
      <div class="panel-body recording-list" id="recordingList"></div>
    </section>
    <section class="panel">
      <div class="panel-head">
        <h2 id="timelineTitle">Timeline</h2>
        <div class="subtle" id="timelineMeta"></div>
      </div>
      <div class="panel-body timeline" id="timeline"></div>
    </section>
    <aside class="panel">
      <div class="panel-head">
        <h2>Details</h2>
      </div>
      <div class="panel-body detail" id="details"></div>
    </aside>
  </main>
  <script>
    const dataUrl = ${JSON.stringify(dataFile)};
    const state = { data: null, selectedId: "", search: "", status: "", method: "", expected: "" };

    fetch(dataUrl)
      .then((response) => response.json())
      .then((data) => {
        state.data = data;
        state.selectedId = data.recordings[0] ? data.recordings[0].id : "";
        bindFilters();
        render();
      })
      .catch((error) => {
        document.getElementById("recordingList").innerHTML = '<div class="empty">Flow-Daten konnten nicht geladen werden: ' + escapeHtml(error.message) + '</div>';
      });

    function bindFilters() {
      for (const id of ["recordingSearch", "statusFilter", "methodFilter", "expectedFilter"]) {
        document.getElementById(id).addEventListener("input", (event) => {
          const key = id === "recordingSearch" ? "search" : id.replace("Filter", "");
          state[key] = event.target.value;
          const visible = filteredRecordings();
          if (!visible.some((recording) => recording.id === state.selectedId)) {
            state.selectedId = visible[0] ? visible[0].id : "";
          }
          render();
        });
      }
    }

    function render() {
      renderSummary();
      renderRecordings();
      renderTimeline();
      renderDetails();
    }

    function renderSummary() {
      const summary = state.data.summary;
      const stats = [
        ["Recordings", summary.recordings],
        ["Responses", summary.apiResponses],
        ["Endpunkte", summary.uniqueEndpoints],
        ["Fehlend erwartet", summary.missingExpectedEndpoints],
        ["Downloads", summary.downloads],
        ["Relationships", summary.relationships || 0],
      ];
      document.getElementById("summaryStats").innerHTML = stats.map(([label, value]) => '<div class="stat"><strong>' + value + '</strong><span class="subtle">' + label + '</span></div>').join("");
    }

    function filteredRecordings() {
      const query = state.search.toLowerCase().trim();
      return state.data.recordings.filter((recording) => {
        const haystack = [
          recording.label,
          recording.purpose,
          recording.mode,
          recording.status,
          recording.auditStatus,
          recording.endpoints.map((endpoint) => endpoint.method + " " + endpoint.path).join(" "),
          recording.expectedEndpoints.map((endpoint) => endpoint.method + " " + endpoint.path).join(" "),
          (recording.relationships ? recording.relationships.transitions.map((transition) => transition.fromArea + " " + transition.toArea).join(" ") : ""),
          (recording.relationships ? recording.relationships.stepFlows.map((flow) => flow.step + " " + flow.domains.join(" ")).join(" ") : ""),
        ].join(" ").toLowerCase();
        if (query && !haystack.includes(query)) return false;
        if (state.status && recording.status !== state.status) return false;
        if (state.method && !recording.endpoints.some((endpoint) => endpoint.method === state.method)) return false;
        const missing = recording.expectedEndpoints.some((endpoint) => endpoint.observed === false);
        const observed = recording.expectedEndpoints.some((endpoint) => endpoint.observed === true);
        if (state.expected === "missing" && !missing) return false;
        if (state.expected === "observed" && !observed) return false;
        return true;
      });
    }

    function selectedRecording() {
      return state.data.recordings.find((recording) => recording.id === state.selectedId) || null;
    }

    function renderRecordings() {
      const container = document.getElementById("recordingList");
      const recordings = filteredRecordings();
      if (recordings.length === 0) {
        container.innerHTML = '<div class="empty">Keine Recordings fuer diese Filter.</div>';
        return;
      }
      container.innerHTML = recordings.map((recording) => {
        const missing = recording.expectedEndpoints.filter((endpoint) => endpoint.observed === false).length;
        const relationshipCount = recording.relationships ? recording.relationships.transitions.length : 0;
        return '<button class="recording" aria-selected="' + String(recording.id === state.selectedId) + '" data-id="' + escapeAttr(recording.id) + '">' +
          '<div class="recording-top"><h3>' + escapeHtml(recording.label) + '</h3><span class="pill ' + (missing ? "warn" : "good") + '">' + missing + ' fehlt</span></div>' +
          '<div class="subtle">' + escapeHtml(recording.purpose || "-") + ' · ' + escapeHtml(recording.mode || "-") + ' · ' + escapeHtml(recording.status || "-") + '</div>' +
          '<div class="subtle">' + recording.endpoints.length + ' Endpunkte · ' + recording.steps.length + ' Schritte · ' + relationshipCount + ' Relationships · ' + formatDate(recording.startedAt) + '</div>' +
        '</button>';
      }).join("");
      for (const button of container.querySelectorAll(".recording")) {
        button.addEventListener("click", () => {
          state.selectedId = button.getAttribute("data-id") || "";
          render();
        });
      }
    }

    function renderTimeline() {
      const recording = selectedRecording();
      const title = document.getElementById("timelineTitle");
      const meta = document.getElementById("timelineMeta");
      const container = document.getElementById("timeline");
      if (!recording) {
        title.textContent = "Timeline";
        meta.textContent = "";
        container.innerHTML = '<div class="empty">Kein Recording ausgewählt.</div>';
        return;
      }
      title.textContent = recording.label;
      meta.textContent = [recording.purpose, recording.mode, recording.status, recording.auditStatus].filter(Boolean).join(" · ");
      if (recording.steps.length === 0) {
        container.innerHTML = '<div class="empty">Keine Timeline-Schritte vorhanden.</div>';
        return;
      }
      container.innerHTML = recording.steps.map((step) => {
        const calls = step.apiCalls.map((call) => apiRow(call)).join("");
        const snapshots = step.uiSnapshots.map((snapshot) => '<div class="snapshot">UI: <code>' + escapeHtml(snapshot.path || "-") + '</code><br>Aktionen: ' + escapeHtml(snapshot.actions.join(", ") || "-") + '</div>').join("");
        const downloads = step.downloads.map((download) => '<div class="snapshot">Download ' + escapeHtml(download.extension || "?") + ': <code>' + escapeHtml(download.url) + '</code></div>').join("");
        const events = step.events.map((event) => '<div class="snapshot">' + escapeHtml(event.kind) + ': <code>' + escapeHtml(event.detail) + '</code></div>').join("");
        return '<article class="step">' +
          '<div class="step-head"><h3>' + escapeHtml(step.name) + '</h3><span class="pill">' + escapeHtml(step.offset) + '</span></div>' +
          '<div class="step-body">' + (calls || '<div class="subtle">Keine API-Responses in diesem Schritt.</div>') + snapshots + downloads + events + '</div>' +
        '</article>';
      }).join("");
    }

    function apiRow(call) {
      const statusClass = call.status >= 400 ? "status error" : "status";
      return '<div class="api-row">' +
        '<span class="subtle">' + escapeHtml(call.offset) + '</span>' +
        '<span class="method">' + escapeHtml(call.method) + '</span>' +
        '<code>' + escapeHtml(call.path) + '</code>' +
        '<span class="' + statusClass + '">' + escapeHtml(String(call.status || "-")) + '</span>' +
      '</div>';
    }

    function renderDetails() {
      const recording = selectedRecording();
      const container = document.getElementById("details");
      if (!recording) {
        container.innerHTML = '<div class="empty">Keine Details.</div>';
        return;
      }
      const links = Object.entries(recording.artifacts)
        .filter(([, value]) => value)
        .map(([key, value]) => '<a href="' + escapeAttr("../" + value) + '" target="_blank" rel="noreferrer">' + escapeHtml(key) + '</a>')
        .join("");
      const expected = recording.expectedEndpoints.map((endpoint) => '<div class="endpoint"><span class="pill ' + (endpoint.observed ? "good" : "warn") + '">' + (endpoint.observed ? "gesehen" : "fehlt") + '</span> <strong>' + escapeHtml(endpoint.method) + '</strong> <code>' + escapeHtml(endpoint.path) + '</code></div>').join("");
      const endpoints = recording.endpoints.map((endpoint) => '<div class="endpoint"><strong>' + escapeHtml(endpoint.method) + '</strong> <code>' + escapeHtml(endpoint.path) + '</code><div class="subtle">' + endpoint.count + 'x · Status ' + escapeHtml(endpoint.statuses.join(", ") || "-") + '</div></div>').join("");
      container.innerHTML =
        '<section><h2>Artefakte</h2><div class="links">' + (links || '<span class="subtle">Keine Links</span>') + '</div></section>' +
        '<section><h2>Impact</h2><div class="endpoint">Responses: ' + recording.impact.targetResponses + '<br>Neue Endpunkte: ' + recording.impact.newEndpointCount + '<br>Coverage-Delta: ' + recording.impact.coverageDeltaPercent + '%</div></section>' +
        renderRelationships(recording) +
        '<section><h2>Erwartete Endpunkte</h2><div class="endpoint-list">' + (expected || '<div class="empty">Keine erwarteten Endpunkte.</div>') + '</div></section>' +
        '<section><h2>Beobachtete Endpunkte</h2><div class="endpoint-list">' + (endpoints || '<div class="empty">Keine Endpunkte.</div>') + '</div></section>';
    }

    function renderRelationships(recording) {
      const relationships = recording.relationships || { transitions: [], stepFlows: [], responseCount: 0, domainCount: 0 };
      const transitions = relationships.transitions.slice(0, 16).map((transition) => {
        const example = transition.examples && transition.examples[0] ? transition.examples[0] : null;
        const steps = (transition.steps || []).slice(0, 4).join(", ");
        return '<div class="relationship">' +
          '<div class="relationship-title"><strong>' + escapeHtml(transition.fromArea) + ' <span class="relationship-arrow">-&gt;</span> ' + escapeHtml(transition.toArea) + '</strong><span class="pill">' + transition.count + 'x</span></div>' +
          '<div class="subtle">Schritte: ' + escapeHtml(steps || "-") + '</div>' +
          (example ? '<div class="subtle"><code>' + escapeHtml(endpointLabel(example.from)) + '</code> <span class="relationship-arrow">-&gt;</span> <code>' + escapeHtml(endpointLabel(example.to)) + '</code></div>' : '') +
        '</div>';
      }).join("");
      const stepFlows = relationships.stepFlows.slice(0, 10).map((flow) => {
        const domains = flow.domains || [];
        const endpoints = (flow.endpoints || []).slice(0, 4).map((endpoint) => '<code>' + escapeHtml(endpointLabel(endpoint)) + '</code>').join("");
        return '<div class="relationship">' +
          '<div class="relationship-title"><strong>' + escapeHtml(flow.step || "Ohne Marker") + '</strong><span class="pill">' + flow.responseCount + ' Responses</span></div>' +
          '<div class="relationship-flow">' + (domains.length ? domains.map((domain, index) => (index ? '<span class="relationship-arrow">-&gt;</span>' : '') + '<code>' + escapeHtml(domain) + '</code>').join("") : '<span class="subtle">Keine Domaenenfolge</span>') + '</div>' +
          '<div class="relationship-flow">' + (endpoints || '<span class="subtle">Keine Beispiel-Endpunkte</span>') + '</div>' +
        '</div>';
      }).join("");
      return '<section><h2>Relationships</h2><div id="relationshipList" class="relationship-list">' +
        '<div class="endpoint">API-Responses: ' + relationships.responseCount + '<br>Domaenen: ' + relationships.domainCount + '<br>Domaenen-Kanten: ' + relationships.transitions.length + '</div>' +
        (transitions || '<div class="empty">Keine Domaenen-Wechsel beobachtet.</div>') +
        (stepFlows ? '<h2>Step-Flows</h2>' + stepFlows : '') +
      '</div></section>';
    }

    function endpointLabel(endpoint) {
      return String(endpoint.method || "-") + " " + String(endpoint.path || "-") + " (" + String(endpoint.status || "-") + ")";
    }

    function formatDate(value) {
      if (!value) return "-";
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? value : date.toLocaleString("de-DE");
    }

    function escapeHtml(value) {
      return String(value == null ? "" : value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
    }

    function escapeAttr(value) {
      return escapeHtml(value).replace(/\\n/g, "");
    }
  </script>
</body>
</html>`;
}

export function buildSwaggerUiHtml(options: { defaultSpec?: string; generatedSpec?: string; observedSpec?: string } = {}): string {
  const defaultSpec = options.defaultSpec || "openapi.cumulative.json";
  const generatedSpec = options.generatedSpec || "openapi.generated.json";
  const observedSpec = options.observedSpec || "../openapi/omnia-observed.openapi.yaml";
  return `<!doctype html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Optica Omnia Swagger API UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  <style>
    body { margin: 0; background: #f6f7f9; color: #16202a; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .topbar { position: sticky; top: 0; z-index: 20; display: flex; flex-wrap: wrap; align-items: center; gap: 12px; padding: 12px 18px; border-bottom: 1px solid #d8dee6; background: #ffffff; box-shadow: 0 8px 24px rgba(22, 32, 42, 0.08); }
    h1 { margin: 0; font-size: 18px; line-height: 1.2; }
    label { font-size: 12px; font-weight: 700; color: #647180; }
    select { height: 34px; min-width: 260px; padding: 0 10px; border: 1px solid #d8dee6; border-radius: 6px; background: #fff; color: #16202a; font: inherit; font-size: 13px; }
    .note { margin-left: auto; color: #647180; font-size: 12px; }
    #swagger-ui { max-width: 1440px; margin: 0 auto; }
    .fallback { max-width: 1200px; margin: 20px auto; padding: 16px; border: 1px solid #d8dee6; border-radius: 8px; background: #fff; }
    .fallback input { width: 100%; height: 38px; margin-bottom: 12px; padding: 0 10px; border: 1px solid #d8dee6; border-radius: 6px; }
    .fallback .endpoint { padding: 9px 0; border-top: 1px solid #edf0f3; }
    code { overflow-wrap: anywhere; }
  </style>
</head>
<body>
  <div class="topbar">
    <h1>Optica Omnia Swagger API UI</h1>
    <label for="specSelect">Spec</label>
    <select id="specSelect">
      <option value="${escapeHtmlAttr(defaultSpec)}">Cumulative JSON mit Schemas</option>
      <option value="${escapeHtmlAttr(generatedSpec)}">Generated JSON</option>
      <option value="${escapeHtmlAttr(observedSpec)}">Observed YAML</option>
    </select>
    <div class="note">Interaktiv: Authorize und Try it out sind aktiv. Nur mit Testdaten verwenden.</div>
  </div>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
  <script>
    const select = document.getElementById("specSelect");
    let ui = null;

    function renderSwagger(url) {
      document.getElementById("swagger-ui").innerHTML = "";
      if (window.SwaggerUIBundle) {
        ui = SwaggerUIBundle({
          url,
          dom_id: "#swagger-ui",
          deepLinking: true,
          tryItOutEnabled: true,
          supportedSubmitMethods: ["get", "post", "put", "patch", "delete"],
          persistAuthorization: true,
          parameterMacro: swaggerParameterDefault,
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
          layout: "StandaloneLayout",
          requestInterceptor: (request) => {
            request.credentials = "omit";
            return request;
          },
        });
        return;
      }
      renderFallback(url);
    }

    function swaggerParameterDefault(_operation, parameter) {
      const location = String(parameter?.in || "");
      if (location === "header" || location === "cookie") return undefined;
      if (parameter?.example != null) return parameter.example;
      const schema = parameter?.schema || {};
      if (schema.default != null) return schema.default;
      if (schema.example != null) return schema.example;

      const name = String(parameter?.name || "").toLowerCase();
      const type = Array.isArray(schema.type) ? schema.type.find((item) => item !== "null") : schema.type;
      if (location === "path") return pathParameterDefault(name, schema);
      if (type === "integer" || type === "number") return numericParameterDefault(name);
      if (type === "boolean") return booleanParameterDefault(name);
      if (type === "array") return stringParameterDefault(name, schema.items || schema);
      return stringParameterDefault(name, schema);
    }

    function pathParameterDefault(name, schema) {
      if (schema.format === "uuid" || name.includes("uuid")) return "00000000-0000-4000-8000-000000000000";
      if (name.endsWith("id") || name.includes("id")) return "0";
      return "test";
    }

    function numericParameterDefault(name) {
      if (name === "size" || name === "limit" || name.includes("pagesize")) return 20;
      if (name === "page" || name === "number" || name.includes("offset")) return 0;
      if (name.includes("quantity") || name.includes("amount")) return 1;
      return 0;
    }

    function booleanParameterDefault(name) {
      if (name.includes("inactive") || name.includes("deleted") || name.includes("disabled")) return false;
      return true;
    }

    function stringParameterDefault(name, schema) {
      const known = {
        active: "true",
        page: "0",
        size: "2000",
        limit: "20",
        paymenttypes: "SALE",
        sort: "created,desc",
        search: "Mustermann",
        query: "Mustermann",
        term: "Mustermann",
        lastname: "Mustermann",
        nachname: "Mustermann",
        firstname: "Max",
        vorname: "Max",
        articlename: "Musterartikel",
        article: "Musterartikel",
        artikel: "Musterartikel",
      };
      if (known[name]) return known[name];
      if (schema?.format === "uuid" || name.includes("uuid")) return "00000000-0000-4000-8000-000000000000";
      if (name.endsWith("id") || name.includes("id")) return "0";
      if (name.includes("date") || name.includes("datum")) return "2026-01-01";
      if (name.includes("email") || name.includes("mail")) return "test@example.invalid";
      if (name.includes("active")) return "true";
      if (name.includes("size")) return "2000";
      if (name.includes("page")) return "0";
      if (name.includes("paymenttype")) return "SALE";
      if (name.includes("customer") || name.includes("kunde")) return "Mustermann";
      if (name.includes("article") || name.includes("artikel")) return "Musterartikel";
      return "test";
    }

    function renderFallback(url) {
      fetch(url)
        .then((response) => response.json())
        .then((spec) => {
          const paths = spec.paths || {};
          document.getElementById("swagger-ui").innerHTML =
            '<div class="fallback"><h2>' + escapeHtml(spec.info?.title || "OpenAPI") + '</h2>' +
            '<p>Swagger UI CDN konnte nicht geladen werden. Lokaler Read-only-Fallback fuer JSON-Spec.</p>' +
            '<input id="fallbackSearch" type="search" placeholder="Endpoint suchen">' +
            '<div id="fallbackList"></div></div>';
          const render = () => {
            const query = document.getElementById("fallbackSearch").value.toLowerCase();
            const rows = [];
            for (const [path, methods] of Object.entries(paths)) {
              for (const method of Object.keys(methods)) {
                const text = method.toUpperCase() + " " + path;
                if (query && !text.toLowerCase().includes(query)) continue;
                rows.push('<div class="endpoint"><strong>' + escapeHtml(method.toUpperCase()) + '</strong> <code>' + escapeHtml(path) + '</code></div>');
              }
            }
            document.getElementById("fallbackList").innerHTML = rows.join("") || "<p>Keine Treffer.</p>";
          };
          document.getElementById("fallbackSearch").addEventListener("input", render);
          render();
        })
        .catch((error) => {
          document.getElementById("swagger-ui").innerHTML = '<div class="fallback">Spec konnte nicht geladen werden: ' + escapeHtml(error.message) + '</div>';
        });
    }

    select.addEventListener("change", () => renderSwagger(select.value));
    renderSwagger(select.value);

    function escapeHtml(value) {
      return String(value == null ? "" : value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
    }
  </script>
</body>
</html>`;
}

export function writeDocUiArtifacts(data: FlowUiData, options: DocUiOptions): void {
  fs.mkdirSync(path.dirname(options.flowDataFile), { recursive: true });
  fs.writeFileSync(options.flowDataFile, `${JSON.stringify(data, null, 2)}\n`);
  fs.mkdirSync(path.dirname(options.flowHtmlFile), { recursive: true });
  fs.writeFileSync(options.flowHtmlFile, buildFlowUiHtml({
    dataFile: path.relative(path.dirname(options.flowHtmlFile), options.flowDataFile) || path.basename(options.flowDataFile),
  }));
  fs.mkdirSync(path.dirname(options.swaggerHtmlFile), { recursive: true });
  fs.writeFileSync(options.swaggerHtmlFile, buildSwaggerUiHtml({
    defaultSpec: path.relative(path.dirname(options.swaggerHtmlFile), options.openapiJsonFile) || path.basename(options.openapiJsonFile),
    generatedSpec: path.relative(path.dirname(options.swaggerHtmlFile), path.join(defaultDocsDir, "openapi.generated.json")),
    observedSpec: path.relative(path.dirname(options.swaggerHtmlFile), options.observedOpenapiFile) || path.basename(options.observedOpenapiFile),
  }));
}

function loadFlowUiInputs(recordingsDir: string): FlowUiInput[] {
  if (!fs.existsSync(recordingsDir)) return [];
  return fs
    .readdirSync(recordingsDir)
    .filter((file) => file.endsWith("-workflow-manifest.json"))
    .sort()
    .map((file) => {
      const manifestFile = path.join(recordingsDir, file);
      const manifest = readJsonFile(manifestFile);
      const artifacts = manifestRecord(manifest).artifacts;
      const logFile = stringField(artifacts, "logFile");
      return {
        manifestFile,
        manifest,
        logFile,
        records: readJsonLines(logFile),
      };
    });
}

function buildFlowUiRecording(input: FlowUiInput, root: string): FlowUiRecording {
  const manifest = manifestRecord(input.manifest);
  const artifactsRecord = asRecord(manifest.artifacts);
  const logFile = input.logFile || stringField(artifactsRecord, "logFile");
  const records = input.records || readJsonLines(logFile);
  const baseTime = recordingBaseTime(records);
  const steps = collectFlowUiSteps(records, baseTime);
  const endpoints = collectFlowUiEndpoints(records);
  const relationships = collectFlowUiRelationships(records);
  const startedAt = stringField(manifest, "startedAt") || firstTimestamp(records);
  const completedAt = stringField(manifest, "completedAt");
  const manifestFile = input.manifestFile || stringField(artifactsRecord, "manifestFile");

  return {
    id: recordingId(input, logFile, manifestFile),
    label: recordingLabel(input, logFile, manifestFile),
    mode: stringField(manifest, "mode"),
    purpose: stringField(manifest, "purpose"),
    status: stringField(manifest, "status"),
    auditStatus: stringField(manifest, "auditStatus"),
    startedAt,
    completedAt,
    durationSeconds: durationSeconds(startedAt, completedAt),
    artifacts: sanitizeArtifacts(artifactsRecord, root),
    expectedEndpoints: expectedEndpoints(manifest.expectedEndpoints),
    impact: impactSummary(manifest.impact),
    endpoints,
    steps,
    relationships,
  };
}

function collectFlowUiSteps(records: Record<string, unknown>[], baseTime: number | null): FlowUiStep[] {
  const byName = new Map<string, FlowUiStep>();
  const order: FlowUiStep[] = [];
  let currentStepName = "";
  const stepFor = (value: unknown, timestamp: unknown): FlowUiStep => {
    const name = redactStepLabel(value || "Ohne Marker");
    const existing = byName.get(name);
    if (existing) {
      if (!existing.startedAt && timestamp) existing.startedAt = String(timestamp);
      if (existing.offset === "+00:00" && timestamp) existing.offset = formatOffset(String(timestamp), baseTime);
      return existing;
    }
    const step: FlowUiStep = {
      name,
      startedAt: String(timestamp || ""),
      offset: formatOffset(String(timestamp || ""), baseTime),
      apiCalls: [],
      uiSnapshots: [],
      downloads: [],
      events: [],
    };
    byName.set(name, step);
    order.push(step);
    return step;
  };

  for (const record of records) {
    if (isStepStartMarker(record)) {
      currentStepName = redactStepLabel(record.step || "Ohne Marker");
      stepFor(currentStepName, record.timestamp);
      continue;
    }
    const stepName = timelineStepLabel(record.step, currentStepName);
    if (record.type === "response" && isApiTrafficRecord(record)) {
      const step = stepFor(stepName, record.timestamp);
      step.apiCalls.push(apiCall(record, baseTime));
      continue;
    }
    if (record.type === "ui-snapshot") {
      const step = stepFor(stepName, record.timestamp);
      step.uiSnapshots.push(uiSnapshot(record, baseTime));
      continue;
    }
    if (record.type === "download") {
      const step = stepFor(stepName, record.timestamp);
      step.downloads.push(downloadEvent(record, baseTime));
      continue;
    }
    if (record.type === "navigation" || record.type === "browser-console" || record.type === "browser-pageerror") {
      const step = stepFor(stepName, record.timestamp);
      step.events.push(browserEvent(record, baseTime));
    }
  }

  return order;
}

function collectFlowUiEndpoints(records: Record<string, unknown>[]): FlowUiEndpoint[] {
  const byKey = new Map<string, MutableEndpoint>();
  for (const record of records) {
    if (record.type !== "response" || !isApiTrafficRecord(record)) continue;
    const call = apiCall(record, recordingBaseTime(records));
    const key = `${call.method} ${call.path}`;
    const existing = byKey.get(key) || {
      key,
      method: call.method,
      host: call.host,
      path: call.path,
      count: 0,
      statusSet: new Set<number>(),
      resourceTypeSet: new Set<string>(),
      stepSet: new Set<string>(),
    };
    existing.count += 1;
    if (call.status !== null) existing.statusSet.add(call.status);
    if (call.resourceType) existing.resourceTypeSet.add(call.resourceType);
    existing.stepSet.add(redactStepLabel(record.step || "Ohne Marker"));
    byKey.set(key, existing);
  }
  return materializeEndpoints([...byKey.values()]);
}

function collectFlowUiRelationships(records: Record<string, unknown>[]): FlowUiRelationships {
  const relationships = buildOmniaRelationships(recordsWithTimelineSteps(records), { generatedAt: new Date(0) });
  return {
    responseCount: relationships.responseCount,
    domainCount: relationships.domainCount,
    transitions: relationships.transitions.map(sanitizeRelationshipTransition),
    stepFlows: relationships.stepFlows.map(sanitizeRelationshipStepFlow),
  };
}

function recordsWithTimelineSteps(records: Record<string, unknown>[]): Record<string, unknown>[] {
  let currentStepName = "";
  return records.map((record) => {
    if (isStepStartMarker(record)) {
      currentStepName = redactStepLabel(record.step || "Ohne Marker");
      return { ...record, step: currentStepName };
    }
    return { ...record, step: timelineStepLabel(record.step, currentStepName) };
  });
}

function sanitizeRelationshipTransition(transition: RelationshipTransition): RelationshipTransition {
  return {
    fromArea: redactText(transition.fromArea),
    toArea: redactText(transition.toArea),
    count: transition.count,
    steps: [...new Set(transition.steps.map(redactStepLabel))].sort(),
    examples: transition.examples.map((example) => ({
      from: sanitizeRelationshipEndpoint(example.from),
      to: sanitizeRelationshipEndpoint(example.to),
    })),
  };
}

function sanitizeRelationshipStepFlow(flow: RelationshipStepFlow): RelationshipStepFlow {
  return {
    step: redactStepLabel(flow.step),
    responseCount: flow.responseCount,
    domains: flow.domains.map(redactText),
    endpoints: flow.endpoints.map(sanitizeRelationshipEndpoint),
  };
}

function sanitizeRelationshipEndpoint(endpoint: RelationshipEndpoint): RelationshipEndpoint {
  return {
    method: redactText(endpoint.method).toUpperCase(),
    path: normalizeDisplayUrl(endpoint.path),
    area: redactText(endpoint.area),
    status: endpoint.status,
  };
}

function mergeEndpoints(endpoints: FlowUiEndpoint[]): FlowUiEndpoint[] {
  const byKey = new Map<string, MutableEndpoint>();
  for (const endpoint of endpoints) {
    const existing = byKey.get(endpoint.key) || {
      key: endpoint.key,
      method: endpoint.method,
      host: endpoint.host,
      path: endpoint.path,
      count: 0,
      statusSet: new Set<number>(),
      resourceTypeSet: new Set<string>(),
      stepSet: new Set<string>(),
    };
    existing.count += endpoint.count;
    endpoint.statuses.forEach((status) => existing.statusSet.add(status));
    endpoint.resourceTypes.forEach((resourceType) => existing.resourceTypeSet.add(resourceType));
    endpoint.steps.forEach((step) => existing.stepSet.add(step));
    byKey.set(endpoint.key, existing);
  }
  return materializeEndpoints([...byKey.values()]);
}

function materializeEndpoints(values: MutableEndpoint[]): FlowUiEndpoint[] {
  return values
    .map((endpoint) => ({
      key: endpoint.key,
      method: endpoint.method,
      host: endpoint.host,
      path: endpoint.path,
      count: endpoint.count,
      statuses: [...endpoint.statusSet].sort((a, b) => a - b),
      resourceTypes: [...endpoint.resourceTypeSet].sort(),
      steps: [...endpoint.stepSet].sort(),
    }))
    .sort((a, b) => b.count - a.count || a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
}

function apiCall(record: Record<string, unknown>, baseTime: number | null): FlowUiApiCall {
  const url = parseUrl(String(record.url || ""));
  const status = Number(record.status || 0);
  return {
    offset: formatOffset(String(record.timestamp || ""), baseTime),
    method: String(record.method || "GET").toUpperCase(),
    host: url.host,
    path: normalizeObservedPath(url.pathname || "/"),
    status: Number.isFinite(status) && status > 0 ? status : null,
    resourceType: String(record.resourceType || ""),
  };
}

function uiSnapshot(record: Record<string, unknown>, baseTime: number | null): FlowUiSnapshot {
  return {
    offset: formatOffset(String(record.timestamp || ""), baseTime),
    path: normalizeDisplayUrl(String(record.path || "")),
    title: redactText(record.title),
    headings: stringList(record.headings).map(redactText),
    actions: stringList(record.actions).map(redactUiLabel),
    formLabels: stringList(record.formLabels).map(redactUiLabel),
    tableHeaders: stringList(record.tableHeaders).map(redactUiLabel),
  };
}

function downloadEvent(record: Record<string, unknown>, baseTime: number | null): FlowUiDownload {
  return {
    offset: formatOffset(String(record.timestamp || ""), baseTime),
    url: normalizeDisplayUrl(redactUrl(String(record.url || ""))),
    extension: redactText(record.suggestedFileExtension),
  };
}

function browserEvent(record: Record<string, unknown>, baseTime: number | null): FlowUiEvent {
  if (record.type === "navigation") {
    return {
      offset: formatOffset(String(record.timestamp || ""), baseTime),
      kind: "Navigation",
      detail: normalizeDisplayUrl(redactUrl(String(record.url || ""))),
    };
  }
  return {
    offset: formatOffset(String(record.timestamp || ""), baseTime),
    kind: record.type === "browser-console" ? `Console ${redactText(record.level || "message")}` : "Page error",
    detail: redactText(record.type === "browser-console" ? record.text : record.message),
  };
}

function sanitizeArtifacts(artifacts: Record<string, unknown>, root: string): Record<string, string> {
  const keys = [
    "logFile",
    "flowReportFile",
    "flowMappingFile",
    "catalogFile",
    "openApiFile",
    "coverageReportFile",
    "knowledgeReportFile",
    "relationshipsFile",
    "dataModelFile",
    "blueprintFile",
    "uiMapFile",
    "scoreboardFile",
    "campaignFile",
    "impactFile",
    "impactJsonFile",
    "auditFile",
    "summaryFile",
    "manifestFile",
  ];
  const result: Record<string, string> = {};
  for (const key of keys) {
    const value = stringField(artifacts, key);
    if (value) result[key] = relativeArtifact(value, root);
  }
  return result;
}

function expectedEndpoints(value: unknown): FlowUiExpectedEndpoint[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const record = asRecord(item);
    return {
      method: stringField(record, "method").toUpperCase(),
      path: stringField(record, "path"),
      observed: record.observed === true,
      source: stringField(record, "source"),
    };
  }).filter((endpoint) => endpoint.method && endpoint.path);
}

function impactSummary(value: unknown): FlowUiImpact {
  const record = asRecord(value);
  return {
    targetResponses: numberField(record, "targetResponses"),
    targetEndpointCount: numberField(record, "targetEndpointCount"),
    newEndpointCount: numberField(record, "newEndpointCount"),
    newKnownInventoryCount: numberField(record, "newKnownInventoryCount"),
    coverageDeltaPercent: numberField(record, "coverageDeltaPercent"),
    downloads: numberField(record, "downloads"),
    topAreas: Array.isArray(record.topAreas)
      ? record.topAreas.map((item) => {
        const area = asRecord(item);
        return {
          area: stringField(area, "area"),
          endpointCount: numberField(area, "endpointCount"),
          newEndpointCount: numberField(area, "newEndpointCount"),
          responseCount: numberField(area, "responseCount"),
        };
      }).filter((area) => area.area)
      : [],
  };
}

function manifestRecord(value: unknown): Record<string, unknown> & { artifacts?: unknown; expectedEndpoints?: unknown; impact?: unknown } {
  return asRecord(value) as Record<string, unknown> & { artifacts?: unknown; expectedEndpoints?: unknown; impact?: unknown };
}

function isStepStartMarker(record: Record<string, unknown>): boolean {
  return (
    (record.type === "flow-marker" && record.marker === "step-start")
    || (record.type === "explore-marker" && record.marker === "target-start")
  );
}

function recordingId(input: FlowUiInput, logFile: string, manifestFile: string): string {
  return path.basename(manifestFile || logFile || input.manifestFile || "recording").replace(/\.jsonl$|\.json$/g, "");
}

function recordingLabel(input: FlowUiInput, logFile: string, manifestFile: string): string {
  const base = path.basename(manifestFile || logFile || input.manifestFile || "recording");
  return base.replace(/-workflow-manifest\.json$/, "").replace(/\.jsonl$/, "");
}

function relativeArtifact(value: string, root: string): string {
  if (!value) return "";
  if (!path.isAbsolute(value)) return value;
  const relative = path.relative(root, value);
  return relative && !relative.startsWith("..") ? relative : value;
}

function readJsonLines(file: string): Record<string, unknown>[] {
  if (!file || !fs.existsSync(file)) return [];
  return fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return { type: "parse-error" };
      }
    });
}

function readJsonFile(file: string): unknown {
  if (!file || !fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function recordingBaseTime(records: Record<string, unknown>[]): number | null {
  for (const record of records) {
    const time = Date.parse(String(record.timestamp || ""));
    if (Number.isFinite(time)) return time;
  }
  return null;
}

function firstTimestamp(records: Record<string, unknown>[]): string {
  for (const record of records) {
    const value = String(record.timestamp || "");
    if (value) return value;
  }
  return "";
}

function formatOffset(timestamp: string, baseTime: number | null): string {
  const time = Date.parse(timestamp);
  if (baseTime === null || !Number.isFinite(time)) return "+00:00";
  const seconds = Math.max(0, Math.floor((time - baseTime) / 1000));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `+${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function durationSeconds(startedAt: string, completedAt: string): number | null {
  const start = Date.parse(startedAt);
  const end = Date.parse(completedAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  return Math.round((end - start) / 1000);
}

function redactStepLabel(value: unknown): string {
  const raw = String(value || "").replace(/\s+/g, " ").trim();
  const redacted = redactUiLabel(raw).trim();
  if (!redacted) return "Ohne Marker";
  if (redacted.includes("[REDACTED]") && looksLikeUiRowStep(raw)) return "UI-Zeile [REDACTED]";
  return redacted;
}

function timelineStepLabel(value: unknown, currentStepName: string): string {
  const redacted = redactStepLabel(value || "Ohne Marker");
  if (redacted === "UI-Zeile [REDACTED]" && currentStepName) return currentStepName;
  return redacted;
}

function looksLikeUiRowStep(value: string): boolean {
  return /^\d+[\.)]\s+/.test(value) || /\d{3,}/.test(value);
}

function normalizeDisplayUrl(value: string): string {
  const text = String(value || "");
  try {
    const url = new URL(text);
    return `${url.pathname}${url.search}${url.hash}`
      .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "{uuid}")
      .replace(/\/\d+(?=\/|\?|#|$)/g, "/{id}");
  } catch {
    return text
      .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "{uuid}")
      .replace(/\/\d+(?=\/|\?|#|$)/g, "/{id}");
  }
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || "")).filter(Boolean);
}

function stringField(record: Record<string, unknown>, key: string): string {
  return String(record[key] || "");
}

function numberField(record: Record<string, unknown>, key: string): number {
  const value = Number(record[key] || 0);
  return Number.isFinite(value) ? value : 0;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function parseUrl(value: string): URL {
  try {
    return new URL(value);
  } catch {
    return new URL("https://unknown.invalid/");
  }
}

function normalizedDate(value: Date | string | undefined): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

function valueAfter(argv: string[], flag: string): string {
  const index = argv.indexOf(flag);
  if (index < 0) return "";
  return argv[index + 1] || "";
}

function escapeHtmlAttr(value: string): string {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char] || char));
}

function isMainModule(): boolean {
  return process.argv[1] ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;
}
