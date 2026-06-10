import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPlatformBlueprint,
  buildPlatformBlueprintMarkdown,
  parsePlatformBlueprintArgs,
} from "./platform-blueprint.ts";
import type { OmniaKnowledgeReport } from "./omnia-knowledge.ts";
import type { OmniaDataModel } from "./omnia-data-model.ts";
import type { OmniaRelationshipMap } from "./omnia-relationships.ts";
import type { OmniaUiMap } from "./omnia-ui-map.ts";

test("buildPlatformBlueprint turns knowledge domains into platform modules", () => {
  const report = sampleKnowledgeReport();
  const blueprint = buildPlatformBlueprint(report, { generatedAt: new Date("2026-06-03T12:00:00.000Z") });

  assert.equal(blueprint.sourceCoveragePercent, 25);
  assert.deepEqual(
    blueprint.modules.map((module) => module.area),
    ["User/Workspace", "Kunden/Vorgaenge", "aerzte"],
  );

  const customerModule = blueprint.modules.find((module) => module.area === "Kunden/Vorgaenge");
  assert.equal(customerModule?.stage, "mvp");
  assert.equal(customerModule?.confidence, "medium");
  assert.deepEqual(customerModule?.coreObjects, ["Kunde", "Vorgang", "Kostentraeger", "Arztbezug", "Notiz"]);
  assert.equal(customerModule?.apiGaps[0].path, "/customers/{customerId}/addresses");

  const userModule = blueprint.modules.find((module) => module.area === "User/Workspace");
  assert.equal(userModule?.stage, "foundation");
  assert.equal(userModule?.confidence, "high");

  const doctorModule = blueprint.modules.find((module) => module.area === "aerzte");
  assert.equal(doctorModule?.stage, "discovery");
  assert.equal(doctorModule?.confidence, "low");
});

test("buildPlatformBlueprint keeps unobserved inventory-only modules low confidence", () => {
  const report = sampleKnowledgeReport();
  report.domains.push({
    area: "gateway-configurations",
    responseCount: 0,
    endpointCount: 0,
    coverage: {
      knownEndpoints: 1,
      observedKnownEndpoints: 1,
      missingKnownEndpoints: 0,
      coveragePercent: 100,
      missingExamples: [],
    },
    statusCounts: [],
    steps: [],
    endpoints: [],
    platformCandidate: "Eigenes Plattformmodul fuer gateway-configurations pruefen.",
    knowledgeGap: "Noch keine verwertbaren Endpunkte beobachtet.",
  });

  const blueprint = buildPlatformBlueprint(report, { generatedAt: new Date("2026-06-03T12:00:00.000Z") });
  const module = blueprint.modules.find((item) => item.area === "gateway-configurations");

  assert.equal(module?.stage, "discovery");
  assert.equal(module?.confidence, "low");
  assert.match(module?.reason || "", /nicht beobachtet/);
});

test("buildPlatformBlueprint enriches modules with observed entities and domain connections", () => {
  const blueprint = buildPlatformBlueprint(sampleKnowledgeReport(), {
    generatedAt: new Date("2026-06-03T12:00:00.000Z"),
    dataModel: sampleDataModel(),
    relationships: sampleRelationships(),
    uiMap: sampleUiMap(),
  });

  const customerModule = blueprint.modules.find((module) => module.area === "Kunden/Vorgaenge");

  assert.deepEqual(customerModule?.dataEntities.map((entity) => entity.name), ["customers", "salesprocesses"]);
  assert.equal(customerModule?.dataEntities[0].fieldCount, 12);
  assert.deepEqual(customerModule?.connectedAreas, [
    { area: "User/Workspace", incomingCount: 3, outgoingCount: 2 },
  ]);
  assert.deepEqual(customerModule?.uiSurfaces, [
    {
      label: "Kunden",
      kind: "route",
      path: "/customers",
      clickedCount: 2,
      openCount: 0,
      apiEndpointCount: 1,
      apiEndpoints: [
        {
          method: "GET",
          path: "/apigateway/kunden/customers/search",
          area: "Kunden/Vorgaenge",
          count: 2,
          statuses: [200],
        },
      ],
    },
  ]);
});

