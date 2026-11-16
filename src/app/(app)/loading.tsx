import { PostSkeleton, IdentitySkeleton, WidgetSkeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[225px_minmax(0,1fr)] lg:grid-cols-[225px_minmax(0,555px)_300px] gap-6 justify-center items-start">
      <aside className="hidden md:block"><IdentitySkeleton /></aside>
      <section className="space-y-2"><div className="card h-[108px]" /><PostSkeleton /><PostSkeleton /></section>
      <aside className="hidden lg:block"><WidgetSkeleton /></aside>
    </div>
  );
}
