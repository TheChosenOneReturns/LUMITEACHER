import type { UserRole } from "@story-teacher/shared";
import {
  confirmSignUp,
  getCurrentUser,
  signIn,
  signOut,
  signUp,
} from "aws-amplify/auth";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { api, ApiClientError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import {
  ArrowRightIcon,
  CheckCircleIcon,
  GraduationCapIcon,
  SparkleIcon,
  UserCircleIcon,
} from "../components/icons";
import { Lumi } from "../components/Lumi";
import { gentleSpring, riseItem, staggerContainer } from "../components/MotionPrimitives";
import { useTransition } from "../components/motion/TransitionContext";

type AuthStep = "sign-in" | "sign-up" | "confirm" | "profile";

function safeNext(value: string | null, role: UserRole): string {
  if (value?.startsWith("/") && !value.startsWith("//")) return value;
  return role === "adult" ? "/adulto" : "/inicio";
}

export function CognitoLoginPage() {
  const { refreshProfile } = useAuth();
  const { startTransition } = useTransition();
  const [searchParams] = useSearchParams();
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState<AuthStep>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<UserRole>(
    searchParams.get("role") === "adult" ? "adult" : "student",
  );
  const [age, setAge] = useState(8);
  const [favoriteTheme, setFavoriteTheme] = useState("Tema libre");
  const [adultLabel, setAdultLabel] = useState<"Profesor/a" | "Familia">(
    "Profesor/a",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void restoreAuthenticatedSession();
    return () => {
      active = false;
    };

    async function restoreAuthenticatedSession() {
      try {
        await getCurrentUser();
      } catch {
        return;
      }
      try {
        await finishAuthenticated();
      } catch (loadError) {
        if (!active) return;
        if (isRejectedSession(loadError)) {
          await clearRejectedSession();
          if (active) {
            setError(
              "Tu sesión anterior venció o quedó incompleta. Ya la limpiamos; ingresá nuevamente.",
            );
          }
          return;
        }
        setError(authErrorMessage(loadError));
      }
    }

    async function finishAuthenticated() {
      try {
        const profile = await api.getMe();
        if (!active) return;
        await refreshProfile();
        startTransition(safeNext(searchParams.get("next"), profile.role));
      } catch (loadError) {
        if (
          active &&
          loadError instanceof ApiClientError &&
          loadError.code === "PROFILE_REQUIRED"
        ) {
          setStep("profile");
          return;
        }
        throw loadError;
      }
    }
  }, []);

  async function completeLogin(): Promise<void> {
    try {
      const profile = await api.getMe();
      await refreshProfile();
      startTransition(safeNext(searchParams.get("next"), profile.role));
    } catch (loadError) {
      if (
        loadError instanceof ApiClientError &&
        loadError.code === "PROFILE_REQUIRED"
      ) {
        setStep("profile");
        return;
      }
      throw loadError;
    }
  }

  async function resumeExistingSession(): Promise<boolean> {
    try {
      await getCurrentUser();
    } catch {
      return false;
    }
    try {
      await completeLogin();
      return true;
    } catch (loadError) {
      if (!isRejectedSession(loadError)) throw loadError;
      await clearRejectedSession();
      return false;
    }
  }

  async function submitCredentials(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (step === "sign-up") {
        const result = await signUp({
          username: email.trim().toLocaleLowerCase("en"),
          password,
          options: { userAttributes: { email: email.trim() } },
        });
        if (!result.isSignUpComplete) {
          setStep("confirm");
          return;
        }
      }

      if (await resumeExistingSession()) return;

      const result = await signIn({
        username: email.trim().toLocaleLowerCase("en"),
        password,
      });
      if (result.isSignedIn) {
        await completeLogin();
        return;
      }
      if (result.nextStep.signInStep === "CONFIRM_SIGN_UP") {
        setStep("confirm");
        return;
      }
      setError(
        "Esta cuenta necesita un paso de seguridad adicional que todavía no está disponible en esta pantalla.",
      );
    } catch (authError) {
      if (isRejectedSession(authError)) {
        await clearRejectedSession();
      } else if (isAlreadySignedIn(authError)) {
        try {
          if (await resumeExistingSession()) return;
        } catch (resumeError) {
          setError(authErrorMessage(resumeError));
          return;
        }
      }
      setError(authErrorMessage(authError));
    } finally {
      setLoading(false);
    }
  }

  async function submitConfirmation(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await confirmSignUp({
        username: email.trim().toLocaleLowerCase("en"),
        confirmationCode: confirmationCode.trim(),
      });
      const result = await signIn({
        username: email.trim().toLocaleLowerCase("en"),
        password,
      });
      if (!result.isSignedIn) {
        throw new Error("No se pudo iniciar la sesión después de confirmar.");
      }
      await completeLogin();
    } catch (authError) {
      setError(authErrorMessage(authError));
    } finally {
      setLoading(false);
    }
  }

  async function submitProfile(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const profile = await api.bootstrapProfile({
        role,
        displayName,
        ...(role === "student" ? { age } : {}),
        avatarId: role === "student" ? "animal-fox" : "kid-inventor",
        favoriteTheme,
        ...(role === "adult" ? { adultLabel } : {}),
      });
      await refreshProfile();
      startTransition(safeNext(searchParams.get("next"), profile.role));
    } catch (profileError) {
      setError(
        profileError instanceof ApiClientError
          ? profileError.message
          : "No pudimos crear el perfil en AWS.",
      );
    } finally {
      setLoading(false);
    }
  }

  const audienceCopy =
    role === "student"
      ? {
          eyebrow: "Modo niño/a",
          title: "Leer, elegir y vivir la aventura",
          description:
            "Un espacio visual para explorar historias, tomar decisiones y celebrar cada avance.",
          lumi: "¡Hola, explorador/a! Elegí tu perfil y abrimos juntos la próxima historia.",
        }
      : {
          eyebrow: "Modo adulto",
          title: "Crear, acompañar y ver el progreso",
          description:
            "Herramientas claras para docentes y familias que quieren proponer misiones y acompañar.",
          lumi: "Te acompaño a preparar misiones y descubrir cómo avanza cada lector.",
        };

  return (
    <motion.div
      className={`login-page login-page--cognito login-page--${role} page-width`}
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.35 }}
    >
      <motion.section
        className="login-intro"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="login-intro__copy" variants={riseItem}>
          <span className="pill">
            <SparkleIcon weight="fill" /> Un acceso para cada rol
          </span>
          <h1>Dos formas de entrar. Un mismo lugar para aprender.</h1>
          <p>
            Elegí cómo vas a usar Story Teacher. El acceso se adapta para que
            cada persona encuentre rápido lo que necesita.
          </p>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={role}
              className={`login-audience-preview login-audience-preview--${role}`}
              initial={reduceMotion ? false : { opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduceMotion ? {} : { opacity: 0, x: 12 }}
              transition={gentleSpring}
            >
              <span>
                {role === "student" ? (
                  <UserCircleIcon size={30} weight="duotone" />
                ) : (
                  <GraduationCapIcon size={30} weight="duotone" />
                )}
              </span>
              <div>
                <small>{audienceCopy.eyebrow}</small>
                <strong>{audienceCopy.title}</strong>
                <p>{audienceCopy.description}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
        <motion.div className="login-intro__lumi" variants={riseItem}>
          <span className="login-orbit login-orbit--one" aria-hidden="true">
            <SparkleIcon weight="fill" />
          </span>
          <span className="login-orbit login-orbit--two" aria-hidden="true">
            <SparkleIcon weight="fill" />
          </span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={role}
              initial={reduceMotion ? false : { opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? {} : { opacity: 0, y: -8, scale: 0.97 }}
              transition={gentleSpring}
            >
              <Lumi mood="encouraging" message={audienceCopy.lumi} />
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </motion.section>

      <motion.section
        className={`login-card login-card--profiles login-card--${role}`}
        layout={!reduceMotion}
        transition={gentleSpring}
      >
        <AnimatePresence mode="wait" initial={false}>
          {step === "profile" ? (
            <motion.form
              key="profile"
              className="login-auth-form"
              onSubmit={submitProfile}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? {} : { opacity: 0, y: -12 }}
              transition={gentleSpring}
            >
              <div className="login-card__heading">
                <span className="login-step-number">3</span>
                <div>
                  <span className="eyebrow">Último paso</span>
                  <h2>Prepará tu perfil</h2>
                  <p>Personalizamos la experiencia según quién va a ingresar.</p>
                </div>
              </div>
              <RoleChoice role={role} onChange={setRole} />
              <label className="text-field">
                <span>Nombre visible</span>
                <input
                  required
                  minLength={2}
                  maxLength={40}
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                />
              </label>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  className="login-role-fields"
                  key={role}
                  initial={reduceMotion ? false : { opacity: 0, x: role === "student" ? -12 : 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduceMotion ? {} : { opacity: 0, x: role === "student" ? 12 : -12 }}
                  transition={gentleSpring}
                >
                  {role === "student" ? (
                    <>
                      <label className="text-field">
                        <span>Edad</span>
                        <input
                          type="number"
                          min={6}
                          max={12}
                          value={age}
                          onChange={(event) => setAge(Number(event.target.value))}
                        />
                      </label>
                      <label className="text-field">
                        <span>Tema favorito</span>
                        <input
                          required
                          value={favoriteTheme}
                          onChange={(event) => setFavoriteTheme(event.target.value)}
                        />
                      </label>
                    </>
                  ) : (
                    <label className="text-field">
                      <span>Tipo de acompañante</span>
                      <select
                        value={adultLabel}
                        onChange={(event) =>
                          setAdultLabel(event.target.value as "Profesor/a" | "Familia")
                        }
                      >
                        <option>Profesor/a</option>
                        <option>Familia</option>
                      </select>
                    </label>
                  )}
                </motion.div>
              </AnimatePresence>
              <AnimatedFormError message={error} />
              <button className="button button--green login-primary-action" disabled={loading}>
                {loading ? "Guardando…" : "Entrar a Story Teacher"} <ArrowRightIcon />
              </button>
            </motion.form>
          ) : step === "confirm" ? (
            <motion.form
              key="confirm"
              className="login-auth-form"
              onSubmit={submitConfirmation}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? {} : { opacity: 0, y: -12 }}
              transition={gentleSpring}
            >
              <div className="login-card__heading">
                <span className="login-step-number">2</span>
                <div>
                  <span className="eyebrow">Revisá tu correo</span>
                  <h2>Confirmá la cuenta</h2>
                  <p>Te enviamos un código para proteger el acceso.</p>
                </div>
              </div>
              <div className="login-confirmation-note">
                El código fue enviado a <strong>{email}</strong>
              </div>
              <label className="text-field">
                <span>Código de confirmación</span>
                <input
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={confirmationCode}
                  onChange={(event) => setConfirmationCode(event.target.value)}
                />
              </label>
              <AnimatedFormError message={error} />
              <button className="button button--green login-primary-action" disabled={loading}>
                {loading ? "Confirmando…" : "Confirmar y continuar"} <CheckCircleIcon />
              </button>
            </motion.form>
          ) : (
            <motion.form
              key={step}
              className="login-auth-form"
              onSubmit={submitCredentials}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? {} : { opacity: 0, y: -12 }}
              transition={gentleSpring}
            >
              <div className="login-card__heading">
                <span className="login-step-number">1</span>
                <div>
                  <span className="eyebrow">
                    {step === "sign-up"
                      ? "Creá tu acceso"
                      : role === "student"
                        ? "Hola, explorador/a"
                        : "Hola, acompañante"}
                  </span>
                  <h2>
                    {step === "sign-up"
                      ? "Crear una cuenta"
                      : role === "student"
                        ? "Entrá a tu aventura"
                        : "Entrá al espacio adulto"}
                  </h2>
                  <p>
                    {step === "sign-up"
                      ? "Primero elegí el tipo de experiencia que querés preparar."
                      : "Elegí tu modo y usá el correo de tu cuenta."}
                  </p>
                </div>
              </div>
              <RoleChoice role={role} onChange={setRole} />
              <div className="login-credential-fields">
                <label className="text-field">
                  <span>Correo electrónico</span>
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </label>
                <label className="text-field">
                  <span>Contraseña</span>
                  <input
                    required
                    minLength={12}
                    type="password"
                    autoComplete={
                      step === "sign-up" ? "new-password" : "current-password"
                    }
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  {step === "sign-up" ? (
                    <small>
                      Mínimo 12 caracteres, con mayúscula, número y símbolo.
                    </small>
                  ) : null}
                </label>
              </div>
              <AnimatedFormError message={error} />
              <div className="login-auth-actions">
                <button className="button button--green login-primary-action" disabled={loading}>
                  {loading
                    ? "Conectando…"
                    : step === "sign-up"
                      ? "Crear cuenta"
                      : "Ingresar"}{" "}
                  <ArrowRightIcon />
                </button>
                <button
                  type="button"
                  className="button button--ghost"
                  onClick={() => {
                    setError(null);
                    setStep(step === "sign-up" ? "sign-in" : "sign-up");
                  }}
                >
                  {step === "sign-up"
                    ? "Ya tengo una cuenta"
                    : "Crear una cuenta nueva"}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.section>
    </motion.div>
  );
}

