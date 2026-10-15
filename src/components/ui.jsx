import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from './icons.jsx';
import { EMOJIS } from '../data/defaults.js';
import { norm, categorie, UNITES, decouperQte, composerQte } from '../lib/utils.js';

export function Sheet({ open, onClose, title, children, footer }) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const k = e => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', k);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', k); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="sheet-back" onMouseDown={e => e.target === e.currentTarget && onClose?.()}>
      <div className="sheet" role="dialog" aria-label={title}>
        <div className="sheet-grab" />
        <div className="sheet-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Fermer"><Icon name="x" /></button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Segmented({ value, onChange, options }) {
  return (
    <div className="seg">
      {options.map(o => (
        <button key={o.value} className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.emoji && <span>{o.emoji}</span>} {o.label}
        </button>
      ))}
    </div>
  );
}

export function Empty({ emoji, titre, texte, children }) {
  return (
    <div className="empty">
      <div className="empty-emoji">{emoji}</div>
      <div className="empty-titre">{titre}</div>
      {texte && <p>{texte}</p>}
      {children}
    </div>
  );
}

export function EmojiPicker({ value, onChange }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <div className="emoji-pick">
      <button type="button" className="emoji-current" onClick={() => setOuvert(o => !o)}>
        {value || '➕'}
      </button>
      {ouvert && (
        <div className="emoji-grid">
          {EMOJIS.map(e => (
            <button type="button" key={e} onClick={() => { onChange(e); setOuvert(false); }}>{e}</button>
          ))}
          <input
            className="input emoji-input" placeholder="Autre…" maxLength={4}
            onChange={e => e.target.value && onChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}

export function Field({ label, children, hint }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button type="button" className={'toggle ' + (checked ? 'on' : '')} onClick={() => onChange(!checked)}>
      <span className="toggle-track"><span className="toggle-dot" /></span>
      <span>{label}</span>
    </button>
  );
}

// Quantité + unité (Kg / Gr / Cl / L) ; la valeur reste un simple texte, ex : "500 Gr"
export function QteUnite({ value, onChange, mini = false, placeholder = 'Qté' }) {
  const { n, u } = decouperQte(value);
  return (
    <span className={'qte-unite' + (mini ? ' qte-unite-mini' : '')}>
      <input
        className={'input ' + (mini ? 'qte-mini' : 'qte-input')} inputMode="decimal" placeholder={placeholder} value={n}
        onChange={e => onChange(e.target.value.trim() ? composerQte(e.target.value, u) : '')} aria-label="Quantité"
      />
      <select className="input unite-select" value={u} onChange={e => onChange(composerQte(n, e.target.value))} aria-label="Unité">
        <option value="">—</option>
        {UNITES.map(x => <option key={x} value={x}>{x}</option>)}
      </select>
    </span>
  );
}

// Champ d'ajout avec suggestions du catalogue
export function AjoutArticle({ produits, onAjout, placeholder = 'Ajouter un article…', exclure = [] }) {
  const [txt, setTxt] = useState('');
  const [qte, setQte] = useState('');
  const sugg = useMemo(() => {
    const n = norm(txt);
    if (!n) return [];
    return produits
      .filter(p => !exclure.includes(p.id) && norm(p.nom).includes(n))
      .sort((a, b) => norm(a.nom).indexOf(n) - norm(b.nom).indexOf(n))
      .slice(0, 6);
  }, [txt, produits, exclure]);
  const valider = nom => {
    const v = (nom ?? txt).trim();
    if (!v) return;
    onAjout(v, qte.trim());
    setTxt(''); setQte('');
  };
  return (
    <div className="ajout">
      <div className="ajout-row">
        <QteUnite value={qte} onChange={setQte} />
        <input
          className="input grow" placeholder={placeholder} value={txt}
          onChange={e => setTxt(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && valider()}
          aria-label="Article"
        />
        <button className="btn btn-round btn-main" onClick={() => valider()} aria-label="Ajouter">
          <Icon name="plus" />
        </button>
      </div>
      {sugg.length > 0 && (
        <div className="sugg">
          {sugg.map(p => (
            <button key={p.id} onClick={() => valider(p.nom)} className="chip" style={{ background: categorie(p.cat).couleur }}>
              <span>{p.emoji || categorie(p.cat).emoji}</span> {p.nom}
              {p.suivi && <span className={'chip-badge' + (p.stock <= p.min ? ' low' : '')}>🏠 {p.stock}</span>}
            </button>
          ))}
          {!sugg.some(p => norm(p.nom) === norm(txt)) && (
            <button onClick={() => valider()} className="chip chip-new">
              <Icon name="sparkle" size={14} /> Nouveau : « {txt.trim()} »
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Liste réordonnable au doigt (poignée) — sans dépendance
export function SortableList({ items, getId, onMove, render }) {
  const refs = useRef({});
  const [drag, setDrag] = useState(null);

  const start = (e, index) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const rects = items.map(it => refs.current[getId(it)]?.getBoundingClientRect());
    const gap = rects.length > 1 ? Math.max(0, rects[1].top - rects[0].bottom) : 8;
    navigator.vibrate?.(15);
    setDrag({ from: index, to: index, y0: e.clientY, s0: window.scrollY, dy: 0, h: rects[index].height + gap, rects });
  };
  const move = e => {
    if (!drag) return;
    if (e.clientY < 90) window.scrollBy(0, -12);
    else if (e.clientY > window.innerHeight - 110) window.scrollBy(0, 12);
    const dy = e.clientY - drag.y0 + (window.scrollY - drag.s0);
    const r = drag.rects[drag.from];
    const centre = r.top + r.height / 2 + dy;
    let to = drag.from;
    for (let i = drag.from + 1; i < items.length; i++) {
      const ri = drag.rects[i];
      if (centre > ri.top + ri.height / 2) to = i;
    }
    for (let i = drag.from - 1; i >= 0; i--) {
      const ri = drag.rects[i];
      if (centre < ri.top + ri.height / 2) to = i;
    }
    setDrag(d => ({ ...d, dy, to }));
  };
  const end = () => {
    if (!drag) return;
    if (drag.to !== drag.from) onMove(drag.from, drag.to);
    setDrag(null);
  };

  return (
    <div className="sortable">
      {items.map((it, i) => {
        const id = getId(it);
        let t = 0;
        if (drag) {
          if (i === drag.from) t = drag.dy;
          else if (drag.from < drag.to && i > drag.from && i <= drag.to) t = -drag.h;
          else if (drag.to < drag.from && i >= drag.to && i < drag.from) t = drag.h;
        }
        const actif = drag && i === drag.from;
        return (
          <div
            key={id}
            ref={el => (refs.current[id] = el)}
            className={'sortable-item' + (actif ? ' dragging' : '')}
            style={{ transform: t ? `translateY(${t}px)` : undefined, transition: actif ? 'none' : drag ? 'transform .18s ease' : 'none' }}
          >
            {render(it, i, {
              onPointerDown: e => start(e, i),
              onPointerMove: move,
              onPointerUp: end,
              onPointerCancel: end,
              className: 'grip',
              style: { touchAction: 'none' },
              'aria-label': 'Déplacer',
            })}
          </div>
        );
      })}
    </div>
  );
}

export function useToast() {
  const [msg, setMsg] = useState(null);
  const t = useRef();
  const show = m => { setMsg(m); clearTimeout(t.current); t.current = setTimeout(() => setMsg(null), 2200); };
  const node = msg ? <div className="toast">{msg}</div> : null;
  return [show, node];
}
