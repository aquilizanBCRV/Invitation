import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import {
  Leaf, LogOut, Edit3, Copy, Check, Users,
  ChevronDown, ChevronUp, Save, Plus, Trash2,
  Eye, EyeOff, Link, Shield, BookOpen, Heart,
  Calendar, Phone, AlertCircle, Lock, Upload, Music, Image, X
} from 'lucide-react';

// ─── SANITIZE — strips XSS / injection attempts ──────────────
function sanitize(value) {
  if (typeof value !== 'string') return value;
  return value
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script injections
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    // Remove SQL injection patterns
    .replace(/(['";])\s*(--|#|\/\*)/g, '')
    .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|EXEC|UNION|SCRIPT)\b/gi, '')
    // Trim
    .trim();
}

function sanitizeObject(obj) {
  const clean = {};
  for (const key in obj) {
    clean[key] = typeof obj[key] === 'string' ? sanitize(obj[key]) : obj[key];
  }
  return clean;
}

// ─── SUPABASE STORAGE UPLOAD HELPER ──────────────────────────
const STORAGE_BUCKET = 'wedding-assets'; // create this bucket in Supabase Storage

async function uploadFile(file, folder, oldPath) {
  // Delete old file if exists
  if (oldPath) {
    const oldKey = oldPath.split(`${STORAGE_BUCKET}/`).pop();
    if (oldKey) await supabase.storage.from(STORAGE_BUCKET).remove([oldKey]);
  }

  const ext      = file.name.split('.').pop().toLowerCase();
  const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(fileName, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) { console.error('Upload error:', error); return null; }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}

// ─── CRYPTO HELPERS ───────────────────────────────────────────
async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateRawKey() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── URL ACCESS VALIDATOR (hash-based) ────────────────────────
async function getAccessFromURL() {
  const params  = new URLSearchParams(window.location.search);
  const rawKey  = params.get('key');
  if (!rawKey) return null;

  const hash = await sha256(rawKey);

  const { data, error } = await supabase
    .from('access_keys')
    .select('*')
    .eq('key_hash', hash)
    .eq('is_active', true)
    .single();

  if (error || !data) return null;

  // Check expiry
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    await supabase.from('access_keys').update({ is_active: false }).eq('id', data.id);
    return null;
  }

  // Check max uses
  if (data.max_uses !== null && data.use_count >= data.max_uses) {
    await supabase.from('access_keys').update({ is_active: false }).eq('id', data.id);
    return null;
  }

  // Increment use count
  await supabase.from('access_keys').update({ use_count: data.use_count + 1 }).eq('id', data.id);

  return data.role; // 'viewer' | 'editor'
}

// ─── MAIN ─────────────────────────────────────────────────────
// ─── SESSION CONFIG ───────────────────────────────────────────
const SESSION_KEY     = 'wedding_admin_session';
const AUTO_LOGOUT_MS  = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

function saveSession(role) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({
    role,
    loginTime: Date.now(),
  }));
}

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { role, loginTime } = JSON.parse(raw);
    // Check if session has expired
    if (Date.now() - loginTime > AUTO_LOGOUT_MS) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return role;
  } catch {
    return null;
  }
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

// ─── MAIN COMPONENT ───────────────────────────────────────────
export default function AdminPortal() {
  const [auth, setAuth]                 = useState(() => loadSession()); // restore on refresh
  const [loginUser, setLoginUser]       = useState('');
  const [loginPass, setLoginPass]       = useState('');
  const [showPass, setShowPass]         = useState(false);
  const [loginError, setLoginError]     = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [logoutModal, setLogoutModal]   = useState(false);
  const [acronym, setAcronym]           = useState('N & C');
  const [sessionExpiredModal, setSessionExpiredModal] = useState(false);
  const autoLogoutTimer = useRef(null);

  // Load acronym from DB
  useEffect(() => {
    supabase.from('couple_info').select('groom_last_name, bride_last_name').single()
      .then(({ data }) => {
        if (data?.groom_last_name && data?.bride_last_name) {
          setAcronym(`${data.groom_last_name.charAt(0).toUpperCase()} & ${data.bride_last_name.charAt(0).toUpperCase()}`);
        }
      });
  }, []);

  // Check URL access key on load
  useEffect(() => {
    async function checkURL() {
      const urlAccess = await getAccessFromURL();
      if (urlAccess && !auth) setAuth(urlAccess);
    }
    checkURL();
  }, []);

  // Set up auto-logout timer whenever auth changes
  useEffect(() => {
    if (autoLogoutTimer.current) clearTimeout(autoLogoutTimer.current);

    if (auth) {
      // Calculate remaining time based on saved session login time
      const raw = sessionStorage.getItem(SESSION_KEY);
      let remaining = AUTO_LOGOUT_MS;
      if (raw) {
        try {
          const { loginTime } = JSON.parse(raw);
          remaining = AUTO_LOGOUT_MS - (Date.now() - loginTime);
        } catch {}
      }

      autoLogoutTimer.current = setTimeout(() => {
        clearSession();
        setAuth(null);
        setSessionExpiredModal(true);
      }, Math.max(remaining, 0));
    }

    return () => clearTimeout(autoLogoutTimer.current);
  }, [auth]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    const { data, error } = await supabase
      .from('admin_users')
      .select('role')
      .eq('username', loginUser)
      .eq('password', loginPass)
      .single();
    setLoginLoading(false);
    if (error || !data) { setLoginError('Invalid username or password.'); return; }
    saveSession(data.role);
    setAuth(data.role);
  };

  const handleLogout = () => {
    clearSession();
    setAuth(null);
    setLoginUser('');
    setLoginPass('');
    setLogoutModal(false);
    window.history.replaceState({}, '', window.location.pathname);
  };

  // Session expired modal
  if (sessionExpiredModal) return (
    <div className="min-h-screen bg-[#f4f2eb] flex items-center justify-center px-4 font-montserrat">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Montserrat:wght@300;400;500;600&display=swap');.font-cinzel{font-family:'Cinzel',serif}.font-montserrat{font-family:'Montserrat',sans-serif}`}</style>
      <div className="w-full max-w-md bg-white/60 backdrop-blur-sm border border-[#2c3e34]/10 rounded-[28px] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.06)] text-center">
        <div className="w-14 h-14 rounded-full bg-[#f4f2eb] flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6 text-[#8a6e2f]"/>
        </div>
        <h3 className="font-cinzel text-2xl text-[#2c3e34] mb-2">Session Expired</h3>
        <p className="text-sm text-[#2c3e34]/60 leading-relaxed mb-6">
          Your session has expired after 4 hours of inactivity. Please sign in again to continue.
        </p>
        <button onClick={() => setSessionExpiredModal(false)}
          className="w-full py-3 bg-[#2c3e34] text-white text-[11px] uppercase tracking-widest rounded-xl hover:bg-[#8a6e2f] transition">
          Sign In Again
        </button>
      </div>
    </div>
  );

  if (!auth) return (
    <LoginPage
      loginUser={loginUser}   setLoginUser={setLoginUser}
      loginPass={loginPass}   setLoginPass={setLoginPass}
      showPass={showPass}     setShowPass={setShowPass}
      loginError={loginError} onLogin={handleLogin}
      loading={loginLoading}  acronym={acronym}
    />
  );

  return (
    <DashboardPage
      auth={auth}
      acronym={acronym}
      onLogoutRequest={() => setLogoutModal(true)}
      logoutModal={logoutModal}
      onLogoutConfirm={handleLogout}
      onLogoutCancel={() => setLogoutModal(false)}
    />
  );
}

