import { TenderSkeleton } from "@/components/Skeleton";
export default function Loading() {
  return <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4"><div className="hidden md:block card h-96" /><div className="space-y-2">{[0, 1, 2, 3].map((i) => <TenderSkeleton key={i} />)}</div></div>;
}
