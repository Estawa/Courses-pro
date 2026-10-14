import { useEffect, useMemo, useState } from 'react';
import Icon from './icons.jsx';
import { EmojiPicker, Field, Sheet, SortableList, Toggle } from './ui.jsx';
import { decoder, trouverCode } from '../lib/partage.js';
import { produitPourNom } from '../lib/store.js';
import { categorie, norm, uid } from '../lib/utils.js';

export default function ImportMagasin({ open, texteInitial, onClose, db, maj, toast, goto }) {
  const [txt, setTxt] = useState('');
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [cible, setCible] = useState('nouveau');
  const [garderPlaces, setGarderPlaces] = useState(true);
  const [ouvert, setOuvert] = useState(null);

  const lire = async t => {
    setErr('');
    try { setData(await decoder(t)); setOuvert(null); } catch (e) { setErr(e.message); }
  };
  useEffect(() => {
    if (!open) return;
    setData(null); setErr(''); setCible('nouveau'); setTxt(texteInitial || '');
    if (trouverCode(texteInitial)) lire(texteInitial);
  }, [open, texteInitial]); // eslint-disable-line react-hooks/exhaustive-deps

  const coller = async () => {
    try { const t = await navigator.clipboard.readText(); setTxt(t); if (trouverCode(t)) lire(t); }
    catch { toast('Appui long dans la zone de texte → Coller'); }
  };

  const magCible = db.magasins.find(m => m.id === cible);
  const chezMoi = useMemo(() => {
    const map = {};
    (magCible?.rayons || []).forEach((r, i) => { map[norm(r.nom)] = i + 1; });
    return map;
  }, [magCible]);

  const setR = (cle, fn) => setData(d => ({ ...d, rayons: d.rayons.map(r => (r.cle === cle ? fn({ ...r }) : r)) }));
  const deplacer = (from, to) => setData(d => { const r = [...d.rayons]; const [x] = r.splice(from, 1); r.splice(to, 0, x); return { ...d, rayons: r }; });
  const gardes = data ? data.rayons.filter(r => r.garder) : [];
  const nbArticles = gardes.reduce((s, r) => s + r.articles.length, 0);

  const incorporer = () => {
    if (!gardes.length) return;
    maj(d => {
      const vus = new Set();
      const rayons = gardes.map(r => ({
        id: uid(), nom: r.nom.trim() || 'Rayon', emoji: r.emoji, repere: r.repere.trim(),
        cats: r.cats.filter(c => (vus.has(c) ? false : (vus.add(c), true))),
      }));
      const overrides = {};
      gardes.forEach((r, i) => r.articles.forEach(a => {
        const p = produitPourNom(d, a.nom, { cat: a.cat });
        if (!p.emoji && a.emoji) p.emoji = a.emoji;
        overrides[p.id] = rayons[i].id;
      }));
      if (cible === 'nouveau') {
        d.magasins.push({ id: uid(), nom: data.nom.trim() || 'Magasin partagé', emoji: data.emoji, couleur: data.couleur, favori: true, rayons, overrides });
      } else {
        const m = d.magasins.find(x => x.id === cible);
        if (garderPlaces) {
          Object.entries(m.overrides || {}).forEach(([pid, rid]) => {
            const ancien = m.rayons.find(x => x.id === rid);
            const nouveau = ancien && rayons.find(x => norm(x.nom) === norm(ancien.nom));
            if (nouveau && !overrides[pid]) overrides[pid] = nouveau.id;
          });
        }
        m.rayons = rayons;
        m.overrides = overrides;
      }
    });
    toast(cible === 'nouveau' ? `« ${data.nom} » ajouté à tes magasins 🎉` : `Organisation de « ${magCible?.nom} » mise à jour 🎉`);
    onClose();
    goto?.('magasins');
  };

  return (
    <Sheet
      open={open} onClose={onClose} title="📥 Organisation partagée"
      footer={data && (
        <button className="btn btn-big btn-main" disabled={!gardes.length} onClick={incorporer}>
          {cible === 'nouveau' ? 'Ajouter ce magasin' : `Remplacer l’organisation de « ${magCible?.nom} »`} ({gardes.length} rayons)
        </button>
      )}
    >
      {!data ? (
        <>
          <div className="wa-tip">
            <span className="wa-ico">💬</span>
            <span className="small">Quelqu’un t’a envoyé l’organisation d’un magasin sur WhatsApp ? Ouvre son lien, ou <b>copie le message</b> et colle-le ici.</span>
          </div>
          <button className="btn btn-soft btn-full" onClick={coller}><Icon name="paste" size={18} /> Coller depuis le presse-papiers</button>
          <textarea className="input textarea" rows={5} value={txt} onChange={e => setTxt(e.target.value)} placeholder="Colle ici le message reçu…" />
          {err && <div className="msg msg-err">{err}</div>}
          <button className="btn btn-big btn-main" disabled={!txt.trim()} onClick={() => lire(txt)}>Voir l’organisation</button>
        </>
      ) : (
        <>
          <div className="card hero" style={{ background: `linear-gradient(135deg, ${data.couleur}, var(--card))` }}>
            <div className="row gap">
              <EmojiPicker value={data.emoji} onChange={e => setData(d => ({ ...d, emoji: e }))} />
              <input className="input grow" value={data.nom} onChange={e => setData(d => ({ ...d, nom: e.target.value }))} aria-label="Nom du magasin" />
            </div>
            <div className="small">{gardes.length} rayon{gardes.length > 1 ? 's' : ''} gardé{gardes.length > 1 ? 's' : ''} sur {data.rayons.length} · {nbArticles} article{nbArticles > 1 ? 's' : ''} placé{nbArticles > 1 ? 's' : ''}</div>
          </div>

          <Field label="Que faire de cette organisation ?">
            <select className="input" value={cible} onChange={e => setCible(e.target.value)}>
              <option value="nouveau">➕ L’ajouter comme nouveau magasin</option>
              {db.magasins.map(m => <option key={m.id} value={m.id}>🔁 Remplacer les rayons de « {m.nom} »</option>)}
            </select>
          </Field>
          {cible !== 'nouveau' && (
            <div className="toggle-box">
              <Toggle checked={garderPlaces} onChange={setGarderPlaces} label="Garder mes articles placés dans les rayons qui portent le même nom" />
            </div>
          )}

          <p className="muted small tip">
            Adapte avant d’intégrer : décoche les rayons inutiles, réordonne-les <Icon name="grip" size={13} />, touche un rayon pour voir et modifier ses articles.
            {cible !== 'nouveau' && ' Le badge vert indique un rayon qui existe déjà chez toi.'}
          </p>

          <SortableList
            items={data.rayons}
            getId={r => r.cle}
            onMove={deplacer}
            render={(r, i, handle) => {
              const n = data.rayons.slice(0, i + 1).filter(x => x.garder).length;
              const deja = chezMoi[norm(r.nom)];
              const mesArticles = db.produits.filter(p => r.cats.includes(p.cat));
              return (
                <div className={'imp-rayon' + (r.garder ? '' : ' off')}>
                  <div className="rayon-row imp-row">
                    <span {...handle}><Icon name="grip" /></span>
                    <button className={'imp-check' + (r.garder ? ' on' : '')} onClick={() => setR(r.cle, x => ({ ...x, garder: !x.garder }))} aria-label="Garder ce rayon">
                      {r.garder ? <Icon name="check" size={16} strokeWidth={3} /> : null}
                    </button>
                    <button className="rayon-row-main" onClick={() => setOuvert(ouvert === r.cle ? null : r.cle)}>
                      <span className="rayon-num">{r.garder ? n : '–'}</span>
                      <span className="rayon-emoji">{r.emoji}</span>
                      <span className="grow">
                        <b>{r.nom}</b>
                        <span className="muted small block">
                          {r.repere && <>📍 {r.repere} · </>}
                          {r.cats.length} catégorie{r.cats.length > 1 ? 's' : ''} · {r.articles.length} article{r.articles.length > 1 ? 's' : ''}
                        </span>
                      </span>
                      {deja && <span className="badge-deja">chez toi n°{deja}</span>}
                      <Icon name={ouvert === r.cle ? 'up' : 'down'} size={18} />
                    </button>
                  </div>
                  {ouvert === r.cle && (
                    <div className="imp-detail">
                      <div className="grid2">
                        <input className="input" value={r.nom} onChange={e => setR(r.cle, x => ({ ...x, nom: e.target.value }))} aria-label="Nom du rayon" />
                        <input className="input" value={r.repere} placeholder="Repère" onChange={e => setR(r.cle, x => ({ ...x, repere: e.target.value }))} aria-label="Repère" />
                      </div>
                      {r.cats.length > 0 && (
                        <>
                          <span className="field-label">Catégories entières</span>
                          <div className="chips-wrap">
                            {r.cats.map(c => (
                              <span key={c} className="chip chip-toggle on" style={{ '--c': categorie(c).couleur }}>
                                {categorie(c).emoji} {categorie(c).nom}
                                <button className="chip-x" onClick={() => setR(r.cle, x => ({ ...x, cats: x.cats.filter(y => y !== c) }))} aria-label="Retirer"><Icon name="x" size={13} strokeWidth={3} /></button>
                              </span>
                            ))}
                          </div>
                          {mesArticles.length > 0 && (
                            <span className="muted small">Chez toi, ça rangera aussi : {mesArticles.slice(0, 12).map(p => p.nom).join(', ')}{mesArticles.length > 12 ? '…' : ''}</span>
                          )}
                        </>
                      )}
                      <span className="field-label">Articles placés dans ce rayon</span>
                      {r.articles.length === 0 ? <span className="muted small">Aucun article précis.</span> : (
                        <div className="chips-wrap">
                          {r.articles.map((a, k) => (
                            <span key={k} className="chip chip-white imp-art">
                              {a.emoji || categorie(a.cat).emoji} {a.nom}
                              <button className="chip-x" onClick={() => setR(r.cle, x => ({ ...x, articles: x.articles.filter((_, j) => j !== k) }))} aria-label={`Retirer ${a.nom}`}><Icon name="x" size={13} strokeWidth={3} /></button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            }}
          />
          <button className="lien small" onClick={() => setData(null)}><Icon name="left" size={14} /> Coller un autre message</button>
        </>
      )}
    </Sheet>
  );
}
