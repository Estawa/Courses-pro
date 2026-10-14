import React from 'react';
import { createRoot } from 'react-dom/client';
import Racine from './Racine.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(<Racine />);

if ('serviceWorker' in navigator && location.hostname !== 'localhost') {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
