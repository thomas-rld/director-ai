"use client";

import { FormEvent, useState, type ReactNode } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { Camera, Clapperboard, Eye, SlidersHorizontal, type LucideIcon } from "lucide-react";
import { normalizePlan, type DirectivePlan } from "@/lib/plan";

type AppState = "idle" | "loading" | "success" | "error";
type OculusMode = "idle" | "focus" | "processing";
type StepId = (typeof STEPS)[number]["id"];

const STEPS = [
  { id: "vision", label: "Vision", icon: Eye },
  { id: "arsenal", label: "Arsenal", icon: Camera },
  { id: "plateau", label: "Plateau", icon: Clapperboard },
  { id: "post", label: "Post-Prod", icon: SlidersHorizontal },
] as const satisfies readonly { id: string; label: string; icon: LucideIcon }[];

const ease = [0.22, 1, 0.36, 1] as const;
const glide = { layout: { duration: 0.9, ease } };

export default function HomePage() {
  const [idea, setIdea] = useState("");
  const [appState, setAppState] = useState<AppState>("idle");
  const [plan, setPlan] = useState<DirectivePlan | null>(null);
  const [error, setError] = useState("");
  const [generation, setGeneration] = useState(0);
  const [focused, setFocused] = useState(false);
  const reduce = useReducedMotion();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextIdea = idea.trim();
    if (nextIdea.length < 2 || appState === "loading") return;

    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    setAppState("loading");
    setError("");
    setPlan(null);
    setFocused(false);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: nextIdea }),
      });

      let data: unknown;
      try {
        data = await response.json();
      } catch {
        setError("Réponse illisible.");
        setAppState("error");
        return;
      }

      if (!response.ok) {
        const message =
          data && typeof data === "object" && "error" in data && typeof data.error === "string"
            ? data.error
            : "La génération a échoué.";
        setError(message);
        setAppState("error");
        return;
      }

      const raw =
        data && typeof data === "object" && "plan" in data
          ? (data as { plan: unknown }).plan
          : data;
      setPlan(normalizePlan(raw, nextIdea));
      setGeneration((current) => current + 1);
      setAppState("success");
    } catch {
      setError("Le service ne répond pas. Réessayez.");
      setAppState("error");
    }
  }

  const mode: OculusMode = appState === "loading" ? "processing" : focused ? "focus" : "idle";
  const settled = appState === "success";

  return (
    <div className="relative min-h-svh overflow-x-hidden bg-slate-50 text-slate-900">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.95),rgba(248,250,252,0)_62%)]"
        aria-hidden
      />

      <main className="relative z-10">
        <LayoutGroup>
          <div
            className={
              settled
                ? "mx-auto flex w-full max-w-xl flex-col items-center px-6 pb-2 pt-8"
                : "mx-auto flex min-h-svh w-full max-w-xl flex-col items-center justify-center px-6 pb-8 pt-10"
            }
          >
            <motion.p layout transition={glide} className="text-[11px] tracking-[0.42em] text-slate-400">
              DIRECTOR.AI
            </motion.p>
            <motion.div
              layout
              transition={glide}
              className={
                settled
                  ? "mt-5 h-32 w-32 sm:h-36 sm:w-36"
                  : "mt-8 h-[min(62vw,280px)] w-[min(62vw,280px)]"
              }
            >
              <OpticalOculus mode={mode} />
            </motion.div>
            <motion.div layout transition={glide} className={settled ? "mt-6 w-full" : "mt-10 w-full"}>
              <AnimatePresence>
                {appState === "loading" ? (
                  <motion.p
                    key="scan"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease }}
                    className="mb-4 text-center text-sm text-slate-500"
                  >
                    Compilation du découpage technique...
                  </motion.p>
                ) : null}
              </AnimatePresence>
              <GlassField
                idea={idea}
                error={appState === "error" ? error : ""}
                busy={appState === "loading"}
                onIdea={setIdea}
                onSubmit={onSubmit}
                onFocusChange={setFocused}
              />
            </motion.div>
          </div>
        </LayoutGroup>

        <AnimatePresence>
          {appState === "success" && plan ? <CreativeThread key={generation} plan={plan} /> : null}
        </AnimatePresence>
      </main>
    </div>
  );
}

