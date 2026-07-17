"use client";

import { useState } from "react";
import { ServiceIcon } from "../components/ServiceIcon";
import { findPresetByName } from "../lib/presets";
import { formatYuan, type SpendingRow } from "../lib/subscriptions";

interface Props {
  totalAnnualCents: number;
  rows: SpendingRow[];
  percents: number[];
}

const SLICE_COLORS = [
  "#ea580c", // orange
  "#0ea5e9", // sky
  "#8b5cf6", // violet
  "#10b981", // emerald
  "#f43f5e", // rose
  "#f59e0b", // amber
  "#6366f1", // indigo
  "#14b8a6", // teal
];

const R = 70; // pie radius
const ICON_R = 46; // icon circle radius inside pie
const LEADER_R = 88; // where the leader line elbow sits
const LABEL_X = 88; // keep labels inside narrow viewports
const C = 110; // center of the 220 viewBox

function polar(angle: number, radius: number) {
  return { x: C + radius * Math.cos(angle), y: C + radius * Math.sin(angle) };
}

function slicePath(start: number, end: number) {
  const large = end - start > Math.PI ? 1 : 0;
  const p0 = polar(start, R);
  const p1 = polar(end, R);
  return `M ${C} ${C} L ${p0.x} ${p0.y} A ${R} ${R} 0 ${large} 1 ${p1.x} ${p1.y} Z`;
}

function PieChart({ rows, percents }: { rows: SpendingRow[]; percents: number[] }) {
  const spans = percents.map((p) => p * Math.PI * 2);
  const starts: number[] = [];
  spans.reduce((acc, span) => {
    starts.push(acc);
    return acc + span;
  }, -Math.PI / 2); // start at top

  const slices = rows.map((row, i) => {
    const start = starts[i];
    const end = start + spans[i];
    return { row, i, start, end, mid: (start + end) / 2, span: spans[i] };
  });

  // Spread each side's labels vertically so they never overlap.
  const MIN_GAP = 16;
  const labelYByIndex = new Map<number, number>();
  for (const side of [1, -1] as const) {
    const group = slices
      .map((s, idx) => ({ idx, y: polar(s.mid, LEADER_R).y }))
      .filter((g) => (polar(slices[g.idx].mid, LEADER_R).x >= C ? 1 : -1) === side)
      .sort((a, b) => a.y - b.y);
    let prevY = -Infinity;
    for (const g of group) {
      const y = Math.max(g.y, prevY + MIN_GAP);
      labelYByIndex.set(g.idx, y);
      prevY = y;
    }
  }

  return (
    <div className="mt-4 flex justify-center rounded-2xl bg-white/30 py-2 ring-1 ring-white/55">
      <svg viewBox="0 0 220 220" className="h-60 w-60 overflow-visible sm:h-64 sm:w-64">
        {slices.map(({ row, i, start, end, mid, span }, idx) => {
          const color = SLICE_COLORS[i % SLICE_COLORS.length];
          const edge = polar(mid, R);
          const elbow = polar(mid, LEADER_R);
          const iconPos = polar(mid, Math.min(ICON_R, R * 0.6));
          const showIcon = span > 0.5; // hide icon on slivers
          const side = elbow.x >= C ? 1 : -1;
          const labelX = C + side * LABEL_X;
          const labelY = labelYByIndex.get(idx) ?? elbow.y;
          return (
            <g key={row.subscriptionId}>
              <path d={slicePath(start, end)} fill={color} opacity={0.85} stroke="#fff" strokeWidth={1.5} />
              {/* Keep the label-facing segment horizontal after vertical de-overlap. */}
              <polyline
                points={`${edge.x},${edge.y} ${elbow.x},${labelY} ${labelX},${labelY}`}
                fill="none"
                stroke={color}
                strokeWidth={1.25}
                opacity={0.7}
              />
              <circle cx={labelX} cy={labelY} r={2} fill={color} />
              <text
                x={labelX + side * 4}
                y={labelY + 4}
                textAnchor={side > 0 ? "start" : "end"}
                className="fill-stone-700"
                fontSize={10}
                fontWeight={600}
              >
                {row.name} {Math.round(percents[i] * 100)}%
              </text>
              {showIcon && (
                <foreignObject x={iconPos.x - 12} y={iconPos.y - 12} width={24} height={24}>
                  <div className="flex h-6 w-6 items-center justify-center">
                    <SliceIcon name={row.name} />
                  </div>
                </foreignObject>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function SliceIcon({ name }: { name: string }) {
  const preset = findPresetByName(name);
  return (
    <ServiceIcon
      presetId={preset?.id}
      name={name}
      color={preset?.color}
      className="h-5 w-5 text-[10px] ring-2 ring-white"
    />
  );
}

function BarGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <rect x="3" y="10" width="4" height="9" rx="1" />
      <rect x="10" y="4" width="4" height="15" rx="1" />
      <rect x="17" y="13" width="4" height="6" rx="1" />
    </svg>
  );
}

function PieGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M12 3a9 9 0 1 0 9 9h-9V3z" opacity={0.55} />
      <path d="M14 2.2A9 9 0 0 1 21.8 10H14V2.2z" />
    </svg>
  );
}

export function SpendingChart({ totalAnnualCents, rows, percents }: Props) {
  const [mode, setMode] = useState<"bar" | "pie">("bar");

  return (
    <section data-testid="spending-chart" className="glass-strong mt-5 rounded-[28px] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-stone-900">支出构成</h2>
          <p className="mt-0.5 text-xs text-stone-400">按当前订阅折算年度占比</p>
        </div>
        <div className="flex items-center gap-3.5">
          <div className="text-right">
            <p className="text-[11px] text-stone-400">预计年支出</p>
            <p className="text-lg font-semibold tracking-[-0.03em] text-stone-900">
              {formatYuan(totalAnnualCents)}
            </p>
          </div>
          <div className="flex rounded-full border border-white/75 bg-white/55 p-0.5 shadow-sm backdrop-blur-xl">
            {(["bar", "pie"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                title={m === "bar" ? "条状图" : "饼状图"}
                aria-label={m === "bar" ? "条状图" : "饼状图"}
                className={`flex h-7 w-7 items-center justify-center rounded-full transition-all ${
                  mode === m
                    ? "bg-orange-600 text-white shadow-sm"
                    : "text-stone-400 hover:bg-white/60 hover:text-stone-700"
                }`}
              >
                {m === "bar" ? <BarGlyph /> : <PieGlyph />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {mode === "pie" ? (
        <PieChart rows={rows} percents={percents} />
      ) : (
        <ul className="mt-5 space-y-3.5 rounded-2xl bg-white/24 p-3 ring-1 ring-white/45 sm:p-4">
          {rows.map((row, i) => {
            const pct = Math.round(percents[i] * 100);
            const preset = findPresetByName(row.name);
            return (
              <li key={row.subscriptionId} className="flex items-center gap-3 text-sm">
                <ServiceIcon
                  presetId={preset?.id}
                  name={row.name}
                  color={preset?.color}
                  className="h-8 w-8 shrink-0 text-xs shadow-sm ring-1 ring-white/60"
                />
                <span className="w-24 truncate font-medium text-stone-600">{row.name}</span>
                <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-stone-200/55 shadow-inner">
                  <span
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: SLICE_COLORS[i % SLICE_COLORS.length],
                    }}
                  />
                </span>
                <span className="w-16 text-right tabular-nums font-semibold text-stone-800">
                  {formatYuan(row.annualCents)}
                </span>
                <span className="w-10 text-right tabular-nums text-stone-400">{pct}%</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
