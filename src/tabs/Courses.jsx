import { useEffect, useMemo, useState } from 'react';
import Icon from '../components/icons.jsx';
import ImportListe from '../components/ImportListe.jsx';
import EnvoyerListe from '../components/EnvoyerListe.jsx';
import { AjoutArticle, Empty, Field, QteUnite, Sheet, Toggle, EmojiPicker } from '../components/ui.jsx';
import { ajouterALaListe } from '../lib/store.js';
import { aujourdhui, categorie, euros, findProduit, qteNum, rayonDe, uid } from '../lib/utils.js';

function grouper(liste, mag, prodById) {
  const parRayon = new Map();
  const sansRayon = [];
  for (const it of liste) {
    const p = prodById[it.produitId];
    if (!p) continue;
    const r = rayonDe(mag, p);
    if (r) {
      if (!parRayon.has(r)) parRayon.set(r, []);
      parRayon.get(r).push(it);
    } else sansRayon.push(it);
  }
  const tri = arr => arr.sort((a, b) => prodById[a.produitId].nom.localeCompare(prodById[b.produitId].nom, 'fr'));
  const g = (mag?.rayons || [])
    .map((r, i) => ({ rayon: r, num: i + 1, items: tri(parRayon.get(r.id) || []) }))
    .filter(x => x.items.length);
  if (sansRayon.length) g.push({ rayon: { id: '_', nom: 'À classer', emoji: '❔', repere: 'Touche 📍 pour ranger' }, num: '?', items: tri(sansRayon) });
  return g;
}

export function MagasinChips({ db, maj, goto }) {
  const mags = [...db.magasins].sort((a, b) => (b.favori ? 1 : 0) - (a.favori ? 1 : 0));
  return (
    <div className="mag-chips">
      {mags.map(m => (
        <button
          key={m.id}
          className={'mag-chip' + (m.id === db.magasinActif ? ' on' : '')}
          style={{ '--c': m.couleur }}
          onClick={() => maj(d => { d.magasinActif = m.id; })}
        >
          <span className="mag-chip-emoji">{m.emoji}</span>
          <span>{m.nom}</span>
          {m.favori && <span className="mag-star">★</span>}
        </button>
      ))}
      <button className="mag-chip mag-chip-add" onClick={() => goto('magasins')}>
        <Icon name="plus" size={16} /> Magasin
      </button>
    </div>
  );
}

