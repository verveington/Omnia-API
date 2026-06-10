import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadKnownEndpoints, type KnownEndpoint } from "./coverage-report.ts";
import {
  buildOmniaKnowledge,
  type KnowledgeDomain,
  type OmniaKnowledgeReport,
} from "./omnia-knowledge.ts";
import {
  buildOmniaDataModel,
  type DataModelEntity,
  type OmniaDataModel,
} from "./omnia-data-model.ts";
import {
  buildOmniaRelationships,
  type OmniaRelationshipMap,
} from "./omnia-relationships.ts";
import {
  buildOmniaUiMap,
  type OmniaUiApiEndpoint,
  type OmniaUiMap,
  type OmniaUiSurface,
  type OmniaUiTarget,
} from "./omnia-ui-map.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..");
const defaultOutputFile = path.join(workspaceRoot, "docs", "11_platform_blueprint.md");

export type PlatformBlueprintOptions = {
  outputFile: string;
  generatedAt?: Date;
};

export type PlatformStage = "foundation" | "mvp" | "later" | "discovery";
export type PlatformConfidence = "high" | "medium" | "low";

export type PlatformModule = {
  area: string;
  moduleName: string;
  stage: PlatformStage;
  confidence: PlatformConfidence;
  reason: string;
  observedResponses: number;
  observedEndpoints: number;
  knownEndpoints: number;
  observedKnownEndpoints: number;
  missingKnownEndpoints: number;
  coveragePercent: number;
  coreObjects: string[];
  dataEntities: PlatformDataEntity[];
  connectedAreas: PlatformConnectedArea[];
  uiSurfaces: PlatformUiSurface[];
  capabilities: string[];
  apiGaps: KnownEndpoint[];
};

export type PlatformDataEntity = {
  name: string;
  sampleCount: number;
  fieldCount: number;
  sourceKinds: string[];
};

export type PlatformConnectedArea = {
  area: string;
  incomingCount: number;
  outgoingCount: number;
};

export type PlatformUiSurface = {
  label: string;
  kind: string;
  path: string;
  clickedCount: number;
  openCount: number;
  apiEndpointCount: number;
  apiEndpoints?: OmniaUiApiEndpoint[];
  title?: string;
  headings?: string[];
  actions?: string[];
  formLabels?: string[];
  tableHeaders?: string[];
  sourceCount?: number;
};

export type PlatformBlueprint = {
  generatedAt: string;
  sourceGeneratedAt: string;
  sourceCoveragePercent: number;
  knownEndpointCount: number;
  observedKnownEndpointCount: number;
  missingKnownEndpointCount: number;
  modules: PlatformModule[];
};

if (isMainModule()) {
  const options = parsePlatformBlueprintArgs(process.argv.slice(2));
  const logInputs = resolveInputFiles(process.argv.slice(2)).map((file) => ({ file, records: readJsonLines(file) }));
  const records = logInputs.flatMap((input) => input.records);
  const knowledge = buildOmniaKnowledge(records, { knownEndpoints: loadKnownEndpoints() });
  const dataModel = buildOmniaDataModel(records);
  const relationships = buildOmniaRelationships(records);
  const uiMap = buildOmniaUiMap(logInputs.map((input) => ({
    logFile: input.file,
    records: input.records,
    manifestFile: workflowManifestFileForLog(input.file),
    manifest: readJsonFile(workflowManifestFileForLog(input.file)),
  })));
  const blueprint = buildPlatformBlueprint(knowledge, { ...options, dataModel, relationships, uiMap });
  writePlatformBlueprint(blueprint, options.outputFile);
  console.log(`Plattform-Blueprint: ${options.outputFile}`);
  console.log(`Module: ${blueprint.modules.length}`);
  console.log(`Coverage: ${formatPercent(blueprint.sourceCoveragePercent)} %`);
}

export function parsePlatformBlueprintArgs(argv: string[]): PlatformBlueprintOptions {
  return {
    outputFile: path.resolve(valueAfter(argv, "--out") || defaultOutputFile),
  };
}

