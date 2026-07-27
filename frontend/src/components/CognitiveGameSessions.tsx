import type { Icon } from "@phosphor-icons/react";
import type { CardPower, GameId } from "@story-teacher/shared";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowClockwiseIcon,
  BinocularsIcon,
  BooksIcon,
  BrainIcon,
  ChatCircleDotsIcon,
  CheckCircleIcon,
  CompassIcon,
  EyeIcon,
  FactoryIcon,
  FlagCheckeredIcon,
  FootprintsIcon,
  GearSixIcon,
  HeartIcon,
  LightbulbFilamentIcon,
  MagicWandIcon,
  MaskHappyIcon,
  PathIcon,
  PuzzlePieceIcon,
  SignpostIcon,
  SparkleIcon,
  StarFourIcon,
  TextAaIcon,
  TreeStructureIcon,
  TrophyIcon,
} from "./icons";
import { createSeededRandom, difficultyIndex, sample, shuffled, type GameDifficulty } from "./gameEngine";

interface SessionProps {
  gameId: GameId;
  power: CardPower | null;
  difficulty: GameDifficulty;
  seed: string;
  onReplay: () => void;
}

interface GameProps extends Omit<SessionProps, "gameId"> {}

export function CognitiveGameSession({ gameId, power, difficulty, seed, onReplay }: SessionProps) {
  let game: React.ReactNode;
  const props = { power, difficulty, seed, onReplay };
  if (gameId === "memory") game = <MemoryGame {...props}/>;
  else if (gameId === "sequence") game = <SequenceGame {...props}/>;
  else if (gameId === "decision-maze") game = <DecisionMaze {...props}/>;
  else if (gameId === "emotion-theater") game = <EmotionTheater {...props}/>;
  else if (gameId === "word-forge") game = <WordForge {...props}/>;
  else if (gameId === "evidence-board") game = <EvidenceBoard {...props}/>;
  else if (gameId === "cause-machine") game = <CauseMachine {...props}/>;
  else if (gameId === "perspective-prism") game = <PerspectivePrism {...props}/>;
  else if (gameId === "story-map") game = <StoryMap {...props}/>;
  else game = <DetectiveGame {...props}/>;
  return <div className={`cognitive-game-frame difficulty-${difficulty}`}><GameAtmosphere seed={`${seed}-${gameId}`}/>{game}</div>;
}

function GameAtmosphere({ seed }: { seed: string }) {
  const reduceMotion = useReducedMotion();
  const particles = useMemo(() => {
    const random = createSeededRandom(seed);
    return Array.from({ length: 8 }, (_, index) => ({ id: index, left: 4 + random() * 92, top: 5 + random() * 88, size: 5 + random() * 9, delay: random() * 2 }));
  }, [seed]);
  return <div className="cognitive-atmosphere" aria-hidden="true">{particles.map((particle) => <motion.i key={particle.id} style={{ left: `${particle.left}%`, top: `${particle.top}%`, width: particle.size, height: particle.size }} animate={reduceMotion ? {} : { y: [0, -9, 0], rotate: [0, 90, 180], opacity: [.2, .65, .2] }} transition={{ duration: 3.4 + particle.delay, delay: particle.delay, repeat: Infinity, ease: "easeInOut" }}/>)}</div>;
}

function Progress({ current, total, label = "desafío" }: { current: number; total: number; label?: string }) {
  return <div className="cognitive-progress"><motion.span animate={{ width: `${Math.min(100, current / total * 100)}%` }}/><small>{label} {Math.min(current + 1, total)} de {total}</small></div>;
}

function countFor(difficulty: GameDifficulty, values: [number, number, number]) {
  return values[difficultyIndex[difficulty]]!;
}

function shuffledAnswers(options: readonly string[], answer: number, seed: string, difficulty: GameDifficulty) {
  const all = options.map((label, index) => ({ label, correct: index === answer }));
  if (difficulty !== "explorer") return shuffled(all, seed);
  const correct = all.find((option) => option.correct)!;
  return shuffled([correct, ...sample(all.filter((option) => !option.correct), 2, `${seed}-easy`)], seed);
}

const detectiveChallenges = [
  { id:"storm", skill:"Inferencia", story:"Nara llevó una linterna al jardín aunque todavía era de día. Miró las nubes oscuras y guardó también una capa en su mochila.", clue:"nubes oscuras y guardó también una capa", keyword:"aunque", strategy:"¿Qué podría ocurrir si el cielo está oscuro y Nara lleva una capa?", question:"¿Qué cree Nara que podría ocurrir?", options:["Que llegará una tormenta","Que el jardín desaparecerá","Que encontrará un libro","Que la linterna crecerá"], answer:0, explanation:"Las nubes oscuras y la capa permiten inferir que espera lluvia." },
  { id:"caution", skill:"Vocabulario", story:"Cuando comenzó a llover, Nara caminó con cautela para no pisar los pequeños brotes.", clue:"para no pisar los pequeños brotes", keyword:"cautela", strategy:"¿Qué manera de caminar ayudaría a proteger los brotes?", question:"¿Qué significa ‘con cautela’ en esta oración?", options:["Con mucho cuidado","Con mucha velocidad","Sin prestar atención","Haciendo mucho ruido"], answer:0, explanation:"El contexto muestra que avanza con cuidado para proteger los brotes." },
  { id:"stones", skill:"Causa y consecuencia", story:"La lluvia apagó la linterna, pero Nara recordó las piedras claras del sendero y pudo regresar a casa.", clue:"recordó las piedras claras del sendero", keyword:"pero", strategy:"¿Qué acción produjo el resultado de volver a casa?", question:"¿Por qué Nara logró regresar?", options:["Porque siguió las piedras claras","Porque dejó de llover","Porque encontró otra linterna","Porque el jardín se iluminó"], answer:0, explanation:"Recordar las piedras fue la causa que le permitió orientarse." },
  { id:"silent-clock", skill:"Inferencia", story:"Tomás dejó el reloj sobre una manta, cerró la puerta con suavidad y habló en susurros mientras su hermana dormía.", clue:"cerró la puerta con suavidad y habló en susurros", keyword:"mientras", strategy:"Uní las acciones de Tomás con lo que intenta evitar.", question:"¿Qué intención tiene Tomás?", options:["Evitar despertar a su hermana","Reparar el reloj","Esconder la manta","Salir rápidamente"], answer:0, explanation:"Sus movimientos cuidadosos y los susurros muestran que quiere mantener el silencio." },
  { id:"empty-bowl", skill:"Secuencia lógica", story:"Alma encontró el cuenco vacío, vio pequeñas huellas junto a la ventana y después buscó a su gato en el patio.", clue:"cuenco vacío y pequeñas huellas", keyword:"después", strategy:"Pensá qué observaciones explican la decisión final.", question:"¿Por qué Alma fue al patio?", options:["Porque creyó que el gato había salido","Porque quería lavar el cuenco","Porque escuchó música","Porque empezó a nevar"], answer:0, explanation:"El cuenco y las huellas hacen razonable buscar al gato afuera." },
  { id:"warm-bread", skill:"Vocabulario en contexto", story:"El aroma del pan recién hecho invadió el pasillo y todos se acercaron a la cocina.", clue:"todos se acercaron a la cocina", keyword:"invadió", strategy:"Probá reemplazar la palabra sin perder la idea de que el aroma llegó a todo el lugar.", question:"¿Qué significa ‘invadió’ en este contexto?", options:["Se extendió por todo el lugar","Rompió una puerta","Desapareció por completo","Se volvió silencioso"], answer:0, explanation:"Aquí ‘invadió’ significa que el aroma se extendió y pudo sentirse en todo el pasillo." },
] as const;

