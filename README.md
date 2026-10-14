# Courses Pro by C. Guilhem

Appli de courses (PWA installable) : liste du jour triée dans l'ordre des rayons du magasin choisi,
magasins favoris modélisés rayon par rayon, listes enregistrées, réception de listes WhatsApp,
stock maison avec suggestions de rachat, suivi des dépenses après chaque passage en caisse.

## Stack
React 18 + Vite 5, CSS maison (thème pastel jour/nuit), aucune autre dépendance.
Données enregistrées sur le téléphone (localStorage) — sauvegarde/restauration JSON via le menu ⋯.
Pas de Firebase (aucun nouveau projet nécessaire).

## Déploiement (comme les autres applis)
1. Créer le dépôt GitHub `Estawa/Courses-Pro` et y envoyer le contenu de ce dossier.
2. Sur Vercel : « Add New Project » → importer le dépôt → framework détecté : Vite → Deploy.
3. Sur le téléphone, ouvrir l'adresse Vercel puis « Ajouter à l'écran d'accueil ».

## Recevoir une liste depuis WhatsApp
- Android (appli installée depuis Chrome) : appui long sur le message → Partager → Courses Pro.
- iPhone : appui long → Copier, puis dans l'appli « Liste reçue 💬 » → « Coller depuis le presse-papiers ».
Les articles déjà en stock à la maison ou déjà sur la liste sont mis de côté (touchables pour les ajouter quand même).

## Développement local
npm install
npm run dev
