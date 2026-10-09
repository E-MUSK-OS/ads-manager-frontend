import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-text-main flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-primary tracking-tight">404</h1>
          <h2 className="text-2xl font-semibold tracking-tight">Page not found</h2>
          <p className="text-slate-500 font-mono text-sm bg-slate-50 p-3 rounded-lg border border-slate-100 mt-4">
            The requested resource could not be found.
          </p>
        </div>
        <Link 
          href="/" 
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary hover:bg-primary/90 transition-colors shadow-sm w-full sm:w-auto"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
