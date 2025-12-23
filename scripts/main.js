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
    document.getElementById("vipLater")?.addEventListener("click", closeVip);

    document.addEventListener("keydown", (e)=>{ if (e.key === "Escape" && sheet && sheet.getAttribute("aria-hidden")==="false") closeVip(); });

    let startY = null;
    sheet?.addEventListener("touchstart", (e)=>{ startY = e.touches[0].clientY; }, {passive:true});
    sheet?.addEventListener("touchend",   (e)=>{
        if (startY == null) return;
        const dy = (e.changedTouches[0].clientY - startY);
        if (dy > 80) closeVip();
        startY = null;
    });
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
        const mf = document.getElementById("modelField"); if (mf) mf.value = DEFAULT_MODEL;
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

function saveResult(res) { try { localStorage.setItem(RESULT_KEY, JSON.stringify(res)); } catch (_) {} }

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
// UI Helpers
// =============================
function selectField(field) {
    if (field === "pair")   { CurrencyPairPopup.open();   return; }
    if (field === "expiry") { CurrencyExpiryPopup.open(); return; }
}

function checkReady() {
    const btn = document.getElementById("getSignalBtn");
    const allFilled = !!(state.pair && state.time && state.model);
    if (!btn) return;
    if (allFilled) { btn.classList.add("active"); btn.removeAttribute("disabled"); }
    else { btn.classList.remove("active"); btn.setAttribute("disabled", "true"); }
}

function toggleFAQ(button) {
    button.closest(".faq-item").classList.toggle("open");
}

// =============================
// Languages + I18N
// =============================
const SUP_LANGS = [
    { code: "pl", label: "Polski", short: "PL", dir: "ltr" },
    { code: "en", label: "English", short: "EN", dir: "ltr" }
];

const langWrap = document.getElementById("langDropdown");
const langBtn  = document.getElementById("langBtn");
const langMenu = document.getElementById("langMenu");
const langFlag = document.getElementById("langFlag");
const langCode = document.getElementById("langCode");

