import type { Icon } from "@phosphor-icons/react";
import type { GameId, PlatformCatalog, RewardState, WorldCard } from "@story-teacher/shared";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { api, ApiClientError } from "../api/client";
import { cardArtUrl } from "../catalog/cardArt";
import {
  BinocularsIcon,
  BrainIcon,
  CardsThreeIcon,
  CheckCircleIcon,
  CompassIcon,
  EyeIcon,
  FactoryIcon,
  GearSixIcon,
  ListNumbersIcon,
  LockKeyOpenIcon,
  MaskHappyIcon,
  PlayIcon,
  SignpostIcon,
  SparkleIcon,
  StarFourIcon,
  XIcon,
} from "./icons";
import { CognitiveGameSession } from "./CognitiveGameSessions";
import { gameDifficultyOptions, type GameDifficulty } from "./gameEngine";

interface GameDefinition {
  id: GameId;
  title: string;
  description: string;
  threshold: number;
  Icon: Icon;
  className: string;
  skill: string;
}

const gameVisuals: Record<GameId, Pick<GameDefinition, "Icon" | "className" | "skill">> = {
  "clue-detective": { Icon: BrainIcon, className: "is-yellow", skill: "Inferencia" },
  memory: { Icon: CardsThreeIcon, className: "is-violet", skill: "Memoria semántica" },
  sequence: { Icon: ListNumbersIcon, className: "is-coral", skill: "Secuenciación" },
  "decision-maze": { Icon: SignpostIcon, className: "is-aqua", skill: "Planificación" },
  "emotion-theater": { Icon: MaskHappyIcon, className: "is-rose", skill: "Empatía" },
  "word-forge": { Icon: FactoryIcon, className: "is-orange", skill: "Vocabulario" },
  "evidence-board": { Icon: BinocularsIcon, className: "is-blue", skill: "Pensamiento crítico" },
  "cause-machine": { Icon: GearSixIcon, className: "is-green", skill: "Causalidad" },
  "perspective-prism": { Icon: EyeIcon, className: "is-indigo", skill: "Perspectiva" },
  "story-map": { Icon: CompassIcon, className: "is-teal", skill: "Orientación espacial" },
};

export function MiniGameArcade({ catalog, rewards, onRewardsChange }: { catalog: PlatformCatalog; rewards: RewardState; onRewardsChange: (state: RewardState) => void }) {
  const [activeGame, setActiveGame] = useState<GameDefinition | null>(null);
  const games = catalog.games.map((game) => ({
    id: game.id,
    title: game.label,
    description: game.description,
    threshold: game.threshold,
    ...gameVisuals[game.id],
  }));

  return <motion.section className="arcade reward-panel" initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .15 }}>
    <div className="arcade__heading">
      <div className="panel-title"><PlayIcon size={29} weight="fill"/><div><span className="eyebrow">10 laboratorios cognitivos</span><h2>Sala de minijuegos</h2></div></div>
      <p>Cada desafío entrena una habilidad diferente. Las 24 cartas tienen efectos propios y nunca alteran el puntaje académico.</p>
    </div>
    <div className="arcade-grid">{games.map((game, index) => {
      const unlocked = rewards.totalStars >= game.threshold;
      const remaining = Math.max(0, game.threshold - rewards.totalStars);
      return <motion.article
        key={game.id}
        className={`arcade-card ${game.className} ${unlocked ? "is-unlocked" : "is-locked"}`}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: Math.min(index * .055, .38), type: "spring", stiffness: 170, damping: 20 }}
        whileHover={unlocked ? { y: -7, rotate: index % 2 ? .45 : -.45 } : { y: -2 }}
      >
        <span className="arcade-card__number">{String(index + 1).padStart(2, "0")}</span>
        <span className="arcade-card__spark"><SparkleIcon weight="fill"/></span>
        <span className="arcade-card__icon"><game.Icon size={46} weight="duotone"/></span>
        <span className="arcade-card__status">{unlocked ? <><LockKeyOpenIcon/> Desbloqueado</> : <><StarFourIcon weight="fill"/> {game.threshold} estrellas</>}</span>
        <span className="arcade-card__skill">Entrena · {game.skill}</span>
        <h3>{game.title}</h3>
        <p>{game.description}</p>
        {unlocked
          ? <motion.button type="button" onClick={() => setActiveGame(game)} whileTap={{ scale: .96 }}><PlayIcon weight="fill"/> Jugar ahora</motion.button>
          : <div className="arcade-card__progress" aria-label={`Faltan ${remaining} estrellas`}><span style={{ width: `${Math.min(100, rewards.totalStars / game.threshold * 100)}%` }}/><small>Faltan {remaining} estrellas</small></div>}
      </motion.article>;
    })}</div>
    <AnimatePresence>{activeGame ? <MiniGameModal game={activeGame} catalog={catalog} rewards={rewards} onRewardsChange={onRewardsChange} onClose={() => setActiveGame(null)}/> : null}</AnimatePresence>
  </motion.section>;
}

