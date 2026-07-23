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
      setError(loadError instanceof ApiClientError ? loadError.message : "No pudimos abrir tus recompensas.");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function selectAccessory(accessoryId: string | null) {
    try { setRewards(await api.selectAccessory(accessoryId)); }
    catch (selectError) { setError(selectError instanceof ApiClientError ? selectError.message : "No pudimos cambiar el accesorio."); }
  }

  if (error && (!rewards || !catalog)) return <ErrorState message={error} onRetry={load} />;
  if (!rewards || !catalog) return <LoadingState message="Desplegando tu colección…" />;

  return (
    <div className="page-width page-section rewards-page">
      <motion.section className="rewards-hero" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <span className="pill"><GiftIcon weight="duotone" /> Tu sala de premios</span>
          <h1>Leé, ganá estrellas y desbloqueá diversión</h1>
          <p>Cada cuento abre una sorpresa: desafíos, cartas, destinos y nuevos looks para tu personaje.</p>
          <strong className="star-counter"><StarFourIcon weight="fill" /> {rewards.totalStars} estrellas</strong>
        </div>
        <Lumi mood="celebrating" accessoryId={rewards.selectedAccessoryId ?? undefined} message="¡Mirá todo lo que construimos!" />
      </motion.section>

      <WorldAdventureMap catalog={catalog} rewards={rewards} />
      <WorldCardAlbum catalog={catalog} rewards={rewards} />
      <MiniGameArcade catalog={catalog} rewards={rewards} onRewardsChange={setRewards} />

      <div className="reward-columns">
        <section className="reward-panel">
          <div className="panel-title"><MedalIcon size={28} weight="duotone" /><div><span className="eyebrow">Colección</span><h2>Insignias</h2></div></div>
          <div className="badge-cabinet">
            {catalog.badges.map((badge) => {
              const unlocked = rewards.unlockedBadgeIds.includes(badge.id);
              return <div key={badge.id} className={unlocked ? "is-unlocked" : "is-locked"}><span><MedalIcon weight={unlocked ? "fill" : "duotone"} /></span><strong>{badge.label}</strong><small>{badge.description}</small></div>;
            })}
          </div>
        </section>
      </div>

      <section className="reward-panel wardrobe">
        <div className="wardrobe__preview"><Lumi mood="celebrating" accessoryId={rewards.selectedAccessoryId ?? undefined} /></div>
        <div>
          <div className="panel-title"><SparkleIcon size={27} weight="fill" /><div><span className="eyebrow">Vestidor</span><h2>Looks de aventura</h2></div></div>
          <div className="accessory-grid">
            {catalog.accessories.map((accessory) => {
              const unlocked = rewards.unlockedAccessoryIds.includes(accessory.id);
              const selected = rewards.selectedAccessoryId === accessory.id;
              return <motion.button key={accessory.id} type="button" disabled={!unlocked} className={selected ? "is-selected" : ""} onClick={() => void selectAccessory(selected ? null : accessory.id)} whileTap={unlocked ? { scale: .96 } : {}}>
                <GiftIcon size={25} weight={unlocked ? "fill" : "duotone"}/><span><strong>{accessory.label}</strong><small>{unlocked ? (selected ? "En uso" : "Usar accesorio") : `${accessory.threshold} estrellas`}</small></span>
              </motion.button>;
            })}
          </div>
        </div>
      </section>

      <section className="reward-panel postcards">
        <div className="panel-title"><GiftIcon size={28} weight="duotone" /><div><span className="eyebrow">Mensajes que acompañan</span><h2>Mis postales</h2></div></div>
        <AnimatePresence>
          {postcards.length ? <div className="postcard-grid">{postcards.map((postcard, index) => <motion.article key={postcard.congratulationId} className={`postcard postcard--${index % 3 + 1}`} initial={{ opacity: 0, rotate: -3, y: 14 }} animate={{ opacity: 1, rotate: index % 2 ? 2 : -1, y: 0 }}><span className="postcard__art" style={catalogArtStyle(postcard.assetId)} /><div><SparkleIcon weight="fill"/><p>“{postcard.message}”</p><small>{postcard.fromDisplayName}</small></div></motion.article>)}</div> : <p className="empty-copy">Tus felicitaciones aparecerán acá cuando un adulto te envíe una postal.</p>}
        </AnimatePresence>
      </section>
    </div>
  );
}
