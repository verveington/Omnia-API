import assert from "node:assert/strict";
import test from "node:test";

import {
  createLearningSession,
  learnFromExplorerClicks,
  learnFromRecordingSnapshot,
} from "./native-cdp-learning-session.js";

test("learnFromRecordingSnapshot only learns new recorder events", () => {
  let session = createLearningSession();
  const snapshot = {
    active: true,
    eventCount: 1,
    events: [{ type: "click", text: "Dashboard", role: "link" }],
  };

  let result = learnFromRecordingSnapshot(session, snapshot, { now: "2026-05-17T10:00:00.000Z" });
  session = result.session;
  assert.equal(result.learnedSuggestions.length, 1);
  assert.equal(session.catalog.commands[0].command, "gehe zu Dashboard");
  assert.equal(session.catalog.commands[0].count, 1);

  result = learnFromRecordingSnapshot(session, snapshot, { now: "2026-05-17T10:00:01.000Z" });
  session = result.session;
  assert.equal(result.learnedSuggestions.length, 0);
  assert.equal(session.catalog.commands[0].count, 1);
});

test("learnFromRecordingSnapshot advances when more events arrive", () => {
  const session = createLearningSession();
  const first = learnFromRecordingSnapshot(session, {
    active: true,
    eventCount: 1,
    events: [{ type: "click", text: "Dashboard", role: "link" }],
  });

  const second = learnFromRecordingSnapshot(first.session, {
    active: true,
    eventCount: 2,
    events: [
      { type: "click", text: "Dashboard", role: "link" },
      { type: "click", text: "Dokumente", role: "tab" },
    ],
  });

  assert.equal(second.learnedSuggestions.length, 1);
  assert.equal(second.learnedSuggestions[0].command, "wechsel zu Dokumente");
  assert.equal(second.learnedSuggestions[0].reason, "Tab-Wechsel");
  assert.deepEqual(second.session.catalog.commands.map((entry) => entry.command), [
    "gehe zu Dashboard",
    "wechsel zu Dokumente",
  ]);
});

test("learnFromRecordingSnapshot attaches API observations to newly learned UI commands", () => {
  const result = learnFromRecordingSnapshot(createLearningSession(), {
    active: true,
    eventCount: 1,
    events: [{ type: "click", text: "Dashboard", role: "link", path: "/dashboard" }],
    apiEvents: [
      {
        type: "response",
        method: "GET",
        normalizedPath: "/apigateway/dashboardservice/cards",
        status: 200,
        time: "2026-05-17T10:00:01.000Z",
      },
      {
        type: "response",
        method: "GET",
        normalizedPath: "/apigateway/dashboardservice/cards",
        status: 200,
        time: "2026-05-17T10:00:03.000Z",
      },
    ],
  }, { now: "2026-05-17T10:00:04.000Z" });

  const command = result.session.catalog.commands[0];
  assert.equal(command.command, "gehe zu Dashboard");
  assert.equal(command.executor, "hybrid");
  assert.equal(command.safety, "safe");
  assert.deepEqual(command.context, { route: "/dashboard" });
  assert.deepEqual(command.apiObservations, [
    {
      method: "GET",
      path: "/apigateway/dashboardservice/cards",
      status: 200,
      calls: 2,
      lastSeenAt: "2026-05-17T10:00:03.000Z",
    },
  ]);
});

