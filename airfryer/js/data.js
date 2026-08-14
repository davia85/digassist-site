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
  { id:"oignon_poudre",  nom:"Oignon en poudre",    emoji:"🧅", base:false, dose:"1 c. à c." },
  { id:"cumin",          nom:"Cumin",               emoji:"🟤", base:false, dose:"1/2 c. à c." },
  { id:"curcuma",        nom:"Curcuma",             emoji:"🟡", base:false, dose:"1/2 c. à c." },
  { id:"curry",          nom:"Curry",               emoji:"🍛", base:false, dose:"1 c. à c." },
  { id:"herbes_provence",nom:"Herbes de Provence",  emoji:"🌿", base:true,  dose:"1 c. à c." },
  { id:"thym",           nom:"Thym",                emoji:"🌿", base:false, dose:"1 pincée" },
  { id:"romarin",        nom:"Romarin",             emoji:"🌿", base:false, dose:"1 pincée" },
  { id:"origan",         nom:"Origan",              emoji:"🌿", base:false, dose:"1 c. à c." },
  { id:"coriandre",      nom:"Coriandre (moulue)",  emoji:"🌱", base:false, dose:"1/2 c. à c." },
  { id:"gingembre",      nom:"Gingembre",           emoji:"🫚", base:false, dose:"1/2 c. à c." },
  { id:"piment",         nom:"Piment / chili",      emoji:"🌶️", base:false, dose:"1 pincée" },
  { id:"ras_el_hanout",  nom:"Ras el hanout",       emoji:"🧡", base:false, dose:"1 c. à c." },
  { id:"colombo",        nom:"Colombo",             emoji:"🟠", base:false, dose:"1 c. à c." },
  { id:"citron",         nom:"Citron",              emoji:"🍋", base:true,  dose:"un filet" },
  { id:"sauce_soja",     nom:"Sauce soja",          emoji:"🍶", base:false, dose:"1 c. à s." },
  { id:"miel",           nom:"Miel",                emoji:"🍯", base:false, dose:"1 c. à c." },
  { id:"moutarde",       nom:"Moutarde",            emoji:"🟨", base:false, dose:"1 c. à c." },
  { id:"sesame",         nom:"Graines de sésame",   emoji:"⚪", base:false, dose:"1 c. à c." },
  { id:"persil",         nom:"Persil",              emoji:"🌿", base:false, dose:"qques brins" },
  { id:"maizena",        nom:"Maïzena",             emoji:"🌽", base:false, dose:"1 c. à s." },
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
    coupe:"Coupées en 2 dans la longueur (face coupée = croustillant). Si vraiment mini (<3 cm), laisse entières.",
    coupeAlt:"En 4 pour des plus grosses.",
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
    sechage:"Tamponne au papier absorbant : poulet sec = poulet doré (sinon il bout).",
    humide:true, croustille:false,
    astuce:"Vérifie la cuisson : chair blanche, jus clair. Ne surcuis pas, ça sèche.",
    epices:["paprika","ail","cumin","herbes_provence","citron","curry"] },

  { id:"aiguillettes", nom:"Aiguillettes de poulet", emoji:"🍗", tag:"proteine",
    temp:185, time:11, shake:6, program:"AirFry", qtyHint:"5-6 aiguillettes / pers.",
    coupe:"Telles quelles. Pour version panée : œuf battu puis chapelure.",
    sechage:"Tamponne avant d'assaisonner.",
    humide:true, croustille:false,
    astuce:"Espace-les, ne les colle pas, sinon elles se soudent.",
    epices:["paprika","ail","curry","citron","herbes_provence"] },

  { id:"cuisse_poulet", nom:"Cuisse / pilon de poulet", emoji:"🍗", tag:"proteine",
    temp:190, time:24, shake:12, program:"AirFry", qtyHint:"2 pilons / pers.",
    coupe:"Entiers, avec la peau. Entaille la chair jusqu'à l'os pour cuire à cœur.",
    sechage:"Sèche la peau : c'est ce qui la rend croustillante.",
    humide:true, croustille:false,
    astuce:"Peau vers le haut au départ. Badigeonne de laque (miel-moutarde) en fin.",
    epices:["paprika_fume","ail","thym","ras_el_hanout","miel","moutarde"] },

  { id:"boeuf_hache", nom:"Boulettes de bœuf", emoji:"🧆", tag:"proteine",
    temp:180, time:13, shake:7, program:"AirFry", qtyHint:"4-5 boulettes / pers.",
    coupe:"Boulettes de ~3 cm, bien serrées à la main.",
    sechage:null,
    humide:true, croustille:false,
    astuce:"Mélange l'assaisonnement DANS la viande avant de former.",
    epices:["ail","oignon_poudre","cumin","paprika","origan"] },

  { id:"kefta", nom:"Kefta (haché épicé)", emoji:"🧆", tag:"proteine",
    temp:185, time:12, shake:6, program:"AirFry", qtyHint:"3-4 kefta / pers.",
    coupe:"Petits boudins allongés autour d'un pic (ou à la main).",
    sechage:null,
    humide:true, croustille:false,
    astuce:"Épices mélangées dans la viande + oignon râpé pour le moelleux.",
    epices:["cumin","coriandre","paprika","ail","ras_el_hanout","persil"] },

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
    astuce:"Ne pas remuer, il s'effrite. Prêt quand il s'effeuille à la fourchette.",
    epices:["citron","ail","thym","herbes_provence","paprika"] },

  { id:"cabillaud", nom:"Dos de cabillaud", emoji:"🐟", tag:"proteine",
    temp:180, time:12, shake:0, program:"AirFry", qtyHint:"1 dos / pers.",
    coupe:"Entier. Pose sur un papier cuisson huilé (il est fragile).",
    sechage:"Tamponne bien.",
    humide:true, croustille:false,
    astuce:"Ne pas remuer. Chair opaque = c'est cuit.",
    epices:["citron","ail","curcuma","coriandre"] },

  { id:"crevettes", nom:"Crevettes décortiquées", emoji:"🍤", tag:"proteine",
    temp:180, time:8, shake:4, program:"AirFry", qtyHint:"1 poignée / pers.",
    coupe:"Décortiquées, crues. Bien égouttées si surgelées/décongelées.",
    sechage:"Sèche-les, sinon elles rendent de l'eau.",
    humide:true, croustille:false,
    astuce:"Cuisson rapide ! Prêtes quand elles sont roses et recourbées.",
    epices:["ail","persil","piment","citron","paprika"] },

  { id:"tofu", nom:"Tofu ferme", emoji:"🧈", tag:"proteine",
    temp:190, time:15, shake:7, program:"AirFry", qtyHint:"1/2 bloc / pers.",
    coupe:"En cubes de ~2 cm.",
    sechage:"Presse le tofu 10 min sous un poids (chasse l'eau) puis enrobe de maïzena = croustillant.",
    humide:false, croustille:true,
    astuce:"Sauce soja + maïzena + huile avant cuisson pour une croûte dorée.",
    epices:["sauce_soja","ail","gingembre","sesame","curry","paprika_fume"] },

  { id:"halloumi", nom:"Halloumi", emoji:"🧀", tag:"proteine",
    temp:190, time:9, shake:5, program:"AirFry", qtyHint:"4-5 tranches / pers.",
    coupe:"Tranches de ~1 cm.",
    sechage:"Tamponne, un filet d'huile.",
    humide:false, croustille:true,
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
    epices:["miel","cumin","thym","coriandre"] },

  { id:"champignon", nom:"Champignons", emoji:"🍄", tag:"legume",
    temp:180, time:11, shake:5, program:"AirFry", qtyHint:"1 poignée / pers.",
    coupe:"Émincés ou en 2 (petits entiers).",
    sechage:"Ne PAS les laver à l'eau (ils la boivent) : brosse-les.",
    humide:true, croustille:false,
    astuce:"Ils réduisent beaucoup : mets-en plus que tu crois.",
    epices:["ail","persil","thym","poivre"] },

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
    epices:["ail","persil","citron"] },

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
      "Huile d'olive",
      "Paprika fumé, ail en poudre, thym, sel, poivre",
      "1/2 citron",
    ],
    prep:[
      "🥔 Amandines : coupées en 2 dans la longueur, bien séchées. Saladier : huile d'olive + paprika fumé + ail + thym + sel. Mélange.",
      "🍗 Escalope : tamponne-la au papier absorbant (poulet sec = poulet doré). Huile + paprika + ail + sel + poivre.",
      "⚠️ Croustillant : les amandines partent SEULES 10 min d'avance, poulet au centre ensuite, jamais par-dessus.",
    ],
    timeline:[
      {t:0, txt:"Amandines en une seule couche dans le bac. Lance AirFry 190 °C."},
      {t:10, txt:"Secoue les amandines, pousse-les sur les côtés. Ajoute l'escalope au centre."},
      {t:17, txt:"Retourne l'escalope, re-secoue les amandines."},
      {t:22, txt:"Vérifie l'escalope (jus clair). Amandines pas assez dorées ? Sors le poulet, +2 min."},
      {t:24, txt:"✅ Prêt. Filet de citron sur le poulet."},
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
    ingredients:["3-4 kefta (bœuf/agneau haché)","1 poivron en lanières","1 oignon en quartiers","Cumin, coriandre, paprika, ail"],
    prep:[
      "🫑 Poivron + oignon : lanières/quartiers, huile + cumin + paprika.",
      "🧆 Kefta : cumin + coriandre + ail mélangés DANS la viande + oignon râpé, formés en boudins.",
    ],
    timeline:[
      {t:0, txt:"Poivron + oignon huilés + épices. AirFry 185 °C."},
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
    ingredients:["1 poignée de crevettes décortiquées","1/2 courgette","Ail, persil, huile d'olive","Citron"],
    prep:[
      "🥒 Courgette : rondelles de 1 cm, huile + ail.",
      "🍤 Crevettes : bien séchées, huile + ail + persil.",
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
];
