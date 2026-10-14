// Configuration Firebase de Courses Pro.
// Colle ici la config de l'appli Web (Console Firebase > Paramètres du projet > Vos applications).
// Projet Firebase : vma-pro-seances (partagé avec VMA Pro ; données rangées dans coursesPro_…).
// Une config Firebase Web n'est pas un secret : la protection vient des règles (firestore.rules) et de la connexion.
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDqRihpVWPqmw54T6X6zx3PS3F92Wol3Bg',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'vma-pro-seances.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'vma-pro-seances',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'vma-pro-seances.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '378967245770',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:378967245770:web:668b5f0f7251ec8a124533',
};

export const cloudConfigure = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== 'A_REMPLACER';
