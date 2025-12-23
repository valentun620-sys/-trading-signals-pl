// =============================
// VIP Indicator & Bottom Sheet
// =============================
document.addEventListener("DOMContentLoaded", () => {
    const vipBtn = document.getElementById("vipBtn");
    const vipIndicator = document.getElementById("vipIndicator");
    const sheet = document.getElementById("vipSheet");

    const viewed = localStorage.getItem("vipViewed");
    if (!viewed && vipIndicator) vipIndicator.style.display = "block";

    function openVip(){
        if (vipIndicator) { vipIndicator.style.display = "none"; localStorage.setItem("vipViewed","true"); }
        sheet?.setAttribute("aria-hidden","false");
        document.body.style.overflow = "hidden";
    }
    function closeVip(){
        sheet?.setAttribute("aria-hidden","true");
        document.body.style.overflow = "";
    }

    sheet?.addEventListener("click", (e) => {
        const t = e.target;
        if (t.matches("[data-close]") || t.closest("#vipClose")) closeVip();
    });
    document.getElementById("vipClose")?.addEventListener("click", closeVip);
});

// =============================
// Global state (form)
// =============================
let state = {
    pair: null,
    time: null,
    expiry: null,
    expirySeconds: null,
    model: null
};

const DEFAULT_MODEL = "NeuralEdge v2.0";

function ensureDefaultModel(force = false) {
    if (force || !state.model) {
        state.model = DEFAULT_MODEL;
        const mf = document.getElementById("modelField");  if (mf) mf.value = DEFAULT_MODEL;
        const sm = document.getElementById("selectedModel"); if (sm) sm.textContent = DEFAULT_MODEL;
        saveState();
    }
    checkReady();
}

// =============================
// Persistence
// =============================
const STATE_KEY  = "ps_state_v2";
const RESULT_KEY = "ps_last_result_v1";
const LANG_KEY   = "ps_lang_v1";

function saveState() {
    try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch (_) {}
}

function restoreState() {
    try {
        const raw = localStorage.getItem(STATE_KEY);
        if (!raw) return;
        const s = JSON.parse(raw) || {};
        state.pair = s.pair ?? null;
        state.time = s.time ?? null;
        state.expiry = s.expiry ?? null;
        state.expirySeconds = Number.isFinite(s.expirySeconds) ? s.expirySeconds : null;
        state.model = s.model ?? null;
        const setVal = (id, v) => { const el = document.getElementById(id); if (el && v != null) el.value = v; };
        setVal("pairField",  state.pair);
        setVal("timeField",  state.time);
        setVal("modelField", state.model);
        const mSpan = document.getElementById("selectedModel");
        if (mSpan && state.model) mSpan.textContent = state.model;
        checkReady();
    } catch(_) {}
}

function saveResult(res) {
    try { localStorage.setItem(RESULT_KEY, JSON.stringify(res)); } catch (_) {}
}

function restoreResult() {
    try {
        const raw = localStorage.getItem(RESULT_KEY);
        if (!raw) return;
        const r = JSON.parse(raw);
        const dirEl = document.getElementById("sigDirection");
        if (dirEl) {
            dirEl.textContent = i18nFormatDirection(!!r.isBuy);
            dirEl.classList.toggle("buy",  !!r.isBuy);
            dirEl.classList.toggle("sell", !r.isBuy);
        }
        const iconBox = document.getElementById("sigDirIcon");
        if (iconBox) iconBox.innerHTML = r.isBuy ? BUY_SVG : SELL_SVG;
        const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v ?? t("v_dash"); };
        setText("sigPair",     r.pair);
        setText("sigConf",     r.conf);
        setText("sigAcc",      r.acc);
        setText("sigMarket",   i18nMarketOTC(r.market === "OTC"));
        setText("sigStrength", i18nFormatStrength(r.strCode || "Medium"));
        setText("sigVol",      i18nFormatVolume(r.volCode || "Medium"));
        setText("sigTime",     r.time);
        setText("sigValid",    r.valid);
        const viewA = document.getElementById("sigAnalysis");
        const viewR = document.getElementById("sigResult");
        if (viewA && viewR) { viewA.style.display = "none"; viewR.hidden = false; }
        document.body.classList.add("analysis-open");
    } catch(_) {}
}

// =============================
// Helpers (UI)
// =============================
function selectField(field) {
    if (field === "pair")   { CurrencyPairPopup.open();   return; }
    if (field === "expiry") { CurrencyExpiryPopup.open(); return; }
}

