import { BadgeCheck } from "lucide-react";

export function VerifiedBadge({ size = 16, label = false }: { size?: number; label?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 text-action" title="Verified Business">
      <BadgeCheck size={size} className="fill-action text-white" />
      {label && <span className="text-xs font-semibold">Verified Business</span>}
    </span>
  );
}
