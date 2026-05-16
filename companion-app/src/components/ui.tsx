import type { ReactNode } from "react";
import type { AuditEvent } from "../core/types";

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "blue" | "amber" | "red";
}) {
  return <span className={`status-badge status-badge--${tone}`}>{children}</span>;
}

export function ActionButton({
  children,
  onClick,
  variant = "primary",
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "quiet" | "danger";
  disabled?: boolean;
}) {
  return (
    <button className={`action-button action-button--${variant}`} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}

export function ActionLink({
  children,
  href,
  onClick,
  variant = "primary",
}: {
  children: ReactNode;
  href: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "quiet" | "danger";
}) {
  return (
    <a className={`action-button action-button--${variant}`} href={href} onClick={onClick}>
      {children}
    </a>
  );
}

export function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="section-header">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action ? <div className="section-header__action">{action}</div> : null}
    </div>
  );
}

export function AuditStream({ events }: { events: AuditEvent[] }) {
  return (
    <aside className="audit-stream" aria-label="Audit-Log">
      <div className="audit-stream__header">
        <span>Audit</span>
        <strong>{events.length}</strong>
      </div>
      <div className="audit-stream__list">
        {events.map((event) => (
          <article className="audit-event" key={event.id}>
            <div>
              <strong>{event.action}</strong>
              <span>{event.target}</span>
            </div>
            <time>{event.time}</time>
          </article>
        ))}
      </div>
    </aside>
  );
}

export function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="field">
      <span>
        {label}
        {required ? <b>*</b> : null}
      </span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  required?: boolean;
}) {
  return (
    <label className="field">
      <span>
        {label}
        {required ? <b>*</b> : null}
      </span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
