import Link from "next/link";
export default function NotFound() {
  return <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center p-6"><h1 className="text-3xl font-semibold text-action">Page not found</h1><p className="text-muted">The company or tender you&apos;re looking for doesn&apos;t exist.</p><Link href="/" className="btn-primary">Back to LinkBiz</Link></div>;
}
