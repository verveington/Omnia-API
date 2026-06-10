import assert from "node:assert/strict";
import test from "node:test";

import {
  REDACTED,
  redactBodyText,
  redactHeaders,
  redactJsonBody,
  redactQueryParams,
  redactText,
  redactUiLabel,
  redactUrl,
} from "./redact.ts";

test("redactHeaders masks sensitive headers case-insensitively", () => {
  const result = redactHeaders({
    Authorization: "Bearer eyJhbGciOi.fake.token",
    Cookie: "sid=abc; theme=light",
    "X-Auth-Token": "secret-token",
    Accept: "application/json",
  });

  assert.deepEqual(result, {
    Authorization: REDACTED,
    Cookie: REDACTED,
    "X-Auth-Token": REDACTED,
    Accept: "application/json",
  });
});

test("redactJsonBody recursively masks identifiers and personal fields", () => {
  const result = redactJsonBody({
    patient: {
      id: 7,
      active: true,
      vorname: "Erika",
      nachname: "Musterfrau",
      geburtsdatum: "12.03.1979",
      versichertennummer: "A123456789",
      kontakt: {
        email: "erika@example.test",
        telefon: "+49 151 12345678",
      },
    },
    note: "Patient Name: Max Mustermann, E-Mail max@example.test",
    amount: 42,
  });

  assert.deepEqual(result, {
    patient: {
      id: 0,
      active: false,
      vorname: REDACTED,
      nachname: REDACTED,
      geburtsdatum: REDACTED,
      versichertennummer: REDACTED,
      kontakt: {
        email: REDACTED,
        telefon: REDACTED,
      },
    },
    note: `Patient Name: ${REDACTED}, E-Mail ${REDACTED}`,
    amount: 42,
  });
});

test("redactJsonBody preserves structure and primitive types in sensitive JSON subtrees", () => {
  const result = redactJsonBody({
    customerId: 12345,
    customer: {
      firstName: "Max",
      id: 7,
      active: true,
      type: "PRIVATE",
      tags: ["vip"],
      metadata: {
        score: 98.5,
        verified: true,
      },
    },
  });

  assert.deepEqual(result, {
    customerId: 0,
    customer: {
      firstName: REDACTED,
      id: 0,
      active: false,
      type: REDACTED,
      tags: [REDACTED],
      metadata: {
        score: 0,
        verified: false,
      },
    },
  });
});

test("redactJsonBody keeps non-identifying name-like technical fields but masks display names and file names", () => {
  const result = redactJsonBody({
    typeName: "LensOrder",
    eventName: "OrderOpened",
    className: "SalesProcessView",
    displayName: "Max Mustermann",
    fileName: "Max-Rezept.pdf",
  });

  assert.deepEqual(result, {
    typeName: "LensOrder",
    eventName: "OrderOpened",
    className: "SalesProcessView",
    displayName: REDACTED,
    fileName: REDACTED,
  });
});

test("redactQueryParams redacts sensitive query values and preserves safe params", () => {
  const result = redactQueryParams("https://api.example.test/search?token=abc&q=Mueller%20Berlin&page=2");

  assert.equal(result, "https://api.example.test/search?token=%5BREDACTED%5D&q=%5BREDACTED%5D&page=2");
});

test("redactHeaders masks URL-like header paths and query values", () => {
  const result = redactHeaders({
    ":path": "/apigateway/kunden/customers/search?active=true&keywords=Max+Mustermann&page=0&size=50",
    Referer: "https://api2.optica-omnia.de/master-data/customers/08901aa6-8c23-4e1b-8c61-109a8573feeb",
  });

  assert.deepEqual(result, {
    ":path": "/apigateway/kunden/customers/search?active=%5BREDACTED%5D&keywords=%5BREDACTED%5D&page=0&size=50",
    Referer: `https://api2.optica-omnia.de/master-data/customers/${REDACTED}`,
  });
});

test("redactJsonBody masks URL-like fields when scrubbing stored records", () => {
  const result = redactJsonBody({
    url: "https://api2.optica-omnia.de/keycloak/auth/realms/502753/protocol/openid-connect/token",
    headers: {
      ":path": "/apigateway/kunden/customers/search?active=true&keywords=Max+Mustermann&page=0&size=50",
    },
  });

  assert.deepEqual(result, {
    url: `https://api2.optica-omnia.de/keycloak/auth/realms/${REDACTED}/protocol/openid-connect/token`,
    headers: {
      ":path": "/apigateway/kunden/customers/search?active=%5BREDACTED%5D&keywords=%5BREDACTED%5D&page=0&size=50",
    },
  });
});

