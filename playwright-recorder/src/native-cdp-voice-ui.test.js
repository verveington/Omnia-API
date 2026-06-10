import assert from "node:assert/strict";
import test from "node:test";

import {
  createVoicePanelHtml,
  createVoiceServerConfig,
  parseJsonBody,
} from "./native-cdp-voice-ui.js";

test("createVoiceServerConfig uses a local-only default port", () => {
  const config = createVoiceServerConfig({});

  assert.equal(config.host, "127.0.0.1");
  assert.equal(config.port, 8787);
});

test("createVoiceServerConfig allows port override", () => {
  const config = createVoiceServerConfig({ OMNIA_VOICE_PORT: "9090" });

  assert.equal(config.port, 9090);
});

test("parseJsonBody rejects invalid JSON and accepts command payloads", () => {
  assert.deepEqual(parseJsonBody(Buffer.from('{"text":"status"}')), { text: "status" });
  assert.throws(() => parseJsonBody(Buffer.from("{")), /Invalid JSON/);
});

test("createVoicePanelHtml includes chat-first panel wiring", () => {
  const html = createVoicePanelHtml();

  assert.match(html, /id="chatLog"/);
  assert.match(html, /id="composerInput"/);
  assert.match(html, /id="sendMessage"/);
  assert.match(html, /id="toggleVoice"/);
  assert.match(html, /id="learnedDrawer"/);
  assert.match(html, /id="connectLaunch"/);
  assert.match(html, /id="connectAttach"/);
  assert.match(html, /id="connectNone"/);
  assert.match(html, /id="disconnectOmnia"/);
  assert.match(html, /id="omniaStatus"/);
  assert.match(html, /id="aiStatus"/);
  assert.match(html, /id="speechStatus"/);
  assert.match(html, /id="learningStatus"/);
  assert.match(html, /SpeechRecognition|webkitSpeechRecognition/);
  assert.match(html, /sendChatMessage\(transcript\)/);
  assert.match(html, /\/api\/omnia\/connect/);
  assert.match(html, /\/api\/omnia\/disconnect/);
  assert.match(html, /\/api\/conversation/);
  assert.match(html, /\/api\/command/);
  assert.match(html, /Trotzdem ausfuehren/);
  assert.match(html, /id="startLearning"/);
  assert.match(html, /id="stopLearning"/);
  assert.match(html, /id="runAutoExplorer"/);
  assert.match(html, /id="refreshLearning"/);
  assert.match(html, /id="learnedCommands"/);
  assert.match(html, /\/api\/learning\/start/);
  assert.match(html, /\/api\/learning\/stop/);
  assert.match(html, /\/api\/learning\/status/);
  assert.match(html, /\/api\/learning\/commands/);
  assert.match(html, /\/api\/explorer\/run/);
});

test("createVoicePanelHtml wires refresh learning button to learning status refresh", () => {
  const html = createVoicePanelHtml();

  assert.match(html, /refreshLearningBtn\.addEventListener\("click"/);
  assert.match(html, /refreshLearningBtn\.addEventListener\("click",[\s\S]*?refreshLearning\(\)[\s\S]*?\}\);/);
});

test("createVoicePanelHtml preserves partial statuses and guards voice transitions", () => {
  const html = createVoicePanelHtml();

  assert.match(html, /lastStatus/);
  assert.match(html, /lastStatus\s*=\s*\{[\s\S]*\.\.\.lastStatus/);
  assert.match(html, /omnia:\s*\{\s*\.\.\.lastStatus\.omnia/);
  assert.match(html, /ai:\s*\{\s*\.\.\.lastStatus\.ai/);
  assert.match(html, /learning:\s*\{\s*\.\.\.lastStatus\.learning/);
  assert.match(html, /voiceTransitioning/);
  assert.match(html, /if \(!recognition \|\| voiceTransitioning\) return/);
  assert.match(html, /voiceTransitioning = true;[\s\S]*try \{[\s\S]*recognition\.start\(\)/);
  assert.match(html, /catch \(error\) \{[\s\S]*voiceTransitioning = false;[\s\S]*appendMessage\("error"/);
});
