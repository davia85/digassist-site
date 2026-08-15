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

  function renderSizePanel() {
    const host = $("#size-panel");
    const list = [...selected].map((id) => INGREDIENTS.find((i) => i.id === id))
      .filter((i) => i && SIZE_SENSITIVE.includes(i.id));
    if (list.length === 0) { host.hidden = true; host.innerHTML = ""; return; }
    host.hidden = false;
    host.innerHTML = `
      <div class="size-panel__title">📏 Taille des morceaux <span>(le plus important pour bien cuire !)</span></div>
      ${list.map((i) => {
        const cur = sizes[i.id] || "moyen";
        return `<div class="size-row">
          <div class="size-row__name">${i.emoji} ${esc(i.nom)}</div>
          <div class="size-seg" data-id="${i.id}">
            ${SIZE_OPTS.map((o) => `<button class="size-btn ${cur === o.key ? "size-btn--on" : ""}" data-size="${o.key}">${o.label}</button>`).join("")}
          </div>
        </div>`;
      }).join("")}`;
    $$(".size-btn", host).forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.closest(".size-seg").dataset.id;
        sizes[id] = btn.dataset.size;
        store.set("sizes", sizes);
        $$(`.size-seg[data-id="${id}"] .size-btn`, host).forEach((b) => b.classList.remove("size-btn--on"));
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
    const plan = Engine.buildPlan([...selected], pantrySet(), sizes);
    renderPlan(plan);
    $("#plan-output").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  function renderPlan(plan) {
    const out = $("#plan-output");
    if (!plan) { out.innerHTML = ""; return; }

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
        ${p.sechage ? `<div class="prep-line">💧 <b>Séchage :</b> ${esc(p.sechage)}</div>` : ""}
        <div class="prep-line">🧂 <b>Assaisonnement :</b> ${esc(p.epices)}</div>
        ${p.astuce ? `<div class="prep-note">👉 ${esc(p.astuce)}</div>` : ""}
        ${p.manque.length ? `<div class="missing">Astuce goût : avec ${p.manque.slice(0,3).map((s)=>esc(s.nom)).join(", ")} ce serait encore meilleur.</div>` : ""}
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

    out.innerHTML = `
      <div class="plan-head">
        <div class="plan-head__title">🔥 Ta cuisson synchronisée</div>
        ${badges}
      </div>
      ${warn}
      <div class="plan-card">
        <div class="section-title">🧑‍🍳 Préparation</div>
        ${prep}
      </div>
      <div class="plan-card">
        <div class="section-title">⏱️ Déroulé — une seule cuisson</div>
        <div class="timeline">${timeline}</div>
      </div>
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