test("redactUrl masks tenant realms and path identifiers", () => {
  const result = redactUrl(
    "https://api2.optica-omnia.de/keycloak/auth/realms/502753/protocol/openid-connect/token?code=secret&page=1",
  );

  assert.equal(
    result,
    `https://api2.optica-omnia.de/keycloak/auth/realms/${REDACTED}/protocol/openid-connect/token?code=%5BREDACTED%5D&page=1`,
  );
});

test("redactText masks bearer tokens, emails, phones, dates of birth and insurance numbers", () => {
  const input = "Authorization: Bearer abc.def.ghi; Mail: user@example.test; Tel +49 30 1234567; Geburtsdatum 01.02.1980; KVNR A123456789";
  const result = redactText(input);

  assert.equal(
    result,
    `Authorization: ${REDACTED}; Mail: ${REDACTED}; Tel ${REDACTED}; Geburtsdatum ${REDACTED}; KVNR ${REDACTED}`,
  );
});

test("redactText masks websocket tenant/user topics", () => {
  const input = "destination:/exchange/api-user-response.topic/*.502753.25ad13c9-7b6b-4756-ae02-c15b65318bb8";
  const result = redactText(input);

  assert.equal(result, `destination:/exchange/api-user-response.topic/*.${REDACTED}.${REDACTED}`);
});

test("redactUiLabel masks UI data rows and person names but keeps action labels", () => {
  assert.equal(redactUiLabel("Neuer Vorgang"), "Neuer Vorgang");
  assert.equal(redactUiLabel("Christoph Schernthaner das ist eine hinweisnotiz"), `UI-Zeile ${REDACTED}`);
  assert.equal(
    redactUiLabel("20. 18582 Max Mustermann AOK Bayern Christoph Schernthaner 0,00 EUR 21. 18587 Max Mustermann"),
    `UI-Zeile ${REDACTED}`,
  );
  assert.equal(redactUiLabel("Kunde Max Mustermann"), `Kunde ${REDACTED}`);
});

test("redactText masks sensitive XML-like tags and JSON-like key values", () => {
  const input = '<patient><vorname>Erika</vorname><nachname>Musterfrau</nachname></patient>{"email":"erika@example.test","city":"Berlin"}';
  const result = redactText(input);

  assert.equal(
    result,
    `<patient>${REDACTED}</patient>{"email":"${REDACTED}","city":"${REDACTED}"}`,
  );
});

test("redactBodyText masks form-urlencoded credentials", () => {
  const input = "username=demo.user&password=top-secret&grant_type=password";
  const result = redactBodyText(input, "application/x-www-form-urlencoded");

  assert.equal(result, "username=%5BREDACTED%5D&password=%5BREDACTED%5D&grant_type=%5BREDACTED%5D");
});

test("redactJsonBody masks local workstation identity fields", () => {
  const result = redactJsonBody({
    username: "local-user",
    hostname: "WORKSTATION-01",
    tenantId: "tenant-123",
    machineId: "machine-123",
    electronVersion: "1.0.61",
  });

  assert.deepEqual(result, {
    username: REDACTED,
    hostname: REDACTED,
    tenantId: REDACTED,
    machineId: REDACTED,
    electronVersion: "1.0.61",
  });
});

test("redactJsonBody masks camelCase customer and user identity fields", () => {
  const result = redactJsonBody({
    editorName: "Clemens Laude",
    editorId: "25ad13c9-7b6b-4756-ae02-c15b65318bb8",
    userId: "25ad13c9-7b6b-4756-ae02-c15b65318bb8",
    mainUserId: "25ad13c9-7b6b-4756-ae02-c15b65318bb8",
    authorId: "25ad13c9-7b6b-4756-ae02-c15b65318bb8",
    consultantId: "25ad13c9-7b6b-4756-ae02-c15b65318bb8",
    departmentFilialeLeads: "Christoph Schernthaner",
    createdBy: "Clemens Laude",
    changedBy: "claude",
    lookupKeyword: "Max Mustermann",
    keywords: "Max Mustermann",
    customerName: "Max Mustermann",
    customerFirstName: "Max",
    customerLastName: "Mustermann",
    customerDateOfBirth: "1979-12-31T23:00:00.000+00:00",
    customerVersichertennummer: "I99999999999999",
    articleDescription: "Unkritischer Artikeltext",
  });

  assert.deepEqual(result, {
    editorName: REDACTED,
    editorId: REDACTED,
    userId: REDACTED,
    mainUserId: REDACTED,
    authorId: REDACTED,
    consultantId: REDACTED,
    departmentFilialeLeads: REDACTED,
    createdBy: REDACTED,
    changedBy: REDACTED,
    lookupKeyword: REDACTED,
    keywords: REDACTED,
    customerName: REDACTED,
    customerFirstName: REDACTED,
    customerLastName: REDACTED,
    customerDateOfBirth: REDACTED,
    customerVersichertennummer: REDACTED,
    articleDescription: "Unkritischer Artikeltext",
  });
});
