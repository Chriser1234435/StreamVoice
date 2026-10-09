import { Database, Server, ShieldCheck } from 'lucide-react';

type InfrastructureStatusProps = {
  apiHost: string;
  apiService: string;
  databaseService: string;
};

export default function InfrastructureStatus({ apiHost, apiService, databaseService }: InfrastructureStatusProps) {
  return (
    <section className="mb-8 rounded-3xl border border-white/10 bg-slate-900 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">Infrastructure</p>
          <h2 className="mt-1 text-lg font-semibold">StreamVoice backend services</h2>
          <p className="mt-1 text-sm text-slate-400">Migration is in progress. A configured hostname does not confirm that API routes or database persistence are working.</p>
        </div>
        <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-3 text-amber-300"><ShieldCheck size={20} /></div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-slate-950 p-4"><div className="flex items-center gap-2 text-sm font-medium"><Server size={16} className="text-cyan-300" /> Railway API</div><div className="mt-2 text-xs text-amber-300">Health route only — application routes incomplete</div><div className="mt-1 break-all text-xs text-slate-500">{apiService} · {apiHost}</div></div>
        <div className="rounded-2xl border border-white/10 bg-slate-950 p-4"><div className="flex items-center gap-2 text-sm font-medium"><Database size={16} className="text-cyan-300" /> PostgreSQL</div><div className="mt-2 text-xs text-amber-300">Not yet connected to the live API</div><div className="mt-1 text-xs text-slate-500">{databaseService}</div></div>
        <div className="rounded-2xl border border-white/10 bg-slate-950 p-4"><div className="text-sm font-medium">Architecture</div><div className="mt-2 text-xs text-slate-300">Migration in progress</div><div className="mt-1 text-xs text-slate-500">Routes and persistence must be tested before marking ready</div></div>
      </div>
    </section>
  );
}
