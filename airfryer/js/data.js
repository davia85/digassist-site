/* ============================================================
   Dream Tasty — Base de données de cuisson
   Réglée pour le Dreame Tasti (airfryer 1 bac, 60–200 °C, 1500 W)
   Modèle : UN seul bac, UNE seule température par cuisson.
   Recettes ultra détaillées. Épices adaptatives (placard).
   Tout est HALAL (ni porc, ni alcool).
   ============================================================ */

const APPLIANCE = {
  name: "Dreame Tasti",
  tempMin: 60,
  tempMax: 200,
  tempSteps: [140, 150, 160, 170, 175, 180, 185, 190, 195, 200],
  programs: ["AirFry", "Roast", "Broil", "Keep Warm", "Reheat"],
};

/* Facteurs de TAILLE des morceaux — LE réglage qui change tout.
   Le temps de cuisson dépend surtout de la grosseur des morceaux.
   Les féculents (denses) sont les plus sensibles. */
const SIZE_FACTORS = {
  feculent: { petit: 0.78, moyen: 1.0, gros: 1.5 },
  proteine: { petit: 0.82, moyen: 1.0, gros: 1.35 },
  legume:   { petit: 0.85, moyen: 1.0, gros: 1.28 },
};
/* Ingrédients dont la taille change vraiment le temps (on propose le réglage). */
const SIZE_SENSITIVE = [
  "pdt_amandine", "pdt_frites", "pdt_quartiers", "patate_douce",
  "carotte", "panais", "aubergine", "courgette", "chou_fleur", "brocoli",
  "escalope_poulet", "cuisse_poulet", "tofu", "boeuf_hache", "kefta", "halloumi",
];

/* État FRAIS / SURGELÉ — surtout pour viandes et poissons.
   Surgelé = cuisson depuis l'état congelé, plus longue. */
const STATE_FACTORS = { frais: 1.0, surgele: 1.55 };
const STATE_SENSITIVE = [
  "escalope_poulet", "aiguillettes", "cuisse_poulet", "boeuf_hache",
  "merguez", "saucisse_volaille", "saumon", "cabillaud", "crevettes",
];

/* Légumes secs proposés en SEC ou EN CONSERVE (cuisson très différente). */
const FORME_SENSITIVE = ["lentilles", "pois_chiches", "haricots_rouges"];
const FORME_DEFAULT = "conserve";
/* Repères de taille lisibles par ingrédient (affichés dans la prep). */
const SIZE_LABELS = {
  feculent: { petit: "petits dés / fines frites (~1 cm)", moyen: "morceaux moyens (~2-3 cm)", gros: "gros morceaux / coupés en 2 seulement (4 cm+)" },
  proteine: { petit: "fines lanières / petits morceaux", moyen: "portion normale (~2 cm d'épaisseur)", gros: "pièce épaisse / entière" },
  legume:   { petit: "petits morceaux fins", moyen: "morceaux moyens (~2 cm)", gros: "gros morceaux épais" },
};

/* ------------------------------------------------------------
   ÉPICES & CONDIMENTS (ton placard)
   L'utilisateur coche ce qu'il possède ; le moteur compose les
   mélanges à partir de cette liste, par ordre de priorité.
   base:true  = presque tout le monde en a (coché par défaut)
   ------------------------------------------------------------ */
const SPICES = [
  { id:"sel",            nom:"Sel",                 emoji:"🧂", base:true,  dose:"" },
  { id:"poivre",         nom:"Poivre",              emoji:"⚫", base:true,  dose:"" },
  { id:"huile_olive",    nom:"Huile d'olive",       emoji:"🫒", base:true,  dose:"1 c. à s." },
  { id:"ail",            nom:"Ail (poudre ou frais)",emoji:"🧄", base:true,  dose:"1 c. à c." },
  { id:"paprika",        nom:"Paprika",             emoji:"🌶️", base:true,  dose:"1 c. à c." },
  { id:"paprika_fume",   nom:"Paprika fumé",        emoji:"🔥", base:false, dose:"1 c. à c." },
  { id:"cumin",          nom:"Cumin",               emoji:"🟤", base:false, dose:"1/2 c. à c." },
  { id:"curcuma",        nom:"Curcuma",             emoji:"🟡", base:false, dose:"1/2 c. à c." },
  { id:"curry",          nom:"Curry",               emoji:"🍛", base:false, dose:"1 c. à c." },
  { id:"herbes_provence",nom:"Herbes de Provence",  emoji:"🌿", base:true,  dose:"1 c. à c." },
  { id:"thym",           nom:"Thym",                emoji:"🌿", base:false, dose:"1 pincée" },
  { id:"romarin",        nom:"Romarin",             emoji:"🌿", base:false, dose:"1 pincée" },
  { id:"origan",         nom:"Origan",              emoji:"🌿", base:false, dose:"1 c. à c." },
  { id:"gingembre",      nom:"Gingembre",           emoji:"🫚", base:false, dose:"1/2 c. à c." },
  { id:"piment",         nom:"Piment / chili",      emoji:"🌶️", base:false, dose:"1 pincée" },
  { id:"ras_el_hanout",  nom:"Ras el hanout",       emoji:"🧡", base:false, dose:"1 c. à c." },
  { id:"tagine",         nom:"Épices tagine",       emoji:"🍲", base:false, dose:"1 c. à c." },
  { id:"colombo",        nom:"Colombo",             emoji:"🟠", base:false, dose:"1 c. à c." },
  { id:"citron",         nom:"Citron",              emoji:"🍋", base:true,  dose:"un filet" },
  { id:"sauce_soja",     nom:"Sauce soja",          emoji:"🍶", base:false, dose:"1 c. à s." },
  { id:"miel",           nom:"Miel",                emoji:"🍯", base:false, dose:"1 c. à c." },
  { id:"moutarde",       nom:"Moutarde",            emoji:"🟨", base:false, dose:"1 c. à c." },
  { id:"sesame",         nom:"Graines de sésame",   emoji:"⚪", base:false, dose:"1 c. à c." },
  { id:"maizena",        nom:"Maïzena",             emoji:"🌽", base:false, dose:"1 c. à s." },
  { id:"bouillon_volaille", nom:"Bouillon de volaille", emoji:"🍗", base:true,  dose:"1 cube" },
  { id:"bouillon_boeuf",    nom:"Bouillon de bœuf",     emoji:"🐄", base:false, dose:"1 cube" },
  { id:"bouillon_legumes",  nom:"Bouillon de légumes",  emoji:"🥕", base:false, dose:"1 cube" },
];