test("learnFromRecordingSnapshot correlates only new API events with new UI commands", () => {
  const first = learnFromRecordingSnapshot(createLearningSession(), {
    active: true,
    eventCount: 1,
    apiEventCount: 1,
    events: [{ type: "click", text: "Dashboard", role: "link", path: "/dashboard" }],
    apiEvents: [
      {
        type: "response",
        method: "GET",
        normalizedPath: "/apigateway/dashboardservice/cards",
        status: 200,
        time: "2026-05-17T10:00:01.000Z",
      },
    ],
  }, { now: "2026-05-17T10:00:02.000Z" });

  const second = learnFromRecordingSnapshot(first.session, {
    active: true,
    eventCount: 2,
    apiEventCount: 2,
    events: [
      { type: "click", text: "Dashboard", role: "link", path: "/dashboard" },
      { type: "click", text: "Dokumente", role: "tab", path: "/documents" },
    ],
    apiEvents: [
      {
        type: "response",
        method: "GET",
        normalizedPath: "/apigateway/dashboardservice/cards",
        status: 200,
        time: "2026-05-17T10:00:01.000Z",
      },
      {
        type: "response",
        method: "GET",
        normalizedPath: "/apigateway/documentservice/documents",
        status: 200,
        time: "2026-05-17T10:00:03.000Z",
      },
    ],
  }, { now: "2026-05-17T10:00:04.000Z" });

  const dashboard = second.session.catalog.commands.find((entry) => entry.command === "gehe zu Dashboard");
  const documents = second.session.catalog.commands.find((entry) => entry.command === "wechsel zu Dokumente");

  assert.equal(second.session.learnedEventCount, 2);
  assert.equal(second.session.learnedApiEventCount, 2);
  assert.deepEqual(dashboard.apiObservations, [
    {
      method: "GET",
      path: "/apigateway/dashboardservice/cards",
      status: 200,
      calls: 1,
      lastSeenAt: "2026-05-17T10:00:01.000Z",
    },
  ]);
  assert.deepEqual(documents.apiObservations, [
    {
      method: "GET",
      path: "/apigateway/documentservice/documents",
      status: 200,
      calls: 1,
      lastSeenAt: "2026-05-17T10:00:03.000Z",
    },
  ]);
});

test("learnFromRecordingSnapshot accepts apiRecording events and respects apiEventCount", () => {
  const result = learnFromRecordingSnapshot(createLearningSession(), {
    active: true,
    eventCount: 1,
    apiEventCount: 1,
    events: [{ type: "click", text: "Dashboard", role: "link", path: "/dashboard" }],
    apiRecording: {
      events: [
        {
          type: "response",
          method: "GET",
          normalizedPath: "/apigateway/dashboardservice/cards",
          status: 200,
          time: "2026-05-17T10:00:01.000Z",
        },
        {
          type: "response",
          method: "GET",
          normalizedPath: "/apigateway/documentservice/documents",
          status: 200,
          time: "2026-05-17T10:00:03.000Z",
        },
      ],
    },
  }, { now: "2026-05-17T10:00:04.000Z" });

  assert.equal(result.session.learnedApiEventCount, 1);
  assert.deepEqual(result.session.catalog.commands[0].apiObservations, [
    {
      method: "GET",
      path: "/apigateway/dashboardservice/cards",
      status: 200,
      calls: 1,
      lastSeenAt: "2026-05-17T10:00:01.000Z",
    },
  ]);
});

test("learnFromExplorerClicks persists API observations on auto-explorer commands", () => {
  const result = learnFromExplorerClicks(createLearningSession(), [
    { kind: "menu", label: "öffne App-Menü" },
    { kind: "route", label: "gehe zu Vorgänge", path: "/transactions" },
  ], {
    apiObservations: [
      {
        method: "GET",
        path: "/apigateway/transactionservice/transactions",
        status: 200,
        calls: 1,
        lastSeenAt: "2026-05-17T10:00:05.000Z",
      },
    ],
    apiEventCount: 2,
    now: "2026-05-17T10:00:06.000Z",
  });

  assert.equal(result.catalogChanged, true);
  assert.equal(result.learnedSuggestions.length, 1);
  assert.equal(result.session.learnedApiEventCount, 2);

  const command = result.session.catalog.commands[0];
  assert.equal(command.command, "gehe zu Vorgänge");
  assert.equal(command.executor, "hybrid");
  assert.equal(command.safety, "safe");
  assert.deepEqual(command.context, { route: "/transactions" });
  assert.deepEqual(command.apiObservations, [
    {
      method: "GET",
      path: "/apigateway/transactionservice/transactions",
      status: 200,
      calls: 1,
      lastSeenAt: "2026-05-17T10:00:05.000Z",
    },
  ]);
});
