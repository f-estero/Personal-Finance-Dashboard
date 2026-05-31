import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from './supabase';
import MarketTab from './MarketTab';
import {
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, BarChart, Bar
} from 'recharts';
import {
  Wallet, TrendingUp, Target, Calendar, CheckCircle2, Clock, AlertCircle,
  PiggyBank, BarChart3, Flame, Flag, Settings as SettingsIcon, History as HistoryIcon,
  Plus, Trash2, Download, Upload, RotateCcw, LayoutDashboard,
  ChevronRight, ChevronDown, Sparkles, Briefcase, ChevronLeft,
  CreditCard, Shield, Coffee, Zap, Rocket, Save, X, Info,
  Edit3, Check, ArrowUpRight, FileText, Hash, LogOut, Home, Tv, Phone
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════
// CONSTANTS & DEFAULTS
// ═══════════════════════════════════════════════════════════

const APP_VERSION = '1.0';
const STORAGE_KEY = 'pfd-v4';
const LEGACY_KEYS = ['pfd-v3', 'pfd-v2', 'pfd-v1', 'fondo-cassa-v2'];

const MONTHS_IT = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];
const MONTHS_IT_SHORT = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];

const DEFAULT_CONFIG = {
  profile: { name: '', birthYear: new Date().getFullYear() - 30 },
  salary: { netAmount: 0, bonusAmount: 0, bonusMonths: [], payDay: 27 },
  pac: {
    monthlyAmount: 0, payDay: 1, broker: '',
    instruments: [
      { id: 'ins1', name: 'ETF 1', pct: 100, ter: 0.20, color: '#3b82f6', ticker: '' },
    ]
  },
  marketApiKey: '', // Alpha Vantage API key (gratuita su alphavantage.co)
  fonte: { monthlyContribution: 0, ter: 0, comparto: '' },
  expenses: {
    affitto:       { amount: 0, label: 'Affitto',       icon: 'home'    },
    utenze:        { amount: 0, label: 'Utenze',        icon: 'zap'     },
    abbonamenti:   { amount: 0, label: 'Abbonamenti',   icon: 'tv'      },
    assicurazioni: { amount: 0, label: 'Assicurazioni', icon: 'shield'  },
    telefono:      { amount: 0, label: 'Telefono',      icon: 'phone'   },
  },
  waterfallLevels: [
    { id: 'l1', name: 'Riserva di Emergenza',  desc: 'Imprevisti e spese straordinarie', cap: 0, color: '#10b981', icon: 'shield' },
    { id: 'l2', name: 'Fondo Lifestyle',       desc: 'Viaggi, svago, spese voluttuarie',  cap: 0, color: '#3b82f6', icon: 'coffee' },
    { id: 'l3', name: 'Liquidità Operativa',   desc: 'Spese mensili correnti',            cap: 0, color: '#f59e0b', icon: 'zap' },
    { id: 'l4', name: 'Overflow → Investimenti', desc: 'Eccedenza da investire',          cap: 0, color: '#6366f1', icon: 'rocket' },
  ],
};

const DEFAULT_STATE = {
  etfValue: 0,
  etfValueUpdatedAt: null,
  fonteValue: 0,
  fonteValueUpdatedAt: null,
  instrumentValues: {},
  instrumentValuesUpdatedAt: null,
  waterfallCurrent: { l1: 0, l2: 0, l3: 0, l4: 0 },
  events: {},
  ledger: {},
  snapshots: [],
  transactions: [],
  reviews: [],
  fireParams: { rate: 5.0, fonteRate: 3.0, retireAge: 50 },
};

// Milestones calcolate dinamicamente in base all'età e agli obiettivi dell'utente
type Milestone = { year: number; age: number; label: string; pacT: number; fonteT: number; note: string; isTarget?: boolean };

// Le milestone vengono generate dinamicamente nel componente tramite useMemo

const WF_ICON_MAP = { shield: Shield, coffee: Coffee, zap: Zap, rocket: Rocket };

const EXTRA_CATEGORIES = [
  { id: 'work', label: 'Lavoro extra', icon: '💼' },
  { id: 'gift', label: 'Regalo / Bonus', icon: '🎁' },
  { id: 'travel', label: 'Viaggio', icon: '✈️' },
  { id: 'health', label: 'Salute', icon: '🏥' },
  { id: 'home', label: 'Casa', icon: '🏠' },
  { id: 'tax', label: 'Tasse / 730', icon: '📋' },
  { id: 'other', label: 'Altro', icon: '•' },
];

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

const fmt = (v) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v || 0);
const fmt2 = (v) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(v || 0);
const fmtK = (v) => Math.abs(v || 0) >= 1000 ? `€${Math.round(v/1000)}k` : fmt(v);
const safeNum = (v, fb = 0) => {
  if (v === '' || v == null) return fb;
  const s = typeof v === 'string' ? v.replace(',', '.') : v;
  const n = parseFloat(s);
  return isNaN(n) || n < 0 ? fb : n;
};
const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const calcFV = (pv, pmt, annR, mo) => {
  if (annR <= 0 || mo <= 0) return pv + pmt * Math.max(0, mo);
  const r = annR / 12 / 100, f = Math.pow(1 + r, mo);
  return pv * f + pmt * (f - 1) / r;
};
const ageFromYear = (by) => new Date().getFullYear() - by;
const formatRelativeTime = (iso) => {
  if (!iso) return null;
  const then = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - then.getTime();
  const days = Math.floor(diffMs / 86400000);
  if (days < 1) return 'oggi';
  if (days === 1) return 'ieri';
  if (days < 7) return `${days} giorni fa`;
  if (days < 30) return `${Math.floor(days / 7)} settimane fa`;
  if (days < 365) return `${Math.floor(days / 30)} mesi fa`;
  return `${Math.floor(days / 365)} anni fa`;
};
const isStale = (iso, days = 90) => {
  if (!iso) return true;
  return (Date.now() - new Date(iso).getTime()) > days * 86400000;
};

// ═══════════════════════════════════════════════════════════
// REUSABLE UI COMPONENTS
// ═══════════════════════════════════════════════════════════

function Card({ children, className = '' }) {
  return <div className={`bg-white rounded-2xl border border-slate-200 ${className}`}>{children}</div>;
}

