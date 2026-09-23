"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Cpu, Crosshair, Radio } from "lucide-react";
import { formatStream, usedOptics, type DirectivePlan, type Focal } from "@/lib/plan";

const ARSENAL: { id: string; name: string; kind: string; focal?: Focal }[] = [
  { id: "01", name: "Sony A7V", kind: "Boîtier" },
  { id: "02", name: "Laowa 10mm", kind: "Optique", focal: "Laowa 10mm" },
  { id: "03", name: "16-35mm", kind: "Optique", focal: "16-35mm" },
  { id: "04", name: "70-200mm", kind: "Optique", focal: "70-200mm" },
  { id: "05", name: "Panneau LED RGB", kind: "Lumière" },
  { id: "06", name: "Trépied", kind: "Machinerie" },
  { id: "07", name: "SmallRig", kind: "Machinerie" },
];

const LOG_LINES = [
  "SEN.A7V     NOMINAL",
  "WB          4300K",
  "SHUTTER     1/50",
  "CODEC       H.265",
  "LINK        AES-256",
  "BUFFER      FLUSH OK",
  "OPTIC.BUS   LOCKED",
  "RGB.BUS     STANDBY",
  "RIG.CAGE    MATED",
  "UPLINK      QUIET",
];

const BOOT_LINES = [
  "> HANDSHAKE .............. OK",
  "> ARSENAL LOCK ............ CHECK",
  "> PARSING DIRECTIVE .......",
  "> QUERYING CORE ...........",
  "> DECRYPTING PACKET .......",
];

type Phase = "idle" | "loading" | "result" | "error";