/* ------------------------------------------------------------
   INGRÉDIENTS — chaque fiche est calibrée airfryer + ultra détaillée
   temp     : température idéale (°C)
   time     : temps de cuisson (min) à cette température
   shake    : intervalle (min) entre 2 secousses (0 = ne pas remuer)
   coupe    : LA découpe conseillée (le détail que tu demandes)
   coupeAlt : découpe alternative (optionnel)
   sechage  : conseil de séchage (null si inutile)
   humide   : true si l'ingrédient rejette de la vapeur (ramollit les féculents)
   croustille : true si l'ingrédient DOIT rester croustillant (on le protège)
   astuce   : conseil de chef
   epices   : épices idéales, par ordre de priorité (ids de SPICES)
   ------------------------------------------------------------ */
const INGREDIENTS = [
  // ---------- FÉCULENTS ----------
  { id:"pdt_amandine", nom:"Pommes de terre amandines / grenailles", emoji:"🥔", tag:"feculent",
    temp:190, time:24, shake:8, program:"AirFry", qtyHint:"~250 g (1 grosse poignée) / pers.",
    coupe:"Coupées en 2 si petites (~3 cm). Dès qu'elles sont un peu grosses, coupe-les en 4 (ou en cubes de 2-3 cm) : sinon le cœur reste cru. Régularité = cuisson régulière.",
    coupeAlt:"Astuce : mieux vaut des morceaux réguliers de 2-3 cm que des demi-pommes de terre grosses.",
    sechage:"Lave, puis sèche bien au torchon. Astuce top : 10 min dans l'eau froide puis re-sécher (enlève l'amidon = plus croustillant).",
    humide:false, croustille:true,
    astuce:"Une seule couche dans le bac, pas empilées, sinon elles cuisent à la vapeur.",
    epices:["paprika_fume","ail","thym","romarin","paprika","origan"] },

  { id:"pdt_frites", nom:"Pommes de terre en frites", emoji:"🍟", tag:"feculent",
    temp:190, time:26, shake:8, program:"AirFry", qtyHint:"1 grosse pdt / pers.",
    coupe:"Bâtonnets réguliers de ~1 cm d'épaisseur.",
    coupeAlt:"Plus fins (0,5 cm) = plus croustillant mais surveille (brûle vite).",
    sechage:"Trempe 15 min dans l'eau froide, puis SÈCHE très bien. Étape clé du croustillant.",
    humide:false, croustille:true,
    astuce:"Pas plus d'une couche et demie, secoue à mi-cuisson.",
    epices:["paprika","ail","paprika_fume","origan"] },

  { id:"pdt_quartiers", nom:"Pommes de terre en quartiers", emoji:"🥔", tag:"feculent",
    temp:190, time:25, shake:10, program:"AirFry", qtyHint:"2 pdt moyennes / pers.",
    coupe:"En quartiers (6-8 morceaux par pomme de terre), gardés avec la peau.",
    sechage:"Sèche bien après lavage.",
    humide:false, croustille:true,
    astuce:"Pose-les côté peau en bas au départ, elles se tiennent mieux.",
    epices:["paprika_fume","ail","romarin","thym","paprika"] },

  { id:"patate_douce", nom:"Patate douce", emoji:"🍠", tag:"feculent",
    temp:190, time:20, shake:9, program:"AirFry", qtyHint:"1/2 patate douce / pers.",
    coupe:"En frites épaisses (1,5 cm) ou en cubes. Elle reste plus tendre que la pdt.",
    sechage:"Sèche bien ; huile un peu plus qu'une pdt classique.",
    humide:false, croustille:true,
    astuce:"Elle caramélise vite : baisse un peu si ça fonce trop.",
    epices:["paprika_fume","cumin","ail","piment"] },

  { id:"potatoes_surgele", nom:"Frites / potatoes surgelées", emoji:"🍟", tag:"feculent",
    temp:200, time:16, shake:8, program:"AirFry", qtyHint:"1 grosse poignée / pers.",
    coupe:"Aucune découpe : direct du congélateur, sans décongeler.",
    sechage:null,
    humide:false, croustille:true,
    astuce:"Ne pas huiler (déjà pré-frites). Secoue à mi-cuisson.",
    epices:["paprika","sel"] },

  // ---------- PROTÉINES (halal) ----------
  { id:"escalope_poulet", nom:"Escalope de poulet", emoji:"🍗", tag:"proteine",
    temp:185, time:14, shake:7, program:"AirFry", qtyHint:"1 escalope ~150 g / pers.",
    coupe:"Entière ; si épaisse (>2 cm), ouvre-la en 2 dans l'épaisseur pour une cuisson régulière.",
    coupeAlt:"En lanières = cuit en ~10 min.",
    sechage:"Tamponne au papier absorbant AVANT d'huiler : poulet sec + huile = poulet doré (l'eau, elle, empêche de dorer).",
    humide:true, croustille:false,
    marinade:"Mélange les épices avec 1 bonne c. à s. d'huile d'olive et enrobe toute l'escalope (idéal : 10 min avant, mais direct ça marche aussi).",
    finition:"3 dernières min à 200° pour dorer. À la sortie : noisette de beurre + filet de citron = fondant et gourmand.",
    astuce:"Ne surcuis pas (chair blanche, jus clair) sinon ça sèche. Un peu de miel dans la marinade = joli doré.",
    epices:["paprika","ail","cumin","paprika_fume","herbes_provence","miel","citron"] },

  { id:"aiguillettes", nom:"Aiguillettes de poulet", emoji:"🍗", tag:"proteine",
    temp:185, time:11, shake:6, program:"AirFry", qtyHint:"5-6 aiguillettes / pers.",
    coupe:"Telles quelles. Pour version panée : œuf battu puis chapelure.",
    sechage:"Tamponne avant d'huiler.",
    humide:true, croustille:false,
    marinade:"Épices + 1 c. à s. d'huile, enrobe bien. Version dorée express !",
    finition:"2 dernières min à 200°. Un filet de miel + citron à la sortie.",
    astuce:"Espace-les, ne les colle pas, sinon elles se soudent (et ne dorent pas).",
    epices:["paprika","ail","curry","paprika_fume","miel","citron"] },

  { id:"cuisse_poulet", nom:"Cuisse / pilon de poulet", emoji:"🍗", tag:"proteine",
    temp:190, time:24, shake:12, program:"AirFry", qtyHint:"2 pilons / pers.",
    coupe:"Entiers, avec la peau. Entaille la chair jusqu'à l'os pour cuire à cœur.",
    sechage:"Sèche la peau puis huile-la : peau sèche + huile = peau croustillante et dorée.",
    humide:true, croustille:false,
    marinade:"Épices + huile massées sur toute la peau et sous la peau si tu peux.",
    finition:"5 dernières min : badigeonne de laque miel + moutarde + un peu de sauce soja, ça caramélise et brille.",
    astuce:"Peau vers le haut au départ. Entaille jusqu'à l'os pour cuire à cœur.",
    epices:["paprika_fume","ail","thym","ras_el_hanout","miel","moutarde"] },

  { id:"boeuf_hache", nom:"Boulettes de bœuf", emoji:"🧆", tag:"proteine",
    temp:180, time:13, shake:7, program:"AirFry", qtyHint:"4-5 boulettes / pers.",
    coupe:"Boulettes de ~3 cm, bien serrées à la main.",
    sechage:null,
    humide:true, croustille:false,
    marinade:"Mélange épices + 1 filet d'huile DANS la viande avant de former les boulettes = goût partout.",
    finition:"2 dernières min à 200° pour une belle croûte dorée.",
    astuce:"1 c. à c. de moutarde dans la viande = boulettes moelleuses et goûteuses.",
    epices:["ail","cumin","paprika","paprika_fume","origan"] },

  { id:"kefta", nom:"Kefta (haché épicé)", emoji:"🧆", tag:"proteine",
    temp:185, time:12, shake:6, program:"AirFry", qtyHint:"3-4 kefta / pers.",
    coupe:"Petits boudins allongés autour d'un pic (ou à la main).",
    sechage:null,
    humide:true, croustille:false,
    marinade:"Épices + filet d'huile bien malaxés dans la viande.",
    finition:"2 dernières min à 200°. Sers avec un filet de citron et de la sauce blanche/yaourt-ail.",
    astuce:"Malaxe bien 1 min : la viande devient collante = kefta qui se tiennent.",
    epices:["cumin","paprika","ail","ras_el_hanout"] },

  { id:"merguez", nom:"Merguez", emoji:"🌭", tag:"proteine",
    temp:180, time:13, shake:6, program:"AirFry", qtyHint:"2-3 merguez / pers.",
    coupe:"Entières, pique-les 2-3 fois avec une fourchette.",
    sechage:null,
    humide:true, croustille:false,
    astuce:"Déjà épicées : pas besoin d'assaisonner. Un jus de citron à la fin.",
    epices:["piment"] },

  { id:"saumon", nom:"Pavé de saumon", emoji:"🐟", tag:"proteine",
    temp:180, time:11, shake:0, program:"AirFry", qtyHint:"1 pavé ~130 g / pers.",
    coupe:"Pavé entier, côté peau en bas.",
    sechage:"Tamponne la surface pour qu'il dore.",
    humide:true, croustille:false,
    marinade:"Huile d'olive + citron + ail + herbes badigeonnés sur le pavé.",
    finition:"Un peu de miel + moutarde badigeonné à mi-cuisson = saumon laqué délicieux. Un peu d'aneth à la sortie.",
    astuce:"Ne pas remuer, il s'effrite. Prêt quand il s'effeuille à la fourchette.",
    epices:["citron","ail","thym","miel","herbes_provence","paprika"] },

  { id:"cabillaud", nom:"Dos de cabillaud", emoji:"🐟", tag:"proteine",
    temp:180, time:12, shake:0, program:"AirFry", qtyHint:"1 dos / pers.",
    coupe:"Entier. Pose sur un papier cuisson huilé (il est fragile).",
    sechage:"Tamponne bien.",
    humide:true, croustille:false,
    astuce:"Ne pas remuer. Chair opaque = c'est cuit.",
    epices:["citron","ail","curcuma","curry"] },

  { id:"crevettes", nom:"Crevettes décortiquées", emoji:"🍤", tag:"proteine",
    temp:180, time:8, shake:4, program:"AirFry", qtyHint:"1 poignée / pers.",
    coupe:"Décortiquées, crues. Bien égouttées si surgelées/décongelées.",
    sechage:"Sèche-les, sinon elles rendent de l'eau.",
    humide:true, croustille:false,
    marinade:"Ail écrasé + huile d'olive + piment + citron, mélange bien (façon crevettes à l'ail).",
    finition:"À la sortie : filet de citron. Une noisette de beurre à l'ail = gourmand.",
    astuce:"Cuisson rapide ! Prêtes quand elles sont roses et recourbées. Ne les oublie pas.",
    epices:["ail","piment","citron","paprika"] },

  { id:"tofu", nom:"Tofu ferme", emoji:"🧈", tag:"proteine",
    temp:190, time:15, shake:7, program:"AirFry", qtyHint:"1/2 bloc / pers.",
    coupe:"En cubes de ~2 cm.",
    sechage:"Presse le tofu 10 min sous un poids (chasse l'eau) puis enrobe de maïzena = croustillant.",
    humide:false, croustille:true,
    marinade:"Sauce soja + ail + gingembre + 1 c. à s. de maïzena + huile : enrobe = croûte croustillante.",
    finition:"À la sortie : sésame + un trait de sauce soja/miel. Croustillant garanti.",
    astuce:"Bien presser le tofu avant = il boit la marinade et devient croustillant.",
    epices:["sauce_soja","ail","gingembre","sesame","curry","paprika_fume"] },

  { id:"halloumi", nom:"Halloumi", emoji:"🧀", tag:"proteine",
    temp:190, time:9, shake:5, program:"AirFry", qtyHint:"4-5 tranches / pers.",
    coupe:"Tranches de ~1 cm.",
    sechage:"Tamponne, un filet d'huile.",
    humide:false, croustille:true,
    finition:"À la sortie : miel + origan + citron = halloumi doré sucré-salé irrésistible.",
    astuce:"Ne pas saler (déjà salé). Doré dehors, fondant dedans.",
    epices:["origan","thym","poivre","piment"] },

  { id:"oeufs", nom:"Œufs durs (en coquille)", emoji:"🥚", tag:"proteine",
    temp:150, time:13, shake:0, program:"AirFry", qtyHint:"2-3 œufs / pers.",
    coupe:"Entiers, dans leur coquille, posés au fond.",
    sechage:null,
    humide:false, croustille:false,
    astuce:"13 min = durs. Plonge-les dans l'eau froide après pour les écaler facilement.",
    epices:["sel","poivre"] },

  // ---------- LÉGUMES ----------
  { id:"courgette", nom:"Courgette", emoji:"🥒", tag:"legume",
    temp:180, time:14, shake:7, program:"AirFry", qtyHint:"1/2 courgette / pers.",
    coupe:"Rondelles de ~1 cm ou bâtonnets.",
    sechage:"Elle contient de l'eau : ne la coupe pas trop fine.",
    humide:true, croustille:false,
    astuce:"Un peu d'huile suffit, elle dore joliment.",
    epices:["ail","herbes_provence","thym","origan","paprika"] },

  { id:"poivron", nom:"Poivron", emoji:"🫑", tag:"legume",
    temp:180, time:13, shake:7, program:"AirFry", qtyHint:"1 poivron / pers.",
    coupe:"En lanières de ~1,5 cm.",
    sechage:null,
    humide:false, croustille:false,
    astuce:"Mélange les couleurs pour le visuel.",
    epices:["ail","origan","cumin","paprika"] },

  { id:"brocoli", nom:"Brocoli", emoji:"🥦", tag:"legume",
    temp:180, time:13, shake:7, program:"AirFry", qtyHint:"1/2 tête / pers.",
    coupe:"En petites fleurettes régulières.",
    sechage:"Bien sécher après lavage.",
    humide:false, croustille:false,
    astuce:"Les pointes deviennent croustillantes : c'est normal et bon.",
    epices:["ail","sesame","piment","citron"] },

  { id:"chou_fleur", nom:"Chou-fleur", emoji:"🥬", tag:"legume",
    temp:185, time:15, shake:7, program:"AirFry", qtyHint:"1/2 tête / pers.",
    coupe:"En fleurettes régulières.",
    sechage:"Bien sécher.",
    humide:false, croustille:false,
    astuce:"Curcuma + cumin = version rôtie qui déchire.",
    epices:["cumin","curcuma","curry","paprika","ail"] },

  { id:"carotte", nom:"Carottes", emoji:"🥕", tag:"legume",
    temp:190, time:18, shake:9, program:"AirFry", qtyHint:"2 carottes / pers.",
    coupe:"En bâtonnets ou biseaux de ~1 cm.",
    sechage:null,
    humide:false, croustille:false,
    astuce:"Un filet de miel en fin de cuisson = carottes glacées.",
    epices:["miel","cumin","thym"] },

  { id:"champignon", nom:"Champignons", emoji:"🍄", tag:"legume",
    temp:180, time:11, shake:5, program:"AirFry", qtyHint:"1 poignée / pers.",
    coupe:"Émincés ou en 2 (petits entiers).",
    sechage:"Ne PAS les laver à l'eau (ils la boivent) : brosse-les.",
    humide:true, croustille:false,
    astuce:"Ils réduisent beaucoup : mets-en plus que tu crois.",
    epices:["ail","thym","poivre"] },

  { id:"tomate_cerise", nom:"Tomates cerises", emoji:"🍅", tag:"legume",
    temp:180, time:9, shake:0, program:"AirFry", qtyHint:"1 poignée / pers.",
    coupe:"Entières (elles éclatent et confisent).",
    sechage:null,
    humide:true, croustille:false,
    astuce:"Parfaites pour accompagner poisson et halloumi.",
    epices:["origan","ail","thym"] },

  { id:"aubergine", nom:"Aubergine", emoji:"🍆", tag:"legume",
    temp:185, time:15, shake:7, program:"AirFry", qtyHint:"1/2 aubergine / pers.",
    coupe:"En cubes de ~2 cm.",
    sechage:"Sale-la 10 min, éponge l'eau, PUIS huile (sinon elle boit tout).",
    humide:true, croustille:false,
    astuce:"Elle a soif d'huile : huile généreusement mais après dégorgeage.",
    epices:["ail","cumin","ras_el_hanout","origan"] },

  { id:"haricot_vert", nom:"Haricots verts", emoji:"🫛", tag:"legume",
    temp:180, time:12, shake:6, program:"AirFry", qtyHint:"1 poignée / pers.",
    coupe:"Équeutés, entiers.",
    sechage:"Bien sécher.",
    humide:false, croustille:false,
    astuce:"Ail + un peu d'huile, ils restent croquants.",
    epices:["ail","citron","thym"] },

  { id:"asperge", nom:"Asperges vertes", emoji:"🥬", tag:"legume",
    temp:180, time:10, shake:5, program:"AirFry", qtyHint:"1 botte fine / pers.",
    coupe:"Entières, coupe le bout dur.",
    sechage:null,
    humide:false, croustille:false,
    astuce:"Cuisson rapide, surveille : elles doivent rester fermes.",
    epices:["ail","citron","poivre"] },

  { id:"legumes_surgele", nom:"Légumes surgelés (mélange)", emoji:"🥗", tag:"legume",
    temp:190, time:15, shake:7, program:"AirFry", qtyHint:"1 poignée / pers.",
    coupe:"Direct du congélateur, sans décongeler.",
    sechage:null,
    humide:true, croustille:false,
    astuce:"Un filet d'huile + secoue bien à mi-cuisson.",
    epices:["ail","herbes_provence","paprika"] },

  { id:"mais", nom:"Maïs (épi)", emoji:"🌽", tag:"legume",
    temp:190, time:13, shake:6, program:"AirFry", qtyHint:"1 épi / pers.",
    coupe:"Épi entier ou en tronçons.",
    sechage:null,
    humide:false, croustille:false,
    astuce:"Badigeonne d'huile, il grille et se colore.",
    epices:["paprika_fume","piment","ail"] },

  { id:"panais", nom:"Panais", emoji:"🥕", tag:"legume",
    temp:190, time:18, shake:9, program:"AirFry", qtyHint:"1 panais / pers.",
    coupe:"En bâtonnets comme des frites.",
    sechage:null,
    humide:false, croustille:true,
    astuce:"Plus sucré que la carotte, super avec du thym.",
    epices:["thym","miel","cumin"] },

  // ---------- RIZ, PÂTES & LÉGUMES SECS ----------
  // (le riz/pâtes/lentilles crus se cuisent à l'eau, pas à l'airfryer :
  //  l'appli les prépare "à côté" pour un repas complet et synchronisé)
  { id:"riz_blanc", nom:"Riz (cru)", emoji:"🍚", tag:"accompagnement", methode:"casserole",
    temp:0, time:14, shake:0, program:"Casserole", qtyHint:"60-80 g cru / pers.",
    coupe:null, sechage:null, humide:false, croustille:false, epices:[],
    casserole:{
      temps:"~12-15 min",
      liquide:"1 volume de riz pour 2 volumes d'eau (ou de bouillon)",
      bouillon:"Remplace l'eau par du bouillon (volaille/légumes) = riz parfumé, idéal façon pot-au-feu.",
      etapes:[
        "Rince le riz. Mets-le dans une casserole avec 2 fois son volume d'eau (ou bouillon) + une pincée de sel.",
        "Porte à ébullition, baisse à feu doux et couvre.",
        "Laisse ~12-15 min jusqu'à absorption complète, sans remuer. Coupe le feu, laisse gonfler 5 min.",
      ],
    } },

  { id:"pates", nom:"Pâtes (crues)", emoji:"🍝", tag:"accompagnement", methode:"casserole",
    temp:0, time:10, shake:0, program:"Casserole", qtyHint:"80-100 g crues / pers.",
    coupe:null, sechage:null, humide:false, croustille:false, epices:[],
    casserole:{
      temps:"selon le paquet (~8-11 min)",
      liquide:"grand volume d'eau bouillante salée",
      bouillon:null,
      etapes:[
        "Porte une grande casserole d'eau salée à ébullition.",
        "Plonge les pâtes, remue au début pour qu'elles ne collent pas.",
        "Cuis le temps indiqué sur le paquet (goûte 1 min avant la fin), puis égoutte.",
      ],
    } },

  { id:"lentilles", nom:"Lentilles", emoji:"🫘", tag:"accompagnement", methode:"casserole",
    formes:{
      conserve:{ qty:"1/2 boîte / pers.", temps:"~5 min (déjà cuites)",
        liquide:"un peu d'eau ou de bouillon",
        bouillon:"Réchauffe-les dans du bouillon + thym = façon petit salé, plein de goût.",
        etapes:[
          "Égoutte et rince les lentilles en conserve.",
          "Réchauffe 5 min à feu doux avec un peu de bouillon (ou d'eau) + thym.",
          "Sale/poivre en fin, filet d'huile d'olive à la sortie.",
        ] },
      sec:{ qty:"60-80 g crues / pers.", temps:"~20-25 min",
        liquide:"3 fois leur volume d'eau ou de bouillon",
        bouillon:"Cuis-les dans du bouillon + thym + une carotte en dés = façon pot-au-feu.",
        etapes:[
          "Rince les lentilles (pas de trempage nécessaire).",
          "Casserole : 3x leur volume d'eau/bouillon. Ne sale qu'en FIN (sinon elles durcissent).",
          "Ébullition puis feu doux ~20-25 min jusqu'à tendreté. Égoutte le surplus.",
        ] },
    } },

  { id:"pois_chiches", nom:"Pois chiches", emoji:"🟡", tag:"accompagnement", methode:"casserole",
    formes:{
      conserve:{ qty:"1/2 boîte / pers.", temps:"~5 min (déjà cuits)",
        liquide:"un peu d'eau ou de bouillon",
        bouillon:"Réchauffe dans du bouillon + cumin = parfumés.",
        etapes:[
          "Égoutte et rince les pois chiches en conserve.",
          "Réchauffe 5 min à feu doux avec un peu de bouillon + cumin + paprika.",
          "🔥 Envie de croustillant ? Égoutte, sèche-les bien, huile + paprika fumé, et rôtis-les 15 min à 190° DANS l'airfryer.",
        ] },
      sec:{ qty:"60 g secs / pers.", temps:"trempage 12h + ~1h-1h30",
        liquide:"grand volume d'eau",
        bouillon:null,
        etapes:[
          "La veille : trempage 12h dans beaucoup d'eau froide.",
          "Le jour même : égoutte, couvre d'eau fraîche, ébullition puis feu doux 1h à 1h30 jusqu'à tendreté.",
          "Ne sale qu'en fin. (Plus long : préfère la conserve si tu es pressée.)",
        ] },
    } },

  { id:"haricots_rouges", nom:"Haricots rouges", emoji:"🔴", tag:"accompagnement", methode:"casserole",
    formes:{
      conserve:{ qty:"1/2 boîte / pers.", temps:"~5 min (déjà cuits)",
        liquide:"un peu d'eau ou de bouillon",
        bouillon:"Réchauffe avec bouillon + cumin + paprika (façon chili).",
        etapes:[
          "Égoutte et rince bien les haricots rouges en conserve.",
          "Réchauffe 5 min à feu doux avec un peu de bouillon + cumin + paprika.",
          "Parfait avec du riz et de la viande hachée épicée.",
        ] },
      sec:{ qty:"60 g secs / pers.", temps:"trempage 12h + ~1h",
        liquide:"grand volume d'eau",
        bouillon:null,
        etapes:[
          "La veille : trempage 12h dans beaucoup d'eau froide.",
          "⚠️ Important : égoutte, couvre d'eau fraîche et fais BOUILLIR FORT au moins 10 min (crus, ils sont indigestes), puis feu doux ~1h.",
          "Ne sale qu'en fin. (Plus simple en conserve si tu es pressée.)",
        ] },
    } },
];

