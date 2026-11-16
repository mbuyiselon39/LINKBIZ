import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-4">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="h-9 w-9 rounded-[4px] bg-action text-white flex items-center justify-center font-extrabold text-xl leading-none">lb</div>
          <span className="font-extrabold text-action text-2xl tracking-tight">LinkBiz</span>
        </Link>
      </header>
      <div className="flex-1 flex items-start justify-center px-4 pb-12">{children}</div>
    </div>
  );
}
