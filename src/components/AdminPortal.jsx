import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import {
  Leaf, LogOut, Edit3, Copy, Check, Users,
  ChevronDown, ChevronUp, Save, Plus, Trash2,
  Eye, EyeOff, Link, Shield, BookOpen, Heart,
  Calendar, Phone, AlertCircle, Lock
} from 'lucide-react';

// ─── ACCESS KEY CONFIG ────────────────────────────────────────
const ACCESS_KEYS = {
  view: 'CMRO_view_2026',
  edit: 'CMRO_edit_2026',
};

function getAccessFromURL() {
  const params = new URLSearchParams(window.location.search);
  const access = params.get('access');
  const key    = params.get('key');
  if (access === 'view' && key === ACCESS_KEYS.view) return 'viewer';
  if (access === 'edit' && key === ACCESS_KEYS.edit) return 'editor';
  return null;
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
    const urlAccess = getAccessFromURL();
    if (urlAccess && !auth) setAuth(urlAccess);
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

function Field({ label, value, onChange, canEdit, type = 'text', multiline = false, rows = 3 }) {
  const cls = "w-full bg-[#f4f2eb] border border-[#2c3e34]/10 rounded-xl px-4 py-3 text-sm text-[#2c3e34] placeholder:text-[#2c3e34]/30 focus:outline-none focus:border-[#8a6e2f]/50 transition disabled:opacity-60 disabled:cursor-not-allowed";
  return (
    <div>
      <label className="text-[10px] uppercase tracking-[0.3em] text-[#8a6e2f] mb-2 block">{label}</label>
      {multiline
        ? <textarea rows={rows} value={value} onChange={e => onChange(e.target.value)} disabled={!canEdit} className={cls + " resize-none"}/>
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} disabled={!canEdit} className={cls}/>}
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
    await supabase.from('couple_info').update(data).eq('id', data.id);
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <SectionCard title="Couple Info" subtitle="Full names, tagline, images, and invitation text">
      {/* Groom */}
      <p className="text-[10px] uppercase tracking-[0.35em] text-[#8a6e2f] mb-3 mt-1 flex items-center gap-2">
        <span className="w-6 h-[1px] bg-[#8a6e2f]/40 inline-block"/> Groom
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <Field label="First Name"  value={data.groom_first_name  || ''} onChange={set('groom_first_name')}  canEdit={canEdit}/>
        <Field label="Middle Name" value={data.groom_middle_name || ''} onChange={set('groom_middle_name')} canEdit={canEdit}/>
        <Field label="Last Name"   value={data.groom_last_name   || ''} onChange={set('groom_last_name')}   canEdit={canEdit}/>
      </div>

      {/* Bride */}
      <p className="text-[10px] uppercase tracking-[0.35em] text-[#8a6e2f] mb-3 flex items-center gap-2">
        <span className="w-6 h-[1px] bg-[#8a6e2f]/40 inline-block"/> Bride
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <Field label="First Name"  value={data.bride_first_name  || ''} onChange={set('bride_first_name')}  canEdit={canEdit}/>
        <Field label="Middle Name" value={data.bride_middle_name || ''} onChange={set('bride_middle_name')} canEdit={canEdit}/>
        <Field label="Last Name"   value={data.bride_last_name   || ''} onChange={set('bride_last_name')}   canEdit={canEdit}/>
      </div>

      {/* Acronym Preview */}
      <div className="mb-6 p-4 bg-[#f4f2eb] rounded-2xl border border-[#8a6e2f]/20 flex items-center gap-4">
        <p className="text-[10px] uppercase tracking-widest text-[#8a6e2f]">Acronym Preview</p>
        <p className="font-cinzel text-2xl text-[#2c3e34]">
          {data.groom_last_name?.charAt(0)?.toUpperCase() || 'G'} & {data.bride_last_name?.charAt(0)?.toUpperCase() || 'B'}
        </p>
        <p className="text-[10px] text-[#2c3e34]/40 tracking-widest">— used in both portals</p>
      </div>

      {/* Other fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Subtitle"             value={data.subtitle || ''}         onChange={set('subtitle')}         canEdit={canEdit}/>
        <Field label="Tagline"              value={data.tagline || ''}          onChange={set('tagline')}          canEdit={canEdit}/>
        <Field label="Primary Image Path"   value={data.image_primary || ''}    onChange={set('image_primary')}    canEdit={canEdit}/>
        <Field label="Secondary Image Path" value={data.image_secondary || ''}  onChange={set('image_secondary')}  canEdit={canEdit}/>
        <Field label="Music Path"           value={data.music_path || ''}       onChange={set('music_path')}       canEdit={canEdit}/>
        <Field label="Invitation Title"     value={data.invitation_title || ''} onChange={set('invitation_title')} canEdit={canEdit}/>
        <div className="md:col-span-2">
          <Field label="Invitation Body" value={data.invitation_body || ''} onChange={set('invitation_body')} canEdit={canEdit} multiline/>
        </div>
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
    await supabase.from('event_details').update(data).eq('id', data.id);
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
    await supabase.from('contact_info').update(data).eq('id', data.id);
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
      await supabase.from('entourage_members').update({ full_name: m.full_name }).eq('id', m.id);
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
      await supabase.from('secondary_sponsors').update({ role: r.role, names: r.names }).eq('id', r.id);
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
      await supabase.from('special_roles').update({ role: r.role, full_name: r.full_name }).eq('id', r.id);
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
      await supabase.from('fundamentals').update({ title: r.title, content: r.content }).eq('id', r.id);
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
  const base     = window.location.origin + window.location.pathname;
  const viewLink = `${base}?access=view&key=${ACCESS_KEYS.view}`;
  const editLink = `${base}?access=edit&key=${ACCESS_KEYS.edit}`;
  const [copied, setCopied] = useState('');

  const copy = (text, which) => {
    navigator.clipboard.writeText(text);
    setCopied(which);
    setTimeout(() => setCopied(''), 2000);
  };

  const links = [
    { id: 'view', label: 'View Only Access', desc: 'Recipients can browse all content but cannot make changes.', icon: Eye,   url: viewLink, accent: 'text-blue-600',    bg: 'bg-blue-50',       border: 'border-blue-100' },
    { id: 'edit', label: 'Editor Access',    desc: 'Recipients can view and edit all wedding content.',         icon: Edit3, url: editLink, accent: 'text-[#8a6e2f]', bg: 'bg-[#8a6e2f]/5', border: 'border-[#8a6e2f]/20' },
  ];

  return (
    <SectionCard title="Access Links" subtitle="Share the portal with your team securely">
      <div className="flex flex-col gap-5 mb-8">
        {links.map(({ id, label, desc, icon: Icon, url, accent, bg, border }) => (
          <div key={id} className={`${bg} border ${border} rounded-2xl p-5`}>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white shadow-sm"><Icon className={`w-4 h-4 ${accent}`}/></div>
                <div>
                  <p className="text-sm font-medium text-[#2c3e34]">{label}</p>
                  <p className="text-[11px] text-[#2c3e34]/50 mt-0.5">{desc}</p>
                </div>
              </div>
              <button onClick={() => copy(url, id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] uppercase tracking-widest transition shrink-0
                  ${copied === id ? 'bg-green-600 text-white' : 'bg-[#2c3e34] text-white hover:bg-[#8a6e2f]'}`}>
                {copied === id ? <><Check className="w-3 h-3"/> Copied</> : <><Copy className="w-3 h-3"/> Copy Link</>}
              </button>
            </div>
            <div className="bg-white/70 rounded-xl px-4 py-2 text-[11px] text-[#2c3e34]/50 font-mono break-all border border-[#2c3e34]/5">{url}</div>
          </div>
        ))}
      </div>
      <div className="relative overflow-hidden bg-[#2c3e34] rounded-2xl p-6 text-white">
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#8a6e2f]/10 rounded-full blur-3xl pointer-events-none"/>
        <p className="text-[10px] uppercase tracking-[0.35em] text-[#8a6e2f] mb-3">How It Works</p>
        <div className="space-y-3 text-sm text-white/70 relative z-10">
          <p>• <span className="text-white">View Only</span> — share with guests or stakeholders to review content.</p>
          <p>• <span className="text-white">Editor</span> — share with trusted team members who can update the database.</p>
          <p>• Links are protected by secret keys embedded in the URL — keep them private.</p>
          <p>• To revoke access, update <span className="text-white font-mono">ACCESS_KEYS</span> in <span className="text-white font-mono">AdminPortal.jsx</span>.</p>
        </div>
      </div>
    </SectionCard>
  );
}