import { ArrowClockwiseIcon, CloudSlashIcon } from "./icons";
import { motion } from "motion/react";
import { Lumi } from "./Lumi";

export function LoadingState({ message = "Cargando…" }: { message?: string }) {
  return (
    <section className="page-state" aria-live="polite" aria-busy="true">
      <motion.div
        className="spinner"
        aria-hidden="true"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.15, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      />
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
      <motion.div
        className="state-icon"
        aria-hidden="true"
        initial={{ scale: 0.7, rotate: -12 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 17 }}
      >
        <CloudSlashIcon size={58} weight="duotone" />
      </motion.div>
      <h1>¡Ups! Algo no salió bien</h1>
      <p>{message}</p>
      {onRetry ? (
        <button className="button button--primary" onClick={onRetry}>
          <ArrowClockwiseIcon size={21} weight="bold" /> Probemos de nuevo
        </button>
      ) : null}
    </section>
  );
}
