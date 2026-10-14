// Données de départ de Courses Pro
export const PASTELS = [
  '#FFD6E0', '#FFE3C7', '#FFF3B0', '#D4F5DD', '#C6EFF3',
  '#D6E4FF', '#E6DAFF', '#FFD9F2', '#E8F5C8', '#FCE1D4',
];

export const CATEGORIES = [
  { id: 'fruits-legumes', nom: 'Fruits & légumes', emoji: '🥕', couleur: '#D4F5DD' },
  { id: 'boulangerie', nom: 'Boulangerie', emoji: '🥖', couleur: '#FFE3C7' },
  { id: 'boucherie', nom: 'Boucherie & volaille', emoji: '🥩', couleur: '#FFD6E0' },
  { id: 'poissonnerie', nom: 'Poissonnerie', emoji: '🐟', couleur: '#C6EFF3' },
  { id: 'traiteur', nom: 'Traiteur & charcuterie', emoji: '🥓', couleur: '#FCE1D4' },
  { id: 'cremerie', nom: 'Crèmerie & œufs', emoji: '🥛', couleur: '#D6E4FF' },
  { id: 'fromages', nom: 'Fromages', emoji: '🧀', couleur: '#FFF3B0' },
  { id: 'surgeles', nom: 'Surgelés', emoji: '🧊', couleur: '#C6EFF3' },
  { id: 'epicerie-salee', nom: 'Épicerie salée', emoji: '🍝', couleur: '#FFE3C7' },
  { id: 'conserves', nom: 'Conserves & sauces', emoji: '🥫', couleur: '#FFD6E0' },
  { id: 'epicerie-sucree', nom: 'Épicerie sucrée', emoji: '🍫', couleur: '#FFD9F2' },
  { id: 'petit-dej', nom: 'Petit-déjeuner', emoji: '☕', couleur: '#FCE1D4' },
  { id: 'boissons', nom: 'Boissons', emoji: '🧃', couleur: '#E8F5C8' },
  { id: 'alcools', nom: 'Vins & alcools', emoji: '🍷', couleur: '#E6DAFF' },
  { id: 'bebe', nom: 'Bébé', emoji: '🍼', couleur: '#FFD9F2' },
  { id: 'hygiene', nom: 'Hygiène & beauté', emoji: '🧴', couleur: '#E6DAFF' },
  { id: 'entretien', nom: 'Entretien', emoji: '🧽', couleur: '#D4F5DD' },
  { id: 'animaux', nom: 'Animaux', emoji: '🐾', couleur: '#FFF3B0' },
  { id: 'bazar', nom: 'Maison & bazar', emoji: '🪴', couleur: '#D6E4FF' },
  { id: 'autre', nom: 'Autre', emoji: '🛍️', couleur: '#EEE8F5' },
];