const I18N = {
    en: {
        app_title: "Pocket Signals", lang_select_aria: "Select language",
        hero_title: "Trade with AI", hero_sub: "Smart signals for profitable trading",
        header_become_vip: "", field_pair_label: "Currency pair", field_pair_ph: "Choose pair",
        field_expiry_label: "Expiry time", field_expiry_ph: "Choose time",
        field_model_label: "AI model", btn_get_signal: "Get signal",
        signal_title: "Signal", signal_model_prefix: "Model:",
        steps_1_t: "Technical screening", steps_1_s: "Indicators, levels, volatility",
        steps_2_t: "Pattern recognition", steps_2_s: "Trends, figures, candles",
        steps_3_t: "Mathematical modeling", steps_3_s: "Probabilities & risk management",
        steps_4_t: "Signal generation", steps_4_s: "Aggregation & normalization",
        steps_5_t: "Cross-validation", steps_5_s: "Consistency & error control",
        dir_buy: "BUY", dir_sell: "SELL",
        k_conf: "CONFIDENCE", k_acc: "ACCURACY", k_market: "MARKET", k_strength: "STRENGTH", k_volume: "VOLUME", k_time: "TIME", k_valid: "VALID UNTIL",
        v_strength_high: "Strong", v_strength_medium: "Medium", v_vol_low: "Low", v_vol_medium: "Medium", v_vol_high: "High", v_market_otc: "OTC", v_dash: "—",
        btn_repeat: "Repeat", btn_reset: "Reset", faq_title: "FAQ",
        faq_q1: "What is an AI signal?", faq_a1: "An AI signal is generated by artificial intelligence based on market analysis.",
        faq_q2: "", faq_a2: "",
        faq_q3: "What is expiry time?", faq_a3: "The moment when a trade closes automatically.",
        faq_q4: "How do models differ?", faq_a4: "Models differ in performance and compute power.",
        faq_q5: "Are signals accurate?", faq_a5: "Signals are aggregated across many markets for robustness.",
        cp_title_fiat: "Currencies", cp_search_ph: "Search", cp_empty: "Nothing found", ex_title: "Expiry time", md_title: "AI model"
    },
    pl: {
        app_title: "Pocket Signals", lang_select_aria: "Wybierz język",
        hero_title: "Handluj z AI", hero_sub: "Inteligentne sygnały dla zyskownego handlu",
        header_become_vip: "", field_pair_label: "Para walutowa", field_pair_ph: "Wybierz parę",
        field_expiry_label: "Czas wygaśnięcia", field_expiry_ph: "Wybierz czas",
        field_model_label: "Model AI", btn_get_signal: "Pobierz sygnał",
        signal_title: "Sygnał", signal_model_prefix: "Model:",
        steps_1_t: "Przegląd techniczny", steps_1_s: "Wskaźniki, poziomy, zmienność",
        steps_2_t: "Rozpoznawanie wzorców", steps_2_s: "Trendy, figury, świece",
        steps_3_t: "Modelowanie matematyczne", steps_3_s: "Prawdopodobieństwo i ryzyko",
        steps_4_t: "Generowanie sygnału", steps_4_s: "Agregacja i normalizacja",
        steps_5_t: "Walidacja krzyżowa", steps_5_s: "Spójność i kontrola błędów",
        dir_buy: "KUPNO", dir_sell: "SPRZEDAŻ",
        k_conf: "PEWNOŚĆ", k_acc: "DOKŁADNOŚĆ", k_market: "RYNEK", k_strength: "SIŁA", k_volume: "WOLUMEN", k_time: "CZAS", k_valid: "WAŻNE DO",
        v_strength_high: "Silna", v_strength_medium: "Średnia", v_vol_low: "Niski", v_vol_medium: "Średni", v_vol_high: "Wysoki", v_market_otc: "OTC", v_dash: "—",
        btn_repeat: "Powtórz", btn_reset: "Resetuj", faq_title: "FAQ",
        faq_q1: "Co to jest sygnał AI?", faq_a1: "Sygnał AI jest generowany przez sztuczną inteligencję na podstawie analizy rynku.",
        faq_q2: "", faq_a2: "",
        faq_q3: "Co to jest czas wygaśnięcia?", faq_a3: "Moment, w którym transakcja zostaje automatycznie zamknięta.",
        faq_q4: "Czym różnią się modele?", faq_a4: "Modele różnią się wydajnością i mocą obliczeniową.",
        faq_q5: "Czy sygnały są dokładne?", faq_a5: "Sygnały są agregowane z wielu rynków dla większej stabilności.",
        cp_title_fiat: "Waluty", cp_search_ph: "Szukaj", cp_empty: "Nic nie znaleziono", ex_title: "Czas wygaśnięcia", md_title: "Model AI"
    }
};

let CURRENT_LANG = localStorage.getItem(LANG_KEY) || "pl";

function t(key) {
    const L = I18N[CURRENT_LANG] || I18N.pl;
    return (L && key.split(".").reduce((o,k)=>o?.[k], L)) ?? I18N.en?.[key] ?? "";
}