export function buildPlatformBlueprint(
  knowledge: OmniaKnowledgeReport,
  options: { generatedAt?: Date; dataModel?: OmniaDataModel; relationships?: OmniaRelationshipMap; uiMap?: OmniaUiMap } = {},
): PlatformBlueprint {
  const dataEntitiesByArea = buildDataEntitiesByArea(options.dataModel);
  const connectedAreasByArea = buildConnectedAreasByArea(options.relationships);
  const uiSurfacesByArea = buildUiSurfacesByArea(options.uiMap);
  return {
    generatedAt: (options.generatedAt || new Date()).toISOString(),
    sourceGeneratedAt: knowledge.generatedAt,
    sourceCoveragePercent: knowledge.coveragePercent,
    knownEndpointCount: knowledge.knownEndpointCount,
    observedKnownEndpointCount: knowledge.observedKnownEndpointCount,
    missingKnownEndpointCount: knowledge.missingKnownEndpointCount,
    modules: knowledge.domains
      .map((domain) => buildPlatformModule(domain, {
        dataEntities: dataEntitiesByArea.get(domain.area) || [],
        connectedAreas: connectedAreasByArea.get(domain.area) || [],
        uiSurfaces: uiSurfacesByArea.get(domain.area) || [],
      }))
      .sort(comparePlatformModules),
  };
}

