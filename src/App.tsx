import { useEffect, useMemo, useRef, useState } from 'react';
import { Activity, Bell, CheckCircle2, CircleAlert, ChevronDown, Download, Gamepad2, Headphones, Home, KeyRound, LayoutDashboard, Link2, Mail, Monitor, Music2, Play, Radio, ShieldCheck, SlidersHorizontal, Trash2, Upload, UserCircle2, Volume2, Wifi, Youtube } from 'lucide-react';
import { api } from './api';
import DeveloperDashboard from './DeveloperDashboard';
import InfrastructureStatus from './InfrastructureStatus';

type Platform = 'TikTok' | 'YouTube' | 'Twitch';
type SoundConfig = { gift: string; follow: string; live: string };
type PlatformState = { connected: boolean; live: boolean; channel: string };
type ChatMessage = { id: string; author: string; text: string; type: string; platform?: Platform };
type BsrRequest = { id: string; code: string; viewer: string; source: string; song?: string; artist?: string; createdAt: number };

type Page = 'home' | 'downloads' | 'console' | 'account' | 'settings' | 'admin' | 'terms' | 'privacy';

type InfrastructureConfig = { apiHost: string; apiService: string; databaseService: string };

const initialSounds: Record<Platform, SoundConfig> = {
  TikTok: { gift: 'Soft chime', follow: 'Warm bell', live: 'Broadcast ready' },
  YouTube: { gift: 'Not used', follow: 'Bright ping', live: 'Broadcast ready' },
  Twitch: { gift: 'Not used', follow: 'Soft pulse', live: 'Broadcast ready' },
};


function LegalFooter({ onNavigate }: { onNavigate: (page: 'home' | 'downloads' | 'console' | 'account' | 'settings' | 'terms' | 'privacy') => void }) {
  return (
    <footer className="border-t border-white/10 bg-slate-950/95">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <div>© 2026 StreamVoice. Streaming tools for creators.</div>
        <div className="flex flex-wrap gap-4">
          <button onClick={() => onNavigate('terms')} className="text-slate-300 underline underline-offset-2 hover:text-cyan-200">Terms of Service</button>
          <button onClick={() => onNavigate('privacy')} className="text-slate-300 underline underline-offset-2 hover:text-cyan-200">Privacy Policy</button>
        </div>
      </div>
    </footer>
  );
}

 
function getApiErrorMessage(error: unknown, fallback: string) {
  const candidate = error as any;
  const response = candidate?.response?.data;
  const message = String(response?.message || response?.error || candidate?.message || '').trim();
  const code = String(response?.errorCode || '').trim();
  if (message) return message;
  if (code) return 'StreamVoice could not complete the request (' + code + '). Please try again.';
  return fallback;
}

function AccountPage({ onAuthenticated }: { onAuthenticated: () => void }) {
  // Login is deliberately the first screen for every unauthenticated arrival.
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [languages, setLanguages] = useState<{ code: string; label: string }[]>([{ code: 'en', label: 'English' }]);
  const [errorMessage, setErrorMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/api/languages').then(({ data }) => {
      if (Array.isArray(data?.languages)) setLanguages(data.languages);
    }).catch(() => undefined);
  }, []);

  async function submit() {
    setErrorMessage('');
    if (mode === 'signup' && password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const endpoint = mode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
      const payload = mode === 'signup'
        ? { email, username, password, preferredLanguage }
        : { identifier: username, password };
      await Promise.race([
        api.post(endpoint, payload),
        new Promise<never>((_, reject) => window.setTimeout(() => reject(Object.assign(new Error('The save request timed out. Please try again.'), { code: 'SV-AUTH-021' })), 12000)),
      ]);
      const sessionResult = await Promise.race([
        api.get('/api/auth/me'),
        new Promise<never>((_, reject) => window.setTimeout(() => reject(Object.assign(new Error('The saved login could not be verified. Please try again.'), { code: 'SV-AUTH-020' })), 8000)),
      ]);
      if (!sessionResult?.data?.user?.username) {
        throw Object.assign(new Error('The account was saved, but the login session could not be verified.'), { code: 'SV-AUTH-020' });
      }
      onAuthenticated();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, mode === 'signup' ? 'StreamVoice could not create the account. Please check the form and try again.' : 'StreamVoice could not log you in. Check your username or email and password and try again.'));
    } finally {
      setBusy(false);
    }
  }

  return <div className="min-h-screen bg-slate-950 text-slate-100">
    <div className="mx-auto flex min-h-screen max-w-lg items-center px-5 py-10">
      <div className="w-full rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl sm:p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-300 text-xl font-black text-slate-950">SV</div>
          <h1 className="text-3xl font-bold">{mode === 'signup' ? 'Create your StreamVoice account' : 'Welcome back'}</h1>
          <p className="mt-2 text-sm text-slate-400">{mode === 'signup' ? 'Create your account and choose your default translation language.' : 'Log in to open your Streamer Console.'}</p>
        </div>
        {errorMessage && <div className="mb-4 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{errorMessage}</div>}
        <div className="space-y-4">
          {mode === 'signup' && <label className="block"><span className="mb-2 block text-sm text-slate-300">Email address</span><input value={email} onChange={e => setEmail(e.target.value)} type="email" autoComplete="email" placeholder="you@example.com" className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-300/50" /></label>}
          <label className="block"><span className="mb-2 block text-sm text-slate-300">{mode === 'signup' ? 'Username' : 'Username or email'}</span><input value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" placeholder={mode === 'signup' ? 'Choose a username' : 'Your username or email'} className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-300/50" /></label>
          <label className="block"><span className="mb-2 block text-sm text-slate-300">Password</span><input value={password} onChange={e => setPassword(e.target.value)} type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} placeholder="••••••••" className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-300/50" /></label>
          {mode === 'signup' && <>
            <label className="block"><span className="mb-2 block text-sm text-slate-300">Re-enter password</span><input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} type="password" autoComplete="new-password" placeholder="••••••••" className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-300/50" /></label>
            <label className="block"><span className="mb-2 block text-sm text-slate-300">Preferred language</span><select value={preferredLanguage} onChange={e => setPreferredLanguage(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none">{languages.map(language => <option key={language.code} value={language.code}>{language.label}</option>)}</select><span className="mt-2 block text-xs text-slate-500">Used as your default language for automatic chat translation.</span></label>
          </>}
        </div>
        <button disabled={busy} onClick={() => void submit()} className="mt-6 w-full rounded-xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50">{busy ? (mode === 'signup' ? 'Saving account…' : 'Saving login…') : mode === 'signup' ? 'Create Account' : 'Log In'}</button>
        <div className="mt-6 text-center text-sm text-slate-400">{mode === 'signup' ? 'Already have an account?' : 'New to StreamVoice?'} <button onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setErrorMessage(''); }} className="font-semibold text-cyan-300 hover:text-cyan-200">{mode === 'signup' ? 'Log in' : 'Create an account'}</button></div>
        <button onClick={() => { window.history.pushState({}, '', ''); window.dispatchEvent(new PopStateEvent('popstate')); }} className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">Back</button>
      </div>
    </div>
  </div>;
}