function RoleChoice({
  role,
  onChange,
}: {
  role: UserRole;
  onChange: (role: UserRole) => void;
}) {
  const reduceMotion = useReducedMotion();
  const choices = [
    {
      role: "student" as const,
      label: "Niño/a",
      description: "Leer, jugar y explorar",
      Icon: UserCircleIcon,
    },
    {
      role: "adult" as const,
      label: "Adulto/a",
      description: "Crear y acompañar",
      Icon: GraduationCapIcon,
    },
  ];

  return (
    <div className="login-role-choice" role="radiogroup" aria-label="Cómo querés ingresar">
      {choices.map(({ role: choiceRole, label, description, Icon }) => {
        const selected = role === choiceRole;
        return (
          <motion.button
            key={choiceRole}
            type="button"
            role="radio"
            aria-checked={selected}
            className={`login-role-option login-role-option--${choiceRole}${selected ? " is-active" : ""}`}
            onClick={() => onChange(choiceRole)}
            whileHover={reduceMotion ? {} : { y: -3 }}
            whileTap={reduceMotion ? {} : { scale: 0.985 }}
            transition={gentleSpring}
          >
            <span className="login-role-option__icon">
              <Icon size={30} weight="duotone" />
            </span>
            <span className="login-role-option__copy">
              <strong>{label}</strong>
              <small>{description}</small>
            </span>
            <CheckCircleIcon
              className="login-role-option__check"
              size={22}
              weight="fill"
              aria-hidden="true"
            />
          </motion.button>
        );
      })}
    </div>
  );
}

