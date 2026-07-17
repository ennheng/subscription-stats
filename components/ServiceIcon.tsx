import { brandIconFor } from "./brand-icons";

interface Props {
  /** Preset id for brand lookup; undefined = custom subscription. */
  presetId?: string;
  /** Display name, used for the fallback letter tile. */
  name: string;
  /** Brand color (hex) for fallback tile background. */
  color?: string;
  /** Tailwind size classes, e.g. "h-12 w-12 text-xl". */
  className?: string;
}

/** Renders a real brand SVG when available, otherwise a colored letter tile. */
export function ServiceIcon({ presetId, name, color, className = "" }: Props) {
  const brand = presetId ? brandIconFor(presetId) : undefined;

  if (brand?.kind === "image") {
    return (
      <span
        className={`flex items-center justify-center overflow-hidden rounded-xl bg-cover bg-center ${className}`}
        style={{ backgroundImage: `url("${brand.src}")` }}
        aria-hidden="true"
      />
    );
  }

  if (brand?.kind === "svg") {
    return (
      <span
        className={`flex items-center justify-center rounded-xl ${className}`}
        style={{ backgroundColor: `#${brand.hex}` }}
      >
        <svg viewBox="0 0 24 24" className="h-3/5 w-3/5 fill-white" aria-hidden="true">
          <path d={brand.path} />
        </svg>
      </span>
    );
  }

  const initial = Array.from(name.trim())[0]?.toUpperCase() ?? "?";
  return (
    <span
      className={`flex items-center justify-center rounded-xl font-semibold text-white ${className}`}
      style={{ backgroundColor: color ?? "#737373" }}
    >
      {initial}
    </span>
  );
}
