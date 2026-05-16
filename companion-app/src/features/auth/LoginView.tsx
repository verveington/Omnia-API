import { LockKeyhole, ServerCog } from "lucide-react";
import { FormEvent, useState } from "react";
import { ActionButton, Field } from "../../components/ui";

export function LoginView({
  onLogin,
  busy,
  error,
}: {
  onLogin: (username: string, password: string) => Promise<void>;
  busy: boolean;
  error: string | null;
}) {
  const [username, setUsername] = useState("christoph");
  const [password, setPassword] = useState("demo");

  async function submit(event: FormEvent) {
    event.preventDefault();
    await onLogin(username, password);
  }

  return (
    <main className="login-screen">
      <section className="login-panel">
        <div className="brand login-panel__brand">
          <span className="brand__mark">OC</span>
          <div>
            <strong>Omnia Companion</strong>
            <span>Lokales Backend-for-Frontend</span>
          </div>
        </div>
        <div className="login-panel__status">
          <ServerCog size={18} />
          BFF lokal unter `/api`
        </div>
        <form className="login-form" onSubmit={submit}>
          <Field label="Benutzer" value={username} onChange={setUsername} required />
          <Field label="Passwort" value={password} onChange={setPassword} required type="password" />
          {error ? <div className="validation-box">{error}</div> : null}
          <ActionButton disabled={busy}>
            <LockKeyhole size={16} />
            {busy ? "Anmeldung läuft" : "Anmelden"}
          </ActionButton>
        </form>
      </section>
    </main>
  );
}
