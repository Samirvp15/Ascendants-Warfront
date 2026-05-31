import { memo } from "react";
import { motion } from "framer-motion";

type DamageParticleBurstProps = {
  burstKey: number;
  amount: number;
};

/** HP discount only — floating -X near the life icon, no full-card effects. */
export const DamageParticleBurst = memo(function DamageParticleBurst({
  burstKey,
  amount,
}: DamageParticleBurstProps) {
  if (burstKey <= 0 || amount <= 0) return null;

  return (
    <motion.span
      key={burstKey}
      className="damage-particles__value font-display pointer-events-none absolute right-[8%] bottom-[10%] z-[25] tabular-nums font-black text-rose-300"
      style={{ textShadow: "0 0 10px rgba(248, 113, 113, 0.85), 0 2px 6px rgba(0,0,0,0.9)" }}
      initial={{ opacity: 0, y: 4, scale: 0.85 }}
      animate={{ opacity: [0, 1, 1, 0], y: [0, -14, -26], scale: [0.85, 1.1, 1] }}
      transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1], times: [0, 0.15, 0.55, 1] }}
    >
      -{amount}
    </motion.span>
  );
});
