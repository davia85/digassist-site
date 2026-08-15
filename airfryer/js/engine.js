/* ============================================================
   Dream Tasty — Moteur de cuisson synchronisée (1 bac)
   Prend des ingrédients + le placard d'épices de l'utilisateur,
   et produit une recette ultra détaillée : température commune,
   départs décalés pour une fin commune, prep par ingrédient,
   mélanges d'épices adaptés, astuces croustillant.
   ============================================================ */

const Engine = (() => {

  const byId = (id) => INGREDIENTS.find((i) => i.id === id);
  const spiceById = (id) => SPICES.find((s) => s.id === id);

  function snapTemp(t) {
    let best = APPLIANCE.tempSteps[0];
    let d = Infinity;
    for (const s of APPLIANCE.tempSteps) {
      if (Math.abs(s - t) < d) { d = Math.abs(s - t); best = s; }
    }
    return best;
  }

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const fmt = (m) => `${Math.floor(m)}:${String(Math.round((m % 1) * 60)).padStart(2, "0")}`;
  const mmss = (m) => `${String(Math.floor(m)).padStart(2, "0")}:00`;

  /* Compose le mélange d'épices d'un ingrédient à partir du placard.
     pantry = Set d'ids d'épices possédées (null = on prend les "base"). */
  function seasoning(ing, pantry) {
    const has = (id) => (pantry ? pantry.has(id) : !!(spiceById(id) && spiceById(id).base));
    const used = [];
    // Bases quasi systématiques
    for (const b of ["huile_olive", "sel", "poivre"]) {
      if (has(b) && b !== "poivre") used.push(b);
      else if (has(b)) used.push(b);
    }
    // Épices idéales de l'ingrédient présentes dans le placard (max 4)
    const ideal = ing.epices || [];
    const present = ideal.filter(has);
    const missing = ideal.filter((id) => !has(id));
    for (const id of present.slice(0, 4)) used.push(id);

    // Dédoublonne en gardant l'ordre
    const seen = new Set();
    const ordered = used.filter((id) => (seen.has(id) ? false : (seen.add(id), true)));

    const label = ordered
      .map((id) => {
        const s = spiceById(id);
        return s ? s.nom.replace(/ \(.*\)/, "") : id;
      })
      .join(" + ");

    return {
      label: label || "sel + poivre + un filet d'huile",
      missing: missing.map((id) => spiceById(id)).filter(Boolean),
      poor: present.length === 0, // aucune épice idéale dispo
    };
  }

  /* Temps de base corrigé selon la taille des morceaux ET l'état frais/surgelé. */
  function computeTime(ing, sizes, states) {
    let t = ing.time;
    if (SIZE_SENSITIVE.includes(ing.id)) {
      const size = (sizes && sizes[ing.id]) || "moyen";
      const table = SIZE_FACTORS[ing.tag] || SIZE_FACTORS.legume;
      t *= table[size] != null ? table[size] : 1;
    }
    if (STATE_SENSITIVE.includes(ing.id)) {
      const st = (states && states[ing.id]) || "frais";
      t *= STATE_FACTORS[st] != null ? STATE_FACTORS[st] : 1;
    }
    return Math.round(t);
  }

  /* Construit le plan complet.
     sizes  = { id: 'petit'|'moyen'|'gros' } (optionnel)
     states = { id: 'frais'|'surgele' } (optionnel) */
  /* ONE-POT dans la cuve en verre : quand il y a des pâtes ou du riz,
     tout cuit ensemble dans le bac avec du liquide (crème / bouillon). */
  function buildOnePot(allItems, pantry, formes, times) {
    const starches = allItems.filter((i) => i.onepot);
    const others = allItems.filter((i) => !i.onepot && i.methode !== "casserole");
    const dried = allItems.filter((i) => i.methode === "casserole"); // légumes secs éventuels

    // Temps par féculent : si l'utilisateur a saisi son temps "al dente / paquet",
    // on l'adapte à la cuisson (plus douce) en ajoutant un tampon ; sinon valeur par défaut.
    let tempsPerso = false;
    const starchTotals = starches.map((s) => {
      const manual = times && Number(times[s.id]) > 0 ? Number(times[s.id]) : null;
      if (manual) { tempsPerso = true; return manual + (s.onepot.buffer || 14); }
      return s.onepot.total;
    });
    const temp = Math.max(...starches.map((s) => s.onepot.temp));
    const total = Math.max(...starchTotals);
    const stir = Math.max(6, Math.round(total * 0.45));

    // Préparation par ingrédient
    const prep = [];
    starches.forEach((s) => {
      prep.push({
        nom: s.nom, emoji: s.emoji, qty: s.qtyHint,
        coupe: "Cru, directement dans la cuve (il cuit dans le liquide).",
        epices: null, oneP: true,
      });
    });
    others.forEach((i) => {
      const sea = seasoning(i, pantry);
      prep.push({
        nom: i.nom, emoji: i.emoji, qty: i.qtyHint,
        coupe: i.tag === "proteine" ? "En dés / morceaux de ~2 cm (ils cuisent dans la sauce)."
                                     : "En morceaux de ~2 cm.",
        epices: sea.label, manque: sea.missing, oneP: true,
      });
    });

    // Liquide : MESURÉ (pas "couvrir"), car l'airfryer n'évapore pas.
    const liquideBase = starches.map((s) => s.onepot.liquide).join(" · ");
    const liquide = {
      titre: "Le liquide — à MESURER (pas à couvrir)",
      texte: `${liquideBase} Important : l'airfryer n'évapore quasiment pas le liquide, donc trop = soupe. La crème et les légumes qui rendent de l'eau (épinards…) s'ajoutent EN FIN, pas au début. Le skyr/yaourt, en toute fin, mélangé à 1 c. à c. de maïzena (sinon il tranche).`,
    };

    // Ingrédients "humides" (à ajouter en fin pour ne pas détremper)
    const lateVeg = others.filter((i) => i.tag === "legume" && i.humide).map((i) => i.nom.toLowerCase());
    const nowItems = [
      ...others.filter((i) => !(i.tag === "legume" && i.humide)).map((i) => i.nom.toLowerCase()),
      ...starches.map((s) => s.nom.toLowerCase() + " cru(es)"),
    ].join(" + ");

    const stir1 = Math.max(8, Math.round(total * 0.33));
    const addLate = Math.max(stir1 + 2, total - 7);
    const check = Math.max(addLate + 1, total - 3);

    const timeline = [];
    timeline.push({
      t: 0, label: "0:00 — Dans la cuve",
      actions: [
        others.some((i) => i.tag === "proteine") ? "Coupe la viande/le poisson en dés de ~2 cm." : "Prépare tes ingrédients.",
        `Mets dans la cuve : ${nowItems} + le liquide MESURÉ (pas plus) + tes épices. Pousse bien les pâtes/le riz SOUS le liquide (ce qui dépasse sèche et surcuit ; casse les pâtes longues si besoin).`,
        `Couvre de papier alu (recommandé ici : ça garde tout humide et empêche les pâtes qui dépassent de sécher), puis lance le mode Roast — c'est LE bon mode : ~160°C, doux, non réglable sur le Tasti (et c'est justement ce qu'il faut). Sans alu, remue plus souvent pour garder les pâtes immergées.`,
      ],
    });
    timeline.push({
      t: stir1, label: `${mmss(stir1)}`,
      actions: ["Remue bien (décolle du fond, remets tout sous le liquide). Ça sèche trop vite ? ajoute un petit peu de bouillon chaud."],
    });
    timeline.push({
      t: addLate, label: `${mmss(addLate)}`,
      actions: [
        `Ajoute maintenant la crème (si tu en mets)${lateVeg.length ? " et " + lateVeg.join(", ") : ""} — les mettre plus tôt détrempe tout. Remue.`,
      ],
    });
    timeline.push({
      t: check, label: `${mmss(check)}`,
      actions: [
        `Goûte ${starches.map((s) => s.nom.toLowerCase()).join(" / ")} : encore ferme(s) ? +3-5 min.`,
        "S'il reste trop de liquide : laisse à découvert 2-4 min (ça épaissit lentement) ou égoutte l'excédent.",
        others.some((i) => i.tag === "proteine") ? "Vérifie la viande : cuite à cœur (blanche, jus clair)." : "",
      ].filter(Boolean),
    });
    timeline.push({
      t: total, label: `${mmss(total)} — C'est prêt !`,
      actions: [
        "🥛 Sauce crémeuse au skyr/yaourt : hors du feu, mélange-le à 1 c. à c. de maïzena avant de l'incorporer (sinon il tranche).",
        "Option gratin : fromage râpé + 3 min à découvert pour dorer.",
        "✅ Prêt.",
      ],
      final: true,
    });

    const tips = [];
    if (tempsPerso) {
      tips.push(`Durée adaptée à TON temps al dente (paquet) : dans la cuve c'est plus doux qu'à l'eau bouillante, donc ~${total} min. Goûte et ajuste.`);
    }
    tips.push(
      "L'airfryer n'évapore presque pas le liquide : mets-en PEU (mesuré, pas 'couvrir'), sinon ça fait de la soupe. S'il en reste trop, prolonge à découvert ou égoutte.",
      "Crème + légumes qui rendent de l'eau (épinards…) = à la FIN (dernières minutes), jamais au début.",
      "Pousse les pâtes/le riz sous le liquide et remue : ce qui dépasse sèche et surcuit.",
      "Le bon mode = Roast (~160°C, doux) : en AirFry (185°, plus chaud) le dessus sèche avant que les pâtes cuisent. Sur le Tasti tu ne règles que la durée.",
      "Papier alu recommandé : il garde l'humidité et évite les pâtes sèches qui dépassent."
    );

    // Légumes secs éventuels : à préparer à part (ils ne cuisent pas dans ce temps)
    const sides = dried.map((i) => {
      const forme = i.formes ? ((formes && formes[i.id]) || FORME_DEFAULT) : null;
      const data = i.formes ? i.formes[forme] : i.casserole;
      return { nom: i.nom, emoji: i.emoji, forme, qty: data.qty || i.qtyHint,
               temps: data.temps, liquide: data.liquide, bouillon: data.bouillon, etapes: data.etapes };
    });

    return {
      onepot: true,
      program: "Roast",
      temp, total, prep, timeline, tips, liquide, sides,
      conflitCroustillant: false,
    };
  }

  function buildPlan(selectedIds, pantry, sizes, states, formes, times) {
    const allItems = selectedIds.map(byId).filter(Boolean);
    if (allItems.length === 0) return null;

    // Si des pâtes ou du riz sont sélectionnés -> recette ONE-POT dans la cuve
    if (allItems.some((i) => i.onepot)) {
      return buildOnePot(allItems, pantry, formes, times);
    }

    // Sépare la cuisson airfryer de ce qui se fait à la casserole (légumes secs)
    const items = allItems.filter((i) => i.methode !== "casserole");
    const sides = allItems
      .filter((i) => i.methode === "casserole")
      .map((i) => {
        const forme = i.formes ? ((formes && formes[i.id]) || FORME_DEFAULT) : null;
        const data = i.formes ? i.formes[forme] : i.casserole;
        return {
          nom: i.nom, emoji: i.emoji, forme,
          qty: data.qty || i.qtyHint,
          temps: data.temps, liquide: data.liquide,
          bouillon: data.bouillon, etapes: data.etapes,
        };
      });

    // Seulement des accompagnements casserole (pas de cuisson airfryer)
    if (items.length === 0) {
      return {
        program: null, temp: null, total: null,
        prep: [], timeline: [], tips: [], conflitCroustillant: false,
        sides, onlySides: true,
      };
    }

    // 1) Mode de cuisson : le Tasti ne règle PAS la température.
    // La cuisson "sèche/croustillante" se fait en mode AirFry (185°C fixe).
    // On garde 185 comme repère pour ajuster les temps de chaque ingrédient.
    const targetTemp = 185;

    // 2) Temps ajusté (taille + température commune) + décalage des départs
    const enriched = items.map((ing) => {
      const base = computeTime(ing, sizes, states);  // <-- taille + frais/surgelé
      const factor = ing.temp / targetTemp;          // >1 si l'ingrédient aime + chaud
      let adj = Math.round(base * factor);
      adj = clamp(adj, Math.max(3, Math.round(base * 0.6)), Math.round(base * 1.6));
      return { ing, adj };
    });

    const total = Math.max(...enriched.map((e) => e.adj));
    enriched.forEach((e) => (e.start = Math.max(0, total - e.adj)));

    // 3) Détection croustillant : féculent/croustillant + ingrédient humide
    const croustille = enriched.filter((e) => e.ing.croustille);
    const humides = enriched.filter((e) => e.ing.humide);
    const conflitCroustillant = croustille.length > 0 && humides.length > 0;

    // 4) Prep par ingrédient (coupe, taille, séchage, épices)
    const prep = enriched.map((e) => {
      const s = seasoning(e.ing, pantry);
      const sizeSel = SIZE_SENSITIVE.includes(e.ing.id) ? ((sizes && sizes[e.ing.id]) || "moyen") : null;
      const sizeLabel = sizeSel ? (SIZE_LABELS[e.ing.tag] || SIZE_LABELS.legume)[sizeSel] : null;
      const stateSel = STATE_SENSITIVE.includes(e.ing.id) ? ((states && states[e.ing.id]) || "frais") : null;
      const stateNote = stateSel === "surgele"
        ? "Cuisson depuis l'état congelé : temps rallongé. Assaisonne à mi-cuisson, quand la surface a dégelé."
        : null;
      return {
        nom: e.ing.nom,
        emoji: e.ing.emoji,
        qty: e.ing.qtyHint,
        coupe: e.ing.coupe,
        coupeAlt: e.ing.coupeAlt || null,
        sechage: e.ing.sechage || null,
        epices: s.label,
        manque: s.missing,
        epicesPauvres: s.poor,
        astuce: e.ing.astuce || null,
        marinade: e.ing.marinade || null,
        finition: e.ing.finition || null,
        size: sizeSel,
        sizeLabel,
        state: stateSel,
        stateNote,
      };
    });

    // 5) Timeline fusionnée
    const events = [];
    const nom = (e) => `${e.ing.emoji} ${e.ing.nom.toLowerCase()}`;

    enriched.forEach((e) => {
      // Ajout
      events.push({
        t: e.start,
        prio: 1,
        txt: e.start === 0
          ? `Mets ${nom(e)} dans le bac.`
          : `Ouvre et ajoute ${nom(e)}${conflitCroustillant && e.ing.humide && croustille.length
              ? ` — garde ${croustille.map((c) => c.ing.nom.toLowerCase()).join(", ")} sur les côtés, ne pose pas dessus`
              : ""}.`,
      });
      // Secousses
      if (e.ing.shake > 0) {
        for (let k = e.start + e.ing.shake; k < total - 2; k += e.ing.shake) {
          events.push({ t: k, prio: 2, txt: `Secoue / retourne ${nom(e)}.` });
        }
      }
    });

    // Étape "finition dorée" : si un ingrédient a une finition à feu vif,
    // on ajoute une montée à 200° sur les dernières minutes (le secret du doré).
    const aFinition = enriched.filter((e) => e.ing.finition);
    if (aFinition.length && total >= 8) {
      const tf = Math.max(3, total - 3);
      events.push({
        t: tf,
        prio: 1.5,
        txt: `🔥 Finition dorée : passe en mode Broil (le grill du Tasti) pour les 2-3 dernières minutes — c'est ce qui rend ${aFinition.map((e) => e.ing.nom.toLowerCase()).join(", ")} doré(e) et gourmand(e).`,
      });
    }

    // Fusionne les évènements par minute
    const map = new Map();
    for (const ev of events) {
      const key = Math.round(ev.t);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(ev);
    }
    const timeline = [...map.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([t, evs]) => ({
        t,
        label: t === 0 ? "0:00 — Lancer la cuisson" : `${mmss(t)}`,
        actions: evs.sort((a, b) => a.prio - b.prio).map((e) => e.txt),
      }));

    // Étape finale + TEST DE CUISSON (pour ne plus jamais avoir de cru)
    const hasFeculent = items.some((i) => i.tag === "feculent");
    const hasProteine = items.some((i) => i.tag === "proteine");
    const finalActions = ["✅ Chaque ingrédient finit sa cuisson en même temps."];
    if (hasFeculent) {
      finalActions.push("🔪 Test féculents : la pointe d'un couteau doit s'enfoncer SANS résistance. Si ça résiste, referme et ajoute 5 min (sans risque).");
    }
    if (hasProteine) {
      finalActions.push("🍗 Test viande/poisson : chair blanche/opaque et jus clair. Dans le doute, +3 min.");
    }
    timeline.push({
      t: total,
      label: `${mmss(total)} — C'est prêt !`,
      actions: finalActions,
      final: true,
    });

    // 6) Programme conseillé (le plus fréquent, sinon AirFry)
    const progCount = {};
    items.forEach((i) => (progCount[i.program] = (progCount[i.program] || 0) + 1));
    const program = Object.entries(progCount).sort((a, b) => b[1] - a[1])[0][0] || "AirFry";

    // Astuces globales
    const tips = [];
    if (hasProteine) {
      tips.push("Le secret du goût et du doré : de l'HUILE généreusement + les épices mélangées à l'huile (marinade). Jamais d'eau dans le bac — l'eau fait bouillir et empêche de dorer.");
    }
    if (conflitCroustillant) {
      tips.push(
        `Pour garder le croustillant : ${croustille
          .map((c) => c.ing.nom.toLowerCase())
          .join(", ")} partent en avance et restent sur les côtés ; ` +
          `${humides.map((h) => h.ing.nom.toLowerCase()).join(", ")} au centre, jamais par-dessus.`
      );
    }
    const gros = prep.filter((p) => p.size === "gros");
    if (gros.length) {
      tips.push(
        `Tu as choisi « gros » pour ${gros.map((p) => p.nom.toLowerCase()).join(", ")} : le temps a été rallongé en conséquence. Pour aller plus vite la prochaine fois, coupe des morceaux plus petits et réguliers.`
      );
    }
    if (items.length >= 4) {
      tips.push("Beaucoup d'ingrédients : ne surcharge pas le bac (une couche = cuisson régulière), quitte à cuire en 2 fois.");
    }
    tips.push("Sur le Tasti, la cuisson sèche se fait en mode AirFry (185°C, fixe). Tu ne règles que la DURÉE — surveille les ingrédients délicats en fin.");

    if (sides.length) {
      tips.push("Pendant la cuisson airfryer, lance tes accompagnements à la casserole (voir plus bas) : tout sera prêt en même temps.");
    }

    return {
      program,
      temp: targetTemp,
      total,
      prep,
      timeline,
      tips,
      conflitCroustillant,
      sides,
      onlySides: false,
    };
  }

  return { buildPlan, seasoning };
})();