function DetectiveGame({ power, difficulty, seed, onReplay }: GameProps) {
  const challenges = useMemo(() => sample(detectiveChallenges, countFor(difficulty,[2,3,4]), `${seed}-cases`), [difficulty, seed]);
  const [round,setRound]=useState(0); const [selected,setSelected]=useState<number|null>(null); const [score,setScore]=useState(0); const [streak,setStreak]=useState(0);
  const challenge=challenges[round];
  if(!challenge) return <GameWon title={`¡Caso resuelto: ${score}/${challenges.length}!`} copy="Cada nueva partida mezcla otros casos, palabras y explicaciones." onReplay={onReplay}/>;
  const options=shuffledAnswers(challenge.options,challenge.answer,`${seed}-${challenge.id}-answers`,difficulty); const correct=options.findIndex(item=>item.correct);
  const showClue=difficulty==="explorer"||power==="nebula-spotlight"||power==="lumi-adapt"; const showStrategy=power==="oracle-question"||power==="lumi-adapt"; const showZoom=power==="gear-zoom"; const removed=power==="lumi-adapt"?options.findIndex(item=>!item.correct):-1;
  function next(){if(selected===correct){setScore(v=>v+1);setStreak(v=>v+1);}else setStreak(0);setSelected(null);setRound(v=>v+1);}
  return <div className="detective-game cognitive-session"><Progress current={round} total={challenges.length} label="caso"/><Streak value={streak}/><div className="detective-story"><span><BooksIcon/></span><p>{challenge.story}</p>{showZoom?<motion.b className="keyword-zoom" initial={{scale:.7}} animate={{scale:1}}><EyeIcon/> Palabra decisiva: {challenge.keyword}</motion.b>:null}</div>{showClue?<motion.p className="power-hint" initial={{opacity:0,y:-5}} animate={{opacity:1,y:0}}><SparkleIcon weight="fill"/> Evidencia iluminada: “{challenge.clue}”.</motion.p>:null}{showStrategy?<p className="power-hint"><LightbulbFilamentIcon/> Pregunta del oráculo: {challenge.strategy}</p>:null}<span className="detective-skill"><BrainIcon/> {challenge.skill}</span><h3>{challenge.question}</h3><div className="detective-options">{options.map((option,index)=><motion.button key={option.label} type="button" disabled={selected!==null||index===removed} className={`${selected===index?(option.correct?"is-correct":"is-wrong"):""} ${index===removed?"is-removed":""}`} onClick={()=>setSelected(index)} whileTap={{scale:.98}}><span>{String.fromCharCode(65+index)}</span>{index===removed?"Lumi descartó esta hipótesis":option.label}{selected!==null&&option.correct?<CheckCircleIcon weight="fill"/>:null}</motion.button>)}</div>{selected!==null?<Feedback correct={selected===correct} explanation={challenge.explanation} action={round===challenges.length-1?"Ver resultado":"Siguiente caso"} onContinue={next}/>:null}</div>;
}

const memoryPairs: Array<{ pair:string; object:string; meaning:string; Icon:Icon }> = [
  {pair:"compass",object:"Brújula",meaning:"Ayuda a orientarse",Icon:CompassIcon},{pair:"book",object:"Libro",meaning:"Guarda historias",Icon:BooksIcon},{pair:"idea",object:"Idea",meaning:"Nace al buscar soluciones",Icon:LightbulbFilamentIcon},{pair:"seed",object:"Semilla",meaning:"Puede convertirse en una planta",Icon:SparkleIcon},{pair:"clock",object:"Reloj",meaning:"Permite organizar el tiempo",Icon:ArrowClockwiseIcon},{pair:"gear",object:"Engranaje",meaning:"Transmite movimiento a otra pieza",Icon:GearSixIcon},{pair:"path",object:"Sendero",meaning:"Conecta un lugar con otro",Icon:PathIcon},
];

function MemoryGame({ power, difficulty, seed, onReplay }: GameProps) {
  const cards = useMemo(() => {
    const pairs = sample(memoryPairs, countFor(difficulty, [3, 4, 5]), `${seed}-pairs`);
    return shuffled(
      pairs.flatMap((item) => [
        { id: `${item.pair}-object`, pair: item.pair, label: item.object, Icon: item.Icon, kind: "object" as const },
        { id: `${item.pair}-meaning`, pair: item.pair, label: item.meaning, Icon: null, kind: "meaning" as const },
      ]),
      `${seed}-cards`,
    );
  }, [difficulty, seed]);

  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [powerReveal, setPowerReveal] = useState<number[]>([]);
  const [remembered, setRemembered] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number[]>([]);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!power) return;
    const unmatched = cards.map((_, i) => i).filter((i) => !matched.includes(i));
    const first = unmatched[0];
    if (first === undefined) return;
    const second = unmatched.find((i) => i !== first && cards[i]!.pair === cards[first]!.pair);
    if ((power === "mirror-match" || power === "lumi-adapt") && second !== undefined)
      setMatched((v) => Array.from(new Set([...v, first, second])));
    else if (power === "orbit-preview") {
      setPowerReveal([first]);
      const t = window.setTimeout(() => setPowerReveal([]), 2200);
      return () => window.clearTimeout(t);
    }
  }, [power]);

  useEffect(() => {
    if (open.length !== 2) return;
    const [first, second] = open;
    if (first === undefined || second === undefined) return;
    setAttempts((v) => v + 1);
    if (cards[first]!.pair === cards[second]!.pair) {
      setMatched((v) => Array.from(new Set([...v, first, second])));
      setOpen([]);
      setRemembered([]);
      return;
    }
    setWrong([first, second]);
    if (power === "seed-recall") setRemembered([first, second]);
    const t = window.setTimeout(() => { setOpen([]); setWrong([]); }, 1100);
    return () => window.clearTimeout(t);
  }, [open, power]);

  if (matched.length === cards.length)
    return <GameWon title="¡Red de memoria completa!" copy={`Uniste ${cards.length / 2} conceptos en ${attempts} intentos. La próxima red tendrá otra disposición.`} onReplay={onReplay} />;

  const total = cards.length / 2;
  const found = matched.length / 2;

  function pick(index: number) {
    if (matched.includes(index) || open.length === 2 || powerReveal.length > 0) return;
    setOpen((v) => [...v, index]);
  }

  function renderCard(card: typeof cards[number], index: number) {
    const isOpen = open.includes(index) || matched.includes(index) || powerReveal.includes(index) || remembered.includes(index);
    const isWrong = wrong.includes(index);
    const isMatched = matched.includes(index);
    const CardIcon = card.Icon;
    return (
      <motion.button
        key={card.id}
        type="button"
        aria-label={isOpen ? card.label : `Carta oculta ${index + 1}`}
        className={[
          isMatched ? "is-matched" : "",
          isWrong ? "is-wrong" : "",
          powerReveal.includes(index) ? "is-scanned" : "",
          remembered.includes(index) ? "is-remembered" : "",
          card.kind,
        ].filter(Boolean).join(" ")}
        disabled={false}
        aria-disabled={isMatched || open.length >= 2 || powerReveal.length > 0}
        onClick={() => pick(index)}
        animate={{ rotateY: isOpen ? 180 : 0 }}
        whileHover={!isOpen && !isMatched ? { scale: 1.04 } : {}}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
      >
        <span className="mg-card__back"><SparkleIcon weight="fill" /></span>
        <span className="mg-card__front">
          {CardIcon ? <CardIcon size={28} weight="duotone" /> : null}
          <small>{card.label}</small>
        </span>
      </motion.button>
    );
  }

  const splitAt = cards.length === 8 ? 6 : cards.length;
  const mainCards = cards.slice(0, splitAt);
  const sideCards = cards.slice(splitAt);
  const mainIndices = mainCards.map((_, i) => i);
  const sideIndices = sideCards.map((_, i) => i + splitAt);

  return (
    <div className="memory-game cognitive-session">
      <div className="session-instruction">
        <BrainIcon />
        <p>Relacioná objetos con sus funciones. En Maestro aparecen cinco parejas y más asociaciones simultáneas.</p>
        <b>{found}/{total}</b>
      </div>
      {remembered.length ? (
        <p className="power-hint"><SparkleIcon /> La Semilla recuerda las posiciones {remembered.map((item) => item + 1).join(" y ")}.</p>
      ) : null}
      <div className="mg-progress"><div className="mg-progress__bar"><motion.i initial={{ scaleX: 0 }} animate={{ scaleX: found / total }} transition={{ type: "spring", stiffness: 120, damping: 18 }} /></div></div>
      <div className={`mg-board${sideCards.length ? " mg-board--split" : ""}`}>
        <div className={`memory-grid memory-grid--semantic memory-grid--${mainCards.length}`}>
          {mainCards.map((card, i) => renderCard(card, mainIndices[i]!))}
        </div>
        {sideCards.length ? (
          <div className="mg-side">
            <div className="memory-grid memory-grid--side">
              {sideCards.map((card, i) => renderCard(card, sideIndices[i]!))}
            </div>
          </div>
        ) : null}
      </div>
      <p className="attempt-counter">{attempts} intentos · el tablero cambia en cada partida</p>
    </div>
  );
}

