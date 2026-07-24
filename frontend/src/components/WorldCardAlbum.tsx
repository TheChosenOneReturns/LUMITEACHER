import type { PlatformCatalog, RewardState, WorldCard } from "@story-teacher/shared";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { cardArtUrl } from "../catalog/cardArt";
import { CardsThreeIcon, CaretDownIcon, LockKeyOpenIcon, PlayIcon, SparkleIcon, StarFourIcon, XIcon } from "./icons";

const rarityLabels = { common: "Común", rare: "Rara", epic: "Épica", legendary: "Legendaria" } as const;

export function WorldCardAlbum({ catalog, rewards }: { catalog: PlatformCatalog; rewards: RewardState }) {
  const [selected, setSelected] = useState<WorldCard | null>(null);
  const [expandedWorlds, setExpandedWorlds] = useState<Set<string>>(new Set());

  function toggleWorld(worldId: string) {
    setExpandedWorlds((current) => {
      const next = new Set(current);
      if (next.has(worldId)) next.delete(worldId);
      else next.add(worldId);
      return next;
    });
  }

  return <section className="reward-panel world-album">
    <div className="atlas-heading"><div className="panel-title"><CardsThreeIcon size={29} weight="duotone"/><div><span className="eyebrow">Álbum de poderes</span><h2>Cartas de los mundos</h2></div></div><p>Las cartas descubiertas quedan para siempre. Cada número indica cuántas veces podés usar su ayuda.</p></div>
    <div className="world-album__sets">
      {catalog.worlds.map((world) => {
        const isOpen = expandedWorlds.has(world.id);
        const unlockedCount = catalog.cards.filter((card) => card.worldId === world.id && rewards.unlockedCardIds.includes(card.id)).length;
        return <section key={world.id} className={`card-set card-set--${world.id} ${isOpen ? "is-open" : ""}`}>
          <header onClick={() => toggleWorld(world.id)} role="button" tabIndex={0} aria-expanded={isOpen} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggleWorld(world.id); } }}>
            <span style={{ background: world.accent }}/><div><small>Set de mundo</small><h3>{world.label}</h3></div><strong>{unlockedCount}/4</strong><span className={`card-set__chevron ${isOpen ? "is-open" : ""}`}><CaretDownIcon weight="bold"/></span>
          </header>
          <AnimatePresence initial={false}>
            {isOpen ? <motion.div className="card-set__content" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: .25, ease: "easeInOut" }}>
              <div className="card-set__grid">{catalog.cards.filter((card) => card.worldId === world.id).map((card, index) => {
                const unlocked = rewards.unlockedCardIds.includes(card.id);
                const quantity = rewards.cardInventory[card.id] ?? 0;
                return <motion.button key={card.id} type="button" disabled={!unlocked} className={`power-card power-card--${card.rarity} ${unlocked ? "is-unlocked" : "is-locked"} ${unlocked && quantity === 0 ? "is-empty" : ""}`} onClick={() => setSelected(card)} whileHover={unlocked ? { y: -8, rotate: index % 2 ? .8 : -.8 } : {}} whileTap={unlocked ? { scale: .97 } : {}}>
                  <span className="power-card__art">{unlocked ? <img src={cardArtUrl(card.assetId)} alt="" loading="lazy"/> : <><CardsThreeIcon weight="duotone"/><small>Hito {card.milestone}</small></>}</span>
                  <span className="power-card__meta"><small>{rarityLabels[card.rarity]}</small><strong>{unlocked ? card.label : "Carta misteriosa"}</strong><em>{unlocked ? card.powerLabel : `Llegá al hito ${card.milestone}`}</em></span>
                  {unlocked ? <span className="power-card__charges"><SparkleIcon weight="fill"/> {quantity}</span> : null}
                </motion.button>;
              })}</div>
            </motion.div> : null}
          </AnimatePresence>
        </section>;
      })}
    </div>
    <AnimatePresence>{selected ? <motion.div className="card-detail-backdrop" role="dialog" aria-modal="true" aria-labelledby="card-detail-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><motion.article className={`card-detail card-detail--${selected.rarity}`} initial={{ opacity: 0, y: 35, rotateY: -16, scale: .92 }} animate={{ opacity: 1, y: 0, rotateY: 0, scale: 1 }} exit={{ opacity: 0, y: 22, scale: .95 }} transition={{ type: "spring", stiffness: 190, damping: 22 }}><button type="button" aria-label="Cerrar carta" onClick={() => setSelected(null)}><XIcon weight="bold"/></button><img src={cardArtUrl(selected.assetId)} alt=""/><div><span>{rarityLabels[selected.rarity]} · {catalog.worlds.find((world) => world.id === selected.worldId)?.label}</span><h3 id="card-detail-title">{selected.label}</h3><p>{selected.description}</p><section><LockKeyOpenIcon weight="duotone"/><div><small>Poder: {selected.powerLabel}</small><strong>{selected.powerDescription}</strong></div></section><footer><PlayIcon weight="fill"/> {selected.gameId ? catalog.games.find((game) => game.id === selected.gameId)?.label : "Funciona en cualquier minijuego"}<b><StarFourIcon weight="fill"/> {rewards.cardInventory[selected.id] ?? 0} cargas</b></footer></div></motion.article></motion.div> : null}</AnimatePresence>
  </section>;
}
