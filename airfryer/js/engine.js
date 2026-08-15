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

  /* Renvoie le temps de base d'un ingrédient corrigé selon la taille choisie. */
  function sizedTime(ing, sizes) {
    if (!SIZE_SENSITIVE.includes(ing.id)) return ing.time;
    const size = (sizes && sizes[ing.id]) || "moyen";
    const table = SIZE_FACTORS[ing.tag] || SIZE_FACTORS.legume;
    const f = table[size] != null ? table[size] : 1;
    return Math.round(ing.time * f);
  }

  /* Construit le plan complet.
     sizes = { ingredientId: 'petit'|'moyen'|'gros' } (optionnel) */
  function buildPlan(selectedIds, pantry, sizes) {
    const items = selectedIds.map(byId).filter(Boolean);
    if (items.length === 0) return null;

    // 1) Température commune
    const avg = items.reduce((a, i) => a + i.temp, 0) / items.length;
    const targetTemp = snapTemp(avg);

    // 2) Temps ajusté (taille + température commune) + décalage des départs
    const enriched = items.map((ing) => {
      const base = sizedTime(ing, sizes);            // <-- corrigé selon la taille
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
        size: sizeSel,
        sizeLabel,
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
    const tempSpread = Math.max(...items.map((i) => i.temp)) - Math.min(...items.map((i) => i.temp));
    if (tempSpread >= 25) {
      tips.push(
        `Tes ingrédients aiment des températures assez différentes. On a choisi ${targetTemp} °C comme compromis : surveille les plus délicats en fin de cuisson.`
      );
    }

    return {
      program,
      temp: targetTemp,
      total,
      prep,
      timeline,
      tips,
      conflitCroustillant,
    };
  }

  return { buildPlan, seasoning };
})();