const sequenceStories = [
  {id:"plant",title:"La planta de Mila",events:["Mila encontró una planta con las hojas caídas.","Observó la maceta y tocó la tierra con un dedo.","Descubrió que la tierra estaba completamente seca.","Buscó agua y calculó una cantidad pequeña.","La regó y al día siguiente las hojas volvieron a levantarse."]},
  {id:"kite",title:"El barrilete perdido",events:["Leo notó que el barrilete ya no estaba atado al banco.","Buscó marcas del hilo entre los arbustos.","Vio un trozo rojo enganchado en una rama.","Siguió la dirección de las ramas movidas.","Encontró el barrilete detrás del viejo molino."]},
  {id:"robot",title:"El robot silencioso",events:["Ada intentó encender su pequeño robot.","Comprobó que la pantalla no mostraba ninguna señal.","Abrió la tapa y encontró un cable suelto.","Volvió a conectar el cable siguiendo el plano.","El robot encendió sus luces y completó el recorrido."]},
  {id:"shell",title:"El mensaje de la caracola",events:["Timo encontró una caracola marcada junto al muelle.","Comparó la marca con el mapa del arrecife.","Descubrió que señalaba una cueva poco profunda.","Esperó a que bajara la marea para entrar.","Dentro halló una caja con dibujos de antiguas rutas."]},
] as const;

function SequenceGame({power,difficulty,seed,onReplay}:GameProps){
  const story=useMemo(()=>sample(sequenceStories,1,`${seed}-story`)[0]!,[seed]);const total=countFor(difficulty,[3,4,5]);const scenes=useMemo(()=>shuffled(story.events.slice(0,total).map((label,index)=>({order:index+1,label,Icon:[BooksIcon,EyeIcon,BrainIcon,MagicWandIcon,TrophyIcon][index]!})),`${seed}-scenes`),[seed,total,story]);
  const [nextOrder,setNextOrder]=useState(1);const[mistake,setMistake]=useState<number|null>(null);const[hint,setHint]=useState<string|null>(null);
  useEffect(()=>{if(power==="gravity-first"||power==="lumi-adapt"){setNextOrder(v=>Math.max(v,2));setHint("La gravedad fijó el acontecimiento que presenta el problema.");}if(power==="blueprint-ghost")setHint("El plano fantasma numera la estructura: situación, búsqueda, descubrimiento, acción y resultado.");},[power]);
  const completed=scenes.filter(scene=>scene.order<nextOrder).map(scene=>scene.order);if(nextOrder>total)return <GameWon title={`¡${story.title} reconstruida!`} copy="La próxima partida elegirá otra historia y volverá a mezclar sus escenas." onReplay={onReplay}/>;
  function select(order:number){if(order===nextOrder){setNextOrder(v=>v+1);setMistake(null);}else{setMistake(order);window.setTimeout(()=>setMistake(null),450);}}
  return <div className="sequence-game cognitive-session"><div className="session-instruction"><TreeStructureIcon/><p><strong>{story.title}.</strong> Elegí qué hecho hace posible el siguiente.</p></div>{hint?<p className="power-hint"><LightbulbFilamentIcon/> {hint}</p>:null}<div>{scenes.map(({order,label,Icon})=><motion.button key={order} type="button" disabled={completed.includes(order)} className={`${completed.includes(order)?"is-complete":""} ${difficulty==="explorer"&&order===nextOrder?"is-suggested":""} ${power==="blueprint-ghost"?"has-blueprint":""}`} data-ghost={power==="blueprint-ghost"?order:undefined} animate={mistake===order?{x:[-7,7,-5,5,0]}:{}} onClick={()=>select(order)}><span>{completed.includes(order)?<strong>{order}</strong>:<Icon/>}</span><strong>{label}</strong><small>{completed.includes(order)?`Escena ${order} ubicada`:difficulty==="explorer"&&order===nextOrder?"Esta escena tiene una pista suave":"Elegir como próxima escena"}</small></motion.button>)}</div></div>;
}