test("buildPlatformBlueprint includes structural UI surfaces from UI snapshots", () => {
  const blueprint = buildPlatformBlueprint(sampleKnowledgeReport(), {
    generatedAt: new Date("2026-06-03T12:00:00.000Z"),
    uiMap: sampleUiMapWithSurfaces(),
  });

  const customerModule = blueprint.modules.find((module) => module.area === "Kunden/Vorgaenge");
  const customerSurface = customerModule?.uiSurfaces.find((surface) => surface.path === "/master-data/customers");

  assert.deepEqual(customerSurface, {
    label: "Kunden",
    kind: "surface",
    path: "/master-data/customers",
    clickedCount: 0,
    openCount: 0,
    apiEndpointCount: 0,
    title: "Kunden",
    headings: ["Kundensuche", "Treffer"],
    actions: ["Exportieren", "Filter"],
    formLabels: ["Suchbegriff", "Status"],
    tableHeaders: ["Name", "Geburtsdatum", "Status"],
    apiEndpointCount: 1,
    apiEndpoints: [
      {
        method: "GET",
        path: "/apigateway/kunden/customers/search",
        area: "Kunden/Vorgaenge",
        count: 3,
        statuses: [200],
      },
    ],
    sourceCount: 1,
  });

  const markdown = buildPlatformBlueprintMarkdown(blueprint);
  assert.match(markdown, /Kunden - surface `\/master-data\/customers`/);
  assert.match(markdown, /Ueberschriften: Kundensuche, Treffer/);
  assert.match(markdown, /Aktionen: Exportieren, Filter/);
  assert.match(markdown, /Formularfelder: Suchbegriff, Status/);
  assert.match(markdown, /Tabellen: Name, Geburtsdatum, Status/);
  assert.match(markdown, /APIs: GET `\/apigateway\/kunden\/customers\/search` \(3x\)/);
});

