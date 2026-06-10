import assert from "node:assert/strict";
import test from "node:test";

import { collectExploreCandidates } from "./candidates.ts";

test("collectExploreCandidates includes ARIA button targets for material icon actions", async () => {
  let source = "";
  const page = {
    evaluate: async (fn: Function) => {
      source = fn.toString();
      return [];
    },
  };

  await collectExploreCandidates(page);

  assert.match(source, /\[role=['"]button['"]\]/);
});

test("collectExploreCandidates does not convert empty button hrefs into root routes", async () => {
  let source = "";
  const page = {
    evaluate: async (fn: Function) => {
      source = fn.toString();
      return [];
    },
  };

  await collectExploreCandidates(page);

  assert.match(source, /if \(!href\) return "";/);
});
