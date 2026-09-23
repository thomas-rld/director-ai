"use client";

import {
  Aperture,
  AudioLines,
  Box,
  Camera,
  Clapperboard,
  Focus,
  Lightbulb,
  UnfoldVertical,
  ZoomIn,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import type { DirectorPlan, GearName } from "@/lib/plan";

const GEAR_ICONS: Record<GearName, LucideIcon> = {
  "Sony A7V": Camera,
  "Laowa 10mm": Aperture,
  "16-35mm": Focus,
  "70-200mm": ZoomIn,
  "Panneau LED RGB": Lightbulb,
  Trépied: UnfoldVertical,
  SmallRig: Box,
};

const card = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  },
};

type ResultDashboardProps = {
  plan: DirectorPlan;
};

export function ResultDashboard({ plan }: ResultDashboardProps) {
  return (
    <motion.section
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.07 } } }}
      className="grid grid-cols-1 gap-3 md:grid-cols-12"
      aria-label="Plan de tournage"
    >
      <motion.article
        variants={card}
        className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl md:col-span-8 md:p-8"
      >
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/40">Titre</p>
        <h2 className="mt-3 text-4xl font-medium tracking-[-0.04em] text-white md:text-5xl">
          {plan.title}
        </h2>
        <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 md:text-lg">{plan.pitch}</p>
      </motion.article>

      <motion.article
        variants={card}
        className="flex flex-col justify-between rounded-3xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl md:col-span-4"
      >
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/40">Durée</p>
          <p className="mt-3 text-4xl font-medium tracking-[-0.04em]">{plan.duration}</p>
        </div>
        <div className="mt-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-white/40">Ton</p>
          <p className="mt-2 text-lg text-amber-100/90">{plan.tone}</p>
        </div>
      </motion.article>

      <motion.article
        variants={card}
        className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl md:col-span-5"
      >
        <SectionLabel icon={Aperture}>Colorimétrie</SectionLabel>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-2 xl:grid-cols-4">
          {plan.colorimetry.map((swatch) => (
            <li key={`${swatch.hex}-${swatch.name}`} className="min-w-0">
              <div
                className="h-20 rounded-2xl border border-white/10 shadow-[inset_0_0_24px_rgba(255,255,255,0.06)]"
                style={{ backgroundColor: swatch.hex }}
              />
              <p className="mt-2 truncate text-sm text-white/85">{swatch.name}</p>
              <p className="font-mono text-[10px] tracking-wide text-white/40">{swatch.hex}</p>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/50">{swatch.note}</p>
            </li>
          ))}
        </ul>
      </motion.article>

      <motion.article
        variants={card}
        className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl md:col-span-4"
      >
        <SectionLabel icon={AudioLines}>Sound design</SectionLabel>
        <ul className="space-y-3">
          {plan.soundDesign.map((layer) => (
            <li
              key={layer.layer}
              className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-sm text-white/90">{layer.layer}</p>
                <Waveform />
              </div>
              <p className="text-sm leading-6 text-white/55">{layer.description}</p>
            </li>
          ))}
        </ul>
      </motion.article>

      <motion.article
        variants={card}
        className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl md:col-span-3"
      >
        <SectionLabel icon={Box}>Gear check</SectionLabel>
        <ul className="space-y-3">
          {plan.gear.map((item) => {
            const Icon = GEAR_ICONS[item.name];
            return (
              <li key={item.name} className="flex gap-3">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border border-cyan-200/20 bg-cyan-200/5 text-cyan-100">
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-white/90">{item.name}</p>
                  <p className="text-xs leading-5 text-white/45">{item.usage}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </motion.article>

      <motion.article
        variants={card}
        className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl md:col-span-12"
      >
        <SectionLabel icon={Clapperboard}>Storyboard</SectionLabel>
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
          {plan.storyboard.map((shot) => (
            <article
              key={shot.shot}
              className="w-[min(100%,320px)] shrink-0 snap-start overflow-hidden rounded-2xl border border-white/10 bg-black/40"
            >
              <div className="frame-well relative aspect-video bg-[#070707]">
                <span className="absolute left-3 top-3 h-3 w-3 border-l border-t border-white/35" />
                <span className="absolute right-3 top-3 h-3 w-3 border-r border-t border-white/35" />
                <span className="absolute bottom-3 left-3 h-3 w-3 border-b border-l border-white/35" />
                <span className="absolute bottom-3 right-3 h-3 w-3 border-b border-r border-white/35" />
                <p className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-mono text-[10px] uppercase tracking-[0.32em] text-white/35">
                  Image à venir
                </p>
                <p className="absolute right-4 top-4 font-mono text-[10px] tracking-[0.2em] text-white/55">
                  {String(shot.shot).padStart(2, "0")}
                </p>
              </div>
              <div className="space-y-3 p-4">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-cyan-200/20 bg-cyan-200/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-cyan-100/90">
                    {shot.focal}
                  </span>
                  <span className="rounded-full border border-amber-200/20 bg-amber-200/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-amber-100/90">
                    {shot.movement}
                  </span>
                </div>
                <p className="text-sm leading-6 text-white/72">{shot.action}</p>
              </div>
            </article>
          ))}
        </div>
      </motion.article>
    </motion.section>
  );
}

function SectionLabel({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-white/45">
      <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
      {children}
    </div>
  );
}

const WAVE_HEIGHTS = [8, 14, 6, 18, 10, 16, 7, 12, 9];

function Waveform() {
  return (
    <span className="flex h-4 items-end gap-0.5" aria-hidden>
      {WAVE_HEIGHTS.map((height, index) => (
        <span
          key={index}
          className="w-0.5 rounded-full bg-cyan-100/50"
          style={{ height }}
        />
      ))}
    </span>
  );
}
