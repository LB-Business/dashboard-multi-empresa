import type { ReactNode } from "react";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[480px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-7 flex items-center gap-4">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] shadow-xl shadow-black/30">
              <span className="bg-gradient-to-br from-sky-400 via-blue-500 to-violet-600 bg-clip-text text-3xl font-black tracking-tighter text-transparent">
                LB
              </span>

              <div className="absolute bottom-3 right-3 flex items-end gap-0.5 opacity-80">
                <span className="h-1.5 w-1 rounded-sm bg-violet-500" />
                <span className="h-2.5 w-1 rounded-sm bg-violet-500" />
                <span className="h-4 w-1 rounded-sm bg-violet-500" />
              </div>
            </div>

            <div className="text-left">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                <span className="bg-gradient-to-r from-sky-400 via-blue-500 to-violet-600 bg-clip-text font-bold text-transparent">
                  LB
                </span>{" "}
                Business
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Dashboard multiempresas
              </p>
            </div>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-2 text-base text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {children}
      </div>
    </div>
  );
}