function OpticalOculus({ mode, compact = false }: { mode: OculusMode; compact?: boolean }) {
  const reduce = useReducedMotion();
  const processing = mode === "processing" && !compact;
  const focus = mode === "focus" && !compact;

  const spin = (reverse: boolean) => (reduce ? { rotate: 0 } : { rotate: reverse ? -360 : 360 });
  const linear = (seconds: number) => ({
    duration: processing ? Math.max(4, seconds * 0.22) : seconds,
    repeat: reduce ? 0 : Infinity,
    ease: "linear" as const,
  });

  return (
    <motion.div
      className="relative h-full w-full"
      animate={{ scale: focus ? 0.92 : 1 }}
      transition={{ type: "spring", stiffness: 150, damping: 20 }}
      aria-hidden
    >
      <motion.div
        className={`pointer-events-none absolute inset-[30%] rounded-full ${compact ? "blur-sm" : "blur-xl"}`}
        style={{
          background:
            "radial-gradient(circle at 36% 38%, rgba(165,243,252,0.85), transparent 58%), radial-gradient(circle at 68% 64%, rgba(251,207,232,0.7), transparent 54%)",
        }}
        animate={{
          opacity: processing ? 1 : focus ? 0.62 : 0.34,
          scale: reduce ? 1 : processing ? [1, 1.28, 1] : [0.94, 1.06, 0.94],
        }}
        transition={{
          duration: processing ? 1.5 : 4.8,
          repeat: reduce ? 0 : Infinity,
          ease: "easeInOut",
        }}
      />

      <GlassRing inset="2%" duration={56} reverse={false} mark="cyan" reduce={reduce} linear={linear} spin={spin} />

      <motion.div
        className="absolute inset-0"
        animate={{ scale: processing ? 0.68 : focus ? 0.9 : 1 }}
        transition={{ type: "spring", stiffness: 130, damping: 18 }}
      >
        <GlassRing inset="14%" duration={42} reverse mark="magenta" reduce={reduce} linear={linear} spin={spin} />
        {!compact ? (
          <GlassRing inset="28%" duration={30} reverse={false} mark="slate" reduce={reduce} linear={linear} spin={spin} />
        ) : null}
        <BladeField
          duration={processing ? 8 : 48}
          reverse
          reduce={reduce}
          compact={compact}
          radius={compact ? 74 : 78}
          count={6}
          sweep={34}
          stroke={compact ? 3.2 : 1.15}
        />
        {!compact ? (
          <BladeField
            duration={processing ? 6 : 36}
            reverse={false}
            reduce={reduce}
            compact={false}
            radius={58}
            count={3}
            sweep={78}
            stroke={0.9}
          />
        ) : null}
      </motion.div>

      <motion.div
        className="absolute inset-[38%]"
        animate={{ scale: processing ? 0.58 : focus ? 0.84 : 1 }}
        transition={{ type: "spring", stiffness: 170, damping: 18 }}
      >
        <motion.div
          className="h-full w-full rounded-full border border-slate-200 bg-white/40 backdrop-blur-md"
          style={{
            boxShadow: processing
              ? "inset 0 0 22px rgba(103,232,249,0.85), inset 0 0 36px rgba(244,114,182,0.55)"
              : "inset 0 0 16px rgba(165,243,252,0.7), inset 0 0 28px rgba(251,207,232,0.45)",
          }}
          animate={{ scale: reduce ? 1 : processing ? [0.92, 1.12, 0.92] : [0.97, 1.06, 0.97] }}
          transition={{
            duration: processing ? 1.25 : 4.4,
            repeat: reduce ? 0 : Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      {!compact ? (
        <div className="pointer-events-none absolute left-[20%] top-[14%] h-[24%] w-[16%] rounded-full bg-white/80 blur-md" />
      ) : null}
    </motion.div>
  );
}

function GlassRing({
  inset,
  duration,
  reverse,
  mark,
  reduce,
  linear,
  spin,
}: {
  inset: string;
  duration: number;
  reverse: boolean;
  mark: "cyan" | "magenta" | "slate";
  reduce: boolean | null;
  linear: (seconds: number) => { duration: number; repeat: number; ease: "linear" };
  spin: (reverse: boolean) => { rotate: number };
}) {
  const markClass =
    mark === "cyan"
      ? "from-cyan-300/80"
      : mark === "magenta"
        ? "from-fuchsia-300/70"
        : "from-slate-300/80";

  return (
    <motion.div
      className="absolute"
      style={{ inset }}
      animate={spin(reverse)}
      transition={linear(reduce ? 0 : duration)}
    >
      <div className="absolute inset-0 rounded-full border border-slate-300/80" />
      <div
        className="absolute inset-[3%] rounded-full bg-white/40 backdrop-blur-md"
        style={{
          WebkitMaskImage: "radial-gradient(circle, transparent 84%, #000 94%)",
          maskImage: "radial-gradient(circle, transparent 84%, #000 94%)",
        }}
      />
      <span
        className={`absolute left-1/2 top-0 h-[14%] w-px -translate-x-1/2 bg-gradient-to-b ${markClass} to-transparent`}
      />
    </motion.div>
  );
}

function BladeField({
  duration,
  reverse,
  reduce,
  compact,
  radius,
  count,
  sweep,
  stroke,
}: {
  duration: number;
  reverse: boolean;
  reduce: boolean | null;
  compact: boolean;
  radius: number;
  count: number;
  sweep: number;
  stroke: number;
}) {
  return (
    <motion.svg
      viewBox="0 0 200 200"
      className={`absolute overflow-visible ${compact ? "inset-[6%]" : "inset-[4%]"}`}
      animate={reduce ? { rotate: 0 } : { rotate: reverse ? -360 : 360 }}
      transition={{ duration, repeat: reduce ? 0 : Infinity, ease: "linear" }}
    >
      {Array.from({ length: count }, (_, index) => (
        <path
          key={index}
          d={arc(100, 100, radius, (360 / count) * index - sweep / 2, sweep)}
          fill="none"
          stroke={index % 2 === 0 ? "#94a3b8" : "#cbd5e1"}
          strokeWidth={stroke}
          strokeLinecap="round"
        />
      ))}
    </motion.svg>
  );
}

function arc(cx: number, cy: number, radius: number, startDeg: number, sweep: number) {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const x1 = cx + Math.cos(rad(startDeg)) * radius;
  const y1 = cy + Math.sin(rad(startDeg)) * radius;
  const x2 = cx + Math.cos(rad(startDeg + sweep)) * radius;
  const y2 = cy + Math.sin(rad(startDeg + sweep)) * radius;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${radius} ${radius} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

function GlassField({
  idea,
  error,
  busy,
  onIdea,
  onSubmit,
  onFocusChange,
}: {
  idea: string;
  error: string;
  busy: boolean;
  onIdea: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onFocusChange: (focused: boolean) => void;
}) {
  return (
    <motion.form layout transition={glide} onSubmit={onSubmit} className="w-full min-w-0">
      <label htmlFor="vision" className="sr-only">
        Vision de la scène
      </label>
      <div className="flex w-full min-w-0 flex-col gap-2 rounded-[28px] border border-slate-200/50 bg-white/40 p-2 shadow-xl shadow-slate-200/50 backdrop-blur-2xl sm:flex-row sm:items-center sm:rounded-full">
        <input
          id="vision"
          value={idea}
          onChange={(event) => onIdea(event.target.value)}
          onFocus={() => onFocusChange(true)}
          onBlur={() => onFocusChange(false)}
          placeholder="Décrivez la vision de votre scène..."
          maxLength={500}
          autoComplete="off"
          disabled={busy}
          className="h-12 w-full min-w-0 flex-1 bg-transparent px-4 text-base text-slate-900 outline-none placeholder:text-slate-400 disabled:text-slate-400"
        />
        <button
          type="submit"
          disabled={busy || idea.trim().length < 2}
          className="h-11 w-full shrink-0 rounded-full bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 sm:w-auto"
        >
          Entrer
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-4 text-center text-sm text-slate-700">
          {error}
        </p>
      ) : null}
    </motion.form>
  );
}

const threadContainer = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.18, delayChildren: 0.32 },
  },
};