export function buildPlatformBlueprintMarkdown(blueprint: PlatformBlueprint): string {
  const lines = [
    "# Plattform-Blueprint",
    "",
    `Generiert: ${blueprint.generatedAt}`,
    `Knowledge-Stand: ${blueprint.sourceGeneratedAt}`,
    "",
    "Hinweis: Dieser Blueprint ist eine Ableitung aus redacted API-Aufzeichnungen und statischem Endpoint-Inventar. Er ist eine Bau- und Recording-Priorisierung, keine fertige Fachspezifikation.",
    "",
    "## Zusammenfassung",
    "",
    `- Module: ${blueprint.modules.length}`,
    `- Inventar-Coverage: ${formatPercent(blueprint.sourceCoveragePercent)} %`,
    `- Known/Observed/Missing: ${blueprint.knownEndpointCount} / ${blueprint.observedKnownEndpointCount} / ${blueprint.missingKnownEndpointCount}`,
    "",
    "## MVP-Reihenfolge",
    "",
    "| Reihenfolge | Stufe | Modul | Fachbereich | Confidence | Known/Observed/Missing | Warum |",
    "|---:|---|---|---|---|---|---|",
  ];

  blueprint.modules.forEach((module, index) => {
    lines.push(
      `| ${index + 1} | ${module.stage} | ${escapeTable(module.moduleName)} | ${escapeTable(module.area)} | ${module.confidence} | ${module.knownEndpoints} / ${module.observedKnownEndpoints} / ${module.missingKnownEndpoints} | ${escapeTable(module.reason)} |`,
    );
  });

  lines.push("", "## Module", "");
  for (const module of blueprint.modules) {
    lines.push(`### ${module.moduleName}`, "");
    lines.push(`- Fachbereich: ${module.area}`);
    lines.push(`- Stufe: ${module.stage}`);
    lines.push(`- Confidence: ${module.confidence}`);
    lines.push(`- Observed Responses/Endpoints: ${module.observedResponses} / ${module.observedEndpoints}`);
    lines.push(`- Inventar-Coverage: ${formatPercent(module.coveragePercent)} %`);
    lines.push(`- Known/Observed/Missing: ${module.knownEndpoints} / ${module.observedKnownEndpoints} / ${module.missingKnownEndpoints}`);
    lines.push(`- Begruendung: ${module.reason}`);
    lines.push(`- Kernobjekte: ${module.coreObjects.join(", ") || "noch offen"}`);
    lines.push("- Beobachtete Datenobjekte:");
    if (module.dataEntities.length === 0) {
      lines.push("  - keine strukturierten Bodies beobachtet");
    } else {
      for (const entity of module.dataEntities.slice(0, 8)) {
        lines.push(`  - ${entity.name} (${entity.sampleCount} Samples, ${entity.fieldCount} Felder) - Quellen: ${entity.sourceKinds.join(", ")}`);
      }
      if (module.dataEntities.length > 8) lines.push(`  - ... ${module.dataEntities.length - 8} weitere`);
    }
    lines.push("- Beobachtete Schnittstellen:");
    if (module.connectedAreas.length === 0) {
      lines.push("  - keine Domaenen-Kanten beobachtet");
    } else {
      for (const connection of module.connectedAreas.slice(0, 8)) {
        lines.push(`  - ${connection.area} (incoming ${connection.incomingCount}, outgoing ${connection.outgoingCount})`);
      }
      if (module.connectedAreas.length > 8) lines.push(`  - ... ${module.connectedAreas.length - 8} weitere`);
    }
    lines.push("- Beobachtete UI-Surfaces:");
    if (module.uiSurfaces.length === 0) {
      lines.push("  - keine UI-Ziele mit API-Bezug beobachtet");
    } else {
      for (const surface of module.uiSurfaces.slice(0, 8)) {
        lines.push(`  - ${surface.label} - ${surface.kind} \`${surface.path || "-"}\` (${surface.apiEndpointCount} API-Endpunkte, clicked ${surface.clickedCount}, offen ${surface.openCount})`);
        if (surface.headings && surface.headings.length > 0) lines.push(`    - Ueberschriften: ${surface.headings.slice(0, 6).join(", ")}`);
        if (surface.actions && surface.actions.length > 0) lines.push(`    - Aktionen: ${surface.actions.slice(0, 6).join(", ")}`);
        if (surface.formLabels && surface.formLabels.length > 0) lines.push(`    - Formularfelder: ${surface.formLabels.slice(0, 6).join(", ")}`);
        if (surface.tableHeaders && surface.tableHeaders.length > 0) lines.push(`    - Tabellen: ${surface.tableHeaders.slice(0, 6).join(", ")}`);
        if (surface.apiEndpoints && surface.apiEndpoints.length > 0) lines.push(`    - APIs: ${formatSurfaceApiEndpoints(surface.apiEndpoints)}`);
      }
      if (module.uiSurfaces.length > 8) lines.push(`  - ... ${module.uiSurfaces.length - 8} weitere`);
    }
    lines.push("- Erwartete Funktionen:");
    for (const capability of module.capabilities) lines.push(`  - ${capability}`);
    lines.push("- Wichtigste API-Luecken:");
    if (module.apiGaps.length === 0) {
      lines.push("  - keine aus dem Inventar offen");
    } else {
      for (const endpoint of module.apiGaps.slice(0, 8)) {
        lines.push(`  - ${endpoint.method} \`${endpoint.path}\``);
      }
    }
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

export function writePlatformBlueprint(blueprint: PlatformBlueprint, outputFile = defaultOutputFile): string {
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, buildPlatformBlueprintMarkdown(blueprint));
  return outputFile;
}

function buildPlatformModule(
  domain: KnowledgeDomain,
  enrichment: { dataEntities: PlatformDataEntity[]; connectedAreas: PlatformConnectedArea[]; uiSurfaces: PlatformUiSurface[] },
): PlatformModule {
  return {
    area: domain.area,
    moduleName: moduleName(domain.area),
    stage: moduleStage(domain),
    confidence: moduleConfidence(domain),
    reason: moduleReason(domain),
    observedResponses: domain.responseCount,
    observedEndpoints: domain.endpointCount,
    knownEndpoints: domain.coverage.knownEndpoints,
    observedKnownEndpoints: domain.coverage.observedKnownEndpoints,
    missingKnownEndpoints: domain.coverage.missingKnownEndpoints,
    coveragePercent: domain.coverage.coveragePercent,
    coreObjects: coreObjects(domain.area),
    dataEntities: enrichment.dataEntities,
    connectedAreas: enrichment.connectedAreas,
    uiSurfaces: enrichment.uiSurfaces,
    capabilities: capabilities(domain.area),
    apiGaps: domain.coverage.missingExamples,
  };
}

function buildDataEntitiesByArea(dataModel: OmniaDataModel | undefined): Map<string, PlatformDataEntity[]> {
  const result = new Map<string, PlatformDataEntity[]>();
  if (!dataModel) return result;

  for (const entity of dataModel.entities) {
    const items = result.get(entity.area) || [];
    items.push(platformDataEntity(entity));
    result.set(entity.area, items);
  }

  for (const [area, items] of result.entries()) {
    result.set(area, items.sort((a, b) => b.sampleCount - a.sampleCount || b.fieldCount - a.fieldCount || a.name.localeCompare(b.name)));
  }
  return result;
}

function platformDataEntity(entity: DataModelEntity): PlatformDataEntity {
  return {
    name: entity.name,
    sampleCount: entity.sampleCount,
    fieldCount: entity.fields.length,
    sourceKinds: entity.sourceKinds,
  };
}

function buildConnectedAreasByArea(relationships: OmniaRelationshipMap | undefined): Map<string, PlatformConnectedArea[]> {
  const groups = new Map<string, Map<string, PlatformConnectedArea>>();
  if (!relationships) return groups;

  for (const transition of relationships.transitions) {
    addConnectedArea(groups, transition.fromArea, transition.toArea, 0, transition.count);
    addConnectedArea(groups, transition.toArea, transition.fromArea, transition.count, 0);
  }

  const result = new Map<string, PlatformConnectedArea[]>();
  for (const [area, connections] of groups.entries()) {
    result.set(area, [...connections.values()].sort((a, b) => (b.incomingCount + b.outgoingCount) - (a.incomingCount + a.outgoingCount) || a.area.localeCompare(b.area)));
  }
  return result;
}

function addConnectedArea(
  groups: Map<string, Map<string, PlatformConnectedArea>>,
  area: string,
  connectedArea: string,
  incomingCount: number,
  outgoingCount: number,
): void {
  const connections = groups.get(area) || new Map<string, PlatformConnectedArea>();
  const connection = connections.get(connectedArea) || {
    area: connectedArea,
    incomingCount: 0,
    outgoingCount: 0,
  };
  connection.incomingCount += incomingCount;
  connection.outgoingCount += outgoingCount;
  connections.set(connectedArea, connection);
  groups.set(area, connections);
}

function buildUiSurfacesByArea(uiMap: OmniaUiMap | undefined): Map<string, PlatformUiSurface[]> {
  const result = new Map<string, PlatformUiSurface[]>();
  if (!uiMap) return result;

  for (const target of uiMap.targets) {
    for (const area of target.apiAreas) {
      const items = result.get(area) || [];
      items.push(platformUiSurface(target));
      result.set(area, items);
    }
  }

  for (const surface of uiMap.surfaces || []) {
    const area = areaFromUiSurface(surface);
    if (!area) continue;
    const items = result.get(area) || [];
    items.push(platformUiStructureSurface(surface));
    result.set(area, items);
  }

  for (const [area, items] of result.entries()) {
    result.set(area, items.sort(compareUiSurfaces));
  }
  return result;
}

function platformUiSurface(target: OmniaUiTarget): PlatformUiSurface {
  return {
    label: target.label,
    kind: target.kind,
    path: target.path,
    clickedCount: target.clickedCount,
    openCount: target.openCount,
    apiEndpointCount: target.apiEndpointCount,
    apiEndpoints: target.apiEndpoints,
  };
}

function platformUiStructureSurface(surface: OmniaUiSurface): PlatformUiSurface {
  return {
    label: surface.title || surface.path,
    kind: "surface",
    path: surface.path,
    clickedCount: 0,
    openCount: 0,
    apiEndpointCount: surface.apiEndpointCount,
    apiEndpoints: surface.apiEndpoints,
    title: surface.title,
    headings: surface.headings,
    actions: surface.actions,
    formLabels: surface.formLabels,
    tableHeaders: surface.tableHeaders,
    sourceCount: surface.sourceCount,
  };
}

function compareUiSurfaces(a: PlatformUiSurface, b: PlatformUiSurface): number {
  return b.apiEndpointCount - a.apiEndpointCount
    || b.clickedCount - a.clickedCount
    || surfaceKindRank(a.kind) - surfaceKindRank(b.kind)
    || a.label.localeCompare(b.label, "de")
    || a.path.localeCompare(b.path);
}

function surfaceKindRank(kind: string): number {
  return kind === "surface" ? 1 : 0;
}

function formatSurfaceApiEndpoints(endpoints: OmniaUiApiEndpoint[]): string {
  return endpoints
    .slice(0, 4)
    .map((endpoint) => `${endpoint.method} \`${endpoint.path}\` (${endpoint.count}x)`)
    .join(", ");
}

function areaFromUiSurface(surface: OmniaUiSurface): string {
  if (surface.apiAreas.length > 0) return surface.apiAreas[0];
  const value = `${surface.path} ${surface.title} ${surface.headings.join(" ")}`.toLowerCase();
  if (/(customer|customers|kunde|kunden|vorgang|vorgaenge|salesprocess)/.test(value)) return "Kunden/Vorgaenge";
  if (/(article|articles|artikel|bestand|stock|merchandise)/.test(value)) return "Artikel/Warenbestand";
  if (/(order|orders|bestellung|bestellvorschlag|wareneingang|wawi)/.test(value)) return "Warenwirtschaft/Bestellung";
  if (/(accounting|kasse|rechnung|invoice|payment|datev|bon)/.test(value)) return "Abrechnung/Kasse";
  if (/(workspace|user|benutzer|mandant|rechte|feature)/.test(value)) return "User/Workspace";
  if (/(filiale|firma|company|department|abteilung)/.test(value)) return "Filialen/Mandant";
  if (/(document|dokument|archive|archiv|pdf|druck)/.test(value)) return "Dokumente/Archiv";
  if (/(mail|kim|task|aufgabe|reminder|notification|benachrichtigung)/.test(value)) return "Kommunikation/Aufgaben";
  if (/(hilfsmittel|hmv|aid)/.test(value)) return "Hilfsmittel";
  if (/(route|tour)/.test(value)) return "Touren/Routenplanung";
  return "";
}

function comparePlatformModules(a: PlatformModule, b: PlatformModule): number {
  return stageRank(a.stage) - stageRank(b.stage)
    || confidenceRank(a.confidence) - confidenceRank(b.confidence)
    || b.observedResponses - a.observedResponses
    || b.missingKnownEndpoints - a.missingKnownEndpoints
    || a.area.localeCompare(b.area);
}

function stageRank(stage: PlatformStage): number {
  if (stage === "foundation") return 0;
  if (stage === "mvp") return 1;
  if (stage === "later") return 2;
  return 3;
}

function confidenceRank(confidence: PlatformConfidence): number {
  if (confidence === "high") return 0;
  if (confidence === "medium") return 1;
  return 2;
}

function moduleStage(domain: KnowledgeDomain): PlatformStage {
  if (["User/Workspace", "Auth/Identity", "Referenzdaten", "Filialen/Mandant"].includes(domain.area)) return "foundation";
  if (["Kunden/Vorgaenge", "Artikel/Warenbestand", "Warenwirtschaft/Bestellung", "Abrechnung/Kasse"].includes(domain.area)) return "mvp";
  if (domain.responseCount === 0) return "discovery";
  return "later";
}

function moduleConfidence(domain: KnowledgeDomain): PlatformConfidence {
  if (domain.responseCount === 0) return "low";
  if (domain.coverage.coveragePercent >= 60 || (domain.responseCount >= 20 && domain.endpointCount >= 5)) return "high";
  if (domain.responseCount > 0 || domain.coverage.observedKnownEndpoints > 0) return "medium";
  return "low";
}

function moduleReason(domain: KnowledgeDomain): string {
  if (domain.responseCount === 0) return "Noch nicht beobachtet; zuerst gezielt recorden.";
  if (domain.coverage.missingKnownEndpoints > domain.coverage.observedKnownEndpoints) {
    return "Grundstruktur sichtbar, aber Inventar-Coverage ist noch niedrig.";
  }
  return "Ausreichend beobachtet fuer ersten Plattform-Schnitt.";
}

function moduleName(area: string): string {
  if (area === "Kunden/Vorgaenge") return "Kundenakte und Vorgangsmanagement";
  if (area === "Artikel/Warenbestand") return "Artikelkatalog und Bestand";
  if (area === "Warenwirtschaft/Bestellung") return "Beschaffung und Bestellung";
  if (area === "Abrechnung/Kasse") return "Abrechnung und Kasse";
  if (area === "User/Workspace") return "Mandant, Benutzer und Rechte";
  if (area === "Filialen/Mandant") return "Organisation und Filialen";
  if (area === "Referenzdaten") return "Referenzdaten und Konfiguration";
  if (area === "Dokumente/Archiv") return "Dokumente und Archiv";
  if (area === "Kommunikation/Aufgaben") return "Kommunikation und Aufgaben";
  if (area === "Hilfsmittel") return "Hilfsmittelverwaltung";
  return area;
}

function coreObjects(area: string): string[] {
  if (area === "Kunden/Vorgaenge") return ["Kunde", "Vorgang", "Kostentraeger", "Arztbezug", "Notiz"];
  if (area === "Artikel/Warenbestand") return ["Artikel", "Artikelkit", "Lieferantenzuordnung", "Preis", "Bestand"];
  if (area === "Warenwirtschaft/Bestellung") return ["Bestellvorschlag", "Bestellung", "Wareneingang", "Lieferant", "Lagerort"];
  if (area === "Abrechnung/Kasse") return ["Rechnung", "Bon", "Kassenbuch", "Zahlungsbedingung", "DATEV-Export"];
  if (area === "User/Workspace") return ["Benutzer", "Workspace", "FeatureToggle", "Navigation", "Praeferenz"];
  if (area === "Filialen/Mandant") return ["Firma", "Filiale", "Abteilung", "IK", "Mandantenpraeferenz"];
  if (area === "Referenzdaten") return ["Enum", "Land", "Steuersatz", "Materialgruppe"];
  if (area === "Dokumente/Archiv") return ["Dokument", "Vorlage", "Archivdatei", "Druckauftrag"];
  if (area === "Kommunikation/Aufgaben") return ["Mail", "Aufgabe", "Reminder", "Notification"];
  if (area === "Hilfsmittel") return ["Hilfsmittel", "Art", "Termin", "Trait", "Route"];
  return [];
}

function capabilities(area: string): string[] {
  if (area === "Kunden/Vorgaenge") return ["Suchen und filtern", "Kundenakte lesen", "Vorgangshistorie anzeigen", "Kostentraeger- und Arztkontext verknuepfen"];
  if (area === "Artikel/Warenbestand") return ["Artikelsuche", "Preis- und Lieferantenkontext", "Bestandsanzeige", "Artikelkits"];
  if (area === "Warenwirtschaft/Bestellung") return ["Bestellvorschlaege", "Bestellung erzeugen", "Wareneingang", "Lager- und Lieferantenbezug"];
  if (area === "Abrechnung/Kasse") return ["Rechnungen suchen", "Kassenbuch", "Zahlungsbedingungen", "DATEV-nahe Ausleitung"];
  if (area === "User/Workspace") return ["Login-Kontext", "Rechte und Feature-Toggles", "Navigation", "Benutzerpraeferenzen"];
  if (area === "Filialen/Mandant") return ["Filialstruktur", "Firmenprofil", "Abteilungen", "Mandantenkonfiguration"];
  if (area === "Referenzdaten") return ["Lookup-Daten", "Enums", "Laender", "Steuer-/Materialgruppen"];
  if (area === "Dokumente/Archiv") return ["Dokumentensuche", "Archivzugriff", "Vorlagen", "PDF/Druck vorbereiten"];
  if (area === "Kommunikation/Aufgaben") return ["Inbox-Zaehler", "Aufgaben", "Reminder", "Benachrichtigungen"];
  if (area === "Hilfsmittel") return ["Hilfsmittel suchen", "Termine", "Arten", "Traits und Routenbezug"];
  return ["Liste/Suche", "Detailansicht", "Export/Weiterverarbeitung pruefen"];
}

function resolveInputFiles(argv: string[]): string[] {
  const explicit = argv.filter((arg) => arg.endsWith(".jsonl"));
  if (explicit.length > 0) return explicit.map((file) => path.resolve(file)).filter((file) => fs.existsSync(file));

  const logDir = path.join(workspaceRoot, "logs", "network");
  if (!fs.existsSync(logDir)) return [];
  return fs
    .readdirSync(logDir)
    .filter((file) => file.endsWith(".jsonl"))
    .map((file) => path.join(logDir, file))
    .sort();
}

function readJsonLines(file: string): Record<string, unknown>[] {
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

function workflowManifestFileForLog(logFile: string): string {
  const baseName = path.basename(logFile, ".jsonl");
  return path.join(workspaceRoot, "docs", "recordings", `${baseName}-manifest.json`);
}

function readJsonFile(file: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

function valueAfter(argv: string[], flag: string): string | null {
  const index = argv.indexOf(flag);
  return index >= 0 && argv[index + 1] ? argv[index + 1] : null;
}

function formatPercent(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, "\\|");
}

function isMainModule(): boolean {
  return process.argv[1] ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;
}