const mazeWorlds = [
  {id:"library",name:"Biblioteca del río",steps:[{scene:"Ivo encuentra huellas mojadas que van hacia dos senderos.",clue:"La biblioteca está junto al río.",options:[["Cruzar el puente azul",PathIcon,true],["Entrar al túnel seco",SignpostIcon,false],["Subir a la colina",StarFourIcon,false]]},{scene:"Una señal cayó y sólo se ven tres símbolos.",clue:"Ivo busca el lugar donde guardan mapas y libros.",options:[["Seguir el símbolo del balón",StarFourIcon,false],["Seguir el símbolo del libro",BooksIcon,true],["Seguir el símbolo del árbol",TreeStructureIcon,false]]},{scene:"La puerta tiene varios mecanismos y comienza a oscurecer.",clue:"La nota pide usar primero la pieza que refleja la luz.",options:[["Girar la rueda de madera",GearSixIcon,false],["Levantar el cristal brillante",SparkleIcon,true],["Tirar de la cuerda roja",PathIcon,false]]},{scene:"El último corredor tiene eco y dos flechas.",clue:"La sala de lectura es el lugar más silencioso del edificio.",options:[["Seguir las voces",ChatCircleDotsIcon,false],["Elegir el corredor silencioso",EyeIcon,true],["Volver al río",CompassIcon,false]]}]},
  {id:"reef",name:"Arrecife cambiante",steps:[{scene:"Ota ve burbujas que se separan en tres direcciones.",clue:"El mapa indica que la cueva está contra la corriente.",options:[["Seguir las burbujas rápidas",SparkleIcon,false],["Nadar hacia la corriente suave",PathIcon,true],["Bajar al fondo oscuro",SignpostIcon,false]]},{scene:"Dos corales forman arcos parecidos.",clue:"La marca correcta tiene cuatro puntas.",options:[["Arco con estrella de cuatro puntas",StarFourIcon,true],["Arco con círculo azul",CompassIcon,false],["Arco sin ninguna marca",EyeIcon,false]]},{scene:"Una corriente mueve todas las algas.",clue:"Detrás de las algas quietas debe existir una pared.",options:[["Pasar por las algas que se mueven",PathIcon,true],["Empujar las algas quietas",TreeStructureIcon,false],["Esperar sin observar",HeartIcon,false]]},{scene:"La salida se divide frente a una perla luminosa.",clue:"La brújula apunta hacia aguas menos profundas.",options:[["Ascender hacia la luz",SparkleIcon,true],["Descender hacia las rocas",GearSixIcon,false],["Seguir girando alrededor",ArrowClockwiseIcon,false]]}]},
  {id:"city",name:"Ciudad de engranajes",steps:[{scene:"Ada llega a tres cintas transportadoras.",clue:"El plano marca piezas livianas antes que pesadas.",options:[["Cinta de plumas metálicas",SparkleIcon,true],["Cinta de bloques enormes",GearSixIcon,false],["Cinta detenida",SignpostIcon,false]]},{scene:"Un ascensor muestra símbolos incompletos.",clue:"La secuencia visible es círculo, cuadrado, círculo…",options:[["Elegir el cuadrado",PuzzlePieceIcon,true],["Elegir la estrella",StarFourIcon,false],["Elegir otro círculo",CompassIcon,false]]},{scene:"Tres puertas consumen diferente energía.",clue:"Queda una sola carga y una puerta usa exactamente una.",options:[["Puerta de tres rayos",SparkleIcon,false],["Puerta de un rayo",LightbulbFilamentIcon,true],["Puerta sin indicador",EyeIcon,false]]},{scene:"El taller central está detrás de un sonido repetido.",clue:"El motor del taller hace dos golpes y una pausa.",options:[["Dos golpes y una pausa",GearSixIcon,true],["Un sonido continuo",ChatCircleDotsIcon,false],["Tres campanas rápidas",StarFourIcon,false]]}]},
] as const;

function DecisionMaze({power,difficulty,seed,onReplay}:GameProps){
  const world=useMemo(()=>sample(mazeWorlds,1,`${seed}-maze`)[0]!,[seed]);const total=countFor(difficulty,[2,3,4]);const maxEnergy=countFor(difficulty,[4,3,2]);const[step,setStep]=useState(0);const[energy,setEnergy]=useState(maxEnergy);const[message,setMessage]=useState<string|null>(null);const[usedShortcut,setUsedShortcut]=useState(false);const[locked,setLocked]=useState(false);
  useEffect(()=>{if((power==="comet-shortcut"||power==="lumi-adapt")&&!usedShortcut&&step<total){setUsedShortcut(true);setMessage("El Portal de Cometa abrió un atajo seguro.");setStep(v=>v+1);}},[power]);
  if(step>=total)return <GameWon title={`¡Llegaste a ${world.name}!`} copy={`Conservaste ${energy} de ${maxEnergy} cargas. Otro laberinto te espera en la próxima partida.`} onReplay={onReplay}/>;if(energy<=0)return <GameWon title="El mapa necesita otra mirada" copy="Probá otra ruta: las pistas cambian, pero siempre explican una decisión segura." onReplay={onReplay}/>;
  const current=world.steps[step]!;const allOptions=shuffled(current.options.map(([label,Icon,correct])=>({label,Icon,correct})),`${seed}-${world.id}-${step}`);const options=difficulty==="explorer"?shuffled([allOptions.find(option=>option.correct)!,allOptions.find(option=>!option.correct)!],`${seed}-${step}-easy`):allOptions;const beacon=power==="coral-beacon"||power==="lumi-adapt";const shield=power==="rewind-move"||power==="lumi-adapt";
  function choose(correct:boolean){if(locked)return;if(correct){setLocked(true);setMessage("¡La pista y la decisión encajan!");window.setTimeout(()=>{setStep(v=>v+1);setMessage(null);setLocked(false);},500);}else{setMessage(shield?"Rebobinaste a tiempo: compará otra vez la pista.":"Ese camino contradice una pista y consume energía.");if(!shield)setEnergy(v=>v-1);}}
  return <div className="maze-game cognitive-session"><div className="maze-dashboard"><Progress current={step} total={total} label="cruce"/><span aria-label={`${energy} cargas de energía`}>{Array.from({length:maxEnergy},(_,index)=><HeartIcon key={index} weight={index<energy?"fill":"regular"}/>)}</span></div><div className="maze-visual"><motion.span animate={{x:`${step*Math.max(1,288/(total-1))}%`}}><FootprintsIcon weight="fill"/></motion.span>{Array.from({length:total},(_,index)=><i key={index} className={index<step?"is-done":""}/>)}</div><div className="maze-scene"><BinocularsIcon/><div><small>{world.name}</small><h3>{current.scene}</h3><p>{current.clue}</p></div></div><div className="maze-choices">{options.map(({label,Icon,correct})=><motion.button key={label} type="button" disabled={locked} className={beacon&&correct?"is-beacon":""} onClick={()=>choose(correct)} whileHover={{y:-4}} whileTap={{scale:.97}}><Icon size={39} weight="duotone"/><strong>{label}</strong><small>{beacon&&correct?"La brújula vibra acá":"Explorar este camino"}</small></motion.button>)}</div><AnimatePresence>{message?<motion.p className="maze-message" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}}>{message}</motion.p>:null}</AnimatePresence></div>;
}