// ─── LOGIN ────────────────────────────────────────────────────
function LoginPage({ loginUser, setLoginUser, loginPass, setLoginPass, showPass, setShowPass, loginError, onLogin, loading, acronym }) {
  return (
    <div className="min-h-screen bg-[#f4f2eb] flex items-center justify-center px-4 font-montserrat relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Montserrat:wght@300;400;500;600&display=swap');
        .font-cinzel{font-family:'Cinzel',serif}.font-montserrat{font-family:'Montserrat',sans-serif}
      `}</style>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#2c3e34]/5 via-transparent to-transparent"/>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-[#c29f53]/5 via-transparent to-transparent"/>
      </div>
      <Leaf className="absolute top-12 left-12 w-24 h-24 text-[#2c3e34] opacity-5 -rotate-45"/>
      <Leaf className="absolute bottom-12 right-12 w-32 h-32 text-[#8a6e2f] opacity-5 rotate-[135deg]"/>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="w-10 h-[1px] bg-[#8a6e2f]/40"/>
            <p className="text-[10px] uppercase tracking-[0.45em] text-[#8a6e2f]">Admin Portal</p>
            <span className="w-10 h-[1px] bg-[#8a6e2f]/40"/>
          </div>
          <h1 className="font-cinzel text-4xl text-[#2c3e34] mb-2">{acronym}</h1>
          <p className="text-xs text-[#2c3e34]/50 tracking-widest uppercase">Wedding Management</p>
        </div>

        <div className="bg-white/60 backdrop-blur-sm border border-[#2c3e34]/10 rounded-[28px] p-8 shadow-[0_10px_40px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Shield className="w-4 h-4 text-[#8a6e2f]"/>
            <h2 className="font-cinzel text-xl text-[#2c3e34]">Sign In</h2>
          </div>
          <form onSubmit={onLogin} className="flex flex-col gap-5">
            <div>
              <label className="text-[10px] uppercase tracking-[0.3em] text-[#8a6e2f] mb-2 block">Username</label>
              <input type="text" value={loginUser} onChange={e => setLoginUser(e.target.value)} placeholder="CMRO_admin" required
                className="w-full bg-[#f4f2eb] border border-[#2c3e34]/10 rounded-xl px-4 py-3 text-sm text-[#2c3e34] placeholder:text-[#2c3e34]/30 focus:outline-none focus:border-[#8a6e2f]/50 transition"/>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.3em] text-[#8a6e2f] mb-2 block">Password</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} value={loginPass} onChange={e => setLoginPass(e.target.value)} placeholder="••••••••" required
                  className="w-full bg-[#f4f2eb] border border-[#2c3e34]/10 rounded-xl px-4 py-3 text-sm text-[#2c3e34] placeholder:text-[#2c3e34]/30 focus:outline-none focus:border-[#8a6e2f]/50 transition pr-11"/>
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2c3e34]/40 hover:text-[#8a6e2f] transition">
                  {showPass ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                </button>
              </div>
            </div>
            {loginError && (
              <div className="flex items-center gap-2 text-red-500">
                <AlertCircle className="w-4 h-4 shrink-0"/>
                <p className="text-[11px] tracking-wide">{loginError}</p>
              </div>
            )}
            <button type="submit" disabled={loading}
              className="mt-2 w-full bg-[#2c3e34] text-white py-3 rounded-xl text-[11px] uppercase tracking-[0.3em] hover:bg-[#8a6e2f] transition-all duration-300 disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
        <p className="text-center text-[10px] text-[#2c3e34]/30 mt-6 tracking-widest uppercase">Authorized personnel only</p>
      </div>
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────
function DashboardPage({ auth, acronym, onLogoutRequest, logoutModal, onLogoutConfirm, onLogoutCancel }) {
  const [activeSection, setActiveSection] = useState('couple');
  const canEdit = auth === 'admin' || auth === 'editor';

  const navItems = [
    { id: 'couple',    label: 'Couple Info',    icon: Heart },
    { id: 'event',     label: 'Event Details',  icon: Calendar },
    { id: 'contact',   label: 'Contact & RSVP', icon: Phone },
    { id: 'story',     label: 'Love Story',     icon: BookOpen },
    { id: 'entourage', label: 'Entourage',      icon: Users },
    { id: 'sponsors',  label: 'Sponsors',       icon: Leaf },
    { id: 'roles',     label: 'Special Roles',  icon: Shield },
    { id: 'reminders', label: 'Fundamentals',   icon: Edit3 },
    ...(auth === 'admin' ? [{ id: 'access', label: 'Access Links', icon: Link }] : []),
  ];

  return (
    <div className="min-h-screen bg-[#f4f2eb] font-montserrat text-[#2c3e34] relative">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Montserrat:wght@300;400;500;600&display=swap');
        .font-cinzel{font-family:'Cinzel',serif}.font-montserrat{font-family:'Montserrat',sans-serif}
        .scrollbar-hide::-webkit-scrollbar{display:none}
      `}</style>
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#2c3e34]/5 via-transparent to-transparent"/>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-[#c29f53]/5 via-transparent to-transparent"/>
      </div>

      {/* NAVBAR */}
      <nav className="relative z-30 max-w-7xl mx-auto w-full flex justify-between items-center py-4 px-4 md:px-6 border-b border-[#2c3e34]/10">
        <div className="flex items-center gap-3">
          <h1 className="font-cinzel text-xl md:text-2xl tracking-[0.2em]">{acronym}</h1>
          <span className="text-[9px] uppercase tracking-widest text-[#8a6e2f] border border-[#8a6e2f]/30 px-2 py-1 rounded-full">
            {auth === 'admin' ? 'Admin' : auth === 'editor' ? 'Editor' : 'Viewer'}
          </span>
        </div>
        {auth !== 'viewer' && (
          <button onClick={onLogoutRequest} className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#2c3e34]/60 hover:text-[#8a6e2f] transition">
            <LogOut className="w-4 h-4"/><span className="hidden md:inline">Logout</span>
          </button>
        )}
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 pb-20 pt-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-4 mb-3">
            <span className="w-12 h-[1px] bg-[#8a6e2f]/40"/>
            <p className="text-[10px] uppercase tracking-[0.45em] text-[#8a6e2f]">Wedding Management</p>
            <span className="w-12 h-[1px] bg-[#8a6e2f]/40"/>
          </div>
          <h2 className="font-cinzel text-3xl md:text-4xl text-[#2c3e34]">Content Dashboard</h2>
          <p className="text-xs text-[#2c3e34]/50 mt-2">
            {canEdit ? 'You can view and edit all wedding content below.' : 'You have view-only access to the wedding content.'}
          </p>
        </div>

        {/* Nav Tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 mb-8">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveSection(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] uppercase tracking-widest whitespace-nowrap transition-all duration-300 shrink-0
                ${activeSection === id ? 'bg-[#2c3e34] text-white shadow-lg' : 'bg-white/60 border border-[#2c3e34]/10 text-[#2c3e34]/70 hover:border-[#8a6e2f]/30 hover:text-[#8a6e2f]'}`}>
              <Icon className="w-3 h-3"/>{label}
            </button>
          ))}
        </div>

        {/* Sections */}
        {activeSection === 'couple'    && <CoupleSection       canEdit={canEdit}/>}
        {activeSection === 'event'     && <EventSection        canEdit={canEdit}/>}
        {activeSection === 'contact'   && <ContactSection      canEdit={canEdit}/>}
        {activeSection === 'story'     && <StorySection        canEdit={canEdit}/>}
        {activeSection === 'entourage' && <EntourageSection    canEdit={canEdit}/>}
        {activeSection === 'sponsors'  && <SponsorsSection     canEdit={canEdit}/>}
        {activeSection === 'roles'     && <RolesSection        canEdit={canEdit}/>}
        {activeSection === 'reminders' && <FundamentalsSection canEdit={canEdit}/>}
        {activeSection === 'access'    && auth === 'admin' && <AccessSection/>}
      </div>

      {/* Logout Modal */}
      {logoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2c3e34]/60 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#fdfbf7] p-8 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-[#8a6e2f]/30">
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#8a6e2f]/30"/>
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[#8a6e2f]/30"/>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-[#f4f2eb] flex items-center justify-center mx-auto mb-4">
                <LogOut className="w-6 h-6 text-[#8a6e2f]"/>
              </div>
              <h3 className="font-cinzel text-2xl text-[#2c3e34] mb-2">Leaving So Soon?</h3>
              <p className="text-sm text-[#2c3e34]/60 leading-relaxed mb-8">
                You're about to sign out of the wedding admin portal. Any unsaved changes will be lost. Are you sure you want to log out?
              </p>
              <div className="flex gap-3">
                <button onClick={onLogoutCancel} className="flex-1 py-3 border border-[#2c3e34]/20 text-[#2c3e34] text-[11px] uppercase tracking-widest rounded-xl hover:bg-[#2c3e34]/5 transition">
                  Stay
                </button>
                <button onClick={onLogoutConfirm} className="flex-1 py-3 bg-[#2c3e34] text-white text-[11px] uppercase tracking-widest rounded-xl hover:bg-[#8a6e2f] transition">
                  Yes, Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SHARED COMPONENTS ────────────────────────────────────────
function SectionCard({ title, subtitle, children }) {
  return (
    <div className="bg-white/60 backdrop-blur-sm border border-[#2c3e34]/10 rounded-[28px] p-6 md:p-8 shadow-[0_10px_40px_rgba(0,0,0,0.06)]">
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-[0.35em] text-[#8a6e2f] mb-1">Edit Section</p>
        <h3 className="font-cinzel text-2xl text-[#2c3e34]">{title}</h3>
        {subtitle && <p className="text-xs text-[#2c3e34]/50 mt-1">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, canEdit, type = 'text', multiline = false, rows = 3, maxLength = 500 }) {
  const cls = "w-full bg-[#f4f2eb] border border-[#2c3e34]/10 rounded-xl px-4 py-3 text-sm text-[#2c3e34] placeholder:text-[#2c3e34]/30 focus:outline-none focus:border-[#8a6e2f]/50 transition disabled:opacity-60 disabled:cursor-not-allowed";

  const handleChange = (raw) => {
    const cleaned = sanitize(raw);
    onChange(cleaned.slice(0, maxLength));
  };

  return (
    <div>
      <label className="text-[10px] uppercase tracking-[0.3em] text-[#8a6e2f] mb-2 block">{label}</label>
      {multiline
        ? <textarea rows={rows} value={value} onChange={e => handleChange(e.target.value)} disabled={!canEdit} maxLength={maxLength} className={cls + " resize-none"}/>
        : <input type={type} value={value} onChange={e => handleChange(e.target.value)} disabled={!canEdit} maxLength={maxLength} className={cls}/>}
      {canEdit && (
        <p className="text-[9px] text-[#2c3e34]/30 text-right mt-1 tracking-wide">
          {String(value || '').length}/{maxLength}
        </p>
      )}
    </div>
  );
}

// ─── FILE UPLOAD FIELD ────────────────────────────────────────
function FileUploadField({ label, currentUrl, onUploaded, canEdit, accept = 'image/*', folder = 'images' }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview]     = useState(currentUrl || '');
  const [error, setError]         = useState('');
  const inputRef = useRef(null);

  useEffect(() => { setPreview(currentUrl || ''); }, [currentUrl]);

  const ALLOWED_IMAGE = ['jpg','jpeg','png','webp','gif'];
  const ALLOWED_AUDIO = ['mp3','wav','ogg','m4a'];
  const isAudio       = accept.includes('audio');

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError('');

    const ext = file.name.split('.').pop().toLowerCase();
    const allowed = isAudio ? ALLOWED_AUDIO : ALLOWED_IMAGE;

    if (!allowed.includes(ext)) {
      setError(`Only ${allowed.join(', ')} files are allowed.`);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File must be under 10MB.');
      return;
    }

    setUploading(true);
    const url = await uploadFile(file, folder, currentUrl);
    setUploading(false);

    if (url) {
      setPreview(url);
      onUploaded(url);
    } else {
      setError('Upload failed. Please try again.');
    }
  };

  return (
    <div>
      <label className="text-[10px] uppercase tracking-[0.3em] text-[#8a6e2f] mb-2 block">{label}</label>

      {/* Preview */}
      {preview && (
        <div className="mb-3 relative group rounded-xl overflow-hidden border border-[#2c3e34]/10 bg-[#f4f2eb]">
          {isAudio ? (
            <div className="flex items-center gap-3 px-4 py-3">
              <Music className="w-5 h-5 text-[#8a6e2f] shrink-0"/>
              <p className="text-xs text-[#2c3e34]/60 truncate">{preview.split('/').pop()}</p>
            </div>
          ) : (
            <img src={preview} alt={label} className="w-full h-40 object-cover"/>
          )}
          {canEdit && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
              <p className="text-white text-xs tracking-widest uppercase">Click below to replace</p>
            </div>
          )}
        </div>
      )}

      {canEdit && (
        <>
          <input ref={inputRef} type="file" accept={accept} onChange={handleFile} className="hidden"/>
          <button onClick={() => inputRef.current?.click()} disabled={uploading}
            className="flex items-center gap-2 w-full justify-center px-4 py-3 border border-dashed border-[#8a6e2f]/40 rounded-xl text-[11px] uppercase tracking-widest text-[#8a6e2f] hover:bg-[#8a6e2f]/5 hover:border-[#8a6e2f] transition disabled:opacity-50">
            {uploading
              ? 'Uploading...'
              : <>{isAudio ? <Music className="w-3.5 h-3.5"/> : <Image className="w-3.5 h-3.5"/>} {preview ? 'Replace File' : 'Upload File'}</>}
          </button>
          {error && <p className="text-[11px] text-red-500 mt-2 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{error}</p>}
        </>
      )}
    </div>
  );
}

function SaveButton({ onClick, saving, saved }) {
  return (
    <button onClick={onClick} disabled={saving}
      className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[11px] uppercase tracking-widest transition-all duration-300 disabled:opacity-50
        ${saved ? 'bg-green-600 text-white' : 'bg-[#2c3e34] text-white hover:bg-[#8a6e2f]'}`}>
      {saved ? <><Check className="w-4 h-4"/> Saved!</> : saving ? 'Saving...' : <><Save className="w-4 h-4"/> Save Changes</>}
    </button>
  );
}

function AddButton({ onClick, label = 'Add New' }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-dashed border-[#8a6e2f]/50 text-[#8a6e2f] text-[10px] uppercase tracking-widest hover:bg-[#8a6e2f]/5 hover:border-[#8a6e2f] transition-all duration-300">
      <Plus className="w-3.5 h-3.5"/> {label}
    </button>
  );
}

// ─── COUPLE SECTION ───────────────────────────────────────────
function CoupleSection({ canEdit }) {
  const [data, setData]     = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  useEffect(() => {
    supabase.from('couple_info').select('*').single().then(({ data }) => data && setData(data));
  }, []);

  const set = key => val => setData(p => ({ ...p, [key]: val }));

  const save = async () => {
    setSaving(true);
    await supabase.from('couple_info').update(sanitizeObject(data)).eq('id', data.id);
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <SectionCard title="Couple Info" subtitle="Full names, tagline, images, and invitation text">
      {/* Groom */}
      <p className="text-[10px] uppercase tracking-[0.35em] text-[#8a6e2f] mb-3 mt-1 flex items-center gap-2">
        <span className="w-6 h-[1px] bg-[#8a6e2f]/40 inline-block"/> Groom
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <Field label="First Name"  value={data.groom_first_name  || ''} onChange={set('groom_first_name')}  canEdit={canEdit} maxLength={100}/>
        <Field label="Middle Name" value={data.groom_middle_name || ''} onChange={set('groom_middle_name')} canEdit={canEdit} maxLength={100}/>
        <Field label="Last Name"   value={data.groom_last_name   || ''} onChange={set('groom_last_name')}   canEdit={canEdit} maxLength={100}/>
      </div>

      {/* Bride */}
      <p className="text-[10px] uppercase tracking-[0.35em] text-[#8a6e2f] mb-3 flex items-center gap-2">
        <span className="w-6 h-[1px] bg-[#8a6e2f]/40 inline-block"/> Bride
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <Field label="First Name"  value={data.bride_first_name  || ''} onChange={set('bride_first_name')}  canEdit={canEdit} maxLength={100}/>
        <Field label="Middle Name" value={data.bride_middle_name || ''} onChange={set('bride_middle_name')} canEdit={canEdit} maxLength={100}/>
        <Field label="Last Name"   value={data.bride_last_name   || ''} onChange={set('bride_last_name')}   canEdit={canEdit} maxLength={100}/>
      </div>

      {/* Acronym Preview */}
      <div className="mb-6 p-4 bg-[#f4f2eb] rounded-2xl border border-[#8a6e2f]/20 flex items-center gap-4">
        <p className="text-[10px] uppercase tracking-widest text-[#8a6e2f]">Acronym Preview</p>
        <p className="font-cinzel text-2xl text-[#2c3e34]">
          {data.groom_last_name?.charAt(0)?.toUpperCase() || 'G'} & {data.bride_last_name?.charAt(0)?.toUpperCase() || 'B'}
        </p>
        <p className="text-[10px] text-[#2c3e34]/40 tracking-widest">— used in both portals</p>
      </div>

      {/* Text fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <Field label="Subtitle"         value={data.subtitle || ''}         onChange={set('subtitle')}         canEdit={canEdit} maxLength={150}/>
        <Field label="Tagline"          value={data.tagline || ''}          onChange={set('tagline')}          canEdit={canEdit} maxLength={150}/>
        <Field label="Invitation Title" value={data.invitation_title || ''} onChange={set('invitation_title')} canEdit={canEdit} maxLength={200}/>
        <div className="md:col-span-2">
          <Field label="Invitation Body" value={data.invitation_body || ''} onChange={set('invitation_body')} canEdit={canEdit} multiline rows={3} maxLength={1000}/>
        </div>
      </div>

      {/* File uploads */}
      <p className="text-[10px] uppercase tracking-[0.35em] text-[#8a6e2f] mb-4 flex items-center gap-2">
        <span className="w-6 h-[1px] bg-[#8a6e2f]/40 inline-block"/> Media Files
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <FileUploadField
          label="Primary Image"
          currentUrl={data.image_primary}
          onUploaded={url => setData(p => ({ ...p, image_primary: url }))}
          canEdit={canEdit}
          accept="image/*"
          folder="images"
        />
        <FileUploadField
          label="Secondary Image"
          currentUrl={data.image_secondary}
          onUploaded={url => setData(p => ({ ...p, image_secondary: url }))}
          canEdit={canEdit}
          accept="image/*"
          folder="images"
        />
        <FileUploadField
          label="Background Music"
          currentUrl={data.music_path}
          onUploaded={url => setData(p => ({ ...p, music_path: url }))}
          canEdit={canEdit}
          accept="audio/*"
          folder="music"
        />
      </div>
      {canEdit && <div className="mt-6 flex justify-end"><SaveButton onClick={save} saving={saving} saved={saved}/></div>}
    </SectionCard>
  );
}

// ─── EVENT SECTION ────────────────────────────────────────────
function EventSection({ canEdit }) {
  const [data, setData]     = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  useEffect(() => {
    supabase.from('event_details').select('*').single().then(({ data }) => data && setData(data));
  }, []);

  const set = key => val => setData(p => ({ ...p, [key]: val }));

  const save = async () => {
    setSaving(true);
    await supabase.from('event_details').update(sanitizeObject(data)).eq('id', data.id);
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <SectionCard title="Event Details" subtitle="Date, venue, attire, and map links">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Event Date"      value={data.event_date || ''}      onChange={set('event_date')}      canEdit={canEdit}/>
        <Field label="Event Time"      value={data.event_time || ''}      onChange={set('event_time')}      canEdit={canEdit}/>
        <Field label="Program Start"   value={data.program_start || ''}   onChange={set('program_start')}   canEdit={canEdit}/>
        <Field label="Attire"          value={data.attire || ''}          onChange={set('attire')}          canEdit={canEdit}/>
        <Field label="Attire Note"     value={data.attire_note || ''}     onChange={set('attire_note')}     canEdit={canEdit}/>
        <Field label="Venue"           value={data.venue || ''}           onChange={set('venue')}           canEdit={canEdit}/>
        <div className="md:col-span-2">
          <Field label="Venue Address" value={data.venue_address || ''}   onChange={set('venue_address')}   canEdit={canEdit}/>
        </div>
        <div className="md:col-span-2">
          <Field label="Maps URL"      value={data.maps_url || ''}        onChange={set('maps_url')}        canEdit={canEdit}/>
        </div>
        <div className="md:col-span-2">
          <Field label="Global Maps URL" value={data.global_maps_url || ''} onChange={set('global_maps_url')} canEdit={canEdit}/>
        </div>
        <Field label="Facebook Page"   value={data.facebook_page || ''}   onChange={set('facebook_page')}   canEdit={canEdit}/>
        <div className="md:col-span-2">
          <Field label="Map Embed URL" value={data.map_embed || ''} onChange={set('map_embed')} canEdit={canEdit} multiline/>
        </div>
      </div>
      {canEdit && <div className="mt-6 flex justify-end"><SaveButton onClick={save} saving={saving} saved={saved}/></div>}
    </SectionCard>
  );
}

// ─── CONTACT SECTION ─────────────────────────────────────────
function ContactSection({ canEdit }) {
  const [data, setData]     = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  useEffect(() => {
    supabase.from('contact_info').select('*').single().then(({ data }) => data && setData(data));
  }, []);

  const set = key => val => setData(p => ({ ...p, [key]: val }));

  const save = async () => {
    setSaving(true);
    await supabase.from('contact_info').update(sanitizeObject(data)).eq('id', data.id);
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <SectionCard title="Contact & RSVP" subtitle="Phone, email, Facebook, and deadline">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Phone"         value={data.phone || ''}         onChange={set('phone')}         canEdit={canEdit}/>
        <Field label="RSVP Deadline" value={data.rsvp_deadline || ''} onChange={set('rsvp_deadline')} canEdit={canEdit}/>
        <Field label="Facebook Name" value={data.facebook_name || ''} onChange={set('facebook_name')} canEdit={canEdit}/>
        <Field label="Email"         value={data.email || ''}         onChange={set('email')}         canEdit={canEdit} type="email"/>
      </div>
      {canEdit && <div className="mt-6 flex justify-end"><SaveButton onClick={save} saving={saving} saved={saved}/></div>}
    </SectionCard>
  );
}

// ─── LOVE STORY — single textarea ────────────────────────────
function StorySection({ canEdit }) {
  const [id, setId]         = useState(null);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  useEffect(() => {
    supabase.from('love_story').select('*').single()
      .then(({ data }) => { if (data) { setId(data.id); setContent(data.content); } });
  }, []);

  const save = async () => {
    setSaving(true);
    if (id) {
      await supabase.from('love_story').update({ content }).eq('id', id);
    } else {
      const { data } = await supabase.from('love_story').insert({ content }).select().single();
      if (data) setId(data.id);
    }
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <SectionCard title="Love Story" subtitle="Write the full love story — use Enter for new paragraphs">
      <div className="relative">
        <textarea
          rows={14}
          value={content}
          onChange={e => setContent(e.target.value)}
          disabled={!canEdit}
          placeholder="Write your love story here..."
          className="w-full bg-[#f4f2eb] border border-[#2c3e34]/10 rounded-2xl px-5 py-4 text-sm text-[#2c3e34] leading-relaxed placeholder:text-[#2c3e34]/30 focus:outline-none focus:border-[#8a6e2f]/50 transition disabled:opacity-60 disabled:cursor-not-allowed resize-none"
        />
        <div className="absolute bottom-3 right-4 text-[10px] text-[#2c3e34]/30 tracking-widest">
          {content.length} chars
        </div>
      </div>
      {canEdit && <div className="mt-4 flex justify-end"><SaveButton onClick={save} saving={saving} saved={saved}/></div>}
    </SectionCard>
  );
}

// ─── ENTOURAGE SECTION ────────────────────────────────────────
function EntourageSection({ canEdit }) {
  const [groups, setGroups]       = useState([]);
  const [members, setMembers]     = useState([]);
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [openGroup, setOpenGroup] = useState(null);

  useEffect(() => {
    supabase.from('entourage_groups').select('*').order('display_order').then(({ data }) => data && setGroups(data));
    supabase.from('entourage_members').select('*').order('member_order').then(({ data }) => data && setMembers(data));
  }, []);

  const updateMember = (id, val) => setMembers(m => m.map(x => x.id === id ? { ...x, full_name: val } : x));

  const addMember = async (groupId) => {
    const count = members.filter(m => m.group_id === groupId).length;
    const { data } = await supabase.from('entourage_members')
      .insert({ group_id: groupId, full_name: 'New Member', member_order: count + 1 }).select().single();
    if (data) setMembers(m => [...m, data]);
  };

  const deleteMember = async (id) => {
    await supabase.from('entourage_members').delete().eq('id', id);
    setMembers(m => m.filter(x => x.id !== id));
  };

  const save = async () => {
    setSaving(true);
    for (const m of members) {
      await supabase.from('entourage_members').update({ full_name: sanitize(m.full_name) }).eq('id', m.id);
    }
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <SectionCard title="Entourage" subtitle="Manage all wedding party members">
      <div className="flex flex-col gap-3">
        {groups.map(group => {
          const groupMembers = members.filter(m => m.group_id === group.id);
          const isOpen = openGroup === group.id;
          return (
            <div key={group.id} className="border border-[#2c3e34]/10 rounded-2xl overflow-hidden">
              <button onClick={() => setOpenGroup(isOpen ? null : group.id)}
                className="w-full flex items-center justify-between px-5 py-4 bg-[#f4f2eb] hover:bg-[#eceae3] transition">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#8a6e2f]"/>
                  <span className="font-cinzel text-sm text-[#2c3e34]">{group.title}</span>
                  <span className="text-[10px] text-[#2c3e34]/40 tracking-widest">{groupMembers.length} member{groupMembers.length !== 1 ? 's' : ''}</span>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-[#2c3e34]/40"/> : <ChevronDown className="w-4 h-4 text-[#2c3e34]/40"/>}
              </button>
              {isOpen && (
                <div className="p-5 flex flex-col gap-3 bg-white/40">
                  {groupMembers.map(member => (
                    <div key={member.id} className="flex items-center gap-3">
                      <input value={member.full_name} onChange={e => updateMember(member.id, e.target.value)} disabled={!canEdit}
                        className="flex-1 bg-[#f4f2eb] border border-[#2c3e34]/10 rounded-xl px-4 py-2 text-sm text-[#2c3e34] focus:outline-none focus:border-[#8a6e2f]/50 transition disabled:opacity-60"/>
                      {canEdit && (
                        <button onClick={() => deleteMember(member.id)} className="p-2 text-[#2c3e34]/30 hover:text-red-500 transition rounded-lg hover:bg-red-50">
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      )}
                    </div>
                  ))}
                  {canEdit && (
                    <div className="mt-1">
                      <AddButton onClick={() => addMember(group.id)} label="Add Member"/>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {canEdit && <div className="mt-6 flex justify-end"><SaveButton onClick={save} saving={saving} saved={saved}/></div>}
    </SectionCard>
  );
}

// ─── SECONDARY SPONSORS ───────────────────────────────────────
function SponsorsSection({ canEdit }) {
  const [rows, setRows]     = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  useEffect(() => {
    supabase.from('secondary_sponsors').select('*').order('display_order').then(({ data }) => data && setRows(data));
  }, []);

  const update = (id, key, val) => setRows(r => r.map(x => x.id === id ? { ...x, [key]: val } : x));

  const addRow = async () => {
    const nextOrder = rows.length + 1;
    const { data } = await supabase.from('secondary_sponsors')
      .insert({ role: 'New Role', names: 'Name 1 & Name 2', display_order: nextOrder }).select().single();
    if (data) setRows(r => [...r, data]);
  };

  const deleteRow = async (id) => {
    await supabase.from('secondary_sponsors').delete().eq('id', id);
    setRows(r => r.filter(x => x.id !== id));
  };

  const save = async () => {
    setSaving(true);
    for (const r of rows) {
      await supabase.from('secondary_sponsors').update({ role: sanitize(r.role), names: sanitize(r.names) }).eq('id', r.id);
    }
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <SectionCard title="Secondary Sponsors" subtitle="Veil, Cord, Candle, and other sponsor pairs">
      <div className="flex flex-col gap-4">
        {rows.map((row, idx) => (
          <div key={row.id} className="relative group grid grid-cols-1 md:grid-cols-2 gap-4 p-5 border border-[#2c3e34]/10 rounded-2xl bg-white/30 hover:border-[#8a6e2f]/20 transition">
            <div className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-[#8a6e2f] flex items-center justify-center">
              <span className="text-[9px] text-white font-bold">{idx + 1}</span>
            </div>
            <Field label="Role"  value={row.role}  onChange={v => update(row.id, 'role', v)}  canEdit={canEdit}/>
            <Field label="Names" value={row.names} onChange={v => update(row.id, 'names', v)} canEdit={canEdit}/>
            {canEdit && (
              <button onClick={() => deleteRow(row.id)}
                className="absolute top-3 right-3 p-1.5 text-[#2c3e34]/20 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                <Trash2 className="w-3.5 h-3.5"/>
              </button>
            )}
          </div>
        ))}
        {canEdit && (
          <div className="mt-2">
            <AddButton onClick={addRow} label="Add Sponsor Pair"/>
          </div>
        )}
      </div>
      {canEdit && <div className="mt-6 flex justify-end"><SaveButton onClick={save} saving={saving} saved={saved}/></div>}
    </SectionCard>
  );
}

// ─── SPECIAL ROLES ────────────────────────────────────────────
function RolesSection({ canEdit }) {
  const [rows, setRows]     = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  useEffect(() => {
    supabase.from('special_roles').select('*').order('display_order').then(({ data }) => data && setRows(data));
  }, []);

  const update = (id, key, val) => setRows(r => r.map(x => x.id === id ? { ...x, [key]: val } : x));

  const addRow = async () => {
    const nextOrder = rows.length + 1;
    const { data } = await supabase.from('special_roles')
      .insert({ role: 'New Role', full_name: 'Full Name', display_order: nextOrder }).select().single();
    if (data) setRows(r => [...r, data]);
  };

  const deleteRow = async (id) => {
    await supabase.from('special_roles').delete().eq('id', id);
    setRows(r => r.filter(x => x.id !== id));
  };

  const save = async () => {
    setSaving(true);
    for (const r of rows) {
      await supabase.from('special_roles').update({ role: sanitize(r.role), full_name: sanitize(r.full_name) }).eq('id', r.id);
    }
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <SectionCard title="Special Roles" subtitle="Best Man, Matron of Honor, Master of Ceremony, and more">
      <div className="flex flex-col gap-4">
        {rows.map((row, idx) => (
          <div key={row.id} className="relative group grid grid-cols-1 md:grid-cols-2 gap-4 p-5 border border-[#2c3e34]/10 rounded-2xl bg-white/30 hover:border-[#8a6e2f]/20 transition">
            <div className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-[#8a6e2f] flex items-center justify-center">
              <span className="text-[9px] text-white font-bold">{idx + 1}</span>
            </div>
            <Field label="Role"      value={row.role}      onChange={v => update(row.id, 'role', v)}      canEdit={canEdit}/>
            <Field label="Full Name" value={row.full_name} onChange={v => update(row.id, 'full_name', v)} canEdit={canEdit}/>
            {canEdit && (
              <button onClick={() => deleteRow(row.id)}
                className="absolute top-3 right-3 p-1.5 text-[#2c3e34]/20 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                <Trash2 className="w-3.5 h-3.5"/>
              </button>
            )}
          </div>
        ))}
        {canEdit && (
          <div className="mt-2">
            <AddButton onClick={addRow} label="Add Special Role"/>
          </div>
        )}
      </div>
      {canEdit && <div className="mt-6 flex justify-end"><SaveButton onClick={save} saving={saving} saved={saved}/></div>}
    </SectionCard>
  );
}

// ─── FUNDAMENTALS ─────────────────────────────────────────────
function FundamentalsSection({ canEdit }) {
  const [rows, setRows]     = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  useEffect(() => {
    supabase.from('fundamentals').select('*').order('display_order').then(({ data }) => data && setRows(data));
  }, []);

  const update = (id, key, val) => setRows(r => r.map(x => x.id === id ? { ...x, [key]: val } : x));

  const addRow = async () => {
    const nextOrder = rows.length + 1;
    const { data } = await supabase.from('fundamentals')
      .insert({ title: 'New Reminder', content: 'Enter reminder details here.', display_order: nextOrder }).select().single();
    if (data) setRows(r => [...r, data]);
  };

  const deleteRow = async (id) => {
    await supabase.from('fundamentals').delete().eq('id', id);
    setRows(r => r.filter(x => x.id !== id));
  };

  const save = async () => {
    setSaving(true);
    for (const r of rows) {
      await supabase.from('fundamentals').update({ title: sanitize(r.title), content: sanitize(r.content) }).eq('id', r.id);
    }
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <SectionCard title="Fundamentals" subtitle="Wedding reminders and guidelines for guests">
      <div className="flex flex-col gap-5">
        {rows.map((row, idx) => (
          <div key={row.id} className="relative group border border-[#2c3e34]/10 rounded-2xl p-5 bg-white/30 hover:border-[#8a6e2f]/20 transition flex flex-col gap-4">
            <div className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-[#8a6e2f] flex items-center justify-center">
              <span className="text-[9px] text-white font-bold">{idx + 1}</span>
            </div>
            {canEdit && (
              <button onClick={() => deleteRow(row.id)}
                className="absolute top-3 right-3 p-1.5 text-[#2c3e34]/20 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                <Trash2 className="w-3.5 h-3.5"/>
              </button>
            )}
            <Field label="Title"   value={row.title}   onChange={v => update(row.id, 'title', v)}   canEdit={canEdit}/>
            <Field label="Content" value={row.content} onChange={v => update(row.id, 'content', v)} canEdit={canEdit} multiline rows={4}/>
          </div>
        ))}
        {canEdit && (
          <div className="mt-2">
            <AddButton onClick={addRow} label="Add Reminder"/>
          </div>
        )}
      </div>
      {canEdit && <div className="mt-6 flex justify-end"><SaveButton onClick={save} saving={saving} saved={saved}/></div>}
    </SectionCard>
  );
}

// ─── ACCESS LINKS ─────────────────────────────────────────────
function AccessSection() {
  const base = window.location.origin + window.location.pathname;

  const [keys, setKeys]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied]       = useState('');

  // New key form
  const [newLabel, setNewLabel]   = useState('');
  const [newRole, setNewRole]     = useState('viewer');
  const [newExpiry, setNewExpiry] = useState('');
  const [newMaxUses, setNewMaxUses] = useState('');
  const [showForm, setShowForm]   = useState(false);

  useEffect(() => { fetchKeys(); }, []);

  const fetchKeys = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('access_keys')
      .select('*')
      .order('created_at', { ascending: false });
    setKeys(data || []);
    setLoading(false);
  };

  const generateKey = async () => {
    if (!newLabel.trim()) return;
    setGenerating(true);

    const rawKey  = generateRawKey();
    const hash    = await sha256(rawKey);

    const payload = {
      key_hash:   hash,
      role:       newRole,
      label:      newLabel.trim(),
      expires_at: newExpiry ? new Date(newExpiry).toISOString() : null,
      max_uses:   newMaxUses ? parseInt(newMaxUses) : null,
      is_active:  true,
      use_count:  0,
    };

    const { error } = await supabase.from('access_keys').insert(payload);
    if (!error) {
      // Show the raw key ONCE — it won't be retrievable again
      const fullUrl = `${base}?key=${rawKey}`;
      await fetchKeys();
      setShowForm(false);
      setNewLabel(''); setNewRole('viewer'); setNewExpiry(''); setNewMaxUses('');
      // Copy to clipboard automatically
      navigator.clipboard.writeText(fullUrl);
      setCopied(`new_${hash.slice(0, 8)}`);
      setTimeout(() => setCopied(''), 4000);
      alert(`✅ Key generated and copied!\n\nShare this link (shown only once):\n\n${fullUrl}`);
    }
    setGenerating(false);
  };

  const revokeKey = async (id) => {
    await supabase.from('access_keys').update({ is_active: false }).eq('id', id);
    fetchKeys();
  };

  const deleteKey = async (id) => {
    await supabase.from('access_keys').delete().eq('id', id);
    fetchKeys();
  };

  const activeKeys   = keys.filter(k => k.is_active);
  const revokedKeys  = keys.filter(k => !k.is_active);

  const roleColor = (role) => role === 'editor'
    ? 'text-[#8a6e2f] bg-[#8a6e2f]/10 border-[#8a6e2f]/20'
    : 'text-blue-700 bg-blue-50 border-blue-100';

  const isExpired = (k) => k.expires_at && new Date(k.expires_at) < new Date();
  const isMaxed   = (k) => k.max_uses !== null && k.use_count >= k.max_uses;

  return (
    <SectionCard title="Access Links" subtitle="Generate secure hashed keys for your team">

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-[#f4f2eb] border border-[#8a6e2f]/20 rounded-2xl p-4 mb-6">
        <Shield className="w-4 h-4 text-[#8a6e2f] shrink-0 mt-0.5"/>
        <div className="text-[11px] text-[#2c3e34]/70 leading-relaxed">
          Each key is a <span className="font-semibold text-[#2c3e34]">one-way SHA-256 hash</span> — the raw key is shown only once when generated.
          Even if your database is exposed, the key cannot be reverse-engineered.
          You can set an <span className="font-semibold text-[#2c3e34]">expiry date</span> and a <span className="font-semibold text-[#2c3e34]">max use count</span> per key.
        </div>
      </div>

      {/* Generate new key */}
      <div className="mb-6">
        {!showForm ? (
          <AddButton onClick={() => setShowForm(true)} label="Generate New Key"/>
        ) : (
          <div className="border border-[#8a6e2f]/20 rounded-2xl p-5 bg-[#8a6e2f]/5 flex flex-col gap-4">
            <p className="text-[10px] uppercase tracking-[0.35em] text-[#8a6e2f]">New Access Key</p>

            {/* Label */}
            <div>
              <label className="text-[10px] uppercase tracking-[0.3em] text-[#8a6e2f] mb-2 block">Label / Recipient Name</label>
              <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="e.g. Maria — View Only"
                className="w-full bg-white border border-[#2c3e34]/10 rounded-xl px-4 py-3 text-sm text-[#2c3e34] focus:outline-none focus:border-[#8a6e2f]/50 transition"/>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Role */}
              <div>
                <label className="text-[10px] uppercase tracking-[0.3em] text-[#8a6e2f] mb-2 block">Access Role</label>
                <select value={newRole} onChange={e => setNewRole(e.target.value)}
                  className="w-full bg-white border border-[#2c3e34]/10 rounded-xl px-4 py-3 text-sm text-[#2c3e34] focus:outline-none focus:border-[#8a6e2f]/50 transition">
                  <option value="viewer">Viewer (read only)</option>
                  <option value="editor">Editor (can edit)</option>
                </select>
              </div>

              {/* Expiry */}
              <div>
                <label className="text-[10px] uppercase tracking-[0.3em] text-[#8a6e2f] mb-2 block">Expires At (optional)</label>
                <input type="datetime-local" value={newExpiry} onChange={e => setNewExpiry(e.target.value)}
                  className="w-full bg-white border border-[#2c3e34]/10 rounded-xl px-4 py-3 text-sm text-[#2c3e34] focus:outline-none focus:border-[#8a6e2f]/50 transition"/>
              </div>

              {/* Max uses */}
              <div>
                <label className="text-[10px] uppercase tracking-[0.3em] text-[#8a6e2f] mb-2 block">Max Uses (optional)</label>
                <input type="number" min="1" value={newMaxUses} onChange={e => setNewMaxUses(e.target.value)} placeholder="Unlimited"
                  className="w-full bg-white border border-[#2c3e34]/10 rounded-xl px-4 py-3 text-sm text-[#2c3e34] focus:outline-none focus:border-[#8a6e2f]/50 transition"/>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={generateKey} disabled={generating || !newLabel.trim()}
                className="flex items-center gap-2 px-6 py-3 bg-[#2c3e34] text-white rounded-xl text-[11px] uppercase tracking-widest hover:bg-[#8a6e2f] transition disabled:opacity-40">
                {generating ? 'Generating...' : <><Shield className="w-3.5 h-3.5"/> Generate & Copy Link</>}
              </button>
              <button onClick={() => { setShowForm(false); setNewLabel(''); setNewRole('viewer'); setNewExpiry(''); setNewMaxUses(''); }}
                className="px-5 py-3 border border-[#2c3e34]/20 text-[#2c3e34] rounded-xl text-[11px] uppercase tracking-widest hover:bg-[#2c3e34]/5 transition">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Active Keys */}
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-[0.35em] text-[#8a6e2f] mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 inline-block"/>
          Active Keys ({activeKeys.length})
        </p>

        {loading ? (
          <p className="text-sm text-[#2c3e34]/40 text-center py-6 animate-pulse">Loading keys...</p>
        ) : activeKeys.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-[#2c3e34]/10 rounded-2xl">
            <p className="text-sm text-[#2c3e34]/40">No active keys yet. Generate one above.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {activeKeys.map(k => (
              <div key={k.id} className={`relative rounded-2xl border p-4 bg-white/50 ${isExpired(k) || isMaxed(k) ? 'border-red-200 opacity-60' : 'border-[#2c3e34]/10'}`}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-medium text-[#2c3e34] truncate">{k.label || 'Unnamed Key'}</p>
                      <span className={`text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full border font-semibold ${roleColor(k.role)}`}>
                        {k.role}
                      </span>
                      {(isExpired(k) || isMaxed(k)) && (
                        <span className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full border text-red-600 bg-red-50 border-red-200 font-semibold">
                          Expired
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-[#2c3e34]/40 flex-wrap">
                      <span>Created: {new Date(k.created_at).toLocaleDateString()}</span>
                      {k.expires_at && <span>Expires: {new Date(k.expires_at).toLocaleString()}</span>}
                      <span>Used: {k.use_count}{k.max_uses ? ` / ${k.max_uses}` : ' times'}</span>
                      <span className="font-mono text-[9px] bg-[#f4f2eb] px-2 py-0.5 rounded-lg">
                        #{k.key_hash.slice(0, 12)}...
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => revokeKey(k.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 text-red-500 text-[10px] uppercase tracking-widest hover:bg-red-50 transition">
                      <Lock className="w-3 h-3"/> Revoke
                    </button>
                    <button onClick={() => deleteKey(k.id)}
                      className="p-1.5 rounded-xl border border-[#2c3e34]/10 text-[#2c3e34]/30 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition">
                      <Trash2 className="w-3.5 h-3.5"/>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Revoked Keys */}
      {revokedKeys.length > 0 && (
        <div className="mb-6">
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#2c3e34]/40 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400 inline-block"/>
            Revoked / Expired Keys ({revokedKeys.length})
          </p>
          <div className="flex flex-col gap-2">
            {revokedKeys.map(k => (
              <div key={k.id} className="relative rounded-2xl border border-[#2c3e34]/5 p-4 bg-white/20 opacity-50">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-sm text-[#2c3e34]/60 line-through">{k.label || 'Unnamed Key'}</p>
                    <p className="text-[10px] text-[#2c3e34]/30 font-mono">#{k.key_hash.slice(0, 12)}... · used {k.use_count}×</p>
                  </div>
                  <button onClick={() => deleteKey(k.id)}
                    className="p-1.5 rounded-xl border border-[#2c3e34]/10 text-[#2c3e34]/20 hover:text-red-400 transition">
                    <Trash2 className="w-3.5 h-3.5"/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info box */}
      <div className="relative overflow-hidden bg-[#2c3e34] rounded-2xl p-6 text-white">
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#8a6e2f]/10 rounded-full blur-3xl pointer-events-none"/>
        <p className="text-[10px] uppercase tracking-[0.35em] text-[#8a6e2f] mb-3">Security Notes</p>
        <div className="space-y-2 text-[11px] text-white/70 relative z-10">
          <p>• Raw keys are shown <span className="text-white font-semibold">only once</span> at generation — they cannot be recovered. Copy immediately.</p>
          <p>• Only the <span className="text-white font-semibold">SHA-256 hash</span> is stored in the database — not the actual key.</p>
          <p>• Use <span className="text-white font-semibold">Revoke</span> to instantly invalidate a key without deleting its usage history.</p>
          <p>• Set a <span className="text-white font-semibold">Max Uses</span> of 1 to create a single-use invite link.</p>
          <p>• Links look like: <span className="text-white font-mono text-[10px] break-all">{base}?key=abc123...</span></p>
        </div>
      </div>
    </SectionCard>
  );
}