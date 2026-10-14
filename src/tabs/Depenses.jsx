import { useMemo, useState } from 'react';
import Icon from '../components/icons.jsx';
import { Empty, Field, Sheet } from '../components/ui.jsx';
import { aujourdhui, dateFr, euros, moisCle, uid } from '../lib/utils.js';

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const COURT = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'aoû', 'sep', 'oct', 'nov', 'déc'];
const nomMois = cle => { const [a, m] = cle.split('-'); return `${MOIS[+m - 1]} ${a}`; };

function derniersMois(n) {
  const d = new Date();
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const x = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push(`${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}

export default function Depenses({ db, maj, toast }) {
  const [edit, setEdit] = useState(null); // achat id | 'new'
  const [sel, setSel] = useState(null);
  const [budgetOuvert, setBudgetOuvert] = useState(false);
  const magById = Object.fromEntries(db.magasins.map(m => [m.id, m]));

  const stats = useMemo(() => {
    const parMois = {};
    db.achats.forEach(a => { const k = moisCle(a.date); parMois[k] = (parMois[k] || 0) + a.montant; });
    const mois = derniersMois(12);
    const ceMois = mois[11];
    const avant = mois[10];
    const achatsMois = db.achats.filter(a => moisCle(a.date) === ceMois);
    const annee = String(new Date().getFullYear());
    const parMag = {};
    db.achats.filter(a => a.date.startsWith(annee)).forEach(a => { parMag[a.magasinId] = (parMag[a.magasinId] || 0) + a.montant; });
    const totalAnnee = Object.values(parMag).reduce((s, v) => s + v, 0);
    return {
      mois, parMois, ceMois, avant,
      totalMois: parMois[ceMois] || 0,
      totalAvant: parMois[avant] || 0,
      nbMois: achatsMois.length,
      moyenne: db.achats.length ? db.achats.reduce((s, a) => s + a.montant, 0) / db.achats.length : 0,
      parMag: Object.entries(parMag).sort((a, b) => b[1] - a[1]),
      totalAnnee, annee,
    };
  }, [db.achats]);

  const max = Math.max(1, ...stats.mois.map(m => stats.parMois[m] || 0));
  const budget = db.reglages.budget || 0;
  const pctBudget = budget ? Math.min(100, (stats.totalMois / budget) * 100) : 0;
  const diff = stats.totalAvant ? ((stats.totalMois - stats.totalAvant) / stats.totalAvant) * 100 : null;

  const historique = useMemo(() => {
    const tri = [...db.achats].sort((a, b) => b.date.localeCompare(a.date));
    const g = [];
    tri.forEach(a => {
      const k = moisCle(a.date);
      let last = g[g.length - 1];
      if (!last || last.k !== k) { last = { k, items: [], total: 0 }; g.push(last); }
      last.items.push(a); last.total += a.montant;
    });
    return g;
  }, [db.achats]);

  const selMois = sel || stats.ceMois;

  return (
    <div className="page">
      <div className="card hero hero-yellow">
        <div className="hero-top">
          <div>
            <div className="hero-kicker">Dépenses de {nomMois(stats.ceMois)}</div>
            <div className="hero-big">{euros(stats.totalMois)}</div>
            <div className="hero-sub">
              {stats.nbMois} passage{stats.nbMois > 1 ? 's' : ''} en caisse
              {diff !== null && <> · {diff > 0 ? '↗' : '↘'} {Math.abs(diff).toFixed(0)} % vs {nomMois(stats.avant)}</>}
            </div>
          </div>
          <div className="hero-emoji">💶</div>
        </div>
        {budget > 0 ? (
          <button className="budget" onClick={() => setBudgetOuvert(true)}>
            <div className="row-between small"><span>Budget du mois</span><b>{euros(Math.max(0, budget - stats.totalMois))} restants</b></div>
            <div className="prog"><div className={'prog-bar' + (stats.totalMois > budget ? ' over' : '')} style={{ width: pctBudget + '%' }} /></div>
            <div className="muted small">{euros(stats.totalMois)} sur {euros(budget)}</div>
          </button>
        ) : (
          <button className="btn btn-white btn-full" onClick={() => setBudgetOuvert(true)}>🎯 Fixer un budget mensuel</button>
        )}
        <button className="btn btn-main btn-full" onClick={() => setEdit('new')}><Icon name="plus" /> Noter un passage en caisse</button>
      </div>

      {db.achats.length === 0 ? (
        <Empty emoji="🧾" titre="Pas encore de dépenses" texte="Après chaque passage en caisse, note le montant de ton ticket : tu verras ici l'évolution mois par mois." />
      ) : (
        <>
          <div className="grid2">
            <div className="card stat"><div className="stat-label">Panier moyen</div><div className="stat-val">{euros(stats.moyenne)}</div></div>
            <div className="card stat"><div className="stat-label">Total {stats.annee}</div><div className="stat-val">{euros(stats.totalAnnee)}</div></div>
          </div>

          <div className="card">
            <div className="row-between">
              <div className="card-title">📊 12 derniers mois</div>
              <div className="chart-sel"><span className="muted small">{nomMois(selMois)}</span> <b>{euros(stats.parMois[selMois] || 0)}</b></div>
            </div>
            <div className="chart" role="img" aria-label="Dépenses par mois sur 12 mois">
              {stats.mois.map(m => {
                const v = stats.parMois[m] || 0;
                return (
                  <button key={m} className={'bar-col' + (m === selMois ? ' on' : '')} onClick={() => setSel(m)} title={`${nomMois(m)} : ${euros(v)}`}>
                    <span className="bar-track">
                      <span className="bar" style={{ height: v ? Math.max(4, (v / max) * 100) + '%' : 0 }} />
                    </span>
                    <span className="bar-lbl">{COURT[+m.slice(5) - 1]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {stats.parMag.length > 0 && (
            <div className="card">
              <div className="card-title">🏪 Par magasin en {stats.annee}</div>
              <div className="stack-s">
                {stats.parMag.map(([id, v]) => {
                  const m = magById[id];
                  return (
                    <div key={id} className="hbar">
                      <div className="row-between small"><span>{m ? `${m.emoji} ${m.nom}` : 'Magasin supprimé'}</span><b>{euros(v)}</b></div>
                      <div className="hbar-track"><div className="hbar-fill" style={{ width: (v / stats.parMag[0][1]) * 100 + '%' }} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="card-title section-title">🧾 Historique</div>
          {historique.map(g => (
            <div key={g.k} className="rayon-bloc">
              <div className="rayon-head"><span className="rayon-nom">{nomMois(g.k)}</span><b className="small">{euros(g.total)}</b></div>
              <div className="card list-card">
                {g.items.map(a => {
                  const m = magById[a.magasinId];
                  return (
                    <button key={a.id} className="achat-row" onClick={() => setEdit(a.id)}>
                      <span className="cat-pastille" style={{ background: m?.couleur || '#eee' }}>{m?.emoji || '🛒'}</span>
                      <span className="grow">
                        <b>{m?.nom || 'Magasin supprimé'}</b>
                        <span className="muted small block">{dateFr(a.date, { weekday: 'short', day: 'numeric', month: 'short' })}{a.nb ? ` · ${a.nb} articles` : ''}{a.note ? ` · ${a.note}` : ''}</span>
                      </span>
                      <b className="achat-montant">{euros(a.montant)}</b>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}

      {edit && <EditAchat id={edit} db={db} maj={maj} toast={toast} onClose={() => setEdit(null)} />}
      <Budget open={budgetOuvert} onClose={() => setBudgetOuvert(false)} db={db} maj={maj} />
    </div>
  );
}

function EditAchat({ id, db, maj, toast, onClose }) {
  const nouveau = id === 'new';
  const a0 = nouveau ? { montant: '', date: aujourdhui(), magasinId: db.magasinActif, note: '', nb: 0 } : db.achats.find(a => a.id === id);
  const [f, setF] = useState({ ...a0, montant: a0 ? String(a0.montant).replace('.', ',') : '' });
  if (!a0) return null;
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const val = parseFloat(String(f.montant).replace(',', '.'));
  const ok = Number.isFinite(val) && val > 0;
  const enregistrer = () => {
    if (!ok) return;
    maj(d => {
      const data = { date: f.date, magasinId: f.magasinId, note: f.note.trim(), montant: Math.round(val * 100) / 100 };
      if (nouveau) d.achats.push({ id: uid(), nb: 0, ...data });
      else Object.assign(d.achats.find(a => a.id === id), data);
    });
    toast('Dépense enregistrée 💸');
    onClose();
  };
  const supprimer = () => {
    if (!confirm('Supprimer ce passage en caisse ?')) return;
    maj(d => { d.achats = d.achats.filter(a => a.id !== id); });
    onClose();
  };
  return (
    <Sheet open onClose={onClose} title={nouveau ? '🧾 Passage en caisse' : '✏️ Modifier'} footer={<button className="btn btn-big btn-pink" disabled={!ok} onClick={enregistrer}>Enregistrer</button>}>
      <Field label="Montant du ticket">
        <div className="montant-wrap">
          <input className="input montant" inputMode="decimal" placeholder="0,00" value={f.montant} onChange={e => set('montant', e.target.value)} autoFocus={nouveau} />
          <span>€</span>
        </div>
      </Field>
      <div className="grid2">
        <Field label="Magasin">
          <select className="input" value={f.magasinId} onChange={e => set('magasinId', e.target.value)}>
            {db.magasins.map(m => <option key={m.id} value={m.id}>{m.emoji} {m.nom}</option>)}
          </select>
        </Field>
        <Field label="Date"><input className="input" type="date" value={f.date} onChange={e => set('date', e.target.value)} /></Field>
      </div>
      <Field label="Note"><input className="input" value={f.note} onChange={e => set('note', e.target.value)} placeholder="Facultatif" /></Field>
      {!nouveau && <button className="btn btn-ghost danger" onClick={supprimer}><Icon name="trash" size={18} /> Supprimer</button>}
    </Sheet>
  );
}

function Budget({ open, onClose, db, maj }) {
  const [v, setV] = useState(db.reglages.budget ? String(db.reglages.budget) : '');
  const enregistrer = () => {
    const n = parseFloat(v.replace(',', '.'));
    maj(d => { d.reglages.budget = Number.isFinite(n) && n > 0 ? n : 0; });
    onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} title="🎯 Budget mensuel" footer={<button className="btn btn-big btn-main" onClick={enregistrer}>Enregistrer</button>}>
      <Field label="Montant par mois" hint="Laisse vide pour ne pas suivre de budget">
        <div className="montant-wrap">
          <input className="input montant" inputMode="decimal" placeholder="600" value={v} onChange={e => setV(e.target.value)} />
          <span>€</span>
        </div>
      </Field>
    </Sheet>
  );
}
