// Wird per Playwright addInitScript in jeden Page-Kontext injiziert,
// VOR dem Angular-Bundle. Spielt das Electron-Preload nach (window.isElectron,
// window.ipcRenderer), damit die Optica-Omnia-Web-App glaubt, sie laeuft
// in der echten Electron-Huelle.
//
// Werte fuer machineId / tenantId / version / url kommen ueber das globale
// __OMNIA_STUB__-Objekt rein, das der Recorder vor diesem Script setzt.
(() => {
  const cfg = (typeof __OMNIA_STUB__ !== "undefined" && __OMNIA_STUB__) || {};
  const machineId = cfg.machineId || "00000000000000000000000000000000";
  const tenantId = cfg.tenantId || null;
  const appVersion = cfg.version || "stub-0.0.0";
  const apiUrl = cfg.url || "https://api2.optica-omnia.de";

  const machineFileData = { machineId, tenantId };
  const fingerprintInfo = {
    electronVersion: appVersion,
    hostname: "playwright-stub",
    ip: "127.0.0.1",
    startup: new Date().toISOString(),
    username: "playwright",
  };
  const electronConfig = { url: apiUrl, clearCache: false, version: appVersion };

  const listeners = new Map();
  const ipcRenderer = {
    send(channel, ...args) {
      switch (channel) {
        case "get-machine-file-data":
          emit(channel, machineFileData);
          break;
        case "get-fingerprint-info":
          emit(channel, fingerprintInfo);
          break;
        case "create-machine-file-data": {
          const newTenant = args[0];
          machineFileData.tenantId = newTenant;
          emit(channel, machineFileData);
          break;
        }
        case "electron-log":
        case "logout":
          break;
        default:
          break;
      }
    },
    sendSync(channel) {
      if (channel === "get-electron-config") return electronConfig;
      return null;
    },
    invoke(channel, ...args) {
      if (channel === "get-machine-file-data") return Promise.resolve(machineFileData);
      if (channel === "get-fingerprint-info") return Promise.resolve(fingerprintInfo);
      if (channel === "get-electron-config") return Promise.resolve(electronConfig);
      return Promise.resolve(null);
    },
    on(channel, listener) {
      const set = listeners.get(channel) || new Set();
      set.add(listener);
      listeners.set(channel, set);
      return ipcRenderer;
    },
    once(channel, listener) {
      const wrapper = (...args) => {
        ipcRenderer.removeListener(channel, wrapper);
        listener(...args);
      };
      return ipcRenderer.on(channel, wrapper);
    },
    removeListener(channel, listener) {
      const set = listeners.get(channel);
      if (set) set.delete(listener);
      return ipcRenderer;
    },
    removeAllListeners(channel) {
      if (channel) listeners.delete(channel);
      else listeners.clear();
      return ipcRenderer;
    },
    addListener(channel, listener) {
      return ipcRenderer.on(channel, listener);
    },
    off(channel, listener) {
      return ipcRenderer.removeListener(channel, listener);
    },
  };

  function emit(channel, payload) {
    setTimeout(() => {
      const set = listeners.get(channel);
      if (!set) return;
      const evt = { sender: ipcRenderer };
      for (const l of [...set]) {
        try {
          l(evt, payload);
        } catch (err) {
          console.warn("[electron-ipc-stub] listener error on", channel, err);
        }
      }
    }, 0);
  }

  Object.defineProperty(window, "isElectron", { value: true, configurable: true });
  Object.defineProperty(window, "ipcRenderer", { value: ipcRenderer, configurable: true });
})();