const emotionScenes=[
  {id:"drawing",face:"worried",scene:"Mara apretó su dibujo contra el pecho mientras esperaba que la maestra lo mostrara.",thought:"Espero que les guste; trabajé toda la tarde.",cue:"hombros elevados y dibujo protegido",question:"¿Qué mezcla de emociones siente Mara?",options:["Nervios y orgullo","Enojo y aburrimiento","Sorpresa y sueño","Calma e indiferencia"],answer:0},
  {id:"team",face:"relieved",scene:"Al escuchar su nombre, Teo soltó el aire lentamente y dejó de sujetar el borde de la silla.",thought:"Al fin sé que mi equipo llegó bien.",cue:"suelta el aire y relaja las manos",question:"¿Cómo cambia la emoción de Teo?",options:["De preocupación a alivio","De alegría a celos","De calma a enojo","De sorpresa a aburrimiento"],answer:0},
  {id:"note",face:"curious",scene:"Lila inclinó la cabeza, acercó la lupa y volvió a leer la nota desde el principio.",thought:"Hay algo acá que todavía no entiendo.",cue:"inclina la cabeza y vuelve a investigar",question:"¿Qué intención muestran sus gestos?",options:["Quiere comprender mejor","Quiere esconder la nota","Quiere abandonar la búsqueda","Quiere romper la lupa"],answer:0},
  {id:"gift",face:"relieved",scene:"Nico abrió el paquete, miró a su amiga y sonrió sin decir nada antes de abrazarla.",thought:"Recordó exactamente el libro que yo buscaba.",cue:"sonríe, guarda silencio y luego abraza",question:"¿Qué expresa principalmente Nico?",options:["Gratitud y sorpresa","Desconfianza y enojo","Miedo y confusión","Cansancio e impaciencia"],answer:0},
  {id:"race",face:"worried",scene:"Zoe miró la meta, respiró profundo y aflojó los hombros antes de volver a correr.",thought:"No necesito llegar primera; quiero terminar lo que empecé.",cue:"respira y relaja los hombros",question:"¿Qué cambio interno muestra Zoe?",options:["Pasa de la presión a la determinación","Pasa del orgullo al aburrimiento","Pasa de la alegría al miedo","Pasa de la calma al enojo"],answer:0},
  {id:"seed",face:"curious",scene:"Ciro vio el primer brote, abrió mucho los ojos y llamó a todos con la mano.",thought:"¡Funcionó lo que estuvimos cuidando tantos días!",cue:"ojos abiertos y gesto para compartir",question:"¿Qué combinación explica su reacción?",options:["Asombro y entusiasmo","Vergüenza y rechazo","Enojo y cansancio","Indiferencia y duda"],answer:0},
] as const;

function EmotionTheater({power,difficulty,seed,onReplay}:GameProps){
  const scenes=useMemo(()=>sample(emotionScenes,countFor(difficulty,[2,3,4]),`${seed}-scenes`),[difficulty,seed]);const[round,setRound]=useState(0);const[selected,setSelected]=useState<number|null>(null);const[score,setScore]=useState(0);const scene=scenes[round];if(!scene)return <GameWon title={`¡Gran dirección: ${score}/${scenes.length}!`} copy="La próxima función cambia personajes, gestos e intenciones." onReplay={onReplay}/>;
  const options=shuffledAnswers(scene.options,scene.answer,`${seed}-${scene.id}`,difficulty);const correct=options.findIndex(item=>item.correct);const echo=power==="emotion-echo"||power==="lumi-adapt";const gesture=difficulty==="explorer"||power==="leaf-emotion"||power==="lumi-adapt";const removed=power==="lumi-adapt"?options.findIndex(item=>!item.correct):-1;function next(){if(selected===correct)setScore(v=>v+1);setSelected(null);setRound(v=>v+1);}
  return <div className="emotion-game cognitive-session"><Progress current={round} total={scenes.length} label="escena"/><div className="emotion-stage"><div className={`expression expression--${scene.face}`}><span/><i/><b/></div><motion.div className="stage-curtain" initial={{scaleX:0}} animate={{scaleX:1}}/><MaskHappyIcon className="stage-mark"/></div><div className={`emotion-script ${gesture?"is-gestured":""}`}><ChatCircleDotsIcon/><p>{scene.scene}</p></div>{gesture?<p className="power-hint"><EyeIcon/> Gesto revelador: {scene.cue}.</p>:null}{echo?<motion.blockquote initial={{opacity:0,scale:.9}} animate={{opacity:1,scale:1}}>“{scene.thought}”</motion.blockquote>:null}<h3>{scene.question}</h3><div className="emotion-options">{options.map((option,index)=><motion.button key={option.label} type="button" disabled={selected!==null||index===removed} className={selected===index?(option.correct?"is-correct":"is-wrong"):index===removed?"is-removed":""} onClick={()=>setSelected(index)} whileTap={{scale:.97}}><HeartIcon weight={option.correct&&selected!==null?"fill":"duotone"}/>{index===removed?"Lumi descartó esta lectura":option.label}</motion.button>)}</div>{selected!==null?<Feedback correct={selected===correct} explanation="La emoción se infiere al unir situación, cuerpo, pensamiento e intención." action={round===scenes.length-1?"Cerrar función":"Siguiente escena"} onContinue={next}/>:null}</div>;
}

const wordChallenges=[
  {id:"attention",sentence:"La exploradora observó cada huella con mucha ____.",pieces:["a","ten","ción"],distractors:["mien","prisa","ru"],definition:"cuidado y concentración",word:"atención"},{id:"caution",sentence:"El puente parecía frágil, por eso avanzaron con ____.",pieces:["cau","te","la"],distractors:["fuer","ruido","ción"],definition:"prudencia para evitar un riesgo",word:"cautela"},{id:"solution",sentence:"Después de comparar las pistas, encontraron una ____.",pieces:["so","lu","ción"],distractors:["pre","duda","men"],definition:"respuesta que resuelve un problema",word:"solución"},{id:"curiosity",sentence:"La caja desconocida despertó su ____.",pieces:["cu","rio","si","dad"],distractors:["len","ción","miedo"],definition:"deseo de saber o descubrir",word:"curiosidad"},{id:"cooperate",sentence:"Para mover la roca tuvieron que ____.",pieces:["co","la","bo","rar"],distractors:["dor","sin","tar"],definition:"trabajar juntos para lograr algo",word:"colaborar"},{id:"prediction",sentence:"Usaron las señales del cielo para hacer una ____.",pieces:["pre","dic","ción"],distractors:["pa","mien","dad"],definition:"idea anticipada basada en indicios",word:"predicción"},
] as const;

function WordForge({power,difficulty,seed,onReplay}:GameProps){
  const challenges=useMemo(()=>sample(wordChallenges,countFor(difficulty,[2,3,4]),`${seed}-words`),[difficulty,seed]);const[round,setRound]=useState(0);const[built,setBuilt]=useState<string[]>([]);const[error,setError]=useState(false);const challenge=challenges[round];useEffect(()=>{if((power==="idea-snap"||power==="lumi-adapt")&&challenge&&built.length<challenge.pieces.length)setBuilt(current=>[...current,challenge.pieces[current.length]!]);},[power,round]);if(!challenge)return <GameWon title="¡Fábrica encendida!" copy="La próxima producción combina otras palabras, piezas y distractores." onReplay={onReplay}/>;
  const complete=built.join("")===challenge.word;const unlocked=power==="tower-unlock"||power==="lumi-adapt";const tiles=shuffled([...challenge.pieces,...challenge.distractors.slice(0,countFor(difficulty,[1,2,3]))],`${seed}-${challenge.id}-tiles`);const expectedPieces=challenge.pieces;function pick(piece:string){const expected=expectedPieces[built.length];if(piece===expected){setBuilt(v=>[...v,piece]);setError(false);}else{setError(true);window.setTimeout(()=>setError(false),500);}}function next(){setBuilt([]);setRound(v=>v+1);}
  return <div className="word-game cognitive-session"><Progress current={round} total={challenges.length} label="palabra"/><div className="forge-scene"><FactoryIcon/><div><small>Contexto variable</small><p>{challenge.sentence}</p></div><motion.span animate={complete?{rotate:[0,8,-8,0],scale:[1,1.15,1]}:{}}><GearSixIcon weight="fill"/></motion.span></div>{unlocked?<p className="power-hint"><PuzzlePieceIcon/> La llave revela {challenge.pieces.length} piezas y empieza con “{challenge.pieces[0]}”.</p>:null}<div className={`forge-slots ${error?"is-error":""}`} aria-label="Palabra en construcción">{challenge.pieces.map((_,index)=><motion.span key={index} animate={built[index]?{scale:[.6,1.12,1]}:{}}>{built[index]??"?"}</motion.span>)}</div><div className="word-definition"><TextAaIcon/><span><small>Significado buscado</small><strong>{challenge.definition}</strong></span></div><div className="conveyor">{tiles.map((piece,index)=><motion.button key={`${piece}-${index}`} type="button" disabled={complete||built.includes(piece)} onClick={()=>pick(piece)} whileHover={{y:-5}} whileTap={{scale:.9}}>{piece}</motion.button>)}</div>{complete?<motion.div className="word-complete" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}><CheckCircleIcon weight="fill"/><strong>{challenge.word}</strong><button type="button" onClick={next}>{round===challenges.length-1?"Ver producción":"Fabricar otra"}</button></motion.div>:null}</div>;
}