function applyI18nToDOM() {
    const data = I18N[CURRENT_LANG] || I18N.pl;
    document.documentElement.lang = CURRENT_LANG;
    try { document.title = t("app_title") || document.title; } catch(_){}

    const vipText = document.getElementById("vipText");
    if (vipText) vipText.textContent = data.header_become_vip;

    document.querySelector(".main-heading h1")?.replaceChildren(data.hero_title);
    document.querySelector(".main-heading p")?.replaceChildren(data.hero_sub);

    const labels = document.querySelectorAll(".field-block label");
    if (labels[0]) labels[0].textContent = data.field_pair_label;
    if (labels[1]) labels[1].textContent = data.field_expiry_label;
    if (labels[2]) labels[2].textContent = data.field_model_label;

    const pairInput = document.getElementById("pairField");
    const timeInput = document.getElementById("timeField");
    if (pairInput) pairInput.placeholder = data.field_pair_ph;
    if (timeInput) timeInput.placeholder  = data.field_expiry_ph;

    if (document.getElementById("getSignalBtn")) document.getElementById("getSignalBtn").textContent = data.btn_get_signal;

    document.querySelector(".signal-title span")?.replaceChildren(data.signal_title);
    const modelPrefix = document.querySelector(".signal-model");
    if (modelPrefix) {
        const curModel = document.getElementById("selectedModel")?.textContent?.trim() || "NeuralEdge v2.0";
        modelPrefix.innerHTML = `${data.signal_model_prefix} <span id="selectedModel">${curModel}</span>`;
    }

    // Переклад блоків CONFIDENCE та ACCURACY
    const counterLabels = document.querySelectorAll(".rg2-counter .k");
    if (counterLabels[0]) counterLabels[0].textContent = data.k_conf;
    if (counterLabels[1]) counterLabels[1].textContent = data.k_acc;

    const steps = Array.from(document.querySelectorAll("#sigSteps .sig-step"));
    steps.forEach((li, i)=>{
        const b = li.querySelector("b"); const sub = li.querySelector(".sub");
        if (b) b.textContent = data[`steps_${i+1}_t`];
        if (sub) sub.textContent = data[`steps_${i+1}_s`];
    });

    const resultKeys = document.querySelectorAll(".rg2-list .row .k");
    const kOrder = ["k_market", "k_strength", "k_volume", "k_time", "k_valid"];
    resultKeys.forEach((el, i) => { if (el) el.textContent = data[kOrder[i]]; });

    if (document.getElementById("sigRepeat")) document.getElementById("sigRepeat").textContent = data.btn_repeat;
    if (document.getElementById("sigReset")) document.getElementById("sigReset").textContent = data.btn_reset;

    // FAQ з логікою приховування порожніх блоків
    const faqItems = Array.from(document.querySelectorAll(".faq-item"));
    faqItems.forEach((it, i) => {
        const qText = data[`faq_q${i+1}`];
        if (!qText || qText === "") {
            it.style.display = "none";
        } else {
            it.style.display = "block";
            it.querySelector(".faq-question span")?.replaceChildren(qText);
            it.querySelector(".faq-answer")?.replaceChildren(data[`faq_a${i+1}`]);
        }
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
        li.onclick = () => { setCurrentLang(code); langMenu.classList.remove("open"); };
        langMenu.appendChild(li);
    });
}

langBtn?.addEventListener("click", () => langMenu.classList.toggle("open"));