function AccountSettingsPage({ viewerName, onDeleted, onNavigate }: { viewerName: string; onDeleted: () => void; onNavigate: (page: Page) => void }) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState(viewerName);
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [languages, setLanguages] = useState<{ code: string; label: string }[]>([{ code: 'en', label: 'English' }]);

  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordCurrent, setPasswordCurrent] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/api/account/settings').then(async ({ data }) => {
      const account = data;
      if (!account?.email) throw new Error('SV-SET-012: Account settings could not be loaded.');
      const accountEmail = String(account.email || '');
      setEmail(accountEmail);
      setUsername(String(account.username || viewerName));
      setNewEmail(accountEmail);
      setPreferredLanguage(String(account.preferredLanguage || 'en'));
      const languageResult = await api.get('/api/languages');
      if (Array.isArray(languageResult.data?.languages)) setLanguages(languageResult.data.languages);
    }).catch(error => {
      const e = error as any;
      const code = String(e?.response?.data?.errorCode || e?.code || 'SV-SET-012');
      const message = String(e?.response?.data?.message || e?.message || 'Could not load account settings.');
      setErrorMessage(code + ': ' + message);
    });
  }, [viewerName]);

  async function changeEmail() {
    setMessage(''); setErrorMessage(''); setBusy(true);
    try {
      const { data } = await api.post('/api/account/email', { email: newEmail, currentPassword: emailPassword });
      setEmail(String(data?.email || newEmail)); setEmailPassword(''); setMessage('Email updated successfully.');
    } catch (error) { const e = error as any; setErrorMessage(String(e?.response?.data?.errorCode || e?.code || 'SV-SET-099') + ': ' + String(e?.response?.data?.message || e?.message || 'Could not update your email.')); }
    finally { setBusy(false); }
  }

  async function savePreferences() {
    setMessage(''); setErrorMessage(''); setBusy(true);
    try {
      await api.post('/api/account/preferences', { preferredLanguage });
      setMessage('Account preferences saved successfully.');
    } catch (error) {
      const e = error as any;
      setErrorMessage(String(e?.response?.data?.errorCode || e?.code || 'SV-SET-016') + ': ' + String(e?.response?.data?.message || e?.message || 'Could not save account preferences.'));
    } finally { setBusy(false); }
  }

  async function changePassword() {
    setMessage(''); setErrorMessage('');
    if (newPassword !== confirmPassword) { setErrorMessage('New passwords do not match.'); return; }
    setBusy(true);
    try {
      await api.post('/api/account/password', { currentPassword: passwordCurrent, newPassword, confirmPassword });
      setPasswordCurrent(''); setNewPassword(''); setConfirmPassword(''); setMessage('Password updated successfully.');
    } catch (error) { const e = error as any; setErrorMessage(String(e?.response?.data?.errorCode || e?.code || 'SV-SET-099') + ': ' + String(e?.response?.data?.message || e?.message || 'Could not update your password.')); }
    finally { setBusy(false); }
  }

  async function deleteAccount() {
    setMessage(''); setErrorMessage(''); setBusy(true);
    try {
      await api.post('/api/account/delete', { currentPassword: deletePassword, confirmation: deleteConfirmation });
      onDeleted();
    } catch (error) { const e = error as any; setErrorMessage(String(e?.response?.data?.errorCode || e?.code || 'SV-SET-099') + ': ' + String(e?.response?.data?.message || e?.message || 'Could not delete your account.')); setBusy(false); }
  }

  return <div className="min-h-screen bg-slate-950 text-slate-100">
    <header className="border-b border-white/10 bg-slate-950/95 backdrop-blur"><div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-4"><button onClick={() => onNavigate('console')} className="flex items-center gap-3 text-left"><div className="rounded-2xl bg-cyan-400/15 p-2.5 text-cyan-300"><Radio size={22} /></div><div><div className="text-lg font-semibold">StreamVoice</div><div className="text-xs text-slate-400">Account settings</div></div></button><button onClick={() => onNavigate('console')} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">Back to Console</button></div></header>
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8"><p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Account</p><h1 className="mt-2 text-4xl font-bold tracking-tight">Account Settings</h1><p className="mt-3 text-slate-400">Manage the StreamVoice account you use for your console and platform connections.</p></div>
      {message && <div className="mb-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">{message}</div>}
      {errorMessage && <div className="mb-5 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{errorMessage}</div>}
      <section className="rounded-3xl border border-white/10 bg-slate-900 p-6 sm:p-8">
        <div className="flex items-center gap-3"><UserCircle2 className="text-cyan-300" /><div><h2 className="font-semibold">Account information</h2><p className="text-sm text-slate-400">Your StreamVoice identity.</p></div></div>
        <div className="mt-6 space-y-5">
          <div><label className="mb-2 block text-sm text-slate-300">Email address</label><div className="flex flex-col gap-2 sm:flex-row"><input value={email} readOnly className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-200" /><button onClick={() => setNewEmail(email)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">Edit email</button></div><p className="mt-2 text-xs text-slate-500">This is the email address you used to create your StreamVoice account.</p></div>
          <div><label className="mb-2 block text-sm text-slate-300">Username</label><input value={username} readOnly className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-slate-400" /><p className="mt-2 text-xs text-slate-500">Your username cannot be changed.</p></div>
          <div><label className="mb-2 block text-sm text-slate-300">Password</label><div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950 px-4 py-3"><span className="tracking-[0.3em] text-slate-300">••••••••</span><span className="text-xs text-slate-500">Hidden for security</span></div></div>
        </div>
      </section>
      <section className="mt-6 rounded-3xl border border-white/10 bg-slate-900 p-6 sm:p-8"><div className="flex items-center gap-3"><Mail className="text-cyan-300" /><div><h2 className="font-semibold">Change email</h2><p className="text-sm text-slate-400">Verify your current password before changing your sign-in email.</p></div></div><div className="mt-5 grid gap-3"><input value={newEmail} onChange={e => setNewEmail(e.target.value)} type="email" placeholder="New email address" className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-300/50" /><input value={emailPassword} onChange={e => setEmailPassword(e.target.value)} type="password" placeholder="Current password" className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-300/50" /><button disabled={busy} onClick={() => void changeEmail()} className="rounded-xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50">Save new email</button></div></section>
      <section className="mt-6 rounded-3xl border border-white/10 bg-slate-900 p-6 sm:p-8"><div className="flex items-center gap-3"><SlidersHorizontal className="text-cyan-300" /><div><h2 className="font-semibold">Account preferences</h2><p className="text-sm text-slate-400">These preferences are saved to your StreamVoice account and restored when you return.</p></div></div><div className="mt-5 grid gap-3"><label className="block"><span className="mb-2 block text-sm text-slate-300">Preferred language</span><select value={preferredLanguage} onChange={e => setPreferredLanguage(e.target.value)} className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none">{languages.map(language => <option key={language.code} value={language.code}>{language.label}</option>)}</select></label><button disabled={busy} onClick={() => void savePreferences()} className="rounded-xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50">Save preferences</button></div></section>
      <section className="mt-6 rounded-3xl border border-white/10 bg-slate-900 p-6 sm:p-8"><div className="flex items-center gap-3"><KeyRound className="text-cyan-300" /><div><h2 className="font-semibold">Change password</h2><p className="text-sm text-slate-400">Choose a new password with at least 8 characters.</p></div></div><div className="mt-5 grid gap-3"><input value={passwordCurrent} onChange={e => setPasswordCurrent(e.target.value)} type="password" placeholder="Current password" className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-300/50" /><input value={newPassword} onChange={e => setNewPassword(e.target.value)} type="password" placeholder="New password" className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-300/50" /><input value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} type="password" placeholder="Re-enter new password" className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-300/50" /><button disabled={busy} onClick={() => void changePassword()} className="rounded-xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50">Change password</button></div></section>
      <section className="mt-6 rounded-3xl border border-rose-500/30 bg-rose-950/20 p-6 sm:p-8"><div className="flex items-start gap-3"><Trash2 className="mt-0.5 text-rose-400" /><div><h2 className="font-semibold text-rose-200">Delete StreamVoice Account</h2><p className="mt-1 text-sm leading-6 text-slate-400">This permanently deletes your StreamVoice account, saved platform connections, OAuth connection records, Beat Saber bridge data, saved sounds, chat settings, and sessions. Your TikTok, YouTube, and Twitch accounts themselves are not deleted.</p><button onClick={() => { setShowDeleteConfirm(true); setErrorMessage(''); setMessage(''); }} className="mt-5 rounded-xl bg-rose-600 px-5 py-3 font-semibold text-white hover:bg-rose-500">Delete StreamVoice Account</button></div></div>
        {showDeleteConfirm && <div className="mt-6 rounded-2xl border border-rose-400/30 bg-slate-950 p-5"><div className="text-sm font-semibold text-white">Are you sure?</div><p className="mt-2 text-sm leading-6 text-slate-400">This cannot be undone. Enter your current password and type DELETE to permanently remove the account.</p><div className="mt-4 grid gap-3"><input value={deletePassword} onChange={e => setDeletePassword(e.target.value)} type="password" placeholder="Current password" className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none" /><input value={deleteConfirmation} onChange={e => setDeleteConfirmation(e.target.value)} placeholder="Type DELETE" className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 outline-none" /><div className="flex flex-wrap gap-2"><button disabled={busy} onClick={() => void deleteAccount()} className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Permanently Delete</button><button disabled={busy} onClick={() => setShowDeleteConfirm(false)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm">Cancel</button></div></div></div>}
      </section>
    </main>
    <LegalFooter onNavigate={onNavigate} />
  </div>;
}

function AdminPage({ signedIn, onAuthenticated, onNavigate }: { signedIn: boolean; onAuthenticated: () => void; onNavigate: (page: Page) => void }) {
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [overview, setOverview] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function loadAdmin() {
    try {
      const { data } = await api.get('/api/admin/overview');
      setOverview(data);
      setAdminLoggedIn(true);
    } catch {
      setAdminLoggedIn(false);
    }
  }

  useEffect(() => {
    if (signedIn) void loadAdmin();
  }, [signedIn]);

  async function loginAdmin() {
    setBusy(true);
    setErrorMessage('');
    try {
      await api.post('/api/admin/login', { username: adminUsername, password: adminPassword });
      setAdminPassword('');
      await loadAdmin();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Admin login failed.');
    } finally {
      setBusy(false);
    }
  }

  async function logoutAdmin() {
    await api.post('/api/admin/logout').catch(() => undefined);
    setAdminLoggedIn(false);
    setOverview(null);
  }

  if (!signedIn) {
    return <AccountPage onAuthenticated={onAuthenticated} />;
  }

  if (!adminLoggedIn) {
    return <div className="min-h-screen bg-slate-950 text-slate-100"><header className="border-b border-white/10 bg-slate-950/95"><div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4"><button onClick={() => onNavigate('home')} className="flex items-center gap-3 text-left"><div className="rounded-2xl bg-cyan-400/15 p-2.5 text-cyan-300"><Radio size={22} /></div><div><div className="text-lg font-semibold">StreamVoice</div><div className="text-xs text-slate-400">Admin portal</div></div></button><button onClick={() => onNavigate('console')} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm">Back to Console</button></div></header><main className="mx-auto flex max-w-lg items-center px-6 py-16"><div className="w-full rounded-3xl border border-white/10 bg-slate-900 p-7 shadow-2xl"><p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Restricted</p><h1 className="mt-2 text-3xl font-bold">StreamVoice Admin</h1><p className="mt-3 text-sm leading-6 text-slate-400">Your normal StreamVoice account is signed in. Enter the separate administrator credentials to continue.</p>{errorMessage && <div className="mt-5 rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">{errorMessage}</div>}<div className="mt-6 space-y-3"><input value={adminUsername} onChange={e => setAdminUsername(e.target.value)} autoComplete="username" placeholder="Admin username" className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-300/50" /><input value={adminPassword} onChange={e => setAdminPassword(e.target.value)} type="password" autoComplete="current-password" placeholder="Admin password" className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-300/50" /><button disabled={busy} onClick={() => void loginAdmin()} className="w-full rounded-xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950 disabled:opacity-50">{busy ? 'Checking…' : 'Admin Log In'}</button></div><p className="mt-5 text-xs leading-5 text-slate-500">Admin credentials are stored in AppDeploy Secrets and are never displayed by StreamVoice.</p></div></main></div>;
  }

  const stats = overview?.stats || {};
  return <div className="min-h-screen bg-slate-950 text-slate-100"><header className="border-b border-white/10 bg-slate-950/95 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4"><button onClick={() => onNavigate('home')} className="flex items-center gap-3 text-left"><div className="rounded-2xl bg-cyan-400/15 p-2.5 text-cyan-300"><Radio size={22} /></div><div><div className="text-lg font-semibold">StreamVoice</div><div className="text-xs text-slate-400">Admin dashboard</div></div></button><div className="flex gap-2"><button onClick={() => void loadAdmin()} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm">Refresh</button><button onClick={() => void logoutAdmin()} className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-sm text-rose-200">Admin Log Out</button></div></div></header><main className="mx-auto max-w-7xl px-6 py-10"><div className="mb-8"><p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Administration</p><h1 className="mt-2 text-4xl font-bold">StreamVoice Admin Dashboard</h1><p className="mt-3 text-slate-400">Private account, database, connection, and audit overview.</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[['Accounts',stats.accounts],['TikTok connections',stats.tiktok],['YouTube connections',stats.youtube],['Twitch connections',stats.twitch]].map(([label,value]) => <div key={String(label)} className="rounded-2xl border border-white/10 bg-slate-900 p-5"><div className="text-sm text-slate-400">{label}</div><div className="mt-2 text-3xl font-bold">{String(value ?? 0)}</div></div>)}</div><section className="mt-8 rounded-3xl border border-white/10 bg-slate-900 p-6"><h2 className="text-xl font-semibold">Database tables</h2><p className="mt-1 text-sm text-slate-500">Counts only. Password hashes, sessions, OAuth tokens, and other secrets are never shown.</p><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{(overview?.tables || []).map((table: any) => <div key={table.name} className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950 px-4 py-3"><span className="text-sm text-slate-300">{table.name}</span><span className="text-sm font-semibold text-cyan-200">{table.count}</span></div>)}</div></section><section className="mt-8 rounded-3xl border border-white/10 bg-slate-900 p-6"><h2 className="text-xl font-semibold">StreamVoice accounts</h2><div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-slate-500"><tr><th className="px-3 py-2">Username</th><th className="px-3 py-2">Email</th><th className="px-3 py-2">Created</th><th className="px-3 py-2">Connections</th></tr></thead><tbody>{(overview?.users || []).map((user: any) => <tr key={user.id} className="border-t border-white/5"><td className="px-3 py-3 text-white">{user.username}</td><td className="px-3 py-3 text-slate-300">{user.email}</td><td className="px-3 py-3 text-slate-500">{new Date(user.createdAt).toLocaleString()}</td><td className="px-3 py-3 text-slate-400">{[user.tiktok && 'TikTok',user.youtube && 'YouTube',user.twitch && 'Twitch'].filter(Boolean).join(', ') || 'None'}</td></tr>)}</tbody></table></div></section><section className="mt-8 rounded-3xl border border-white/10 bg-slate-900 p-6"><h2 className="text-xl font-semibold">Recent audit activity</h2><div className="mt-4 space-y-2">{(overview?.audit || []).map((item: any) => <div key={item.id} className="rounded-xl border border-white/10 bg-slate-950 px-4 py-3"><div className="text-sm text-white">{item.action}</div><div className="mt-1 text-xs text-slate-500">{item.actor} · {new Date(item.createdAt).toLocaleString()}</div></div>)}{!(overview?.audit || []).length && <p className="text-sm text-slate-500">No audit activity yet.</p>}</div></section></main></div>;
}

function StreamVoiceApp() {
  const [signedIn, setSignedIn] = useState(false);
  const [, setAuthReady] = useState(true);
  const authActionRef = useRef(0);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [page, setPage] = useState<Page>(() => window.location.pathname === '/downloads' ? 'downloads' : window.location.pathname === '/console' ? 'console' : window.location.pathname === '/account' ? 'account' : window.location.pathname === '/settings' ? 'settings' : window.location.pathname === '/admin' ? 'admin' : window.location.pathname === '/terms' ? 'terms' : window.location.pathname === '/privacy' ? 'privacy' : 'home');
  const [viewerName, setViewerName] = useState('');
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [readMessages, setReadMessages] = useState(true);
  const [readGifts, setReadGifts] = useState(true);
  const [voice, setVoice] = useState('Calm');
  const [rate, setRate] = useState(0.9);
  const [volume, setVolume] = useState(0.72);
  const [chatTranslationEnabled, setChatTranslationEnabled] = useState(true);
  const [chatLanguage, setChatLanguage] = useState('en');
  const [chatLanguages, setChatLanguages] = useState<{ code: string; label: string }[]>([]);
  const [blockedWords, setBlockedWords] = useState<string[]>([]);
  const [blockedWordInput, setBlockedWordInput] = useState('');
  const [sounds, setSounds] = useState(initialSounds);
  const [infrastructure, setInfrastructure] = useState<InfrastructureConfig>({ apiHost: 'streamvoice-api-production.up.railway.app', apiService: 'StreamVoice-API', databaseService: 'Postgres' });
  const [platforms, setPlatforms] = useState<Record<Platform, PlatformState>>({
    TikTok: { connected: false, live: false, channel: 'Not connected' },
    YouTube: { connected: false, live: false, channel: 'Not connected' },
    Twitch: { connected: false, live: false, channel: 'Not connected' },
  });
  const [youtubeConfigured, setYoutubeConfigured] = useState(false);
  const [twitchConfigured, setTwitchConfigured] = useState(false);
  const [tiktokConfigured, setTiktokConfigured] = useState(false);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [chatFilter, setChatFilter] = useState<'All' | Platform>('All');
  const [chatSearch, setChatSearch] = useState('');
  const [moderationPreview, setModerationPreview] = useState(true);
  const [events, setEvents] = useState<string[]>(['Ready. Connect a platform to begin.', 'YouTube integration is ready for OAuth setup.']);

  const chatAfterRef = useRef(0);
  const [, setYoutubePageToken] = useState('');
  const [, setYoutubeBootstrapped] = useState(false);
  const youtubePageTokenRef = useRef('');

  const [, setTwitchFollows] = useState<string[]>([]);
  const [beatSaber, setBeatSaber] = useState<{ paired: boolean; connected: boolean; pairingCode?: string; lastSeen?: number; protocol?: string; gameVersion?: string; modVersion?: string }>({ paired: false, connected: false });
  const [beatSaberToken, setBeatSaberToken] = useState('');
  const [bsrRequests, setBsrRequests] = useState<BsrRequest[]>([]);
  const [beatSaberChatInput, setBeatSaberChatInput] = useState('');
  const audioRef = useRef<AudioContext | null>(null);
  const spokenIds = useRef(new Set<string>());

  const livePlatforms = useMemo(() => Object.values(platforms).filter(state => state.live).length, [platforms]);

  const addEvent = (message: string) => setEvents(current => [message, ...current].slice(0, 8));
  const callbackParams = new URLSearchParams(window.location.search);
  const callbackState = callbackParams.get('state') || '';
  const isRootOAuthCallback = window.location.pathname === '/' && callbackParams.has('code') && callbackParams.has('state');
  const isYouTubeCallback = isRootOAuthCallback && callbackState.startsWith('yt-');
  const isTikTokCallback = isRootOAuthCallback && callbackState.startsWith('tk-');
  const [twitchCallbackMessage, setTwitchCallbackMessage] = useState('Finishing Twitch authorization…');
  const [youtubeCallbackMessage, setYoutubeCallbackMessage] = useState('Finishing YouTube authorization…');
  const [tiktokCallbackMessage, setTiktokCallbackMessage] = useState('Finishing TikTok authorization…');

  useEffect(() => {
    if (!isRootOAuthCallback) return;
    const params = new URLSearchParams(window.location.search);
    const errorCode = params.get('error');
    const code = params.get('code');
    const state = params.get('state');
    const youtube = state?.startsWith('yt-') || false;
    const tiktok = state?.startsWith('tk-') || false;
    let active = true;
    const finish = async () => {
      let message = youtube ? 'YouTube connection could not be completed.' : tiktok ? 'TikTok connection could not be completed.' : 'Twitch connection could not be completed.';
      try {
        if (errorCode) message = youtube ? 'YouTube authorization was cancelled.' : tiktok ? 'TikTok authorization was cancelled.' : 'Twitch authorization was cancelled.';
        else if (!code || !state) message = 'Missing authorization response.';
        else {
          const endpoint = youtube ? '/api/youtube/complete' : tiktok ? '/api/tiktok/complete' : '/api/twitch/complete';
          const result = await api.get(endpoint + '?code=' + encodeURIComponent(code) + '&state=' + encodeURIComponent(state));
          message = String(result.data?.message || message);
        }
      } catch {
        message = youtube ? 'YouTube connection could not be completed.' : 'Twitch connection could not be completed.';
      }
      if (!active) return;
      if (youtube) {
        setYoutubeCallbackMessage(message);
        if (message === 'YouTube connected successfully.') {
          if (window.opener) window.opener.postMessage({ type: 'streamvoice-youtube-connected' }, window.location.origin);
          else setTimeout(() => { window.history.replaceState({}, '', './console'); window.dispatchEvent(new PopStateEvent('popstate')); }, 700);
        }
      } else if (tiktok) {
        setTiktokCallbackMessage(message);
        if (message === 'TikTok connected successfully.') {
          if (window.opener) window.opener.postMessage({ type: 'streamvoice-tiktok-connected' }, window.location.origin);
          else setTimeout(() => { window.history.replaceState({}, '', './console'); window.dispatchEvent(new PopStateEvent('popstate')); }, 700);
        }
      } else {
        setTwitchCallbackMessage(message);
        if (message === 'Twitch connected successfully.') {
          if (window.opener) window.opener.postMessage({ type: 'streamvoice-twitch-connected' }, window.location.origin);
          else setTimeout(() => { window.history.replaceState({}, '', './console'); window.dispatchEvent(new PopStateEvent('popstate')); }, 700);
        }
      }
      setTimeout(() => window.close(), 1200);
    };
    void finish();
    return () => { active = false; };
  }, [isRootOAuthCallback]);

  useEffect(() => {
    const onPopState = () => setPage(window.location.pathname === '/downloads' ? 'downloads' : window.location.pathname === '/console' ? 'console' : window.location.pathname === '/account' ? 'account' : window.location.pathname === '/settings' ? 'settings' : window.location.pathname === '/admin' ? 'admin' : window.location.pathname === '/terms' ? 'terms' : window.location.pathname === '/privacy' ? 'privacy' : 'home');
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  function navigate(nextPage: Page) {
    const path = nextPage === 'home' ? '/' : '/' + nextPage;
    window.history.pushState({}, '', path);
    setPage(nextPage);
  }

  async function handleSignIn() { navigate('account'); }

  function completeAuthentication() {
    authActionRef.current += 1;
    setSignedIn(true);
    navigate('console');
  }

  async function handleSignOut() {
    try {
      await api.post('/api/auth/logout');
      setSignedIn(false);
      setViewerName('');
      setPlatforms({
        TikTok: { connected: false, live: false, channel: 'Not connected' },
        YouTube: { connected: false, live: false, channel: 'Not connected' },
        Twitch: { connected: false, live: false, channel: 'Not connected' },
      });
      setChat([]);
      setBsrRequests([]);
      setBeatSaber({ paired: false, connected: false });
      setBeatSaberToken('');
      setPage('account');
      window.history.replaceState({}, '', '/account');
    } catch {
      addEvent('SV-AUTH-015: Could not sign out cleanly. Your saved login may still be active.');
    }
  }

  useEffect(() => {
    let mounted = true;
    const loadSession = async () => {
      const restoreAction = authActionRef.current;
      try {
        const userResult = await Promise.race([
          api.get('/api/auth/me'),
          new Promise<never>((_, reject) => window.setTimeout(() => reject(Object.assign(new Error('Saved login restore timed out.'), { code: 'SV-AUTH-020' })), 8000)),
        ]);
        if (!mounted) return;
        const user = userResult.data?.user;
        if (!user) {
          setSignedIn(false);
          setViewerName('');
          setPage('account');
          return;
        }
        setYoutubePageToken('');
        setYoutubeBootstrapped(false);
        chatAfterRef.current = 0;
        youtubePageTokenRef.current = '';
        spokenIds.current.clear();
        setSignedIn(true);
        setViewerName(String(user.username || user.email || 'Streamer'));
        // Authentication is complete here. Background service requests must never keep the login screen visible.
        setAuthReady(true);
        const results = await Promise.allSettled([
          api.get('/api/stream-state'),
          api.get('/api/youtube/status'),
          api.get('/api/twitch/status'),
          api.get('/api/tiktok/status'),
          api.get('/api/beat-saber/status'),
          api.get('/api/integrations/config'),
          api.get('/api/system/infrastructure'),
        ]);
        if (!mounted) return;
        const [stateResult, youtubeResult, twitchResult, tiktokResult, beatSaberResult, integrationConfigResult, infrastructureResult] = results;
        if (stateResult.status === 'fulfilled' && stateResult.value.data?.platforms) setPlatforms(stateResult.value.data.platforms);
        if (youtubeResult.status === 'fulfilled') {
          const data = youtubeResult.value.data;
          setYoutubeConfigured(Boolean(data?.configured));
          if (data?.connected) setPlatforms(current => ({ ...current, YouTube: { connected: true, live: Boolean(data.live), channel: data.channel || 'YouTube channel' } }));
        }
        if (twitchResult.status === 'fulfilled') {
          const data = twitchResult.value.data;
          setTwitchConfigured(Boolean(data?.configured));
          if (data?.connected) setPlatforms(current => ({ ...current, Twitch: { connected: true, live: Boolean(data.live), channel: data.channel || 'Twitch channel' } }));
          if (data?.follows) setTwitchFollows(data.follows);
        }
        if (tiktokResult.status === 'fulfilled') {
          const data = tiktokResult.value.data;
          setTiktokConfigured(Boolean(data?.configured));
          if (data?.connected) setPlatforms(current => ({ ...current, TikTok: { connected: true, live: false, channel: data.channel || 'TikTok account' } }));
        }
        if (beatSaberResult.status === 'fulfilled') setBeatSaber(beatSaberResult.value.data || { paired: false, connected: false });
        if (integrationConfigResult.status === 'fulfilled') {
          const config = integrationConfigResult.value.data || {};
          setYoutubeConfigured(Boolean(config.YouTube));
          setTwitchConfigured(Boolean(config.Twitch));
          setTiktokConfigured(Boolean(config.TikTok));
        }
        if (infrastructureResult.status === 'fulfilled') {
          const config = infrastructureResult.value.data || {};
          setInfrastructure({ apiHost: String(config.apiHost || 'streamvoice-api-production.up.railway.app'), apiService: String(config.apiService || 'StreamVoice-API'), databaseService: String(config.databaseService || 'Postgres') });
        }
        if (results.some(result => result.status === 'rejected')) addEvent('Some StreamVoice services could not be loaded.');
      } catch (error) {
        if (mounted && authActionRef.current === restoreAction) {
          setSignedIn(false);
          setViewerName('');
          setPage('account');
          const response = (error as any)?.response?.data;
          const code = String(response?.errorCode || (error as any)?.code || 'SV-AUTH-097');
          const message = String(response?.message || response?.error || (error instanceof Error ? error.message : 'Could not restore your StreamVoice session.'));
          addEvent(code + ': ' + message);
        }
      } finally {
        if (mounted) setAuthReady(true);
      }
    };
    void loadSession();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'streamvoice-youtube-connected') {
        addEvent('YouTube authorization completed.');
        refreshYouTubeStatus();
      }
      if (event.data?.type === 'streamvoice-twitch-connected') {
        addEvent('Twitch authorization completed.');
        refreshTwitchStatus();
      }
      if (event.data?.type === 'streamvoice-tiktok-connected') {
        addEvent('TikTok authorization completed.');
        refreshTikTokStatus();
      }
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  });

  useEffect(() => {
    if (!signedIn) return;
    Promise.all([api.get('/api/chat-settings'), api.get('/api/tts-blocked-words'), api.get('/api/stream-settings'), api.get('/api/sounds')]).then(([chatSettings, blockedWordsResult, streamSettings, savedSounds]) => {
      const data = chatSettings.data;
      setChatTranslationEnabled(data?.enabled !== false);
      setChatLanguage(String(data?.language || 'en'));
      setChatLanguages(Array.isArray(data?.languages) ? data.languages : []);
      setBlockedWords(Array.isArray(blockedWordsResult.data?.words) ? blockedWordsResult.data.words : []);
      const prefs = streamSettings.data || {};
      setTtsEnabled(prefs.ttsEnabled !== false);
      setReadMessages(prefs.readMessages !== false);
      setReadGifts(prefs.readGifts !== false);
      setVoice(['Calm', 'Neutral', 'Warm'].includes(prefs.voice) ? prefs.voice : 'Calm');
      setRate(Number.isFinite(Number(prefs.rate)) ? Number(prefs.rate) : 0.9);
      setVolume(Number.isFinite(Number(prefs.volume)) ? Number(prefs.volume) : 0.72);
      const soundMap = savedSounds.data?.sounds || {};
      setSounds(current => ({
        TikTok: { ...current.TikTok, ...(soundMap.TikTok || {}) },
        YouTube: { ...current.YouTube, ...(soundMap.YouTube || {}) },
        Twitch: { ...current.Twitch, ...(soundMap.Twitch || {}) },
      }));
    }).catch(() => undefined);
  }, [signedIn]);

  function messageContainsBlockedWord(text: string) {
    const normalized = text.toLocaleLowerCase();
    return blockedWords.some(word => {
      const candidate = word.trim().toLocaleLowerCase();
      if (!candidate) return false;
      const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp('(^|[^\\p{L}\\p{N}_])' + escaped + '($|[^\\p{L}\\p{N}_])', 'iu').test(normalized);
    });
  }

  async function saveBlockedWords(nextWords: string[]) {
    try {
      const { data } = await api.put('/api/tts-blocked-words', { words: nextWords });
      setBlockedWords(Array.isArray(data?.words) ? data.words : nextWords);
      addEvent('TTS blocked words saved.');
    } catch (error) {
      addEvent(error instanceof Error ? error.message : 'Could not save TTS blocked words.');
    }
  }

  function addBlockedWord() {
    const word = blockedWordInput.trim();
    if (!word) return;
    const exists = blockedWords.some(item => item.toLocaleLowerCase() === word.toLocaleLowerCase());
    if (exists) {
      setBlockedWordInput('');
      return;
    }
    const nextWords = [...blockedWords, word].slice(0, 100);
    setBlockedWordInput('');
    void saveBlockedWords(nextWords);
  }

  function removeBlockedWord(word: string) {
    void saveBlockedWords(blockedWords.filter(item => item !== word));
  }

  async function saveChatTranslationSettings(enabled = chatTranslationEnabled, language = chatLanguage) {
    try {
      const { data } = await api.put('/api/chat-settings', { enabled, language });
      setChatTranslationEnabled(data?.enabled !== false);
      setChatLanguage(String(data?.language || language));
      setChatLanguages(Array.isArray(data?.languages) ? data.languages : chatLanguages);
      addEvent('Chat translation settings saved.');
    } catch (error) {
      addEvent(error instanceof Error ? error.message : 'Could not save chat translation settings.');
    }
  }

  async function saveStreamPreferences(patch: Partial<{ ttsEnabled: boolean; readMessages: boolean; readGifts: boolean; voice: string; rate: number; volume: number }>) {
    const preferences = { ttsEnabled, readMessages, readGifts, voice, rate, volume, ...patch };
    try {
      const { data } = await api.put('/api/stream-settings', preferences);
      setTtsEnabled(data?.ttsEnabled !== false);
      setReadMessages(data?.readMessages !== false);
      setReadGifts(data?.readGifts !== false);
      setVoice(['Calm', 'Neutral', 'Warm'].includes(data?.voice) ? data.voice : preferences.voice);
      setRate(Number.isFinite(Number(data?.rate)) ? Number(data.rate) : preferences.rate);
      setVolume(Number.isFinite(Number(data?.volume)) ? Number(data.volume) : preferences.volume);
    } catch (error) {
      addEvent(error instanceof Error ? error.message : 'Could not save TTS preferences.');
    }
  }

  useEffect(() => {
    if (!signedIn) return;
    const anyConnected = Object.values(platforms).some(state => state.connected);
    if (!anyConnected) return;
    let stopped = false;
    const poll = async () => {
      try {
        const params = new URLSearchParams();
        if (chatAfterRef.current) params.set('after', String(chatAfterRef.current));
        const unifiedPromise = api.get('/api/chat/unified' + (params.toString() ? '?' + params.toString() : ''));
        const youtubeParams = new URLSearchParams();
        if (youtubePageTokenRef.current) youtubeParams.set('pageToken', youtubePageTokenRef.current);
        const youtubePromise = platforms.YouTube.connected
          ? api.get('/api/youtube/chat' + (youtubeParams.toString() ? '?' + youtubeParams.toString() : '')).catch(() => ({ data: {} }))
          : Promise.resolve({ data: {} });
        const [unifiedResult, youtubeResult] = await Promise.all([unifiedPromise, youtubePromise]);
        if (stopped) return;
        const youtubeData = youtubeResult.data || {};
        if (youtubeData.nextPageToken) {
          youtubePageTokenRef.current = String(youtubeData.nextPageToken);
          setYoutubePageToken(String(youtubeData.nextPageToken));
        }
        const data = {
          ...(unifiedResult.data || {}),
          messages: [...(unifiedResult.data?.messages || []), ...(youtubeData.messages || [])],
          pollingIntervalMillis: youtubeData.pollingIntervalMillis || unifiedResult.data?.pollingIntervalMillis || 5000,
        };
        const incoming: ChatMessage[] = (data?.messages || []).map((message: ChatMessage) => ({ ...message, platform: message.platform || 'YouTube' }));
        if (incoming.length) {
          const newest = incoming.reduce((latest, message: ChatMessage & { createdAt?: number }) => Math.max(latest, Number(message.createdAt || Date.now())), chatAfterRef.current);
          chatAfterRef.current = newest;
          setChat(current => [...incoming, ...current].filter((item, index, all) => all.findIndex(other => other.id === item.id) === index).slice(0, 100));
          for (const message of incoming) {
            if (spokenIds.current.has(message.id)) continue;
            spokenIds.current.add(message.id);
            if (message.type === 'textMessageEvent') {
              if (readMessages && ttsEnabled) speak(message.author + ' says ' + message.text);
            } else if (message.type === 'streamEvent') {
              const kind = String((message as any).kind || '');
              if (['gift', 'follow', 'live'].includes(kind)) playEventSound(message.platform as Platform, kind as keyof SoundConfig);
              if (readGifts && ttsEnabled) speak(message.text);
            }
          }
          setYoutubeBootstrapped(true);
        }
        const wait = Math.max(3000, Number(data?.pollingIntervalMillis || 5000));
        window.setTimeout(() => { if (!stopped) poll(); }, wait);
      } catch {
        window.setTimeout(() => { if (!stopped) poll(); }, 7000);
      }
    };
    poll();
    return () => { stopped = true; };
  }, [signedIn, platforms.YouTube.connected, platforms.YouTube.live, platforms.Twitch.connected, platforms.Twitch.live, platforms.TikTok.connected]);

  async function refreshYouTubeStatus() {
    try {
      const { data } = await api.get('/api/youtube/status');
      setYoutubeConfigured(Boolean(data?.configured));
      setPlatforms(current => ({
        ...current,
        YouTube: {
          connected: Boolean(data?.connected),
          live: Boolean(data?.live),
          channel: data?.channel || 'Not connected',
        },
      }));
      if (data?.live) addEvent('YouTube is live. Chat reader is ready.');
    } catch {
      addEvent('Could not refresh YouTube status.');
    }
  }

  async function refreshTwitchStatus() {
    try {
      const { data } = await api.get('/api/twitch/status');
      setTwitchConfigured(Boolean(data?.configured));
      setPlatforms(current => ({ ...current, Twitch: { connected: Boolean(data?.connected), live: Boolean(data?.live), channel: data?.channel || 'Not connected' } }));
      if (data?.follows) setTwitchFollows(data.follows);
    } catch {
      addEvent('Could not refresh Twitch status.');
    }
  }

  function startOAuth(path: string, label: string) {
    addEvent('Opening ' + label + ' authorization.');
    window.location.href = path;
  }

  function connectYouTube() {
    startOAuth('/api/youtube/connect', 'YouTube');
  }

  async function refreshTikTokStatus() {
    try {
      const { data } = await api.get('/api/tiktok/status');
      setTiktokConfigured(Boolean(data?.configured));
      setPlatforms(current => ({ ...current, TikTok: { connected: Boolean(data?.connected), live: false, channel: data?.channel || 'Not connected' } }));
    } catch {
      addEvent('Could not refresh TikTok status.');
    }
  }

  function connectTikTok() {
    startOAuth('/api/tiktok/connect', 'TikTok');
  }

  async function disconnectTikTok() {
    try { await api.post('/api/tiktok/disconnect'); } catch { /* no-op */ }
    setPlatforms(current => ({ ...current, TikTok: { connected: false, live: false, channel: 'Not connected' } }));
    addEvent('TikTok disconnected.');
  }

  function connectTwitch() {
    startOAuth('/api/twitch/connect', 'Twitch');
  }

  async function disconnectTwitch() {
    try { await api.post('/api/twitch/disconnect'); } catch { /* no-op */ }
    setPlatforms(current => ({ ...current, Twitch: { connected: false, live: false, channel: 'Not connected' } }));
    addEvent('Twitch disconnected.');
  }

  async function refreshBeatSaberStatus() {
    try {
      const { data } = await api.get('/api/beat-saber/status');
      setBeatSaber(data || { paired: false, connected: false });
      setBeatSaberToken(String(data?.pairingCode || ''));
    } catch {
      addEvent('Could not refresh Beat Saber bridge status.');
    }
  }

  async function pairBeatSaber() {
    try {
      const { data } = await api.post('/api/beat-saber/pair');
      setBeatSaber(data || { paired: true, connected: false });
      setBeatSaberToken(String(data?.pairingCode || ''));
      const diagnostic = data?.diagnostic;
      if (diagnostic) addEvent('Pairing storage check: saved=' + Boolean(diagnostic.saved) + ', hash=' + Boolean(diagnostic.hashVerified) + ', lookup=' + Boolean(diagnostic.lookupFound) + '.');
      addEvent('Beat Saber bridge paired. GET connect polling is ready for chat, BSR, and stream events.');
    } catch (error) {
      addEvent(error instanceof Error ? error.message : 'Beat Saber pairing failed.');
    }
  }

  async function unpairBeatSaber() {
    try { await api.post('/api/beat-saber/unpair'); } catch { /* no-op */ }
    setBeatSaber({ paired: false, connected: false });
    setBeatSaberToken('');
    addEvent('Beat Saber bridge unpaired.');
  }

  async function testBeatSaber() {
    try {
      await api.post('/api/beat-saber/test');
      addEvent('Test BSR event queued for the Beat Saber mod.');
    } catch (error) {
      addEvent(error instanceof Error ? error.message : 'Could not queue a Beat Saber test event.');
    }
  }

  async function sendBeatSaberConsoleChat() {
    const text = beatSaberChatInput.trim();
    if (!text) return;
    try {
      const { data } = await api.post('/api/beat-saber/chat', { text, author: viewerName || 'StreamVoice Test', platform: 'StreamVoice' });
      if (data?.type === 'bsr') addEvent('Console BSR: !bsr ' + String(data?.code || '') + ' queued.');
      else addEvent('Console chat queued.');
      setBeatSaberChatInput('');
    } catch (error) {
      addEvent(error instanceof Error ? error.message : 'Could not send console chat.');
    }
  }

  async function testBeatSaberChat() {
    try {
      const { data } = await api.post('/api/beat-saber/test-chat');
      addEvent('Test chat: ' + (data?.queued ? 'QUEUED' : 'FAILED') + ' · pending=' + Number(data?.outboxCount || 0) + ' · event=' + String(data?.eventId || 'none') + '.');
    } catch (error) {
      addEvent(error instanceof Error ? error.message : 'Could not queue a Beat Saber chat test.');
    }
  }

  async function refreshBsrRequests() {
    try {
      const { data } = await api.get('/api/beat-saber/requests');
      setBsrRequests(Array.isArray(data?.requests) ? data.requests : []);
    } catch {
      addEvent('Could not refresh BSR requests.');
    }
  }

  useEffect(() => {
    if (!signedIn) return;
    const timer = window.setInterval(() => {
      refreshBeatSaberStatus();
      refreshBsrRequests();
    }, 5000);
    refreshBsrRequests();
    return () => window.clearInterval(timer);
  }, [signedIn]);

  async function disconnectYouTube() {
    try { await api.post('/api/youtube/disconnect'); } catch { /* no-op */ }
    setPlatforms(current => ({ ...current, YouTube: { connected: false, live: false, channel: 'Not connected' } }));
    setChat([]);
    setYoutubePageToken('');
    setYoutubeBootstrapped(false);
    addEvent('YouTube disconnected.');
  }

  function speak(text: string) {
    if (!ttsEnabled || messageContainsBlockedWord(text)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.volume = volume;
    utterance.pitch = voice === 'Calm' ? 0.95 : voice === 'Warm' ? 1.05 : 1;
    const preferred = window.speechSynthesis.getVoices().find(item => item.lang.toLowerCase().startsWith(chatLanguage.toLowerCase())) || window.speechSynthesis.getVoices().find(item => /en/i.test(item.lang));
    if (preferred) utterance.voice = preferred;
    window.speechSynthesis.speak(utterance);
  }

  function testSpeech() {
    speak('Welcome to the stream. Thanks for being here.');
    addEvent('Test TTS played.');
  }

  function playEventSound(platform: Platform, kind: keyof SoundConfig) {
    const configuredSound = sounds[platform][kind];
    if (configuredSound === 'Not used') {
      addEvent(kind + ' sound is not configured for ' + platform + '.');
      return;
    }
    if (/^(https?:\/\/|data:audio\/|\/api\/sounds\/)/.test(configuredSound)) {
      const audio = new Audio(configuredSound);
      audio.volume = volume;
      void audio.play().catch(() => addEvent('Browser blocked sound playback until a user gesture.'));
      addEvent('Played uploaded ' + kind + ' sound for ' + platform + '.');
      return;
    }
    const context = audioRef.current || new AudioContext();
    audioRef.current = context;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = kind === 'gift' ? 660 : 520;
    gain.gain.value = 0.08 * volume;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.16);
    addEvent('Played ' + kind + ' sound for ' + platform + '.');
  }

  function updateSound(platform: Platform, kind: keyof SoundConfig, value: string) {
    setSounds(current => ({ ...current, [platform]: { ...current[platform], [kind]: value || 'Custom sound' } }));
  }

  async function handleAudioUpload(platform: Platform, kind: keyof SoundConfig, file?: File) {
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
      const { data } = await api.post('/api/sounds/upload', { platform, kind, filename: file.name, contentType: file.type || 'audio/mpeg', base64: btoa(binary) });
      updateSound(platform, kind, data?.url || file.name);
      addEvent('Uploaded ' + file.name + ' for ' + platform + ' ' + kind + ' events.');
    } catch {
      updateSound(platform, kind, file.name);
      addEvent('Could not upload ' + file.name + '; using the local filename for now.');
    }
  }

  if (isRootOAuthCallback) {
    const message = isYouTubeCallback ? youtubeCallbackMessage : isTikTokCallback ? tiktokCallbackMessage : twitchCallbackMessage;
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-8 text-center shadow-2xl">
          <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-cyan-300/10 flex items-center justify-center text-cyan-300">{isYouTubeCallback ? <Youtube size={24} /> : isTikTokCallback ? <Music2 size={24} /> : <Wifi size={24} />}</div>
          <h1 className="text-2xl font-semibold">StreamVoice</h1>
          <p className="mt-3 text-base text-slate-300">{message}</p>
          <p className="mt-2 text-xs text-slate-500">You can close this window when finished.</p>
        </div>
      </div>
    );
  }

  if (page === 'terms' || page === 'privacy') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <header className="border-b border-white/10 bg-slate-950/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
            <button onClick={() => navigate('home')} className="flex items-center gap-3 text-left">
              <div className="rounded-2xl bg-cyan-400/15 p-2.5 text-cyan-300"><Radio size={22} /></div>
              <div><div className="text-lg font-semibold tracking-tight">StreamVoice</div><div className="text-xs text-slate-400">The whole Beat Saber stream package</div></div>
            </button>
            <button onClick={() => navigate('home')} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 hover:bg-white/10">Back to StreamVoice</button>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-6 py-12">
          {page === 'terms' ? (
            <article className="prose prose-invert max-w-none">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Legal</p>
              <h1 className="mt-2 text-4xl font-bold tracking-tight">Terms of Service</h1>
              <p className="mt-3 text-sm text-slate-500">Last updated: September 26, 2026</p>
              <div className="mt-10 space-y-7 text-sm leading-7 text-slate-300">
                <section><h2 className="text-xl font-semibold text-white">1. Service</h2><p className="mt-2">StreamVoice provides streaming tools that connect supported creator accounts with chat, text-to-speech, event notifications, and Beat Saber features. Some features depend on third-party services and may change or become unavailable.</p></section>
                <section><h2 className="text-xl font-semibold text-white">2. Accounts</h2><p className="mt-2">You are responsible for the activity performed through your StreamVoice account and for keeping your account access secure. You must use StreamVoice only for lawful purposes and follow the rules of the third-party platforms you connect.</p></section>
                <section><h2 className="text-xl font-semibold text-white">3. Third-party platforms</h2><p className="mt-2">StreamVoice is not TikTok, YouTube, Twitch, Beat Saber, or BeatSaver. Connecting a third-party account does not create an endorsement or partnership unless StreamVoice explicitly says so. Third-party outages, API limits, policy changes, or authorization changes can affect StreamVoice features.</p></section>
                <section><h2 className="text-xl font-semibold text-white">4. User content and permissions</h2><p className="mt-2">You retain responsibility for content you submit or cause StreamVoice to read, transmit, or display. You are responsible for having the permissions needed to use that content and for complying with applicable platform rules.</p></section>
                <section><h2 className="text-xl font-semibold text-white">5. Availability</h2><p className="mt-2">StreamVoice is provided on an availability basis. Features may be updated, suspended, or removed as the service and its third-party integrations evolve.</p></section>
                <section><h2 className="text-xl font-semibold text-white">6. Termination</h2><p className="mt-2">StreamVoice may restrict or terminate access when reasonably necessary to protect the service, users, third-party integrations, or comply with applicable requirements. You can disconnect supported platform integrations from the StreamVoice console where that control is provided.</p></section>
                <section><h2 className="text-xl font-semibold text-white">7. Changes</h2><p className="mt-2">These terms may be updated as StreamVoice changes. The current version will remain available on this page.</p></section>
                <section><h2 className="text-xl font-semibold text-white">8. Contact</h2><p className="mt-2">For service questions or requests, use the support contact provided by the StreamVoice service operator.</p></section>
              </div>
            </article>
          ) : (
            <article className="prose prose-invert max-w-none">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Legal</p>
              <h1 className="mt-2 text-4xl font-bold tracking-tight">Privacy Policy</h1>
              <p className="mt-3 text-sm text-slate-500">Last updated: September 26, 2026</p>
              <div className="mt-10 space-y-7 text-sm leading-7 text-slate-300">
                <section><h2 className="text-xl font-semibold text-white">1. Information we handle</h2><p className="mt-2">StreamVoice may handle account information needed for sign-in, connected-platform identifiers, profile information returned by authorized platform APIs, chat messages, event data, Beat Saber pairing and connection data, BSR requests, and settings you choose to save.</p></section>
                <section><h2 className="text-xl font-semibold text-white">2. Connected platforms</h2><p className="mt-2">When you connect TikTok, YouTube, or Twitch, StreamVoice uses the permissions you authorize to provide the requested integration. OAuth credentials and refreshable tokens are handled by the service backend rather than placed in the public website code.</p></section>
                <section><h2 className="text-xl font-semibold text-white">3. How information is used</h2><p className="mt-2">Information is used to authenticate your account, maintain platform connections, read supported live events or chat, provide text-to-speech and translation settings, deliver Beat Saber events, process BSR requests, and operate and troubleshoot the service.</p></section>
                <section><h2 className="text-xl font-semibold text-white">4. Sharing</h2><p className="mt-2">StreamVoice sends data to a connected third-party platform only when needed to provide the feature you requested or when required by the platform integration. StreamVoice does not represent that it controls third-party privacy practices; review the privacy policies of services you connect.</p></section>
                <section><h2 className="text-xl font-semibold text-white">5. Security</h2><p className="mt-2">StreamVoice uses server-side handling for OAuth secrets and tokens and limits connected-platform access to the permissions needed for the integration. No online service can guarantee absolute security.</p></section>
                <section><h2 className="text-xl font-semibold text-white">6. Your choices</h2><p className="mt-2">You can disconnect supported platform accounts from the StreamVoice console where a disconnect control is available. You can also stop using StreamVoice and revoke authorization through the connected platform. Requests about StreamVoice-held data can be made through the support contact provided by the service operator.</p></section>
                <section><h2 className="text-xl font-semibold text-white">7. Updates</h2><p className="mt-2">This policy may be updated when StreamVoice changes its features or data practices. The current version will remain available on this page.</p></section>
              </div>
            </article>
          )}
        </main>
        <LegalFooter onNavigate={navigate} />
      </div>
    );
  }

  if (!signedIn && page !== 'account') return <AccountPage onAuthenticated={completeAuthentication} />;

  if (page === 'account') {
    if (signedIn) return <AccountSettingsPage viewerName={viewerName} onNavigate={navigate} onDeleted={() => { setSignedIn(false); setViewerName(''); setPage('account'); window.history.replaceState({}, '', '/account'); }} />;
    return <AccountPage onAuthenticated={completeAuthentication} />;
  }

  if (page === 'admin') return <AdminPage signedIn={signedIn} onAuthenticated={() => setSignedIn(true)} onNavigate={navigate} />;

  if (page === 'settings' && signedIn) return <AccountSettingsPage viewerName={viewerName} onNavigate={navigate} onDeleted={() => { setSignedIn(false); setViewerName(''); setPlatforms({ TikTok: { connected: false, live: false, channel: 'Not connected' }, YouTube: { connected: false, live: false, channel: 'Not connected' }, Twitch: { connected: false, live: false, channel: 'Not connected' } }); window.history.replaceState({}, '', '/account'); setPage('account'); }} />;

  if (page === 'settings' && !signedIn) { navigate('account'); return null; }

  if (page === 'console' && !signedIn) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-300"><div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-8 text-center"><h1 className="text-2xl font-semibold text-white">Sign in to StreamVoice</h1><p className="mt-2 text-sm text-slate-400">Your platform connections and Beat Saber settings are tied to your StreamVoice account.</p><button onClick={handleSignIn} className="mt-6 w-full rounded-xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950">Log in / Sign up</button><button onClick={() => navigate('home')} className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">Back</button></div></div>;
  }

  if (page === 'home' || page === 'downloads') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <header className="border-b border-white/10 bg-slate-950/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
            <button onClick={() => navigate('home')} className="flex items-center gap-3 text-left"><div className="rounded-2xl bg-cyan-400/15 p-2.5 text-cyan-300"><Radio size={22} /></div><div><div className="text-lg font-semibold tracking-tight">StreamVoice</div><div className="text-xs text-slate-400">The whole Beat Saber stream package</div></div></button>
            <nav className="flex items-center gap-2 text-sm"><button onClick={() => navigate('home')} className="rounded-xl px-3 py-2 text-slate-300 hover:bg-white/5"><Home size={15} className="mr-2 inline" />Home</button><button onClick={() => navigate('downloads')} className="rounded-xl px-3 py-2 text-slate-300 hover:bg-white/5"><Download size={15} className="mr-2 inline" />Downloads</button>{signedIn && <button onClick={() => navigate('console')} className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-cyan-200"><LayoutDashboard size={15} className="mr-2 inline" />Console</button>}{!signedIn ? <button onClick={handleSignIn} className="rounded-xl bg-cyan-300 px-4 py-2 font-semibold text-slate-950">Log in / Sign up</button> : <><span className="hidden rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-slate-300 sm:inline">{viewerName}</span><button onClick={handleSignOut} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-slate-300 hover:bg-white/10">Log out</button></>}</nav>
          </div>
        </header>
        {page === 'home' ? (
<main className="mx-auto max-w-6xl px-6 py-14 sm:py-20"><section className="mx-auto max-w-4xl text-center"><div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300"><Gamepad2 size={38} /></div><p className="mb-3 text-sm font-semibold uppercase tracking-[0.35em] text-cyan-300">StreamVoice</p><h1 className="text-5xl font-bold tracking-tight sm:text-7xl">StreamVoice</h1><p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl">StreamVoice is the ULTIMATE Beat Saber Stream Package for Standalone and PCVR. It has built in TTS in-game, !BSR working for all platforms, a in-game chat box for Twitch YouTube and TikTok, sound effects for stream actions, multilanguage easy reading chat, a autotranslater for chat, a word blocker, antispammer for TTS, font filter.</p><div className="mt-8 flex flex-wrap items-center justify-center gap-3"><button onClick={() => navigate('downloads')} className="flex items-center gap-2 rounded-2xl bg-cyan-300 px-6 py-3.5 font-semibold text-slate-950"><Download size={18} />Download</button>{!signedIn && <button onClick={handleSignIn} className="rounded-2xl border border-white/15 bg-white/5 px-6 py-3.5 font-semibold text-slate-100">Log in / Sign up</button>}{signedIn && <button onClick={() => navigate('console')} className="flex items-center gap-2 rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-6 py-3.5 font-semibold text-cyan-200"><LayoutDashboard size={18} />Open Console</button>}</div></section><section className="mx-auto mt-14 max-w-5xl"><div className="mb-6 text-center"><h2 className="text-3xl font-bold tracking-tight">Features</h2><p className="mt-2 text-sm text-slate-400">Everything StreamVoice brings to your Beat Saber stream.</p></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[['TTS In-Game','Reads chat messages out loud in Beat Saber with built-in text-to-speech.'],['!BSR Support','Lets viewers request Beat Saber songs with !BSR, with support across Twitch, YouTube, and TikTok.'],['In-Game Chat Box','Shows Twitch, YouTube, and TikTok chat directly inside Beat Saber while you play.'],['Sound Effects','Plays custom sounds for stream actions such as follows, gifts, subs, and other events.'],['Multilanguage Easy Reading Chat','Makes chat easier to read in-game across multiple languages.'],['Autotranslater','Automatically translates chat into your preferred language before it reaches the in-game chat.'],['Word Blocker','Blocks messages containing words you choose so unwanted text is not sent to TTS.'],['Antispammer for TTS','Helps prevent chat spam from overwhelming the TTS system.'],['Font Filter','Filters hard-to-read or unsupported fonts so chat stays readable in-game.']].map(([title, description]) => <div key={title} className="rounded-2xl border border-white/10 bg-slate-900/70 p-5"><div className="text-base font-semibold text-white">{title}</div><div className="mt-2 text-sm leading-6 text-slate-400">{description}</div></div>)}</div></section></main>
        ) : (
          <main className="mx-auto max-w-6xl px-6 py-12"><div className="mx-auto max-w-5xl"><button onClick={() => navigate('home')} className="mb-8 text-sm text-slate-400 hover:text-slate-200">← Back to StreamVoice</button><div className="mb-10"><p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Downloads</p><h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Choose your Beat Saber setup</h1><p className="mt-3 max-w-2xl text-slate-400">Select the version and platform that matches your installation. StreamVoice currently targets Beat Saber 1.40.8.</p></div><div className="grid gap-6 md:grid-cols-2"><div className="rounded-3xl border border-white/10 bg-slate-900 p-7"><div className="mb-6 flex items-center gap-3"><div className="rounded-2xl bg-cyan-400/10 p-3 text-cyan-300"><Monitor size={24} /></div><div><h2 className="text-xl font-semibold">PCVR</h2><p className="text-sm text-slate-500">PC / Steam Beat Saber</p></div></div><button className="w-full rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4 text-left hover:bg-cyan-400/10"><div className="flex items-center justify-between"><span className="font-semibold">Beat Saber 1.40.8</span><span className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-cyan-200">Current</span></div><div className="mt-2 text-xs text-slate-500">StreamVoice PCVR mod · v0.4.0 release package</div></button><button disabled className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300/40 px-4 py-3 font-semibold text-slate-950/60">Download package <Download size={16} /></button><p className="mt-3 text-center text-xs text-slate-600">PCVR pairing rebuild: v0.4.0 uses a six-character alphanumeric code and GET-only bridge transport. The download package will be linked here when the published mod build is available.</p></div><div className="rounded-3xl border border-white/10 bg-slate-900 p-7"><div className="mb-6 flex items-center gap-3"><div className="rounded-2xl bg-cyan-400/10 p-3 text-cyan-300"><Gamepad2 size={24} /></div><div><h2 className="text-xl font-semibold">Standalone</h2><p className="text-sm text-slate-500">Meta Quest Beat Saber</p></div></div><button className="w-full rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4 text-left hover:bg-cyan-400/10"><div className="flex items-center justify-between"><span className="font-semibold">Beat Saber 1.40.8</span><span className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-cyan-200">Current</span></div><div className="mt-2 text-xs text-slate-500">StreamVoice Standalone mod · Release package</div></button><button disabled className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300/40 px-4 py-3 font-semibold text-slate-950/60">Download package <Download size={16} /></button><p className="mt-3 text-center text-xs text-slate-600">The 1.40.8 release package will be linked here when the standalone build is published.</p></div></div></div></main>
        )}
        <LegalFooter onNavigate={navigate} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3"><button onClick={() => navigate('home')} className="rounded-2xl bg-cyan-400/15 p-2.5 text-cyan-300"><Radio size={22} /></button><button onClick={() => navigate('home')} className="text-left"><div className="text-lg font-semibold tracking-tight">StreamVoice</div><div className="text-xs text-slate-400">Calm TTS + live event control</div></button></div>
          <div className="flex items-center gap-2"><button onClick={() => navigate('home')} className="hidden rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-white/5 sm:block"><Home size={15} className="mr-2 inline" />Home</button><button onClick={() => navigate('downloads')} className="hidden rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-white/5 sm:block"><Download size={15} className="mr-2 inline" />Downloads</button><div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 md:flex"><span className={livePlatforms > 0 ? 'h-2 w-2 rounded-full bg-emerald-400' : 'h-2 w-2 rounded-full bg-slate-600'} />{livePlatforms > 0 ? livePlatforms + ' live' : 'No live platforms'}</div><div className="relative flex items-center gap-2"><span className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-200"><LayoutDashboard size={15} className="mr-2 inline" />Console · {viewerName}</span><button onClick={() => setAccountMenuOpen(value => !value)} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 hover:bg-white/10" aria-label="Account menu"><UserCircle2 size={16} /><ChevronDown size={14} /></button>{accountMenuOpen && <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-white/10 bg-slate-900 p-2 shadow-2xl"><button onClick={() => { setAccountMenuOpen(false); navigate('settings'); }} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-slate-200 hover:bg-white/5"><UserCircle2 size={15} />Account Settings</button><button onClick={() => { setAccountMenuOpen(false); void handleSignOut(); }} className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-rose-200 hover:bg-rose-400/10"><Trash2 size={15} />Log out</button></div>}</div></div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <InfrastructureStatus apiHost={infrastructure.apiHost} apiService={infrastructure.apiService} databaseService={infrastructure.databaseService} />

        <section className="mb-8 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-400/10 via-slate-900 to-slate-900 p-7">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">Streamer Console</p><h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">Lets chat and talk without breaking the mood.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Create a free StreamVoice account to keep your platform connections and Beat Saber settings tied to your account. Connect YouTube, Twitch, and TikTok accounts from one dashboard. TikTok LIVE event features will be added separately when the required TikTok products and permissions are available.</p></div>
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4"><Headphones className="text-cyan-300" /></div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/5 p-4"><div className="text-xs text-slate-400">TTS state</div><div className="mt-1 flex items-center gap-2 font-medium">{ttsEnabled ? <CheckCircle2 size={15} className="text-emerald-300" /> : <CircleAlert size={15} />} {ttsEnabled ? 'Enabled' : 'Paused'}</div></div>
              <div className="rounded-2xl bg-white/5 p-4"><div className="text-xs text-slate-400">Voice</div><div className="mt-1 font-medium">{voice} · {rate.toFixed(1)}×</div></div>
              <div className="rounded-2xl bg-white/5 p-4"><div className="text-xs text-slate-400">Volume</div><div className="mt-1 font-medium">{Math.round(volume * 100)}%</div></div>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-900 p-6">
            <div className="mb-5 flex items-center justify-between"><div><div className="text-sm font-semibold">Quick test</div><div className="text-xs text-slate-400">Check your audio chain</div></div><Volume2 size={18} className="text-cyan-300" /></div>
            <button onClick={testSpeech} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950"><Play size={16} /> Test calm voice</button>
            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-5 text-slate-400">The browser's speech engine handles the live preview and YouTube chat readout.</div>
          </div>
        </section>

        <section className="mb-8">
          <div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-semibold">Platform connections</h2><p className="text-sm text-slate-400">These connections are saved to your StreamVoice account, so your setup follows you when you sign in again.</p></div><Wifi size={18} className="text-slate-500" /></div>
          <div className="grid gap-4 lg:grid-cols-3">
            {(['TikTok', 'YouTube', 'Twitch'] as Platform[]).map(platform => {
              const state = platforms[platform];
              const isYouTube = platform === 'YouTube';
              const isTwitch = platform === 'Twitch';
              return <div key={platform} className="rounded-3xl border border-white/10 bg-slate-900 p-5">
                <div className="mb-4 flex items-start justify-between"><div className="flex items-center gap-3"><div className="rounded-xl bg-white/5 p-2">{isYouTube ? <Youtube size={20} /> : <Radio size={20} />}</div><div><div className="font-medium">{platform}</div><div className="text-xs text-slate-500">{state.channel}</div></div></div><span className={state.live ? 'rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-[11px] text-emerald-300' : 'rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-400'}>{state.live ? 'LIVE' : state.connected ? 'Connected' : 'Offline'}</span></div>
                <div className="mb-4 grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl bg-white/5 p-3"><div className="text-slate-500">Chat TTS</div><div className="mt-1 font-medium">{state.connected ? (readMessages ? 'Ready' : 'Muted') : 'Not connected'}</div></div><div className="rounded-xl bg-white/5 p-3"><div className="text-slate-500">App integration</div><div className="mt-1 font-medium">{isYouTube ? (youtubeConfigured ? 'Ready for all accounts' : 'App setup needed') : isTwitch ? (twitchConfigured ? 'Ready for all accounts' : 'App setup needed') : (tiktokConfigured ? 'Ready for all accounts' : 'App setup needed')}</div></div></div>
                <button onClick={() => isYouTube ? (state.connected ? disconnectYouTube() : connectYouTube()) : isTwitch ? (state.connected ? disconnectTwitch() : connectTwitch()) : (state.connected ? disconnectTikTok() : connectTikTok())} className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium"><Link2 size={15} /> {state.connected ? 'Disconnect' : 'Connect ' + platform}</button>
              </div>;
            })}
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
          <section>
            <div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-semibold">TTS controls</h2><p className="text-sm text-slate-400">Tune the reader for a relaxed stream.</p></div><SlidersHorizontal size={18} className="text-slate-500" /></div>
            <div className="rounded-3xl border border-white/10 bg-slate-900 p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="mb-2 text-xs text-slate-500">Voice</div><select value={voice} onChange={e => { const value = e.target.value; setVoice(value); void saveStreamPreferences({ voice: value }); }} className="w-full bg-transparent text-sm outline-none"><option className="bg-slate-900">Calm</option><option className="bg-slate-900">Neutral</option><option className="bg-slate-900">Warm</option></select></label>
                <label className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="mb-2 text-xs text-slate-500">Source</div><div className="text-sm">Twitch + YouTube + TikTok</div></label>
              </div>
              <div className="mt-5 space-y-4">
                <label className="block rounded-2xl border border-white/10 bg-white/5 p-4"><div className="mb-3 flex justify-between text-sm"><span>Speech rate</span><span className="text-slate-400">{rate.toFixed(2)}×</span></div><input aria-label="Speech rate" className="w-full" type="range" min="0.6" max="1.4" step="0.05" value={rate} onChange={e => { const value = Number(e.target.value); setRate(value); void saveStreamPreferences({ rate: value }); }} /></label>
                <label className="block rounded-2xl border border-white/10 bg-white/5 p-4"><div className="mb-3 flex justify-between text-sm"><span>Volume</span><span className="text-slate-400">{Math.round(volume * 100)}%</span></div><input aria-label="Volume" className="w-full" type="range" min="0" max="1" step="0.01" value={volume} onChange={e => { const value = Number(e.target.value); setVolume(value); void saveStreamPreferences({ volume: value }); }} /></label>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3"><button onClick={() => { const value = !ttsEnabled; setTtsEnabled(value); void saveStreamPreferences({ ttsEnabled: value }); }} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">{ttsEnabled ? 'Pause TTS' : 'Enable TTS'}</button><button onClick={() => { const value = !readMessages; setReadMessages(value); void saveStreamPreferences({ readMessages: value }); }} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">{readMessages ? 'Read chat' : 'Mute chat'}</button><button onClick={() => { const value = !readGifts; setReadGifts(value); void saveStreamPreferences({ readGifts: value }); }} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">{readGifts ? 'Read gifts' : 'Mute gifts'}</button></div>
              <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4"><div className="mb-1 text-sm font-semibold">Automatic chat translation</div><div className="text-xs leading-5 text-slate-400">Translate incoming live chat into one language before it is sent to the Beat Saber in-game chat.</div><div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"><label className="block"><div className="mb-2 text-xs text-slate-500">Preferred language</div><select value={chatLanguage} onChange={e => { setChatLanguage(e.target.value); void saveChatTranslationSettings(chatTranslationEnabled, e.target.value); }} className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm outline-none"><option value="en">English</option>{chatLanguages.filter(item => item.code !== 'en').map(item => <option key={item.code} value={item.code}>{item.label}</option>)}</select></label><button onClick={() => { const next = !chatTranslationEnabled; setChatTranslationEnabled(next); void saveChatTranslationSettings(next, chatLanguage); }} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm">{chatTranslationEnabled ? 'Translation on' : 'Translation off'}</button></div></div>
              <div className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-400/5 p-4"><div className="mb-1 text-sm font-semibold">TTS blocked words</div><div className="text-xs leading-5 text-slate-400">Add words that should prevent the entire message from being spoken. Blocking is case-insensitive, so a blocked word inside a sentence will also stop that message from being read aloud.</div><div className="mt-4 flex gap-2"><input value={blockedWordInput} onChange={e => setBlockedWordInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addBlockedWord(); } }} placeholder="Type a word to block" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm outline-none" /><button onClick={addBlockedWord} className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium">Block word</button></div>{blockedWords.length ? <div className="mt-3 flex flex-wrap gap-2">{blockedWords.map(word => <button key={word} onClick={() => removeBlockedWord(word)} title="Remove blocked word" className="rounded-full border border-white/10 bg-slate-950 px-3 py-1.5 text-xs text-slate-300">{word} ×</button>)}</div> : <div className="mt-3 text-xs text-slate-500">No blocked words yet.</div>}</div>
            </div>
          </section>

          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><div className="flex items-center gap-2"><h2 className="text-lg font-semibold">Chat Center</h2><span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-cyan-300">Unified</span></div><p className="text-sm text-slate-400">One place to watch chat, filter messages, and control TTS.</p></div><Activity size={18} className="text-slate-500" /></div>
            <div className="rounded-3xl border border-white/10 bg-slate-900 p-4">
              <div className="mb-4 grid gap-2 sm:grid-cols-[auto_1fr_auto]"><div className="flex flex-wrap gap-2">{(['All', 'Twitch', 'YouTube', 'TikTok'] as const).map(filter => <button key={filter} onClick={() => setChatFilter(filter)} className={chatFilter === filter ? 'rounded-xl bg-cyan-300 px-3 py-2 text-xs font-semibold text-slate-950' : 'rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300'}>{filter}</button>)}</div><input value={chatSearch} onChange={e => setChatSearch(e.target.value)} placeholder="Search chat…" className="min-w-0 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs outline-none" /><div className="flex gap-2"><button onClick={() => setChat([])} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs">Clear</button><button onClick={() => setModerationPreview(!moderationPreview)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs">{moderationPreview ? 'Moderation on' : 'Moderation off'}</button></div></div>
              <div className="mb-4 grid gap-2 sm:grid-cols-3"><div className="rounded-xl bg-white/5 p-3"><div className="text-[11px] text-slate-500">Messages</div><div className="mt-1 text-sm font-semibold">{chat.length}</div></div><div className="rounded-xl bg-white/5 p-3"><div className="text-[11px] text-slate-500">TTS</div><div className="mt-1 text-sm font-semibold">{ttsEnabled && readMessages ? 'Reading chat' : 'Muted'}</div></div><div className="rounded-xl bg-white/5 p-3"><div className="text-[11px] text-slate-500">Translation</div><div className="mt-1 text-sm font-semibold">{chatTranslationEnabled ? chatLanguage.toUpperCase() : 'Off'}</div></div></div>
              <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">{(() => { const visible = chat.filter(message => (chatFilter === 'All' || message.platform === chatFilter) && (!chatSearch.trim() || message.author.toLowerCase().includes(chatSearch.trim().toLowerCase()) || message.text.toLowerCase().includes(chatSearch.trim().toLowerCase()))); return visible.length ? visible.map(message => <div key={message.id} className="rounded-xl bg-white/5 px-3 py-2.5"><div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-2"><span className="truncate text-xs font-medium text-cyan-200">{message.author}</span><span className="rounded-full border border-white/10 px-1.5 py-0.5 text-[9px] text-slate-500">{message.platform || 'Unknown'}</span></div><span className="text-[10px] text-slate-600">{message.type === 'textMessageEvent' ? 'chat' : message.type}</span></div><div className="mt-1 break-words text-xs text-slate-300">{message.text}</div></div>) : <div className="p-8 text-center text-sm text-slate-500">{chat.length ? 'No messages match your filter.' : platforms.YouTube.live ? 'Waiting for incoming chat…' : 'Connect a platform and go live to populate the Chat Center.'}</div>; })()}</div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-cyan-400/10 bg-cyan-400/5 px-3 py-2.5 text-xs"><span className="text-slate-400">TTS voice: <span className="text-slate-200">{voice}</span> · {rate.toFixed(2)}× · {Math.round(volume * 100)}%</span><button onClick={() => { const value = !ttsEnabled; setTtsEnabled(value); void saveStreamPreferences({ ttsEnabled: value }); }} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs">{ttsEnabled ? 'Pause TTS' : 'Enable TTS'}</button></div>
            </div>
          </section>
        </div>

        <section className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-slate-900 p-6">
            <div className="mb-4 flex items-center justify-between gap-3"><div className="flex items-center gap-3"><ShieldCheck size={18} className="text-cyan-300" /><div><h2 className="font-semibold">StreamVoice Mod Connect</h2><p className="text-sm text-slate-400">Unified in-game chat + stream events for Beat Saber 1.40.8.</p></div></div><span className={beatSaber.connected ? 'rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-[11px] text-emerald-300' : 'rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-400'}>{beatSaber.connected ? 'CONNECTED' : beatSaber.paired ? 'PAIRED · WAITING' : 'NOT PAIRED'}</span></div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-slate-400">The StreamVoice Mod connects Beat Saber to your StreamVoice Console through a secure bridge. Pair the mod with the 6-character code from this console, and once connected it maintains a heartbeat so the console can see the mod is online. The bridge carries in-game chat, TTS, platform events, and BSR requests between StreamVoice and Beat Saber.</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-white/5 p-4"><div className="text-xs text-slate-500">Protocol</div><div className="mt-1 text-sm font-medium">{beatSaber.protocol || 'streamvoice-bs/1'}</div></div><div className="rounded-2xl bg-white/5 p-4"><div className="text-xs text-slate-500">Target</div><div className="mt-1 text-sm font-medium">{beatSaber.gameVersion || 'Beat Saber 1.40.8'}</div></div><div className="rounded-2xl bg-white/5 p-4"><div className="text-xs text-slate-500">Last heartbeat</div><div className="mt-1 text-sm font-medium">{beatSaber.lastSeen ? new Date(beatSaber.lastSeen).toLocaleTimeString() : 'Waiting for mod'}</div></div></div>
            
            {beatSaberToken && <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4"><div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Beat Saber pairing code</div><div className="mt-2 font-mono text-3xl font-bold tracking-[0.35em] text-slate-100">{beatSaberToken}</div><div className="mt-2 text-xs text-slate-500">Enter this 6-character letters/numbers code in the StreamVoice Beat Saber mod. Regenerating the pairing invalidates the previous code.</div></div>}
            <div className="mt-4 flex flex-wrap gap-2"><button onClick={beatSaber.paired ? unpairBeatSaber : pairBeatSaber} className="rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950">{beatSaber.paired ? 'Regenerate pairing' : 'Pair StreamVoice Mod'}</button>{beatSaber.paired && <><button onClick={testBeatSaber} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium">Test BSR</button><button onClick={testBeatSaberChat} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium">Test Chat</button></>}</div>
            {beatSaber.paired && <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4"><div className="text-sm font-semibold">Beat Saber chatbox test</div><div className="mt-1 text-xs text-slate-400">Type a message here and it will appear in the StreamVoice in-game chat. Type <span className="font-mono text-cyan-200">!bsr 12345</span> to test the BSR event path.</div><div className="mt-3 flex gap-2"><input value={beatSaberChatInput} onChange={e => setBeatSaberChatInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void sendBeatSaberConsoleChat(); } }} placeholder="Type a test chat message…" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950 px-3 py-2.5 text-sm outline-none" /><button onClick={() => void sendBeatSaberConsoleChat()} className="rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950">Send to Beat Saber</button></div></div>}
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex items-center justify-between"><div><div className="text-sm font-semibold">Requested songs</div><div className="text-xs text-slate-500">The same queue the Beat Saber mod shows in-game.</div></div><button onClick={refreshBsrRequests} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs">Refresh</button></div><div className="mt-3 space-y-2">{bsrRequests.length ? bsrRequests.map(request => <div key={request.id} className="rounded-xl bg-white/5 px-3 py-2 text-xs"><div className="font-medium text-cyan-200">{request.song || 'BSR ' + request.code}{request.artist ? ' — ' + request.artist : ''}</div><div className="mt-1 text-slate-500">{request.code} · requested by {request.viewer} · {request.source}</div></div>) : <div className="py-4 text-center text-xs text-slate-500">No BSR requests yet.</div>}</div></div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-900 p-6">
            <div className="mb-4 flex items-center gap-3"><Bell size={18} className="text-cyan-300" /><div><h2 className="font-semibold">Event log</h2><p className="text-sm text-slate-400">Recent control activity.</p></div></div>
            <div className="space-y-2">{events.map((event, index) => <div key={index} className="rounded-xl bg-white/5 px-3 py-2 text-xs text-slate-300">{event}</div>)}</div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex items-center gap-3"><Music2 size={18} className="text-slate-500" /><div><h2 className="text-lg font-semibold">Sound events</h2><p className="text-sm text-slate-400">Per-platform audio actions.</p></div></div>
          <div className="grid gap-4 lg:grid-cols-3">
            {(['TikTok', 'YouTube', 'Twitch'] as Platform[]).map(platform => {
              const kinds = platform === 'TikTok' ? (['gift', 'follow', 'live'] as const) : (['follow', 'live'] as const);
              return <div key={platform} className="rounded-3xl border border-white/10 bg-slate-900 p-5"><div className="mb-4 font-medium">{platform}</div><div className="space-y-3">{kinds.map(kind => <div key={kind} className="rounded-2xl bg-white/5 p-3"><div className="mb-2 flex items-center justify-between text-xs"><span className="capitalize text-slate-300">{kind}</span><button onClick={() => playEventSound(platform, kind)} className="text-cyan-300">Preview</button></div><label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-slate-300"><Upload size={14} /><span className="truncate">{sounds[platform][kind]}</span><input className="hidden" type="file" accept="audio/*" onChange={e => handleAudioUpload(platform, kind, e.target.files?.[0])} /></label></div>)}</div></div>;
            })}
          </div>
        </section>
      </main>
      <LegalFooter onNavigate={navigate} />
    </div>
  );
}

function App() {
  if (window.location.hostname === 'admin.streamvoice.me') return <DeveloperDashboard />;
  return <StreamVoiceApp />;
}

export default App;