import { X } from 'lucide-react'

interface Props {
  onClose: () => void
}

export default function PrivacyPolicy({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Privacy Policy</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
        </div>
        <div className="overflow-y-auto px-6 py-5 text-sm text-slate-700 space-y-5">

          <p className="text-xs text-slate-500">Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <section>
            <h3 className="font-semibold text-slate-900 mb-2">1. Chi siamo</h3>
            <p>Finance Personal Dashboard è un'applicazione personale per il tracciamento del patrimonio e la pianificazione finanziaria. Il servizio è gestito privatamente e non ha scopo commerciale.</p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900 mb-2">2. Dati raccolti</h3>
            <p className="mb-2">Al momento della registrazione raccogliamo:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Indirizzo email (per autenticazione)</li>
              <li>Password (cifrata con bcrypt — non leggibile da nessuno)</li>
            </ul>
            <p className="mt-2 mb-2">Durante l'utilizzo dell'app, tu inserisci volontariamente:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li>Dati finanziari personali (patrimonio, stipendio, investimenti, spese)</li>
              <li>Configurazioni del piano finanziario (PAC, FIRE, waterfall)</li>
              <li>Storico snapshot e transazioni</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900 mb-2">3. Come vengono usati i dati</h3>
            <p>I dati vengono usati <strong>esclusivamente</strong> per fornire le funzionalità dell'applicazione. Non vengono mai condivisi con terze parti, venduti o usati per scopi pubblicitari.</p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900 mb-2">4. Dove sono memorizzati</h3>
            <p>I dati sono memorizzati su <strong>Supabase</strong> (PostgreSQL), con server in <strong>EU-West (Londra, UK)</strong>. Supabase è conforme alle normative GDPR. I dati sono protetti da Row Level Security: nessun utente può accedere ai dati di un altro utente.</p>
          </section>

          <section className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <h3 className="font-semibold text-amber-900 mb-2">5. Accesso da parte dell'amministratore</h3>
            <p className="text-amber-800">In quanto gestore dell'infrastruttura tecnica, l'amministratore dell'applicazione ha accesso tecnico al database e quindi ai dati finanziari inseriti dagli utenti. Questo accesso è di natura tecnica (necessario per la manutenzione) e non commerciale. L'amministratore si impegna a non consultare, utilizzare o condividere i dati degli utenti per nessun altro scopo.</p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900 mb-2">6. I tuoi diritti (GDPR)</h3>
            <p className="mb-2">Hai diritto a:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li><strong>Accesso</strong> — vedere tutti i tuoi dati (sezione Impostazioni → Esporta backup)</li>
              <li><strong>Portabilità</strong> — esportare i tuoi dati in formato JSON</li>
              <li><strong>Cancellazione</strong> — eliminare il tuo account e tutti i dati associati (sezione Impostazioni → Elimina account)</li>
              <li><strong>Rettifica</strong> — modificare i tuoi dati in qualsiasi momento dall'app</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900 mb-2">7. Cookie e tracciamento</h3>
            <p>L'app non usa cookie di tracciamento, pixel pubblicitari o analytics di terze parti. Viene usato solo un cookie di sessione tecnico necessario per il mantenimento del login.</p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900 mb-2">8. Sicurezza</h3>
            <p>Le password sono cifrate con bcrypt. La comunicazione avviene via HTTPS. L'accesso ai dati è protetto da autenticazione obbligatoria e Row Level Security.</p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900 mb-2">9. Minori</h3>
            <p>Il servizio non è destinato a persone di età inferiore ai 18 anni.</p>
          </section>

          <section>
            <h3 className="font-semibold text-slate-900 mb-2">10. Contatti</h3>
            <p>Per qualsiasi richiesta relativa alla privacy o all'esercizio dei tuoi diritti, contatta l'amministratore tramite GitHub: <a href="https://github.com/f-estero/Personal-Finance-Dashboard" className="text-emerald-600 hover:underline" target="_blank" rel="noopener noreferrer">f-estero/Personal-Finance-Dashboard</a></p>
          </section>

        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700">
            Ho letto e capito
          </button>
        </div>
      </div>
    </div>
  )
}
