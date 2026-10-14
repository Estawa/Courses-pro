import { useMemo, useState } from 'react';
import Icon from '../components/icons.jsx';
import { EmojiPicker, Empty, Field, Segmented, Sheet, SortableList, Toggle } from '../components/ui.jsx';
import { CATEGORIES, PASTELS, rayonsType } from '../data/defaults.js';
import { categorie, norm, rayonDe, uid } from '../lib/utils.js';
import { produitPourNom } from '../lib/store.js';

export default function Magasins({ db, maj, toast }) {
  const [ouvert, setOuvert] = useState(null);
  const [creation, setCreation] = useState(false);
  const mag = db.magasins.find(m => m.id === ouvert);

  if (mag) return <DetailMagasin mag={mag} db={db} maj={maj} toast={toast} retour={() => setOuvert(null)} />;

  const mags = [...db.magasins].sort((a, b) => (b.favori ? 1 : 0) - (a.favori ? 1 : 0));
  return (
    <div className="page">
      <div className="card hero hero-sky">
        <div className="hero-top">
          <div>
            <div className="hero-kicker">Mes magasins</div>
            <div className="hero-big">{db.magasins.length} magasin{db.magasins.length > 1 ? 's' : ''}</div>
            <div className="hero-sub">Modélise les rayons dans l'ordre où tu les parcours : ta liste suivra ce chemin.</div>
          </div>
          <div className="hero-emoji">🏪</div>
        </div>
        <button className="btn btn-main btn-full" onClick={() => setCreation(true)}><Icon name="plus" /> Ajouter un magasin</button>
      </div>

      <div className="stack">
        {mags.map(m => {
          const nb = db.achats.filter(a => a.magasinId === m.id).length;
          return (
            <div key={m.id} className="mag-card" style={{ '--c': m.couleur }}>
              <button className="mag-card-main" onClick={() => setOuvert(m.id)}>
                <span className="mag-card-emoji">{m.emoji}</span>
                <span className="grow">
                  <b className="mag-card-nom">{m.nom}</b>
                  <span className="muted small block">{m.rayons.length} rayons · {nb} passage{nb > 1 ? 's' : ''} en caisse</span>
                  <span className="mini-parcours">{m.rayons.slice(0, 9).map(r => r.emoji).join(' → ')}{m.rayons.length > 9 ? ' …' : ''}</span>
                </span>
                <Icon name="right" />
              </button>
              <button className={'star-btn' + (m.favori ? ' on' : '')} onClick={() => maj(d => { const x = d.magasins.find(y => y.id === m.id); x.favori = !x.favori; })} aria-label="Favori">
                <Icon name="star" fill={m.favori ? 'currentColor' : 'none'} />
              </button>
            </div>
          );
        })}
      </div>

      <NouveauMagasin
        open={creation} onClose={() => setCreation(false)} db={db}
        onCree={m => { maj(d => { d.magasins.push(m); d.magasinActif = m.id; }); toast('Magasin créé 🎉'); setCreation(false); setOuvert(m.id); }}
      />
    </div>
  );
}