function checkReady() {
    const btn = document.getElementById("getSignalBtn");
    const allFilled = !!(state.pair && state.time && state.model);
    if (!btn) return;
    if (allFilled) {
        btn.classList.add("active");
        btn.removeAttribute("disabled");
    } else {
        btn.classList.remove("active");
        btn.setAttribute("disabled", "true");
    }
}

function toggleFAQ(button) {
    const item = button.closest(".faq-item");
    item.classList.toggle("open");
}

// =============================
// Languages + I18N (EN & PL ONLY)
// =============================
const SUP_LANGS = [
    { code: "en", label: "English", short: "EN", dir: "ltr" },
    { code: "pl", label: "Polski", short: "PL", dir: "ltr" },
];

const langWrap = document.getElementById("langDropdown");
const langBtn  = document.getElementById("langBtn");
const langMenu = document.getElementById("langMenu");
const langFlag = document.getElementById("langFlag");
const langCode = document.getElementById("langCode");

const I18N = {
    en: {
        app_title: "Pocket Signals",
        lang_select_aria: "Select language",
        hero_title: "Trade with AI",
        hero_sub: "Smart signals for profitable trading",
        header_become_vip: "VIP status",
        field_pair_label: "Currency pair",
        field_pair_ph: "Choose pair",
        field_expiry_label: "Expiry time",
        field_expiry_ph: "Choose time",
        field_model_label: "AI model",
        btn_get_signal: "Get signal",
        signal_title: "Signal",
        signal_model_prefix: "Model:",
        steps_1_t: "Technical screening",
        steps_1_s: "Indicators, levels, volatility",
        steps_2_t: "Pattern recognition",
        steps_2_s: "Trends, figures, candles",
        steps_3_t: "Mathematical modeling",
        steps_3_s: "Probabilities & risk management",
        steps_4_t: "Signal generation",
        steps_4_s: "Aggregation & normalization",
        steps_5_t: "Cross-validation",
        steps_5_s: "Consistency & error control",
        dir_buy: "BUY", dir_sell: "SELL",
        k_conf: "CONFIDENCE", k_acc: "ACCURACY", k_market: "MARKET", k_strength: "STRENGTH", k_volume: "VOLUME", k_time: "TIME", k_valid: "VALID UNTIL",
        v_strength_high: "Strong", v_strength_medium: "Medium", v_vol_low: "Low", v_vol_medium: "Medium", v_vol_high: "High", v_market_otc: "OTC", v_dash: "—",
        btn_repeat: "Repeat", btn_reset: "Reset",
        faq_title: "FAQ",
        faq_q1: "What is an AI signal?", faq_a1: "An AI signal is generated by artificial intelligence based on market analysis.",
        faq_q2: "Why VIP status?", faq_a2: "VIP speeds up analysis and improves signal quality.",
        faq_q3: "What is expiry time?", faq_a3: "The moment when a trade closes automatically.",
        faq_q4: "How do models differ?", faq_a4: "Models differ in performance and compute power.",
        faq_q5: "Are signals accurate?", faq_a5: "Signals are aggregated across many markets to increase robustness.",
        cp_title_fiat: "Currencies", cp_search_ph: "Search", cp_empty: "Nothing found",
        ex_title: "Expiry time", md_title: "AI model", v_dash: "—"
    },
    pl: {
        app_title: "Pocket Signals",
        lang_select_aria: "Wybierz język",
        hero_title: "Handluj z AI",
        hero_sub: "Inteligentne sygnały dla zyskownego handlu",
        header_become_vip: "Status VIP",
        field_pair_label: "Para walutowa",
        field_pair_ph: "Wybierz parę",
        field_expiry_label: "Czas wygaśnięcia",
        field_expiry_ph: "Wybierz czas",
        field_model_label: "Model AI",
        btn_get_signal: "Pobierz sygnał",
        signal_title: "Sygnał",
        signal_model_prefix: "Model:",
        steps_1_t: "Przegląd techniczny",
        steps_1_s: "Wskaźniki, poziomy, zmienność",
        steps_2_t: "Rozpoznawanie wzorców",
        steps_2_s: "Trendy, figury, świece",
        steps_3_t: "Modelowanie matematyczne",
        steps_3_s: "Prawdopodobieństwo i ryzyko",
        steps_4_t: "Generowanie sygnału",
        steps_4_s: "Agregacja i normalizacja",
        steps_5_t: "Walidacja krzyżowa",
        steps_5_s: "Spójność i kontrola błędów",
        dir_buy: "KUPNO", dir_sell: "SPRZEDAŻ",
        k_conf: "PEWNOŚĆ", k_acc: "DOKŁADNOŚĆ", k_market: "RYNEK", k_strength: "SIŁA", k_volume: "WOLUMEN", k_time: "CZAS", k_valid: "WAŻNE DO",
        v_strength_high: "Silna", v_strength_medium: "Średnia", v_vol_low: "Niski", v_vol_medium: "Średni", v_vol_high: "Wysoki", v_market_otc: "OTC", v_dash: "—",
        btn_repeat: "Powtórz", btn_reset: "Resetuj",
        faq_title: "FAQ",
        faq_q1: "Co to jest sygnał AI?", faq_a1: "Sygnał AI jest generowany przez sztuczną inteligencję na podstawie analizy rynku.",
        faq_q2: "Dlaczego status VIP?", faq_a2: "VIP przyspiesza analizę i poprawia jakość sygnałów.",
        faq_q3: "Co to jest czas wygaśnięcia?", faq_a3: "Moment, w którym transakcja zostaje automatycznie zamknięta.",
        faq_q4: "Czym różnią się modele?", faq_a4: "Modele różnią się wydajnością i mocą obliczeniową.",
        faq_q5: "Czy sygnały są dokładne?", faq_a5: "Sygnały są agregowane z wielu rynків dla większej stabilności.",
        cp_title_fiat: "Waluty", cp_search_ph: "Szukaj", cp_empty: "Nic nie znaleziono",
        ex_title: "Czas wygaśnięcia", md_title: "Model AI", v_dash: "—"
    }
};