// nom | emoji | catégorie | unité
const P = `
Pommes|🍎|fruits-legumes|kg
Bananes|🍌|fruits-legumes|
Oranges|🍊|fruits-legumes|kg
Citrons|🍋|fruits-legumes|
Fraises|🍓|fruits-legumes|barquette
Raisin|🍇|fruits-legumes|
Poires|🍐|fruits-legumes|kg
Kiwis|🥝|fruits-legumes|
Tomates|🍅|fruits-legumes|kg
Carottes|🥕|fruits-legumes|kg
Pommes de terre|🥔|fruits-legumes|kg
Oignons|🧅|fruits-legumes|
Ail|🧄|fruits-legumes|
Salade|🥬|fruits-legumes|
Concombre|🥒|fruits-legumes|
Courgettes|🥒|fruits-legumes|
Poivrons|🫑|fruits-legumes|
Brocolis|🥦|fruits-legumes|
Champignons|🍄|fruits-legumes|
Avocats|🥑|fruits-legumes|
Pain|🥖|boulangerie|
Pain de mie|🍞|boulangerie|
Croissants|🥐|boulangerie|
Brioche|🍞|boulangerie|
Steak haché|🥩|boucherie|
Poulet|🍗|boucherie|
Escalopes de dinde|🍗|boucherie|
Saucisses|🌭|boucherie|
Saumon|🐟|poissonnerie|
Crevettes|🦐|poissonnerie|
Jambon|🥓|traiteur|tranches
Lardons|🥓|traiteur|
Saucisson|🍖|traiteur|
Pâte feuilletée|🥧|traiteur|
Lait|🥛|cremerie|L
Beurre|🧈|cremerie|
Œufs|🥚|cremerie|boîte
Yaourts|🥣|cremerie|pack
Crème fraîche|🥛|cremerie|
Compotes|🍏|cremerie|
Emmental râpé|🧀|fromages|
Camembert|🧀|fromages|
Comté|🧀|fromages|
Mozzarella|🧀|fromages|
Petits pois surgelés|🫛|surgeles|
Frites surgelées|🍟|surgeles|
Pizza surgelée|🍕|surgeles|
Glaces|🍨|surgeles|
Poisson pané|🐟|surgeles|
Pâtes|🍝|epicerie-salee|paquet
Riz|🍚|epicerie-salee|paquet
Semoule|🌾|epicerie-salee|
Farine|🌾|epicerie-salee|kg
Huile d'olive|🫒|epicerie-salee|
Sel|🧂|epicerie-salee|
Poivre|🧂|epicerie-salee|
Chips|🥔|epicerie-salee|
Thon en boîte|🥫|conserves|
Sauce tomate|🥫|conserves|
Ketchup|🍅|conserves|
Mayonnaise|🥚|conserves|
Moutarde|🟡|conserves|
Haricots verts|🫘|conserves|
Maïs|🌽|conserves|
Sucre|🍬|epicerie-sucree|kg
Chocolat|🍫|epicerie-sucree|tablette
Biscuits|🍪|epicerie-sucree|paquet
Confiture|🍯|petit-dej|
Pâte à tartiner|🍫|petit-dej|
Céréales|🥣|petit-dej|
Café|☕|petit-dej|
Thé|🍵|petit-dej|
Miel|🍯|petit-dej|
Eau|💧|boissons|pack
Eau pétillante|🫧|boissons|pack
Jus d'orange|🧃|boissons|L
Sirop|🧃|boissons|
Soda|🥤|boissons|
Bière|🍺|alcools|pack
Vin|🍷|alcools|bouteille
Couches|🍼|bebe|paquet
Petits pots|🍼|bebe|
Gel douche|🧴|hygiene|
Shampoing|🧴|hygiene|
Dentifrice|🪥|hygiene|
Déodorant|🧴|hygiene|
Papier toilette|🧻|hygiene|paquet
Mouchoirs|🤧|hygiene|boîte
Coton|☁️|hygiene|
Liquide vaisselle|🧽|entretien|
Pastilles lave-vaisselle|🫧|entretien|boîte
Lessive|🧺|entretien|
Essuie-tout|🧻|entretien|
Sacs poubelle|🗑️|entretien|rouleau
Éponges|🧽|entretien|
Nettoyant multi-usage|🧴|entretien|
Croquettes|🐾|animaux|sac
Pâtée|🐱|animaux|
Piles|🔋|bazar|
Ampoules|💡|bazar|
Papier aluminium|🧻|bazar|
Film alimentaire|🧻|bazar|
`;

export const PRODUITS = P.trim().split('\n').map((l, i) => {
  const [nom, emoji, cat, unite] = l.split('|');
  return { id: 'p' + (i + 1), nom, emoji, cat, unite: unite || '', suivi: false, stock: 0, min: 1 };
});

// Un magasin modèle : un rayon par catégorie, dans un ordre de parcours classique
const ORDRE_TYPE = [
  'fruits-legumes', 'boulangerie', 'boucherie', 'poissonnerie', 'traiteur', 'fromages',
  'cremerie', 'epicerie-salee', 'conserves', 'epicerie-sucree', 'petit-dej', 'boissons',
  'alcools', 'bebe', 'hygiene', 'entretien', 'animaux', 'bazar', 'surgeles', 'autre',
];

export function rayonsType(uid) {
  return ORDRE_TYPE.map((catId, i) => {
    const c = CATEGORIES.find(x => x.id === catId);
    return { id: uid(), nom: c.nom, emoji: c.emoji, repere: catId === 'autre' ? '' : `Allée ${i + 1}`, cats: [catId] };
  });
}

export const EMOJIS = [
  '🛒','🏪','🏬','🛍️','🥕','🍎','🍌','🍓','🍇','🥦','🥬','🍅','🥔','🧅','🥑','🥖','🥐','🍞',
  '🥩','🍗','🥓','🌭','🐟','🦐','🥛','🧈','🥚','🧀','🥣','🧊','🍕','🍟','🍨','🍝','🍚','🌾',
  '🫒','🧂','🥫','🌽','🍫','🍪','🍬','🍯','☕','🍵','🧃','💧','🥤','🍺','🍷','🍼','🧴','🪥',
  '🧻','🧽','🧺','🫧','🗑️','🐾','🐱','🐶','🪴','💡','🔋','🎁','🌸','⭐','❤️','🏠','🍰','🥗',
];