test("buildPlatformBlueprintMarkdown shows MVP order, module details and API gaps", () => {
  const blueprint = buildPlatformBlueprint(sampleKnowledgeReport(), {
    generatedAt: new Date("2026-06-03T12:00:00.000Z"),
    dataModel: sampleDataModel(),
    relationships: sampleRelationships(),
    uiMap: sampleUiMap(),
  });

  const markdown = buildPlatformBlueprintMarkdown(blueprint);

  assert.match(markdown, /^# Plattform-Blueprint/m);
  assert.match(markdown, /## MVP-Reihenfolge/);
  assert.match(markdown, /Kunden\/Vorgaenge/);
  assert.match(markdown, /Known\/Observed\/Missing: 10 \/ 4 \/ 6/);
  assert.match(markdown, /GET `\/customers\/\{customerId\}\/addresses`/);
  assert.match(markdown, /Kundenakte/);
  assert.match(markdown, /Beobachtete Datenobjekte/);
  assert.match(markdown, /customers \(2 Samples, 12 Felder\)/);
  assert.match(markdown, /User\/Workspace \(incoming 3, outgoing 2\)/);
  assert.match(markdown, /Beobachtete UI-Surfaces/);
  assert.match(markdown, /Kunden - route `\/customers` \(1 API-Endpunkte, clicked 2, offen 0\)/);
});

test("parsePlatformBlueprintArgs defaults to docs blueprint output", () => {
  const options = parsePlatformBlueprintArgs([]);

  assert.equal(options.outputFile.endsWith("docs/11_platform_blueprint.md"), true);
});

function sampleKnowledgeReport(): OmniaKnowledgeReport {
  return {
    generatedAt: "2026-06-03T12:00:00.000Z",
    totalResponses: 32,
    endpointCount: 8,
    knownEndpointCount: 20,
    observedKnownEndpointCount: 5,
    missingKnownEndpointCount: 15,
    coveragePercent: 25,
    domainCount: 3,
    domains: [
      {
        area: "Kunden/Vorgaenge",
        responseCount: 12,
        endpointCount: 4,
        coverage: {
          knownEndpoints: 10,
          observedKnownEndpoints: 4,
          missingKnownEndpoints: 6,
          coveragePercent: 40,
          missingExamples: [
            { method: "GET", path: "/customers/{customerId}/addresses", source: "test" },
          ],
        },
        statusCounts: [{ status: 200, count: 12 }],
        steps: ["Kunde suchen"],
        endpoints: [
          {
            key: "GET /apigateway/kunden/customers/search",
            method: "GET",
            path: "/apigateway/kunden/customers/search",
            count: 4,
            statuses: [200],
            steps: ["Kunde suchen"],
          },
        ],
        platformCandidate: "CRM/Kundenakte mit Vorgangs- und Kostentraeger-Kontext.",
        knowledgeGap: "Grundstruktur beobachtet.",
      },
      {
        area: "User/Workspace",
        responseCount: 20,
        endpointCount: 4,
        coverage: {
          knownEndpoints: 6,
          observedKnownEndpoints: 5,
          missingKnownEndpoints: 1,
          coveragePercent: 83.33,
          missingExamples: [],
        },
        statusCounts: [{ status: 200, count: 20 }],
        steps: ["Login"],
        endpoints: [],
        platformCandidate: "Mandant, Rechte, Feature-Toggles und Navigation.",
        knowledgeGap: "Grundstruktur beobachtet.",
      },
      {
        area: "aerzte",
        responseCount: 0,
        endpointCount: 0,
        coverage: {
          knownEndpoints: 4,
          observedKnownEndpoints: 0,
          missingKnownEndpoints: 4,
          coveragePercent: 0,
          missingExamples: [{ method: "GET", path: "/aerzte", source: "test" }],
        },
        statusCounts: [],
        steps: [],
        endpoints: [],
        platformCandidate: "Eigenes Plattformmodul fuer aerzte pruefen.",
        knowledgeGap: "Noch keine verwertbaren Endpunkte beobachtet.",
      },
    ],
  };
}

function sampleDataModel(): OmniaDataModel {
  return {
    generatedAt: "2026-06-03T12:00:00.000Z",
    entityCount: 3,
    sampleCount: 6,
    entities: [
      {
        area: "Kunden/Vorgaenge",
        name: "customers",
        sampleCount: 2,
        sourceKinds: ["response"],
        endpoints: ["GET /apigateway/kunden/customers/search"],
        fields: Array.from({ length: 12 }, (_, index) => ({
          path: `field${index}`,
          types: ["string"],
          count: 1,
        })),
      },
      {
        area: "Kunden/Vorgaenge",
        name: "salesprocesses",
        sampleCount: 1,
        sourceKinds: ["request", "response"],
        endpoints: ["POST /apigateway/sales/salesprocesses/search"],
        fields: Array.from({ length: 8 }, (_, index) => ({
          path: `salesField${index}`,
          types: ["string"],
          count: 1,
        })),
      },
      {
        area: "User/Workspace",
        name: "workspaces",
        sampleCount: 3,
        sourceKinds: ["request"],
        endpoints: ["POST /apigateway/workspaces"],
        fields: [],
      },
    ],
  };
}

function sampleRelationships(): OmniaRelationshipMap {
  return {
    generatedAt: "2026-06-03T12:00:00.000Z",
    responseCount: 10,
    domainCount: 2,
    stepCount: 1,
    transitions: [
      {
        fromArea: "User/Workspace",
        toArea: "Kunden/Vorgaenge",
        count: 3,
        steps: ["Login"],
        examples: [],
      },
      {
        fromArea: "Kunden/Vorgaenge",
        toArea: "User/Workspace",
        count: 2,
        steps: ["Kunde suchen"],
        examples: [],
      },
    ],
    stepFlows: [],
  };
}

function sampleUiMap(): OmniaUiMap {
  return {
    generatedAt: "2026-06-03T12:00:00.000Z",
    recordingCount: 1,
    targetCount: 2,
    surfaceCount: 0,
    clickedTargetCount: 2,
    openTargetCount: 0,
    apiLinkedTargetCount: 2,
    apiEndpointCount: 2,
    targets: [
      {
        key: "route:/customers",
        kind: "route",
        label: "Kunden",
        path: "/customers",
        clickedCount: 2,
        openCount: 0,
        seenCount: 2,
        apiEndpointCount: 1,
        apiAreas: ["Kunden/Vorgaenge"],
        apiEndpoints: [
          {
            method: "GET",
            path: "/apigateway/kunden/customers/search",
            area: "Kunden/Vorgaenge",
            count: 2,
            statuses: [200],
          },
        ],
        sources: ["logs/network/auto.jsonl"],
      },
      {
        key: "route:/workspaces",
        kind: "route",
        label: "Workspace",
        path: "/workspaces",
        clickedCount: 1,
        openCount: 0,
        seenCount: 1,
        apiEndpointCount: 1,
        apiAreas: ["User/Workspace"],
        apiEndpoints: [
          {
            method: "GET",
            path: "/apigateway/userservice/workspaces",
            area: "User/Workspace",
            count: 1,
            statuses: [200],
          },
        ],
        sources: ["logs/network/auto.jsonl"],
      },
    ],
    surfaces: [],
    followupCommands: [],
  };
}

function sampleUiMapWithSurfaces(): OmniaUiMap {
  return {
    ...sampleUiMap(),
    surfaceCount: 2,
    surfaces: [
      {
        key: "/master-data/customers",
        path: "/master-data/customers",
        title: "Kunden",
        headings: ["Kundensuche", "Treffer"],
        actions: ["Exportieren", "Filter"],
        formLabels: ["Suchbegriff", "Status"],
        tableHeaders: ["Name", "Geburtsdatum", "Status"],
        apiEndpointCount: 1,
        apiAreas: ["Kunden/Vorgaenge"],
        apiEndpoints: [
          {
            method: "GET",
            path: "/apigateway/kunden/customers/search",
            area: "Kunden/Vorgaenge",
            count: 3,
            statuses: [200],
          },
        ],
        steps: ["1. Kunden"],
        sources: ["logs/network/auto.jsonl"],
        sourceCount: 1,
      },
      {
        key: "/workspaces",
        path: "/workspaces",
        title: "Workspace",
        headings: ["Mandant"],
        actions: ["Auswaehlen"],
        formLabels: [],
        tableHeaders: [],
        apiEndpointCount: 0,
        apiAreas: [],
        apiEndpoints: [],
        steps: ["Login"],
        sources: ["logs/network/auto.jsonl"],
        sourceCount: 1,
      },
    ],
  };
}
