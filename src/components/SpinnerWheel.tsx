"use client";

import { cn } from "@/lib/utils";
import { motion, useAnimation } from "framer-motion";
import { useCallback, useImperativeHandle, useRef, useState } from "react";

export interface SpinnerWheelHandle {
  spin: () => void;
}

interface SpinnerWheelProps {
  segments: { id: number; label: string }[];
  onSpinEnd: (selectedId: number) => void;
  disabled?: boolean;
  ref?: React.Ref<SpinnerWheelHandle>;
}

const SEGMENT_COLORS = [
  "#facc15",
  "#22d3ee",
  "#f472b6",
  "#a3e635",
  "#fb923c",
  "#a78bfa",
  "#34d399",
  "#f87171",
];

const MIN_SPINS = 6;
const MAX_EXTRA_SPINS = 4;
const CX = 140;
const CY = 140;
const R = 124;

export default function SpinnerWheel({
  segments,
  onSpinEnd,
  disabled = false,
  ref,
}: SpinnerWheelProps) {
  const controls = useAnimation();
  const [spinning, setSpinning] = useState(false);
  const [landed, setLanded] = useState<number | null>(null);
  const [pulseRim, setPulseRim] = useState(false);
  const totalRotationRef = useRef(0);

  const count = segments.length;
  const segmentAngle = count > 0 ? 360 / count : 0;

  const buildPath = (index: number) => {
    const start = ((index * segmentAngle - 90) * Math.PI) / 180;
    const end = (((index + 1) * segmentAngle - 90) * Math.PI) / 180;
    const x1 = CX + R * Math.cos(start);
    const y1 = CY + R * Math.sin(start);
    const x2 = CX + R * Math.cos(end);
    const y2 = CY + R * Math.sin(end);
    const largeArc = segmentAngle > 180 ? 1 : 0;
    return `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  const getLabelPos = (index: number) => {
    const mid = ((index + 0.5) * segmentAngle - 90) * (Math.PI / 180);
    return {
      x: CX + R * 0.6 * Math.cos(mid),
      y: CY + R * 0.6 * Math.sin(mid),
    };
  };

  const spin = useCallback(async () => {
    if (spinning || disabled || count === 0) return;
    setSpinning(true);
    setLanded(null);
    setPulseRim(false);

    const extraSpins = MIN_SPINS + Math.floor(Math.random() * MAX_EXTRA_SPINS);
    const landingOffset = Math.random() * 360;
    const target = totalRotationRef.current + extraSpins * 360 + landingOffset;

    // 1. Spin fast and decelerate to just before the target (10 degrees short)
    const prepTarget = target - 10;
    await controls.start({
      rotate: prepTarget,
      transition: {
        duration: 3.8,
        ease: [0.05, 0.8, 0.3, 1.0],
      },
    });

    // 2. Spring bounce overshoot to the final target
    await controls.start({
      rotate: target,
      transition: {
        type: "spring",
        stiffness: 150,
        damping: 12,
        mass: 0.8,
      },
    });

    totalRotationRef.current = target;

    const normalised = ((target % 360) + 360) % 360;
    const segmentIndex = Math.floor(((360 - normalised) % 360) / segmentAngle) % count;
    const selected = segments[segmentIndex];

    setLanded(selected.id);
    setSpinning(false);
    setPulseRim(true);
    setTimeout(() => setPulseRim(false), 1000);
    onSpinEnd(selected.id);
  }, [spinning, disabled, count, controls, segments, onSpinEnd, segmentAngle]);

  // Expose spin() so parent can call it via ref
  useImperativeHandle(ref, () => ({ spin }), [spin]);

  if (count === 0) {
    return (
      <p className="text-center text-sm text-[#5A5A5A] py-8">
        Belum ada pertanyaan tersedia.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      <div className="relative w-full max-w-[300px] mx-auto select-none">
        {/* Pointer */}
        <div
          className="absolute left-1/2 -translate-x-1/2 z-20"
          style={{ top: "-6px" }}
          aria-hidden="true"
        >
          <svg width="28" height="32" viewBox="0 0 28 32">
            <polygon
              points="14,28 0,0 28,0"
              fill="#000"
              stroke="#000"
              strokeWidth="1"
            />
            <polygon points="14,26 2,2 26,2" fill="#facc15" />
            <circle cx="14" cy="2" r="4" fill="#000" />
          </svg>
        </div>

        {/* Outer rim */}
        <div
          className={cn(
            "rounded-full p-[5px] bg-black transition-all duration-300",
            pulseRim ? "ring-4 ring-[#a3e635] scale-[1.02]" : ""
          )}
          style={{ boxShadow: "5px 5px 0 0 #000, 0 0 0 4px #000" }}
        >
          {/* Spinning disc */}
          <div className="rounded-full overflow-hidden">
            <motion.div
              animate={controls}
              style={{ originX: "50%", originY: "50%", display: "block" }}
            >
              <svg
                viewBox="0 0 280 280"
                width="100%"
                height="100%"
                aria-label="Roda kincir pertanyaan"
                style={{ display: "block" }}
              >
                <defs>
                  {/* Per-segment lighter tint gradient for depth */}
                  {SEGMENT_COLORS.map((color, i) => (
                    <radialGradient
                      key={i}
                      id={`seg-grad-${i}`}
                      cx="35%"
                      cy="35%"
                      r="75%"
                    >
                      <stop offset="0%" stopColor="#fff" stopOpacity="0.35" />
                      <stop offset="100%" stopColor={color} stopOpacity="1" />
                    </radialGradient>
                  ))}
                  {/* Glass-shine overlay */}
                  <radialGradient id="shine" cx="40%" cy="28%" r="65%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.32)" />
                    <stop offset="60%" stopColor="rgba(255,255,255,0.05)" />
                    <stop offset="100%" stopColor="rgba(0,0,0,0.12)" />
                  </radialGradient>
                </defs>

                {/* Background circle */}
                <circle cx={CX} cy={CY} r={R + 4} fill="#000" />

                {/* Segments */}
                {segments.map((seg, i) => {
                  const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
                  const labelPos = getLabelPos(i);
                  const textAngle = (i + 0.5) * segmentAngle - 90;
                  const fontSize = count > 10 ? "6.5" : count > 7 ? "8" : "10";
                  return (
                    <g key={seg.id}>
                      <path
                        d={buildPath(i)}
                        fill={color}
                        stroke="#000"
                        strokeWidth="2.5"
                      />
                      {/* Segment highlight overlay using gradient */}
                      <path
                        d={buildPath(i)}
                        fill={`url(#seg-grad-${i % SEGMENT_COLORS.length})`}
                        stroke="none"
                        opacity="0.6"
                      />
                      <text
                        x={labelPos.x}
                        y={labelPos.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={`rotate(${textAngle}, ${labelPos.x}, ${labelPos.y})`}
                        fontSize={fontSize}
                        fontWeight="800"
                        fontFamily="'Archivo Black', sans-serif"
                        fill="#000"
                        stroke="#fff"
                        strokeWidth="0.8"
                        paintOrder="stroke"
                      >
                        {seg.label || "?"}
                      </text>
                    </g>
                  );
                })}

                {/* Shine overlay on top of all segments */}
                <circle cx={CX} cy={CY} r={R} fill="url(#shine)" />

                {/* Outer ring border */}
                <circle
                  cx={CX}
                  cy={CY}
                  r={R}
                  fill="none"
                  stroke="#000"
                  strokeWidth="3"
                />

                {/* Tick marks */}
                {Array.from({ length: count }).map((_, i) => {
                  const angle = ((i * segmentAngle - 90) * Math.PI) / 180;
                  const x1 = CX + (R - 1) * Math.cos(angle);
                  const y1 = CY + (R - 1) * Math.sin(angle);
                  const x2 = CX + (R - 10) * Math.cos(angle);
                  const y2 = CY + (R - 10) * Math.sin(angle);
                  return (
                    <line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#000"
                      strokeWidth="2.5"
                    />
                  );
                })}

                {/* Hub rings */}
                <circle cx={CX} cy={CY} r={26} fill="#000" />
                <circle cx={CX} cy={CY} r={22} fill="#facc15" />
                <circle cx={CX} cy={CY} r={16} fill="#000" />
                <circle cx={CX} cy={CY} r={10} fill="#fbfbf9" />
                <circle cx={CX} cy={CY} r={5} fill="#000" />
              </svg>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Status */}
      <p
        className={cn(
          "text-xs font-black uppercase tracking-widest font-[family-name:var(--font-head)]",
          spinning ? "text-[#22d3ee]" : landed ? "text-[#a3e635]" : "text-black/40"
        )}
      >
        {spinning ? "Sedang berputar…" : landed ? "Kincir berhenti!" : "Tekan tombol di bawah"}
      </p>
    </div>
  );
}