export default function HomePage() {
  const [idea, setIdea] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [plan, setPlan] = useState<DirectivePlan | null>(null);
  const [error, setError] = useState("");
  const [boot, setBoot] = useState(0);
  const [clock, setClock] = useState("--:--:--");
  const [tick, setTick] = useState(0);
  const [reduced, setReduced] = useState(false);
  const consoleRef = useRef<HTMLPreElement>(null);

  const stream = plan ? formatStream(plan) : "";
  const optics = useMemo(() => (plan ? usedOptics(plan) : new Set<Focal>()), [plan]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const paint = () => setClock(new Date().toLocaleTimeString("fr-FR", { hour12: false }));
    paint();
    const id = window.setInterval(paint, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setTick((value) => value + 1), 900);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (phase !== "loading") return;
    const id = window.setInterval(() => {
      setBoot((value) => (value + 1) % BOOT_LINES.length);
    }, 700);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "result" && phase !== "loading") return;
    const node = consoleRef.current;
    if (!node) return;
    const id = window.setInterval(() => {
      node.scrollTop = node.scrollHeight;
    }, 80);
    const stop = window.setTimeout(
      () => window.clearInterval(id),
      phase === "loading" ? 20000 : Math.max(1500, stream.length * 4),
    );
    return () => {
      window.clearInterval(id);
      window.clearTimeout(stop);
    };
  }, [phase, stream]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextIdea = idea.trim();
    if (nextIdea.length < 2 || phase === "loading") return;

    setPhase("loading");
    setBoot(0);
    setPlan(null);
    setError("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: nextIdea }),
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        const message =
          data && typeof data === "object" && "error" in data && typeof data.error === "string"
            ? data.error
            : "ÉCHEC DE DÉCRYPTAGE.";
        setError(message);
        setPhase("error");
        return;
      }
      if (!data || typeof data !== "object" || !("plan" in data)) {
        setError("PAQUET INATTENDU.");
        setPhase("error");
        return;
      }
      setPlan(data.plan as DirectivePlan);
      setPhase("result");
    } catch {
      setError("UPLINK ROMPU.");
      setPhase("error");
    }
  }

  function clearDirective() {
    setIdea("");
    setPlan(null);
    setError("");
    setPhase("idle");
  }

  const latency = 9 + (tick % 8);
  const buffer = 48 + ((tick * 3) % 40);
  const fast = phase === "loading";

  return (
    <div className="relative flex h-svh flex-col overflow-hidden bg-black font-mono text-cyan-400 uppercase">
      <div className="hud-grid pointer-events-none absolute inset-0" aria-hidden />
      <div
        className="animate-scan pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-cyan-400/10 to-transparent"
        aria-hidden
      />
      <ViewportMarks />

      <header className="relative z-10 flex items-center justify-between border-b border-cyan-500/40 px-4 py-2 text-[10px] tracking-[0.28em]">
        <div className="flex items-center gap-3">
          <span className="drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
            <Crosshair className="h-3.5 w-3.5" strokeWidth={1.25} />
          </span>
          <span className="drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">Director.AI</span>
          <span className="hidden text-cyan-400/50 sm:inline">{"// Unité logique"}</span>
        </div>
        <div className="flex items-center gap-4 text-orange-500">
          <span className={fast ? "animate-flicker" : ""}>{fast ? "Decrypt" : "Link"}</span>
          <span>{clock}</span>
        </div>
      </header>

      <div className="relative z-10 grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[minmax(190px,230px)_1fr_minmax(210px,260px)] lg:overflow-hidden">
        <aside className="border-cyan-500/40 px-3 py-3 lg:overflow-hidden lg:border-r">
          <PanelLabel icon="tel" label="Tel // 01  Environnement" />
          <dl className="mt-3 space-y-1.5 text-[11px]">
            <Row k="Core" v="Nominal" />
            <Row k="Latency" v={`${latency} ms`} />
            <Row k="Buffer" v={`${buffer}%`} />
            <Row k="Iso" v={tick % 2 === 0 ? "800" : "640"} />
            <Row k="Sensor" v="Sony A7V" />
            <Row k="Channel" v={phase === "loading" ? "Busy" : "Idle"} hot={phase === "loading"} />
          </dl>
          <div className="mt-4 h-px w-2/3 bg-cyan-500/40" />
          <p className="mt-3 text-[10px] tracking-[0.22em] text-cyan-400/50">Flux</p>
          <div className="relative mt-2 h-28 overflow-hidden lg:h-[38%]">
            <div className={reduced ? "" : "animate-telemetry"}>
              {[0, 1].map((copy) => (
                <ul key={copy} className="space-y-1 text-[10px] leading-4 text-cyan-400/70">
                  {LOG_LINES.map((line) => (
                    <li key={`${copy}-${line}`}>{line}</li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        </aside>

        <section className="relative flex min-h-[340px] items-center justify-center px-3 py-6">
          <Reactor fast={fast} reduced={reduced} />
          <form
            onSubmit={onSubmit}
            className="absolute z-10 flex w-max max-w-[94%] flex-col items-center gap-3 bg-black px-3 py-2"
          >
            <label htmlFor="directive" className="sr-only">
              Directive
            </label>
            <div className="flex max-w-full flex-wrap items-center justify-center gap-x-2 text-xs sm:text-sm">
              <span className="text-cyan-400/70">&gt; Initialiser directive :</span>
              <span className="text-cyan-500/40">[</span>
              <input
                id="directive"
                value={idea}
                onChange={(event) => setIdea(event.target.value)}
                placeholder="Votre idée ici"
                maxLength={500}
                autoComplete="off"
                spellCheck={false}
                style={{ width: `${Math.max(idea.length, 16)}ch` }}
                className="max-w-full bg-transparent text-cyan-400 caret-cyan-400 outline-none placeholder:text-cyan-500/30"
              />
              <span className="animate-blink text-cyan-400">_</span>
              <span className="text-cyan-500/40">]</span>
            </div>
            <div className="flex gap-3 text-[10px] tracking-[0.22em]">
              <button
                type="submit"
                disabled={phase === "loading"}
                className="border border-cyan-500/40 px-3 py-1 text-cyan-400 transition hover:border-cyan-400 hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] disabled:opacity-40"
              >
                [ Exec ]
              </button>
              <button
                type="button"
                onClick={clearDirective}
                className="border border-orange-500/50 px-3 py-1 text-orange-500 transition hover:border-orange-500"
              >
                [ Clear ]
              </button>
            </div>
          </form>
        </section>

        <aside className="border-cyan-500/40 px-3 py-3 lg:overflow-y-auto lg:border-l">
          <PanelLabel icon="ars" label="Ars // 02  Arsenal" />
          <ul className="mt-3 space-y-2">
            {ARSENAL.map((item) => {
              const state = gearState(item, phase, optics, plan);
              return (
                <li key={item.id} className="flex items-baseline justify-between gap-3 text-[11px]">
                  <span className="min-w-0">
                    <span className="text-cyan-400/40">[{item.id}]</span> {item.name}
                    <span className="mt-0.5 block text-[10px] tracking-[0.16em] text-cyan-400/35">
                      {item.kind}
                    </span>
                  </span>
                  <span className={state === "LOCKED" ? "text-orange-500" : "text-cyan-400/50"}>
                    {state}
                  </span>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>

      <section className="relative z-10 mx-3 mb-3 mt-1 flex h-[30svh] min-h-[168px] shrink-0 flex-col lg:mx-4">
        <div className="relative min-h-0 flex-1 border border-cyan-500/40">
          <Mark className="left-0 top-0 border-l border-t" />
          <Mark className="right-0 top-0 border-r border-t" />
          <Mark className="bottom-0 left-0 border-b border-l" />
          <Mark className="bottom-0 right-0 border-b border-r" />
          <div className="flex items-center justify-between px-4 pt-3 text-[10px] tracking-[0.28em]">
            <span className="drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">Out // 03  Console</span>
            <span className="text-orange-500">{phase === "result" ? "Clear" : "Standby"}</span>
          </div>
          <pre
            ref={consoleRef}
            aria-live="polite"
            className="h-[calc(100%-2rem)] overflow-auto px-4 py-3 text-[11px] leading-5 whitespace-pre-wrap text-cyan-400/90 normal-nums"
          >
            {phase === "idle" ? (
              "> AWAITING DIRECTIVE\n> ARSENAL LOCKED // SONY A7V · LAOWA 10MM · 16-35MM · 70-200MM · LED RGB · TRÉPIED · SMALLRIG\n> CHANNEL IDLE"
            ) : null}
            {phase === "loading" ? `${BOOT_LINES[boot]}\n${hexBlock(tick)}` : null}
            {phase === "error" ? <span className="text-orange-500">&gt; {error}</span> : null}
            {phase === "result" ? <DecryptText key={stream} source={stream} /> : null}
          </pre>
        </div>
      </section>
    </div>
  );
}

function gearState(
  item: (typeof ARSENAL)[number],
  phase: Phase,
  optics: Set<Focal>,
  plan: DirectivePlan | null,
): "SCAN" | "STANDBY" | "LOCKED" | "IDLE" {
  if (phase === "loading") return "SCAN";
  if (!plan || phase !== "result") return "STANDBY";
  if (!item.focal) return "LOCKED";
  return optics.has(item.focal) ? "LOCKED" : "IDLE";
}

function hexBlock(seed: number) {
  return Array.from({ length: 3 }, (_, row) => {
    let value = seed + row * 17;
    let line = "  ";
    for (let i = 0; i < 22; i += 1) {
      value = (value * 16807 + 11) % 2147483647;
      line += (value % 16).toString(16);
    }
    return line;
  }).join("\n");
}

function DecryptText({ source }: { source: string }) {
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    let current = 0;
    const id = window.setInterval(() => {
      current = Math.min(source.length, current + 8);
      setVisible(current);
      if (current >= source.length) window.clearInterval(id);
    }, 16);
    return () => window.clearInterval(id);
  }, [source]);

  return (
    <>
      {source.slice(0, visible)}
      {visible < source.length ? <span className="animate-blink">█</span> : null}
    </>
  );
}

function PanelLabel({ icon, label }: { icon: "tel" | "ars"; label: string }) {
  const Icon = icon === "tel" ? Radio : Cpu;
  return (
    <div className="flex items-center gap-2 text-[10px] tracking-[0.24em] drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]">
      <Icon className="h-3 w-3" strokeWidth={1.25} />
      {label}
    </div>
  );
}

function Row({ k, v, hot = false }: { k: string; v: string; hot?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-cyan-400/45">{k}</dt>
      <dd className={hot ? "text-orange-500" : "text-cyan-400"}>{v}</dd>
    </div>
  );
}

function Mark({ className }: { className: string }) {
  return (
    <span
      className={`pointer-events-none absolute h-3 w-3 border-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] ${className}`}
    />
  );
}

function ViewportMarks() {
  return (
    <div className="pointer-events-none absolute inset-2 z-20" aria-hidden>
      <Mark className="left-0 top-0 h-5 w-5 border-l border-t" />
      <Mark className="right-0 top-0 h-5 w-5 border-r border-t" />
      <Mark className="bottom-0 left-0 h-5 w-5 border-b border-l" />
      <Mark className="bottom-0 right-0 h-5 w-5 border-b border-r" />
    </div>
  );
}

function ringSpin(seconds: number, direction: 1 | -1, fast: boolean, reduced: boolean) {
  if (reduced) {
    return { animate: { rotate: 0 }, transition: { duration: 0 } };
  }
  return {
    animate: { rotate: direction * 360 },
    transition: {
      duration: fast ? seconds / 3 : seconds,
      repeat: Infinity,
      ease: "linear" as const,
    },
  };
}

function Reactor({ fast, reduced }: { fast: boolean; reduced: boolean }) {
  const outer = ringSpin(28, 1, fast, reduced);
  const dashed = ringSpin(16, -1, fast, reduced);
  const inner = ringSpin(9, 1, fast, reduced);
  const tokenA = ringSpin(12, 1, fast, reduced);
  const tokenB = ringSpin(7, -1, fast, reduced);

  return (
    <div className="relative aspect-square w-[min(78vw,440px)]" aria-hidden>
      <motion.div
        className="absolute inset-0 rounded-full border border-cyan-500/40"
        animate={outer.animate}
        transition={outer.transition}
        style={{
          background:
            "repeating-conic-gradient(from 0deg, rgba(34,211,238,0.85) 0deg 1.2deg, transparent 1.2deg 15deg)",
          WebkitMask:
            "radial-gradient(circle, transparent 61%, #000 62% 66%, transparent 67%)",
          mask: "radial-gradient(circle, transparent 61%, #000 62% 66%, transparent 67%)",
        }}
      />
      <motion.div
        className="absolute inset-[12%] rounded-full border border-dashed border-cyan-400/60"
        animate={dashed.animate}
        transition={dashed.transition}
      />
      <motion.div
        className="absolute inset-[24%] rounded-full border border-cyan-400/35"
        animate={inner.animate}
        transition={inner.transition}
      >
        <span className="absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 bg-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.9)]" />
      </motion.div>
      <motion.div className="absolute inset-[8%]" animate={tokenA.animate} transition={tokenA.transition}>
        <span className="absolute left-1/2 top-0 -translate-x-1/2 text-[9px] tracking-[0.2em] text-cyan-400/80">
          A7V
        </span>
      </motion.div>
      <motion.div className="absolute inset-[18%]" animate={tokenB.animate} transition={tokenB.transition}>
        <span className="absolute top-1/2 right-0 -translate-y-1/2 text-[9px] text-orange-500">
          RGB
        </span>
      </motion.div>
      <div className="absolute top-1/2 left-0 h-px w-[16%] bg-cyan-400/70" />
      <div className="absolute top-1/2 right-0 h-px w-[16%] bg-cyan-400/70" />
      <div className="absolute top-0 left-1/2 h-[16%] w-px bg-cyan-400/70" />
      <div className="absolute bottom-0 left-1/2 h-[16%] w-px bg-cyan-400/70" />
      <motion.span
        className="absolute top-[18%] left-0 text-[9px] tracking-[0.3em] text-cyan-400/50"
        animate={reduced ? undefined : { x: ["0%", "220%"], opacity: [0, 1, 0] }}
        transition={reduced ? undefined : { duration: fast ? 2.2 : 4.8, repeat: Infinity, ease: "linear" }}
      >
        04F2·16-35·LED
      </motion.span>
    </div>
  );
}
