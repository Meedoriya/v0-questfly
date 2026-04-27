"use client"

import { useState, useCallback, useMemo } from "react"
import type { Characteristic, AxisKey } from "@/lib/types"
import {
  Heart,
  Sparkles,
  TreePine,
  Wallet,
  Briefcase,
  TrendingUp,
  HeartHandshake,
  Home,
  Users,
  Palette,
  Sun,
  Flower2,
} from "lucide-react"

/* ---------- axis config ---------- */

const AXIS_META: Record<AxisKey, { icon: React.ElementType; color: string; hsl: string }> = {
  health:       { icon: Heart,          color: "text-[hsl(0,72%,51%)]",   hsl: "0 72% 51%" },
  appearance:   { icon: Sparkles,       color: "text-[hsl(330,65%,55%)]", hsl: "330 65% 55%" },
  environment:  { icon: TreePine,       color: "text-[hsl(140,60%,45%)]", hsl: "140 60% 45%" },
  finance:      { icon: Wallet,         color: "text-[hsl(45,90%,50%)]",  hsl: "45 90% 50%" },
  career:       { icon: Briefcase,      color: "text-[hsl(220,70%,55%)]", hsl: "220 70% 55%" },
  growth:       { icon: TrendingUp,     color: "text-[hsl(155,70%,50%)]", hsl: "155 70% 50%" },
  love:         { icon: HeartHandshake, color: "text-[hsl(340,75%,55%)]", hsl: "340 75% 55%" },
  family:       { icon: Home,           color: "text-[hsl(25,80%,55%)]",  hsl: "25 80% 55%" },
  friends:      { icon: Users,          color: "text-[hsl(200,70%,50%)]", hsl: "200 70% 50%" },
  creativity:   { icon: Palette,        color: "text-[hsl(280,60%,60%)]", hsl: "280 60% 60%" },
  lifestyle:    { icon: Sun,            color: "text-[hsl(38,90%,55%)]",  hsl: "38 90% 55%" },
  spirituality: { icon: Flower2,        color: "text-[hsl(270,50%,65%)]", hsl: "270 50% 65%" },
}

export function getAxisIcon(key: AxisKey) {
  return AXIS_META[key]?.icon ?? TrendingUp
}

export function getAxisColor(key: AxisKey) {
  return AXIS_META[key]?.color ?? "text-primary"
}

export function getAxisHsl(key: AxisKey) {
  return AXIS_META[key]?.hsl ?? "155 70% 50%"
}

/* ---------- geometry helpers ---------- */

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

/* ---------- component ---------- */

interface RadarDiagramProps {
  characteristics: Characteristic[]
  size?: number
  highlightAxis?: AxisKey | null
  onAxisTap?: (key: AxisKey) => void
  showLabels?: boolean
  animated?: boolean
}