interface EvidenceCase { id:string; title:string; evidence:Array<{id:string;text:string;target:string}>; hypotheses:Array<{id:string;label:string}> }
const evidenceCases: EvidenceCase[] = [
  {id:"garden",title:"El jardín antes de la lluvia",evidence:[{id:"clouds",text:"El cielo se volvió gris muy rápido.",target:"storm"},{id:"cape",text:"Nara guardó una capa impermeable.",target:"storm"},{id:"seeds",text:"Cubrió los brotes con frascos abiertos.",target:"protect"},{id:"stones",text:"Marcó el regreso con piedras claras.",target:"return"},{id:"wind",text:"Las hojas comenzaron a moverse con fuerza.",target:"storm"}],hypotheses:[{id:"storm",label:"Se acerca una tormenta"},{id:"protect",label:"Quiere proteger las plantas"},{id:"return",label:"Planea encontrar el regreso"}]},
  {id:"workshop",title:"El taller detenido",evidence:[{id:"screen",text:"La pantalla del robot no mostraba energía.",target:"battery"},{id:"cable",text:"Un cable estaba fuera de su conector.",target:"connection"},{id:"manual",text:"Ada abrió el plano en la página de circuitos.",target:"repair"},{id:"light",text:"La luz volvió al colocar el cable.",target:"connection"},{id:"tools",text:"Ordenó pinzas y destornilladores junto al robot.",target:"repair"}],hypotheses:[{id:"battery",label:"La energía no estaba llegando"},{id:"connection",label:"Había una conexión suelta"},{id:"repair",label:"Ada se preparó para reparar"}]},
  {id:"harbor",title:"El misterio del muelle",evidence:[{id:"rope",text:"Una cuerda húmeda quedó cortada junto al poste.",target:"boat"},{id:"map",text:"El mapa tenía una ruta marcada hacia el norte.",target:"trip"},{id:"box",text:"Faltaba la caja de provisiones.",target:"trip"},{id:"wake",text:"Había una estela reciente sobre el agua.",target:"boat"},{id:"note",text:"La nota decía: regreso antes del atardecer.",target:"return"}],hypotheses:[{id:"boat",label:"Una embarcación salió hace poco"},{id:"trip",label:"Alguien preparó un viaje"},{id:"return",label:"La ausencia será temporal"}]},
];

function EvidenceBoard({power,difficulty,seed,onReplay}:GameProps){
  const caseFile=useMemo(()=>sample(evidenceCases,1,`${seed}-case`)[0]!,[seed]);const evidence=useMemo(()=>shuffled(caseFile.evidence,`${seed}-evidence`).slice(0,countFor(difficulty,[3,4,5])),[caseFile,difficulty,seed]);const hypotheses=useMemo(()=>shuffled(caseFile.hypotheses,`${seed}-hypotheses`),[caseFile,seed]);const[selected,setSelected]=useState<string|null>(null);const[links,setLinks]=useState<Record<string,string>>({});const[error,setError]=useState<string|null>(null);
  useEffect(()=>{if(power==="destiny-link"||power==="lumi-adapt"){const first=evidence[0];if(first)setLinks(v=>({...v,[first.id]:first.target}));}},[power]);const linked=Object.keys(links).length;if(linked===evidence.length)return <GameWon title="¡Hipótesis demostradas!" copy={`Resolviste “${caseFile.title}”. La próxima carpeta tendrá otras pruebas.`} onReplay={onReplay}/>;
  function link(target:string){if(!selected)return;const item=evidence.find(entry=>entry.id===selected)!;if(item.target===target){setLinks(v=>({...v,[selected]:target}));setSelected(null);setError(null);}else setError("Esa prueba no alcanza para sostener la hipótesis. Compará palabras y consecuencias.");}const vine=power==="vine-bridge";const invisible=power==="invisible-evidence"||power==="lumi-adapt";
  return <div className="evidence-game cognitive-session"><div className="session-instruction"><BinocularsIcon/><p><strong>{caseFile.title}.</strong> Conectá cada prueba con una conclusión justificable.</p></div><div className="evidence-board"><section><small>Pruebas encontradas</small>{evidence.map((item,index)=><motion.button key={item.id} type="button" disabled={Boolean(links[item.id])} className={`${selected===item.id?"is-selected":""} ${links[item.id]?"is-linked":""} ${vine&&index<2?"is-vined":""}`} onClick={()=>setSelected(item.id)} whileTap={{scale:.97}}><span>{index+1}</span>{item.text}{links[item.id]?<CheckCircleIcon weight="fill"/>:null}</motion.button>)}{invisible?<motion.article className="secret-evidence" initial={{opacity:0,filter:"blur(8px)"}} animate={{opacity:1,filter:"blur(0px)"}}><EyeIcon/><span><small>Prueba invisible</small>Una observación extra confirma el contexto de la primera evidencia.</span></motion.article>:null}</section><div className="evidence-lines">{Object.keys(links).map(id=><motion.i key={id} initial={{scaleY:0}} animate={{scaleY:1}}/>)}</div><section><small>Hipótesis</small>{hypotheses.map(item=><motion.button key={item.id} type="button" disabled={!selected} onClick={()=>link(item.id)} whileHover={selected?{x:-5}:{}}><TreeStructureIcon/><strong>{item.label}</strong><small>{Object.values(links).filter(value=>value===item.id).length} pruebas</small></motion.button>)}</section></div>{vine?<p className="power-hint"><SparkleIcon/> La liana agrupa dos indicios relacionados.</p>:null}{error?<p className="form-error" role="alert">{error}</p>:null}<div className="board-score">{linked}/{evidence.length} conexiones verificadas</div></div>;
}

const causalChains: Array<{ id:string; pieces:string[] }> = [
  {id:"squirrel",pieces:["El viento movió una rama","Las bellotas cayeron al sendero","La ardilla cambió de camino","Vio nubes oscuras desde otra colina","Encontró un refugio antes de la lluvia"]},
  {id:"dam",pieces:["Llovió durante varias horas","El arroyo llevó más agua","Las ramas se acumularon entre dos rocas","El paso del agua se hizo más estrecho","Se formó una pequeña laguna"]},
  {id:"shadow",pieces:["El sol comenzó a bajar","La sombra del árbol se alargó","La zona de lectura quedó fresca","Los niños movieron allí sus almohadones","Pudieron seguir leyendo sin calor"]},
  {id:"signal",pieces:["Mara encontró una marca en el mapa","Comparó la forma con las señales del camino","Reconoció el símbolo de un puente","Eligió la ruta junto al río","Llegó al campamento antes de anochecer"]},
];

