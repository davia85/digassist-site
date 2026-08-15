/* ============================================================
   Dream Tasty — Logique de l'application
   ============================================================ */
(() => {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const store = {
    get(key, def) { try { return JSON.parse(localStorage.getItem("dt_" + key)) ?? def; } catch { return def; } },
    set(key, val) { try { localStorage.setItem("dt_" + key, JSON.stringify(val)); } catch {} },
  };

  // État
  const selected = new Set(store.get("selection", []));
  const sizes = store.get("sizes", {}); // { ingredientId: 'petit'|'moyen'|'gros' }
  const states = store.get("states", {}); // { ingredientId: 'frais'|'surgele' }
  const formes = store.get("formes", {}); // { ingredientId: 'sec'|'conserve' }
  let pantry = store.get("pantry", null);
  if (pantry === null) {
    // Premier lancement : on coche les épices "de base"
    pantry = SPICES.filter((s) => s.base).map((s) => s.id);
    store.set("pantry", pantry);
  }
  const pantrySet = () => new Set(pantry);

  /* ---------- Onglets ---------- */
  $$(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      $$(".tab").forEach((t) => t.classList.remove("tab--active"));
      tab.classList.add("tab--active");
      $$(".view").forEach((v) => v.classList.remove("view--active"));
      $("#view-" + tab.dataset.tab).classList.add("view--active");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  /* ---------- Onglet : Ingrédients ---------- */
  const GROUPS = [
    { tag: "proteine", label: "Protéines", emoji: "🍗" },
    { tag: "feculent", label: "Féculents", emoji: "🥔" },
    { tag: "legume", label: "Légumes", emoji: "🥦" },
    { tag: "accompagnement", label: "Riz, pâtes & légumes secs", emoji: "🍚" },
  ];

  function renderIngredients() {
    const host = $("#ingredient-groups");
    host.innerHTML = GROUPS.map((g) => {
      const chips = INGREDIENTS.filter((i) => i.tag === g.tag)
        .map((i) => `
          <button class="chip ${selected.has(i.id) ? "chip--on" : ""}" data-id="${i.id}">
            <span>${i.emoji}</span><span>${esc(i.nom)}</span>
            <span class="chip__check">✓</span>
          </button>`).join("");
      return `<div class="group">
        <div class="group__title">${g.emoji} ${g.label}</div>
        <div class="chips">${chips}</div>
      </div>`;
    }).join("");

    $$(".chip", host).forEach((chip) => {
      chip.addEventListener("click", () => {
        const id = chip.dataset.id;
        if (selected.has(id)) selected.delete(id);
        else selected.add(id);
        chip.classList.toggle("chip--on");
        store.set("selection", [...selected]);
        updateSelectionBar();
        renderSizePanel();
      });
    });
  }

  const SIZE_OPTS = [
    { key: "petit", label: "Petit" },
    { key: "moyen", label: "Moyen" },
    { key: "gros", label: "Gros" },
  ];
  const STATE_OPTS = [
    { key: "frais", label: "Frais" },
    { key: "surgele", label: "Surgelé" },
  ];
  const FORME_OPTS = [
    { key: "conserve", label: "En conserve" },
    { key: "sec", label: "Sec" },
  ];

  function renderSizePanel() {
    const host = $("#size-panel");
    const list = [...selected].map((id) => INGREDIENTS.find((i) => i.id === id))
      .filter((i) => i && (SIZE_SENSITIVE.includes(i.id) || STATE_SENSITIVE.includes(i.id) || FORME_SENSITIVE.includes(i.id)));
    if (list.length === 0) { host.hidden = true; host.innerHTML = ""; return; }
    host.hidden = false;
    host.innerHTML = `
      <div class="size-panel__title">🎛️ Réglages <span>(taille des morceaux + frais/surgelé = le plus important pour bien cuire !)</span></div>
      ${list.map((i) => {
        const curSize = sizes[i.id] || "moyen";
        const curState = states[i.id] || "frais";
        const sizeSeg = SIZE_SENSITIVE.includes(i.id) ? `
          <div class="seg-block"><span class="seg-lbl">📏 Taille</span>
            <div class="size-seg" data-kind="size" data-id="${i.id}">
              ${SIZE_OPTS.map((o) => `<button class="size-btn ${curSize === o.key ? "size-btn--on" : ""}" data-val="${o.key}">${o.label}</button>`).join("")}
            </div></div>` : "";
        const stateSeg = STATE_SENSITIVE.includes(i.id) ? `
          <div class="seg-block"><span class="seg-lbl">❄️ État</span>
            <div class="size-seg" data-kind="state" data-id="${i.id}">
              ${STATE_OPTS.map((o) => `<button class="size-btn ${curState === o.key ? "size-btn--on" : ""}" data-val="${o.key}">${o.label}</button>`).join("")}
            </div></div>` : "";
        const curForme = formes[i.id] || "conserve";
        const formeSeg = FORME_SENSITIVE.includes(i.id) ? `
          <div class="seg-block"><span class="seg-lbl">🥫 Forme</span>
            <div class="size-seg" data-kind="forme" data-id="${i.id}">
              ${FORME_OPTS.map((o) => `<button class="size-btn ${curForme === o.key ? "size-btn--on" : ""}" data-val="${o.key}">${o.label}</button>`).join("")}
            </div></div>` : "";
        return `<div class="size-row">
          <div class="size-row__name">${i.emoji} ${esc(i.nom)}</div>
          <div class="seg-wrap">${sizeSeg}${stateSeg}${formeSeg}</div>
        </div>`;
      }).join("")}`;
    $$(".size-btn", host).forEach((btn) => {
      btn.addEventListener("click", () => {
        const seg = btn.closest(".size-seg");
        const id = seg.dataset.id;
        const val = btn.dataset.val;
        if (seg.dataset.kind === "size") { sizes[id] = val; store.set("sizes", sizes); }
        else if (seg.dataset.kind === "state") { states[id] = val; store.set("states", states); }
        else { formes[id] = val; store.set("formes", formes); }
        $$(".size-btn", seg).forEach((b) => b.classList.remove("size-btn--on"));
        btn.classList.add("size-btn--on");
      });
    });
  }

  function updateSelectionBar() {
    const bar = $("#selection-bar");
    const n = selected.size;
    if (n === 0) { bar.hidden = true; return; }
    bar.hidden = false;
    $("#selection-count").textContent = n + (n > 1 ? " ingrédients" : " ingrédient");
  }

  $("#btn-generate").addEventListener("click", () => {
    const plan = Engine.buildPlan([...selected], pantrySet(), sizes, states, formes);
    renderPlan(plan);
    $("#plan-output").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  function sidesCard(plan) {
    if (!plan.sides || !plan.sides.length) return "";
    const items = plan.sides.map((s) => `
      <div class="prep-item">
        <div class="prep-item__head">${s.emoji} ${esc(s.nom)}${s.forme ? ` <span class="forme-tag">${s.forme === "sec" ? "sec" : "en conserve"}</span>` : ""} <span class="prep-item__qty">· ${esc(s.qty)}</span></div>
        <div class="prep-line">🕒 <b>Temps :</b> ${esc(s.temps)} · <b>Liquide :</b> ${esc(s.liquide)}</div>
        ${s.etapes.map((e, i) => `<div class="prep-line">${i + 1}. ${esc(e)}</div>`).join("")}
        ${s.bouillon ? `<div class="prep-line prep-gourmand">🍲 <b>Version pot-au-feu :</b> ${esc(s.bouillon)}</div>` : ""}
      </div>`).join("");
    return `<div class="plan-card">
      <div class="section-title">🍲 Riz / pâtes / légumes secs</div>
      <p class="prep-note" style="margin-bottom:8px">2 façons : <b>à la casserole</b> (comme ci-dessous, en même temps que le bac) — ou <b>en one-pot dans la cuve en verre</b> (tout cuit ensemble avec le liquide, mode Roast + papier alu). Voir l'onglet Recettes → « plat en sauce ».</p>
      ${items}
    </div>`;
  }

  function renderPlan(plan) {
    const out = $("#plan-output");
    if (!plan) { out.innerHTML = ""; return; }

    // Cas : uniquement des accompagnements casserole (riz/pâtes/lentilles seuls)
    if (plan.onlySides) {
      out.innerHTML = `
        <div class="plan-head">
          <div class="plan-head__title">🍲 Cuisson à la casserole</div>
          <p class="prep-note" style="margin-top:6px">Le riz, les pâtes et les lentilles crus se cuisent à l'eau bouillante — pas à l'airfryer. Voici comment faire :</p>
        </div>
        ${sidesCard(plan)}`;
      return;
    }

    const badges = `
      <div class="plan-badges">
        <div class="badge"><div class="badge__num">${plan.temp}°</div><div class="badge__lbl">Température</div></div>
        <div class="badge"><div class="badge__num">${plan.total} min</div><div class="badge__lbl">Durée totale</div></div>
        <div class="badge"><div class="badge__num">${esc(plan.program)}</div><div class="badge__lbl">Programme</div></div>
      </div>`;

    const warn = plan.conflitCroustillant
      ? `<div class="warn">💡 Un ingrédient qui doit rester croustillant est cuit avec un ingrédient qui rejette de la vapeur. On a décalé les départs et on te dit où placer chaque chose pour garder le croustillant.</div>`
      : "";

    const prep = plan.prep.map((p) => `
      <div class="prep-item">
        <div class="prep-item__head">${p.emoji} ${esc(p.nom)} <span class="prep-item__qty">· ${esc(p.qty)}</span></div>
        <div class="prep-line">✂️ <b>Coupe :</b> ${esc(p.coupe)}${p.coupeAlt ? ` <span class="prep-note">(ou : ${esc(p.coupeAlt)})</span>` : ""}</div>
        ${p.size ? `<div class="prep-line">📏 <b>Taille :</b> ${esc(p.size)} — vise ${esc(p.sizeLabel)}. <span class="prep-note">Le temps est calculé pour cette taille.</span></div>` : ""}
        ${p.state ? `<div class="prep-line">❄️ <b>État :</b> ${p.state === "surgele" ? "surgelé" : "frais"}${p.stateNote ? ` <span class="prep-note">${esc(p.stateNote)}</span>` : ""}</div>` : ""}
        ${p.sechage ? `<div class="prep-line">💧 <b>Séchage :</b> ${esc(p.sechage)}</div>` : ""}
        ${p.epices ? `<div class="prep-line">🧂 <b>Assaisonnement :</b> ${esc(p.epices)}</div>` : ""}
        ${p.marinade ? `<div class="prep-line">🥣 <b>Marinade :</b> ${esc(p.marinade)}</div>` : ""}
        ${p.finition ? `<div class="prep-line prep-gourmand">✨ <b>Finition gourmande :</b> ${esc(p.finition)}</div>` : ""}
        ${p.astuce ? `<div class="prep-note">👉 ${esc(p.astuce)}</div>` : ""}
        ${(p.manque && p.manque.length) ? `<div class="missing">Astuce goût : avec ${p.manque.slice(0,3).map((s)=>esc(s.nom)).join(", ")} ce serait encore meilleur.</div>` : ""}
      </div>`).join("");

    const timeline = plan.timeline.map((step) => `
      <div class="tl-step ${step.final ? "tl-step--final" : ""}">
        <div class="tl-time">${esc(step.label.split(" — ")[0])}</div>
        <div class="tl-body">
          ${step.label.includes(" — ") ? `<div class="prep-item__head" style="font-size:14px;margin-bottom:4px">${esc(step.label.split(" — ")[1])}</div>` : ""}
          ${step.actions.map((a) => `<div class="tl-action">${esc(a)}</div>`).join("")}
        </div>
      </div>`).join("");

    const tips = plan.tips.length
      ? `<div class="tips"><div class="tips__title">💡 Astuces</div><ul>${plan.tips.map((t) => `<li>${esc(t)}</li>`).join("")}</ul></div>`
      : "";

    const liquideCard = plan.liquide
      ? `<div class="plan-card liquide-card">
           <div class="section-title">🥛 ${esc(plan.liquide.titre)}</div>
           <div class="prep-line">${esc(plan.liquide.texte)}</div>
         </div>`
      : "";

    const headTitle = plan.onepot ? "🍲 Ta recette one-pot" : "🔥 Ta cuisson synchronisée";
    const dureeLabel = plan.onepot ? "une seule cuisson dans la cuve" : "une seule cuisson";

    out.innerHTML = `
      <div class="plan-head">
        <div class="plan-head__title">${headTitle}</div>
        ${badges}
        ${plan.onepot ? `<p class="prep-note" style="margin-top:8px">Tout cuit ensemble dans la cuve, couvert de papier alu (mode Roast).</p>` : ""}
      </div>
      ${warn}
      ${liquideCard}
      <div class="plan-card">
        <div class="section-title">🧑‍🍳 Préparation</div>
        ${prep}
      </div>
      <div class="plan-card">
        <div class="section-title">⏱️ Déroulé — ${dureeLabel}</div>
        <div class="timeline">${timeline}</div>
      </div>
      ${sidesCard(plan)}
      ${tips}`;
  }

  /* ---------- Onglet : Recettes ---------- */
  function renderRecipeList() {
    $("#recipe-detail").innerHTML = "";
    const host = $("#recipe-list");
    host.style.display = "grid";
    host.innerHTML = RECIPES.map((r) => `
      <div class="recipe-card" data-id="${r.id}">
        <div class="recipe-card__emoji">${r.emoji}</div>
        <div class="recipe-card__name">${esc(r.nom)}</div>
        <div class="recipe-card__meta">⏱️ ${r.duree} min · ${r.temp}° · ${esc(r.portions)}</div>
        <div class="recipe-tags">${r.tags.map((t) => `<span class="recipe-tag">${esc(t)}</span>`).join("")}</div>
      </div>`).join("");
    $$(".recipe-card", host).forEach((c) =>
      c.addEventListener("click", () => renderRecipeDetail(c.dataset.id))
    );
  }

  function renderRecipeDetail(id) {
    const r = RECIPES.find((x) => x.id === id);
    if (!r) return;
    $("#recipe-list").style.display = "none";
    const timeline = r.timeline.map((s, i) => `
      <div class="tl-step ${i === r.timeline.length - 1 ? "tl-step--final" : ""}">
        <div class="tl-time">${String(Math.floor(s.t)).padStart(2, "0")}:00</div>
        <div class="tl-body"><div class="tl-action">${esc(s.txt)}</div></div>
      </div>`).join("");

    $("#recipe-detail").innerHTML = `
      <button class="back-btn" id="back-recipes">← Toutes les recettes</button>
      <div class="plan-head">
        <div class="plan-head__title">${r.emoji} ${esc(r.nom)}</div>
        <div class="plan-badges">
          <div class="badge"><div class="badge__num">${r.temp}°</div><div class="badge__lbl">Température</div></div>
          <div class="badge"><div class="badge__num">${r.duree} min</div><div class="badge__lbl">Durée</div></div>
          <div class="badge"><div class="badge__num">${esc(r.portions)}</div><div class="badge__lbl">Portions</div></div>
        </div>
      </div>
      <div class="plan-card">
        <div class="section-title">🛒 Ingrédients</div>
        <ul class="ingredients-list">${r.ingredients.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
      </div>
      ${r.prep ? `<div class="plan-card"><div class="section-title">🧑‍🍳 Préparation</div>${r.prep.map((p) => `<div class="prep-line">${esc(p)}</div>`).join("")}</div>` : ""}
      <div class="plan-card">
        <div class="section-title">⏱️ Déroulé — une seule cuisson</div>
        <div class="timeline">${timeline}</div>
      </div>`;
    $("#back-recipes").addEventListener("click", renderRecipeList);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---------- Onglet : Placard ---------- */
  function renderSpices() {
    const host = $("#spice-grid");
    const set = pantrySet();
    host.innerHTML = SPICES.map((s) => `
      <div class="spice-item ${set.has(s.id) ? "spice-item--on" : ""}" data-id="${s.id}">
        <span class="spice-item__box">${set.has(s.id) ? "✓" : ""}</span>
        <span>${s.emoji} ${esc(s.nom)}</span>
      </div>`).join("");
    $$(".spice-item", host).forEach((el) => {
      el.addEventListener("click", () => {
        const id = el.dataset.id;
        const idx = pantry.indexOf(id);
        if (idx >= 0) pantry.splice(idx, 1);
        else pantry.push(id);
        store.set("pantry", pantry);
        el.classList.toggle("spice-item--on");
        el.querySelector(".spice-item__box").textContent = pantry.includes(id) ? "✓" : "";
      });
    });
  }

  /* ---------- Init ---------- */
  renderIngredients();
  updateSelectionBar();
  renderSizePanel();
  renderRecipeList();
  renderSpices();
})();
