import { Lumi } from "./Lumi";

export function LoadingState({ message = "Cargando…" }: { message?: string }) {
  return (
    <section className="page-state" aria-live="polite" aria-busy="true">
      <div className="spinner" aria-hidden="true" />
      <Lumi message={message} />
    </section>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <section className="page-state" role="alert">
      <div className="state-icon" aria-hidden="true">
        ☁️
      </div>
      <h1>La aventura hizo una pausa</h1>
      <p>{message}</p>
      {onRetry ? (
        <button className="button button--primary" onClick={onRetry}>
          Intentar nuevamente
        </button>
      ) : null}
    </section>
  );
}

