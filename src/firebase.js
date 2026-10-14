// Configuration Firebase de Courses Pro.
// Colle ici la config de l'appli Web (Console Firebase > Paramètres du projet > Vos applications).
// Tant que apiKey vaut "A_REMPLACER", l'appli fonctionne en mode local (sans base partagée).
// Une config Firebase Web n'est pas un secret : la protection vient des règles (firestore.rules) et de la connexion.
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'A_REMPLACER',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

export const cloudConfigure = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== 'A_REMPLACER';