export default function Courses({ db, maj, toast, goto }) {
  const [mode, setMode] = useState('prep');
  const [feuille, setFeuille] = useState(null);
  const [importTxt, setImportTxt] = useState({ t: '', titre: '' }); // 'coller' | 'listes' | 'enreg' | 'caisse' | {rayon: item}
  const mag = db.magasins.find(m => m.id === db.magasinActif) || db.magasins[0];
  const prodById = useMemo(() => Object.fromEntries(db.produits.map(p => [p.id, p])), [db.produits]);

  const aFaire = db.liste.filter(i => !i.coche);
  const faits = db.liste.filter(i => i.coche);
  const groupes = useMemo(() => grouper(mode === 'magasin' ? aFaire : db.liste, mag, prodById), [db.liste, mag, prodById, mode]);
  const dansListe = new Set(aFaire.map(i => i.produitId));
  const aRacheter = db.produits.filter(p => p.suivi && p.stock <= p.min && !dansListe.has(p.id));

  const ajouter = (nom, qte) => {
    const p = findProduit(db.produits, nom);
    if (p && p.suivi && p.stock > 0) toast(`🏠 Il t'en reste ${p.stock}${p.unite ? ' ' + p.unite : ''} à la maison`);
    let pid;
    maj(d => { pid = ajouterALaListe(d, nom, qte).id; });
    // Nouvel article : on demande tout de suite dans quel rayon le trouver
    if (!p && mag?.rayons.length) setFeuille({ rayon: { produitId: pid }, nouveau: true });
  };
  const setItem = (id, fn) => maj(d => { const it = d.liste.find(x => x.id === id); if (it) fn(it, d); });
  const suppr = id => maj(d => { d.liste = d.liste.filter(x => x.id !== id); });

  const total = db.liste.length;
  const pct = total ? Math.round((faits.length / total) * 100) : 0;

  return (
    <div className="page">
      <MagasinChips db={db} maj={maj} goto={goto} />

      {mode === 'prep' ? (
        <>
          <div className="card hero hero-mint">
            <div className="hero-top">
              <div>
                <div className="hero-kicker">Ma liste du jour</div>
                <div className="hero-big">{aFaire.length} article{aFaire.length > 1 ? 's' : ''}</div>
                <div className="hero-sub">Triés dans l'ordre des rayons de <b>{mag?.nom}</b></div>
              </div>
              <div className="hero-emoji">🧺</div>
            </div>
            <AjoutArticle produits={db.produits} onAjout={ajouter} exclure={[...dansListe]} />
            <div className="quick-row">
              <button className="btn btn-soft" onClick={() => setFeuille('listes')}><Icon name="list" size={18} /> Mes listes</button>
              <button className="btn btn-soft" onClick={() => setFeuille('coller')}><Icon name="paste" size={18} /> Liste reçue 💬</button>
            </div>
          </div>

          {aRacheter.length > 0 && (
            <div className="card card-peach">
              <div className="row-between">
                <div className="card-title">🏠 À racheter d'après ton stock</div>
                <button className="btn btn-small btn-main" onClick={() => maj(d => { aRacheter.forEach(p => ajouterALaListe(d, p.nom, String(Math.max(1, (p.cible || p.min + 1) - p.stock)))); })}>
                  Tout ajouter
                </button>
              </div>
              <div className="chips-wrap">
                {aRacheter.map(p => (
                  <button key={p.id} className="chip chip-white" onClick={() => ajouter(p.nom, '')}>
                    {p.emoji || categorie(p.cat).emoji} {p.nom} <span className="chip-badge">{p.stock}</span> <Icon name="plus" size={14} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {db.liste.length === 0 ? (
            <Empty emoji="🛒" titre="Ta liste est vide" texte="Ajoute des articles, reprends une liste enregistrée ou colle une liste que tu as déjà." />
          ) : (
            <>
              {groupes.map(g => (
                <div key={g.rayon.id} className="rayon-bloc">
                  <RayonHead g={g} />
                  <div className="card list-card">
                    {g.items.map(it => {
                      const p = prodById[it.produitId];
                      return (
                        <div key={it.id} className={'item' + (it.coche ? ' item-done' : '')}>
                          <span className="item-emoji">{p.emoji || categorie(p.cat).emoji}</span>
                          <span className="item-nom">{p.nom}</span>
                          <QteUnite mini value={it.qte} placeholder="1" onChange={v => setItem(it.id, x => { x.qte = v; })} />
                          <button className="icon-btn" onClick={() => setFeuille({ rayon: it })} aria-label="Changer de rayon"><Icon name="pin" size={18} /></button>
                          <button className="icon-btn danger" onClick={() => suppr(it.id)} aria-label="Retirer"><Icon name="trash" size={18} /></button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <button className="btn btn-wa-soft btn-full" onClick={() => setFeuille('envoyer')}>💬 Envoyer la liste (WhatsApp)</button>
              <div className="actions-bas">
                <button className="btn btn-ghost" onClick={() => setFeuille('enreg')}><Icon name="save" size={18} /> Enregistrer comme liste</button>
                <button className="btn btn-ghost danger" onClick={() => confirm('Vider toute la liste du jour ?') && maj(d => { d.liste = []; })}>
                  <Icon name="trash" size={18} /> Vider
                </button>
              </div>
              <button className="btn btn-big btn-main sticky-cta" onClick={() => { setMode('magasin'); window.scrollTo(0, 0); }}>
                <Icon name="cart" /> C'est parti, je suis au magasin !
              </button>
            </>
          )}
        </>
      ) : (
        <>
          <div className="card hero hero-lilac sticky-prog">
            <div className="row-between">
              <button className="btn btn-small btn-white" onClick={() => setMode('prep')}><Icon name="left" size={16} /> Préparer</button>
              <div className="prog-txt"><b>{faits.length}</b> / {total} dans le caddie</div>
            </div>
            <div className="prog"><div className="prog-bar" style={{ width: pct + '%' }} /></div>
          </div>

          {aFaire.length === 0 && total > 0 && (
            <div className="card card-yellow bravo">
              <div className="bravo-emoji">🎉</div>
              <div className="card-title">Bravo, tout est dans le caddie !</div>
              <p>Direction la caisse.</p>
            </div>
          )}
          {total === 0 && <Empty emoji="🛒" titre="Rien à acheter" texte="Retourne en préparation pour remplir ta liste." />}

          {groupes.map((g, gi) => (
            <div key={g.rayon.id} className={'rayon-bloc' + (gi === 0 ? ' rayon-ici' : '')}>
              <RayonHead g={g} ici={gi === 0} />
              <div className="card list-card">
                {g.items.map(it => {
                  const p = prodById[it.produitId];
                  return (
                    <div key={it.id} className="item item-shop">
                      <button className="item-tap" onClick={() => { navigator.vibrate?.(10); setItem(it.id, x => { x.coche = true; }); }}>
                        <span className="check" />
                        <span className="item-emoji">{p.emoji || categorie(p.cat).emoji}</span>
                        <span className="item-nom">{p.nom}</span>
                        {it.qte && <span className="qte-badge">{it.qte}{p.unite && /^\d/.test(it.qte) && !/[a-z]/i.test(it.qte) ? ' ' + p.unite : ''}</span>}
                      </button>
                      <button className="icon-btn" onClick={() => setFeuille({ rayon: it })} aria-label="Changer de rayon"><Icon name="pin" size={18} /></button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {faits.length > 0 && (
            <div className="rayon-bloc">
              <div className="rayon-head caddie-head"><span className="rayon-num">✓</span><span className="rayon-nom">Dans le caddie</span></div>
              <div className="card list-card">
                {faits.map(it => {
                  const p = prodById[it.produitId];
                  if (!p) return null;
                  return (
                    <button key={it.id} className="item item-done item-tap" onClick={() => setItem(it.id, x => { x.coche = false; })}>
                      <span className="check on"><Icon name="check" size={14} strokeWidth={3} /></span>
                      <span className="item-emoji">{p.emoji || categorie(p.cat).emoji}</span>
                      <span className="item-nom">{p.nom}</span>
                      {it.qte && <span className="qte-badge">{it.qte}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {total > 0 && (
            <button className="btn btn-big btn-pink sticky-cta" onClick={() => setFeuille('caisse')}>
              💳 Passer en caisse
            </button>
          )}
        </>
      )}

      {feuille?.rayon && (
        <ChangerRayon item={feuille.rayon} nouveauProduit={!!feuille.nouveau} mag={mag} prod={prodById[feuille.rayon.produitId]} maj={maj} toast={toast} onClose={() => setFeuille(null)} />
      )}
      <ImportListe
        open={feuille === 'coller'} onClose={() => { setFeuille(null); setImportTxt({ t: '', titre: '' }); }} db={db} maj={maj} toast={toast}
        texteInitial={importTxt.t} titre={importTxt.titre || '💬 Coller / recevoir une liste'}
        choixDestination={!importTxt.titre}
      />
      <EnvoyerListe
        source={feuille === 'envoyer' ? { nom: 'Courses', emoji: '🧺', items: aFaire.filter(i => prodById[i.produitId]).map(i => ({ nom: prodById[i.produitId].nom, qte: i.qte })) } : null}
        onClose={() => setFeuille(null)} maj={maj} toast={toast}
      />
      <ChoisirListe open={feuille === 'listes'} onClose={() => setFeuille(null)} db={db} goto={goto} onChoix={l => { setImportTxt({ t: l.items.map(i => (i.qte ? `${i.qte} ${i.nom}` : i.nom)).join('\n'), titre: `${l.emoji} ${l.nom}` }); setFeuille('coller'); }} />
      <EnregistrerListe open={feuille === 'enreg'} onClose={() => setFeuille(null)} db={db} maj={maj} toast={toast} prodById={prodById} />
      <Caisse
        open={feuille === 'caisse'} onClose={() => setFeuille(null)} db={db} maj={maj} toast={toast} mag={mag}
        onFini={() => { setFeuille(null); setMode('prep'); }}
      />
    </div>
  );
}

function RayonHead({ g, ici }) {
  return (
    <div className="rayon-head">
      <span className="rayon-num">{g.num}</span>
      <span className="rayon-emoji">{g.rayon.emoji}</span>
      <span className="rayon-nom">{g.rayon.nom}</span>
      {g.rayon.repere && <span className="rayon-repere">{g.rayon.repere}</span>}
      {ici && <span className="ici">👉 Tu es ici</span>}
    </div>
  );
}

function ChangerRayon({ item, nouveauProduit, mag, prod, maj, toast, onClose }) {
  const [toute, setToute] = useState(false);
  const [nouveau, setNouveau] = useState('');
  if (!prod || !mag) return null;
  const actuel = rayonDe(mag, prod);
  const cat = categorie(prod.cat);
  const choisir = rayonId => {
    maj(d => {
      const m = d.magasins.find(x => x.id === mag.id);
      if (toute) {
        m.rayons.forEach(r => { r.cats = r.cats.filter(c => c !== prod.cat); });
        m.rayons.find(r => r.id === rayonId).cats.push(prod.cat);
        delete m.overrides[prod.id];
      } else {
        m.overrides[prod.id] = rayonId;
      }
    });
    toast(toute ? `${cat.nom} déplacé 📍` : `${prod.nom} rangé 📍`);
    onClose();
  };
  const creer = () => {
    if (!nouveau.trim()) return;
    const id = uid();
    maj(d => {
      const m = d.magasins.find(x => x.id === mag.id);
      m.rayons.push({ id, nom: nouveau.trim(), emoji: '📍', repere: '', cats: [] });
    });
    choisir(id);
  };
  return (
    <Sheet open onClose={onClose} title={nouveauProduit ? `✨ Où trouver « ${prod.nom} » ?` : `📍 Où est « ${prod.nom} » ?`}>
      <p className="muted small">Chez <b>{mag.nom}</b>. Le choix est mémorisé pour tes prochaines courses.{nouveauProduit && actuel ? ' Suggestion cochée en vert.' : ''}</p>
      {!nouveauProduit && (
        <div className="toggle-box">
          <Toggle checked={toute} onChange={setToute} label={<>Déplacer toute la catégorie <b>{cat.emoji} {cat.nom}</b></>} />
        </div>
      )}
      <div className="rayon-choix">
        {mag.rayons.map((r, i) => (
          <button key={r.id} className={'rayon-opt' + (r.id === actuel ? ' on' : '')} onClick={() => choisir(r.id)}>
            <span className="rayon-num">{i + 1}</span>
            <span>{r.emoji}</span>
            <span className="grow">{r.nom}</span>
            {r.repere && <span className="muted small">{r.repere}</span>}
            {r.id === actuel && <Icon name="check" size={18} />}
          </button>
        ))}
      </div>
      <div className="ajout-row" style={{ marginTop: 12 }}>
        <input className="input grow" placeholder="Créer un rayon (ex : Bio & vrac)" value={nouveau} onChange={e => setNouveau(e.target.value)} onKeyDown={e => e.key === 'Enter' && creer()} />
        <button className="btn btn-main" onClick={creer}>Créer</button>
      </div>
      {nouveauProduit && <button className="btn btn-ghost btn-full" style={{ marginTop: 10 }} onClick={onClose}>Je ne sais pas encore</button>}
    </Sheet>
  );
}

function ChoisirListe({ open, onClose, db, goto, onChoix }) {
  return (
    <Sheet open={open} onClose={onClose} title="📋 Ajouter une de mes listes">
      {db.listes.length === 0 ? (
        <Empty emoji="📋" titre="Aucune liste enregistrée">
          <button className="btn btn-main" onClick={() => { onClose(); goto('listes'); }}>Créer une liste</button>
        </Empty>
      ) : (
        <div className="stack">
          {db.listes.map(l => (
            <button
              key={l.id} className="liste-opt"
              onClick={() => onChoix(l)}
            >
              <span className="liste-emoji">{l.emoji}</span>
              <span className="grow">
                <b>{l.nom}</b>
                <span className="muted small block">{l.items.length} articles · {l.items.slice(0, 4).map(i => i.nom).join(', ')}{l.items.length > 4 ? '…' : ''}</span>
              </span>
              <Icon name="plus" />
            </button>
          ))}
        </div>
      )}
    </Sheet>
  );
}

function EnregistrerListe({ open, onClose, db, maj, toast, prodById }) {
  const [nom, setNom] = useState('');
  const [emoji, setEmoji] = useState('🧺');
  const valider = () => {
    maj(d => {
      d.listes.push({
        id: uid(), nom: nom.trim() || 'Ma liste', emoji,
        items: d.liste.filter(i => prodById[i.produitId]).map(i => ({ nom: prodById[i.produitId].nom, qte: i.qte })),
      });
    });
    toast('Liste enregistrée 💾');
    setNom('');
    onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} title="💾 Enregistrer comme liste" footer={<button className="btn btn-big btn-main" onClick={valider}>Enregistrer</button>}>
      <div className="row gap">
        <EmojiPicker value={emoji} onChange={setEmoji} />
        <input className="input grow" placeholder="Ex : Courses du week-end" value={nom} onChange={e => setNom(e.target.value)} autoFocus />
      </div>
      <p className="muted small">{db.liste.length} articles seront enregistrés.</p>
    </Sheet>
  );
}

function Caisse({ open, onClose, db, maj, toast, mag, onFini }) {
  const [montant, setMontant] = useState('');
  const [date, setDate] = useState(aujourdhui());
  const [magId, setMagId] = useState(mag?.id);
  const [note, setNote] = useState('');
  const [majStock, setMajStock] = useState(db.reglages.majStock);
  const [garder, setGarder] = useState(true);
  useEffect(() => { if (open) { setMagId(mag?.id); setDate(aujourdhui()); setMajStock(db.reglages.majStock); } }, [open]); // eslint-disable-line
  const faits = db.liste.filter(i => i.coche);
  const val = parseFloat(montant.replace(',', '.'));
  const ok = Number.isFinite(val) && val > 0;
  const valider = () => {
    if (!ok) return;
    maj(d => {
      d.achats.push({ id: uid(), date, magasinId: magId || mag?.id, montant: Math.round(val * 100) / 100, nb: faits.length, note: note.trim() });
      if (majStock) {
        d.liste.filter(i => i.coche).forEach(i => {
          const p = d.produits.find(x => x.id === i.produitId);
          if (p && p.suivi) p.stock = Math.round((p.stock + qteNum(i.qte)) * 100) / 100;
        });
      }
      d.reglages.majStock = majStock;
      d.liste = garder ? d.liste.filter(i => !i.coche) : [];
    });
    toast(`Passage en caisse noté : ${euros(val)} 💸`);
    setMontant(''); setNote('');
    onFini();
  };
  return (
    <Sheet open={open} onClose={onClose} title="💳 Passage en caisse" footer={<button className="btn btn-big btn-pink" disabled={!ok} onClick={valider}>Valider {ok ? euros(val) : ''}</button>}>
      <Field label="Montant du ticket">
        <div className="montant-wrap">
          <input className="input montant" inputMode="decimal" placeholder="0,00" value={montant} onChange={e => setMontant(e.target.value)} autoFocus />
          <span>€</span>
        </div>
      </Field>
      <div className="grid2">
        <Field label="Magasin">
          <select className="input" value={magId} onChange={e => setMagId(e.target.value)}>
            {db.magasins.map(m => <option key={m.id} value={m.id}>{m.emoji} {m.nom}</option>)}
          </select>
        </Field>
        <Field label="Date"><input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} /></Field>
      </div>
      <Field label="Note (facultatif)"><input className="input" placeholder="Ex : courses + anniversaire" value={note} onChange={e => setNote(e.target.value)} /></Field>
      <div className="toggle-box stack">
        <Toggle checked={majStock} onChange={setMajStock} label={`Ajouter les ${faits.length} article${faits.length > 1 ? 's' : ''} cochés à mon stock maison`} />
        <Toggle checked={garder} onChange={setGarder} label="Garder les articles non trouvés dans ma liste" />
      </div>
    </Sheet>
  );
}
