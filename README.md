# Personal Finance Dashboard 💰

[![Version](https://img.shields.io/badge/version-1.3.0-emerald.svg)](package.json)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.3-646CFF.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC.svg)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20RLS-3ECF8E.svg)](https://supabase.com/)
[![License](https://img.shields.io/badge/license-Private-slate.svg)]()

> **Dashboard web reattiva e modulare per la gestione patrimoniale personale, il tracciamento degli investimenti (PAC/ETF), l'ottimizzazione fiscale italiana, la previdenza complementare e la pianificazione dell'indipendenza finanziaria (FIRE).**

---

## 🌟 Caratteristiche Principali

### 📊 1. Executive Dashboard & Net Worth
- Calcolo automatico e istantaneo del **Patrimonio Netto** (Liquidità + Portafoglio ETF + Fondo Pensione).
- Monitoraggio della variazione rispetto all'ultimo snapshot mensile registrato.
- Timeline dinamica con **milestone patrimoniali ed anagrafiche** basate su obiettivi e tassi di rendimento attesi.
- Widget di promemoria automatici per scadenze ricorrenti (accredito stipendio, esecuzione PAC mensile).

### 📈 2. Portafoglio PAC & Asset Allocation
- Gestione di portafogli multiprodotto con supporto per **ETF, fondi, titoli di stato e azioni**.
- Tracciamento granulare con **Ticker, ISIN, TER (Total Expense Ratio)**, quota percentuale target vs attuale.
- Calcolo del TER medio ponderato e confronto tra capitale totale versato e controvalore corrente di mercato.
- Algoritmo di calcolo automatico per il ribilanciamento periodico.

### 🇮🇹 3. Modulo Fisco & Previdenza (Specifico per l'Italia)
- **Tassazione differenziata del capital gain**: Calcolo separato per aliquota ordinaria al **26%** (azioni, ETF azionari, fondi, crypto) e agevolata al **12,5%** (titoli di stato ed enti sovranazionali in whitelist).
- **Previdenza Complementare (Fondi Pensione / TFR)**:
  - Tracciamento della contribuzione (lavoratore, contributo datoriale, TFR maturato e versamenti volontari).
  - Monitoraggio della **soglia di deducibilità fiscale IRPEF di 5.164,57 €/anno**.
  - Calcolo istantaneo del beneficio e risparmio IRPEF effettivo in base allo scaglione di reddito (RAL).
  - Importazione rapida dei versamenti da file Excel del fondo (es. Fon.Te.).

### 💧 4. Gestione della Liquidità a Cascata (*Waterfall*)
- Modello a livelli gerarchici di liquidità (Conto Corrente operativo, Fondo di Emergenza L1, Spese previste/accantonamenti).
- Simulatore interattivo del **Conto Deposito**: slider di suddivisione del capitale, calcolo degli interessi lordi e netti annui e mensili.

### 🔥 5. Modulo F.I.R.E. (*Financial Independence, Retire Early*)
- Calcolo del **FIRE Number** basato sul *Safe Withdrawal Rate* (regola del 4% o percentuale personalizzata).
- Stima dell'età e degli anni mancanti al raggiungimento della libertà finanziaria.
- Proiezioni a confronto in termini **nominali** e **reali** (al netto dell'inflazione attesa).

### 🌐 6. Dati di Mercato Live & Proxy Serverless
- Monitoraggio in tempo reale dei principali indici globali (**S&P 500, NASDAQ 100, FTSE MIB**), materie prime (**Oro, Petrolio**) e crypto (**Bitcoin, Ethereum**).
- Quotazioni aggiornate e storici a 30 giorni con **sparkline SVG interattive**.
- Proxy serverless dedicato (`/api/quote`) con caching e rate limiting per Yahoo Finance.

### 📈 7. Analytics & Registro Retrospettive
- Calcolo del tasso di risparmio medio (*Savings Rate*), tasso di accumulo mensile e CAGR storico.
- Proiezioni della traiettoria patrimoniale a 10, 20 e 30 anni con grafici Recharts (Area, Bar, Pie).
- **Annual Reviews**: diario decisionale strategico per annotare scelte finanziarie, allocazioni e razionali di revisione.

### 🌍 8. Internazionalizzazione & Modularità
- Interfaccia bilingue (**Italiano / Inglese**) con rilevamento automatico della lingua del browser.
- **Moduli attivabili/disattivabili**: è possibile nascondere con un click i moduli non utilizzati (*Fisco*, *Fondo Pensione*, *FIRE*) dal pannello Impostazioni.
- Supporto completo per **Dark Mode** e **Light Mode**.
- Esportazione/Importazione completa dei dati in formato **JSON** crittografato e report esportabile in **PDF**.

---

## 🏗️ Architettura del Progetto

```
Personal-Finance-Dashboard/
├── api/
│   └── quote.ts                  # Serverless function Vercel (proxy Yahoo Finance con anti-spoofing)
├── src/
│   ├── App.tsx                   # Componente root, gestione sessioni e flussi Auth Supabase
│   ├── PersonalFinanceDashboard.tsx # Core dashboard, stato reattivo e moduli finanziari
│   ├── MarketTab.tsx             # Scheda mercati globali e quotazioni real-time con sparkline
│   ├── PrivacyPolicy.tsx         # Informativa privacy e conformità GDPR
│   ├── i18n.ts                   # Motore di internazionalizzazione (dizionari EN / IT)
│   ├── supabase.ts               # Client Supabase con adapter storage fail-safe
│   ├── index.css                 # Stili globali TailwindCSS
│   └── main.tsx                  # Entry point React 18
├── supabase/
│   ├── schema.sql                # DDL PostgreSQL, Trigger e Row Level Security (RLS)
│   └── functions/
│       └── delete-account/       # Edge Function Deno per cancellazione definitiva account (GDPR Art. 17)
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vercel.json                   # Configurazione deploy Vercel, CSP, HSTS e header di sicurezza
└── vite.config.ts                # Configurazione bundling Vite
```

---

## 🔒 Sicurezza & Privacy

L'applicazione è progettata secondo i principi di **Privacy by Design** e **Defense in Depth**:

1. **Row Level Security (RLS)**:
   Ogni operazione sul database PostgreSQL (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) è vincolata rigorosamente a `auth.uid() = user_id`. Nessun utente può visualizzare o alterare i dati di altri utenti.
2. **Server-Side Request Forgery (SSRF) Protection**:
   I parametri ticker inviati all'endpoint `/api/quote` sono validati con una whitelist regex restrittiva (`/^[A-Z0-9.\-^=]{1,20}$/`), bloccando qualsiasi injection o chiamata a indirizzi interni.
3. **Rate Limiting con Anti-IP Spoofing**:
   L'estrazione dell'indirizzo IP del client privilegia gli header di confine fidati (`x-vercel-forwarded-for` o l'ultimo hop di `x-forwarded-for`), impedendo l'elusione del rate limit tramite header forgiati.
4. **Header HTTP di Sicurezza (in `vercel.json`)**:
   - **Content-Security-Policy (CSP)** restrittiva (nessun `'unsafe-eval'`).
   - **Strict-Transport-Security (HSTS)** forzato a 2 anni (`max-age=63072000; preload`).
   - **X-Frame-Options: DENY** per proteggere da attacchi di Clickjacking.
   - **X-Content-Type-Options: nosniff** per prevenire il MIME-type sniffing.
5. **Diritto all'Oblio (GDPR Art. 17)**:
   Funzione dedicata per l'eliminazione completa dell'account e di tutte le tabelle collegate con un solo click. La chiave amministrativa `SUPABASE_SERVICE_ROLE_KEY` è isolata nella Edge Function e non viene mai esposta al frontend.
6. **Hardening Anti-Prototype Pollution**:
   La deserializzazione e l'importazione dei backup JSON sanitizza ricorsivamente le proprietà e ignora chiavi speciali come `__proto__`, `constructor` e `prototype`.

---

## 🚀 Guida all'Installazione & Avvio Locale

### Prerequisiti
- [Node.js](https://nodejs.org/) (versione 18 o superiore consigliata)
- Un account attivo su [Supabase](https://supabase.com/)

### 1. Clona il repository
```bash
git clone https://github.com/f-estero/Personal-Finance-Dashboard.git
cd Personal-Finance-Dashboard
```

### 2. Installa le dipendenze
```bash
npm install
```

### 3. Configura le variabili d'ambiente
Crea un file `.env` nella cartella root copiando il template:
```bash
cp .env.example .env
```
Compila `.env` con i dati del tuo progetto Supabase:
```env
VITE_SUPABASE_URL=https://tuo-progetto.supabase.co
VITE_SUPABASE_ANON_KEY=la-tua-anon-key-pubblica
```

### 4. Configura il Database su Supabase
Accedi all'SQL Editor della dashboard del tuo progetto Supabase ed esegui lo script contenuto in [supabase/schema.sql](supabase/schema.sql).

### 5. Avvia il server di sviluppo
```bash
npm run dev
```
L'applicazione sarà attiva su `http://localhost:5173`.

### 6. Build di produzione
```bash
npm run build
```

---

## ☁️ Deploy su Vercel

Il progetto è preconfigurato per il deploy su Vercel:

1. Collega il repository GitHub su [Vercel](https://vercel.com/).
2. Configura le Environment Variables su Vercel:
   - `VITE_SUPABASE_URL`: URL del tuo progetto Supabase.
   - `VITE_SUPABASE_ANON_KEY`: Chiave Anon pubblica di Supabase.
3. Esegui il deploy. Vercel configurerà automaticamente il frontend SPA e la Serverless Function in `/api/quote.ts`.

---

## 📄 Licenza & Disclaimer

Questo software è distribuito a scopo informativo e di pianificazione personale. **Non costituisce in alcun modo consulenza finanziaria, fiscale o previdenziale professionale.** Prima di effettuare qualsiasi investimento o operazione fiscale, consultare un professionista abilitato.