let CURRENT_LANG = (localStorage.getItem(LANG_KEY) || "en");

function t(key) {
    const L = I18N[CURRENT_LANG] || I18N.en;
    return (L && key.split(".").reduce((o,k)=>o?.[k], L)) ?? I18N.en?.[key] ?? "";
}

function applyI18nToDOM() {
    const metaLang = SUP_LANGS.find(x=>x.code===CURRENT_LANG) || SUP_LANGS[0];
    document.documentElement.lang = metaLang.code;
    try { document.title = t("app_title") || document.title; } catch(_){}

    const vipText = document.getElementById("vipText");
    if (vipText) vipText.textContent = t("header_become_vip");

    document.querySelector(".main-heading h1")?.replaceChildren(t("hero_title"));
    document.querySelector(".main-heading p")?.replaceChildren(t("hero_sub"));

    const pairLabel = document.querySelector('.glass-card .field-block:nth-of-type(1) label');
    const expLabel  = document.querySelector('.glass-card .field-block:nth-of-type(2) label');
    const modelLabel= document.querySelector('.glass-card .field-block:nth-of-type(3) label');
    if (pairLabel) pairLabel.textContent = t("field_pair_label");
    if (expLabel)  expLabel.textContent  = t("field_expiry_label");
    if (modelLabel)modelLabel.textContent = t("field_model_label");

    const pairInput = document.getElementById("pairField");
    const timeInput = document.getElementById("timeField");
    if (pairInput) pairInput.placeholder = t("field_pair_ph");
    if (timeInput) timeInput.placeholder  = t("field_expiry_ph");

    const getBtn = document.getElementById("getSignalBtn");
    if (getBtn) getBtn.textContent = t("btn_get_signal");

    document.querySelector(".signal-title span")?.replaceChildren(t("signal_title"));

    const steps = Array.from(document.querySelectorAll("#sigSteps .sig-step"));
    steps.forEach((li, i)=>{
        const b = li.querySelector("b"); const sub = li.querySelector(".sub");
        if (b)   b.textContent = t(`steps_${i+1}_t`);
        if (sub) sub.textContent = t(`steps_${i+1}_s`);
    });

    const rows = Array.from(document.querySelectorAll(".rg2-list .row"));
    const kOrder = ["k_market","k_strength","k_volume","k_time","k_valid"];
    rows.forEach((row, idx)=>{
        const k = row.querySelector(".k");
        if (k) k.textContent = t(kOrder[idx]);
    });

    const rep = document.getElementById("sigRepeat");
    const rst = document.getElementById("sigReset");
    if (rep) rep.textContent = t("btn_repeat");
    if (rst) rst.textContent = t("btn_reset");

    const faqTitle = document.querySelector(".faq-title");
    if (faqTitle) faqTitle.textContent = t("faq_title");
    const faqItems = Array.from(document.querySelectorAll(".faq-item"));
    faqItems.forEach((it, i)=>{
        it.querySelector(".faq-question span")?.replaceChildren(t(`faq_q${i+1}`));
        it.querySelector(".faq-answer")?.replaceChildren(t(`faq_a${i+1}`));
    });

    if (langFlag) langFlag.src = `images/flags/${CURRENT_LANG}.svg`;
    if (langCode) langCode.textContent = CURRENT_LANG.toUpperCase();
}