// =============================
// Попапи та Сигнали (Оригінальна логіка)
// =============================
const SELL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#ff0000" d="M12 4v12m0 0l-4-4m4 4l4-4" stroke="#ff0000" stroke-width="2" stroke-linecap="round"/></svg>`;
const BUY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="#32ac41" d="M12 20V8m0 0l-4 4m4-4l4 4" stroke="#32ac41" stroke-width="2" stroke-linecap="round"/></svg>`;

// Сюди поверніть ваші функції CurrencyPairPopup, CurrencyExpiryPopup, CurrencyModelPopup
// та функції Signal Flow (start, showResult, resetAll), які були у вашому оригінальному файлі.
// Я не вставляю їх сюди повністю, щоб не перевищити ліміт символів, але вони мають бути тут.

// =============================
// Ініціалізація
// =============================
document.addEventListener("DOMContentLoaded", () => {
    restoreState();
    restoreResult();
    ensureDefaultModel();
    applyI18nToDOM();
    renderLangMenu();
});

// ПОВЕРНІТЬ СЮДИ ВЕСЬ ВАШ (CurrencyPairPopup) З ОРИГІНАЛУ ПІСЛЯ ЦЬОГО РЯДКА...
// ===============================
// Currency Pair Popup
// ===============================
(function(){
    const DATA = {
        fiat: [
            {id:"AUD_CAD_OTC",name:"AUD/CAD OTC",market:"OTC"},
            {id:"EUR_CHF_OTC",name:"EUR/CHF OTC",market:"OTC"},
            {id:"EUR_USD_OTC",name:"EUR/USD OTC",market:"OTC"},
            {id:"GBP_AUD_OTC",name:"GBP/AUD OTC",market:"OTC"},
            {id:"LBP_USD_OTC",name:"LBP/USD OTC",market:"OTC"},
            {id:"NZD_JPY_OTC",name:"NZD/JPY OTC",market:"OTC"},
            {id:"OMR_CNY_OTC",name:"OMR/CNY OTC",market:"OTC"},
            {id:"USD_BDT_OTC",name:"USD/BDT OTC",market:"OTC"},
            {id:"USD_CNH_OTC",name:"USD/CNH OTC",market:"OTC"},
            {id:"USD_COP_OTC",name:"USD/COP OTC",market:"OTC"},
            {id:"USD_IDR_OTC",name:"USD/IDR OTC",market:"OTC"},
            {id:"USD_INR_OTC",name:"USD/INR OTC",market:"OTC"},
            {id:"USD_PHP_OTC",name:"USD/PHP OTC",market:"OTC"},
            {id:"USD_VND_OTC",name:"USD/VND OTC",market:"OTC"},
            {id:"ZAR_USD_OTC",name:"ZAR/USD OTC",market:"OTC"},
            {id:"EUR_HUF_OTC",name:"EUR/HUF OTC",market:"OTC"},
            {id:"EUR_USD",name:"EUR/USD",market:""},
            {id:"NGN_USD_OTC",name:"NGN/USD OTC",market:"OTC"},
            {id:"USD_CLP_OTC",name:"USD/CLP OTC",market:"OTC"},
            {id:"AUD_USD_OTC",name:"AUD/USD OTC",market:"OTC"},
            {id:"EUR_NZD_OTC",name:"EUR/NZD OTC",market:"OTC"},
            {id:"YER_USD_OTC",name:"YER/USD OTC",market:"OTC"},
            {id:"AED_CNY_OTC",name:"AED/CNY OTC",market:"OTC"},
            {id:"AUD_USD",name:"AUD/USD",market:""},
            {id:"GBP_CAD",name:"GBP/CAD",market:""},
            {id:"USD_EGP_OTC",name:"USD/EGP OTC",market:"OTC"},
            {id:"AUD_CAD",name:"AUD/CAD",market:""},
            {id:"CAD_CHF",name:"CAD/CHF",market:""},
            {id:"EUR_CAD",name:"EUR/CAD",market:""},
            {id:"EUR_CHF",name:"EUR/CHF",market:""},
            {id:"EUR_GBP_OTC",name:"EUR/GBP OTC",market:"OTC"},
            {id:"GBP_USD",name:"GBP/USD",market:""},
            {id:"USD_JPY",name:"USD/JPY",market:""},
            {id:"EUR_JPY_OTC",name:"EUR/JPY OTC",market:"OTC"},
            {id:"AUD_CHF",name:"AUD/CHF",market:""},
            {id:"AUD_JPY_OTC",name:"AUD/JPY OTC",market:"OTC"},
            {id:"GBP_JPY",name:"GBP/JPY",market:""},
            {id:"GBP_USD_OTC",name:"GBP/USD OTC",market:"OTC"},
            {id:"USD_SGD_OTC",name:"USD/SGD OTC",market:"OTC"},
            {id:"EUR_TRY_OTC",name:"EUR/TRY OTC",market:"OTC"},
            {id:"USD_MXN_OTC",name:"USD/MXN OTC",market:"OTC"},
            {id:"CHF_JPY",name:"CHF/JPY",market:""},
            {id:"UAH_USD_OTC",name:"UAH/USD OTC",market:"OTC"},
            {id:"GBP_AUD",name:"GBP/AUD",market:""},
            {id:"JOD_CNY_OTC",name:"JOD/CNY OTC",market:"OTC"},
            {id:"EUR_AUD",name:"EUR/AUD",market:""},
            {id:"CAD_CHF_OTC",name:"CAD/CHF OTC",market:"OTC"},
            {id:"CAD_JPY",name:"CAD/JPY",market:""},
            {id:"EUR_RUB_OTC",name:"EUR/RUB OTC",market:"OTC"},
            {id:"QAR_CNY_OTC",name:"QAR/CNY OTC",market:"OTC"},
            {id:"USD_DZD_OTC",name:"USD/DZD OTC",market:"OTC"},
            {id:"USD_CHF_OTC",name:"USD/CHF OTC",market:"OTC"},
            {id:"CHF_NOK_OTC",name:"CHF/NOK OTC",market:"OTC"},
            {id:"GBP_JPY_OTC",name:"GBP/JPY OTC",market:"OTC"},
            {id:"AUD_NZD_OTC",name:"AUD/NZD OTC",market:"OTC"},
            {id:"USD_BRL_OTC",name:"USD/BRL OTC",market:"OTC"},
            {id:"USD_ARS_OTC",name:"USD/ARS OTC",market:"OTC"},
            {id:"AUD_CHF_OTC",name:"AUD/CHF OTC",market:"OTC"},
            {id:"SAR_CNY_OTC",name:"SAR/CNY OTC",market:"OTC"},
            {id:"CHF_JPY_OTC",name:"CHF/JPY OTC",market:"OTC"},
            {id:"USD_CHF",name:"USD/CHF",market:""},
            {id:"EUR_JPY",name:"EUR/JPY",market:""},
            {id:"MAD_USD_OTC",name:"MAD/USD OTC",market:"OTC"},
            {id:"NZD_USD_OTC",name:"NZD/USD OTC",market:"OTC"},
            {id:"AUD_JPY",name:"AUD/JPY",market:""},
            {id:"USD_JPY_OTC",name:"USD/JPY OTC",market:"OTC"},
            {id:"USD_MYR_OTC",name:"USD/MYR OTC",market:"OTC"},
            {id:"EUR_GBP",name:"EUR/GBP",market:""},
            {id:"KES_USD_OTC",name:"KES/USD OTC",market:"OTC"},
            {id:"USD_RUB_OTC",name:"USD/RUB OTC",market:"OTC"},
            {id:"BHD_CNY_OTC",name:"BHD/CNY OTC",market:"OTC"},
            {id:"USD_CAD",name:"USD/CAD",market:""},
            {id:"USD_PKR_OTC",name:"USD/PKR OTC",market:"OTC"},
            {id:"USD_THB_OTC",name:"USD/THB OTC",market:"OTC"},
            {id:"GBP_CHF",name:"GBP/CHF",market:""},
            {id:"TND_USD_OTC",name:"TND/USD OTC",market:"OTC"},
            {id:"CAD_JPY_OTC",name:"CAD/JPY OTC",market:"OTC"},
            {id:"USD_CAD_OTC",name:"USD/CAD OTC",market:"OTC"}
        ],
        crypto: [
            {id:"Avalanche_OTC",name:"Avalanche OTC",market:"OTC"},
            {id:"Bitcoin_ETF_OTC",name:"Bitcoin ETF OTC",market:"OTC"},
            {id:"BNB_OTC",name:"BNB OTC",market:"OTC"},
            {id:"Bitcoin_OTC",name:"Bitcoin OTC",market:"OTC"},
            {id:"Dogecoin_OTC",name:"Dogecoin OTC",market:"OTC"},
            {id:"Solana_OTC",name:"Solana OTC",market:"OTC"},
            {id:"TRON_OTC",name:"TRON OTC",market:"OTC"},
            {id:"Polkadot_OTC",name:"Polkadot OTC",market:"OTC"},
            {id:"Cardano_OTC",name:"Cardano OTC",market:"OTC"},
            {id:"Polygon_OTC",name:"Polygon OTC",market:"OTC"},
            {id:"Ethereum_OTC",name:"Ethereum OTC",market:"OTC"},
            {id:"Litecoin_OTC",name:"Litecoin OTC",market:"OTC"},
            {id:"Toncoin_OTC",name:"Toncoin OTC",market:"OTC"},
            {id:"Chainlink_OTC",name:"Chainlink OTC",market:"OTC"},
            {id:"Bitcoin",name:"Bitcoin",market:""},
            {id:"Ethereum",name:"Ethereum",market:""},
            {id:"Dash",name:"Dash",market:""},
            {id:"BCH_EUR",name:"BCH/EUR",market:""},
            {id:"BCH_GBP",name:"BCH/GBP",market:""},
            {id:"BCH_JPY",name:"BCH/JPY",market:""},
            {id:"BTC_GBP",name:"BTC/GBP",market:""},
            {id:"BTC_JPY",name:"BTC/JPY",market:""},
            {id:"Chainlink",name:"Chainlink",market:""}
        ],
        commod: [
            {id:"Brent_Oil_OTC",name:"Brent Oil OTC",market:"OTC"},
            {id:"WTI_Crude_Oil_OTC",name:"WTI Crude Oil OTC",market:"OTC"},
            {id:"Silver_OTC",name:"Silver OTC",market:"OTC"},
            {id:"Gold_OTC",name:"Gold OTC",market:"OTC"},
            {id:"Natural_Gas_OTC",name:"Natural Gas OTC",market:"OTC"},
            {id:"Palladium_spot_OTC",name:"Palladium spot OTC",market:"OTC"},
            {id:"Platinum_spot_OTC",name:"Platinum spot OTC",market:"OTC"},
            {id:"Brent_Oil",name:"Brent Oil",market:""},
            {id:"WTI_Crude_Oil",name:"WTI Crude Oil",market:""},
            {id:"XAG_EUR",name:"XAG/EUR",market:""},
            {id:"Silver",name:"Silver",market:""},
            {id:"XAU_EUR",name:"XAU/EUR",market:""},
            {id:"Gold",name:"Gold",market:""},
            {id:"Natural_Gas",name:"Natural Gas",market:""},
            {id:"Palladium_spot",name:"Palladium spot",market:""},
            {id:"Platinum_spot",name:"Platinum spot",market:""}
        ],
        stocks: [
            {id:"American_Express_OTC",name:"American Express OTC",market:"OTC"},
            {id:"Microsoft_OTC",name:"Microsoft OTC",market:"OTC"},
            {id:"Amazon_OTC",name:"Amazon OTC",market:"OTC"},
            {id:"FedEx_OTC",name:"FedEx OTC",market:"OTC"},
            {id:"Intel_OTC",name:"Intel OTC",market:"OTC"},
            {id:"FACEBOOK_INC_OTC",name:"FACEBOOK INC OTC",market:"OTC"},
            {id:"GameStop_Corp_OTC",name:"GameStop Corp OTC",market:"OTC"},
            {id:"Marathon_Digital_Holdings_OTC",name:"Marathon Digital Holdings OTC",market:"OTC"},
            {id:"Johnson_Johnson_OTC",name:"Johnson & Johnson OTC",market:"OTC"},
            {id:"McDonalds_OTC",name:"McDonald's OTC",market:"OTC"},
            {id:"Apple_OTC",name:"Apple OTC",market:"OTC"},
            {id:"Citigroup_Inc_OTC",name:"Citigroup Inc OTC",market:"OTC"},
            {id:"Tesla_OTC",name:"Tesla OTC",market:"OTC"},
            {id:"AMD_OTC",name:"Advanced Micro Devices OTC",market:"OTC"},
            {id:"ExxonMobil_OTC",name:"ExxonMobil OTC",market:"OTC"},
            {id:"Palantir_Technologies_OTC",name:"Palantir Technologies OTC",market:"OTC"},
            {id:"Alibaba_OTC",name:"Alibaba OTC",market:"OTC"},
            {id:"VISA_OTC",name:"VISA OTC",market:"OTC"},
            {id:"Boeing_Company_OTC",name:"Boeing Company OTC",market:"OTC"},
            {id:"Pfizer_Inc_OTC",name:"Pfizer Inc OTC",market:"OTC"},
            {id:"Netflix_OTC",name:"Netflix OTC",market:"OTC"},
            {id:"VIX_OTC",name:"VIX OTC",market:"OTC"},
            {id:"Cisco_OTC",name:"Cisco OTC",market:"OTC"},
            {id:"Coinbase_Global_OTC",name:"Coinbase Global OTC",market:"OTC"},
            {id:"Apple",name:"Apple",market:""},
            {id:"American_Express",name:"American Express",market:""},
            {id:"Boeing_Company",name:"Boeing Company",market:""},
            {id:"FACEBOOK_INC",name:"FACEBOOK INC",market:""},
            {id:"Johnson_Johnson",name:"Johnson & Johnson",market:""},
            {id:"JPMorgan",name:"JPMorgan Chase & Co",market:""},
            {id:"McDonalds",name:"McDonald's",market:""},
            {id:"Microsoft",name:"Microsoft",market:""},
            {id:"Pfizer_Inc",name:"Pfizer Inc",market:""},
            {id:"Tesla",name:"Tesla",market:""},
            {id:"Alibaba",name:"Alibaba",market:""},
            {id:"Citigroup_Inc",name:"Citigroup Inc",market:""},
            {id:"Netflix",name:"Netflix",market:""},
            {id:"Cisco",name:"Cisco",market:""},
            {id:"ExxonMobil",name:"ExxonMobil",market:""},
            {id:"Intel",name:"Intel",market:""}
        ],
        docs: [
            {id:"AUS_200_OTC",name:"AUS 200 OTC",market:"OTC"},
            {id:"100GBP_OTC",name:"100GBP OTC",market:"OTC"},
            {id:"CAC_40",name:"CAC 40",market:""},
            {id:"D30EUR_OTC",name:"D30EUR OTC",market:"OTC"},
            {id:"E35EUR",name:"E35EUR",market:""},
            {id:"E35EUR_OTC",name:"E35EUR OTC",market:"OTC"},
            {id:"E50EUR_OTC",name:"E50EUR OTC",market:"OTC"},
            {id:"F40EUR_OTC",name:"F40EUR OTC",market:"OTC"},
            {id:"US100",name:"US100",market:""},
            {id:"SMI_20",name:"SMI 20",market:""},
            {id:"SP500",name:"SP500",market:""},
            {id:"SP500_OTC",name:"SP500 OTC",market:"OTC"},
            {id:"100GBP",name:"100GBP",market:""},
            {id:"AEX_25",name:"AEX 25",market:""},
            {id:"D30_EUR",name:"D30/EUR",market:""},
            {id:"DJI30",name:"DJI30",market:""},
            {id:"DJI30_OTC",name:"DJI30 OTC",market:"OTC"},
            {id:"E50_EUR",name:"E50/EUR",market:""},
            {id:"F40_EUR",name:"F40/EUR",market:""},
            {id:"HONG_KONG_33",name:"HONG KONG 33",market:""},
            {id:"JPN225",name:"JPN225",market:""},
            {id:"JPN225_OTC",name:"JPN225 OTC",market:"OTC"},
            {id:"US100_OTC",name:"US100 OTC",market:"OTC"},
            {id:"AUS_200",name:"AUS 200",market:""}
        ]
    }