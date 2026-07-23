import type { PlatformCatalog, RewardState } from "@story-teacher/shared";
import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { api, ApiClientError } from "../api/client";
import { GiftIcon, StarFourIcon } from "../components/icons";
import { Lumi } from "../components/Lumi";
import { MiniGameArcade } from "../components/MiniGameArcade";
import { WorldAdventureMap } from "../components/WorldAdventureMap";
import { WorldCardAlbum } from "../components/WorldCardAlbum";
import { ErrorState, LoadingState } from "../components/PageState";

export function RewardsPage() {
  const [rewards, setRewards] = useState<RewardState | null>(null);
  const [catalog, setCatalog] = useState<PlatformCatalog | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [nextRewards, nextCatalog] = await Promise.all([
        api.getRewards(), api.getCatalog(),
      ]);
      setRewards(nextRewards);
      setCatalog(nextCatalog);
    } catch (loadError) {
      setError(loadError instanceof ApiClientError ? loadError.message : "¡Ups! No pudimos abrir tus recompensas. Probemos de nuevo.");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (error && (!rewards || !catalog)) return <ErrorState message={error} onRetry={load} />;
  if (!rewards || !catalog) return <LoadingState message="Desplegando tu colección…" />;

  return (
    <div className="page-width page-section rewards-page">
      <motion.section className="rewards-hero" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <span className="pill"><GiftIcon weight="duotone" /> Tu sala de premios</span>
          <h1>Leé, ganá estrellas y descubrí sorpresas</h1>
          <p>Cada cuento que completás te da premios: insignias, cartas y personajes nuevos.</p>
          <strong className="star-counter"><StarFourIcon weight="fill" /> {rewards.totalStars} estrellas</strong>
        </div>
        <Lumi mood="celebrating" message="¡Mirá todo lo que construimos!" />
      </motion.section>

      <WorldAdventureMap catalog={catalog} rewards={rewards} />
      <MiniGameArcade catalog={catalog} rewards={rewards} onRewardsChange={setRewards} />
      <WorldCardAlbum catalog={catalog} rewards={rewards} />
    </div>
  );
}
