import type { PlatformCatalog, RewardState } from "@story-teacher/shared";
import { motion, useReducedMotion } from "motion/react";
import { CardsThreeIcon, CheckCircleIcon, GiftIcon, MapTrifoldIcon, SparkleIcon, StarFourIcon } from "./icons";
import { CharacterAvatar } from "./CharacterAvatar";
import { StoryThemeIcon } from "./VisualIcons";

export function WorldAdventureMap({ catalog, rewards }: { catalog: PlatformCatalog; rewards: RewardState }) {
  const reduceMotion = useReducedMotion();
  return <section className="reward-panel adventure-atlas">
    <div className="atlas-heading"><div className="panel-title"><MapTrifoldIcon size={30} weight="duotone"/><div><span className="eyebrow">6 mundos · 24 hitos</span><h2>Atlas de aventuras</h2></div></div><p>Cada cuento con 60% o más hace avanzar su mundo. Después del cuarto hito, las nuevas lecturas recargan cartas.</p></div>
    <div className="world-grid">
      {catalog.worlds.map((world, worldIndex) => {
        const count = rewards.worldMasteryCounts[world.id] ?? 0;
        const progress = Math.min(4, count);
        const next = progress < 4 ? progress + 1 : null;
        return <motion.article key={world.id} className={`world-route world-route--${world.id}`} style={{ "--world-accent": world.accent } as never} initial={reduceMotion ? false : { opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .2 }} transition={{ delay: worldIndex * .06, type: "spring", stiffness: 160, damping: 20 }}>
          <header><span className="world-route__icon"><StoryThemeIcon theme={world.id} size={37}/></span><div><small>{progress === 4 ? "Mundo completado" : `Próximo: hito ${next}`}</small><h3>{world.label}</h3><p>{world.description}</p></div><strong>{progress}/4</strong></header>
          <div className="world-route__track" aria-label={`${world.label}: ${progress} de 4 hitos`}>
            <motion.i initial={{ scaleX: 0 }} whileInView={{ scaleX: progress / 4 }} viewport={{ once: true }} transition={{ duration: reduceMotion ? 0 : .75, delay: .15 }} />
            {[1,2,3,4].map((milestone) => {
              const reached = progress >= milestone;
              const card = catalog.cards.find((candidate) => candidate.worldId === world.id && candidate.milestone === milestone);
              const avatar = catalog.avatars.find((candidate) => candidate.worldId === world.id && candidate.milestone === milestone);
              return <motion.div key={milestone} className={`world-stop ${reached ? "is-reached" : ""} ${next === milestone ? "is-next" : ""}`} initial={reduceMotion ? false : { scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: .12 + milestone * .08, type: "spring" }}><span>{reached ? <CheckCircleIcon weight="fill"/> : <StarFourIcon weight="duotone"/>}</span><small>Hito {milestone}</small><b><CardsThreeIcon weight={reached ? "fill" : "duotone"}/>{card?.label}</b>{avatar ? <em><CharacterAvatar avatarId={avatar.id} size={34}/>{avatar.label.split(",")[0]}</em> : <em><GiftIcon/> Carga inicial</em>}</motion.div>;
            })}
          </div>
          <footer>{progress === 4 ? <><SparkleIcon weight="fill"/> Seguís ganando una carga por cada nuevo cuento aprobado.</> : <>Completá {4-progress} {4-progress === 1 ? "cuento" : "cuentos"} más de este tema.</>}</footer>
        </motion.article>;
      })}
    </div>
  </section>;
}
