export const CHANGELOG = [
  {
    version: '1.7.3',
    date: '2026-10-16',
    notes: [
      'Recettes synonymes : une recette peut avoir d\'autres noms (ex. Tarte bourdaloue = Amandine aux poires) ; la recherche les trouve sous tous leurs noms',
      '163 recettes du catalogue ont reçu leurs autres noms connus (Flammekueche, Pulled pork, Œufs à la neige, Parmentier, Gazpacho, Vol-au-vent…)',
      'Fiche recette : « Aussi appelée : … » sous le titre, aussi dans le texte envoyé par WhatsApp',
      'Ajout / modification d\'une recette : champ « Autres noms » ; l\'import IA remplit aussi les autres noms et repère les doublons sous n\'importe quel nom',
    ],
  },
  {
    version: '1.7.2',
    date: '2026-10-16',
    notes: [
      'Ajout de la tarte amandine (crème d\'amande, version four et Companion) — 803 recettes au total',
    ],
  },
  {
    version: '1.7.1',
    date: '2026-10-16',
    notes: [
      'Partager l\'appli : choix avant l\'envoi entre « Sans connexion au foyer » (conseillé) et « Avec connexion au foyer »',
      'Lien sans connexion (?solo=1) : le bouton « Connexion au foyer familial » disparaît complètement chez la personne, l\'appli reste 100 % locale, y compris une fois installée sur l\'écran d\'accueil',
      'Une personne en mode solo qui repartage l\'appli envoie toujours la version sans connexion ; seul un lien d\'invitation au foyer peut lever ce mode',
      'Un téléphone déjà connecté au foyer n\'est jamais basculé en mode solo, même s\'il ouvre un lien solo',
    ],
  },
  {
    version: '1.7.0',
    date: '2026-10-16',
    notes: [
      'Calories, protéines et coût estimés par portion sur chaque recette (fiche, cartes, menus), calculés à partir des ingrédients (table de référence src/data/nutrition.js)',
      'Tri des recettes par coût, protéines, calories (léger ou copieux), note, rapidité, stock ou A-Z',
      'Onglet « Cuisiner » : un seul plat (apéritif, entrée, soupe, salade, plat principal, accompagnement, dessert, goûter) classé selon le critère choisi, ou un menu complet combinant plusieurs moments (menus tout prêts, changement d\'un seul plat, totaux par personne)',
      'Notes sur 10 par personne : la note d\'un plat est la moyenne des notes de ceux qui l\'ont goûté ; notation de chaque plat du menu après le repas',
      'Après « Je l\'ai cuisinée » / « On a mangé » : vérification du stock avant → après, validation, puis notation',
    ],
  },
  {
    version: '1.6.9',
    date: '2026-10-16',
    notes: [
      'Lots 10 et 11 de recettes : 107 nouvelles recettes, objectif atteint avec 802 recettes au total — soupes du monde (tom kha, zuppa toscana, mulligatawny, wonton, bisque, salmorejo, ajoblanco), tapas et apéritifs (gambas al ajillo, pimientos de Padrón, pan con tomate, baba ganoush, focaccia, halloumi grillé), terroirs (fondue savoyarde, aligot, truffade, croziflette, diots, tielle sétoise, grand aïoli, bourride), plats du monde (jambalaya, poulet jerk, kleftiko, piccata, kebab maison), accompagnements (caponata, patatas bravas, pommes duchesse, pommes Anna, panisses à la polenta) et desserts (paris-brest, baklava, baba au rhum, tres leches, key lime pie, nougat glacé, lamingtons)',
    ],
  },
  {
    version: '1.6.8',
    date: '2026-10-16',
    notes: [
      'Lot 9 de recettes : 75 nouvelles recettes (695 au total) — apéritifs maison (makis, taramasalata, mousse de foies de volaille, croquettes de chèvre, gaufres salées), plats du monde (rendang, bœuf aux brocolis, cevapcici, shogayaki, couscous de poisson, fish pie), volaille familiale (tourte poulet-champignons, gratin poulet-brocolis, poulet croustillant), végétarien (moussaka et bolognaise végétales, risotto aux asperges, pâtes primavera), desserts (forêt-noire, cupcakes, donuts au four, gâteau nantais, glace minute à la banane)',
    ],
  },
  {
    version: '1.6.7',
    date: '2026-10-16',
    notes: [
      'Lot 8 de recettes : 72 nouvelles recettes (620 au total) — printemps et marché (asperges mousseline, velouté de radis et fanes, romanesco, petit épeautre), poissons du quotidien (merlan moutarde, lieu citron-câpres, poisson créole, calamars à la romaine, tacos de poisson), plats uniques et one pot (poulet-chorizo, riz crevettes-chorizo, poisson et pommes de terre en un plat), végétarien italien (alla norma, puttanesca, lasagnes courgettes-pesto), pâtisseries de fête (fraisier, tropézienne, bœuf Wellington côté plats) et douceurs maison (yaourts, granola, sablés bretons, banoffee)',
    ],
  },
  {
    version: '1.6.6',
    date: '2026-10-16',
    notes: [
      'Lot 7 de recettes : 77 nouvelles recettes (548 au total) — réveillon (foie gras mi-cuit, gravlax, huîtres et moules gratinées, coquilles Saint-Jacques, porchetta, épaule d\'agneau de 7 heures), recettes de grand-mère et anti-gaspi (bœuf miroton, salade de bœuf, œufs à la tripe, potée lorraine), saveurs du monde (laksa, curry vert, piri-piri, bulgogi, carnitas, picadillo, ceviche), desserts (éclairs, mille-feuille, kouglof, gâteau magique, käsekuchen, fondue au chocolat)',
    ],
  },
  {
    version: '1.6.5',
    date: '2026-10-16',
    notes: [
      'Lot 6 de recettes : 81 nouvelles recettes (471 au total) — soupes-repas (garbure, bortsch, phở, chowder), apéritifs (tartare saumon-avocat, satay, nachos, chips de légumes, cervelle de canut), grillades d\'été (wings, poulet à la bière, échine marinée, bavette), classiques familiaux (tomates et courgettes farcies, coquillettes jambon, gâteau au chocolat de mamie), plats végétariens (burritos, galettes de quinoa, cannellonis, tofu sauté) et desserts (pain d\'épices, omelette norvégienne, bugnes, barres de céréales)',
    ],
  },
  {
    version: '1.6.4',
    date: '2026-10-16',
    notes: [
      'Lot 5 de recettes : 76 nouvelles recettes (390 au total) — menus de fête (chapon, dinde aux marrons, pintade aux choux, canard à l\'orange, filet mignon en croûte, bouchées à la reine, pavlova, sablés et truffes de Noël), apéritif et brunch (blinis, arancini, empanadas, muffins salés, œufs brouillés au saumon), cuisine d\'ailleurs (mafé, Stroganoff, boulettes suédoises, tajine d\'agneau aux pruneaux, cacio e pepe) et recettes anti-gaspi',
    ],
  },
  {
    version: '1.6.3',
    date: '2026-10-16',
    notes: [
      'Lot 4 de recettes : 82 nouvelles recettes (314 au total) — cuisine régionale (choucroute, coq au vin, daube, endives au jambon, joues de porc au cidre, pissaladière), cuisine d\'Asie (ramen, gyozas, bibimbap, katsu curry, yakitori, biryani), poissons de fête (lotte armoricaine, Saint-Jacques), nouveaux desserts (profiteroles, galette des rois, cannelés, pastéis de nata, sorbet minute au Companion)',
    ],
  },
  {
    version: '1.6.2',
    date: '2026-10-16',
    notes: [
      'Lot 3 de recettes : 86 nouvelles recettes (232 au total) — plus de poisson (dorade, truite, brandade, fish and chips, thon mi-cuit, sardines), de plats du monde (moussaka, goulash, carbonade, colombo, rougail, butter chicken, bo bun, enchiladas, ribs, pulled pork), de recettes de fête (cassoulet, navarin, bûche roulée, tarte tatin) et de desserts',
    ],
  },
  {
    version: '1.6.1',
    date: '2026-10-16',
    notes: [
      'Lot 2 de recettes : 79 nouvelles recettes (146 au total) — soupes, entrées, salades, plats du quotidien, festifs et du monde, accompagnements et desserts, avec leurs versions Companion, Cookeo, four, micro-ondes, Actifry, plaque, barbecues et plancha',
    ],
  },
  {
    version: '1.6.0',
    date: '2026-10-16',
    notes: [
      'Nouvel onglet « Recettes » : 67 recettes de départ (entrées, salades, soupes, plats, accompagnements, desserts), du quotidien, du festif et des recettes du monde, sans pois chiches, petits pois ni lentilles',
      'Chaque recette existe en plusieurs versions selon l’appareil : Companion, Cookeo, four, micro-ondes combiné, Actifry, plaque, barbecue gaz, barbecue à braises, plancha',
      'Ma cuisine : les recettes s’adaptent aux appareils cochés ; le Cookeo est prêt (« bientôt »), ses versions apparaissent dès que tu coches « Je l’ai acheté ! »',
      'Le stock maison est vérifié pour chaque ingrédient (en stock, pas assez, épuisé, à acheter) et les manquants s’ajoutent à la liste en un geste',
      'Remplacer un ingrédient : par un autre que tu as en stock, par ton choix, ou l’ajouter aux courses ; ingrédients refusés par un membre de la famille signalés',
      'Mon repas : plusieurs recettes à la fois, avec un bilan du stock pour TOUT le repas (un ingrédient utilisé dans deux recettes est additionné : le paquet de pâtes n’est plus compté deux fois)',
      '« Propose-moi » : idée de repas complet (entrée, plat, dessert…) choisie d’après le stock, chaque plat retenu « consommant » le stock avant de choisir le suivant',
      'Planning du repas : heure de chaque étape pour que tout soit prêt à l’heure du repas, avec alertes si un appareil est pris deux fois ou si deux tâches sont à surveiller en même temps',
      'Après la cuisson, « On a mangé ! » retire du stock ce qui a été utilisé (modifiable) et propose de racheter ce qui passe sous le seuil',
      'Ajouter une recette avec une IA : l’appli prépare la consigne (photo d’une recette papier, capture, fichier ou idée), avec conseils de prise de vue, puis importe la réponse de l’IA (texte collé ou fichier .json)',
      'Saisie manuelle d’une recette, modification de ses recettes, « Ma version » d’une recette du catalogue',
      'Note sur 5 étoiles, commentaire et photo pour chaque recette (photos partagées dans le foyer), nombre de fois cuisinée',
      'Envoi d’une recette par WhatsApp ou en fichier, recettes masquables',
      'Onglet Maison : contenance d’une unité (ex : 500 Gr pour un paquet de pâtes) pour des calculs de stock précis',
    ],
  },
  {
    version: '1.5.0',
    date: '2026-10-15',
    notes: [
      'Envoi d’une liste par WhatsApp (depuis Mes listes ou la liste du jour) : retouche des articles et quantités avant l’envoi, aperçu du message, modifiable aussi dans WhatsApp',
      'Réception d’une liste : choix « Liste du jour » ou « Mes listes », avec mise à jour de la liste du même nom (repérée dans le message) ou création d’une nouvelle',
      'Le texte reçu reste modifiable avant l’import (ajouter, retirer, changer une quantité)',
      'Nouveau bouton « Recevoir une liste » dans l’onglet Listes',
      'Lecture des quantités améliorée : « 500 Gr farine », « Farine : 500 g », « Coca (1,5 L) », « Beurre 250 gr » (unités Kg / Gr / Cl / L)',
    ],
  },
  {
    version: '1.4.1',
    date: '2026-10-15',
    notes: [
      'Choix de l’unité à côté de la quantité : Kg, Gr, Cl ou L (à l’ajout d’un article et dans la liste du jour)',
      'Un article ajouté deux fois avec la même unité s’additionne (500 Gr + 250 Gr = 750 Gr)',
      'Fiche article de la maison : unités Kg / Gr / Cl / L en un geste',
    ],
  },
  {
    version: '1.4.0',
    date: '2026-10-15',
    notes: [
      'L’appli démarre sans réseau : le foyer est mémorisé sur le téléphone et tous les fichiers de l’appli sont gardés en cache dès l’installation',
      'Réseau faible au magasin : au bout de 3 secondes sans réponse, l’appli s’ouvre avec la version enregistrée',
      'Rayons protégés : modifier un magasin n’envoie plus que ce qui a changé, un téléphone pas à jour ne peut plus effacer les rayons créés sur un autre',
      'Nouveaux rayons dans ton magasin : Bio Legumes - Fruits, Bio Conserves, Bio Jus, Bio Frais, Bio Crèmerie, Bio Sauces et Apero (ajoutés en fin de parcours, à déplacer comme tu veux)',
      'Copie automatique des données chaque jour sur le téléphone (10 derniers jours), restaurable depuis le menu',
    ],
  },
  {
    version: '1.3.1',
    date: '2026-10-14',
    notes: [
      'Base commune branchée sur le projet Firebase vma-pro-seances (connexion Google / e-mail, règles de sécurité publiées)',
    ],
  },
  {
    version: '1.3.0',
    date: '2026-10-14',
    notes: [
      'Nombre de rayons illimité + nouveau modèle « Hypermarché type » (41 rayons, articles déjà placés)',
      'Partage de l’organisation d’un magasin par WhatsApp (lien ou message à copier) : rayons, repères, catégories et articles placés',
      'Import d’une organisation reçue avec aperçu modifiable : garder/écarter des rayons, réordonner, renommer, retirer des articles, repérer les rayons qui existent déjà chez toi',
      'Import en nouveau magasin ou en remplacement des rayons d’un magasin existant (en gardant tes articles placés dans les rayons de même nom)',
      'Nouvel onglet « Aperçu » dans chaque magasin : tous les rayons avec tous leurs articles',
    ],
  },
  {
    version: '1.2.0',
    date: '2026-10-14',
    notes: [
      'Appli partagée = 100 % locale : sans connexion au foyer, rien n’est envoyé à Firebase',
      'Connexion au foyer familial discrète (en bas du menu) ou par lien d’invitation ; seul le compte de Christophe peut créer le foyer (vérifié aussi par les règles Firebase)',
      'Rayons personnalisés : à la création, la fiche du rayon s’ouvre pour y ranger des articles (existants ou nouveaux)',
      'Fiche rayon : section « Articles rangés ici » (ajout, création d’article, retrait)',
      'Fiche article : choix du rayon dans chaque magasin',
      'Nouvel article ajouté à la liste : l’appli demande tout de suite dans quel rayon le trouver (ou créer un rayon)',
    ],
  },
  {
    version: '1.1.0',
    date: '2026-10-14',
    notes: [
      'Base de données commune Firebase : un « foyer » partagé, synchronisé en temps réel entre plusieurs téléphones',
      'Connexion par Google ou par e-mail / mot de passe',
      'Invitation par code à 6 caractères ou par lien envoyé sur WhatsApp, changement de code possible',
      'Gestion des membres du foyer (voir, retirer, quitter), déconnexion',
      'Règles de sécurité : seuls les membres connectés d’un foyer peuvent lire ou écrire ses données',
      'Bouton « Partager l’appli » pour qu’un autre foyer l’utilise avec ses propres données',
      'Reprise des données déjà présentes sur le téléphone lors de la création du foyer',
      'Fonctionne aussi hors connexion (cache local), mode sans compte toujours possible',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-10-14',
    notes: [
      'Première version de Courses Pro 🎉',
      'Magasins favoris avec rayons modélisés dans l’ordre de parcours (glisser-déposer, flèches, repères d’allée)',
      'Plan rapide catégorie → rayon pour suivre les réorganisations des magasins',
      'Articles placés à la main dans un rayon précis, directement depuis le magasin (bouton 📍)',
      'Listes reçues sur WhatsApp (partage direct sur Android, coller sur iPhone) : ce qui est déjà en stock à la maison ou déjà sur la liste n’est pas importé',
      'Recherche « combien il m’en reste » dans l’onglet Maison + stock affiché dans les suggestions',
      'Liste du jour triée selon le parcours du magasin choisi + mode « au magasin » avec cases à cocher',
      'Mes listes : créer, coller une liste existante (quantités reconnues), ajouter en un geste',
      'Stock maison : seuils d’alerte, suggestions de rachat, mise à jour automatique après la caisse',
      'Dépenses : montant à chaque passage en caisse, budget mensuel, graphiques 12 mois et par magasin',
      'Sauvegarde / restauration (fichier JSON), mode jour / nuit, installable sur le téléphone',
    ],
  },
];
