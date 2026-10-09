import { useMemo, useState, type ComponentType } from 'react';
import { Activity, CheckCircle2, LogOut, RefreshCw, Search, Shield, UserRound, WifiOff } from 'lucide-react';
import { api } from './api';

type UserRow = { id: string; email: string; name: string; lastSeen: number };
type UserDetail = {
  id: string;
  email: string;
  name: string;
  lastSeen: number;
  platforms: { TikTok: boolean; YouTube: boolean; Twitch: boolean };
  channels: { TikTok: string; YouTube: string; Twitch: string };
  beatSaber: { paired: boolean; connected: boolean; lastSeen: number; modVersion: string; gameVersion: string };
  chatLanguage: string;
  translationEnabled: boolean;
  blockedWordCount: number;
};

function formatTime(value: number) {
  return value ? new Date(value).toLocaleString() : 'Never';
}

export default function DeveloperDashboard() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [selected, setSelected] = useState<UserDetail | null>(null);
  const [query, setQuery] = useState('');
  const [, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const filteredUsers = useMemo(
    () => users.filter(item => !query.trim() || (item.email + ' ' + item.name + ' ' + item.id).toLowerCase().includes(query.toLowerCase())),
    [users, query]
  );

  async function loadOverview() {
    setLoading(true);
    try {
      const { data } = await api.get('/api/admin/overview');
      setAuthenticated(true);
      setUsers(Array.isArray(data?.users) ? data.users : []);
      setMessage('');
    } catch (error) {
      setAuthenticated(false);
      setUsers([]);
      setSelected(null);
      setMessage(error instanceof Error ? error.message : 'Admin authentication required.');
    } finally {
      setLoading(false);
    }
  }

  async function signIn() {
    setBusy(true);
    setMessage('');
    try {
      await api.post('/api/admin/login', { username, password });
      setPassword('');
      await loadOverview();
    } catch (error) {
      setPassword('');
      setMessage(error instanceof Error ? error.message : 'Invalid admin credentials.');
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await api.post('/api/admin/logout').catch(() => undefined);
    setAuthenticated(false);
    setUsername('');
    setPassword('');
    setUsers([]);
    setSelected(null);
  }

  async function openUser(id: string) {
    try {
      const { data } = await api.get('/api/admin/users/' + encodeURIComponent(id));
      setSelected(data?.user || null);
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load that account.');
    }
  }

  async function performAction(path: string, success: string) {
    try {
      await api.post(path);
      setMessage(success);
      if (selected) await openUser(selected.id);
      await loadOverview();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The action could not be completed.');
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 grid place-items-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300"><Shield size={24} /></div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">StreamVoice Admin</div>
          <h1 className="mt-2 text-3xl font-semibold">Private admin dashboard</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">Use the admin username and password stored in AppDeploy Secrets. This admin site has no StreamVoice account sign-up or login.</p>
          {message && <div className="mt-5 rounded-xl border border-rose-400/20 bg-rose-400/5 p-3 text-sm text-rose-200">{message}</div>}
          <div className="mt-6 space-y-3">
            <input value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" placeholder="Admin username" className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-300/40" />
            <input value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') void signIn(); }} type="password" autoComplete="current-password" placeholder="Admin password" className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-300/40" />
            <button disabled={busy || !username || !password} onClick={() => void signIn()} className="w-full rounded-xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50">{busy ? 'Signing in…' : 'Admin Log In'}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300"><Shield size={15} /> StreamVoice Admin</div><h1 className="mt-1 text-xl font-semibold">Admin Dashboard</h1></div>
          <button onClick={() => void signOut()} className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-300" title="Log out"><LogOut size={17} /></button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        {message && <div className="rounded-2xl border border-white/10 bg-slate-900 p-4 text-sm text-slate-300">{message}</div>}
        <section className="grid gap-4 md:grid-cols-4">
          {([
            { label: 'Accounts', value: String(users.length), Icon: UserRound },
            { label: 'Profile directory', value: users.length ? 'Online' : 'Waiting', Icon: Activity },
            { label: 'Admin authentication', value: 'Secrets only', Icon: Shield },
            { label: 'Admin session', value: 'Protected', Icon: CheckCircle2 },
          ] satisfies { label: string; value: string; Icon: ComponentType<{ size?: number; className?: string }> }[]).map(({ label, value, Icon }) => <div key={label} className="rounded-3xl border border-white/10 bg-slate-900 p-5"><Icon size={18} className="text-cyan-300" /><div className="mt-4 text-xs text-slate-500">{label}</div><div className="mt-1 text-lg font-semibold">{value}</div></div>)}
        </section>
        <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-slate-900 p-5">
            <div className="flex items-center justify-between"><div><h2 className="font-semibold">User accounts</h2><p className="text-sm text-slate-500">Search the StreamVoice profile directory.</p></div><button onClick={() => void loadOverview()} className="rounded-xl border border-white/10 bg-white/5 p-2.5"><RefreshCw size={16} /></button></div>
            <div className="relative mt-4"><Search className="absolute left-3 top-3 text-slate-500" size={16} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search email, username, or user ID" className="w-full rounded-xl border border-white/10 bg-slate-950 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-cyan-300/40" /></div>
            <div className="mt-4 space-y-2">{filteredUsers.map(item => <button key={item.id} onClick={() => void openUser(item.id)} className="w-full rounded-2xl border border-white/5 bg-white/5 p-3 text-left hover:border-cyan-300/20"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><div className="truncate text-sm font-medium">{item.name || 'Unnamed creator'}</div><div className="truncate text-xs text-slate-500">{item.email || item.id}</div></div><span className="shrink-0 text-[11px] text-slate-500">{formatTime(item.lastSeen)}</span></div></button>)}{!filteredUsers.length && <div className="py-10 text-center text-sm text-slate-500">No matching profiles have been recorded yet.</div>}</div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-900 p-5">
            {!selected ? <div className="grid min-h-[360px] place-items-center text-center"><div><UserRound className="mx-auto text-slate-600" size={32} /><h2 className="mt-4 font-semibold">Select an account</h2><p className="mt-1 text-sm text-slate-500">Choose a user to inspect connection and Beat Saber diagnostics.</p></div></div> : <div>
              <div className="flex items-start justify-between gap-4"><div><div className="text-xs uppercase tracking-[0.15em] text-cyan-300">Account diagnostics</div><h2 className="mt-1 text-xl font-semibold">{selected.name || 'Unnamed creator'}</h2><p className="text-sm text-slate-500">{selected.email || selected.id}</p></div><button onClick={() => setSelected(null)} className="text-xs text-slate-500">Close</button></div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {(['TikTok', 'YouTube', 'Twitch'] as const).map(platform => <div key={platform} className="rounded-2xl bg-white/5 p-4"><div className="flex items-center justify-between"><span className="text-sm font-medium">{platform}</span>{selected.platforms[platform] ? <CheckCircle2 className="text-emerald-300" size={16} /> : <WifiOff className="text-slate-600" size={16} />}</div><div className="mt-1 truncate text-xs text-slate-500">{selected.channels[platform]}</div>{selected.platforms[platform] && <button onClick={() => void performAction('/api/admin/users/' + encodeURIComponent(selected.id) + '/disconnect/' + platform.toLowerCase(), platform + ' disconnected.')} className="mt-3 text-xs text-rose-300">Disconnect</button>}</div>)}
                <div className="rounded-2xl bg-white/5 p-4"><div className="flex items-center justify-between"><span className="text-sm font-medium">Beat Saber</span>{selected.beatSaber.connected ? <CheckCircle2 className="text-emerald-300" size={16} /> : <WifiOff className="text-slate-600" size={16} />}</div><div className="mt-1 text-xs text-slate-500">{selected.beatSaber.paired ? 'Paired' : 'Not paired'} · mod {selected.beatSaber.modVersion || 'unknown'}</div>{selected.beatSaber.paired && <button onClick={() => void performAction('/api/admin/users/' + encodeURIComponent(selected.id) + '/unpair-beatsaber', 'Beat Saber pairing removed.')} className="mt-3 text-xs text-rose-300">Unpair</button>}</div>
                <div className="rounded-2xl bg-white/5 p-4"><div className="text-sm font-medium">Translation</div><div className="mt-1 text-xs text-slate-500">{selected.translationEnabled ? 'Enabled' : 'Disabled'} · {selected.chatLanguage}</div><div className="mt-1 text-xs text-slate-600">{selected.blockedWordCount} blocked words</div></div>
              </div>
            </div>}
          </div>
        </section>
      </main>
    </div>
  );
}
