import { randomUUID } from "node:crypto";

export function createSessionStore({ now = () => new Date() } = {}) {
  const sessions = new Map();

  function createSession(input) {
    const id = randomUUID();
    const createdAt = now().toISOString();
    const session = {
      id,
      createdAt,
      updatedAt: createdAt,
      source: input.source,
      workspace: input.workspace,
      user: {
        username: input.username,
        displayName: input.displayName || input.username,
      },
      omniaAccessToken: input.omniaAccessToken || null,
    };

    sessions.set(id, session);
    return publicSession(session);
  }

  function getSession(id) {
    if (!id || !sessions.has(id)) return null;
    const session = sessions.get(id);
    session.updatedAt = now().toISOString();
    return publicSession(session);
  }

  function destroySession(id) {
    if (!id) return false;
    return sessions.delete(id);
  }

  return {
    createSession,
    getSession,
    destroySession,
  };
}

function publicSession(session) {
  return {
    id: session.id,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    source: session.source,
    workspace: session.workspace,
    user: { ...session.user },
    omniaAccessToken: session.omniaAccessToken,
  };
}