function CauseMachine({power,difficulty,seed,onReplay}:GameProps){
  const chain=useMemo(()=>sample(causalChains,1,`${seed}-chain`)[0]!,[seed]);const total=countFor(difficulty,[3,4,5]);const pieces=useMemo(()=>shuffled(chain.pieces.slice(0,total).map((label,index)=>({order:index+1,label,kind:index===0?"causa":index===total-1?"resultado":"puente"})),`${seed}-pieces`),[chain,seed,total]);const[next,setNext]=useState(1);const[mistake,setMistake]=useState<number|null>(null);useEffect(()=>{if((power==="current-cause"||power==="lumi-adapt")&&next<=2)setNext(Math.min(3,total+1));},[power]);if(next>total)return <GameWon title="¡Máquina en marcha!" copy="La próxima máquina tendrá otra cadena y una disposición nueva." onReplay={onReplay}/>;const boundary=power==="time-boundary"||power==="lumi-adapt";
  return <div className="cause-game cognitive-session"><div className="session-instruction"><GearSixIcon/><p>Encendé los engranajes desde la causa inicial hasta el resultado final.</p></div>{boundary?<div className="time-boundary"><span>ANTES · causas</span><i/><span>DESPUÉS · consecuencias</span></div>:null}<div className="cause-track">{Array.from({length:total},(_,index)=>index+1).map(order=><motion.div key={order} className={order<next?"is-powered":""} animate={order<next?{rotate:360}:{}} transition={{duration:.65}}><GearSixIcon weight={order<next?"fill":"duotone"}/><small>{order<next?order:"?"}</small></motion.div>)}</div><div className="cause-pieces">{pieces.map(piece=><motion.button key={piece.order} type="button" disabled={piece.order<next} className={`${piece.order<next?"is-complete":""} ${mistake===piece.order?"is-wrong":""}`} onClick={()=>{if(piece.order===next){setNext(v=>v+1);setMistake(null);}else{setMistake(piece.order);window.setTimeout(()=>setMistake(null),450);}}} whileTap={{scale:.96}}><span>{piece.kind}</span><strong>{piece.label}</strong></motion.button>)}</div>{power==="current-cause"?<p className="power-hint"><SparkleIcon/> La Corriente colocó los dos primeros engranajes causales.</p>:null}</div>;
}

const perspectiveScenes=[
  {id:"box",event:"Una caja apareció frente a la biblioteca.",left:{name:"Suri",role:"bibliotecaria",thought:"Tal vez alguien devolvió libros fuera de horario.",claim:"La caja puede ser una devolución."},right:{name:"Max",role:"explorador",thought:"Tiene marcas de barro; quizá llegó desde el bosque.",claim:"La caja puede traer una pista del bosque."},question:"¿Por qué interpretan la caja de manera diferente?",options:["Porque usan experiencias e indicios distintos","Porque uno no puede verla","Porque la caja cambia de color","Porque están en días diferentes"],answer:0},
  {id:"bell",event:"Se escuchó una campana detrás de la colina.",left:{name:"Inés",role:"música",thought:"El ritmo tiene tres golpes, como una señal ensayada.",claim:"Alguien está enviando un patrón."},right:{name:"Rami",role:"pastor",thought:"Suena como la campana que guía al rebaño.",claim:"Alguien está orientando animales."},question:"¿Qué cambia entre ambos puntos de vista?",options:["El conocimiento previo de cada narrador","El volumen real de la campana","La hora de la escena","El material de la colina"],answer:0},
  {id:"tracks",event:"Aparecieron huellas pequeñas alrededor del huerto.",left:{name:"Yara",role:"naturalista",thought:"La forma se parece a las patas de una liebre.",claim:"Un animal buscó alimento."},right:{name:"Beto",role:"constructor",thought:"Algunas marcas son perfectamente redondas.",claim:"Tal vez cayó una herramienta con ruedas."},question:"¿Qué debería hacer el grupo para decidir?",options:["Buscar más pruebas que distingan ambas ideas","Elegir al narrador más seguro","Borrar las huellas","Combinar las dos respuestas sin revisar"],answer:0},
  {id:"light",event:"Una luz parpadeó tres veces desde la torre.",left:{name:"Leo",role:"meteorólogo",thought:"Las nubes pueden estar tapando la luz a intervalos.",claim:"Puede ser un efecto del clima."},right:{name:"Ada",role:"inventora",thought:"Tres pulsos iguales suelen ser una señal programada.",claim:"Puede ser un mensaje automático."},question:"¿Qué información influye en sus explicaciones?",options:["Sus áreas de experiencia","Sus colores favoritos","La distancia entre ellos","El nombre de la torre"],answer:0},
] as const;

function PerspectivePrism({power,difficulty,seed,onReplay}:GameProps){
  const scenes=useMemo(()=>sample(perspectiveScenes,countFor(difficulty,[1,2,3]),`${seed}-perspectives`),[difficulty,seed]);const[round,setRound]=useState(0);const[selected,setSelected]=useState<number|null>(null);const scene=scenes[round];if(!scene)return <GameWon title="¡Prisma completo!" copy="La próxima partida combinará otros narradores y acontecimientos." onReplay={onReplay}/>;const options=shuffledAnswers(scene.options,scene.answer,`${seed}-${scene.id}`,difficulty);const correct=options.findIndex(item=>item.correct);const twin=power==="twin-perspective"||power==="lumi-adapt";
  return <div className="perspective-game cognitive-session"><Progress current={round} total={scenes.length} label="mirada"/><div className="prism-event"><motion.span animate={{rotateY:twin?180:0}} transition={{duration:.7}}><EyeIcon/><SparkleIcon/></motion.span><p>{scene.event}</p></div><div className="narrator-panels">{[scene.left,scene.right].map((narrator,index)=><motion.article key={narrator.name} initial={{opacity:0,x:index?-25:25}} animate={{opacity:1,x:0}}><span>{narrator.name.slice(0,1)}</span><div><small>{narrator.role}</small><h3>{narrator.name}</h3><p>{narrator.claim}</p>{twin?<motion.blockquote initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}}>Piensa: “{narrator.thought}”</motion.blockquote>:null}</div></motion.article>)}</div><h3>{scene.question}</h3><div className="perspective-options">{options.map((option,index)=><button key={option.label} type="button" disabled={selected!==null} className={selected===index?(option.correct?"is-correct":"is-wrong"):""} onClick={()=>setSelected(index)}>{option.label}</button>)}</div>{selected!==null?<Feedback correct={selected===correct} explanation="Un punto de vista combina observaciones con experiencias, conocimientos e intereses." action={round===scenes.length-1?"Cerrar el prisma":"Girar otra vez"} onContinue={()=>{setSelected(null);setRound(v=>v+1);}}/>:null}</div>;
}

