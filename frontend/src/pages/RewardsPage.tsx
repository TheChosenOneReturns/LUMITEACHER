import type { Congratulation, PlatformCatalog, RewardState } from "@story-teacher/shared";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { api, ApiClientError } from "../api/client";
import { GiftIcon, MedalIcon, SparkleIcon, StarFourIcon } from "../components/icons";
import { Lumi } from "../components/Lumi";
import { MiniGameArcade } from "../components/MiniGameArcade";
import { WorldAdventureMap } from "../components/WorldAdventureMap";
import { WorldCardAlbum } from "../components/WorldCardAlbum";
import { ErrorState, LoadingState } from "../components/PageState";
import { catalogArtStyle } from "../catalog/visualAssets";

export function RewardsPage() {
  const [rewards, setRewards] = useState<RewardState | null>(null);
  const [catalog, setCatalog] = useState<PlatformCatalog | null>(null);
  const [postcards, setPostcards] = useState<Congratulation[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [nextRewards, nextCatalog, nextPostcards] = await Promise.all([
        api.getRewards(), api.getCatalog(), api.listCongratulations(),
      ]);
      setRewards(nextRewards);
      setCatalog(nextCatalog);
      setPostcards(nextPostcards);
    } catch (loadError) {
      setError(loadError instanceof ApiClientError ? loadError.message : "¡Ups! No pudimos abrir tus recompensas. Probemos de nuevo.");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (error && (!rewards || !catalog)) return <ErrorState message={error} onRetry={load} />;
  if (!rewards || !catalog) return <LoadingState message="Abriendo tus premios…" />;

  return (
    <div className="page-width page-section rewards-page">
      <motion.section className="rewards-hero" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <span className="pill"><GiftIcon weight="duotone" /> Tus premios</span>
          <h1>Leé cuentos y ganá sorpresas</h1>
          <p>Cada cuento te da estrellas, insignias y cartas.</p>
          <strong className="star-counter"><StarFourIcon weight="fill" /> {rewards.totalStars} estrellas</strong>
        </div>
        <Lumi mood="celebrating" message="¡Mirá todo lo que construimos!" />
      </motion.section>

      <WorldAdventureMap catalog={catalog} rewards={rewards} />
      <WorldCardAlbum catalog={catalog} rewards={rewards} />
      <MiniGameArcade catalog={catalog} rewards={rewards} onRewardsChange={setRewards} />

      <div className="reward-columns">
        <section className="reward-panel">
          <div className="panel-title"><MedalIcon size={28} weight="duotone" /><div><span className="eyebrow">Tu colección</span><h2>Insignias</h2></div></div>
          <div className="badge-cabinet">
            {catalog.badges.map((badge) => {
              const unlocked = rewards.unlockedBadgeIds.includes(badge.id);
              return <div key={badge.id} className={unlocked ? "is-unlocked" : "is-locked"}><span><MedalIcon weight={unlocked ? "fill" : "duotone"} /></span><strong>{badge.label}</strong><small>{badge.description}</small></div>;
            })}
          </div>
        </section>
      </div>

      <section className="reward-panel postcards">
        <div className="panel-title"><GiftIcon size={28} weight="duotone" /><div><span className="eyebrow">De tus profes y familia</span><h2>Mis postales</h2></div></div>
        <AnimatePresence>
          {postcards.length ? <div className="postcard-grid">{postcards.map((postcard, index) => <motion.article key={postcard.congratulationId} className={`postcard postcard--${index % 3 + 1}`} initial={{ opacity: 0, rotate: -3, y: 14 }} animate={{ opacity: 1, rotate: index % 2 ? 2 : -1, y: 0 }}><span className="postcard__art" style={catalogArtStyle(postcard.assetId)} /><div><SparkleIcon weight="fill"/><p>"{postcard.message}"</p><small>{postcard.fromDisplayName}</small></div></motion.article>)}</div> : <p className="empty-copy">Acá van a aparecer las postales que te manden los adultos.</p>}
        </AnimatePresence>
      </section>
    </div>
  );
}
