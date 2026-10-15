import { useMemo, useState } from 'react';
import Icon from '../components/icons.jsx';
import { EmojiPicker, Empty, Field, Segmented, Sheet, Toggle } from '../components/ui.jsx';
import { CATEGORIES } from '../data/defaults.js';
import { ajouterALaListe } from '../lib/store.js';
import { categorie, norm, uid, findProduit, devinerCategorie } from '../lib/utils.js';

export default function Maison({ db, maj, toast }) {
  const [vue, setVue] = useState('stock');
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState(null); // produit id | 'new'
  const dansListe = new Set(db.liste.filter(i => !i.coche).map(i => i.produitId));

  const filtres = useMemo(() => {
    const n = norm(q);
    return db.produits
      .filter(p => (vue === 'stock' && !n ? p.suivi : true))
      .filter(p => !n || norm(p.nom).includes(n));
  }, [db.produits, q, vue]);

  const parCat = CATEGORIES.map(c => ({ c, items: filtres.filter(p => p.cat === c.id).sort((a, b) => a.nom.localeCompare(b.nom, 'fr')) })).filter(g => g.items.length);
  const suivis = db.produits.filter(p => p.suivi);
  const bas = suivis.filter(p => p.stock <= p.min);
  const vides = suivis.filter(p => p.stock <= 0).length;

  const setP = (id, fn) => maj(d => { const p = d.produits.find(x => x.id === id); if (p) fn(p); });
  const ajouterListe = p => {
    maj(d => ajouterALaListe(d, p.nom, String(Math.max(1, (p.cible || p.min + 1) - p.stock))));
    toast(`${p.nom} ajouté à la liste 🛒`);
  };

  return (
    <div className="page">
      <div className="card hero hero-peach">
        <div className="hero-top">
          <div>
            <div className="hero-kicker">À la maison</div>
            <div className="hero-big">{suivis.length} produit{suivis.length > 1 ? 's' : ''} suivi{suivis.length > 1 ? 's' : ''}</div>
            <div className="hero-sub">{bas.length ? <>🔔 <b>{bas.length}</b> à racheter{vides ? ` dont ${vides} épuisé${vides > 1 ? 's' : ''}` : ''}</> : 'Tout est bien rempli 👌'}</div>
          </div>
          <div className="hero-emoji">🏠</div>
        </div>
        {bas.filter(p => !dansListe.has(p.id)).length > 0 && (
          <button className="btn btn-main btn-full" onClick={() => {
            maj(d => bas.filter(p => !dansListe.has(p.id)).forEach(p => ajouterALaListe(d, p.nom, String(Math.max(1, (p.cible || p.min + 1) - p.stock)))));
            toast('Ajoutés à la liste du jour 🛒');
          }}>
            <Icon name="cart" /> Ajouter ce qu'il faut racheter à ma liste
          </button>
        )}
      </div>

      <Segmented value={vue} onChange={setVue} options={[
        { value: 'stock', label: 'Mon stock', emoji: '📦' },
        { value: 'articles', label: 'Tous les articles', emoji: '🗂️' },
      ]} />

      <div className="row gap">
        <input className="input grow" placeholder="🔎 Combien il m'en reste ? (ex : café)" value={q} onChange={e => setQ(e.target.value)} />
        <button className="btn btn-main" onClick={() => setEdit('new')}><Icon name="plus" size={18} /> Article</button>
      </div>

      {q && filtres.length === 0 && <Empty emoji="🔎" titre="Aucun article trouvé" texte="Crée-le avec le bouton « Article »." />}
      {q && filtres.length > 0 && filtres.length <= 3 && (
        <div className="stack">
          {filtres.map(p => (
            <div key={p.id} className={'card stock-hero' + (p.suivi ? (p.stock <= 0 ? ' vide' : p.stock <= p.min ? ' bas' : ' ok') : '')} onClick={e => { if (!e.target.closest('button')) setEdit(p.id); }} role="button">
              <span className="stock-hero-emoji">{p.emoji || categorie(p.cat).emoji}</span>
              <div className="grow">
                <b>{p.nom}</b>
                <div className="muted small">{p.suivi ? (p.stock <= 0 ? '🔴 Épuisé à la maison' : p.stock <= p.min ? '🟠 Bientôt fini' : '🟢 Il en reste') : 'Pas suivi dans le stock'}{dansListe.has(p.id) ? ' · 🛒 sur ta liste' : ''}</div>
              </div>
              {p.suivi
                ? <div className="stock-hero-val">{p.stock}<span>{p.unite || 'en stock'}</span></div>
                : <button className="btn btn-small btn-main" onClick={() => setP(p.id, x => { x.suivi = true; })}>Suivre</button>}
            </div>
          ))}
        </div>
      )}

      {vue === 'stock' && !q && suivis.length === 0 && (
        <Empty emoji="📦" titre="Aucun produit suivi" texte="Dans « Tous les articles », active le suivi des produits que tu veux surveiller (lait, café, papier toilette…). L'appli te dira quand les racheter.">
          <button className="btn btn-main" onClick={() => setVue('articles')}>Choisir mes produits</button>
        </Empty>
      )}

      {!(q && filtres.length <= 3) && parCat.map(({ c, items }) => (
        <div key={c.id} className="rayon-bloc">
          <div className="rayon-head"><span className="cat-pastille" style={{ background: c.couleur }}>{c.emoji}</span><span className="rayon-nom">{c.nom}</span><span className="muted small">{items.length}</span></div>
          <div className="card list-card">
            {items.map(p => (vue === 'stock' || q) && p.suivi ? (
              <div key={p.id} className={'stock-row' + (p.stock <= 0 ? ' vide' : p.stock <= p.min ? ' bas' : '')}>
                <button className="stock-main" onClick={() => setEdit(p.id)}>
                  <span className="item-emoji">{p.emoji || c.emoji}</span>
                  <span className="grow">
                    <b>{p.nom}</b>
                    <span className="muted small block">
                      {p.stock <= 0 ? '🔴 Épuisé' : p.stock <= p.min ? '🟠 Bientôt fini' : '🟢 OK'} · seuil {p.min}{p.unite ? ' ' + p.unite : ''}
                    </span>
                  </span>
                </button>
                <div className="stepper">
                  <button onClick={() => setP(p.id, x => { x.stock = Math.max(0, Math.round((x.stock - 1) * 100) / 100); })} aria-label="Moins"><Icon name="minus" size={18} /></button>
                  <span className="stepper-val">{p.stock}</span>
                  <button onClick={() => setP(p.id, x => { x.stock = Math.round((x.stock + 1) * 100) / 100; })} aria-label="Plus"><Icon name="plus" size={18} /></button>
                </div>
                {p.stock <= p.min && (
                  dansListe.has(p.id)
                    ? <span className="dans-liste" title="Dans la liste">🛒</span>
                    : <button className="icon-btn add-cart" onClick={() => ajouterListe(p)} aria-label="Ajouter à la liste"><Icon name="cart" size={18} /></button>
                )}
              </div>
            ) : (
              <div key={p.id} className="stock-row">
                <button className="stock-main" onClick={() => setEdit(p.id)}>
                  <span className="item-emoji">{p.emoji || c.emoji}</span>
                  <span className="grow"><b>{p.nom}</b>{p.unite && <span className="muted small"> · {p.unite}</span>}</span>
                </button>
                <button className={'suivi-btn' + (p.suivi ? ' on' : '')} onClick={() => setP(p.id, x => { x.suivi = !x.suivi; })}>
                  {p.suivi ? '📦 Suivi' : 'Suivre'}
                </button>
                <button className="icon-btn add-cart" onClick={() => { maj(d => ajouterALaListe(d, p.nom, '')); toast(`${p.nom} ajouté 🛒`); }} aria-label="Ajouter à la liste">
                  {dansListe.has(p.id) ? '🛒' : <Icon name="plus" size={18} />}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {edit && <EditProduit id={edit} db={db} maj={maj} toast={toast} onClose={() => setEdit(null)} />}
    </div>
  );
}

function EditProduit({ id, db, maj, toast, onClose }) {
  const nouveau = id === 'new';
  const p0 = nouveau ? { nom: '', emoji: '', cat: 'autre', unite: '', suivi: true, stock: 0, min: 1, cible: '' } : db.produits.find(p => p.id === id);
  const [f, setF] = useState({ cible: '', ...p0 });
  const [places, setPlaces] = useState(() => Object.fromEntries(db.magasins.map(m => [m.id, nouveau ? '' : (m.overrides?.[id] || '')])));
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  if (!p0) return null;
  const num = v => { const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) && n >= 0 ? n : 0; };
  const enregistrer = () => {
    const nom = f.nom.trim();
    if (!nom) return;
    const doublon = findProduit(db.produits, nom);
    if (doublon && doublon.id !== id) { toast(`« ${doublon.nom} » existe déjà`); return; }
    maj(d => {
      const data = { nom, emoji: f.emoji, cat: f.cat, unite: f.unite.trim(), suivi: f.suivi, stock: num(f.stock), min: num(f.min), cible: f.cible === '' ? '' : num(f.cible) };
      const pid = nouveau ? uid() : id;
      if (nouveau) d.produits.push({ id: pid, ...data });
      else Object.assign(d.produits.find(p => p.id === id), data);
      d.magasins.forEach(m => {
        if (places[m.id] && m.rayons.some(r => r.id === places[m.id])) m.overrides[pid] = places[m.id];
        else delete m.overrides[pid];
      });
    });
    toast(nouveau ? 'Article créé ✨' : 'Article mis à jour');
    onClose();
  };
  const supprimer = () => {
    if (!confirm(`Supprimer « ${p0.nom} » du catalogue ?`)) return;
    maj(d => {
      d.produits = d.produits.filter(p => p.id !== id);
      d.liste = d.liste.filter(i => i.produitId !== id);
      d.magasins.forEach(m => delete m.overrides[id]);
    });
    onClose();
  };
  return (
    <Sheet open onClose={onClose} title={nouveau ? '✨ Nouvel article' : '✏️ Article'} footer={<button className="btn btn-big btn-main" disabled={!f.nom.trim()} onClick={enregistrer}>Enregistrer</button>}>
      <div className="row gap">
        <EmojiPicker value={f.emoji || categorie(f.cat).emoji} onChange={v => set('emoji', v)} />
        <input
          className="input grow" placeholder="Nom de l'article" value={f.nom}
          onChange={e => { set('nom', e.target.value); if (nouveau && f.cat === 'autre') { const g = devinerCategorie(e.target.value); if (g !== 'autre') set('cat', g); } }}
        />
      </div>
      <Field label="Catégorie">
        <select className="input" value={f.cat} onChange={e => set('cat', e.target.value)}>
          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.nom}</option>)}
        </select>
      </Field>
      <Field label="Unité (facultatif)" hint="Kg, Gr, Cl, L, paquet, boîte…">
        <input className="input" value={f.unite} onChange={e => set('unite', e.target.value)} />
        <div className="chips-wrap" style={{ marginTop: 6 }}>
          {['Kg', 'Gr', 'Cl', 'L'].map(u => (
            <button key={u} type="button" className={'chip chip-toggle' + (f.unite === u ? ' on' : '')} onClick={() => set('unite', f.unite === u ? '' : u)}>{u}</button>
          ))}
        </div>
      </Field>
      {db.magasins.length > 0 && (
        <Field label="📍 Où le trouver" hint="Par défaut, l’article suit le rayon de sa catégorie.">
          <div className="stack-s">
            {db.magasins.map(m => {
              const auto = m.rayons.findIndex(r => r.cats.includes(f.cat));
              return (
                <div key={m.id} className="plan-row">
                  <span className="cat-pastille" style={{ background: m.couleur }}>{m.emoji}</span>
                  <span className="grow plan-nom">{m.nom}</span>
                  <select className="input select-mini" value={places[m.id] || ''} onChange={e => setPlaces(x => ({ ...x, [m.id]: e.target.value }))}>
                    <option value="">{auto >= 0 ? `Auto : ${auto + 1}. ${m.rayons[auto].nom}` : 'À classer'}</option>
                    {m.rayons.map((r, i) => <option key={r.id} value={r.id}>{i + 1}. {r.nom}</option>)}
                  </select>
                </div>
              );
            })}
          </div>
        </Field>
      )}
      <div className="toggle-box"><Toggle checked={f.suivi} onChange={v => set('suivi', v)} label="Suivre ce produit dans mon stock maison 📦" /></div>
      {f.suivi && (
        <div className="grid3">
          <Field label="En stock"><input className="input" inputMode="decimal" value={f.stock} onChange={e => set('stock', e.target.value)} /></Field>
          <Field label="Racheter à" hint="seuil d'alerte"><input className="input" inputMode="decimal" value={f.min} onChange={e => set('min', e.target.value)} /></Field>
          <Field label="Stock idéal" hint="facultatif"><input className="input" inputMode="decimal" value={f.cible} onChange={e => set('cible', e.target.value)} /></Field>
        </div>
      )}
      {!nouveau && <button className="btn btn-ghost danger" onClick={supprimer}><Icon name="trash" size={18} /> Supprimer l'article</button>}
    </Sheet>
  );
}