function MiniGameModal({ game, catalog, rewards, onRewardsChange, onClose }: { game: GameDefinition; catalog: PlatformCatalog; rewards: RewardState; onRewardsChange: (state: RewardState) => void; onClose: () => void }) {
  const reduceMotion = useReducedMotion();
  const [round, setRound] = useState(0);
  const [showCards, setShowCards] = useState(false);
  const [usedCard, setUsedCard] = useState<WorldCard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [using, setUsing] = useState(false);
  const [difficulty, setDifficulty] = useState<GameDifficulty>("adventurer");
  const [sessionId] = useState(() => crypto.randomUUID());
  const compatible = catalog.cards.filter((card) => (card.gameId === null || card.gameId === game.id) && rewards.unlockedCardIds.includes(card.id));

  async function useCard(card: WorldCard) {
    setUsing(true);
    setError(null);
    try {
      onRewardsChange(await api.consumeCard(card.id, game.id, sessionId));
      setUsedCard(card);
      setShowCards(false);
    } catch (useError) {
      setError(useError instanceof ApiClientError ? useError.message : "No pudimos usar esa carta.");
    } finally {
      setUsing(false);
    }
  }

  return <motion.div className="game-modal" role="dialog" aria-modal="true" aria-labelledby="game-title" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <motion.div className={`game-modal__card ${game.className}`} initial={reduceMotion ? false : { opacity: 0, y: 40, scale: .88 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 25, scale: .92 }} transition={{ type: "spring", stiffness: 220, damping: 22 }}>
      <div className="game-modal__topbar"><div><game.Icon size={29} weight="duotone"/><span><small>{game.skill}</small><strong id="game-title">{game.title}</strong></span></div><div className="game-power-actions"><button type="button" className={usedCard ? "is-used" : ""} disabled={Boolean(usedCard)} onClick={() => setShowCards(true)}>{usedCard ? <><CheckCircleIcon weight="fill"/> {usedCard.label}</> : <><CardsThreeIcon weight="duotone"/> Usar carta</>}</button><button type="button" aria-label="Cerrar minijuego" onClick={onClose}><XIcon weight="bold"/></button></div></div>
      <div className="game-difficulty" aria-label="Nivel de dificultad"><span><strong>Elegí el desafío</strong><small>Cada nivel cambia cantidad de pistas, piezas y decisiones.</small></span><div>{gameDifficultyOptions.map((option) => <motion.button key={option.id} type="button" aria-pressed={difficulty === option.id} title={option.description} onClick={() => { setDifficulty(option.id); setRound((value) => value + 1); }} whileTap={{ scale: .95 }}><span>{Array.from({ length: option.stars }, (_, index) => <StarFourIcon key={index} weight="fill"/>)}</span>{option.label}</motion.button>)}</div></div>
      <CognitiveGameSession gameId={game.id} key={`${game.id}-${round}`} difficulty={difficulty} seed={`${sessionId}-${round}-${difficulty}`} power={usedCard?.power ?? null} onReplay={() => { setRound((value) => value + 1); setUsedCard(null); setError(null); }}/>
      <AnimatePresence>{showCards ? <motion.aside className="power-drawer" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 210, damping: 25 }}>
        <header><div><small>Mochila de poderes · efectos únicos</small><h3>Elegí una ayuda para esta partida</h3></div><button type="button" aria-label="Cerrar mochila" onClick={() => setShowCards(false)}><XIcon/></button></header>
        <p>Estas cartas están diseñadas para <strong>{game.title}</strong>. Se consume una carga al confirmarla y sólo podés usar una por partida.</p>
        <div>{compatible.map((card) => {
          const quantity = rewards.cardInventory[card.id] ?? 0;
          return <motion.button key={card.id} type="button" disabled={using || quantity < 1} onClick={() => void useCard(card)} whileHover={{ y: -2 }} whileTap={{ scale: .98 }}>
            <img src={cardArtUrl(card.assetId)} alt=""/><span><small>{card.powerLabel}</small><strong>{card.label}</strong><em>{card.powerDescription}</em></span><b><SparkleIcon weight="fill"/> {quantity}</b>
          </motion.button>;
        })}</div>
        {compatible.length === 0 ? <p className="power-drawer__empty">Descubrí cartas en el mapa para usar ayudas.</p> : null}
        {error ? <p className="form-error" role="alert">{error}</p> : null}
      </motion.aside> : null}</AnimatePresence>
    </motion.div>
  </motion.div>;
}