function AnimatedFormError({ message }: { message: string | null }) {
  const reduceMotion = useReducedMotion();
  return (
    <AnimatePresence initial={false}>
      {message ? (
        <motion.p
          className="form-error"
          role="alert"
          initial={reduceMotion ? false : { opacity: 0, height: 0, y: -6 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={reduceMotion ? {} : { opacity: 0, height: 0, y: -6 }}
          transition={{ duration: reduceMotion ? 0 : 0.24, ease: "easeOut" }}
        >
          {message}
        </motion.p>
      ) : null}
    </AnimatePresence>
  );
}

function authErrorMessage(error: unknown): string {
  const name = (error as { name?: string }).name;
  if (name === "UsernameExistsException") {
    return "Ya existe una cuenta con ese correo.";
  }
  if (name === "NotAuthorizedException") {
    return "El correo o la contraseña no son correctos.";
  }
  if (name === "CodeMismatchException") {
    return "El código no es correcto o ya venció.";
  }
  if (name === "InvalidPasswordException") {
    return "La contraseña no cumple los requisitos de seguridad.";
  }
  if (name === "LimitExceededException") {
    return "Hubo demasiados intentos. Esperá unos minutos y probá otra vez.";
  }
  if (isAlreadySignedIn(error)) {
    return "Ya había una sesión abierta. Recargá la página para continuar o ingresá nuevamente.";
  }
  if (isRejectedSession(error)) {
    return "No pudimos validar la sesión. Ingresá nuevamente.";
  }
  return error instanceof Error
    ? error.message
    : "No pudimos completar el ingreso.";
}

function isAlreadySignedIn(error: unknown): boolean {
  const candidate = error as { name?: string; message?: string };
  return (
    candidate.name === "UserAlreadyAuthenticatedException" ||
    candidate.message?.includes("already a signed in user") === true
  );
}

function isRejectedSession(error: unknown): boolean {
  return (
    error instanceof ApiClientError &&
    (error.status === 401 || error.code === "NO_SESSION")
  );
}

async function clearRejectedSession(): Promise<void> {
  await signOut().catch(() => undefined);
}