/* ------------------------------------------------------------
   RECETTES TOUTES FAITES (halal, faciles, calées pour le Tasti)
   ------------------------------------------------------------ */
const RECIPES = [
  {
    id:"poulet_amandines",
    nom:"Escalope dorée & amandines rôties",
    emoji:"🍗🥔",
    duree:24, temp:190, portions:"1 pers.", tags:["rapide","le classique"],
    ingredients:[
      "1 escalope de poulet (~150 g)",
      "~250 g de pommes de terre amandines",
      "Huile d'olive (généreusement)",
      "Paprika fumé, ail, thym, un peu de miel, sel, poivre",
      "1/2 citron + une noisette de beurre",
    ],
    prep:[
      "🥔 Amandines : coupe-les en 4 si elles sont grosses (2-3 cm max), bien séchées. Saladier : 1 c. à s. d'huile + paprika fumé + ail + thym + sel. Mélange.",
      "🍗 Escalope : tamponne-la (poulet sec = poulet doré). Marinade : 1 c. à s. d'huile + paprika + ail + un peu de miel + sel + poivre, enrobe bien toute l'escalope.",
      "⚠️ Croustillant : les amandines partent SEULES 10 min d'avance, poulet au centre ensuite, jamais par-dessus. Ne jamais mettre d'eau (ça empêche de dorer).",
    ],
    timeline:[
      {t:0, txt:"Amandines huilées en une seule couche. Lance AirFry 190 °C."},
      {t:10, txt:"Secoue les amandines, pousse-les sur les côtés. Ajoute l'escalope bien marinée au centre."},
      {t:17, txt:"Retourne l'escalope, re-secoue les amandines."},
      {t:21, txt:"🔥 Finition : monte à 200° pour dorer tout le monde."},
      {t:23, txt:"Vérifie l'escalope (jus clair). Amandines qui résistent au couteau ? +3-5 min."},
      {t:24, txt:"✅ À la sortie : noisette de beurre + citron sur le poulet. Gourmand !"},
    ],
  },
  {
    id:"saumon_legumes",
    nom:"Saumon & légumes rôtis au citron",
    emoji:"🐟🥦",
    duree:15, temp:185, portions:"1 pers.", tags:["sain","rapide"],
    ingredients:["1 pavé de saumon","1/2 brocoli en fleurettes","Une poignée de tomates cerises","Huile, citron, ail, sel"],
    prep:[
      "🥦 Brocoli : petites fleurettes bien séchées, huile + ail.",
      "🐟 Saumon : tamponné, huile + citron + sel, côté peau en bas.",
    ],
    timeline:[
      {t:0, txt:"Brocoli huilé dans le bac. AirFry 185 °C."},
      {t:4, txt:"Ajoute le saumon (côté peau en bas) et les tomates cerises."},
      {t:10, txt:"Vérifie : le saumon doit commencer à s'effeuiller."},
      {t:15, txt:"✅ Prêt : saumon fondant + légumes rôtis. Citron dessus."},
    ],
  },
  {
    id:"kefta_poivrons",
    nom:"Kefta & poivrons façon tajine express",
    emoji:"🧆🫑",
    duree:20, temp:185, portions:"2 pers.", tags:["familial","épicé"],
    ingredients:["3-4 kefta (bœuf/agneau haché)","1 poivron en lanières","1 courgette en rondelles","Cumin, paprika, ail, ras el hanout"],
    prep:[
      "🫑 Poivron + courgette : lanières/rondelles, huile + cumin + paprika.",
      "🧆 Kefta : cumin + paprika + ail + ras el hanout mélangés DANS la viande, formés en boudins.",
    ],
    timeline:[
      {t:0, txt:"Poivron + courgette huilés + épices. AirFry 185 °C."},
      {t:7, txt:"Secoue, ajoute les kefta au centre."},
      {t:14, txt:"Retourne les kefta, mélange les légumes."},
      {t:20, txt:"✅ Prêt : kefta juteuses + légumes fondants."},
    ],
  },
  {
    id:"buddha_bowl",
    nom:"Bowl tofu croustillant & patate douce",
    emoji:"🧈🍠",
    duree:20, temp:190, portions:"1-2 pers.", tags:["sain","veggie"],
    ingredients:["1/2 bloc de tofu ferme","1/2 patate douce","Sauce soja, maïzena, huile, ail","Graines de sésame"],
    prep:[
      "🍠 Patate douce : cubes de 2 cm, huile + paprika fumé.",
      "🧈 Tofu : pressé 10 min, cubes, enrobés de sauce soja + maïzena + huile (= croûte dorée).",
    ],
    timeline:[
      {t:0, txt:"Patate douce huilée dans le bac. AirFry 190 °C."},
      {t:9, txt:"Secoue, ajoute le tofu enrobé."},
      {t:15, txt:"Secoue l'ensemble."},
      {t:20, txt:"✅ Prêt : tofu croustillant + patate douce fondante. Sésame dessus."},
    ],
  },
  {
    id:"aiguillettes_potatoes",
    nom:"Aiguillettes panées & potatoes",
    emoji:"🍗🥔",
    duree:18, temp:195, portions:"1-2 pers.", tags:["rapide","enfants"],
    ingredients:["5-6 aiguillettes de poulet","1 œuf + chapelure","Potatoes surgelées","Sel, paprika"],
    prep:[
      "🥔 Potatoes : direct du congélateur, sans rien ajouter.",
      "🍗 Aiguillettes : tamponnées, passées dans l'œuf battu puis la chapelure.",
    ],
    timeline:[
      {t:0, txt:"Potatoes surgelées dans le bac. AirFry 195 °C."},
      {t:8, txt:"Secoue les potatoes, pousse sur les côtés, ajoute les aiguillettes."},
      {t:14, txt:"Retourne les aiguillettes."},
      {t:18, txt:"✅ Prêt : aiguillettes dorées + potatoes croustillantes."},
    ],
  },
  {
    id:"crevettes_ail",
    nom:"Crevettes à l'ail & courgettes",
    emoji:"🍤🥒",
    duree:14, temp:180, portions:"1 pers.", tags:["sain","rapide"],
    ingredients:["1 poignée de crevettes décortiquées","1/2 courgette","Ail, piment, huile d'olive","Citron"],
    prep:[
      "🥒 Courgette : rondelles de 1 cm, huile + ail.",
      "🍤 Crevettes : bien séchées, huile + ail + un peu de piment.",
    ],
    timeline:[
      {t:0, txt:"Courgettes huilées dans le bac. AirFry 180 °C."},
      {t:6, txt:"Secoue, ajoute les crevettes."},
      {t:10, txt:"Secoue légèrement."},
      {t:14, txt:"✅ Prêt : crevettes nacrées + courgettes dorées. Citron dessus."},
    ],
  },
  {
    id:"halloumi_legumes",
    nom:"Halloumi grillé & légumes du soleil",
    emoji:"🧀🫑",
    duree:15, temp:190, portions:"1-2 pers.", tags:["veggie","méditerranéen"],
    ingredients:["4-5 tranches de halloumi","1 poivron, 1/2 courgette","Tomates cerises","Origan, huile d'olive"],
    prep:[
      "🫑 Légumes : poivron en lanières + courgette en rondelles, huile + origan.",
      "🧀 Halloumi : tranches de 1 cm, un filet d'huile (ne pas saler).",
    ],
    timeline:[
      {t:0, txt:"Poivron + courgette huilés. AirFry 190 °C."},
      {t:6, txt:"Secoue, ajoute halloumi + tomates cerises."},
      {t:11, txt:"Retourne le halloumi."},
      {t:15, txt:"✅ Prêt : halloumi doré + légumes fondants."},
    ],
  },
  {
    id:"pilons_miel",
    nom:"Pilons laqués miel-moutarde & grenailles",
    emoji:"🍗🍯",
    duree:25, temp:190, portions:"2 pers.", tags:["familial","gourmand"],
    ingredients:["4 pilons de poulet","Miel + moutarde + sauce soja","Pommes de terre grenailles","Ail, thym, sel"],
    prep:[
      "🥔 Grenailles : coupées en 2, séchées, huile + ail + thym.",
      "🍗 Pilons : peau séchée, entaillés jusqu'à l'os, huile + paprika fumé + sel. Laque = miel + moutarde + sauce soja.",
    ],
    timeline:[
      {t:0, txt:"Grenailles + pilons (côté peau en haut) dans le bac. AirFry 190 °C."},
      {t:10, txt:"Retourne les pilons, secoue les grenailles."},
      {t:18, txt:"Badigeonne les pilons de laque miel-moutarde."},
      {t:25, txt:"✅ Prêt : pilons laqués brillants + grenailles dorées."},
    ],
  },

  // ===== PLATS EN SAUCE & GRATINS (one-pot dans la cuve en verre) =====
  {
    id:"onepot_pates_poulet",
    nom:"One-pot pâtes & poulet (sauce tomate)",
    emoji:"🍝🍗",
    duree:28, temp:180, portions:"2 pers.", tags:["one-pot","plat en sauce"],
    ingredients:[
      "150 g de pâtes crues (penne, coquillettes…)",
      "1 escalope de poulet en dés",
      "~400 ml d'eau chaude ou de bouillon de volaille",
      "3-4 c. à s. de sauce/coulis de tomate",
      "Huile d'olive, ail, paprika, origan, sel",
      "Fromage râpé (optionnel, pour gratiner)",
    ],
    prep:[
      "🍗 Poulet : coupe l'escalope en dés de 2 cm, assaisonne (huile + ail + paprika).",
      "🍝 Dans la cuve en verre : pâtes crues + poulet + sauce tomate + eau chaude ou bouillon. Le liquide doit juste couvrir les pâtes.",
      "⚠️ Couvre la cuve de papier alu : c'est ce qui garde la vapeur pour cuire les pâtes. Mode Roast (ou cuisson), PAS AirFry soufflé.",
    ],
    timeline:[
      {t:0, txt:"Tout dans la cuve, couvre de papier alu. Lance en mode Roast/cuisson 180 °C."},
      {t:12, txt:"Ouvre, remue bien (décolle les pâtes du fond). Trop sec ? Ajoute un peu d'eau chaude. Recouvre d'alu."},
      {t:22, txt:"Goûte les pâtes : encore fermes ? +3-5 min. Vérifie le poulet (blanc à cœur)."},
      {t:25, txt:"Gratin (option) : retire l'alu, parsème de fromage râpé."},
      {t:28, txt:"✅ Prêt : one-pot pâtes-poulet, tout cuit ensemble dans la cuve."},
    ],
  },
  {
    id:"onepot_riz_poulet",
    nom:"One-pot riz & poulet façon tajine",
    emoji:"🍚🍗",
    duree:32, temp:180, portions:"2 pers.", tags:["one-pot","plat en sauce"],
    ingredients:[
      "150 g de riz cru",
      "1 escalope de poulet en dés",
      "~300 ml de bouillon de volaille (1 volume de riz pour 2 de bouillon)",
      "1 carotte en petits dés",
      "Épices tagine (ou curcuma + cumin + paprika), ail, sel",
    ],
    prep:[
      "🍗 Poulet : en dés de 2 cm, assaisonne (huile + épices tagine + ail).",
      "🍚 Dans la cuve : riz rincé + poulet + carotte + bouillon chaud + épices. Le bouillon doit couvrir le riz de ~1 cm.",
      "⚠️ Couvre de papier alu. Mode Roast/cuisson, pas AirFry soufflé.",
    ],
    timeline:[
      {t:0, txt:"Tout dans la cuve, couvre de papier alu. Roast/cuisson 180 °C."},
      {t:15, txt:"Ouvre, remue le riz. Recouvre d'alu (ajoute un filet de bouillon si sec)."},
      {t:26, txt:"Goûte le riz : encore ferme ? +4-5 min. Vérifie le poulet."},
      {t:32, txt:"✅ Prêt : riz parfumé + poulet fondant, façon tajine."},
    ],
  },
  {
    id:"gratin_pdt",
    nom:"Gratin de pommes de terre express",
    emoji:"🥔🧀",
    duree:32, temp:180, portions:"2 pers.", tags:["gratin","plat en sauce"],
    ingredients:[
      "3-4 pommes de terre en fines rondelles (2-3 mm)",
      "~200 ml de crème liquide (+ un peu de lait)",
      "1 gousse d'ail, sel, poivre, muscade",
      "Fromage râpé",
    ],
    prep:[
      "🥔 Rondelles fines (2-3 mm) : plus c'est fin, mieux ça cuit.",
      "🧀 Dans la cuve : rondelles + crème (+ lait) jusqu'à presque couvrir + ail + sel + muscade. Fromage râpé dessus.",
      "⚠️ Couvre de papier alu au départ. Mode Roast/cuisson.",
    ],
    timeline:[
      {t:0, txt:"Cuve remplie, couverte de papier alu. Roast/cuisson 180 °C."},
      {t:20, txt:"Retire l'alu (les pommes de terre doivent être presque tendres au couteau)."},
      {t:28, txt:"Laisse gratiner à découvert pour dorer le fromage."},
      {t:32, txt:"✅ Prêt : gratin doré et fondant. Pique au couteau pour vérifier."},
    ],
  },
];
