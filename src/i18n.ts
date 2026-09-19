// ═══════════════════════════════════════════════════════════
// i18n — dizionario di traduzione
//
// La chiave è il testo italiano originale: se una voce manca dal
// dizionario inglese, la UI ricade sull'italiano invece di mostrare
// un placeholder. Per i segnaposto si usa la forma {nome}:
//   t('Benvenuto {name}!', { name: 'Anna' })
//
// SCELTA DI PRODOTTO: la terminologia fiscale e previdenziale italiana
// (imposta di bollo, rigo E27, IRPEF, PMC, TFR, deducibilità del fondo
// pensione) NON è presente qui di proposito, così resta in italiano anche
// in modalità inglese: descrive norme che esistono solo in Italia e una
// traduzione renderebbe più difficile ritrovare gli stessi termini sui
// documenti fiscali. Quei moduli sono disattivabili dalle Impostazioni.
// ═══════════════════════════════════════════════════════════

export type Lang = 'en' | 'it';

export const LANGUAGES: { id: Lang; label: string; flag: string }[] = [
  { id: 'en', label: 'English', flag: '🇬🇧' },
  { id: 'it', label: 'Italiano', flag: '🇮🇹' },
];

const EN: Record<string, string> = {
  // ─── Navigazione, header, stato sincronizzazione ───
  'Dashboard': 'Dashboard',
  'Portafoglio': 'Portfolio',
  'Fisco': 'Tax',
  'Liquidità': 'Cash',
  'Mercato': 'Markets',
  'Analytics': 'Analytics',
  'Storico': 'History',
  'FIRE': 'FIRE',
  'Revisioni': 'Reviews',
  'Impostazioni': 'Settings',
  'Finance Personal Dashboard': 'Finance Personal Dashboard',
  '{age} anni': '{age} years old',
  'patrimonio netto': 'net worth',
  'vs ultimo snapshot': 'vs last snapshot',
  'Caricamento dashboard...': 'Loading dashboard…',
  'I tuoi dati sono salvati in cloud — sicuri da qualsiasi aggiornamento':
    'Your data is saved in the cloud — safe across updates',
  'Salvataggio...': 'Saving…',
  'Salvato in cloud': 'Saved to cloud',
  'Errore sync': 'Sync error',
  'Cloud sync attivo': 'Cloud sync on',
  'Stampa Report PDF': 'Print PDF report',
  'Esporta PDF': 'Export PDF',
  'Attiva Light Mode': 'Switch to light mode',
  'Attiva Dark Mode': 'Switch to dark mode',
  'Esci': 'Sign out',
  'Errore salvataggio cloud': 'Cloud save failed',
  'Ci sono modifiche non salvate. Sei sicuro di voler uscire?':
    'You have unsaved changes. Are you sure you want to leave?',

  // ─── Azioni e vocabolario comune ───
  'Salva': 'Save',
  'Annulla': 'Cancel',
  'Elimina': 'Delete',
  'Aggiungi': 'Add',
  'Modifica': 'Edit',
  'Chiudi': 'Close',
  'Conferma': 'Confirm',
  'Ho capito': 'Got it',
  'Configura': 'Set up',
  'Continua': 'Continue',
  'Indietro': 'Back',
  'Avanti': 'Next',
  'Inizia': 'Get started',
  'Resetta': 'Reset',
  'Importa': 'Import',
  'Esporta': 'Export',
  'Aggiorna': 'Refresh',
  'Dettaglio': 'Details',
  'Registra': 'Record',
  'Suggerisci': 'Suggest',
  'OK': 'OK',
  'N/D': 'N/A',
  'Oggi': 'Today',
  'Ora': 'Now',
  'Mese': 'Month',
  'Anno': 'Year',
  'Data': 'Date',
  'Note': 'Notes',
  'Nome': 'Name',
  'Titolo': 'Title',
  'Importo': 'Amount',
  'Tipo': 'Type',
  'Totale': 'Total',
  'Azione': 'Action',
  'Periodo': 'Period',
  'Prima': 'Before',
  'Dopo': 'After',
  'Target': 'Target',
  'Scadenza': 'Deadline',
  'Colore': 'Colour',
  'Nessuno': 'None',
  'attuale': 'current',
  'Atteso': 'Expected',
  'Raggiunto': 'Reached',
  'Mancano': 'Missing',
  'ETF': 'ETF',
  'PAC': 'Investment plan',
  'Stipendio': 'Salary',
  'Entrate': 'Income',
  'Uscite': 'Expenses',
  'Netto': 'Net',
  'Entrata': 'Income',
  'Uscita': 'Expense',
  'Livello': 'Level',
  'Cap': 'Cap',
  'Broker': 'Broker',
  'TER': 'TER',
  'ISIN': 'ISIN',
  'Prezzo': 'Price',
  'Scenario': 'Scenario',
  'Rendita': 'Income',
  'Versamento': 'Contribution',
  'Comparto': 'Sub-fund',
  'Trimestre': 'Quarter',

  // ─── Onboarding ───
  'Configurazione iniziale': 'Initial setup',
  'Configurazione iniziale — Step {step} di {total}': 'Initial setup — step {step} of {total}',
  'Benvenuto {name}! Completa la configurazione nelle Impostazioni.':
    'Welcome {name}! Finish setting things up in Settings.',
  'Lingua': 'Language',
  "Scegli la lingua dell'interfaccia": 'Choose your interface language',
  'Potrai cambiarla in qualsiasi momento dalle Impostazioni.':
    'You can change this at any time from Settings.',
  'Il tuo profilo': 'Your profile',
  'Come ti chiami e quando sei nato?': "What's your name and when were you born?",
  'Stipendio & PAC': 'Salary & investment plan',
  'Quanto guadagni e quanto investi ogni mese?': 'How much do you earn and invest each month?',
  'Obiettivo FIRE': 'FIRE goal',
  "A che età vuoi raggiungere l'indipendenza finanziaria?":
    'At what age do you want to reach financial independence?',
  'es. Mario': 'e.g. Alex',
  'Anno di nascita': 'Year of birth',
  'Stipendio netto mensile (€)': 'Monthly net salary (€)',
  'es. 2000': 'e.g. 2000',
  'Investimento mensile PAC (€)': 'Monthly investment (€)',
  'es. 500': 'e.g. 500',
  'Puoi modificare tutto nelle Impostazioni in qualsiasi momento.':
    'You can change all of this later in Settings.',
  'Età target per il FIRE': 'Target age for FIRE',
  'es. 50': 'e.g. 50',
  "L'età in cui vuoi smettere di lavorare": 'The age at which you want to stop working',
  'Rendimento annuo atteso (%)': 'Expected annual return (%)',
  'es. 5': 'e.g. 5',
  'Tasso reale storico S&P 500 ≈ 7%, prudente ≈ 5%':
    'Historical real S&P 500 rate ≈ 7%, conservative ≈ 5%',
  'Rendita mensile desiderata (€)': 'Desired monthly income (€)',
  'FIRE number stimato: {amount} (SWR 4%)': 'Estimated FIRE number: {amount} (4% SWR)',
  'Salta — configuro tutto manualmente': 'Skip — I\'ll set everything up myself',

  // ─── Impostazioni: lingua e moduli ───
  'Lingua e moduli': 'Language & modules',
  'Scegli la lingua e attiva solo le sezioni che ti servono':
    'Pick your language and enable only the sections you need',
  'Lingua interfaccia': 'Interface language',
  'Moduli attivi': 'Active modules',
  "Attiva o disattiva intere sezioni dell'app. Quelle disattivate spariscono dalla navigazione.":
    'Turn entire sections of the app on or off. Disabled ones disappear from the navigation.',
  'Fisco e tassazione': 'Tax & taxation',
  'Plusvalenze latenti, imposta di bollo, configurazione fiscale degli strumenti. Contenuto specifico per la normativa italiana, disponibile solo in italiano.':
    'Latent capital gains, stamp duty, per-instrument tax setup. Italian tax rules only — available in Italian.',
  'Fondo pensione': 'Pension fund',
  'Previdenza complementare, versamenti e deducibilità fiscale. Contenuto specifico per la normativa italiana, disponibile solo in italiano.':
    'Supplementary pension, contributions and tax deductibility. Italian rules only — available in Italian.',
  'Proiezioni di indipendenza finanziaria, scenari di rendimento e roadmap delle milestone.':
    'Financial independence projections, return scenarios and milestone roadmap.',
  'Attivo': 'On',
  'Disattivato': 'Off',

  // ─── Toast e messaggi ───
  'Dati migrati da {source}': 'Data migrated from {source}',
  'Obiettivo FIRE aggiornato': 'FIRE goal updated',
  'Obiettivo aggiunto': 'Goal added',
  'Obiettivo rimosso': 'Goal removed',
  'Strumento aggiunto al PAC': 'Instrument added to the plan',
  'Strumento rimosso dal PAC': 'Instrument removed from the plan',
  'Spesa fissa aggiunta': 'Fixed expense added',
  'Spesa fissa rimossa': 'Fixed expense removed',
  'Spesa variabile aggiunta': 'Variable expense added',
  'Spesa variabile rimossa': 'Variable expense removed',
  'Buffer aggiunto al waterfall': 'Buffer added to the waterfall',
  'Deve rimanere almeno un livello nel waterfall': 'At least one waterfall level must remain',
  'Buffer rimosso dal waterfall': 'Buffer removed from the waterfall',
  'Importo target non valido': 'Invalid target amount',
  'Milestone personalizzata aggiunta': 'Custom milestone added',
  'Milestone personalizzata rimossa': 'Custom milestone removed',
  'Contributo registrato': 'Contribution recorded',
  'Contributo rimosso': 'Contribution removed',
  'Il file Excel sembra vuoto': 'The Excel file looks empty',
  'Struttura file non riconosciuta. Assicurati che contenga le colonne "Anno" e "Periodo".':
    'Unrecognised file structure. Make sure it has "Anno" and "Periodo" columns.',
  'Importati con successo {count} contributi {fund}!':
    'Successfully imported {count} {fund} contributions!',
  'Errore durante la lettura del file Excel': 'Could not read the Excel file',
  'Importo non valido': 'Invalid amount',
  'Liquidità insufficiente per PAC ({amount}). Mancano {missing}.':
    'Not enough cash for the investment plan ({amount}). {missing} short.',
  'PAC {amount} eseguito · +{amount} su ETF': 'Plan executed for {amount} · +{amount} into ETFs',
  'Inserisci un importo valido superiore a 0': 'Enter a valid amount greater than 0',
  'Attenzione: Liquidità insufficiente per registrare tutte le spese ({amount}). Mancano {missing}. Spese comunque detratte fino a saldo zero.':
    'Warning: not enough cash to record all expenses ({amount}). {missing} short. Expenses were still deducted down to zero.',
  'Spese del mese registrate con successo! Detratti {amount} dalla liquidità.':
    "This month's expenses recorded. {amount} deducted from cash.",
  'Operazione annullata e patrimonio ripristinato': 'Operation reverted and balances restored',
  'Snapshot salvato': 'Snapshot saved',
  'Alloca esattamente {target} — attuale: {current}':
    'Allocate exactly {target} — currently {current}',
  'Liquidità insufficiente. Mancano {missing}.': 'Not enough cash. {missing} short.',
  'Versamento volontario {amount} eseguito · +{amount} su ETF':
    'One-off contribution of {amount} done · +{amount} into ETFs',
  'Transazione aggiunta': 'Transaction added',
  'Backup esportato': 'Backup exported',
  'Dati importati con successo': 'Data imported successfully',
  'Verranno cancellati TUTTI i dati: configurazione, snapshot, eventi, transazioni. Operazione irreversibile (suggerito: esporta prima un backup).':
    'This will erase ALL your data: settings, snapshots, events, transactions. This cannot be undone — export a backup first.',
  'Dashboard resettata ai default': 'Dashboard reset to defaults',
  'Titolo richiesto': 'Title required',
  'Revisione salvata': 'Review saved',
  'Revisione eliminata': 'Review deleted',
  'Eliminare "{title}"? L\'operazione è irreversibile.':
    'Delete "{title}"? This cannot be undone.',
  'Verranno eliminati TUTTI i tuoi dati finanziari e il tuo account. Operazione irreversibile. Esporta un backup prima di procedere.':
    'This will permanently delete ALL your financial data and your account. This cannot be undone — export a backup first.',
  "Dati eliminati, ma la cancellazione account ha richiesto un fallback. Contatta l'amministratore.":
    'Your data was deleted, but removing the account needed a fallback. Please contact the administrator.',

  // ─── Dashboard ───
  'Quotazioni & Performance ETF': 'ETF quotes & performance',
  'Variazione ETF Oggi': "Today's ETF change",
  'Prossimo Traguardo': 'Next milestone',
  'La tua motivazione finanziaria immediata': 'Your most immediate financial motivation',
  'Dettaglio traguardo:': 'Milestone details:',
  "all'età di": 'at age',
  'Tutto in ordine': 'All clear',
  'Nessuna azione pendente. Il piano sta procedendo regolarmente.':
    'Nothing pending. Your plan is on track.',
  'Cosa fare oggi': 'What to do today',
  'Obiettivo Crescita Patrimonio': 'Net worth growth goal',
  "Tracciamento dell'aumento percentuale annuo del patrimonio netto":
    'Tracking the annual percentage increase in net worth',
  "per raggiungere l'obiettivo patrimoniale di fine anno.":
    'to reach your end-of-year net worth goal.',
  "✓ Obiettivo annuale raggiunto! Tutto quello che accumuli d'ora in poi è surplus.":
    '✓ Annual goal reached! Everything you save from now on is surplus.',
  'Definisci un target di crescita nelle Impostazioni per visualizzare questo pannello.':
    'Set a growth target in Settings to see this panel.',
  'Obiettivi Personali': 'Personal goals',
  'Traguardi finanziari dedicati (es. auto, casa, emergenze)':
    'Dedicated financial targets (e.g. car, home, emergencies)',
  'Nuovo Obiettivo': 'New goal',
  'Nessun obiettivo impostato. Clicca su "Nuovo Obiettivo" per aggiungerne uno.':
    'No goals set yet. Click "New goal" to add one.',
  'Andamento patrimonio': 'Net worth over time',
  'Definisci un traguardo patrimoniale': 'Define a net worth target',
  'Titolo obiettivo': 'Goal title',
  'es. Acquisto Auto, Fondo Vacanze...': 'e.g. New car, holiday fund…',
  'Target (€)': 'Target (€)',
  'es. 15000': 'e.g. 15000',
  'Attuale (€)': 'Current (€)',

  // ─── Liquidità e waterfall ───
  'Sistema a cascata (Waterfall)': 'Cash waterfall',
  'Conto Deposito Svincolato': 'Flexible savings account',
  'Ripartizione Attiva': 'Allocation active',
  'Suddividi Liquidità': 'Split cash',
  'Tutto sul c/c (€0)': 'All in current account (€0)',
  'Analisi Rendimento Conto Deposito': 'Savings account return analysis',
  'di interessi passivi puliti. Equivale a': 'of clean passive interest. That equals',
  'Erosione da Inflazione sulla Liquidità': 'Inflation erosion on your cash',
  'Liquidità Infruttifera (c/c)': 'Non-interest-bearing cash',
  'Soggetta a perdita di valore intera': 'Fully exposed to loss of value',
  "Erosione Potere d'Acquisto Annua": 'Annual purchasing power lost',
  'Perdita di valore reale stimata': 'Estimated real value lost',
  'Erosione Coperta da Conto Deposito': 'Offset by the savings account',
  'Interessi netti generati': 'Net interest earned',
  "L'inflazione è una tassa invisibile": 'Inflation is an invisible tax',
  ', la tua liquidità infruttifera di': ', your non-interest-bearing cash of',
  'perde circa': 'loses about',
  'Fortunatamente, allocando': 'Fortunately, by allocating',
  'sul Conto Deposito, riesci a recuperare': 'to the savings account, you recover',
  ', coprendo il': ', covering',
  "dell'erosione totale!": 'of the total erosion!',
  "Valuta di allocare una parte della liquidità sul Conto Deposito o investirla tramite il PAC per proteggerla dall'inflazione.":
    'Consider moving some cash into the savings account, or investing it through your plan, to protect it from inflation.',
  "La liquidità inserita riempirà i buffer in ordine sequenziale fino al cap impostato. Eventuali eccedenze confluiranno automaticamente nell'ultimo livello (Overflow).":
    'Cash fills each buffer in order up to its cap. Anything left over automatically flows into the last level (Overflow).',
  "Tasso d'interesse annuo lordo (%)": 'Gross annual interest rate (%)',
  'Quota in Conto Deposito (€)': 'Amount in savings account (€)',
  'Importo accreditato': 'Amount received',
  'Distribuzione liquidità': 'Cash distribution',
  'Nessuna distribuzione (importo a zero)': 'Nothing to distribute (amount is zero)',
  "Inserisci l'importo effettivamente accreditato": 'Enter the amount you actually received',
  "Tutti i livelli con cap sono già pieni — l'intero stipendio va su overflow.":
    'Every capped level is already full — the whole salary goes to overflow.',
  'Overflow L4': 'Overflow L4',
  ', poi dalla': ', then from',
  'Liquidità Operativa L3': 'Operating cash L3',
  ', quindi da': ', then from',
  'Lifestyle L2': 'Lifestyle L2',
  'e infine da': 'and finally from',
  'Emergenza L1': 'Emergency L1',
  'Sottrae le spese effettive direttamente dalla liquidità':
    'Deducts actual expenses straight from your cash',
  'Spese Programmate e Ricorrenti (€)': 'Planned and recurring expenses (€)',
  'E.g. 50': 'e.g. 50',
  'Svago straordinario, imprevisti, spese non preventivate':
    'One-off treats, surprises, unplanned costs',
  'Totale da Detrarre:': 'Total to deduct:',
  'Preleva dalla liquidità e investi fuori dal PAC mensile':
    'Withdraw from cash and invest outside the monthly plan',
  'Importo da investire': 'Amount to invest',
  'Totale allocato': 'Total allocated',
  'Importo versato': 'Amount paid in',
  'Lascia vuoto se hai seguito il piano standard': 'Leave empty if you followed the standard plan',

  // ─── Spese e cashflow ───
  'Bilancio Spese & Margine di Cassa': 'Expense balance & cash margin',
  'Mese bonus attivo': 'Bonus month active',
  'Stipendio Netto': 'Net salary',
  'Spese Fisse': 'Fixed expenses',
  'Spese Variabili': 'Variable expenses',
  'PAC Mensile': 'Monthly investment',
  'Margine Reale': 'Real margin',
  "Configura le spese fisse in Impostazioni per visualizzare l'alert di margine":
    'Set up fixed expenses in Settings to see the margin alert',
  'Breakdown Spese Fisse': 'Fixed expenses breakdown',
  'Totale Spese Fisse': 'Total fixed expenses',
  'Breakdown Spese Variabili': 'Variable expenses breakdown',
  'Totale Spese Variabili': 'Total variable expenses',
  'Cash flow mensile': 'Monthly cash flow',
  'non conf.': 'unconfirmed',
  'Saving rate': 'Saving rate',
  'PAC + surplus / entrate': 'Investment + surplus / income',
  'attesi sulla base della configurazione': 'expected based on your setup',
  'Eventi ricorrenti': 'Recurring events',
  'Ultimi 12 mesi': 'Last 12 months',
  'Visione rapida regolarità eventi': 'A quick look at how regular your events are',
  'Transazioni extra': 'One-off transactions',
  'Entrate o uscite straordinarie': 'Extraordinary income or spending',
  'Categoria + nota': 'Category + note',
  'Nota...': 'Note…',
  'Nessuna transazione extra': 'No one-off transactions',
  'Cronologia snapshot': 'Snapshot history',
  'Nessuno snapshot ancora': 'No snapshots yet',

  // ─── Portafoglio ───
  'Il tuo Portafoglio ETF': 'Your ETF portfolio',
  'Nessun ETF configurato': 'No ETFs set up',
  'Posizioni di mercato': 'Market positions',
  'ETF aggregato (fallback)': 'Aggregate ETF value (fallback)',
  'Usato se non aggiorni i singoli strumenti':
    'Used when you do not update each instrument separately',
  'Aggiorna con estratto conto annuale': 'Update from your annual statement',
  'Tracking per-strumento (opzionale)': 'Per-instrument tracking (optional)',
  'Tracking incompleto:': 'Incomplete tracking:',
  'Drift di portafoglio rilevato': 'Portfolio drift detected',
  'Core Portfolio ETF': 'Core ETF portfolio',
  'Suggerimento ribilanciamento': 'Rebalancing suggestion',
  'Allocazione PAC tattica per ridurre il drift':
    'Tactical plan allocation to reduce drift',
  'Approccio dolce:': 'Gentle approach:',

  // ─── FIRE ───
  'verso FIRE': 'towards FIRE',
  'Mancano al target': 'Left to target',
  'Tempo stimato': 'Estimated time',
  'Coast FIRE Progress': 'Coast FIRE progress',
  'Scenari FIRE interattivi': 'Interactive FIRE scenarios',
  'Rendita stimata · SWR 4%': 'Estimated income · 4% SWR',
  'Tasso di prelievo sicuro applicato al PAC':
    'Safe withdrawal rate applied to the portfolio',
  'Roadmap milestone': 'Milestone roadmap',
  'Sentiero di accumulo 2027 → 2049': 'Accumulation path 2027 → 2049',
  'Progresso PAC': 'Portfolio progress',
  'Riconfigura età target e rendimento atteso': 'Reset your target age and expected return',
  'Età ritiro': 'Retirement age',
  'Rendimento PAC': 'Portfolio return',
  'Milestone generate': 'Milestones generated',
  'Rendimento annuo atteso PAC (%)': 'Expected annual portfolio return (%)',
  'Le milestone si aggiornano automaticamente': 'Milestones update automatically',

  // ─── Analytics ───
  'Performance & Efficienza Portafoglio': 'Portfolio performance & efficiency',
  'Rendimenti storici calcolati in base alla variazione degli snapshot':
    'Historical returns calculated from changes between snapshots',
  'Rendimento Totale': 'Total return',
  "Dall'inizio del tracciamento": 'Since tracking began',
  'Performance YTD': 'YTD performance',
  'CAGR Annualizzato': 'Annualised CAGR',
  'Tasso composto annuo': 'Compound annual rate',
  'Costo TER Annuo': 'Annual TER cost',
  'Traiettoria reale vs proiezione Ponderata': 'Actual path vs weighted projection',
  'Grafico disponibile dal secondo mese': 'Chart available from the second month',
  'Insight automatici': 'Automatic insights',
  'Analisi basata sui dati attuali': 'Analysis based on your current data',
  'Tracking automatico attivo:': 'Automatic tracking on:',
  'Composizione & Diversificazione Asset': 'Asset mix & diversification',
  'Ripartizione attuale e andamento storico dei tuoi pilastri patrimoniali':
    'Current split and history of your main asset groups',
  'Quota:': 'Share:',
  'Quota Attuale Asset': 'Current asset split',
  'Evoluzione Composizione nel Tempo': 'How the mix changed over time',
  'Dati storici insufficienti': 'Not enough history yet',

  // ─── Revisioni ───
  'Revisioni annuali': 'Annual reviews',
  'Documenta decisioni strategiche del portafoglio nel tempo':
    'Document your strategic portfolio decisions over time',
  'es. Revisione strategica 2026': 'e.g. Strategic review 2026',
  'Sintesi esecutiva': 'Executive summary',
  'Sommario delle decisioni chiave (1-2 frasi)...': 'Summary of the key decisions (1–2 sentences)…',
  'Decisioni strutturali (PRE → POST)': 'Structural decisions (BEFORE → AFTER)',
  'Es: "Eliminazione obbligazionario dal Core Portfolio", "Cambio comparto Fon.Te. verso Dinamico"':
    'e.g. "Dropped bonds from the core portfolio", "Switched pension sub-fund to Dynamic"',
  'Titolo della decisione': 'Decision title',
  'PRIMA — situazione precedente': 'BEFORE — previous situation',
  'DOPO — nuova configurazione': 'AFTER — new setup',
  'Razionale della decisione (perché?)': 'Rationale (why?)',
  'Salva revisione': 'Save review',
  'Nessuna revisione registrata': 'No reviews recorded',

  // ─── Impostazioni ───
  'Profilo': 'Profile',
  'Importo netto, mensilità aggiuntive, RAL e accredito':
    'Net amount, extra monthly payments, gross salary and pay day',
  'Netto mensile': 'Monthly net',
  'Bonus 13ª/14ª': '13th/14th salary',
  'RAL (Lordo Annuo)': 'Gross annual salary',
  'Giorno accredito': 'Pay day',
  'Mesi bonus': 'Bonus months',
  'Spese fisse mensili': 'Monthly fixed expenses',
  'es. Affitto': 'e.g. Rent',
  'Rimuovi spesa fissa': 'Remove fixed expense',
  'Nessuna spesa fissa configurata.': 'No fixed expenses set up.',
  'Aggiungi Spesa Fissa': 'Add fixed expense',
  'Totale spese fisse': 'Total fixed expenses',
  'Margine mensile dopo PAC:': 'Monthly margin after investing:',
  'PAC sovradimensionato di': 'Investment plan is oversized by',
  'rispetto alle entrate disponibili': 'compared with available income',
  'Le spese fisse sono automaticamente dedotte dal cashflow e non richiedono conferma mensile.':
    'Fixed expenses are deducted from cash flow automatically — no monthly confirmation needed.',
  'Spese Variabili Stimate': 'Estimated variable expenses',
  'Budget mensili stimati per evitare sovrastime della liquidità cashflow':
    'Estimated monthly budgets, so your cash flow is not overstated',
  'es. Spesa e Alimentari': 'e.g. Groceries',
  'Rimuovi spesa variabile': 'Remove variable expense',
  'Nessun budget per spese variabili configurato.': 'No variable expense budgets set up.',
  'Aggiungi Spesa Variabile': 'Add variable expense',
  'Totale stima spese variabili': 'Total estimated variable expenses',
  'Cap sistema a cascata (Waterfall)': 'Cash waterfall caps',
  'Definisci i livelli di riempimento progressivo della liquidità':
    'Define how your cash fills up, level by level',
  'Nome del buffer': 'Buffer name',
  'Rimuovi buffer': 'Remove buffer',
  'Descrizione:': 'Description:',
  'es. Spese straordinarie e imprevisti': 'e.g. Unexpected and one-off costs',
  'Icona:': 'Icon:',
  '🛡️ Scudo': '🛡️ Shield',
  '☕ Svago': '☕ Leisure',
  '⚡ Operatività': '⚡ Day-to-day',
  '🚀 Investimenti': '🚀 Investing',
  'Aggiungi Buffer Liquidità': 'Add cash buffer',
  'Liquidità fruttifera a basso rischio per far maturare piccoli interessi':
    'Low-risk interest-bearing cash that earns a little on the side',
  'Versamento ricorrente e allocazione strumenti':
    'Recurring contribution and instrument allocation',
  'Importo mensile': 'Monthly amount',
  'Giorno addebito': 'Debit day',
  'Allocazione strumenti (somma deve = 100%)': 'Instrument allocation (must total 100%)',
  'Rimuovi strumento': 'Remove instrument',
  'Ticker:': 'Ticker:',
  'es. SWDA.MI': 'e.g. SWDA.MI',
  'ISIN:': 'ISIN:',
  'es. IE00B4L60045': 'e.g. IE00B4L60045',
  'TER:': 'TER:',
  'Nessun ETF aggiunto. Clicca su Aggiungi Strumento per iniziare.':
    'No ETFs yet. Click "Add instrument" to start.',
  'Aggiungi Strumento': 'Add instrument',
  'Totale allocazione': 'Total allocation',
  'Asset Allocation (descrizione)': 'Asset allocation (description)',
  'Contributo/mese': 'Contribution/month',
  'TER (%)': 'TER (%)',
  'Obiettivi e Crescita Patrimoniale': 'Goals & net worth growth',
  'Definisci gli obiettivi di crescita del patrimonio, target FIRE e parametri di inflazione':
    'Set your net worth growth goals, FIRE target and inflation assumptions',
  'Crescita annua target (%)': 'Target annual growth (%)',
  'FIRE Number Target (€)': 'FIRE number target (€)',
  'Rendita mensile target (€)': 'Target monthly income (€)',
  'Tasso inflazione atteso (%)': 'Expected inflation rate (%)',
  'Milestone Personalizzate': 'Custom milestones',
  'Aggiungi o rimuovi traguardi di capitale personalizzati':
    'Add or remove your own capital milestones',
  'Rimuovi milestone': 'Remove milestone',
  'Nessuna milestone personalizzata configurata.': 'No custom milestones set up.',
  'Nome traguardo': 'Milestone name',
  'es. Acquisto Casa, Auto...': 'e.g. Buy a house, a car…',
  'Capitale Target': 'Target capital',
  'es. 50000': 'e.g. 50000',
  'Gestione dati': 'Data management',
  'Backup, ripristino e reset': 'Backup, restore and reset',
  'Esporta backup JSON': 'Export JSON backup',
  'Importa backup': 'Import backup',
  'Genera Report PDF': 'Generate PDF report',
  'Reset dati': 'Reset data',
  'Privacy & Account': 'Privacy & account',
  'Diritti GDPR e cancellazione account': 'GDPR rights and account deletion',
  '✅ I tuoi dati sono protetti da autenticazione e crittografia':
    '✅ Your data is protected by authentication and encryption',
  '✅ Nessun altro utente può vedere i tuoi dati (Row Level Security)':
    '✅ No other user can see your data (row level security)',
  '✅ Puoi esportare o eliminare i tuoi dati in qualsiasi momento':
    '✅ You can export or delete your data at any time',
  "⚠️ L'amministratore del servizio ha accesso tecnico al database (vedi Privacy Policy)":
    '⚠️ The service administrator has technical access to the database (see the privacy policy)',
  'Elimina account': 'Delete account',
  'es. 35000': 'e.g. 35000',

  // ─── Report PDF ───
  'Riservato e confidenziale': 'Private and confidential',
  'Report Finanziario Personale': 'Personal financial report',
  'Patrimonio Netto Complessivo': 'Total net worth',
  'Portafoglio PAC': 'Investment portfolio',
  'Previdenza': 'Pension',
  'Preparato per:': 'Prepared for:',
  'Valori patrimoniali aggiornati: —': 'Balances updated: —',
  'SEZIONE 1 — PATRIMONIO TOTALE': 'SECTION 1 — TOTAL NET WORTH',
  'Patrimonio Complessivo': 'Total net worth',
  'Macro-Categoria': 'Category',
  'Allocazione €': 'Allocation €',
  'Peso %': 'Weight %',
  'Liquidità Totale (Somma buffer)': 'Total cash (all buffers)',
  'Portafoglio Investimenti PAC': 'Investment portfolio',
  'Altro (Immobiliare, Altro)': 'Other (property, other)',
  'Ripartizione Proporzionale Asset': 'Proportional asset split',
  'Liquidità:': 'Cash:',
  'Portafoglio PAC:': 'Investment portfolio:',
  'Destinazione': 'Purpose',
  'Funzione Strategica': 'Strategic role',
  'Pagina 2 di 5': 'Page 2 of 5',
  'ETF Strumento': 'ETF instrument',
  'Esposizione': 'Exposure',
  'Versam./m': 'Contrib./m',
  'Valore €': 'Value €',
  'Totale Portafoglio': 'Total portfolio',
  'Diversificato': 'Diversified',
  'Nota strategica di allocazione:': 'Strategic allocation note:',
  'Fondo Pensione': 'Pension fund',
  'Comparto Attivo': 'Active sub-fund',
  'TER OCF Annuo': 'Annual OCF/TER',
  'Posizione Maturata:': 'Accrued balance:',
  'Versamento/mese:': 'Contribution/month:',
  'Proiezione a 65 anni': 'Projection at 65',
  'Calcolato a rendimento 3.0% reale netto': 'Assuming a 3.0% net real return',
  'Rendita Mensile Vitalizia Stimata': 'Estimated lifetime monthly income',
  'con aliquota marginale al': 'at a marginal rate of',
  'Pagina 3 di 5': 'Page 3 of 5',
  'e un risparmio fisso mensile teorico costante di':
    'and a constant theoretical monthly saving of',
  'Scenario Analizzato': 'Scenario',
  'Target FIRE €': 'FIRE target €',
  'Resa Reale': 'Real return',
  'Anni al Traguardo': 'Years to target',
  'Età al FIRE': 'Age at FIRE',
  'Rendita Annua (4%)': 'Annual income (4%)',
  'Rendita Mensile': 'Monthly income',
  'Scenario Conservativo': 'Conservative scenario',
  '🌟 Scenario Base (Rif.)': '🌟 Base scenario (ref.)',
  'Scenario Ottimistico': 'Optimistic scenario',
  'Lean FIRE (Essenziale)': 'Lean FIRE (essential)',
  'Fat FIRE (Premium Style)': 'Fat FIRE (premium)',
  'Traguardo / Milestone': 'Milestone',
  'Stato Avanzamento': 'Progress',
  'Progresso Grafico': 'Progress bar',
  'Pagina 4 di 5': 'Page 4 of 5',
  'Tasso di Risparmio': 'Saving rate',
  'Crescita Storica (CAGR)': 'Historical growth (CAGR)',
  'Scostamento Traiettoria': 'Deviation from path',
  'Vs benchmark 5.3% annuo': 'Vs 5.3% annual benchmark',
  'TER Medio Ponderato': 'Weighted average TER',
  'Efficienza costi strumenti': 'Instrument cost efficiency',
  'Glossario ed Efficienza delle Metriche': 'Glossary and metric definitions',
  'Tasso di Risparmio:': 'Saving rate:',
  'Crescita Annuale (CAGR):': 'Annual growth (CAGR):',
  'Aderenza al Benchmark:': 'Benchmark tracking:',
  'Costo dei Prodotti (TER):': 'Product cost (TER):',
  'Pagina 5 di 5': 'Page 5 of 5',

  // ─── App.tsx — autenticazione ───
  'Dashboard privata': 'Private dashboard',
  'Accedi': 'Sign in',
  'Accesso...': 'Signing in…',
  'Email': 'Email',
  'Password': 'Password',
  'nome@email.com': 'name@email.com',
  'Password dimenticata?': 'Forgot your password?',
  'Registrati': 'Sign up',
  'Registrazione...': 'Signing up…',
  'Crea account': 'Create account',
  'min. 8 caratteri': 'min. 8 characters',
  'Conferma password': 'Confirm password',
  'Nuova password': 'New password',
  'Salva nuova password': 'Save new password',
  'Reset password': 'Reset password',
  'Inserisci la tua email — ti mandiamo un link per reimpostare la password.':
    "Enter your email — we'll send you a link to reset your password.",
  'Invio...': 'Sending…',
  'Invia link reset': 'Send reset link',
  'Controlla la tua email': 'Check your email',
  'Abbiamo inviato un link a': 'We sent a link to',
  'Torna al login': 'Back to sign in',
  'Ho letto e accetto la': 'I have read and accept the',
  'Privacy Policy': 'Privacy Policy',
  'Comprendo che i miei dati finanziari sono memorizzati in cloud.':
    'I understand that my financial data is stored in the cloud.',
  'I tuoi dati sono protetti e cifrati': 'Your data is protected and encrypted',
  'Email o password errati': 'Incorrect email or password',
  'Le password non coincidono': 'Passwords do not match',
  'Password minima 8 caratteri': 'Password must be at least 8 characters',

  // ─── MarketTab.tsx ───
  'Mercati Finanziari': 'Financial markets',
  'Aggiornato alle {time}': 'Updated at {time}',
  'Caricamento dati di mercato...': 'Loading market data…',
  'Aggiornamento...': 'Refreshing…',
  'Caricamento...': 'Loading…',
  'Oro (Gold)': 'Gold',
  'Petrolio (Oil)': 'Oil',
  'I tuoi ETF e Fondi in Portafoglio': 'Your ETFs and funds',
  'Andamento dei tuoi asset principali': 'How your main assets are performing',
  'Valuta: {valuta}': 'Currency: {valuta}',
  'Nessun ticker configurato': 'No tickers configured',
  'Vai in': 'Go to',
  'Impostazioni → PAC': 'Settings → Investment plan',
  'e aggiungi il ticker di borsa per ogni ETF. Esempi:':
    'and add the exchange ticker for each ETF. Examples:',
  'Londra': 'London',
  'Milano': 'Milan',
  'ETF / Fondo': 'ETF / Fund',
  'Variazione 24h': '24h change',
  'Trend (30g)': 'Trend (30d)',
  'Precedente': 'Previous close',
  'Range Giorno': 'Day range',
  'Dati forniti in differita via Yahoo Finance': 'Delayed data provided by Yahoo Finance',
  'Dashboard dei Mercati integrata:': 'Integrated markets dashboard:',
  "Tutte le informazioni finanziarie (Indici, Criptovalute e Materie Prime) sono recuperate in tempo reale. I dati storici tracciati negli sparkline mostrano l'andamento grafico degli ultimi 30 giorni di borsa.":
    'All financial data (indices, crypto and commodities) is fetched live. The sparklines chart the last 30 trading days.',
  'Nota: I prezzi degli indici globali come S&P 500 sono espressi nella valuta di origine (USD), mentre Bitcoin ed Ethereum sono espressi in Euro (€).':
    'Note: global indices such as the S&P 500 are quoted in their native currency (USD), while Bitcoin and Ethereum are quoted in euros (€).',
  // ─── Tempo relativo ───
  'oggi': 'today',
  'ieri': 'yesterday',
  '{n} giorni fa': '{n} days ago',
  '{n} settimane fa': '{n} weeks ago',
  '{n} mesi fa': '{n} months ago',
  '{n} anni fa': '{n} years ago',
  'anno': 'year',
  'mese': 'month',
  'del mese': 'of the month',
  'Nel': 'In',

  // ─── Validazione import backup ───
  'Impossibile leggere il file.': 'Could not read the file.',
  'Formato backup non valido: deve essere un oggetto JSON.':
    'Invalid backup format: it must be a JSON object.',
  'Sezione "config" non valida.': 'Invalid "config" section.',
  'Sezione "config.pac" non valida.': 'Invalid "config.pac" section.',
  'La lista "instruments" nel PAC deve essere un array.':
    'The "instruments" list in the plan must be an array.',
  'Profilo non valido.': 'Invalid profile.',
  'Sezione "expenses" non valida.': 'Invalid "expenses" section.',
  'I livelli waterfall devono essere forniti come array.':
    'Waterfall levels must be provided as an array.',
  'Sezione "state" non valida.': 'Invalid "state" section.',
  'Stato liquidità non valido.': 'Invalid cash state.',
  'Lo storico degli snapshot deve essere un array.': 'Snapshot history must be an array.',
  "L'elenco delle transazioni deve essere un array.": 'The transaction list must be an array.',
  'La lista dei bilanci annuali deve essere un array.': 'The annual review list must be an array.',
  'File JSON non valido': 'Invalid JSON file',

  // ─── Milestone ───
  'Proiezione accumulo a {months} mesi con PAC': 'Projected balance after {months} months of investing',
  'rendita ~{amount}/mese': 'income ~{amount}/month',
  'Raggiungibile in circa {months} mesi (~{years} anni) di versamenti':
    'Reachable in about {months} months (~{years} years) of contributions',
  'Traguardo già raggiunto!': 'Milestone already reached!',
  'Primo anno di PAC completato': 'First year of investing completed',

  // ─── Statistiche dashboard ───
  'Patrimonio Netto': 'Net worth',
  'ETF Scalable': 'ETF portfolio',
  '{pct}% del totale': '{pct}% of total',
  'PAC mensile': 'Monthly investment',
  'Addebito il {day}° del mese': 'Debited on day {day} of the month',
  'Inizio anno: {amount}': 'Start of year: {amount}',
  'Fondo Personalizzato {n}': 'Custom fund {n}',
  'Scopo del fondo': 'What this fund is for',
  'Riserva di Emergenza': 'Emergency fund',
  'Imprevisti e spese straordinarie': 'Surprises and one-off costs',

  // ─── Widget "Cosa fare oggi" ───
  'Stipendio in arrivo oggi': 'Salary arriving today',
  '(mensilità bonus)': '(bonus payment)',
  'conferma quando arriva e aggiorna il waterfall':
    'confirm when it lands and update the waterfall',
  'Stipendio domani': 'Salary tomorrow',
  'Atteso {amount}': '{amount} expected',
  'PAC in esecuzione oggi': 'Investment executing today',
  '{amount} su {broker} — verifica esecuzione addebito':
    '{amount} with {broker} — check the debit went through',
  'PAC non confermato': 'Investment not confirmed',
  'Doveva partire il {day} — verifica su {broker}':
    'It was due on day {day} — check with {broker}',
  'PAC domani': 'Investment tomorrow',
  'Assicurati che {amount} sia disponibile su L3': 'Make sure {amount} is available in L3',
  'L3 sotto soglia operativa': 'L3 below its operating threshold',
  'Liquidità operativa a {current} (target {target}) — rabbocca dal conto principale':
    'Operating cash at {current} (target {target}) — top up from your main account',
  'Overflow L4 pronto per il mercato': 'L4 overflow ready to invest',
  '{amount} disponibili per acquisti tattici DCA su S&P 500':
    '{amount} available for tactical S&P 500 purchases',
  'Overflow su {level}': 'Overflow on {level}',
  '{amount} oltre il cap — sposta su L4 o investi':
    '{amount} above the cap — move it to L4 or invest it',
  'Revisione annuale {year}': '{year} annual review',
  "Documenta le decisioni strutturali fatte quest'anno nella sezione Revisioni":
    "Record this year's structural decisions in the Reviews section",
  'Pronto per acquisti tattici DCA S&P 500': 'Ready for tactical S&P 500 purchases',

  // ─── Conto deposito e inflazione ───
  'Interesse netto:': 'Net interest:',
  '(tasso {rate}% lordo, pari a {gross} lordi, meno 26% tasse, cioè un tasso netto del':
    '({rate}% gross, i.e. {gross} before tax, less 26% tax — a net rate of',
  'Rendimento Reale Netto:': 'Net real return:',
  "(sottraendo l'inflazione attesa del {rate}%).": '(after subtracting expected inflation of {rate}%).',
  "Impatto dell'inflazione stimata al {rate}% sul tuo cash":
    'The impact of {rate}% estimated inflation on your cash',
  "Con un'inflazione stimata al": 'With estimated inflation at',
  "di potere d'acquisto all'anno.": 'in purchasing power per year.',
  'Quota massima consigliata: {amount} (tutta la liquidità)':
    'Recommended maximum: {amount} (all your cash)',

  // ─── Cashflow e spese ───
  'Analisi entrate e uscite di {month} {year}': 'Income and spending for {month} {year}',
  'Margine attivo disponibile: {amount}': 'Spare margin available: {amount}',
  'Questa quota avanza ogni mese dopo aver coperto tutte le spese stimate e aver eseguito regolarmente il PAC. Se hai liquidità residua, valuta un DCA volontario su L4 per investire attivamente questa quota.':
    'This is what is left each month after covering all estimated expenses and investing as planned. If cash is piling up, consider a voluntary top-up investment from L4.',
  'Il PAC supera la capacità di risparmio di {amount}':
    'Your investment plan exceeds your saving capacity by {amount}',
  "Il tuo budget indica che le uscite stimate e il PAC superano le entrate. Monitora l'andamento reale per evitare sconfinamenti o valuta di regolare temporaneamente la quota PAC.":
    'Your budget shows estimated spending plus investing exceeds income. Watch the actuals to avoid going over, or temporarily reduce the monthly amount.',
  'Totale {total}/mese · Margine reale {margin}': 'Total {total}/month · real margin {margin}',
  'Configura le tue uscite ricorrenti': 'Set up your recurring outgoings',
  'mese bonus': 'bonus month',
  'Disponibile per L4': 'Available for L4',
  'Effettivo': 'Actual',
  'Stimato': 'Estimated',
  'Mese passato con eventi non confermati. I valori mostrati sono':
    'Past month with unconfirmed events. The values shown are',
  ', non effettivi. Conferma gli eventi qui sotto per il tracking storico.':
    ', not actuals. Confirm the events below to keep your history accurate.',
  'Le entrate straordinarie (lavoro extra, regali, rimborsi) e le uscite impreviste verranno mostrate qui.':
    'Extra income (side work, gifts, refunds) and unexpected costs will show up here.',
  "Il primo snapshot viene salvato automaticamente alla prossima apertura dell'app, una volta che hai inserito i tuoi dati.":
    'The first snapshot is saved automatically next time you open the app, once you have entered your data.',

  // ─── Portafoglio ───
  'Tracking per singolo strumento attivo': 'Per-instrument tracking on',
  'Aggiorna almeno un valore per attivare il tracking per-strumento e il drift':
    'Update at least one value to enable per-instrument tracking and drift',
  'compilati {done}/{total} strumenti. Drift detection disattivato per evitare calcoli falsati. Compila tutti gli strumenti oppure resetta il tracking.':
    '{done}/{total} instruments filled in. Drift detection is off to avoid misleading numbers. Fill in all of them, or reset tracking.',
  'Almeno uno strumento è oltre 5pp dal target. Considera un ribilanciamento o un aggiustamento del PAC tattico.':
    'At least one instrument is more than 5pp off target. Consider rebalancing or adjusting your contributions.',
  "mantieni il PAC fisso e usa l'overflow (Liv.4) per acquisti tattici sugli strumenti sottopesati. Evita vendite per non innescare tassazione.":
    'keep contributions steady and use the L4 overflow to top up underweight instruments. Avoid selling, so you do not trigger tax.',
  "Il tuo portafoglio PAC è attualmente vuoto. Per tracciare i tuoi investimenti, calcolare il drift di allocazione e monitorare l'andamento di mercato, configura i tuoi ETF nelle Impostazioni.":
    'Your portfolio is empty. To track investments, measure allocation drift and follow market performance, add your ETFs in Settings.',

  // ─── FIRE ───
  '{n} mesi residui stimati': '{n} months to go (estimated)',
  'Patrimonio target necessario oggi a {age} anni:': 'Net worth needed today at age {age}:',
  'Il Coast FIRE misura se il patrimonio attuale, lasciato crescere al':
    'Coast FIRE measures whether your current net worth, left to grow at',
  "senza altri contributi, raggiungerà il target FIRE all'età di":
    'with no further contributions, will reach your FIRE target at age',
  "Tutti i rendimenti futuri sono depurati in tempo reale dall'inflazione attesa per mostrarti il potere d'acquisto effettivo.":
    'All future returns are adjusted for expected inflation in real time, so you see actual purchasing power.',

  // ─── Analytics ───
  'Anno corrente ({year})': 'Current year ({year})',
  'Accumulo medio/mese': 'Average saved/month',
  'Su {months} mesi tracciati': 'Over {months} months tracked',
  'Disponibile tra ~1 mese': 'Available in ~1 month',
  'Tasso di risparmio': 'Saving rate',
  'vs {amount}/mese di reddito': 'vs {amount}/month of income',
  'Crescita annualizzata': 'Annualised growth',
  'Prossima milestone': 'Next milestone',
  'Delta corrente: {delta} {status}': 'Current delta: {delta} {status}',
  '— sopra modello': '— above model',
  '— sotto modello': '— below model',
  'Il confronto sarà disponibile dopo il secondo mese di utilizzo':
    'The comparison becomes available after your second month',
  'Il tracking automatico sta raccogliendo dati. Ogni mese la curva reale si aggiorna automaticamente — non devi fare nulla.':
    'Automatic tracking is gathering data. The actual curve updates every month on its own — nothing for you to do.',
  "I rendimenti mostrati sono basati esclusivamente sulla differenza tra il primo e l'ultimo snapshot storico del patrimonio netto. Non tengono conto dei singoli flussi di cassa intermedi né dei dividendi reinvestiti.":
    'Returns are based only on the difference between your first and latest net worth snapshot. They do not account for cash flows in between, nor reinvested dividends.',
  "uno snapshot viene salvato automaticamente ogni mese alla prima apertura dell'app. Dopo 2-3 mesi avrai dati significativi per analizzare l'aderenza alla traiettoria.":
    'a snapshot is saved automatically each month the first time you open the app. After 2–3 months you will have enough data to judge how closely you are tracking.',
  'Tasso di risparmio eccellente ({rate}%):': 'Excellent saving rate ({rate}%):',
  'ben oltre la media italiana (~10%) e nel range FIRE consigliato (30–50%).':
    'well above the Italian average (~10%) and inside the recommended FIRE range (30–50%).',
  'Tasso di risparmio al {rate}%:': 'Saving rate at {rate}%:',
  'sotto la soglia FIRE consigliata. Verifica spese voluttuarie comprimibili o se ci sono state uscite straordinarie nel periodo.':
    'below the recommended FIRE threshold. Look for discretionary spending you can trim, or one-off costs in the period.',
  'Sopra la traiettoria di {amount}:': '{amount} above the projected path:',
  "il rendimento o l'accumulo reale stanno superando il modello Ponderato. Eccellente progresso.":
    'returns or actual saving are beating the weighted model. Excellent progress.',
  'Scostamento dalla traiettoria di {amount}:': '{amount} off the projected path:',
  'può essere volatilità di breve periodo. Se persiste oltre 6 mesi, valuta se rivedere il piano (capacità di risparmio o ipotesi di rendimento).':
    'this may be short-term volatility. If it lasts beyond 6 months, consider revisiting the plan (saving capacity or return assumptions).',
  'Prossima milestone "{label}":': 'Next milestone "{label}":',
  '~{months} mesi ({years} anni) al ritmo attuale di {amount}/mese e 5.3% reale. Target ETF: {target} entro il {year}.':
    '~{months} months ({years} years) at the current pace of {amount}/month and 5.3% real. ETF target: {target} by {year}.',
  'ETF (Azionario)': 'ETF (equities)',
  'Motore di crescita': 'Growth engine',
  'Sicurezza e operatività': 'Safety and day-to-day',
  'Ottimizzazione fiscale': 'Tax efficiency',
  "Gli snapshots storici mostreranno l'evoluzione grafica della composizione.":
    'Your snapshot history will chart how the mix changes over time.',
  'Registrata il {date}': 'Recorded on {date}',
  "Documenta qui le tue decisioni strategiche annuali sul portafoglio. Esempio: la revisione 2026 ha eliminato l'obbligazionario dal Core Portfolio e portato il Fon.Te. sul Comparto Dinamico.":
    'Record your yearly strategic portfolio decisions here. For example: the 2026 review dropped bonds from the core portfolio and moved the pension to the dynamic sub-fund.',

  // ─── Modali ───
  'Registra Spese Effettive del Mese': "Record this month's actual spending",
  'Spese Extra ed Extra-Budget del Mese (€)': 'Extra and over-budget spending this month (€)',
  '⚠️ Attenzione: supera la liquidità disponibile di {amount}. Il saldo residuo andrà a zero.':
    '⚠️ Careful: this exceeds available cash by {amount}. The balance will go to zero.',
  'Dove hai investito? Alloca {amount}': 'Where did you invest? Allocate {amount}',
  "Eccedenza {amount} — dove l'hai versata? (opzionale)":
    'Surplus of {amount} — where did you put it? (optional)',
  "L'importo verrà scalato dal waterfall di liquidità in ordine decrescente: prima dall'":
    'The amount is taken from your cash waterfall from the top down: first from',

  // ─── Report PDF ───
  'Data di Generazione: {date}': 'Generated on: {date}',
  'SEZIONE 2 — STRUTTURA BUFFER DI LIQUIDITÀ': 'SECTION 2 — CASH BUFFER STRUCTURE',
  'Nessuno strumento configurato nel PAC': 'No instruments configured',
  'Asset allocation target composta da {count} strumenti PAC con TER medio ponderato pari a {ter}%.':
    'Target asset allocation across {count} instruments, with a weighted average TER of {ter}%.',
  'SEZIONE 5 — PIANO FIRE — SCENARI DI INDIPENDENZA FINANZIARIA':
    'SECTION 5 — FIRE PLAN — FINANCIAL INDEPENDENCE SCENARIOS',
  'Analisi basata sul patrimonio investito totale attuale di':
    'Analysis based on a current total invested balance of',
  "per l'intero periodo di accumulo, calcolata ad un tasso reale fisso.":
    'across the whole accumulation period, at a fixed real rate.',
  '✓ RAGGIUNTO (Anno {year})': '✓ REACHED (year {year})',
  'Futuro (Anno {year})': 'Future (year {year})',
  'Tasso annuo composto': 'Compound annual rate',
  'In attesa di storico': 'Waiting for history',
  "Metriche e indicatori calcolati in base allo storico degli snapshot caricati ed alle preferenze registrate nel sistema. Fornisce un'analisi sull'efficienza di accumulo e sul tasso di aderenza al benchmark finanziario.":
    'Metrics calculated from your saved snapshot history and the preferences stored in the app. It assesses how efficiently you accumulate and how closely you track the benchmark.',
  "Esprime l'efficienza nel convertire le entrate nette correnti in ricchezza accumulata o investita. Più questa metrica è elevata, minore è la dipendenza dal reddito da lavoro e più rapida è la transizione verso il Coast FIRE o il FIRE totale.":
    'How efficiently current net income turns into accumulated or invested wealth. The higher it is, the less you depend on employment income and the faster you reach Coast FIRE or full FIRE.',
  'Rappresenta la crescita geometrica annualizzata del patrimonio complessivo al netto dei flussi in ingresso. Valuta l\'effettivo "motore dell\'interesse composto" e l\'efficienza allocativa tra ETF e il fondo previdenziale {fund}.':
    'The annualised geometric growth of total net worth, excluding money paid in. It measures the real "compounding engine" and how efficiently you allocate between ETFs and the {fund} pension fund.',
  "Compara l'evoluzione storica del patrimonio netto contro una traiettoria teorica programmata con rendimento medio del 5.3% annuo reale. Mantenere uno scostamento positivo garantisce di raggiungere gli obiettivi con largo anticipo rispetto ai piani.":
    'Compares your net worth history against a planned path assuming a 5.3% average real annual return. Staying above it means reaching your goals well ahead of plan.',
  'Un indicatore cruciale sul lungo periodo. I costi del portafoglio PAC attuale si attestano su livelli di assoluta eccellenza (pari a circa il {ter}%), garantendo la minima dispersione dei rendimenti composti rispetto alla borsa mondiale.':
    'A crucial long-run indicator. Your portfolio costs are excellent (around {ter}%), which keeps compounding losses against the global market to a minimum.',
  'Ripartizione e versamenti effettuati per il fondo previdenziale':
    'Breakdown and contributions paid into the pension fund',
  'I contributi accumulati beneficiano della deducibilità fiscale.':
    'Accumulated contributions are tax deductible.',
  'I dati sono salvati in cloud su Supabase (EU-West, Londra). Puoi esportarli in formato JSON in qualsiasi momento.':
    'Your data is stored in the cloud on Supabase (EU-West, London). You can export it as JSON at any time.',
};

const MONTHS = {
  it: ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'],
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
};

const MONTHS_SHORT = {
  it: ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'],
  en: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
};

export function monthName(lang: Lang, i: number): string {
  return MONTHS[lang][i] ?? '';
}

export function monthShort(lang: Lang, i: number): string {
  return MONTHS_SHORT[lang][i] ?? '';
}

export function detectBrowserLang(): Lang {
  if (typeof navigator === 'undefined') return 'en';
  const candidates = [navigator.language, ...(navigator.languages || [])];
  return candidates.some(l => typeof l === 'string' && l.toLowerCase().startsWith('it')) ? 'it' : 'en';
}

export function isLang(v: any): v is Lang {
  return v === 'en' || v === 'it';
}

export function translate(lang: Lang, key: string, params?: Record<string, string | number>): string {
  let out = lang === 'it' ? key : (EN[key] ?? key);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      out = out.split(`{${k}}`).join(String(v));
    }
  }
  return out;
}

export function makeT(lang: Lang) {
  return (key: string, params?: Record<string, string | number>) => translate(lang, key, params);
}

export type TFunc = ReturnType<typeof makeT>;
