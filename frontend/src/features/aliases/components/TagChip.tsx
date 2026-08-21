import type { Tag } from "@/types/tag";

interface TagChipProps {
  tag: Tag;
  onRemove?: () => void;
  size?: "sm" | "md";
}

/**
 * Pill rendering for a single tag. Uses inline style for the color so the
 * chip matches whatever hex/hsl the backend stored (always light pastels,
 * so dark text reads well).
 */
export function TagChip({ tag, onRemove, size = "md" }: TagChipProps) {
  const isSm = size === "sm";
  const padding = isSm ? "px-2 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium tracking-wide ring-1 ring-inset ring-black/5 ${padding}`}
      style={{
        backgroundColor: tag.color,
        color: "#27272a",
      }}
    >
      <span>{tag.name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="-mr-0.5 ml-0.5 rounded-full p-0.5 transition-colors hover:bg-black/10"
          aria-label={`Remove ${tag.name}`}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2 2L8 8M8 2L2 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </span>
  );
}