function NouveauMagasin({ open, onClose, db, onCree }) {
  const [nom, setNom] = useState('');
  const [emoji, setEmoji] = useState('🏪');
  const [couleur, setCouleur] = useState(PASTELS[5]);
  const [base, setBase] = useState('type');
  const creer = () => {
    if (!nom.trim()) return;
    let rayons = [];
    let overrides = {};
    if (base === 'type') rayons = rayonsType(uid);
    else if (base !== 'vide') {
      const src = db.magasins.find(m => m.id === base);
      const map = {};
      rayons = src.rayons.map(r => { const id = uid(); map[r.id] = id; return { ...r, id, cats: [...r.cats] }; });
      overrides = Object.fromEntries(Object.entries(src.overrides || {}).map(([p, r]) => [p, map[r]]).filter(([, r]) => r));
    }
    onCree({ id: uid(), nom: nom.trim(), emoji, couleur, favori: true, rayons, overrides });
    setNom('');
  };
  return (
    <Sheet open={open} onClose={onClose} title="🏪 Nouveau magasin" footer={<button className="btn btn-big btn-main" disabled={!nom.trim()} onClick={creer}>Créer le magasin</button>}>
      <div className="row gap">
        <EmojiPicker value={emoji} onChange={setEmoji} />
        <input className="input grow" placeholder="Ex : Leclerc Mennecy" value={nom} onChange={e => setNom(e.target.value)} />
      </div>
      <Field label="Couleur">
        <div className="couleurs">
          {PASTELS.map(c => <button key={c} className={'pastille' + (c === couleur ? ' on' : '')} style={{ background: c }} onClick={() => setCouleur(c)} aria-label={c} />)}
        </div>
      </Field>
      <Field label="Point de départ des rayons">
        <select className="input" value={base} onChange={e => setBase(e.target.value)}>
          <option value="type">Disposition type d'un supermarché (20 rayons)</option>
          {db.magasins.map(m => <option key={m.id} value={m.id}>Copier la disposition de « {m.nom} »</option>)}
          <option value="vide">Partir de zéro</option>
        </select>
      </Field>
    </Sheet>
  );
}

function DetailMagasin({ mag, db, maj, toast, retour }) {
  const [vue, setVue] = useState('parcours');
  const [edit, setEdit] = useState(null); // rayon id ou 'new'
  const [infos, setInfos] = useState(false);
  const majMag = fn => maj(d => fn(d.magasins.find(m => m.id === mag.id), d));
  const deplacer = (from, to) => majMag(m => { const [r] = m.rayons.splice(from, 1); m.rayons.splice(to, 0, r); });
  const catSansRayon = CATEGORIES.filter(c => !mag.rayons.some(r => r.cats.includes(c.id)));

  return (
    <div className="page">
      <button className="btn btn-small btn-white back" onClick={retour}><Icon name="left" size={16} /> Mes magasins</button>

      <div className="card hero" style={{ background: `linear-gradient(135deg, ${mag.couleur}, var(--card))` }}>
        <div className="hero-top">
          <div>
            <div className="hero-kicker">Magasin</div>
            <div className="hero-big">{mag.nom}</div>
            <div className="hero-sub">{mag.rayons.length} rayons · {Object.keys(mag.overrides || {}).length} article(s) placé(s) à la main</div>
          </div>
          <button className="hero-emoji hero-emoji-btn" onClick={() => setInfos(true)} aria-label="Modifier">{mag.emoji}</button>
        </div>
        <div className="quick-row">
          <button className="btn btn-white" onClick={() => setInfos(true)}><Icon name="edit" size={18} /> Modifier</button>
          <button className="btn btn-white" onClick={() => { maj(d => { d.magasinActif = mag.id; }); toast(`${mag.nom} sélectionné 🛒`); }}>
            <Icon name="cart" size={18} /> {db.magasinActif === mag.id ? 'Actif ✓' : 'Utiliser'}
          </button>
        </div>
      </div>

      <Segmented value={vue} onChange={setVue} options={[
        { value: 'parcours', label: 'Parcours', emoji: '🧭' },
        { value: 'plan', label: 'Plan', emoji: '⚡' },
        { value: 'articles', label: 'Articles', emoji: '📍' },
      ]} />

      {vue === 'parcours' && (
        <>
          <p className="muted small tip">👆 Fais glisser la poignée <Icon name="grip" size={14} /> pour changer l'ordre de passage, ou utilise les flèches. Touche un rayon pour le modifier.</p>
          {mag.rayons.length === 0 && <Empty emoji="🧭" titre="Aucun rayon" texte="Ajoute les rayons dans l'ordre où tu les traverses." />}
          <SortableList
            items={mag.rayons}
            getId={r => r.id}
            onMove={deplacer}
            render={(r, i, handle) => (
              <div className="rayon-row">
                <span {...handle}><Icon name="grip" /></span>
                <span className="rayon-num">{i + 1}</span>
                <button className="rayon-row-main" onClick={() => setEdit(r.id)}>
                  <span className="rayon-emoji">{r.emoji}</span>
                  <span className="grow">
                    <b>{r.nom}</b>
                    <span className="muted small block">
                      {r.repere && <>📍 {r.repere} · </>}
                      {r.cats.length ? r.cats.map(c => categorie(c).nom).join(', ') : 'aucune catégorie'}
                    </span>
                  </span>
                </button>
                <span className="arrows">
                  <button className="icon-btn" disabled={i === 0} onClick={() => deplacer(i, i - 1)} aria-label="Monter"><Icon name="up" size={18} /></button>
                  <button className="icon-btn" disabled={i === mag.rayons.length - 1} onClick={() => deplacer(i, i + 1)} aria-label="Descendre"><Icon name="down" size={18} /></button>
                </span>
              </div>
            )}
          />
          <button className="btn btn-main btn-full" onClick={() => setEdit('new')}><Icon name="plus" /> Ajouter un rayon</button>
          {catSansRayon.length > 0 && (
            <div className="card card-yellow">
              <div className="card-title">⚠️ Catégories sans rayon</div>
              <p className="small">Ces articles apparaîtront dans « À classer » :</p>
              <div className="chips-wrap">{catSansRayon.map(c => <span key={c.id} className="chip chip-white">{c.emoji} {c.nom}</span>)}</div>
            </div>
          )}
        </>
      )}

      {vue === 'plan' && <PlanRapide mag={mag} majMag={majMag} />}
      {vue === 'articles' && <ArticlesPlaces mag={mag} db={db} majMag={majMag} />}

      {edit && (
        <EditRayon
          key={edit}
          mag={mag} rayonId={edit} majMag={majMag} toast={toast} db={db}
          onClose={() => setEdit(null)} onRouvrir={id => setEdit(id)}
        />
      )}
      <InfosMagasin open={infos} onClose={() => setInfos(false)} mag={mag} db={db} maj={maj} majMag={majMag} retour={retour} toast={toast} />
    </div>
  );
}