const threadNode = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
};

function CreativeThread({ plan }: { plan: DirectivePlan }) {
  const reduce = useReducedMotion();

  return (
    <motion.section
      aria-label="Fil de création"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease }}
      className="relative z-10 mx-auto mt-10 w-full max-w-2xl px-6 pb-28"
    >
      <div className="relative">
        <motion.div
          aria-hidden
          className="absolute left-3 top-0 w-px -translate-x-1/2 bg-[linear-gradient(to_bottom,#cbd5e1_0%,#e2e8f0_92%,transparent_100%)]"
          initial={{ height: reduce ? "100%" : 0 }}
          animate={{ height: "100%" }}
          transition={{ duration: reduce ? 0 : 1.25, ease }}
        />
        <motion.ol
          className="space-y-10"
          initial="hidden"
          animate="show"
          variants={reduce ? undefined : threadContainer}
        >
          {STEPS.map((step, index) => (
            <ThreadNode key={step.id} index={String(index + 1).padStart(2, "0")}>
              <StepBody id={step.id} plan={plan} />
            </ThreadNode>
          ))}
        </motion.ol>
      </div>
    </motion.section>
  );
}

function StepBody({ id, plan }: { id: StepId; plan: DirectivePlan }) {
  const step = STEPS.find((item) => item.id === id) ?? STEPS[0];

  return (
    <article className={glass}>
      <CardHeader icon={step.icon} title={step.label} />
      {id === "vision" ? <VisionBody plan={plan} /> : null}
      {id === "arsenal" ? <ArsenalBody plan={plan} /> : null}
      {id === "plateau" ? <PlateauBody plan={plan} /> : null}
      {id === "post" ? <PostBody plan={plan} /> : null}
    </article>
  );
}

