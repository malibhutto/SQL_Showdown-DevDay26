import "./FullScreenStatus.css";

interface FullScreenStatusProps {
  title?: string;
  subtitle: string;
}

export function FullScreenStatus({
  title = "SQL SHOWDOWN",
  subtitle,
}: FullScreenStatusProps) {
  return (
    <section className="fullscreen-status" aria-live="polite" aria-busy="true">
      <div className="fullscreen-status__card glass-panel corner-bracket">
        <h1 className="fullscreen-status__title neon-text">{title}</h1>
        <div className="fullscreen-status__spinner" aria-hidden="true" />
        <p className="fullscreen-status__subtitle">{subtitle}</p>
      </div>
    </section>
  );
}
