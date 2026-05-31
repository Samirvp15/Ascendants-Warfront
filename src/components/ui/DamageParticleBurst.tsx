import { memo, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";

type DamageParticleBurstProps = {
  burstKey: number;
  amount: number;
};

const PARTICLE_COUNT = 10;

function createParticles(seed: number) {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + seed * 0.17;
    const dist = 18 + (seed % 7) + (i % 3) * 6;
    return {
      id: i,
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist - 8,
      size: 3 + (i % 3),
      delay: i * 0.018,
    };
  });
}

export const DamageParticleBurst = memo(function DamageParticleBurst({
  burstKey,
  amount,
}: DamageParticleBurstProps) {
  const particles = useMemo(() => createParticles(burstKey + amount), [burstKey, amount]);

  if (burstKey <= 0 || amount <= 0) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={burstKey}
        className="damage-particles pointer-events-none absolute inset-0 z-[25]"
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
      >
        <motion.span
          className="damage-particles__value font-display absolute right-[8%] bottom-[10%] z-[2] tabular-nums font-black text-rose-300"
          style={{ textShadow: "0 0 10px rgba(248, 113, 113, 0.85), 0 2px 6px rgba(0,0,0,0.9)" }}
          initial={{ opacity: 0, y: 6, scale: 0.7 }}
          animate={{ opacity: [0, 1, 1, 0], y: [-4, -22, -40], scale: [0.7, 1.15, 0.95] }}
          transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1], times: [0, 0.18, 0.62, 1] }}
        >
          -{amount}
        </motion.span>

        {particles.map((p) => (
          <motion.span
            key={p.id}
            className="damage-particles__spark absolute rounded-full bg-rose-400"
            style={{
              right: "11%",
              bottom: "12%",
              width: p.size,
              height: p.size,
              boxShadow: "0 0 6px rgba(248, 113, 113, 0.9)",
              willChange: "transform, opacity",
            }}
            initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
            animate={{
              opacity: [0, 1, 0],
              x: p.x,
              y: p.y,
              scale: [0.4, 1, 0.2],
            }}
            transition={{
              duration: 0.82,
              delay: p.delay * 1.6,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
        ))}

        <motion.span
          className="damage-particles__ring absolute rounded-full border border-rose-300/70"
          style={{ right: "6%", bottom: "8%", width: "1.75rem", height: "1.75rem" }}
          initial={{ opacity: 0.7, scale: 0.35 }}
          animate={{ opacity: 0, scale: 1.8 }}
          transition={{ duration: 0.72, ease: "easeOut" }}
        />
      </motion.div>
    </AnimatePresence>
  );
});
