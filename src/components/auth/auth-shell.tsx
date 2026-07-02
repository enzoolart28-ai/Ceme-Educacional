import Image from "next/image";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
            <Image
              src="/logo.png"
              alt="CEME Educacional"
              width={220}
              height={143}
              priority
              className="h-16 w-auto"
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {children}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Sistema CEME Educacional &middot; Acesso restrito
        </p>
      </div>
    </main>
  );
}