export function RadarDiagram({
  characteristics,
  size = 300,
  highlightAxis = null,
  onAxisTap,
  showLabels = true,
  animated = false,
}: RadarDiagramProps) {
  const [tooltip, setTooltip] = useState<AxisKey | null>(null)

  const cx = size / 2
  const cy = size / 2
  const maxRadius = size * 0.36
  const labelRadius = size * 0.46
  const levels = 4

  const axes = useMemo(() => {
    return characteristics.map((char, i) => {
      const angle = (360 / 12) * i
      return { ...char, angle }
    })
  }, [characteristics])

  const handleAxisClick = useCallback(
    (key: AxisKey) => {
      if (onAxisTap) onAxisTap(key)
      setTooltip((prev) => (prev === key ? null : key))
    },
    [onAxisTap],
  )

  // Build the filled polygon path
  const dataPoints = axes.map((axis) => {
    const val = axis.current / axis.max
    const r = val * maxRadius
    return polarToCartesian(cx, cy, r, axis.angle)
  })

  const polygonPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + "Z"

  // Highlight axis animation
  const highlightMeta = highlightAxis ? AXIS_META[highlightAxis] : null
  const highlightIdx = highlightAxis ? axes.findIndex((a) => a.key === highlightAxis) : -1
  const highlightPoint = highlightIdx >= 0 ? dataPoints[highlightIdx] : null

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className="overflow-visible"
      >
        <defs>
          <radialGradient id="radar-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(155 70% 50%)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="hsl(155 70% 50%)" stopOpacity="0" />
          </radialGradient>
          <filter id="glow-filter">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {highlightMeta && (
            <filter id="highlight-glow">
              <feGaussianBlur stdDeviation="6" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}
        </defs>

        {/* Background glow */}
        <circle cx={cx} cy={cy} r={maxRadius} fill="url(#radar-glow)" />

        {/* Grid rings */}
        {Array.from({ length: levels }).map((_, i) => {
          const r = ((i + 1) / levels) * maxRadius
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="hsl(230 12% 18%)"
              strokeWidth="1"
              opacity={0.5 + i * 0.1}
            />
          )
        })}

        {/* Axis lines */}
        {axes.map((axis) => {
          const end = polarToCartesian(cx, cy, maxRadius, axis.angle)
          return (
            <line
              key={axis.key}
              x1={cx}
              y1={cy}
              x2={end.x}
              y2={end.y}
              stroke="hsl(230 12% 18%)"
              strokeWidth="1"
              opacity="0.4"
            />
          )
        })}

        {/* Data polygon */}
        <path
          d={polygonPath}
          fill="hsl(155 70% 50% / 0.12)"
          stroke="hsl(155 70% 50%)"
          strokeWidth="2"
          filter="url(#glow-filter)"
          className={animated ? "animate-fade-in" : ""}
        />

        {/* Data points */}
        {dataPoints.map((point, i) => {
          const axis = axes[i]
          const isHighlighted = axis.key === highlightAxis
          const isTooltipped = axis.key === tooltip
          const meta = AXIS_META[axis.key]

          return (
            <g key={axis.key}>
              {/* Clickable area */}
              <circle
                cx={point.x}
                cy={point.y}
                r={12}
                fill="transparent"
                className="cursor-pointer"
                onClick={() => handleAxisClick(axis.key)}
              />

              {/* Dot */}
              <circle
                cx={point.x}
                cy={point.y}
                r={isHighlighted ? 6 : 3.5}
                fill={`hsl(${meta.hsl})`}
                filter={isHighlighted ? "url(#highlight-glow)" : undefined}
                className={isHighlighted ? "animate-pulse-glow" : ""}
              />

              {/* Tooltip */}
              {isTooltipped && (
                <g>
                  <rect
                    x={point.x - 40}
                    y={point.y - 32}
                    width={80}
                    height={22}
                    rx={6}
                    fill="hsl(230 15% 14%)"
                    stroke={`hsl(${meta.hsl} / 0.4)`}
                    strokeWidth="1"
                  />
                  <text
                    x={point.x}
                    y={point.y - 18}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="600"
                    fill={`hsl(${meta.hsl})`}
                  >
                    {axis.name} Lv.{axis.current}
                  </text>
                </g>
              )}
            </g>
          )
        })}
      </svg>

      {/* Labels around the diagram */}
      {showLabels &&
        axes.map((axis) => {
          const pos = polarToCartesian(cx, cy, labelRadius, axis.angle)
          const meta = AXIS_META[axis.key]
          const Icon = meta.icon
          const isHighlighted = axis.key === highlightAxis

          return (
            <button
              key={axis.key}
              className={`absolute flex flex-col items-center gap-0.5 transition-all ${
                isHighlighted ? "scale-110" : "opacity-70 hover:opacity-100"
              }`}
              style={{
                left: pos.x,
                top: pos.y,
                transform: "translate(-50%, -50%)",
              }}
              onClick={() => handleAxisClick(axis.key)}
            >
              <Icon className={`h-3.5 w-3.5 ${meta.color} ${isHighlighted ? "animate-pulse-glow" : ""}`} />
              <span className={`text-[8px] font-semibold leading-none ${isHighlighted ? meta.color : "text-muted-foreground"}`}>
                {axis.name}
              </span>
            </button>
          )
        })}
    </div>
  )
}
