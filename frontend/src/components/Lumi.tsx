interface LumiProps {
  message?: string;
  compact?: boolean;
}

export function Lumi({ message, compact = false }: LumiProps) {
  return (
    <div className={`lumi ${compact ? "lumi--compact" : ""}`}>
      <div className="lumi__avatar" aria-hidden="true">
        🦉
      </div>
      {message ? <p className="lumi__message">{message}</p> : null}
    </div>
  );
}