function PlanRapide({ mag, majMag }) {
  const rayonDeCat = c => mag.rayons.find(r => r.cats.includes(c))?.id || '';
  return (
    <>
      <p className="muted small tip">⚡ Le magasin a tout réorganisé ? Réaffecte chaque catégorie à son nouveau rayon en un geste.</p>
      <div className="card list-card">
        {CATEGORIES.map(c => (
          <div key={c.id} className="plan-row">
            <span className="cat-pastille" style={{ background: c.couleur }}>{c.emoji}</span>
            <span className="grow plan-nom">{c.nom}</span>
            <select
              className="input select-mini" value={rayonDeCat(c.id)}
              onChange={e => majMag(m => {
                m.rayons.forEach(r => { r.cats = r.cats.filter(x => x !== c.id); });
                if (e.target.value) m.rayons.find(r => r.id === e.target.value).cats.push(c.id);
              })}
            >
              <option value="">— À classer —</option>
              {mag.rayons.map((r, i) => <option key={r.id} value={r.id}>{i + 1}. {r.nom}</option>)}
            </select>
          </div>
        ))}
      </div>
    </>
  );
}

function ArticlesPlaces({ mag, db, majMag }) {
  const [q, setQ] = useState('');
  const places = Object.entries(mag.overrides || {})
    .map(([pid, rid]) => ({ p: db.produits.find(x => x.id === pid), r: mag.rayons.find(x => x.id === rid) }))
    .filter(x => x.p && x.r);
  const resultats = useMemo(() => {
    const n = norm(q);
    if (!n) return [];
    return db.produits.filter(p => norm(p.nom).includes(n) && !mag.overrides?.[p.id]).slice(0, 6);
  }, [q, db.produits, mag.overrides]);
  const placer = (pid, rid) => majMag(m => { if (rid) m.overrides[pid] = rid; else delete m.overrides[pid]; });
  return (
    <>
      <p className="muted small tip">📍 Pour un article rangé ailleurs que sa catégorie (ex : le lait de coco au rayon « Monde »). Ce placement est prioritaire.</p>
      <div className="card">
        <input className="input" placeholder="🔎 Placer un article précis…" value={q} onChange={e => setQ(e.target.value)} />
        {resultats.map(p => (
          <div key={p.id} className="plan-row">
            <span className="cat-pastille" style={{ background: categorie(p.cat).couleur }}>{p.emoji || categorie(p.cat).emoji}</span>
            <span className="grow plan-nom">{p.nom}</span>
            <select className="input select-mini" value="" onChange={e => { placer(p.id, e.target.value); setQ(''); }}>
              <option value="">Choisir le rayon…</option>
              {mag.rayons.map((r, i) => <option key={r.id} value={r.id}>{i + 1}. {r.nom}</option>)}
            </select>
          </div>
        ))}
      </div>
      {places.length === 0 ? (
        <Empty emoji="📍" titre="Aucun article placé à la main" texte="Astuce : en magasin, touche 📍 à côté d'un article pour le ranger dans le bon rayon." />
      ) : (
        <div className="card list-card">
          {places.map(({ p, r }) => (
            <div key={p.id} className="plan-row">
              <span className="cat-pastille" style={{ background: categorie(p.cat).couleur }}>{p.emoji || categorie(p.cat).emoji}</span>
              <span className="grow plan-nom">{p.nom}</span>
              <select className="input select-mini" value={r.id} onChange={e => placer(p.id, e.target.value)}>
                {mag.rayons.map((x, i) => <option key={x.id} value={x.id}>{i + 1}. {x.nom}</option>)}
              </select>
              <button className="icon-btn danger" onClick={() => placer(p.id, null)} aria-label="Retirer"><Icon name="x" size={18} /></button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function EditRayon({ mag, rayonId, majMag, toast, onClose, onRouvrir, db }) {
  const nouveau = rayonId === 'new';
  const r0 = nouveau ? { nom: '', emoji: '📍', repere: '', cats: [] } : mag.rayons.find(r => r.id === rayonId);
  const [nom, setNom] = useState(r0?.nom || '');
  const [emoji, setEmoji] = useState(r0?.emoji || '📍');
  const [repere, setRepere] = useState(r0?.repere || '');
  const [cats, setCats] = useState(r0?.cats || []);
  const [toutesCats, setToutesCats] = useState(false);
  const [position, setPosition] = useState(nouveau ? mag.rayons.length : mag.rayons.findIndex(r => r.id === rayonId));
  if (!r0) return null;
  const ailleurs = c => mag.rayons.find(r => r.id !== rayonId && r.cats.includes(c));

  const enregistrer = () => {
    if (!nom.trim()) return;
    const nouvelId = uid();
    majMag(m => {
      m.rayons.forEach(r => { if (r.id !== rayonId) r.cats = r.cats.filter(c => !cats.includes(c)); });
      let r;
      if (nouveau) { r = { id: nouvelId, nom: '', emoji: '', repere: '', cats: [] }; }
      else { const i = m.rayons.findIndex(x => x.id === rayonId); r = m.rayons.splice(i, 1)[0]; }
      Object.assign(r, { nom: nom.trim(), emoji, repere: repere.trim(), cats });
      m.rayons.splice(Math.min(position, m.rayons.length), 0, r);
    });
    if (nouveau) { toast('Rayon créé ✨ Ajoute-lui des articles'); onRouvrir(nouvelId); return; }
    toast('Rayon mis à jour ✨');
    onClose();
  };
  const supprimer = () => {
    if (!confirm(`Supprimer le rayon « ${r0.nom} » ? Ses articles passeront dans « À classer ».`)) return;
    majMag(m => {
      m.rayons = m.rayons.filter(r => r.id !== rayonId);
      Object.keys(m.overrides).forEach(p => { if (m.overrides[p] === rayonId) delete m.overrides[p]; });
    });
    onClose();
  };
  const dupliquer = () => {
    majMag(m => {
      const i = m.rayons.findIndex(x => x.id === rayonId);
      m.rayons.splice(i + 1, 0, { id: uid(), nom: r0.nom + ' (2)', emoji: r0.emoji, repere: r0.repere, cats: [] });
    });
    toast('Rayon dupliqué');
    onClose();
  };

  return (
    <Sheet
      open onClose={onClose} title={nouveau ? '✨ Nouveau rayon' : '✏️ Modifier le rayon'}
      footer={<button className="btn btn-big btn-main" disabled={!nom.trim()} onClick={enregistrer}>Enregistrer</button>}
    >
      <div className="row gap">
        <EmojiPicker value={emoji} onChange={setEmoji} />
        <input className="input grow" placeholder="Nom du rayon (ex : Frais libre-service)" value={nom} onChange={e => setNom(e.target.value)} />
      </div>
      <div className="grid2">
        <Field label="Repère" hint="Allée, côté, tête de gondole…">
          <input className="input" placeholder="Ex : Allée 7 gauche" value={repere} onChange={e => setRepere(e.target.value)} />
        </Field>
        <Field label="Position dans le parcours">
          <select className="input" value={position} onChange={e => setPosition(+e.target.value)}>
            {Array.from({ length: mag.rayons.length + (nouveau ? 1 : 0) }, (_, i) => (
              <option key={i} value={i}>{i + 1}{i === 0 ? ' (entrée)' : i === mag.rayons.length - (nouveau ? 0 : 1) ? ' (fin)' : ''}</option>
            ))}
          </select>
        </Field>
      </div>
      {!nouveau && <ArticlesDuRayon mag={mag} rayonId={rayonId} db={db} majMag={majMag} toast={toast} />}
      <Field label={`Catégories entières rangées ici (${cats.length})`}>
        <div className="chips-wrap">
          {CATEGORIES.filter(c => toutesCats || cats.includes(c.id)).map(c => {
            const on = cats.includes(c.id);
            const autre = ailleurs(c.id);
            return (
              <button
                key={c.id} className={'chip chip-toggle' + (on ? ' on' : '')} style={{ '--c': c.couleur }}
                onClick={() => setCats(on ? cats.filter(x => x !== c.id) : [...cats, c.id])}
              >
                {c.emoji} {c.nom}
                {!on && autre && <span className="chip-sub">(rayon {mag.rayons.indexOf(autre) + 1})</span>}
              </button>
            );
          })}
          <button className="chip chip-new" onClick={() => setToutesCats(v => !v)}>
            {toutesCats ? 'Masquer les autres catégories' : cats.length ? '＋ Autres catégories…' : '＋ Ranger une catégorie entière ici…'}
          </button>
        </div>
      </Field>
      {!nouveau && (
        <div className="quick-row">
          <button className="btn btn-ghost" onClick={dupliquer}><Icon name="copy" size={18} /> Dupliquer</button>
          <button className="btn btn-ghost danger" onClick={supprimer}><Icon name="trash" size={18} /> Supprimer</button>
        </div>
      )}
    </Sheet>
  );
}

function InfosMagasin({ open, onClose, mag, db, maj, majMag, retour, toast }) {
  const [nom, setNom] = useState(mag.nom);
  const [emoji, setEmoji] = useState(mag.emoji);
  const [couleur, setCouleur] = useState(mag.couleur);
  const [favori, setFavori] = useState(mag.favori);
  const enregistrer = () => {
    majMag(m => Object.assign(m, { nom: nom.trim() || m.nom, emoji, couleur, favori }));
    toast('Magasin mis à jour');
    onClose();
  };
  const supprimer = () => {
    if (db.magasins.length === 1) { toast('Garde au moins un magasin 🙂'); return; }
    if (!confirm(`Supprimer « ${mag.nom} » et toute sa disposition ?`)) return;
    maj(d => {
      d.magasins = d.magasins.filter(m => m.id !== mag.id);
      if (d.magasinActif === mag.id) d.magasinActif = d.magasins[0].id;
    });
    onClose();
    retour();
  };
  const reinit = () => {
    if (!confirm('Remplacer tous les rayons par la disposition type ?')) return;
    majMag(m => { m.rayons = rayonsType(uid); m.overrides = {}; });
    onClose();
  };
  return (
    <Sheet open={open} onClose={onClose} title="🏪 Le magasin" footer={<button className="btn btn-big btn-main" onClick={enregistrer}>Enregistrer</button>}>
      <div className="row gap">
        <EmojiPicker value={emoji} onChange={setEmoji} />
        <input className="input grow" value={nom} onChange={e => setNom(e.target.value)} />
      </div>
      <Field label="Couleur">
        <div className="couleurs">
          {PASTELS.map(c => <button key={c} className={'pastille' + (c === couleur ? ' on' : '')} style={{ background: c }} onClick={() => setCouleur(c)} aria-label={c} />)}
        </div>
      </Field>
      <div className="toggle-box"><Toggle checked={favori} onChange={setFavori} label="Magasin favori ⭐" /></div>
      <div className="quick-row">
        <button className="btn btn-ghost" onClick={reinit}><Icon name="history" size={18} /> Disposition type</button>
        <button className="btn btn-ghost danger" onClick={supprimer}><Icon name="trash" size={18} /> Supprimer</button>
      </div>
    </Sheet>
  );
}

// Articles rangés dans un rayon : ceux placés à la main + ceux venant des catégories du rayon
function ArticlesDuRayon({ mag, rayonId, db, majMag, toast }) {
  const [q, setQ] = useState('');
  const r = mag.rayons.find(x => x.id === rayonId);
  const ici = db.produits.filter(p => rayonDe(mag, p) === rayonId);
  const places = ici.filter(p => mag.overrides?.[p.id] === rayonId).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  const parCat = ici.filter(p => mag.overrides?.[p.id] !== rayonId);
  const n = norm(q);
  const sugg = n ? db.produits.filter(p => norm(p.nom).includes(n) && mag.overrides?.[p.id] !== rayonId).slice(0, 6) : [];
  const ajouter = nom => {
    if (!nom.trim()) return;
    majMag((m, d) => {
      const p = produitPourNom(d, nom, r?.cats?.[0] ? { cat: r.cats[0] } : undefined);
      m.overrides[p.id] = rayonId;
    });
    toast(`${nom.trim()} rangé dans « ${r?.nom} » 📍`);
    setQ('');
  };
  return (
    <div className="field">
      <span className="field-label">📍 Articles rangés ici</span>
      <div className="ajout-row">
        <input
          className="input grow" placeholder="Ajouter un article (existant ou nouveau)…" value={q}
          onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && ajouter(q)}
        />
        <button className="btn btn-round btn-main" onClick={() => ajouter(q)} aria-label="Ranger ici"><Icon name="plus" /></button>
      </div>
      {n && (
        <div className="sugg">
          {sugg.map(p => (
            <button key={p.id} className="chip" style={{ background: categorie(p.cat).couleur }} onClick={() => ajouter(p.nom)}>
              {p.emoji || categorie(p.cat).emoji} {p.nom}
            </button>
          ))}
          {!sugg.some(p => norm(p.nom) === n) && <button className="chip chip-new" onClick={() => ajouter(q)}><Icon name="sparkle" size={14} /> Nouveau : « {q.trim()} »</button>}
        </div>
      )}
      {places.length > 0 && (
        <div className="chips-wrap">
          {places.map(p => (
            <span key={p.id} className="chip chip-toggle on" style={{ '--c': categorie(p.cat).couleur }}>
              {p.emoji || categorie(p.cat).emoji} {p.nom}
              <button className="chip-x" aria-label={`Retirer ${p.nom}`} onClick={() => majMag(m => { delete m.overrides[p.id]; })}><Icon name="x" size={13} strokeWidth={3} /></button>
            </span>
          ))}
        </div>
      )}
      <span className="field-hint">
        {places.length === 0 && parCat.length === 0 ? 'Aucun article pour l’instant.' : `${places.length} placé(s) à la main${parCat.length ? ` · ${parCat.length} via les catégories cochées` : ''}`}
      </span>
    </div>
  );
}