function CardHeader({ title, subtitle, icon: Icon, action, accentColor = 'slate' }) {
  const colors = {
    slate: 'bg-slate-100 text-slate-600',
    emerald: 'bg-emerald-100 text-emerald-700',
    blue: 'bg-blue-100 text-blue-700',
    amber: 'bg-amber-100 text-amber-700',
    rose: 'bg-rose-100 text-rose-700',
    purple: 'bg-purple-100 text-purple-700',
    indigo: 'bg-indigo-100 text-indigo-700',
    orange: 'bg-orange-100 text-orange-700',
  };
  return (
    <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
      <div className="flex items-center gap-2.5 min-w-0">
        {Icon && <div className={`p-1.5 rounded-lg ${colors[accentColor]} flex-shrink-0`}><Icon size={15} strokeWidth={2} /></div>}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 truncate">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

function StatCard({ label, value, sub, accent = 'slate', icon: Icon, large }) {
  const colors = {
    slate: 'text-slate-900', emerald: 'text-emerald-700', blue: 'text-blue-700',
    rose: 'text-rose-700', amber: 'text-amber-700', purple: 'text-purple-700',
    indigo: 'text-indigo-700', orange: 'text-orange-700',
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
        {Icon && <Icon size={14} className="text-slate-400 flex-shrink-0" />}
      </div>
      <div className={`${large ? 'text-2xl' : 'text-xl'} font-semibold tabular-nums ${colors[accent]}`}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1 truncate">{sub}</div>}
    </div>
  );
}

function Button({ children, onClick, variant = 'secondary', size = 'md', icon: Icon, iconRight: IconR, disabled, className = '', ...props }) {
  const variants = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800',
    secondary: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300',
    ghost: 'text-slate-600 hover:bg-slate-100',
    danger: 'bg-white border border-rose-200 text-rose-700 hover:bg-rose-50',
    accent: 'bg-slate-900 text-white hover:bg-slate-800',
  };
  const sizes = {
    xs: 'px-2 py-1 text-[11px] gap-1',
    sm: 'px-2.5 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 text-sm gap-2',
  };
  return (
    <button onClick={onClick} disabled={disabled} {...props}
      className={`inline-flex items-center justify-center font-medium rounded-lg transition-colors ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      {Icon && <Icon size={size === 'xs' || size === 'sm' ? 12 : 14} />}
      {children}
      {IconR && <IconR size={size === 'xs' || size === 'sm' ? 12 : 14} />}
    </button>
  );
}

function MoneyInput({ value, onChange, placeholder = '0', disabled, className = '', size = 'md' }) {
  const sizes = { sm: 'py-1 text-xs pl-2.5 pr-6', md: 'py-1.5 text-sm pl-3 pr-7', lg: 'py-2 text-base pl-3 pr-8' };
  return (
    <div className={`relative ${className}`}>
      <input type="text" inputMode="decimal" value={value ?? ''}
        onChange={e => onChange(e.target.value.replace(/[^0-9.,]/g, ''))}
        onWheel={e => e.currentTarget.blur()}
        placeholder={placeholder} disabled={disabled}
        className={`w-full border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 text-right tabular-nums bg-white disabled:bg-slate-50 ${sizes[size]}`} />
      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">€</span>
    </div>
  );
}

function NumberInput({ value, onChange, suffix, min, max, className = '', step = 1 }) {
  return (
    <div className={`relative ${className}`}>
      <input type="number" value={value ?? ''}
        onChange={e => onChange(e.target.value === '' ? '' : +e.target.value)}
        onWheel={e => e.currentTarget.blur()}
        min={min} max={max} step={step}
        className={`w-full pl-3 ${suffix ? 'pr-8' : 'pr-3'} py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 text-right tabular-nums bg-white`} />
      {suffix && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">{suffix}</span>}
    </div>
  );
}

function Badge({ children, color = 'slate', icon: Icon }) {
  const colors = {
    slate: 'bg-slate-100 text-slate-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    blue: 'bg-blue-100 text-blue-700',
    amber: 'bg-amber-100 text-amber-700',
    rose: 'bg-rose-100 text-rose-700',
    purple: 'bg-purple-100 text-purple-700',
    orange: 'bg-orange-100 text-orange-700',
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[10.5px] font-medium px-2 py-0.5 rounded-full ${colors[color]}`}>
      {Icon && <Icon size={10} />}{children}
    </span>
  );
}

function ProgressBar({ value, max, color = '#10b981', height = 6, showOverflow = false }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 100;
  const over = max > 0 && value > max;
  return (
    <div className="w-full bg-slate-100 rounded-full overflow-hidden" style={{ height }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: over && showOverflow ? '#f59e0b' : color }} />
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="text-center py-12 px-6">
      {Icon && <div className="inline-flex p-3 bg-slate-50 rounded-full mb-3"><Icon size={24} className="text-slate-400" /></div>}
      <p className="text-sm font-medium text-slate-700">{title}</p>
      {description && <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function Toast({ message, type = 'success', onDismiss }) {
  const colors = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    error: 'bg-rose-50 text-rose-800 border-rose-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
  };
  const Icon = type === 'success' ? CheckCircle2 : type === 'error' ? AlertCircle : Info;
  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-lg text-sm font-medium ${colors[type]}`}>
      <Icon size={16} />
      <span>{message}</span>
      <button onClick={onDismiss} className="ml-2 hover:opacity-70"><X size={14} /></button>
    </div>
  );
}

function ConfirmDialog({ open, title, message, onConfirm, onCancel, variant = 'danger' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-5 shadow-xl">
        <h3 className="text-base font-semibold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-600 mb-5">{message}</p>
        <div className="flex justify-end gap-2">
          <Button onClick={onCancel} variant="secondary">Annulla</Button>
          <Button onClick={onConfirm} variant={variant === 'danger' ? 'danger' : 'primary'}>Conferma</Button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════

export default function PersonalFinanceDashboard() {
  const [tab, setTab] = useState('dashboard');
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [state, setState] = useState(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [editWaterfall, setEditWaterfall] = useState(false);
  const [historyMonth, setHistoryMonth] = useState(0); // 0 = current, -1 = last month, etc.
  const [showAddTx, setShowAddTx] = useState(false);
  const [newTx, setNewTx] = useState({ amount: '', type: 'income', category: 'other', note: '' });
  const [showAddReview, setShowAddReview] = useState(false);
  const [newReview, setNewReview] = useState({ year: new Date().getFullYear(), title: '', summary: '', decisions: [] });
  const [expandedReview, setExpandedReview] = useState(null);
  const [showRebalance, setShowRebalance] = useState(false);
  const [cashflowMonth, setCashflowMonth] = useState(0);
  const [showVoluntary, setShowVoluntary] = useState(false);
  const [voluntaryAmount, setVoluntaryAmount] = useState('');
  const [voluntaryAlloc, setVoluntaryAlloc] = useState<Record<string, string>>({});
  const [salaryConfirmDialog, setSalaryConfirmDialog] = useState(null);
  const [pacConfirmDialog, setPacConfirmDialog] = useState<{key: string; actual: string; excessAlloc: Record<string, string>} | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [obName, setObName] = useState('');
  const [obYear, setObYear] = useState(String(new Date().getFullYear() - 30));
  const [obSalary, setObSalary] = useState('');
  const [obPac, setObPac] = useState('');
  const [obRetireAge, setObRetireAge] = useState('50');
  const [obMonthlyExpense, setObMonthlyExpense] = useState('');
  const [obReturnRate, setObReturnRate] = useState('5.0');
  const [showFireWizard, setShowFireWizard] = useState(false);
  const fileInputRef = useRef(null);

  // ─── Load & migrate ───
  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(STORAGE_KEY);
        if (r) {
          const d = JSON.parse(r.value);
          if (d.config) setConfig({ ...DEFAULT_CONFIG, ...d.config });
          if (d.state) setState({ ...DEFAULT_STATE, ...d.state });
        } else {
          // Try legacy migration
          for (const lk of LEGACY_KEYS) {
            try {
              const old = await window.storage.get(lk);
              if (old) {
                const d = JSON.parse(old.value);
                const migrated = { ...DEFAULT_STATE };
                if (d.etfVal != null) migrated.etfValue = d.etfVal;
                if (d.fonteVal != null) migrated.fonteValue = d.fonteVal;
                if (d.wf?.length) d.wf.forEach(lv => { if (migrated.waterfallCurrent[lv.id] != null) migrated.waterfallCurrent[lv.id] = lv.current; });
                if (d.events) migrated.events = d.events;
                if (d.snaps) migrated.snapshots = d.snaps;
                if (d.fireP) migrated.fireParams = d.fireP;
                setState(migrated);
                setToast({ message: `Dati migrati da ${lk}`, type: 'info' });
                break;
              }
            } catch {}
          }
        }
      } catch (err) {
        console.error('Load error:', err);
      }
      setLoaded(true);
    })();
  }, []);

  // ─── Mostra onboarding ai nuovi utenti ───
  useEffect(() => {
    if (loaded && !config.profile.name) {
      setShowOnboarding(true);
    }
  }, [loaded]);

  // ─── Auto-snapshot mensile ───
  // Ogni volta che l'app si apre, se non esiste già uno snapshot
  // del mese corrente e l'utente ha dati significativi, lo salva automaticamente.
  useEffect(() => {
    if (!loaded || !config.profile.name) return;
    if (state.etfValue <= 0 && state.fonteValue <= 0) return; // nessun dato ancora

    const today = todayKey();
    const currentMonthPrefix = today.substring(0, 7); // es. "2026-05"
    const alreadyThisMonth = state.snapshots.some(s => s.date.startsWith(currentMonthPrefix));

    if (!alreadyThisMonth) {
      const liq = Object.values(state.waterfallCurrent).reduce((a: number, b) => a + (b as number || 0), 0);
      const nw = state.etfValue + state.fonteValue + liq;
      const snap = { date: today, etf: state.etfValue, fonte: state.fonteValue, liq, nw };
      const newSnaps = [...state.snapshots.filter(s => s.date !== today), snap]
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-60);
      updateState({ snapshots: newSnaps });
      // Nessun toast — operazione silenziosa
    }
  }, [loaded, config.profile.name]);

  const completeOnboarding = () => {
    if (!obName.trim()) return;
    const retireAge = parseInt(obRetireAge) || 50;
    const rate = parseFloat(obReturnRate) || 5.0;
    setConfig(c => ({
      ...c,
      profile: { name: obName.trim(), birthYear: parseInt(obYear) || new Date().getFullYear() - 30 },
      salary: { ...c.salary, netAmount: safeNum(obSalary) },
      pac: { ...c.pac, monthlyAmount: safeNum(obPac) },
    }));
    updateState({ fireParams: { rate, fonteRate: rate - 2 > 0 ? rate - 2 : 2, retireAge } });
    setShowOnboarding(false);
    setToast({ message: `Benvenuto ${obName.trim()}! Completa la configurazione nelle Impostazioni.`, type: 'success' });
  };

  const applyFireWizard = () => {
    const retireAge = parseInt(obRetireAge) || 50;
    const rate = parseFloat(obReturnRate) || 5.0;
    updateState({ fireParams: { rate, fonteRate: rate - 2 > 0 ? rate - 2 : 2, retireAge } });
    setShowFireWizard(false);
    setToast({ message: 'Obiettivo FIRE aggiornato', type: 'success' });
  };

  // ─── Auto-save (debounced) ───
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(async () => {
      try {
        setSyncStatus('saving');
        await window.storage.set(STORAGE_KEY, JSON.stringify({ version: APP_VERSION, config, state }));
        setSyncStatus('saved');
        setTimeout(() => setSyncStatus('idle'), 2000);
      } catch (err) {
        setSyncStatus('error');
        setToast({ message: 'Errore salvataggio cloud', type: 'error' });
      }
    }, 600);
    return () => clearTimeout(t);
  }, [config, state, loaded]);

  // ─── Toast auto-dismiss ───
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 2800);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // ─── Derived values ───
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const tick = () => setNow(new Date());
    const interval = setInterval(tick, 60000);
    const onVisibility = () => { if (!document.hidden) tick(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', onVisibility); };
  }, []);
  const cy = now.getFullYear(), cm = now.getMonth(), cd = now.getDate();
  const isBonusMonth = config.salary.bonusMonths.includes(cm);
  const nextM = (cm + 1) % 12;
  const nextY = cm === 11 ? cy + 1 : cy;
  const isNextBonus = config.salary.bonusMonths.includes(nextM);
  const currentSalary = config.salary.netAmount + (isBonusMonth ? config.salary.bonusAmount : 0);
  const nextSalary = config.salary.netAmount + (isNextBonus ? config.salary.bonusAmount : 0);
  const mKey = monthKey(now);

  const totalLiq = useMemo(() => Object.values(state.waterfallCurrent).reduce((a, b) => a + (b || 0), 0), [state.waterfallCurrent]);
  const totalInv = state.etfValue + state.fonteValue;
  const netWorth = totalInv + totalLiq;

  // ─── Spese fisse ───
  const EXPENSE_ICONS = { home: Home, zap: Zap, tv: Tv, shield: Shield, phone: Phone };
  const totalFixedExpenses = useMemo(() =>
    Object.values(config.expenses || {}).reduce((s, e: any) => s + safeNum(e.amount), 0),
  [config.expenses]);
  const realDisposable = currentSalary - totalFixedExpenses; // dopo spese fisse
  const realMargin = realDisposable - config.pac.monthlyAmount; // dopo PAC

  // Recent snapshot delta
  const prevSnap = state.snapshots.length > 0 ? state.snapshots[state.snapshots.length - 1] : null;
  const nwDelta = prevSnap ? netWorth - prevSnap.nw : 0;

  // ─── Handlers ───
  const updateState = (patch) => setState(s => ({ ...s, ...patch }));
  const updateConfig = (patch) => setConfig(c => ({ ...c, ...patch }));

  const toggleEvent = (key) => updateState({ events: { ...state.events, [key]: state.events[key] === 'done' ? null : 'done' } });

  // ─── Applicazione patrimoniale degli eventi ───
  // Distribuisce un importo riempiendo prima i livelli sotto cap (L1→L2→L3), eccedenza a L4
  const distributeToWaterfall = (amount, currentWf, levels) => {
    const result = { ...currentWf };
    const movements = {};
    let remaining = amount;
    // Riempi i livelli con cap (L1→L2→L3) in ordine, solo se sotto cap
    for (const lv of levels) {
      if (remaining <= 0) break;
      if (lv.cap <= 0) continue; // L4 lo gestiamo dopo
      const room = Math.max(0, lv.cap - (result[lv.id] || 0));
      if (room > 0) {
        const fill = Math.min(remaining, room);
        result[lv.id] = (result[lv.id] || 0) + fill;
        movements[lv.id] = fill;
        remaining -= fill;
      }
    }
    // Resto su L4 (overflow)
    if (remaining > 0) {
      const overflowLevel = levels.find(l => l.cap === 0);
      if (overflowLevel) {
        result[overflowLevel.id] = (result[overflowLevel.id] || 0) + remaining;
        movements[overflowLevel.id] = (movements[overflowLevel.id] || 0) + remaining;
      }
    }
    return { newWf: result, movements };
  };

  // Preleva un importo dalla liquidità complessiva, partendo da L4 (overflow) e risalendo
  const withdrawFromWaterfall = (amount, currentWf, levels) => {
    const result = { ...currentWf };
    const movements = {};
    let remaining = amount;
    // Ordine prelievo: L4 → L3 → L2 → L1 (svuota prima l'overflow)
    const reversed = [...levels].reverse();
    for (const lv of reversed) {
      if (remaining <= 0) break;
      const available = result[lv.id] || 0;
      if (available > 0) {
        const take = Math.min(remaining, available);
        result[lv.id] = available - take;
        movements[lv.id] = -take;
        remaining -= take;
      }
    }
    return { newWf: result, movements, shortfall: remaining };
  };

  const applySalaryConfirm = (eventKey, actualAmount) => {
    const amt = safeNum(actualAmount);
    if (amt <= 0) { setToast({ message: 'Importo non valido', type: 'error' }); return; }
    const { newWf, movements } = distributeToWaterfall(amt, state.waterfallCurrent, config.waterfallLevels);
    const entry = { type: 'salary_in', amount: amt, movements, appliedAt: new Date().toISOString() };
    updateState({
      events: { ...state.events, [eventKey]: 'done' },
      ledger: { ...state.ledger, [eventKey]: entry },
      waterfallCurrent: newWf,
    });
    const overflow = movements[config.waterfallLevels.find(l => l.cap === 0)?.id] || 0;
    setToast({
      message: overflow > 0
        ? `Stipendio ${fmt(amt)} accreditato · ${fmt(overflow)} su L4`
        : `Stipendio ${fmt(amt)} accreditato`,
      type: 'success'
    });
    setSalaryConfirmDialog(null);
  };

  const applyPacConfirm = (eventKey, actualAmount: number, excessAlloc: Record<string, number> = {}) => {
    if (actualAmount <= 0) { setToast({ message: 'Importo non valido', type: 'error' }); return; }
    const { newWf, movements, shortfall } = withdrawFromWaterfall(actualAmount, state.waterfallCurrent, config.waterfallLevels);
    if (shortfall > 0) {
      setToast({ message: `Liquidità insufficiente per PAC (${fmt(actualAmount)}). Mancano ${fmt(shortfall)}.`, type: 'error' });
      return;
    }
    // Aggiorna i valori per-strumento: base proporzionale + eccedenza esplicita
    const baseAmt = Math.min(actualAmount, config.pac.monthlyAmount);
    const excess = actualAmount - baseAmt;
    const newInstrumentValues = { ...(state.instrumentValues || {}) };
    config.pac.instruments.forEach(ins => {
      const baseShare = baseAmt * ins.pct / 100;
      const excessShare = excessAlloc[ins.id] || 0;
      newInstrumentValues[ins.id] = (safeNum(newInstrumentValues[ins.id]) + baseShare + excessShare);
    });

    const entry = {
      type: 'pac_out', amount: actualAmount, movements,
      etfDelta: actualAmount,
      baseAmount: baseAmt, excess,
      excessAlloc,
      appliedAt: new Date().toISOString()
    };
    updateState({
      events: { ...state.events, [eventKey]: 'done' },
      ledger: { ...state.ledger, [eventKey]: entry },
      waterfallCurrent: newWf,
      etfValue: state.etfValue + actualAmount,
      etfValueUpdatedAt: new Date().toISOString(),
      instrumentValues: newInstrumentValues,
      instrumentValuesUpdatedAt: new Date().toISOString(),
    });
    const excessMsg = excess > 0 ? ` · ${fmt(excess)} extra fuori piano` : '';
    setToast({ message: `PAC ${fmt(actualAmount)} eseguito · +${fmt(actualAmount)} su ETF${excessMsg}`, type: 'success' });
    setPacConfirmDialog(null);
  };

  const revertEvent = (eventKey) => {
    const entry = state.ledger[eventKey];
    if (!entry) {
      updateState({ events: { ...state.events, [eventKey]: null } });
      return;
    }
    const newWf = { ...state.waterfallCurrent };
    for (const [lvId, delta] of Object.entries(entry.movements)) {
      newWf[lvId] = Math.max(0, (newWf[lvId] || 0) - delta);
    }
    const patch = {
      events: { ...state.events, [eventKey]: null },
      ledger: { ...state.ledger, [eventKey]: undefined },
      waterfallCurrent: newWf,
    };
    if (entry.type === 'pac_out' && entry.etfDelta) {
      patch.etfValue = Math.max(0, state.etfValue - entry.etfDelta);
    }
    // Rimuovi pulito la voce dal ledger
    const newLedger = { ...state.ledger };
    delete newLedger[eventKey];
    patch.ledger = newLedger;
    updateState(patch);
    setToast({ message: 'Operazione annullata e patrimonio ripristinato', type: 'info' });
  };

  const handleSalaryClick = (eventKey, expectedAmount) => {
    if (state.events[eventKey] === 'done') {
      revertEvent(eventKey);
    } else {
      setSalaryConfirmDialog({ key: eventKey, expected: expectedAmount, actual: String(expectedAmount) });
    }
  };

  const handlePacClick = (eventKey) => {
    if (state.events[eventKey] === 'done') {
      revertEvent(eventKey);
    } else {
      const initExcess: Record<string, string> = {};
      config.pac.instruments.forEach(ins => { initExcess[ins.id] = ''; });
      setPacConfirmDialog({ key: eventKey, actual: String(config.pac.monthlyAmount), excessAlloc: initExcess });
    }
  };

  const saveSnapshot = () => {
    const k = todayKey();
    const snap = { date: k, etf: state.etfValue, fonte: state.fonteValue, liq: totalLiq, nw: netWorth };
    const newSnaps = [...state.snapshots.filter(s => s.date !== k), snap].sort((a, b) => a.date.localeCompare(b.date)).slice(-60);
    updateState({ snapshots: newSnaps });
    setToast({ message: 'Snapshot salvato', type: 'success' });
  };

  // Auto-rebalance: sposta eccedenza dai livelli con cap a L4
  const autoRebalanceOverflow = (wf: Record<string, number>, levels: typeof config.waterfallLevels) => {
    const result = { ...wf };
    const overflowLv = levels.find(l => l.cap === 0);
    if (!overflowLv) return result;
    for (const lv of levels) {
      if (lv.cap <= 0) continue;
      const excess = (result[lv.id] || 0) - lv.cap;
      if (excess > 0) {
        result[lv.id] = lv.cap;
        result[overflowLv.id] = (result[overflowLv.id] || 0) + excess;
      }
    }
    return result;
  };

  const updateWaterfall = (id, val) => {
    const newWf = { ...state.waterfallCurrent, [id]: safeNum(val) };
    // Auto-sposta eccedenza in L4
    const rebalanced = autoRebalanceOverflow(newWf, config.waterfallLevels);
    updateState({ waterfallCurrent: rebalanced });
  };

  // Versamento volontario ETF
  const applyVoluntaryInvestment = () => {
    const amt = safeNum(voluntaryAmount);
    if (amt <= 0) { setToast({ message: 'Importo non valido', type: 'error' }); return; }
    const allocTotal = Object.values(voluntaryAlloc).reduce((s, v) => s + safeNum(v), 0);
    if (Math.abs(allocTotal - amt) > 1) {
      setToast({ message: `Alloca esattamente ${fmt(amt)} — attuale: ${fmt(allocTotal)}`, type: 'error' });
      return;
    }
    const { newWf, movements, shortfall } = withdrawFromWaterfall(amt, state.waterfallCurrent, config.waterfallLevels);
    if (shortfall > 0) {
      setToast({ message: `Liquidità insufficiente. Mancano ${fmt(shortfall)}.`, type: 'error' });
      return;
    }
    const newInstrumentValues = { ...(state.instrumentValues || {}) };
    config.pac.instruments.forEach(ins => {
      newInstrumentValues[ins.id] = (safeNum(newInstrumentValues[ins.id]) + safeNum(voluntaryAlloc[ins.id] || 0));
    });
    const tx = {
      id: Date.now(), date: todayKey(), amount: amt,
      type: 'expense', category: 'work',
      note: `Versamento volontario ETF · ${Object.entries(voluntaryAlloc).filter(([,v]) => safeNum(v) > 0).map(([k, v]) => `${config.pac.instruments.find(i => i.id === k)?.name?.split(' ')[0] || k} ${fmt(safeNum(v))}`).join(', ')}`
    };
    updateState({
      waterfallCurrent: newWf,
      etfValue: state.etfValue + amt,
      etfValueUpdatedAt: new Date().toISOString(),
      instrumentValues: newInstrumentValues,
      instrumentValuesUpdatedAt: new Date().toISOString(),
      transactions: [tx, ...state.transactions].slice(0, 200),
    });
    setToast({ message: `Versamento volontario ${fmt(amt)} eseguito · +${fmt(amt)} su ETF`, type: 'success' });
    setVoluntaryAmount('');
    setVoluntaryAlloc({});
    setShowVoluntary(false);
  };

  const addTransaction = () => {
    const amt = safeNum(newTx.amount);
    if (amt <= 0) { setToast({ message: 'Importo non valido', type: 'error' }); return; }
    const tx = { id: Date.now(), date: todayKey(), amount: amt, type: newTx.type, category: newTx.category, note: newTx.note };
    updateState({ transactions: [tx, ...state.transactions].slice(0, 200) });
    setNewTx({ amount: '', type: 'income', category: 'other', note: '' });
    setShowAddTx(false);
    setToast({ message: 'Transazione aggiunta', type: 'success' });
  };

  const deleteTransaction = (id) => updateState({ transactions: state.transactions.filter(t => t.id !== id) });

  const exportData = () => {
    const data = { version: APP_VERSION, exportedAt: new Date().toISOString(), config, state };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pfd-backup-${todayKey()}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToast({ message: 'Backup esportato', type: 'success' });
  };

  const importData = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const d = JSON.parse(ev.target.result);
        if (d.config) setConfig({ ...DEFAULT_CONFIG, ...d.config });
        if (d.state) setState({ ...DEFAULT_STATE, ...d.state });
        setToast({ message: 'Dati importati con successo', type: 'success' });
      } catch (err) {
        setToast({ message: 'File JSON non valido', type: 'error' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const resetAll = () => {
    setConfirmDialog({
      title: 'Reset completo',
      message: 'Verranno cancellati TUTTI i dati: configurazione, snapshot, eventi, transazioni. Operazione irreversibile (suggerito: esporta prima un backup).',
      onConfirm: () => {
        setConfig(DEFAULT_CONFIG);
        setState(DEFAULT_STATE);
        setConfirmDialog(null);
        setToast({ message: 'Dashboard resettata ai default', type: 'info' });
      },
    });
  };

  // ─── Calendar status helpers ───
  const getEventStatus = (key, eventDay) => {
    const done = state.events[key] === 'done';
    if (done) return { status: 'done', label: 'Confermato', color: 'emerald' };
    if (cd > eventDay) return { status: 'overdue', label: 'Da confermare', color: 'amber' };
    if (cd === eventDay) return { status: 'today', label: 'Oggi', color: 'blue' };
    const diff = eventDay - cd;
    if (diff <= 2) return { status: 'soon', label: `Tra ${diff} ${diff === 1 ? 'giorno' : 'giorni'}`, color: 'blue' };
    return { status: 'upcoming', label: `Tra ${diff} giorni`, color: 'slate' };
  };

  // ─── FIRE data ───
  const fireData = useMemo(() => {
    const pts = [];
    const yearsHorizon = 25;
    for (let y = 0; y <= yearsHorizon; y++) {
      const mo = y * 12;
      const age = ageFromYear(config.profile.birthYear) + y;
      const customPac = calcFV(state.etfValue, config.pac.monthlyAmount, state.fireParams.rate, mo);
      const customFonte = calcFV(state.fonteValue, config.fonte.monthlyContribution, state.fireParams.fonteRate, mo);
      pts.push({
        age,
        year: cy + y,
        pess: Math.round((calcFV(state.etfValue, config.pac.monthlyAmount, 3.0, mo) + calcFV(state.fonteValue, config.fonte.monthlyContribution, 2.0, mo)) / 1000),
        equil: Math.round((calcFV(state.etfValue, config.pac.monthlyAmount, 5.0, mo) + calcFV(state.fonteValue, config.fonte.monthlyContribution, 3.0, mo)) / 1000),
        opt: Math.round((calcFV(state.etfValue, config.pac.monthlyAmount, 7.5, mo) + calcFV(state.fonteValue, config.fonte.monthlyContribution, 5.0, mo)) / 1000),
        custom: Math.round((customPac + customFonte) / 1000),
      });
    }
    return pts;
  }, [state.etfValue, state.fonteValue, state.fireParams, config, cy]);

  // ─── Scenario rows ───
  const scenarioRows = useMemo(() => [
    { label: 'Pessimistico', rate: 3.0, color: '#ef4444' },
    { label: 'Equilibrato',  rate: 5.0, color: '#3b82f6' },
    { label: 'Ottimistico',  rate: 7.5, color: '#10b981' },
    { label: 'Ponderato',    rate: 5.3, color: '#f59e0b' },
  ].map(sc => {
    const yearsTo50 = 50 - ageFromYear(config.profile.birthYear);
    const yearsTo55 = 55 - ageFromYear(config.profile.birthYear);
    const pac50 = calcFV(state.etfValue, config.pac.monthlyAmount, sc.rate, yearsTo50 * 12);
    const pac55 = calcFV(state.etfValue, config.pac.monthlyAmount, sc.rate, yearsTo55 * 12);
    return { ...sc, pac50: Math.round(pac50), r50: Math.round(pac50 * 0.04 / 12), pac55: Math.round(pac55), r55: Math.round(pac55 * 0.04 / 12) };
  }), [state.etfValue, config]);

  // ─── Monthly history grid (last 12 months) ───
  const monthlyHistory = useMemo(() => {
    const rows = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(cy, cm - i, 1);
      const k = monthKey(d);
      const isBonus = config.salary.bonusMonths.includes(d.getMonth());
      rows.push({
        key: k,
        label: `${MONTHS_IT_SHORT[d.getMonth()]} ${d.getFullYear()}`,
        year: d.getFullYear(),
        month: d.getMonth(),
        pacDone: state.events[`${k}-pac`] === 'done',
        salDone: state.events[`${k}-sal`] === 'done',
        isBonus,
        expectedSalary: config.salary.netAmount + (isBonus ? config.salary.bonusAmount : 0),
        isCurrent: i === 0,
      });
    }
    return rows;
  }, [state.events, config, cy, cm]);

  // ─── Milestone auto-generate ───
  const MILESTONES = useMemo((): Milestone[] => {
    const currentAge = ageFromYear(config.profile.birthYear);
    const currentYear = cy;
    const targetAge = state.fireParams.retireAge;
    const rate = state.fireParams.rate;
    const fonteRate = state.fireParams.fonteRate;
    const pac = config.pac.monthlyAmount;
    const fonte = config.fonte.monthlyContribution;

    if (!config.profile.name || pac <= 0) return [];

    const milestones: Milestone[] = [];

    // Step ogni 5 anni da ora+5 fino a targetAge-1
    const startAge = Math.ceil((currentAge + 3) / 5) * 5;
    for (let age = startAge; age < targetAge; age += 5) {
      const years = age - currentAge;
      if (years <= 0) continue;
      const mo = years * 12;
      const pacVal = calcFV(state.etfValue, pac, rate, mo);
      const fonteVal = calcFV(state.fonteValue, fonte, fonteRate, mo);
      const swr = Math.round(pacVal * 0.04 / 12);
      milestones.push({
        year: currentYear + years, age,
        label: `Patrimonio a ${age} anni`,
        pacT: Math.round(pacVal), fonteT: Math.round(fonteVal),
        note: swr > 0 ? `Rendita stimata ~${fmt(swr)}/mese · SWR 4%` : `Proiezione al ${rate}% reale`,
      });
    }

    // Target principale FIRE
    const targetYears = targetAge - currentAge;
    if (targetYears > 0) {
      const tPac = calcFV(state.etfValue, pac, rate, targetYears * 12);
      const tFonte = calcFV(state.fonteValue, fonte, fonteRate, targetYears * 12);
      milestones.push({
        year: currentYear + targetYears, age: targetAge,
        label: `TARGET FIRE — Ritiro a ${targetAge}`,
        pacT: Math.round(tPac), fonteT: Math.round(tFonte),
        note: `Rendita ~${fmt(Math.round(tPac * 0.04 / 12))}/mese · SWR 4%`,
        isTarget: true,
      });
    }

    // Target secondario +5 anni
    const age2 = targetAge + 5;
    const years2 = age2 - currentAge;
    if (years2 > 0) {
      const p2 = calcFV(state.etfValue, pac, rate, years2 * 12);
      const f2 = calcFV(state.fonteValue, fonte, fonteRate, years2 * 12);
      milestones.push({
        year: currentYear + years2, age: age2,
        label: `TARGET FIRE — Ritiro a ${age2}`,
        pacT: Math.round(p2), fonteT: Math.round(f2),
        note: `Rendita ~${fmt(Math.round(p2 * 0.04 / 12))}/mese · SWR 4%`,
        isTarget: true,
      });
    }

    return milestones;
  }, [config, state.etfValue, state.fonteValue, state.fireParams, cy]);

  // ─── Tabs ───
  const TABS = [
    { id: 'dashboard', label: 'Dashboard',    icon: LayoutDashboard },
    { id: 'portfolio', label: 'Portafoglio',  icon: BarChart3 },
    { id: 'market',    label: 'Mercato',      icon: TrendingUp },
    { id: 'analytics', label: 'Analytics',    icon: ArrowUpRight },
    { id: 'fire',      label: 'FIRE',         icon: Flame },
    { id: 'reviews',   label: 'Revisioni',    icon: FileText },
    { id: 'history',   label: 'Storico',      icon: HistoryIcon },
    { id: 'settings',  label: 'Impostazioni', icon: SettingsIcon },
  ];

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Caricamento dashboard...</p>
        </div>
      </div>
    );
  }

  const pacKey = `${mKey}-pac`, salKey = `${mKey}-sal`;
  const pacEvent = getEventStatus(pacKey, config.pac.payDay);
  const salEvent = getEventStatus(salKey, config.salary.payDay);

  // ─── ONBOARDING MODAL ───
  if (showOnboarding) {
    const steps = [
      { title: 'Il tuo profilo', subtitle: 'Come ti chiami e quando sei nato?' },
      { title: 'Stipendio & PAC', subtitle: 'Quanto guadagni e quanto investi ogni mese?' },
      { title: 'Obiettivo FIRE', subtitle: 'A che età vuoi raggiungere l\'indipendenza finanziaria?' },
    ];
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm w-full max-w-md p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center text-white">
              <Wallet size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-900">Finance Personal Dashboard</h1>
              <p className="text-xs text-slate-500">Configurazione iniziale — Step {onboardingStep + 1} di {steps.length}</p>
            </div>
          </div>
          <div className="flex gap-1.5 mb-6">
            {steps.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= onboardingStep ? 'bg-emerald-500' : 'bg-slate-200'}`} />
            ))}
          </div>
          <h2 className="text-sm font-semibold text-slate-900 mb-0.5">{steps[onboardingStep].title}</h2>
          <p className="text-xs text-slate-500 mb-5">{steps[onboardingStep].subtitle}</p>
          {onboardingStep === 0 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1.5">Nome</label>
                <input type="text" value={obName} onChange={e => setObName(e.target.value)}
                  placeholder="es. Mario"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1.5">Anno di nascita</label>
                <input type="number" value={obYear} onChange={e => setObYear(e.target.value)}
                  min={1950} max={2010}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white" />
              </div>
              <button onClick={() => obName.trim() && setOnboardingStep(1)} disabled={!obName.trim()}
                className="w-full py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
                Continua <ChevronRight size={15} />
              </button>
            </div>
          )}
          {onboardingStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1.5">Stipendio netto mensile (€)</label>
                <input type="number" value={obSalary} onChange={e => setObSalary(e.target.value)}
                  placeholder="es. 2000" min={0}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1.5">Investimento mensile PAC (€)</label>
                <input type="number" value={obPac} onChange={e => setObPac(e.target.value)}
                  placeholder="es. 500" min={0}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white" />
              </div>
              <p className="text-[11px] text-slate-400">Puoi modificare tutto nelle Impostazioni in qualsiasi momento.</p>
              <div className="flex gap-2 mt-2">
                <button onClick={() => setOnboardingStep(0)}
                  className="flex-1 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 flex items-center justify-center gap-1">
                  <ChevronLeft size={15} />Indietro
                </button>
                <button onClick={() => setOnboardingStep(2)}
                  className="flex-1 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-1">
                  Continua <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
          {onboardingStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1.5">Età target per il FIRE</label>
                <input type="number" value={obRetireAge} onChange={e => setObRetireAge(e.target.value)}
                  min={30} max={70} placeholder="es. 50"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white" />
                <p className="text-[11px] text-slate-400 mt-1">L'età in cui vuoi smettere di lavorare</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1.5">Rendimento annuo atteso (%)</label>
                <input type="number" value={obReturnRate} onChange={e => setObReturnRate(e.target.value)}
                  min={1} max={12} step={0.5} placeholder="es. 5"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white" />
                <p className="text-[11px] text-slate-400 mt-1">Tasso reale storico S&P 500 ≈ 7%, prudente ≈ 5%</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1.5">Rendita mensile desiderata (€)</label>
                <input type="number" value={obMonthlyExpense} onChange={e => setObMonthlyExpense(e.target.value)}
                  placeholder="es. 2000" min={0}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white" />
                {obMonthlyExpense && (
                  <p className="text-[11px] text-emerald-600 mt-1 font-medium">
                    FIRE number stimato: {fmt(safeNum(obMonthlyExpense) * 12 / 0.04)} (SWR 4%)
                  </p>
                )}
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => setOnboardingStep(1)}
                  className="flex-1 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 flex items-center justify-center gap-1">
                  <ChevronLeft size={15} />Indietro
                </button>
                <button onClick={completeOnboarding}
                  className="flex-1 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-1">
                  <Check size={15} />Inizia
                </button>
              </div>
            </div>
          )}
          <button onClick={() => setShowOnboarding(false)} className="text-[11px] text-slate-400 hover:text-slate-600 mt-4 block mx-auto">
            Salta — configuro tutto manualmente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif' }}>
      {/* ═══════════ HEADER ═══════════ */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center text-white shadow-sm">
              <Wallet size={18} strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-900 leading-tight">Finance Personal Dashboard</h1>
              <p className="text-xs text-slate-500 leading-tight">
                {config.profile.name} · {ageFromYear(config.profile.birthYear)} anni · v{APP_VERSION}
              </p>
            </div>
          </div>
          {/* Cloud sync indicator */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium"
            title="I tuoi dati sono salvati in cloud — sicuri da qualsiasi aggiornamento">
            {syncStatus === 'saving' && <><div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /><span className="text-amber-600 hidden sm:inline">Salvataggio...</span></>}
            {syncStatus === 'saved' && <><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-emerald-600 hidden sm:inline">Salvato in cloud</span></>}
            {syncStatus === 'error' && <><div className="w-2 h-2 rounded-full bg-rose-500" /><span className="text-rose-600 hidden sm:inline">Errore sync</span></>}
            {syncStatus === 'idle' && <><div className="w-2 h-2 rounded-full bg-emerald-400" /><span className="text-slate-400 hidden sm:inline">Cloud sync attivo</span></>}
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
          <div className="text-right">
            <div className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">{fmt(netWorth)}</div>
            <div className="text-xs text-slate-500 flex items-center justify-end gap-1.5">
              <span>patrimonio netto</span>
              {nwDelta !== 0 && prevSnap && (
                <Badge color={nwDelta > 0 ? 'emerald' : 'rose'}>
                  {nwDelta > 0 ? '+' : ''}{fmt(nwDelta)} vs last snap
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Tab nav */}
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-1 overflow-x-auto">
          {TABS.map(t => {
            const isActive = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${isActive ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                <t.icon size={15} />{t.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* ═══════════ DASHBOARD ═══════════ */}
        {tab === 'dashboard' && (
          <div className="space-y-5">
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard label="ETF Scalable" value={fmt(state.etfValue)} sub="Core Portfolio" accent="blue" icon={TrendingUp} />
              <StatCard label="Fon.Te." value={fmt(state.fonteValue)} sub="Comparto Dinamico" accent="purple" icon={PiggyBank} />
              <StatCard label="Liquidità gestita" value={fmt(totalLiq)} sub={`${((totalLiq/netWorth)*100).toFixed(1)}% del totale`} accent="amber" icon={Wallet} />
              <StatCard label="PAC mensile" value={fmt(config.pac.monthlyAmount)} sub={`SDD il ${config.pac.payDay}° del mese`} accent="indigo" icon={CreditCard} />
            </div>

            {/* ─── Today's actions widget ─── */}
            {(() => {
              const actions = [];
              const lv3 = config.waterfallLevels[2];
              const lv3Cur = state.waterfallCurrent.l3 || 0;
              const lv4Cur = state.waterfallCurrent.l4 || 0;
              const daysToPac = config.pac.payDay - cd;
              const daysToSal = config.salary.payDay - cd;

              if (cd === config.salary.payDay && !state.events[salKey]) {
                actions.push({ priority: 1, icon: Briefcase, color: 'emerald', title: 'Stipendio in arrivo oggi', desc: `${fmt(currentSalary)}${isBonusMonth ? ' (mensilità bonus)' : ''} — conferma quando arriva e aggiorna il waterfall` });
              } else if (daysToSal === 1 && !state.events[salKey]) {
                actions.push({ priority: 2, icon: Briefcase, color: 'blue', title: 'Stipendio domani', desc: `Atteso ${fmt(currentSalary)}` });
              }

              if (cd === config.pac.payDay && !state.events[pacKey]) {
                actions.push({ priority: 1, icon: CreditCard, color: 'indigo', title: 'PAC in esecuzione oggi', desc: `${fmt(config.pac.monthlyAmount)} su ${config.pac.broker} — verifica esecuzione SDD` });
              } else if (cd > config.pac.payDay && !state.events[pacKey]) {
                actions.push({ priority: 1, icon: AlertCircle, color: 'amber', title: 'PAC non confermato', desc: `Doveva partire il ${config.pac.payDay} — verifica su ${config.pac.broker}` });
              } else if (daysToPac === 1 && !state.events[pacKey]) {
                actions.push({ priority: 2, icon: CreditCard, color: 'blue', title: 'PAC domani', desc: `Assicurati che ${fmt(config.pac.monthlyAmount)} sia disponibile su L3` });
              }

              if (cd >= config.salary.payDay && state.events[salKey] && lv3Cur < lv3.cap * 0.7) {
                actions.push({ priority: 2, icon: Wallet, color: 'amber', title: 'L3 sotto soglia operativa', desc: `Liquidità operativa a ${fmt(lv3Cur)} (target ${fmt(lv3.cap)}) — rabbocca dal conto principale` });
              }

              if (lv4Cur >= 1000) {
                actions.push({ priority: 3, icon: Rocket, color: 'indigo', title: 'Overflow L4 pronto per il mercato', desc: `${fmt(lv4Cur)} disponibili per acquisti tattici DCA su S&P 500` });
              }

              config.waterfallLevels.slice(0, 3).forEach(lv => {
                const cur = state.waterfallCurrent[lv.id] || 0;
                if (lv.cap > 0 && cur > lv.cap * 1.1) {
                  actions.push({ priority: 3, icon: ChevronRight, color: 'amber', title: `Overflow su ${lv.name}`, desc: `${fmt(cur - lv.cap)} oltre il cap — sposta su L4 o investi` });
                }
              });

              // Snapshot automatico — nessun avviso manuale necessario

              if (cm === 4 && state.reviews.length === 0) {
                actions.push({ priority: 3, icon: FileText, color: 'indigo', title: 'Revisione annuale 2026', desc: 'Documenta le decisioni strutturali fatte quest\'anno nella sezione Revisioni' });
              }

              if (actions.length === 0) {
                return (
                  <Card>
                    <div className="p-5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Tutto in ordine</p>
                        <p className="text-xs text-slate-500">Nessuna azione pendente. Il piano sta procedendo regolarmente.</p>
                      </div>
                    </div>
                  </Card>
                );
              }

              actions.sort((a, b) => a.priority - b.priority);
              const topActions = actions.slice(0, 4);

              return (
                <Card>
                  <CardHeader title="Cosa fare oggi" subtitle={`${actions.length} ${actions.length === 1 ? 'azione contestuale' : 'azioni contestuali'}`} icon={Sparkles} accentColor="emerald" />
                  <div className="px-5 pb-5 space-y-2">
                    {topActions.map((a, i) => {
                      const colors = {
                        emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
                        blue: 'bg-blue-50 border-blue-200 text-blue-700',
                        amber: 'bg-amber-50 border-amber-200 text-amber-700',
                        rose: 'bg-rose-50 border-rose-200 text-rose-700',
                        indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
                        slate: 'bg-slate-50 border-slate-200 text-slate-700',
                      };
                      const ringColors = {
                        emerald: 'bg-emerald-100 text-emerald-700',
                        blue: 'bg-blue-100 text-blue-700',
                        amber: 'bg-amber-100 text-amber-700',
                        rose: 'bg-rose-100 text-rose-700',
                        indigo: 'bg-indigo-100 text-indigo-700',
                        slate: 'bg-slate-100 text-slate-700',
                      };
                      return (
                        <div key={i} className={`rounded-xl border p-3 flex items-start gap-3 ${colors[a.color]}`}>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${ringColors[a.color]}`}>
                            <a.icon size={15} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900">{a.title}</p>
                            <p className="text-xs text-slate-600 mt-0.5">{a.desc}</p>
                          </div>
                          {a.priority === 1 && <Badge color={a.color}>Ora</Badge>}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              );
            })()}

            {/* Calendar */}
            <Card>
              <CardHeader
                title={`${MONTHS_IT[cm]} ${cy}`}
                subtitle={now.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
                icon={Calendar}
                accentColor="blue"
                action={
                  <div className="flex items-center gap-2">
                    {isBonusMonth && <Badge color="amber" icon={Sparkles}>Mese bonus</Badge>}
                    <Badge color="emerald" icon={Save}>Auto-snapshot attivo</Badge>
                  </div>
                }
              />
              <div className="px-5 pb-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {/* PAC event */}
                  <div className={`rounded-xl border-2 p-4 ${pacEvent.color === 'emerald' ? 'bg-emerald-50 border-emerald-200' : pacEvent.color === 'amber' ? 'bg-amber-50 border-amber-200' : pacEvent.color === 'blue' ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <CreditCard size={14} className="text-slate-500 flex-shrink-0" />
                          <p className="text-sm font-semibold text-slate-900">PAC {config.pac.broker}</p>
                        </div>
                        <p className="text-xs text-slate-600">
                          {config.pac.payDay} {MONTHS_IT[cm]} · <span className="font-semibold tabular-nums">{fmt(config.pac.monthlyAmount)}</span>
                        </p>
                        {state.events[pacKey] === 'done' && state.ledger[pacKey] && (
                          <p className="text-[11px] text-emerald-700 mt-1 font-medium tabular-nums">
                            ✓ Eseguito · +{fmt(state.ledger[pacKey].etfDelta)} ETF
                          </p>
                        )}
                        <div className="mt-1.5">
                          <Badge color={pacEvent.color}>{pacEvent.label}</Badge>
                        </div>
                      </div>
                      <Button size="xs" onClick={() => handlePacClick(pacKey)}
                        variant={pacEvent.status === 'done' ? 'primary' : 'secondary'}
                        icon={pacEvent.status === 'done' ? Check : null}>
                        {pacEvent.status === 'done' ? 'Annulla' : 'Conferma'}
                      </Button>
                    </div>
                  </div>

                  {/* Salary event */}
                  <div className={`rounded-xl border-2 p-4 ${salEvent.color === 'emerald' ? 'bg-emerald-50 border-emerald-200' : salEvent.color === 'amber' ? 'bg-amber-50 border-amber-200' : salEvent.color === 'blue' ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <Briefcase size={14} className="text-slate-500 flex-shrink-0" />
                          <p className="text-sm font-semibold text-slate-900">Stipendio netto</p>
                          {isBonusMonth && <Badge color="amber">+ 14ª</Badge>}
                        </div>
                        <p className="text-xs text-slate-600">
                          {config.salary.payDay} {MONTHS_IT[cm]} · <span className="font-semibold tabular-nums">{fmt(currentSalary)}</span>
                        </p>
                        {isBonusMonth && (
                          <p className="text-[11px] text-amber-700 mt-0.5">{fmt(config.salary.netAmount)} + {fmt(config.salary.bonusAmount)} bonus</p>
                        )}
                        {state.events[salKey] === 'done' && state.ledger[salKey] && (
                          <p className="text-[11px] text-emerald-700 mt-1 font-medium tabular-nums">
                            ✓ Accreditato {fmt(state.ledger[salKey].amount)}
                          </p>
                        )}
                        <div className="mt-1.5">
                          <Badge color={salEvent.color}>{salEvent.label}</Badge>
                        </div>
                      </div>
                      <Button size="xs" onClick={() => handleSalaryClick(salKey, currentSalary)}
                        variant={salEvent.status === 'done' ? 'primary' : 'secondary'}
                        icon={salEvent.status === 'done' ? Check : null}>
                        {salEvent.status === 'done' ? 'Annulla' : 'Conferma'}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  {/* Riga principale */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className="text-center">
                      <div className="text-base font-semibold text-emerald-700 tabular-nums">{fmt(currentSalary)}</div>
                      <div className="text-[10px] text-slate-500">Stipendio</div>
                    </div>
                    <div className="text-center">
                      <div className="text-base font-semibold text-rose-600 tabular-nums">−{fmt(totalFixedExpenses)}</div>
                      <div className="text-[10px] text-slate-500">Spese fisse</div>
                    </div>
                    <div className="text-center">
                      <div className="text-base font-semibold text-indigo-600 tabular-nums">−{fmt(config.pac.monthlyAmount)}</div>
                      <div className="text-[10px] text-slate-500">PAC</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-base font-semibold tabular-nums ${realMargin >= 0 ? 'text-blue-700' : 'text-amber-600'}`}>
                        {realMargin >= 0 ? '+' : ''}{fmt(realMargin)}
                      </div>
                      <div className="text-[10px] text-slate-500">Margine reale</div>
                    </div>
                  </div>
                  {/* Alert margine */}
                  {totalFixedExpenses > 0 && realMargin > 50 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex items-center gap-2 text-xs text-blue-800">
                      <Rocket size={13} className="text-blue-600 flex-shrink-0" />
                      <span>Margine teorico <strong>{fmt(realMargin)}</strong> — escluse spese variabili. Se hai liquidità in L4, valuta un versamento volontario una tantum invece di aumentare il PAC fisso</span>
                    </div>
                  )}
                  {totalFixedExpenses > 0 && realMargin < 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-2 text-xs text-amber-800">
                      <AlertCircle size={13} className="text-amber-600 flex-shrink-0" />
                      <span>Il PAC supera il margine disponibile di <strong>{fmt(Math.abs(realMargin))}</strong> — verifica le spese o riduci il PAC</span>
                    </div>
                  )}
                  {totalFixedExpenses === 0 && (
                    <p className="text-[11px] text-slate-400 text-center">Configura le spese fisse in Impostazioni per vedere il margine reale</p>
                  )}
                </div>

                {/* Next month preview */}
                {isNextBonus && (
                  <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 flex items-center gap-2 text-xs text-amber-800">
                    <Sparkles size={14} />
                    <span><strong>Prossimo mese</strong> — {MONTHS_IT[nextM]} {nextY} è bonus · stipendio atteso {fmt(nextSalary)}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Waterfall */}
            <Card>
              <CardHeader
                title="Sistema a cascata"
                subtitle={`Liquidità totale ${fmt(totalLiq)}`}
                icon={Wallet}
                accentColor="emerald"
                action={
                  <div className="flex items-center gap-2">
                    <Button size="sm" icon={Plus} variant="primary" onClick={() => {
                      const init: Record<string, string> = {};
                      config.pac.instruments.forEach(ins => { init[ins.id] = ''; });
                      setVoluntaryAlloc(init);
                      setVoluntaryAmount('');
                      setShowVoluntary(true);
                    }}>Versamento</Button>
                    <Button size="sm" icon={editWaterfall ? X : Edit3} onClick={() => setEditWaterfall(!editWaterfall)}>
                      {editWaterfall ? 'Chiudi' : 'Modifica'}
                    </Button>
                  </div>
                }
              />
              <div className="px-5 pb-5 space-y-3">
                {config.waterfallLevels.map((lv, i) => {
                  const Icon = WF_ICON_MAP[lv.icon] || Shield;
                  const current = state.waterfallCurrent[lv.id] || 0;
                  const over = lv.cap > 0 && current > lv.cap;
                  return (
                    <div key={lv.id} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0 mt-0.5" style={{ background: lv.color }}>
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900">{lv.name}</p>
                            <p className="text-[11px] text-slate-500">{lv.desc}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {editWaterfall ? (
                              <MoneyInput size="sm" value={current} onChange={v => updateWaterfall(lv.id, v)} className="w-28" />
                            ) : (
                              <span className="text-sm font-semibold tabular-nums" style={{ color: lv.color }}>{fmt(current)}</span>
                            )}
                            {lv.cap > 0 && <span className="text-xs text-slate-400 tabular-nums">/ {fmt(lv.cap)}</span>}
                          </div>
                        </div>
                        <ProgressBar value={current} max={lv.cap || current} color={lv.color} showOverflow />
                        {over && (
                          <p className="text-[11px] text-amber-700 mt-1.5 flex items-center gap-1">
                            <ChevronRight size={11} />Overflow {fmt(current - lv.cap)} → spostato automaticamente in L4
                          </p>
                        )}
                        {i === 3 && current > 0 && (
                          <p className="text-[11px] text-indigo-700 mt-1.5 flex items-center gap-1">
                            <Rocket size={11} />Pronto per acquisti tattici DCA S&P 500
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* History chart */}
            {state.snapshots.length >= 2 && (
              <Card>
                <CardHeader title="Andamento patrimonio" subtitle={`${state.snapshots.length} snapshot registrati`} icon={TrendingUp} accentColor="emerald" />
                <div className="px-5 pb-5">
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={state.snapshots}>
                      <defs>
                        <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.02}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={v => fmt(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                      <Area type="monotone" dataKey="nw" stroke="#10b981" fill="url(#nwGrad)" name="Patrimonio netto" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ═══════════ PORTFOLIO ═══════════ */}
        {tab === 'portfolio' && (() => {
          // Per-instrument tracking with drift detection
          const instrumentValues = state.instrumentValues || {};
          const filledInstruments = config.pac.instruments.filter(ins => safeNum(instrumentValues[ins.id]) > 0);
          const allInstrumentsFilled = filledInstruments.length === config.pac.instruments.length;
          const partialTracking = filledInstruments.length > 0 && !allInstrumentsFilled;
          const instrumentTotal = config.pac.instruments.reduce((s, ins) => s + safeNum(instrumentValues[ins.id]), 0);
          const hasPerInstrument = allInstrumentsFilled;
          const effectiveEtfTotal = hasPerInstrument ? instrumentTotal : state.etfValue;

          const instrumentsWithDrift = config.pac.instruments.map(ins => {
            const actualValue = hasPerInstrument ? safeNum(instrumentValues[ins.id]) : effectiveEtfTotal * ins.pct / 100;
            const actualPct = effectiveEtfTotal > 0 ? (actualValue / effectiveEtfTotal) * 100 : 0;
            const targetValue = effectiveEtfTotal * ins.pct / 100;
            const driftPct = actualPct - ins.pct;
            const driftAbs = actualValue - targetValue;
            return { ...ins, actualValue, actualPct, targetValue, driftPct, driftAbs };
          });
          const maxDrift = hasPerInstrument ? Math.max(...instrumentsWithDrift.map(i => Math.abs(i.driftPct))) : 0;
          const driftAlert = hasPerInstrument && maxDrift >= 5;

          return (
            <div className="space-y-5">
              <Card>
                <CardHeader title="Posizioni di mercato"
                  subtitle={hasPerInstrument ? 'Tracking per singolo strumento attivo' : 'Aggiorna almeno un valore per attivare il tracking per-strumento e il drift'}
                  icon={Edit3} accentColor="slate" />
                <div className="px-5 pb-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs text-slate-500 font-medium">ETF aggregato (fallback)</label>
                        {state.etfValueUpdatedAt && (
                          <span className={`text-[10px] ${isStale(state.etfValueUpdatedAt, 60) ? 'text-amber-600 font-medium' : 'text-slate-400'}`}>
                            {isStale(state.etfValueUpdatedAt, 60) && '⚠ '}aggiornato {formatRelativeTime(state.etfValueUpdatedAt)}
                          </span>
                        )}
                      </div>
                      <MoneyInput size="lg" value={state.etfValue} onChange={v => updateState({ etfValue: safeNum(v), etfValueUpdatedAt: new Date().toISOString() })} />
                      <p className="text-[10px] text-slate-400 mt-1">Usato se non aggiorni i singoli strumenti</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs text-slate-500 font-medium">Fon.Te. — posizione attuale</label>
                        {state.fonteValueUpdatedAt && (
                          <span className={`text-[10px] ${isStale(state.fonteValueUpdatedAt, 180) ? 'text-amber-600 font-medium' : 'text-slate-400'}`}>
                            {isStale(state.fonteValueUpdatedAt, 180) && '⚠ '}aggiornato {formatRelativeTime(state.fonteValueUpdatedAt)}
                          </span>
                        )}
                      </div>
                      <MoneyInput size="lg" value={state.fonteValue} onChange={v => updateState({ fonteValue: safeNum(v), fonteValueUpdatedAt: new Date().toISOString() })} />
                      <p className="text-[10px] text-slate-400 mt-1">Aggiorna con estratto conto annuale</p>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <div>
                        <p className="text-xs text-slate-500 font-medium">Tracking per-strumento (opzionale)</p>
                        {state.instrumentValuesUpdatedAt && hasPerInstrument && (
                          <p className={`text-[10px] mt-0.5 ${isStale(state.instrumentValuesUpdatedAt, 30) ? 'text-amber-600 font-medium' : 'text-slate-400'}`}>
                            {isStale(state.instrumentValuesUpdatedAt, 30) && '⚠ '}ultimo aggiornamento {formatRelativeTime(state.instrumentValuesUpdatedAt)}
                          </p>
                        )}
                      </div>
                      {hasPerInstrument && (
                        <button onClick={() => updateState({ instrumentValues: {}, instrumentValuesUpdatedAt: null })}
                          className="text-[11px] text-slate-500 hover:text-rose-600 flex items-center gap-1">
                          <RotateCcw size={11} />Reset tracking
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      {config.pac.instruments.map(ins => (
                        <div key={ins.id} className="flex items-center gap-2.5">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: ins.color }} />
                          <span className="text-sm text-slate-700 flex-1 min-w-0 truncate">{ins.name}</span>
                          <MoneyInput size="sm" className="w-32"
                            value={state.instrumentValues?.[ins.id] || ''}
                            onChange={v => updateState({
                              instrumentValues: { ...(state.instrumentValues || {}), [ins.id]: safeNum(v) },
                              instrumentValuesUpdatedAt: new Date().toISOString()
                            })} />
                        </div>
                      ))}
                    </div>
                    {hasPerInstrument && (
                      <p className="text-[11px] text-emerald-700 mt-2 flex items-center gap-1">
                        <Check size={11} />Tracking completo · totale {fmt(instrumentTotal)}
                        {Math.abs(instrumentTotal - state.etfValue) > 100 && <span className="text-amber-700"> · diverge dall'aggregato ({fmt(state.etfValue)})</span>}
                      </p>
                    )}
                    {partialTracking && (
                      <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-start gap-2">
                        <AlertCircle size={13} className="text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-[11px] text-amber-900">
                          <strong>Tracking incompleto:</strong> compilati {filledInstruments.length}/{config.pac.instruments.length} strumenti. Drift detection disattivato per evitare calcoli falsati. Compila tutti gli strumenti oppure resetta il tracking.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {driftAlert && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-900">Drift di portafoglio rilevato</p>
                    <p className="text-xs text-amber-800 mt-0.5">
                      Almeno uno strumento è oltre 5pp dal target. Considera un ribilanciamento o un aggiustamento del PAC tattico.
                    </p>
                  </div>
                  <Button size="sm" onClick={() => setShowRebalance(true)}>Suggerisci</Button>
                </div>
              )}

              <Card>
                <CardHeader title="Core Portfolio ETF"
                  subtitle={`${fmt(effectiveEtfTotal)} totale · TER medio ${(config.pac.instruments.reduce((s,i) => s+i.ter*i.pct, 0)/100).toFixed(2)}%${hasPerInstrument ? ' · drift max ' + maxDrift.toFixed(1) + 'pp' : ''}`}
                  icon={BarChart3} accentColor="blue" />
                <div className="px-5 pb-5 grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-6 items-center">
                  <div className="space-y-3">
                    {instrumentsWithDrift.map(ins => {
                      const driftColor = Math.abs(ins.driftPct) < 1 ? 'slate' : Math.abs(ins.driftPct) < 3 ? 'blue' : Math.abs(ins.driftPct) < 5 ? 'amber' : 'rose';
                      const driftBg = { slate: 'bg-slate-50 text-slate-600', blue: 'bg-blue-50 text-blue-700', amber: 'bg-amber-50 text-amber-700', rose: 'bg-rose-50 text-rose-700' }[driftColor];
                      return (
                        <div key={ins.id} className="pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                          <div className="flex items-center gap-3 mb-1.5">
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: ins.color }} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">{ins.name}</p>
                              <p className="text-[11px] text-slate-500">PAC {fmt(config.pac.monthlyAmount * ins.pct / 100)}/mese · TER {ins.ter}%</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-semibold tabular-nums" style={{ color: ins.color }}>{fmt(ins.actualValue)}</p>
                              <p className="text-[11px] text-slate-500 tabular-nums">{ins.actualPct.toFixed(1)}% / {ins.pct}%</p>
                            </div>
                          </div>
                          {hasPerInstrument && (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden relative">
                                <div className="absolute top-0 bottom-0 w-px bg-slate-400" style={{ left: `${ins.pct}%` }} />
                                <div className="h-full rounded-full" style={{ width: `${Math.min(ins.actualPct, 100)}%`, background: ins.color }} />
                              </div>
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${driftBg} tabular-nums w-14 text-center`}>
                                {ins.driftPct > 0 ? '+' : ''}{ins.driftPct.toFixed(1)}pp
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={instrumentsWithDrift} dataKey="actualValue" cx="50%" cy="50%" outerRadius={80} innerRadius={45} labelLine={false}
                        label={({ actualPct }) => actualPct >= 8 ? `${actualPct.toFixed(0)}%` : ''}>
                        {instrumentsWithDrift.map(i => <Cell key={i.id} fill={i.color} />)}
                      </Pie>
                      <Tooltip formatter={(v, n, p) => [fmt(v), p.payload.name]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card>
                <CardHeader title="Fon.Te. Previdenza Complementare" subtitle={`${fmt(state.fonteValue)} · Comparto ${config.fonte.comparto}`} icon={PiggyBank} accentColor="purple" />
                <div className="px-5 pb-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    {[
                      { k: 'Comparto', v: config.fonte.comparto },
                      { k: 'TER', v: `${config.fonte.ter}%` },
                      { k: 'Asset allocation', v: '60% Az. / 40% Obbl.' },
                      { k: 'Contributo/mese', v: `~${fmt(config.fonte.monthlyContribution)}` },
                    ].map(it => (
                      <div key={it.k} className="bg-purple-50 rounded-lg p-3">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-purple-600 mb-1">{it.k}</div>
                        <div className="text-sm font-semibold text-slate-900">{it.v}</div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
                    <Info size={14} className="text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-900">
                      <strong>Leva fiscale:</strong> Deducibilità contributi volontari Rigo E27 · Aliquota agevolata 15% → 9% in erogazione · Contributo datoriale aggiuntivo attivo · Delta comparto stimato a 20 anni: <strong>+€51.000</strong>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Rebalancing modal */}
              {showRebalance && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowRebalance(false)}>
                  <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-5 shadow-xl" onClick={e => e.stopPropagation()}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">Suggerimento ribilanciamento</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Allocazione PAC tattica per ridurre il drift</p>
                      </div>
                      <button onClick={() => setShowRebalance(false)} className="text-slate-400 hover:text-slate-700">
                        <X size={18} />
                      </button>
                    </div>
                    <div className="space-y-2 mb-4">
                      {instrumentsWithDrift.map(ins => {
                        // Reverse the drift: if overweight, suggest reducing PAC; if underweight, suggest increasing
                        const baseAlloc = config.pac.monthlyAmount * ins.pct / 100;
                        const adjustment = -ins.driftPct * config.pac.monthlyAmount / 100;
                        const suggestedAlloc = Math.max(0, baseAlloc + adjustment);
                        return (
                          <div key={ins.id} className="flex items-center gap-2 text-xs">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ins.color }} />
                            <span className="flex-1 truncate text-slate-700">{ins.name}</span>
                            <span className="text-slate-400 tabular-nums">{fmt(baseAlloc)} →</span>
                            <span className="font-semibold tabular-nums" style={{ color: ins.color }}>{fmt(suggestedAlloc)}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 mb-3">
                      <p className="text-[11px] text-blue-900">
                        <strong>Approccio dolce:</strong> mantieni il PAC fisso e usa l'overflow (Liv.4) per acquisti tattici sugli strumenti sottopesati. Evita vendite per non innescare tassazione.
                      </p>
                    </div>
                    <Button variant="primary" className="w-full" onClick={() => setShowRebalance(false)}>Ho capito</Button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ═══════════ FIRE ═══════════ */}
        {tab === 'fire' && (
          <div className="space-y-5">
            <Card>
              <CardHeader title="Scenari FIRE interattivi" subtitle={`PAC ${fmt(config.pac.monthlyAmount)}/mese · Fon.Te. ${fmt(config.fonte.monthlyContribution)}/mese`} icon={Flame} accentColor="orange" />
              <div className="px-5 pb-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                  {[
                    { key: 'rate', label: 'Rendimento PAC reale', min: 1, max: 10, step: 0.5, unit: '%' },
                    { key: 'fonteRate', label: 'Rendimento Fon.Te. reale', min: 1, max: 7, step: 0.5, unit: '%' },
                    { key: 'retireAge', label: 'Età ritiro target', min: 45, max: 60, step: 1, unit: ' a' },
                  ].map(sl => (
                    <div key={sl.key}>
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="text-xs text-slate-500 font-medium">{sl.label}</span>
                        <span className="text-lg font-bold text-orange-600 tabular-nums">{state.fireParams[sl.key]}{sl.unit}</span>
                      </div>
                      <input type="range" min={sl.min} max={sl.max} step={sl.step} value={state.fireParams[sl.key]}
                        onChange={e => updateState({ fireParams: { ...state.fireParams, [sl.key]: +e.target.value } })}
                        className="w-full accent-orange-500" />
                      <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                        <span>{sl.min}{sl.unit}</span><span>{sl.max}{sl.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={fireData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="age" tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => `${v}a`} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => `€${v}k`} />
                    <Tooltip formatter={v => `€${v}k`} labelFormatter={v => `Età ${v} anni`} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                    <Line type="monotone" dataKey="pess" name="Pessimistico 3%" stroke="#ef4444" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="equil" name="Equilibrato 5%" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="opt" name="Ottimistico 7.5%" stroke="#10b981" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="custom" name="Personalizzato" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <CardHeader title="Rendita stimata · SWR 4%" subtitle="Tasso di prelievo sicuro applicato al PAC" icon={Target} accentColor="emerald" />
              <div className="px-5 pb-5 overflow-x-auto">
                <table className="w-full text-sm" style={{ minWidth: 480 }}>
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Scenario</th>
                      <th className="text-right py-2.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">PAC a 50a</th>
                      <th className="text-right py-2.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Rendita</th>
                      <th className="text-right py-2.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">PAC a 55a</th>
                      <th className="text-right py-2.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Rendita</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenarioRows.map(sc => (
                      <tr key={sc.label} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: sc.color }} />
                            <span className="font-medium text-slate-900">{sc.label} {sc.rate}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right tabular-nums text-slate-700">{fmt(sc.pac50)}</td>
                        <td className="py-3 px-2 text-right tabular-nums font-semibold" style={{ color: sc.color }}>{fmt(sc.r50)}/m</td>
                        <td className="py-3 px-2 text-right tabular-nums text-slate-700">{fmt(sc.pac55)}</td>
                        <td className="py-3 px-2 text-right tabular-nums font-semibold" style={{ color: sc.color }}>{fmt(sc.r55)}/m</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card>
              <CardHeader title="Roadmap milestone" subtitle="Sentiero di accumulo 2027 → 2049" icon={Flag} accentColor="indigo" />
              <div className="px-5 pb-5">
                <div className="relative">
                  <div className="absolute left-3 top-2 bottom-2 w-px bg-slate-200" />
                  <div className="space-y-3">
                    {MILESTONES.map(ms => {
                      const prog = Math.min(state.etfValue / ms.pacT, 1);
                      const reached = state.etfValue >= ms.pacT && state.fonteValue >= ms.fonteT;
                      return (
                        <div key={ms.year} className="relative pl-9">
                          <div className={`absolute left-1 top-3 w-4 h-4 rounded-full border-2 border-white shadow-sm ${reached ? 'bg-emerald-500' : ms.isTarget ? 'bg-orange-500' : 'bg-slate-300'}`} />
                          <div className={`rounded-xl border p-3.5 ${ms.isTarget ? 'bg-orange-50 border-orange-200' : reached ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-semibold text-slate-900">{ms.label}</p>
                                  {reached && <Badge color="emerald" icon={Check}>Raggiunto</Badge>}
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5">{ms.year} · {ms.age} anni · {ms.note}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-sm font-semibold text-slate-900 tabular-nums">{fmtK(ms.pacT)}</p>
                                <p className="text-[10px] text-slate-500">+ Fon.Te. {fmtK(ms.fonteT)}</p>
                              </div>
                            </div>
                            <div className="mt-2">
                              <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                <span>Progresso PAC</span>
                                <span className="tabular-nums">{(prog * 100).toFixed(1)}%</span>
                              </div>
                              <ProgressBar value={state.etfValue} max={ms.pacT} color={ms.isTarget ? '#f97316' : '#10b981'} height={4} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ═══════════ HISTORY ═══════════ */}
        {tab === 'history' && (() => {
          // Build cash flow for the selected month
          const targetDate = new Date(cy, cm + cashflowMonth, 1);
          const targetKey = monthKey(targetDate);
          const targetMonth = targetDate.getMonth();
          const targetYear = targetDate.getFullYear();
          const targetIsBonus = config.salary.bonusMonths.includes(targetMonth);
          const targetSalary = config.salary.netAmount + (targetIsBonus ? config.salary.bonusAmount : 0);
          const targetSalDone = state.events[`${targetKey}-sal`] === 'done';
          const targetPacDone = state.events[`${targetKey}-pac`] === 'done';
          const monthTxs = state.transactions.filter(tx => tx.date.startsWith(targetKey));
          const extraIncome = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
          const extraExpense = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
          const totalIn = (targetSalDone ? targetSalary : 0) + extraIncome;
          const totalOut = (targetPacDone ? config.pac.monthlyAmount : 0) + extraExpense;
          const netFlow = totalIn - totalOut;
          const isCurrentMonth = cashflowMonth === 0;
          const isFuture = cashflowMonth > 0;
          const projTotalIn = targetSalary + extraIncome;
          const projTotalOut = config.pac.monthlyAmount + totalFixedExpenses + extraExpense;
          const projNetFlow = projTotalIn - projTotalOut;

          return (
            <div className="space-y-5">
              <Card>
                <CardHeader title="Cash flow mensile"
                  subtitle={`${MONTHS_IT[targetMonth]} ${targetYear}${targetIsBonus ? ' · mese bonus' : ''}`}
                  icon={TrendingUp} accentColor="emerald"
                  action={
                    <div className="flex items-center gap-1">
                      <Button size="xs" icon={ChevronLeft} onClick={() => setCashflowMonth(cashflowMonth - 1)} />
                      <span className="text-xs text-slate-500 px-2 tabular-nums">{cashflowMonth === 0 ? 'attuale' : cashflowMonth > 0 ? `+${cashflowMonth}` : cashflowMonth}</span>
                      <Button size="xs" icon={ChevronRight} onClick={() => setCashflowMonth(Math.min(cashflowMonth + 1, 12))} disabled={cashflowMonth >= 12} />
                      {cashflowMonth !== 0 && <Button size="xs" onClick={() => setCashflowMonth(0)}>Oggi</Button>}
                    </div>
                  } />
                <div className="px-5 pb-5">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">Entrate</div>
                        {!isFuture && !targetSalDone && (
                          <span className="text-[9px] text-amber-700 font-medium px-1.5 py-0.5 bg-amber-100 rounded">non conf.</span>
                        )}
                      </div>
                      <div className="text-lg font-semibold tabular-nums text-emerald-700">{fmt(projTotalIn)}</div>
                      <div className="text-[10px] text-emerald-600 mt-0.5">
                        {isFuture ? 'Stipendio + extra (previste)' : (targetSalDone ? 'Confermate' : 'Attese')}
                      </div>
                    </div>
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-rose-700">Uscite</div>
                        {!isFuture && !targetPacDone && (
                          <span className="text-[9px] text-amber-700 font-medium px-1.5 py-0.5 bg-amber-100 rounded">non conf.</span>
                        )}
                      </div>
                      <div className="text-lg font-semibold tabular-nums text-rose-700">{fmt(projTotalOut)}</div>
                      <div className="text-[10px] text-rose-600 mt-0.5">
                        {isFuture ? 'PAC + extra (previste)' : (targetPacDone ? 'Confermate' : 'Attese')}
                      </div>
                    </div>
                    <div className={`border rounded-xl p-3 ${projNetFlow >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'}`}>
                      <div className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${projNetFlow >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>Netto</div>
                      <div className={`text-lg font-semibold tabular-nums ${projNetFlow >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>{projNetFlow >= 0 ? '+' : ''}{fmt(projNetFlow)}</div>
                      <div className={`text-[10px] mt-0.5 ${projNetFlow >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                        {isCurrentMonth || isFuture ? 'Disponibile per L4' : (targetSalDone && targetPacDone ? 'Effettivo' : 'Stimato')}
                      </div>
                    </div>
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-indigo-700 mb-1">Saving rate</div>
                      <div className="text-lg font-semibold tabular-nums text-indigo-700">{projTotalIn > 0 ? (((config.pac.monthlyAmount + Math.max(0, projNetFlow)) / projTotalIn) * 100).toFixed(0) : 0}%</div>
                      <div className="text-[10px] text-indigo-600 mt-0.5">PAC + surplus / entrate</div>
                    </div>
                  </div>

                  {!isFuture && !isCurrentMonth && (!targetSalDone || !targetPacDone) && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 mb-4 flex items-start gap-2">
                      <Info size={13} className="text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] text-blue-900">
                        Mese passato con eventi non confermati. I valori mostrati sono <strong>attesi sulla base della configurazione</strong>, non effettivi. Conferma gli eventi qui sotto per il tracking storico.
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Eventi ricorrenti</div>
                      <div className="space-y-1.5">
                        <div className={`flex items-center justify-between p-2.5 rounded-lg border ${targetSalDone ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                          <div className="flex items-center gap-2.5 min-w-0">
                            <button onClick={() => handleSalaryClick(`${targetKey}-sal`, targetSalary)} className="flex-shrink-0">
                              {targetSalDone ? <CheckCircle2 size={18} className="text-emerald-600" /> : <div className="w-4 h-4 rounded border-2 border-slate-300" />}
                            </button>
                            <Briefcase size={14} className="text-slate-500 flex-shrink-0" />
                            <span className="text-sm text-slate-900">Stipendio {targetIsBonus && '+ 14ª'}</span>
                            <span className="text-xs text-slate-400">· {config.salary.payDay}/{targetMonth + 1}</span>
                          </div>
                          <span className="text-sm font-semibold text-emerald-700 tabular-nums">+{fmt(targetSalDone && state.ledger[`${targetKey}-sal`] ? state.ledger[`${targetKey}-sal`].amount : targetSalary)}</span>
                        </div>
                        <div className={`flex items-center justify-between p-2.5 rounded-lg border ${targetPacDone ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                          <div className="flex items-center gap-2.5 min-w-0">
                            <button onClick={() => handlePacClick(`${targetKey}-pac`)} className="flex-shrink-0">
                              {targetPacDone ? <CheckCircle2 size={18} className="text-emerald-600" /> : <div className="w-4 h-4 rounded border-2 border-slate-300" />}
                            </button>
                            <CreditCard size={14} className="text-slate-500 flex-shrink-0" />
                            <span className="text-sm text-slate-900">PAC {config.pac.broker}</span>
                            <span className="text-xs text-slate-400">· {config.pac.payDay}/{targetMonth + 1}</span>
                          </div>
                          <span className="text-sm font-semibold text-rose-700 tabular-nums">−{fmt(config.pac.monthlyAmount)}</span>
                        </div>
                      </div>
                    </div>
                    {monthTxs.length > 0 && (
                      <div>
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Transazioni extra ({monthTxs.length})</div>
                        <div className="space-y-1">
                          {monthTxs.map(tx => {
                            const cat = EXTRA_CATEGORIES.find(c => c.id === tx.category) || EXTRA_CATEGORIES[6];
                            return (
                              <div key={tx.id} className="flex items-center gap-2.5 p-2 hover:bg-slate-50 rounded-lg">
                                <div className="text-base w-6 text-center flex-shrink-0">{cat.icon}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm text-slate-900">{cat.label}</span>
                                    {tx.note && <span className="text-xs text-slate-500 truncate">· {tx.note}</span>}
                                  </div>
                                  <p className="text-[10px] text-slate-400">{tx.date}</p>
                                </div>
                                <span className={`text-sm font-semibold tabular-nums ${tx.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                                  {tx.type === 'income' ? '+' : '−'}{fmt(tx.amount)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* 12-month overview compact */}
              <Card>
                <CardHeader title="Ultimi 12 mesi" subtitle="Visione rapida regolarità eventi" icon={HistoryIcon} accentColor="indigo" />
                <div className="px-5 pb-5 overflow-x-auto">
                  <table className="w-full text-sm" style={{ minWidth: 520 }}>
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Mese</th>
                        <th className="text-center py-2.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">PAC</th>
                        <th className="text-center py-2.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Stipendio</th>
                        <th className="text-right py-2.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Atteso</th>
                        <th className="text-right py-2.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyHistory.map(row => (
                        <tr key={row.key} className={`border-b border-slate-100 ${row.isCurrent ? 'bg-emerald-50/30' : ''}`}>
                          <td className="py-2.5 px-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-900">{row.label}</span>
                              {row.isCurrent && <Badge color="emerald">attuale</Badge>}
                            </div>
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <button onClick={() => handlePacClick(`${row.key}-pac`)} className="inline-flex items-center justify-center w-7 h-7 rounded-lg hover:bg-slate-100 transition-colors">
                              {row.pacDone ? <CheckCircle2 size={18} className="text-emerald-600" /> : <div className="w-4 h-4 rounded border-2 border-slate-300" />}
                            </button>
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            <button onClick={() => handleSalaryClick(`${row.key}-sal`, row.expectedSalary)} className="inline-flex items-center justify-center w-7 h-7 rounded-lg hover:bg-slate-100 transition-colors">
                              {row.salDone ? <CheckCircle2 size={18} className="text-emerald-600" /> : <div className="w-4 h-4 rounded border-2 border-slate-300" />}
                            </button>
                          </td>
                          <td className="py-2.5 px-2 text-right tabular-nums text-slate-700">{fmt(row.expectedSalary)}</td>
                          <td className="py-2.5 px-2 text-right">
                            {row.isBonus && <Badge color="amber" icon={Sparkles}>14ª</Badge>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

            {/* Transactions */}
            <Card>
              <CardHeader title="Transazioni extra" subtitle="Entrate o uscite straordinarie" icon={Hash} accentColor="amber"
                action={<Button size="sm" icon={Plus} onClick={() => setShowAddTx(!showAddTx)}>Aggiungi</Button>} />
              <div className="px-5 pb-5">
                {showAddTx && (
                  <div className="bg-slate-50 rounded-xl p-3 mb-4 grid grid-cols-1 sm:grid-cols-[1fr_1fr_2fr_auto] gap-2 items-end">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Importo</label>
                      <MoneyInput size="sm" value={newTx.amount} onChange={v => setNewTx({...newTx, amount: v})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Tipo</label>
                      <select value={newTx.type} onChange={e => setNewTx({...newTx, type: e.target.value})}
                        className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white">
                        <option value="income">Entrata</option>
                        <option value="expense">Uscita</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Categoria + nota</label>
                      <div className="flex gap-2">
                        <select value={newTx.category} onChange={e => setNewTx({...newTx, category: e.target.value})}
                          className="px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white">
                          {EXTRA_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                        </select>
                        <input type="text" placeholder="Nota..." value={newTx.note} onChange={e => setNewTx({...newTx, note: e.target.value})}
                          className="flex-1 px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white" />
                      </div>
                    </div>
                    <Button onClick={addTransaction} variant="primary" size="md" icon={Check}>OK</Button>
                  </div>
                )}
                {state.transactions.length === 0 ? (
                  <EmptyState icon={Hash} title="Nessuna transazione extra" description="Le entrate straordinarie (lavoro extra, regali, rimborsi) e le uscite impreviste verranno mostrate qui." />
                ) : (
                  <div className="space-y-1">
                    {state.transactions.map(tx => {
                      const cat = EXTRA_CATEGORIES.find(c => c.id === tx.category) || EXTRA_CATEGORIES[6];
                      return (
                        <div key={tx.id} className="flex items-center gap-3 py-2 px-2 hover:bg-slate-50 rounded-lg">
                          <div className="text-lg flex-shrink-0 w-7 text-center">{cat.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-medium text-slate-900">{cat.label}</span>
                              {tx.note && <span className="text-xs text-slate-500 truncate">· {tx.note}</span>}
                            </div>
                            <p className="text-[11px] text-slate-400">{tx.date}</p>
                          </div>
                          <span className={`text-sm font-semibold tabular-nums flex-shrink-0 ${tx.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {tx.type === 'income' ? '+' : '−'}{fmt(tx.amount)}
                          </span>
                          <button onClick={() => deleteTransaction(tx.id)} className="text-slate-300 hover:text-rose-600 flex-shrink-0 p-1">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>

            {/* Snapshots history */}
            <Card>
              <CardHeader title="Cronologia snapshot" subtitle={`${state.snapshots.length} registrazioni`} icon={Save} accentColor="emerald" />
              <div className="px-5 pb-5">
                {state.snapshots.length === 0 ? (
                  <EmptyState icon={Save} title="Nessuno snapshot ancora" description="Il primo snapshot viene salvato automaticamente alla prossima apertura dell'app, una volta che hai inserito i tuoi dati." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm" style={{ minWidth: 480 }}>
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="text-left py-2.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Data</th>
                          <th className="text-right py-2.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">ETF</th>
                          <th className="text-right py-2.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Fon.Te.</th>
                          <th className="text-right py-2.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Liquidità</th>
                          <th className="text-right py-2.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Netto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...state.snapshots].reverse().map(s => (
                          <tr key={s.date} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="py-2.5 px-2 font-medium text-slate-900">{s.date}</td>
                            <td className="py-2.5 px-2 text-right tabular-nums text-blue-700">{fmt(s.etf)}</td>
                            <td className="py-2.5 px-2 text-right tabular-nums text-purple-700">{fmt(s.fonte)}</td>
                            <td className="py-2.5 px-2 text-right tabular-nums text-amber-700">{fmt(s.liq)}</td>
                            <td className="py-2.5 px-2 text-right tabular-nums font-semibold text-emerald-700">{fmt(s.nw)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Card>
          </div>
          );
        })()}

        {/* ═══════════ MERCATO ═══════════ */}
        {tab === 'market' && <MarketTab config={config} updateConfig={updateConfig} />}

        {/* ═══════════ ANALYTICS ═══════════ */}
        {tab === 'analytics' && (() => {
          const sortedSnaps = [...state.snapshots].sort((a, b) => a.date.localeCompare(b.date));
          const hasData = sortedSnaps.length >= 2;
          const firstSnap = sortedSnaps[0];
          const lastSnap = sortedSnaps[sortedSnaps.length - 1];

          const annualIncome = 12 * config.salary.netAmount + config.salary.bonusMonths.length * config.salary.bonusAmount;
          const avgIncome = annualIncome / 12;

          let avgMonthlyAccum = 0;
          let timeFrameMonths = 0;
          if (hasData) {
            const daysDiff = (new Date(lastSnap.date).getTime() - new Date(firstSnap.date).getTime()) / 86400000;
            timeFrameMonths = Math.max(daysDiff / 30.44, 0.1);
            avgMonthlyAccum = (lastSnap.nw - firstSnap.nw) / timeFrameMonths;
          }

          const savingsRate = avgMonthlyAccum > 0 && avgIncome > 0 ? Math.min((avgMonthlyAccum / avgIncome) * 100, 200) : 0;
          const annualGrowthPct = hasData && firstSnap.nw > 0 && timeFrameMonths > 0
            ? (Math.pow(lastSnap.nw / firstSnap.nw, 12 / timeFrameMonths) - 1) * 100
            : 0;

          const trajData = hasData ? sortedSnaps.map(snap => {
            const months = (new Date(snap.date).getTime() - new Date(firstSnap.date).getTime()) / (86400000 * 30.44);
            const projected = calcFV(firstSnap.nw, config.pac.monthlyAmount + config.fonte.monthlyContribution, 5.3, months);
            return { date: snap.date, attuale: Math.round(snap.nw), proiezione: Math.round(projected) };
          }) : [];
          const currentDelta = trajData.length > 0 ? trajData[trajData.length - 1].attuale - trajData[trajData.length - 1].proiezione : 0;

          const nextMilestone = MILESTONES.find(m => state.etfValue < m.pacT);
          let monthsToNext = 0;
          if (nextMilestone && config.pac.monthlyAmount > 0) {
            const r = 5.3 / 12 / 100;
            let pv = state.etfValue, m = 0;
            while (pv < nextMilestone.pacT && m < 600) {
              pv = pv * (1 + r) + config.pac.monthlyAmount;
              m++;
            }
            monthsToNext = m;
          }

          return (
            <div className="space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard label="Accumulo medio/mese" value={hasData ? fmt(avgMonthlyAccum) : 'N/D'}
                  sub={hasData ? `Su ${timeFrameMonths.toFixed(1)} mesi tracciati` : 'Disponibile tra ~1 mese'}
                  accent="emerald" icon={ArrowUpRight} large />
                <StatCard label="Tasso di risparmio" value={hasData ? `${savingsRate.toFixed(1)}%` : 'N/D'}
                  sub={hasData ? `vs ${fmt(avgIncome)}/mese di reddito` : ''}
                  accent={savingsRate >= 40 ? 'emerald' : savingsRate >= 25 ? 'amber' : 'rose'} icon={PiggyBank} large />
                <StatCard label="Crescita annualizzata" value={hasData ? `${annualGrowthPct > 0 ? '+' : ''}${annualGrowthPct.toFixed(1)}%` : 'N/D'}
                  sub="Patrimonio netto YoY" accent={annualGrowthPct >= 15 ? 'emerald' : 'blue'} icon={TrendingUp} large />
                <StatCard label="Prossima milestone" value={nextMilestone ? `~${monthsToNext} mesi` : 'Tutte!'}
                  sub={nextMilestone ? `${fmtK(nextMilestone.pacT)} · ${nextMilestone.year}` : 'Oltre l\'ultima milestone'}
                  accent="indigo" icon={Flag} large />
              </div>

              <Card>
                <CardHeader title="Traiettoria reale vs proiezione Ponderata"
                  subtitle={hasData ? `Delta corrente: ${currentDelta >= 0 ? '+' : ''}${fmt(currentDelta)} ${currentDelta >= 0 ? '— sopra modello' : '— sotto modello'}` : 'Il confronto sarà disponibile dopo il secondo mese di utilizzo'}
                  icon={Target} accentColor={hasData ? (currentDelta >= 0 ? 'emerald' : 'amber') : 'slate'} />
                <div className="px-5 pb-5">
                  {hasData ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={trajData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => `€${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={v => fmt(v)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                        <Line type="monotone" dataKey="proiezione" name="Proiezione Ponderata 5.3%" stroke="#94a3b8" strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
                        <Line type="monotone" dataKey="attuale" name="Patrimonio reale" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState icon={Target} title="Grafico disponibile dal secondo mese"
                      description="Il tracking automatico sta raccogliendo dati. Ogni mese la curva reale si aggiorna automaticamente — non devi fare nulla." />
                  )}
                </div>
              </Card>

              <Card>
                <CardHeader title="Insight automatici" subtitle="Analisi basata sui dati attuali" icon={Sparkles} accentColor="purple" />
                <div className="px-5 pb-5 space-y-2">
                  {!hasData && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-start gap-2.5">
                      <Info size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-blue-900">
                        <strong>Tracking automatico attivo:</strong> uno snapshot viene salvato automaticamente ogni mese alla prima apertura dell'app. Dopo 2-3 mesi avrai dati significativi per analizzare l'aderenza alla traiettoria.
                      </div>
                    </div>
                  )}
                  {hasData && savingsRate >= 40 && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-2.5">
                      <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-emerald-900">
                        <strong>Tasso di risparmio eccellente ({savingsRate.toFixed(1)}%):</strong> ben oltre la media italiana (~10%) e nel range FIRE consigliato (30–50%). Continua su questo passo.
                      </div>
                    </div>
                  )}
                  {hasData && savingsRate < 25 && savingsRate > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5">
                      <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-amber-900">
                        <strong>Tasso di risparmio al {savingsRate.toFixed(1)}%:</strong> sotto la soglia FIRE consigliata. Verifica spese voluttuarie comprimibili o se ci sono state uscite straordinarie nel periodo.
                      </div>
                    </div>
                  )}
                  {hasData && currentDelta > 0 && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-2.5">
                      <ArrowUpRight size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-emerald-900">
                        <strong>Sopra la traiettoria di {fmt(currentDelta)}:</strong> il rendimento o l'accumulo reale stanno superando il modello Ponderato. Eccellente progresso.
                      </div>
                    </div>
                  )}
                  {hasData && currentDelta < 0 && firstSnap.nw > 0 && Math.abs(currentDelta) > firstSnap.nw * 0.05 && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start gap-2.5">
                      <AlertCircle size={16} className="text-rose-600 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-rose-900">
                        <strong>Scostamento dalla traiettoria di {fmt(Math.abs(currentDelta))}:</strong> può essere volatilità di breve periodo. Se persiste oltre 6 mesi, valuta se rivedere il piano (capacità di risparmio o ipotesi di rendimento).
                      </div>
                    </div>
                  )}
                  {nextMilestone && monthsToNext > 0 && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 flex items-start gap-2.5">
                      <Flag size={16} className="text-indigo-600 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-indigo-900">
                        <strong>Prossima milestone "{nextMilestone.label}":</strong> ~{monthsToNext} mesi ({(monthsToNext / 12).toFixed(1)} anni) al ritmo attuale di {fmt(config.pac.monthlyAmount)}/mese e 5.3% reale. Target ETF: {fmt(nextMilestone.pacT)} entro il {nextMilestone.year}.
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          );
        })()}

        {/* ═══════════ REVIEWS ═══════════ */}
        {tab === 'reviews' && (
          <div className="space-y-5">
            <Card>
              <CardHeader title="Revisioni annuali"
                subtitle="Documenta decisioni strategiche del portafoglio nel tempo"
                icon={FileText} accentColor="indigo"
                action={
                  <Button size="sm" icon={showAddReview ? X : Plus} onClick={() => {
                    if (!showAddReview) setNewReview({ year: new Date().getFullYear(), title: `Revisione ${new Date().getFullYear()}`, summary: '', decisions: [] });
                    setShowAddReview(!showAddReview);
                  }}>{showAddReview ? 'Chiudi' : 'Nuova'}</Button>
                } />
              {showAddReview && (
                <div className="px-5 pb-5 space-y-3 border-t border-slate-100 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-3">
                    <div>
                      <label className="text-xs text-slate-500 font-medium block mb-1.5">Anno</label>
                      <NumberInput value={newReview.year} onChange={v => setNewReview({ ...newReview, year: v })} min={2000} max={2100} />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 font-medium block mb-1.5">Titolo</label>
                      <input type="text" value={newReview.title} onChange={e => setNewReview({ ...newReview, title: e.target.value })}
                        placeholder="es. Revisione strategica 2026"
                        className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 font-medium block mb-1.5">Sintesi esecutiva</label>
                    <textarea rows={2} value={newReview.summary} onChange={e => setNewReview({ ...newReview, summary: e.target.value })}
                      placeholder="Sommario delle decisioni chiave (1-2 frasi)..."
                      className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white resize-none" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs text-slate-500 font-medium">Decisioni strutturali (PRE → POST)</label>
                      <Button size="xs" icon={Plus} onClick={() => setNewReview({ ...newReview, decisions: [...newReview.decisions, { title: '', pre: '', post: '', rationale: '' }] })}>Aggiungi</Button>
                    </div>
                    {newReview.decisions.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Es: "Eliminazione obbligazionario dal Core Portfolio", "Cambio comparto Fon.Te. verso Dinamico"</p>
                    ) : (
                      <div className="space-y-3">
                        {newReview.decisions.map((dec, idx) => (
                          <div key={idx} className="bg-slate-50 rounded-lg p-3 space-y-2 relative">
                            <button onClick={() => setNewReview({ ...newReview, decisions: newReview.decisions.filter((_, i) => i !== idx) })}
                              className="absolute top-2 right-2 text-slate-300 hover:text-rose-600 p-1 z-10">
                              <X size={12} />
                            </button>
                            <input type="text" placeholder="Titolo della decisione" value={dec.title}
                              onChange={e => {
                                const nd = [...newReview.decisions];
                                nd[idx] = { ...dec, title: e.target.value };
                                setNewReview({ ...newReview, decisions: nd });
                              }}
                              className="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white pr-7" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <textarea rows={2} placeholder="PRIMA — situazione precedente" value={dec.pre}
                                onChange={e => {
                                  const nd = [...newReview.decisions];
                                  nd[idx] = { ...dec, pre: e.target.value };
                                  setNewReview({ ...newReview, decisions: nd });
                                }}
                                className="w-full px-2.5 py-1.5 text-xs border border-rose-200 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white resize-none" />
                              <textarea rows={2} placeholder="DOPO — nuova configurazione" value={dec.post}
                                onChange={e => {
                                  const nd = [...newReview.decisions];
                                  nd[idx] = { ...dec, post: e.target.value };
                                  setNewReview({ ...newReview, decisions: nd });
                                }}
                                className="w-full px-2.5 py-1.5 text-xs border border-emerald-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white resize-none" />
                            </div>
                            <textarea rows={2} placeholder="Razionale della decisione (perché?)" value={dec.rationale}
                              onChange={e => {
                                const nd = [...newReview.decisions];
                                nd[idx] = { ...dec, rationale: e.target.value };
                                setNewReview({ ...newReview, decisions: nd });
                              }}
                              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white resize-none" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="secondary" onClick={() => setShowAddReview(false)}>Annulla</Button>
                    <Button variant="primary" icon={Check} onClick={() => {
                      if (!newReview.title.trim()) { setToast({ message: 'Titolo richiesto', type: 'error' }); return; }
                      const rev = { ...newReview, id: Date.now(), date: todayKey() };
                      updateState({ reviews: [rev, ...state.reviews] });
                      setShowAddReview(false);
                      setNewReview({ year: new Date().getFullYear(), title: '', summary: '', decisions: [] });
                      setToast({ message: 'Revisione salvata', type: 'success' });
                    }}>Salva revisione</Button>
                  </div>
                </div>
              )}
            </Card>

            {state.reviews.length === 0 ? (
              <Card>
                <div className="py-2">
                  <EmptyState icon={FileText} title="Nessuna revisione registrata"
                    description="Documenta qui le tue decisioni strategiche annuali sul portafoglio. Esempio: la revisione 2026 ha eliminato l'obbligazionario dal Core Portfolio e portato il Fon.Te. sul Comparto Dinamico." />
                </div>
              </Card>
            ) : (
              <div className="space-y-3">
                {state.reviews.map(rev => {
                  const expanded = expandedReview === rev.id;
                  return (
                    <Card key={rev.id}>
                      <div className="px-5 pt-5 pb-3 flex items-start justify-between gap-3">
                        <button onClick={() => setExpandedReview(expanded ? null : rev.id)} className="text-left flex-1 min-w-0 hover:opacity-80 transition-opacity">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-slate-900">{rev.title}</h3>
                            <Badge color="indigo">{rev.year}</Badge>
                            {rev.decisions.length > 0 && <Badge color="slate">{rev.decisions.length} {rev.decisions.length === 1 ? 'decisione' : 'decisioni'}</Badge>}
                          </div>
                          {rev.summary && <p className="text-xs text-slate-600 mt-1.5">{rev.summary}</p>}
                          <p className="text-[11px] text-slate-400 mt-1">Registrata il {rev.date}</p>
                        </button>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => setExpandedReview(expanded ? null : rev.id)} className="text-slate-400 hover:text-slate-700 p-1">
                            {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                          <button onClick={() => {
                            setConfirmDialog({
                              title: 'Elimina revisione',
                              message: `Eliminare "${rev.title}"? L'operazione è irreversibile.`,
                              onConfirm: () => {
                                updateState({ reviews: state.reviews.filter(r => r.id !== rev.id) });
                                setConfirmDialog(null);
                                setToast({ message: 'Revisione eliminata', type: 'info' });
                              },
                            });
                          }} className="text-slate-300 hover:text-rose-600 p-1">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      {expanded && rev.decisions.length > 0 && (
                        <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-3">
                          {rev.decisions.map((dec, idx) => (
                            <div key={idx} className="bg-slate-50 rounded-xl p-3">
                              <p className="text-sm font-semibold text-slate-900 mb-2">{dec.title || `Decisione ${idx + 1}`}</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                                <div className="bg-rose-50 border border-rose-200 rounded-lg p-2.5">
                                  <div className="text-[10px] font-semibold uppercase tracking-wider text-rose-700 mb-1">Prima</div>
                                  <p className="text-xs text-slate-700 whitespace-pre-wrap">{dec.pre || '—'}</p>
                                </div>
                                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                                  <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 mb-1">Dopo</div>
                                  <p className="text-xs text-slate-700 whitespace-pre-wrap">{dec.post || '—'}</p>
                                </div>
                              </div>
                              {dec.rationale && (
                                <div className="text-xs text-slate-600 italic border-l-2 border-indigo-300 pl-2.5 py-0.5 mt-2">
                                  {dec.rationale}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══════════ SETTINGS ═══════════ */}
        {tab === 'settings' && (
          <div className="space-y-5">
            <Card>
              <CardHeader title="Profilo" icon={Briefcase} accentColor="slate" />
              <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-500 font-medium block mb-1.5">Nome</label>
                  <input type="text" value={config.profile.name}
                    onChange={e => updateConfig({ profile: { ...config.profile, name: e.target.value } })}
                    className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium block mb-1.5">Anno di nascita</label>
                  <NumberInput value={config.profile.birthYear} onChange={v => updateConfig({ profile: { ...config.profile, birthYear: v } })} min={1900} max={2050} suffix="·" />
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Stipendio" subtitle="Importo netto, mensilità aggiuntive e data di accredito" icon={Briefcase} accentColor="emerald" />
              <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-500 font-medium block mb-1.5">Netto mensile</label>
                  <MoneyInput value={config.salary.netAmount} onChange={v => updateConfig({ salary: { ...config.salary, netAmount: safeNum(v) } })} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium block mb-1.5">Bonus 13ª/14ª</label>
                  <MoneyInput value={config.salary.bonusAmount} onChange={v => updateConfig({ salary: { ...config.salary, bonusAmount: safeNum(v) } })} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium block mb-1.5">Giorno accredito</label>
                  <NumberInput value={config.salary.payDay} onChange={v => updateConfig({ salary: { ...config.salary, payDay: Math.max(1, Math.min(31, v)) } })} min={1} max={31} suffix="del mese" />
                </div>
                <div className="sm:col-span-3">
                  <label className="text-xs text-slate-500 font-medium block mb-2">Mesi bonus</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {MONTHS_IT.map((m, i) => {
                      const active = config.salary.bonusMonths.includes(i);
                      return (
                        <button key={i} onClick={() => {
                          const newBonus = active ? config.salary.bonusMonths.filter(x => x !== i) : [...config.salary.bonusMonths, i].sort();
                          updateConfig({ salary: { ...config.salary, bonusMonths: newBonus } });
                        }} className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${active ? 'bg-amber-100 border-amber-300 text-amber-800 font-semibold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                          {MONTHS_IT_SHORT[i]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="PAC" subtitle="Versamento ricorrente e allocazione strumenti" icon={CreditCard} accentColor="indigo" />
              <div className="px-5 pb-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                  <div>
                    <label className="text-xs text-slate-500 font-medium block mb-1.5">Importo mensile</label>
                    <MoneyInput value={config.pac.monthlyAmount} onChange={v => updateConfig({ pac: { ...config.pac, monthlyAmount: safeNum(v) } })} />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 font-medium block mb-1.5">Giorno addebito</label>
                    <NumberInput value={config.pac.payDay} onChange={v => updateConfig({ pac: { ...config.pac, payDay: Math.max(1, Math.min(31, v)) } })} min={1} max={31} suffix="del mese" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 font-medium block mb-1.5">Broker</label>
                    <input type="text" value={config.pac.broker} onChange={e => updateConfig({ pac: { ...config.pac, broker: e.target.value } })}
                      className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white" />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-2">Allocazione strumenti (somma deve = 100%)</p>
                  <div className="space-y-3">
                    {config.pac.instruments.map((ins, idx) => (
                      <div key={ins.id} className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: ins.color }} />
                          <input type="text" value={ins.name}
                            onChange={e => {
                              const newIns = [...config.pac.instruments];
                              newIns[idx] = { ...newIns[idx], name: e.target.value };
                              updateConfig({ pac: { ...config.pac, instruments: newIns } });
                            }}
                            className="flex-1 px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                          <NumberInput className="w-24" value={ins.pct} onChange={v => {
                            const newIns = [...config.pac.instruments];
                            newIns[idx] = { ...newIns[idx], pct: Math.max(0, v) };
                            updateConfig({ pac: { ...config.pac, instruments: newIns } });
                          }} suffix="%" step={0.5} />
                        </div>
                        <div className="flex items-center gap-2 pl-4">
                          <span className="text-[11px] text-slate-400 w-16 flex-shrink-0">Ticker:</span>
                          <input type="text" value={ins.ticker || ''}
                            placeholder="es. VUSA.LON"
                            onChange={e => {
                              const newIns = [...config.pac.instruments];
                              newIns[idx] = { ...newIns[idx], ticker: e.target.value.toUpperCase() };
                              updateConfig({ pac: { ...config.pac, instruments: newIns } });
                            }}
                            className="flex-1 px-2.5 py-1 text-xs font-mono border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300" />
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between text-xs pt-1 px-2">
                      <span className="text-slate-500">Totale allocazione</span>
                      <span className={`font-semibold tabular-nums ${Math.abs(config.pac.instruments.reduce((s, i) => s + i.pct, 0) - 100) < 0.01 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {config.pac.instruments.reduce((s, i) => s + i.pct, 0).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Fon.Te." subtitle="Previdenza complementare" icon={PiggyBank} accentColor="purple" />
              <div className="px-5 pb-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-slate-500 font-medium block mb-1.5">Contributo/mese</label>
                  <MoneyInput value={config.fonte.monthlyContribution} onChange={v => updateConfig({ fonte: { ...config.fonte, monthlyContribution: safeNum(v) } })} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium block mb-1.5">TER (%)</label>
                  <NumberInput value={config.fonte.ter} onChange={v => updateConfig({ fonte: { ...config.fonte, ter: v } })} suffix="%" step={0.01} />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-medium block mb-1.5">Comparto</label>
                  <input type="text" value={config.fonte.comparto} onChange={e => updateConfig({ fonte: { ...config.fonte, comparto: e.target.value } })}
                    className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-300 bg-white" />
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Spese fisse mensili"
                subtitle={totalFixedExpenses > 0 ? `Totale ${fmt(totalFixedExpenses)}/mese · Margine reale ${fmt(realMargin)}` : 'Configura le tue uscite ricorrenti'}
                icon={Home} accentColor="rose" />
              <div className="px-5 pb-5 space-y-3">
                {Object.entries(config.expenses || {}).map(([key, exp]: [string, any]) => {
                  const Icon = EXPENSE_ICONS[exp.icon] || Home;
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
                        <Icon size={15} />
                      </div>
                      <span className="text-sm text-slate-700 flex-1">{exp.label}</span>
                      <MoneyInput
                        size="sm"
                        className="w-32"
                        value={exp.amount || ''}
                        onChange={v => updateConfig({
                          expenses: {
                            ...config.expenses,
                            [key]: { ...exp, amount: safeNum(v) }
                          }
                        })}
                      />
                    </div>
                  );
                })}
                <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500">Totale spese fisse</span>
                  <span className="font-semibold tabular-nums text-rose-700">{fmt(totalFixedExpenses)}/mese</span>
                </div>
                {totalFixedExpenses > 0 && (
                  <div className={`rounded-lg p-2.5 text-xs flex items-center gap-2 ${realMargin >= 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
                    {realMargin >= 0
                      ? <><CheckCircle2 size={13} className="text-emerald-600 flex-shrink-0" /><span>Margine mensile dopo PAC: <strong>{fmt(realMargin)}</strong></span></>
                      : <><AlertCircle size={13} className="text-amber-600 flex-shrink-0" /><span>PAC sovradimensionato di <strong>{fmt(Math.abs(realMargin))}</strong> rispetto alle entrate disponibili</span></>
                    }
                  </div>
                )}
                <p className="text-[11px] text-slate-400">Le spese fisse sono automaticamente dedotte dal cashflow. Non richiedono conferma mensile.</p>
              </div>
            </Card>

            <Card>
              <CardHeader title="Cap sistema a cascata" icon={Wallet} accentColor="amber" />
              <div className="px-5 pb-5 space-y-2">
                {config.waterfallLevels.map((lv, idx) => (
                  <div key={lv.id} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: lv.color }} />
                    <input type="text" value={lv.name}
                      onChange={e => {
                        const newLv = [...config.waterfallLevels];
                        newLv[idx] = { ...newLv[idx], name: e.target.value };
                        updateConfig({ waterfallLevels: newLv });
                      }}
                      className="flex-1 px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-300" />
                    <MoneyInput value={lv.cap} className="w-32" onChange={v => {
                      const newLv = [...config.waterfallLevels];
                      newLv[idx] = { ...newLv[idx], cap: safeNum(v) };
                      updateConfig({ waterfallLevels: newLv });
                    }} />
                  </div>
                ))}
                <p className="text-[11px] text-slate-500 pt-1">Cap = 0 significa nessun limite (livello overflow).</p>
              </div>
            </Card>

            <Card>
              <CardHeader title="Obiettivo FIRE" subtitle="Riconfigura età target e rendimento atteso" icon={Flame} accentColor="orange"
                action={<Button size="sm" icon={Sparkles} onClick={() => { setObRetireAge(String(state.fireParams.retireAge)); setObReturnRate(String(state.fireParams.rate)); setShowFireWizard(true); }}>Configura</Button>} />
              <div className="px-5 pb-5">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-orange-50 rounded-lg p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-orange-600 mb-1">Età ritiro</div>
                    <div className="text-sm font-semibold text-slate-900">{state.fireParams.retireAge} anni</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-orange-600 mb-1">Rendimento PAC</div>
                    <div className="text-sm font-semibold text-slate-900">{state.fireParams.rate}%</div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-orange-600 mb-1">Milestone generate</div>
                    <div className="text-sm font-semibold text-slate-900">{MILESTONES.length}</div>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Gestione dati" subtitle="Backup, ripristino e reset" icon={FileText} accentColor="rose" />
              <div className="px-5 pb-5">
                <div className="flex flex-wrap gap-2">
                  <Button onClick={exportData} variant="primary" icon={Download}>Esporta backup JSON</Button>
                  <Button onClick={() => fileInputRef.current?.click()} variant="secondary" icon={Upload}>Importa backup</Button>
                  <input ref={fileInputRef} type="file" accept=".json,application/json" onChange={importData} className="hidden" />
                  <Button onClick={resetAll} variant="danger" icon={RotateCcw}>Reset dati</Button>
                </div>
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                  <Info size={14} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-900">
                    I dati sono salvati in cloud su Supabase (EU-West, Londra). Puoi esportarli in formato JSON in qualsiasi momento.
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Privacy & Account" subtitle="Diritti GDPR e cancellazione account" icon={Shield} accentColor="slate" />
              <div className="px-5 pb-5 space-y-3">
                <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600 space-y-1">
                  <p>✅ I tuoi dati sono protetti da autenticazione e crittografia</p>
                  <p>✅ Nessun altro utente può vedere i tuoi dati (Row Level Security)</p>
                  <p>✅ Puoi esportare o eliminare i tuoi dati in qualsiasi momento</p>
                  <p>⚠️ L'amministratore del servizio ha accesso tecnico al database (vedi Privacy Policy)</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" icon={FileText} onClick={() => {
                    // Dispatch evento per aprire privacy policy in App.tsx
                    window.dispatchEvent(new CustomEvent('show-privacy'));
                  }}>Privacy Policy</Button>
                  <Button variant="danger" icon={LogOut} onClick={() => {
                    setConfirmDialog({
                      title: 'Elimina account e dati',
                      message: 'Verranno eliminati TUTTI i tuoi dati finanziari e il tuo account. Operazione irreversibile. Esporta un backup prima di procedere.',
                      onConfirm: async () => {
                        try {
                          await window.storage.set('__delete__', '__delete__');
                        } catch {}
                        await supabase.from('user_data').delete().eq('user_id', (await supabase.auth.getUser()).data.user?.id || '');
                        await supabase.auth.signOut();
                        setConfirmDialog(null);
                      },
                    });
                  }}>Elimina account</Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-slate-400">
        Finance Personal Dashboard · v{APP_VERSION} · Salvataggio automatico attivo
      </footer>

      {/* Toast */}
      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}

      {/* Salary confirm modal */}
      {salaryConfirmDialog && (() => {
        const actualAmt = safeNum(salaryConfirmDialog.actual);
        const diff = actualAmt - salaryConfirmDialog.expected;
        const { newWf, movements } = distributeToWaterfall(actualAmt, state.waterfallCurrent, config.waterfallLevels);
        const overflowLv = config.waterfallLevels.find(l => l.cap === 0);
        const overflowAmount = overflowLv ? (movements[overflowLv.id] || 0) : 0;
        const fillsBelowCap = config.waterfallLevels.filter(lv => lv.cap > 0 && movements[lv.id] > 0);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSalaryConfirmDialog(null)}>
            <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-5 shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <Briefcase size={16} className="text-emerald-600" />
                    Conferma stipendio
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Inserisci l'importo effettivamente accreditato</p>
                </div>
                <button onClick={() => setSalaryConfirmDialog(null)} className="text-slate-400 hover:text-slate-700">
                  <X size={18} />
                </button>
              </div>

              <div className="mb-4">
                <label className="text-xs text-slate-500 font-medium block mb-1.5">Importo accreditato</label>
                <MoneyInput size="lg"
                  value={salaryConfirmDialog.actual}
                  onChange={v => setSalaryConfirmDialog({ ...salaryConfirmDialog, actual: v })} />
                <div className="flex items-center justify-between mt-1.5 text-[11px]">
                  <span className="text-slate-500">Atteso: {fmt(salaryConfirmDialog.expected)}</span>
                  {diff !== 0 && actualAmt > 0 && (
                    <span className={diff > 0 ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
                      {diff > 0 ? '+' : ''}{fmt(diff)} vs atteso
                    </span>
                  )}
                </div>
              </div>

              {actualAmt > 0 && (
                <div className="bg-slate-50 rounded-xl p-3 mb-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Distribuzione liquidità</p>
                  <div className="space-y-1.5">
                    {fillsBelowCap.length > 0 && fillsBelowCap.map(lv => (
                      <div key={lv.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: lv.color }} />
                          <span className="text-slate-700 truncate">Riempimento {lv.name}</span>
                        </div>
                        <span className="font-semibold tabular-nums flex-shrink-0" style={{ color: lv.color }}>+{fmt(movements[lv.id])}</span>
                      </div>
                    ))}
                    {overflowAmount > 0 && (
                      <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: overflowLv.color }} />
                          <span className="text-slate-700 truncate font-medium">{overflowLv.name}</span>
                        </div>
                        <span className="font-semibold tabular-nums flex-shrink-0" style={{ color: overflowLv.color }}>+{fmt(overflowAmount)}</span>
                      </div>
                    )}
                    {fillsBelowCap.length === 0 && overflowAmount === 0 && (
                      <p className="text-[11px] text-slate-500 italic">Nessuna distribuzione (importo a zero)</p>
                    )}
                  </div>
                  {overflowAmount > 0 && fillsBelowCap.length === 0 && (
                    <p className="text-[10px] text-slate-500 mt-2">Tutti i livelli con cap sono già pieni — l'intero stipendio va su overflow.</p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setSalaryConfirmDialog(null)}>Annulla</Button>
                <Button variant="primary" icon={Check}
                  disabled={actualAmt <= 0}
                  onClick={() => applySalaryConfirm(salaryConfirmDialog.key, salaryConfirmDialog.actual)}>
                  Conferma accredito
                </Button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Confirm dialog */}
      <ConfirmDialog open={!!confirmDialog} {...(confirmDialog || {})}
        onCancel={() => setConfirmDialog(null)} />

      {/* ─── Versamento Volontario ETF ─── */}
      {showVoluntary && (() => {
        const amt = safeNum(voluntaryAmount);
        const allocTotal = Object.values(voluntaryAlloc).reduce((s, v) => s + safeNum(v), 0);
        const diff = amt - allocTotal;
        const isValid = amt > 0 && Math.abs(diff) < 1;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowVoluntary(false)}>
            <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-5 shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <TrendingUp size={16} className="text-emerald-600" />Versamento volontario ETF
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Preleva dalla liquidità e investi fuori dal PAC mensile</p>
                </div>
                <button onClick={() => setShowVoluntary(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
              </div>

              <div className="mb-4">
                <label className="text-xs font-medium text-slate-700 block mb-1.5">Importo da investire</label>
                <MoneyInput size="lg" value={voluntaryAmount} onChange={v => {
                  setVoluntaryAmount(v);
                  // Reset allocazione quando cambia importo
                  const init: Record<string, string> = {};
                  config.pac.instruments.forEach(ins => { init[ins.id] = ''; });
                  setVoluntaryAlloc(init);
                }} />
                {amt > 0 && totalLiq < amt && (
                  <p className="text-[11px] text-rose-600 mt-1">Liquidità disponibile: {fmt(totalLiq)}</p>
                )}
              </div>

              {amt > 0 && (
                <div className="bg-slate-50 rounded-xl p-3 mb-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    Dove hai investito? Alloca {fmt(amt)}
                  </p>
                  <div className="space-y-2">
                    {config.pac.instruments.map(ins => (
                      <div key={ins.id} className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: ins.color }} />
                        <span className="text-sm text-slate-700 flex-1 truncate">{ins.name}</span>
                        <MoneyInput size="sm" className="w-28"
                          value={voluntaryAlloc[ins.id] || ''}
                          onChange={v => setVoluntaryAlloc(prev => ({ ...prev, [ins.id]: v }))} />
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[11px] pt-2 mt-1 border-t border-slate-200">
                    <span className="text-slate-500">Totale allocato</span>
                    <span className={`font-semibold tabular-nums ${Math.abs(diff) < 1 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {fmt(allocTotal)} / {fmt(amt)}
                      {allocTotal > 0 && Math.abs(diff) >= 1 && <span className="ml-1">(mancano {fmt(diff)})</span>}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setShowVoluntary(false)}>Annulla</Button>
                <Button variant="primary" icon={Check} disabled={!isValid || totalLiq < amt}
                  onClick={applyVoluntaryInvestment}>
                  Investi {amt > 0 ? fmt(amt) : ''}
                </Button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── PAC Confirm Modal ─── */}
      {pacConfirmDialog && (() => {
        const actualAmt = safeNum(pacConfirmDialog.actual);
        const basePac = config.pac.monthlyAmount;
        const excess = Math.max(0, actualAmt - basePac);
        const excessAllocTotal = Object.values(pacConfirmDialog.excessAlloc).reduce((s, v) => s + safeNum(v), 0);
        const excessDiff = excess - excessAllocTotal;
        const isValid = actualAmt > 0 && (excess === 0 || Math.abs(excessDiff) < 1);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setPacConfirmDialog(null)}>
            <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-5 shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <CreditCard size={16} className="text-indigo-600" />Conferma PAC
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Inserisci l'importo effettivamente versato</p>
                </div>
                <button onClick={() => setPacConfirmDialog(null)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
              </div>

              {/* Importo reale */}
              <div className="mb-4">
                <label className="text-xs font-medium text-slate-700 block mb-1.5">Importo versato</label>
                <MoneyInput size="lg" value={pacConfirmDialog.actual}
                  onChange={v => setPacConfirmDialog({ ...pacConfirmDialog, actual: v })} />
                <div className="flex items-center justify-between mt-1.5 text-[11px]">
                  <span className="text-slate-500">Piano standard: {fmt(basePac)}</span>
                  {actualAmt > basePac && <span className="text-indigo-600 font-medium">+{fmt(excess)} eccedenza</span>}
                  {actualAmt < basePac && actualAmt > 0 && <span className="text-amber-600 font-medium">−{fmt(basePac - actualAmt)} sotto piano</span>}
                </div>
              </div>

              {/* Allocazione base — automatica */}
              <div className="bg-slate-50 rounded-xl p-3 mb-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Allocazione base {fmt(Math.min(actualAmt, basePac))} — automatica
                </p>
                <div className="space-y-1">
                  {config.pac.instruments.map(ins => (
                    <div key={ins.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: ins.color }} />
                        <span className="text-slate-700 truncate">{ins.name}</span>
                        <span className="text-slate-400">{ins.pct}%</span>
                      </div>
                      <span className="tabular-nums text-slate-600 font-medium">
                        {fmt(Math.min(actualAmt, basePac) * ins.pct / 100)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Eccedenza — opzionale */}
              {excess > 0 && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 mb-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 mb-0.5">
                    Eccedenza {fmt(excess)} — dove l'hai versata? (opzionale)
                  </p>
                  <p className="text-[10px] text-indigo-500 mb-2">Lascia vuoto se hai seguito il piano standard</p>
                  <div className="space-y-1.5">
                    {config.pac.instruments.map(ins => (
                      <div key={ins.id} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: ins.color }} />
                        <span className="text-xs text-slate-700 flex-1 truncate">{ins.name}</span>
                        <MoneyInput size="sm" className="w-28"
                          value={pacConfirmDialog.excessAlloc[ins.id] || ''}
                          onChange={v => setPacConfirmDialog({
                            ...pacConfirmDialog,
                            excessAlloc: { ...pacConfirmDialog.excessAlloc, [ins.id]: v }
                          })} />
                      </div>
                    ))}
                    <div className="flex justify-between text-[11px] pt-1 border-t border-indigo-200">
                      <span className="text-indigo-600">Totale allocato</span>
                      <span className={`font-semibold tabular-nums ${Math.abs(excessDiff) < 1 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {fmt(excessAllocTotal)} / {fmt(excess)}
                        {excessAllocTotal > 0 && Math.abs(excessDiff) >= 1 && ` (mancano ${fmt(excessDiff)})`}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setPacConfirmDialog(null)}>Annulla</Button>
                <Button variant="primary" icon={Check}
                  disabled={actualAmt <= 0 || (excess > 0 && excessAllocTotal > 0 && Math.abs(excessDiff) >= 1)}
                  onClick={() => {
                    const excessNum: Record<string, number> = {};
                    Object.entries(pacConfirmDialog.excessAlloc).forEach(([k, v]) => { excessNum[k] = safeNum(v); });
                    applyPacConfirm(pacConfirmDialog.key, actualAmt, excessNum);
                  }}>
                  Conferma versamento
                </Button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ─── FIRE Wizard Modal ─── */}
      {showFireWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowFireWizard(false)}>
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center"><Flame size={16} /></div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Obiettivo FIRE</h3>
                  <p className="text-[11px] text-slate-500">Le milestone si aggiornano automaticamente</p>
                </div>
              </div>
              <button onClick={() => setShowFireWizard(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1.5">Età target per il FIRE</label>
                <input type="number" value={obRetireAge} onChange={e => setObRetireAge(e.target.value)}
                  min={30} max={70}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1.5">Rendimento annuo atteso PAC (%)</label>
                <input type="number" value={obReturnRate} onChange={e => setObReturnRate(e.target.value)}
                  min={1} max={12} step={0.5}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white" />
                <p className="text-[11px] text-slate-400 mt-1">Prudente 5% · Storico S&P 500 ≈ 7%</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1.5">Rendita mensile desiderata (€)</label>
                <input type="number" value={obMonthlyExpense} onChange={e => setObMonthlyExpense(e.target.value)}
                  placeholder="es. 2000" min={0}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 bg-white" />
                {obMonthlyExpense && (
                  <p className="text-[11px] text-orange-600 mt-1 font-medium">
                    FIRE number: {fmt(safeNum(obMonthlyExpense) * 12 / 0.04)} · Milestone generate: {
                      (() => {
                        const age = parseInt(obRetireAge) || 50;
                        const cur = ageFromYear(config.profile.birthYear);
                        return Math.max(0, Math.floor((age - cur - 3) / 5)) + 2;
                      })()
                    }
                  </p>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => setShowFireWizard(false)}>Annulla</Button>
                <Button variant="primary" className="flex-1" icon={Check} onClick={applyFireWizard}>Salva</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