interface MapConfiguration { id:string; path:number[]; items:number[]; goal:number; obstacles:number[] }
const mapConfigurations: MapConfiguration[] = [
  {id:"north",path:[12,8,4,0,1,2,3],items:[4,1,2],goal:3,obstacles:[5,9,10,14,6]},{id:"west",path:[15,14,13,9,5,4,0],items:[13,5,4],goal:0,obstacles:[10,11,7,2,6]},{id:"south",path:[0,4,8,9,10,14,15],items:[8,10,14],goal:15,obstacles:[1,5,6,11,13]},{id:"bend",path:[3,7,11,10,9,13,12],items:[11,9,13],goal:12,obstacles:[2,6,8,14,5]},
];

function StoryMap({power,difficulty,seed,onReplay}:GameProps){
  const config=useMemo(()=>sample(mapConfigurations,1,`${seed}-map`)[0]!,[seed]);const required=config.items.slice(0,countFor(difficulty,[1,2,3]));const obstacles=new Set<number>(config.obstacles.slice(0,countFor(difficulty,[2,4,5])));const maxEnergy=countFor(difficulty,[4,3,2]);const[position,setPosition]=useState<number>(config.path[0]!);const[collected,setCollected]=useState<number[]>([]);const[mistake,setMistake]=useState<number|null>(null);const[energy,setEnergy]=useState(maxEnergy);
  const safeAdjacent=useMemo(()=>Array.from({length:16},(_,index)=>index).filter(index=>{const row=Math.floor(position/4),col=position%4,nextRow=Math.floor(index/4),nextCol=index%4;return Math.abs(row-nextRow)+Math.abs(col-nextCol)===1&&!obstacles.has(index);}),[position,difficulty]);const complete=position===config.goal&&required.every(item=>collected.includes(item));if(complete)return <GameWon title="¡Expedición completada!" copy="La próxima partida moverá la ruta, los objetos y los obstáculos." onReplay={onReplay}/>;if(energy<=0)return <GameWon title="La expedición necesita un nuevo plan" copy="Revisá las casillas contiguas y reservá energía para las decisiones seguras." onReplay={onReplay}/>;
  const sonar=power==="sonar-route"||power==="lumi-adapt";const forecast=power==="jaguar-forecast"||power==="lumi-adapt";const pathIndex=config.path.indexOf(position);const forecastCells=pathIndex<0?[]:config.path.slice(pathIndex+1,pathIndex+3);function move(index:number){if(!safeAdjacent.includes(index)){setMistake(index);setEnergy(v=>v-1);window.setTimeout(()=>setMistake(null),400);return;}setPosition(index);if(required.includes(index))setCollected(v=>Array.from(new Set([...v,index])));}
  return <div className="map-game cognitive-session"><div className="map-mission"><CompassIcon/><div><small>Mapa variable · {difficulty}</small><strong>Reuní {required.length} objetos y llegá al portal sin agotar la energía.</strong></div><span>{collected.length}/{required.length}</span></div><div className="map-energy">{Array.from({length:maxEnergy},(_,index)=><HeartIcon key={index} weight={index<energy?"fill":"regular"}/>)}</div><div className="story-map-grid">{Array.from({length:16},(_,index)=>{const obstacle=obstacles.has(index);const reachable=safeAdjacent.includes(index);const isForecast=forecast&&forecastCells.includes(index);const itemIndex=required.indexOf(index);const content=index===position?<FootprintsIcon weight="fill"/>:itemIndex===0?<BooksIcon weight="duotone"/>:itemIndex===1?<PuzzlePieceIcon weight="duotone"/>:itemIndex===2?<StarFourIcon weight="duotone"/>:index===config.goal?<FlagCheckeredIcon weight="fill"/>:obstacle?<TreeStructureIcon weight="fill"/>:<span/>;return <motion.button key={index} type="button" aria-label={index===position?"Tu posición":itemIndex===0?"Libro":itemIndex===1?"Pieza":itemIndex===2?"Estrella":index===config.goal?"Portal final":obstacle?"Obstáculo":`Casilla ${index+1}`} disabled={obstacle||(index===config.goal&&!required.every(item=>collected.includes(item)))} className={`${index===position?"is-current":""} ${collected.includes(index)?"is-collected":""} ${sonar&&reachable?"is-sonar":""} ${isForecast?"is-forecast":""} ${mistake===index?"is-wrong":""}`} onClick={()=>move(index)} animate={index===position?{scale:[.9,1.08,1]}:{}}>{content}{isForecast?<small>{forecastCells.indexOf(index)+1}</small>:null}</motion.button>})}</div><div className="map-legend"><span><BooksIcon/> Libro</span>{required.length>1?<span><PuzzlePieceIcon/> Pieza</span>:null}{required.length>2?<span><StarFourIcon/> Estrella</span>:null}<span><TreeStructureIcon/> No pasar</span><span><FlagCheckeredIcon/> Meta</span></div>{sonar?<p className="power-hint"><SparkleIcon/> El Sonar ilumina todas las casillas seguras a un paso.</p>:null}{forecast?<p className="power-hint"><FootprintsIcon/> El Rastro numera los dos movimientos recomendados.</p>:null}</div>;
}

function Streak({value}:{value:number}){return <AnimatePresence>{value>=2?<motion.div className="game-streak" initial={{opacity:0,scale:.6,y:-8}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0}}><StarFourIcon weight="fill"/> Racha x{value}</motion.div>:null}</AnimatePresence>}

function Feedback({correct,explanation,action,onContinue}:{correct:boolean;explanation:string;action:string;onContinue:()=>void}){return <motion.div className={`detective-feedback ${correct?"is-correct":"is-wrong"}`} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}}>{correct?<CelebrationBurst/>:null}<LightbulbFilamentIcon/><p><strong>{correct?"¡La evidencia encaja!":"Probemos otra estrategia"}</strong>{explanation}</p><button type="button" onClick={onContinue}>{action}</button></motion.div>}

function CelebrationBurst(){const reduceMotion=useReducedMotion();return <span className="celebration-burst" aria-hidden="true">{Array.from({length:7},(_,index)=><motion.i key={index} animate={reduceMotion?{}:{x:Math.cos(index)*38,y:Math.sin(index)*30,opacity:[1,0],scale:[.5,1.4]}} transition={{duration:.7}}/>)}</span>}

function GameWon({title,copy,onReplay}:{title:string;copy:string;onReplay:()=>void}){const reduceMotion=useReducedMotion();return <motion.div className="game-won" initial={{opacity:0,scale:.8}} animate={{opacity:1,scale:1}}><div className="win-confetti" aria-hidden="true">{Array.from({length:12},(_,index)=><motion.i key={index} style={{left:`${8+index*7.5}%`}} animate={reduceMotion?{}:{y:[-30,210],rotate:[0,index%2?220:-220],opacity:[0,1,0]}} transition={{duration:1.6+index*.04,delay:index*.035,repeat:Infinity,repeatDelay:1.2}}/>)}</div><motion.span animate={reduceMotion?{}:{rotate:[0,-8,8,0],scale:[1,1.1,1]}} transition={{repeat:reduceMotion?0:Infinity,duration:2.4}}><TrophyIcon/></motion.span><h3>{title}</h3><p>{copy}</p><button type="button" onClick={onReplay}><ArrowClockwiseIcon/> Nueva partida</button></motion.div>}