function i18nFormatDirection(isBuy){ return isBuy ? t("dir_buy") : t("dir_sell"); }
function i18nFormatStrength(code){ return code==="High" ? t("v_strength_high") : t("v_strength_medium"); }
function i18nFormatVolume(code){ return code==="Low" ? t("v_vol_low") : (code==="High" ? t("v_vol_high") : t("v_vol_medium")); }
function i18nMarketOTC(isOtc){ return isOtc ? t("v_market_otc") : t("v_dash"); }

function setCurrentLang(code) {
    const found = SUP_LANGS.find(l => l.code === code) || SUP_LANGS[0];
    CURRENT_LANG = found.code;
    try { localStorage.setItem(LANG_KEY, found.code); } catch(_) {}
    applyI18nToDOM();
    renderLangMenu();
}

function renderLangMenu() {
    if (!langMenu) return;
    langMenu.innerHTML = "";
    SUP_LANGS.forEach(({ code, label, short }) => {
        const li = document.createElement("li");
        li.innerHTML = `<button role="option" aria-selected="${code === CURRENT_LANG}"><img class="lang-flag" src="images/flags/${code}.svg" alt=""> ${label} (${short})</button>`;
        li.onclick = () => {
            setCurrentLang(code);
            langMenu.classList.remove("open");
            langWrap?.classList.remove("open");
        };
        langMenu.appendChild(li);
    });
}

langBtn?.addEventListener("click", () => {
    langMenu.classList.toggle("open");
    langWrap.classList.toggle("open");
});

document.addEventListener("click", (e) => {
    if (!langWrap?.contains(e.target)) {
        langMenu?.classList.remove("open");
        langWrap?.classList.remove("open");
    }
});

const SELL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#ff0000" d="M12 19V5M12 19L5 12M12 19L19 12" stroke="#ff0000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const BUY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#32ac41" d="M12 5V19M12 5L5 12M12 5L19 12" stroke="#32ac41" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

restoreState();
restoreResult();
ensureDefaultModel();
applyI18nToDOM();
renderLangMenu();

// ===============================
// Popups Logic (Simplified)
// ===============================
(function(){
    const DATA = { fiat: [{id:"EURUSD",name:"EUR/USD",market:""}], crypto: [{id:"BTC",name:"Bitcoin",market:""}] };
    window.CurrencyPairPopup = {
        open: () => { document.getElementById("cpPopup").setAttribute("aria-hidden","false"); render(); },
        close: () => { document.getElementById("cpPopup").setAttribute("aria-hidden","true"); }
    };
    function render() {
        const list = document.getElementById("cpList");
        list.innerHTML = DATA.fiat.concat(DATA.crypto).map(it => `<div class="cp-item" onclick="selectPair('${it.name}')">${it.name}</div>`).join("");
    }
    window.selectPair = (name) => { state.pair = name; document.getElementById("pairField").value = name; CurrencyPairPopup.close(); checkReady(); saveState(); };

    window.CurrencyExpiryPopup = {
        open: () => { document.getElementById("exPopup").setAttribute("aria-hidden","false"); render(); },
        close: () => { document.getElementById("exPopup").setAttribute("aria-hidden","true"); }
    };
    function render() {
        const grid = document.getElementById("exGrid");
        grid.innerHTML = ["M1","M5","M15"].map(p => `<button class="ex-chip" onclick="selectExp('${p}')">${p}</button>`).join("");
    }
    window.selectExp = (p) => { state.time = p; document.getElementById("timeField").value = p; CurrencyExpiryPopup.close(); checkReady(); saveState(); };
})();

document.getElementById("getSignalBtn")?.addEventListener("click", () => {
    const viewA = document.getElementById("sigAnalysis");
    const viewR = document.getElementById("sigResult");
    const bar = document.getElementById("sigProgress");
    document.body.classList.add("analysis-open");
    viewR.hidden = true;
    viewA.style.display = "block";
    let p = 0;
    const interval = setInterval(() => {
        p += 5;
        bar.style.width = p + "%";
        if (p >= 100) { clearInterval(interval); showResult(); }
    }, 100);
});

function showResult() {
    const isBuy = Math.random() > 0.5;
    const res = { isBuy, pair: state.pair, conf: "85%", acc: "92%", market: "OTC", strCode: "High", volCode: "Medium", time: state.time, valid: "5 min" };
    saveResult(res);
    restoreResult();
}

document.getElementById("sigReset")?.addEventListener("click", () => {
    localStorage.removeItem(STATE_KEY);
    localStorage.removeItem(RESULT_KEY);
    location.reload();
});