function VisionBody({ plan }: { plan: DirectivePlan }) {
  return (
    <div className="space-y-8">
      <p className="text-base leading-relaxed text-slate-800">{plan.directive}</p>
      <Field label="Pitch" text={plan.atmosphere.pitch} />
      <div className="grid gap-8 sm:grid-cols-2">
        <Field label="Ambiance" text={plan.atmosphere.ambiance || "À préciser sur le plateau."} />
        <Field label="Sound design" text={plan.atmosphere.sound || "À préciser au montage."} />
      </div>
    </div>
  );
}

function ArsenalBody({ plan }: { plan: DirectivePlan }) {
  return (
    <ul>
      {plan.gear_setup.map((item) => (
        <li
          key={item.name}
          className="flex flex-col gap-3 border-b border-slate-100 py-4 first:pt-0 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">{item.name}</span>
          <p className="text-sm leading-relaxed text-slate-800 sm:max-w-[60%] sm:text-right">{item.role}</p>
        </li>
      ))}
    </ul>
  );
}

function PlateauBody({ plan }: { plan: DirectivePlan }) {
  return (
    <ol>
      {plan.shotlist.map((shot, index) => (
        <li key={`${shot.focal}-${index}`} className="border-b border-slate-100 py-5 first:pt-0 last:border-0 last:pb-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold tracking-widest text-slate-400">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="rounded-full bg-slate-900 px-3 py-1 text-sm text-white">{shot.focal}</span>
            <span className="text-sm font-semibold text-slate-800">{shot.movement}</span>
            <span className="text-sm text-slate-500">{shot.angle}</span>
          </div>
          <p className="mt-3 text-base leading-relaxed text-slate-800">{shot.action}</p>
        </li>
      ))}
    </ol>
  );
}

function PostBody({ plan }: { plan: DirectivePlan }) {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <Field label="Premiere Pro" text={plan.post_production.premiere || "Montage à préciser."} />
      <Field label="DaVinci Resolve" text={plan.post_production.resolve || "Étalonnage nodal à préciser."} />
    </div>
  );
}

function CardHeader({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="mb-6 flex items-center gap-2.5">
      <Icon className="h-4 w-4 text-slate-400" strokeWidth={1.5} aria-hidden />
      <h2 className="text-xs font-semibold tracking-widest text-slate-400 uppercase">{title}</h2>
    </div>
  );
}

function Field({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <h3 className="text-xs font-semibold tracking-widest text-slate-400 uppercase">{label}</h3>
      <p className="mt-2 text-base leading-relaxed text-slate-800">{text}</p>
    </div>
  );
}

function ThreadNode({ index, children }: { index: string; children: ReactNode }) {
  return (
    <motion.li variants={threadNode} className="relative pl-12">
      <span
        aria-hidden
        className="absolute left-3 top-8 z-10 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-white shadow-[0_0_0_5px_#f8fafc,0_0_16px_rgba(103,232,249,0.95)] ring-1 ring-cyan-200"
      />
      <p className="mb-3 text-[11px] font-semibold tracking-widest text-slate-400">{index}</p>
      {children}
    </motion.li>
  );
}

const glass =
  "rounded-3xl border border-slate-200/50 bg-white/40 p-6 shadow-xl shadow-slate-200/50 backdrop-blur-2xl sm:p-8";
