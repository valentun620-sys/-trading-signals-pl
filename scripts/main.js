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
// Global state
// =============================
let state = {
    pair: null,
    time: null,
    expiry: null,
    expirySeconds: null,
    model: "NeuralEdge v2.0"
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

function saveState() { try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch (_) {} }

function restoreState() {
    try {
        const raw = localStorage.getItem(STATE_KEY);
        if (!raw) return;
        const s = JSON.parse(raw) || {};
        state.pair = s.pair ?? null;
        state.time = s.time ?? null;
        state.expiry = s.expiry ?? null;
        state.expirySeconds = Number.isFinite(s.expirySeconds) ? s.expirySeconds : null;
        state.model = s.model ?? DEFAULT_MODEL;
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
        const setText = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v ?? "—"; };
        setText("sigPair", r.pair);
        setText("sigConf", r.conf);
        setText("sigAcc", r.acc);
        setText("sigMarket", i18nMarketOTC(r.market === "OTC"));
        setText("sigStrength", i18nFormatStrength(r.strCode || "Medium"));
        setText("sigVol", i18nFormatVolume(r.volCode || "Medium"));
        setText("sigTime", r.time);
        setText("sigValid", r.valid);
        const viewA = document.getElementById("sigAnalysis");
        const viewR = document.getElementById("sigResult");
        if (viewA && viewR) { viewA.style.display = "none"; viewR.hidden = false; }
        document.body.classList.add("analysis-open");
    } catch(_) {}
}

// =============================
// Helpers
// =============================
function selectField(field) {
    if (field === "pair") { CurrencyPairPopup.open(); return; }
    if (field === "expiry") { CurrencyExpiryPopup.open(); return; }
}

function checkReady() {
    const btn = document.getElementById("getSignalBtn");
    const allFilled = !!(state.pair && state.time && state.model);
    if (!btn) return;
    if (allFilled) { btn.classList.add("active"); btn.removeAttribute("disabled"); }
    else { btn.classList.remove("active"); btn.setAttribute("disabled", "true"); }
}

function toggleFAQ(button) { button.closest(".faq-item").classList.toggle("open"); }

// =============================
// Languages (PL & EN Only)
// =============================
const SUP_LANGS = [
    { code: "pl", label: "Polski", short: "PL", dir: "ltr" },
    { code: "en", label: "English", short: "EN", dir: "ltr" }
];

const I18N = {
    pl: {
        app_title: "Pocket Signals", lang_select_aria: "Wybierz język",
        hero_title: "Handluj z AI", hero_sub: "Inteligentne sygnały dla zyskownego handlu",
        header_become_vip: "", field_pair_label: "Para walutowa", field_pair_ph: "Wybierz parę",
        field_expiry_label: "Czas wygaśnięcia", field_expiry_ph: "Wybierz czas",
        field_model_label: "Model AI", btn_get_signal: "Pobierz sygnał",
        signal_title: "Sygnał", signal_model_prefix: "Model:",
        steps_1_t: "Screening techniczny", steps_1_s: "Wskaźniki, poziomy, zmienność",
        steps_2_t: "Wzorce", steps_2_s: "Trendy, figury, świece",
        steps_3_t: "Modelowanie", steps_3_s: "Prawdopodobieństwo i ryzyko",
        steps_4_t: "Generowanie", steps_4_s: "Agregacja i normalizacja",
        steps_5_t: "Walidacja", steps_5_s: "Spójność i kontrola błędów",
        dir_buy: "KUPNO", dir_sell: "SPRZEDAŻ",
        k_conf: "PEWNOŚĆ", k_acc: "DOKŁADNOŚĆ", k_market: "RYNEK", k_strength: "SIŁA", k_volume: "WOLUMEN", k_time: "CZAS", k_valid: "WAŻNE DO",
        v_strength_high: "Silna", v_strength_medium: "Średnia", v_vol_low: "Niski", v_vol_medium: "Średni", v_vol_high: "Wysoki", v_market_otc: "OTC", v_dash: "—",
        btn_repeat: "Powtórz", btn_reset: "Resetuj", faq_title: "FAQ",
        faq_q1: "Co to jest sygnał AI?", faq_a1: "Sygnał generowany przez sztuczną inteligencję na podstawie analizy rynku.",
        faq_q2: "", faq_a2: "",
        faq_q3: "Co to jest czas wygaśnięcia?", faq_a3: "Moment zamknięcia transakcji. Wybierz odpowiedni dla swojej strategii.",
        faq_q4: "Czym różnią się modele?", faq_a4: "Modele różnią się wydajnością i mocą obliczeniową.",
        faq_q5: "Czy sygnały są dokładne?", faq_a5: "Sygnały są agregowane z wielu giełd dla większej stabilności.",
        cp_title_fiat: "Waluty", cp_title_crypto: "Krypto", cp_title_commod: "Towary", cp_title_stocks: "Akcje", cp_title_docs: "Indeksy", cp_search_ph: "Szukaj", cp_empty: "Nic nie znaleziono", ex_title: "Czas wygaśnięcia", md_title: "Model AI"
    },
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
        cp_title_fiat: "Currencies", cp_title_crypto: "Crypto", cp_title_commod: "Commodities", cp_title_stocks: "Stocks", cp_title_docs: "Indices", cp_search_ph: "Search", cp_empty: "Nothing found", ex_title: "Expiry time", md_title: "AI model"
    }
};

let CURRENT_LANG = localStorage.getItem(LANG_KEY) || "pl";
const langFlag = document.getElementById("langFlag");
const langCode = document.getElementById("langCode");
const langMenu = document.getElementById("langMenu");
const langBtn  = document.getElementById("langBtn");

function t(key) { return I18N[CURRENT_LANG][key] || I18N.pl[key]; }

function applyI18nToDOM() {
    const data = I18N[CURRENT_LANG];
    document.documentElement.lang = CURRENT_LANG;
    
    document.getElementById("vipText").textContent = data.header_become_vip;
    document.querySelector(".main-heading h1").textContent = data.hero_title;
    document.querySelector(".main-heading p").textContent = data.hero_sub;

    const labels = document.querySelectorAll(".field-block label");
    labels[0].textContent = data.field_pair_label;
    labels[1].textContent = data.field_expiry_label;
    labels[2].textContent = data.field_model_label;
    
    document.getElementById("pairField").placeholder = data.field_pair_ph;
    document.getElementById("timeField").placeholder = data.field_expiry_ph;
    document.getElementById("getSignalBtn").textContent = data.btn_get_signal;

    document.querySelector(".signal-title span").textContent = data.signal_title;
    document.querySelector(".signal-model").innerHTML = `${data.signal_model_prefix} <span id="selectedModel">${state.model}</span>`;

    const counters = document.querySelectorAll(".rg2-counter .k");
    counters[0].textContent = data.k_conf;
    counters[1].textContent = data.k_acc;

    const resultKeys = document.querySelectorAll(".rg2-list .row .k");
    const kOrder = ["k_market", "k_strength", "k_volume", "k_time", "k_valid"];
    resultKeys.forEach((el, i) => { el.textContent = data[kOrder[i]]; });

    const steps = document.querySelectorAll("#sigSteps .sig-step");
    steps.forEach((li, i) => {
        li.querySelector("b").textContent = data[`steps_${i+1}_t`];
        li.querySelector(".sub").textContent = data[`steps_${i+1}_s`];
    });

    const faqItems = document.querySelectorAll(".faq-item");
    faqItems.forEach((it, i) => {
        const q = data[`faq_q${i+1}`];
        if (!q) { it.style.display = "none"; } 
        else { 
            it.style.display = "block";
            it.querySelector(".faq-question span").textContent = q;
            it.querySelector(".faq-answer").textContent = data[`faq_a${i+1}`];
        }
    });

    document.getElementById("sigRepeat").textContent = data.btn_repeat;
    document.getElementById("sigReset").textContent = data.btn_reset;
    document.getElementById("langCode").textContent = CURRENT_LANG.toUpperCase();
    document.getElementById("langFlag").src = `images/flags/${CURRENT_LANG}.svg`;
}

function setCurrentLang(code) {
    CURRENT_LANG = code;
    localStorage.setItem(LANG_KEY, code);
    applyI18nToDOM();
    renderLangMenu();
}

function renderLangMenu() {
    langMenu.innerHTML = SUP_LANGS.map(l => `
        <li onclick="setCurrentLang('${l.code}')">
            <button role="option">
                <img class="lang-flag" src="images/flags/${l.code}.svg"> ${l.label}
            </button>
        </li>
    `).join("");
}

langBtn?.addEventListener("click", () => langMenu.classList.toggle("open"));

// =============================
// Icons
// =============================
const SELL_SVG = `<svg viewBox="0 0 24 24" width="70" height="70"><path d="M12 4v12m0 0l-4-4m4 4l4-4" stroke="#f3382c" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;
const BUY_SVG  = `<svg viewBox="0 0 24 24" width="70" height="70"><path d="M12 20V8m0 0l-4 4m4-4l4 4" stroke="#32ac41" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;

function i18nFormatDirection(isBuy){ return isBuy ? t("dir_buy") : t("dir_sell"); }
function i18nFormatStrength(code){ return code==="High" ? t("v_strength_high") : t("v_strength_medium"); }
function i18nFormatVolume(code){ return code==="Low" ? t("v_vol_low") : (code==="High" ? t("v_vol_high") : t("v_vol_medium")); }
function i18nMarketOTC(isOtc){ return isOtc ? "OTC" : "REAL"; }

// ===============================
// Currency Pair Popup (FULL DATA)
// ===============================
const CurrencyPairPopup = (function(){
    const DATA = {
        fiat: [
            {id:"AUD_CAD_OTC",name:"AUD/CAD OTC",market:"OTC"},{id:"EUR_CHF_OTC",name:"EUR/CHF OTC",market:"OTC"},
            {id:"EUR_USD_OTC",name:"EUR/USD OTC",market:"OTC"},{id:"GBP_AUD_OTC",name:"GBP/AUD OTC",market:"OTC"},
            {id:"LBP_USD_OTC",name:"LBP/USD OTC",market:"OTC"},{id:"NZD_JPY_OTC",name:"NZD/JPY OTC",market:"OTC"},
            {id:"OMR_CNY_OTC",name:"OMR/CNY OTC",market:"OTC"},{id:"USD_BDT_OTC",name:"USD/BDT OTC",market:"OTC"},
            {id:"USD_CNH_OTC",name:"USD/CNH OTC",market:"OTC"},{id:"USD_COP_OTC",name:"USD/COP OTC",market:"OTC"},
            {id:"USD_IDR_OTC",name:"USD/IDR OTC",market:"OTC"},{id:"USD_INR_OTC",name:"USD/INR OTC",market:"OTC"},
            {id:"USD_PHP_OTC",name:"USD/PHP OTC",market:"OTC"},{id:"USD_VND_OTC",name:"USD/VND OTC",market:"OTC"},
            {id:"ZAR_USD_OTC",name:"ZAR/USD OTC",market:"OTC"},{id:"EUR_HUF_OTC",name:"EUR/HUF OTC",market:"OTC"},
            {id:"EUR_USD",name:"EUR/USD",market:""},{id:"NGN_USD_OTC",name:"NGN/USD OTC",market:"OTC"},
            {id:"USD_CLP_OTC",name:"USD/CLP OTC",market:"OTC"},{id:"AUD_USD_OTC",name:"AUD/USD OTC",market:"OTC"},
            {id:"EUR_NZD_OTC",name:"EUR/NZD OTC",market:"OTC"},{id:"YER_USD_OTC",name:"YER/USD OTC",market:"OTC"},
            {id:"AED_CNY_OTC",name:"AED/CNY OTC",market:"OTC"},{id:"AUD_USD",name:"AUD/USD",market:""},
            {id:"GBP_CAD",name:"GBP/CAD",market:""},{id:"USD_EGP_OTC",name:"USD/EGP OTC",market:"OTC"},
            {id:"AUD_CAD",name:"AUD/CAD",market:""},{id:"CAD_CHF",name:"CAD/CHF",market:""},
            {id:"EUR_CAD",name:"EUR/CAD",market:""},{id:"EUR_CHF",name:"EUR/CHF",market:""},
            {id:"EUR_GBP_OTC",name:"EUR/GBP OTC",market:"OTC"},{id:"GBP_USD",name:"GBP/USD",market:""},
            {id:"USD_JPY",name:"USD/JPY",market:""},{id:"EUR_JPY_OTC",name:"EUR/JPY OTC",market:"OTC"},
            {id:"AUD_CHF",name:"AUD/CHF",market:""},{id:"AUD_JPY_OTC",name:"AUD/JPY OTC",market:"OTC"},
            {id:"GBP_JPY",name:"GBP/JPY",market:""},{id:"GBP_USD_OTC",name:"GBP/USD OTC",market:"OTC"},
            {id:"USD_SGD_OTC",name:"USD/SGD OTC",market:"OTC"},{id:"EUR_TRY_OTC",name:"EUR/TRY OTC",market:"OTC"},
            {id:"USD_MXN_OTC",name:"USD/MXN OTC",market:"OTC"},{id:"CHF_JPY",name:"CHF/JPY",market:""},
            {id:"UAH_USD_OTC",name:"UAH/USD OTC",market:"OTC"},{id:"GBP_AUD",name:"GBP/AUD",market:""},
            {id:"JOD_CNY_OTC",name:"JOD/CNY OTC",market:"OTC"},{id:"EUR_AUD",name:"EUR/AUD",market:""},
            {id:"CAD_CHF_OTC",name:"CAD/CHF OTC",market:"OTC"},{id:"CAD_JPY",name:"CAD/JPY",market:""},
            {id:"EUR_RUB_OTC",name:"EUR/RUB OTC",market:"OTC"},{id:"QAR_CNY_OTC",name:"QAR/CNY OTC",market:"OTC"},
            {id:"USD_DZD_OTC",name:"USD/DZD OTC",market:"OTC"},{id:"USD_CHF_OTC",name:"USD/CHF OTC",market:"OTC"},
            {id:"CHF_NOK_OTC",name:"CHF/NOK OTC",market:"OTC"},{id:"GBP_JPY_OTC",name:"GBP/JPY OTC",market:"OTC"},
            {id:"AUD_NZD_OTC",name:"AUD/NZD OTC",market:"OTC"},{id:"USD_BRL_OTC",name:"USD/BRL OTC",market:"OTC"},
            {id:"USD_ARS_OTC",name:"USD/ARS OTC",market:"OTC"},{id:"AUD_CHF_OTC",name:"AUD/CHF OTC",market:"OTC"},
            {id:"SAR_CNY_OTC",name:"SAR/CNY OTC",market:"OTC"},{id:"CHF_JPY_OTC",name:"CHF/JPY OTC",market:"OTC"},
            {id:"USD_CHF",name:"USD/CHF",market:""},{id:"EUR_JPY",name:"EUR/JPY",market:""},
            {id:"MAD_USD_OTC",name:"MAD/USD OTC",market:"OTC"},{id:"NZD_USD_OTC",name:"NZD/USD OTC",market:"OTC"},
            {id:"AUD_JPY",name:"AUD/JPY",market:""},{id:"USD_JPY_OTC",name:"USD/JPY OTC",market:"OTC"},
            {id:"USD_MYR_OTC",name:"USD/MYR OTC",market:"OTC"},{id:"EUR_GBP",name:"EUR/GBP",market:""},
            {id:"KES_USD_OTC",name:"KES/USD OTC",market:"OTC"},{id:"USD_RUB_OTC",name:"USD/RUB OTC",market:"OTC"},
            {id:"BHD_CNY_OTC",name:"BHD/CNY OTC",market:"OTC"},{id:"USD_CAD",name:"USD/CAD",market:""},
            {id:"USD_PKR_OTC",name:"USD/PKR OTC",market:"OTC"},{id:"USD_THB_OTC",name:"USD/THB OTC",market:"OTC"},
            {id:"GBP_CHF",name:"GBP/CHF",market:""},{id:"TND_USD_OTC",name:"TND/USD OTC",market:"OTC"},
            {id:"CAD_JPY_OTC",name:"CAD/JPY OTC",market:"OTC"},{id:"USD_CAD_OTC",name:"USD/CAD OTC",market:"OTC"}
        ],
        crypto: [
            {id:"Avalanche_OTC",name:"Avalanche OTC",market:"OTC"},{id:"Bitcoin_ETF_OTC",name:"Bitcoin ETF OTC",market:"OTC"},
            {id:"BNB_OTC",name:"BNB OTC",market:"OTC"},{id:"Bitcoin_OTC",name:"Bitcoin OTC",market:"OTC"},
            {id:"Dogecoin_OTC",name:"Dogecoin OTC",market:"OTC"},{id:"Solana_OTC",name:"Solana OTC",market:"OTC"},
            {id:"TRON_OTC",name:"TRON OTC",market:"OTC"},{id:"Polkadot_OTC",name:"Polkadot OTC",market:"OTC"},
            {id:"Cardano_OTC",name:"Cardano OTC",market:"OTC"},{id:"Polygon_OTC",name:"Polygon OTC",market:"OTC"},
            {id:"Ethereum_OTC",name:"Ethereum OTC",market:"OTC"},{id:"Litecoin_OTC",name:"Litecoin OTC",market:"OTC"},
            {id:"Toncoin_OTC",name:"Toncoin OTC",market:"OTC"},{id:"Chainlink_OTC",name:"Chainlink OTC",market:"OTC"},
            {id:"Bitcoin",name:"Bitcoin",market:""},{id:"Ethereum",name:"Ethereum",market:""},
            {id:"Dash",name:"Dash",market:""},{id:"BCH_EUR",name:"BCH/EUR",market:""},
            {id:"BCH_GBP",name:"BCH/GBP",market:""},{id:"BCH_JPY",name:"BCH/JPY",market:""},
            {id:"BTC_GBP",name:"BTC/GBP",market:""},{id:"BTC_JPY",name:"BTC/JPY",market:""},{id:"Chainlink",name:"Chainlink",market:""}
        ],
        commod: [
            {id:"Brent_Oil_OTC",name:"Brent Oil OTC",market:"OTC"},{id:"WTI_Crude_Oil_OTC",name:"WTI Crude Oil OTC",market:"OTC"},
            {id:"Silver_OTC",name:"Silver OTC",market:"OTC"},{id:"Gold_OTC",name:"Gold OTC",market:"OTC"},
            {id:"Natural_Gas_OTC",name:"Natural Gas OTC",market:"OTC"},{id:"Palladium_spot_OTC",name:"Palladium spot OTC",market:"OTC"},
            {id:"Platinum_spot_OTC",name:"Platinum spot OTC",market:"OTC"},{id:"Brent_Oil",name:"Brent Oil",market:""},
            {id:"WTI_Crude_Oil",name:"WTI Crude Oil",market:""},{id:"XAG_EUR",name:"XAG/EUR",market:""},
            {id:"Silver",name:"Silver",market:""},{id:"XAU_EUR",name:"XAU/EUR",market:""},
            {id:"Gold",name:"Gold",market:""},{id:"Natural_Gas",name:"Natural Gas",market:""},
            {id:"Palladium_spot",name:"Palladium spot",market:""},{id:"Platinum_spot",name:"Platinum spot",market:""}
        ],
        stocks: [
            {id:"Apple_OTC",name:"Apple OTC",market:"OTC"},{id:"Tesla_OTC",name:"Tesla OTC",market:"OTC"},
            {id:"Microsoft_OTC",name:"Microsoft OTC",market:"OTC"},{id:"Amazon_OTC",name:"Amazon OTC",market:"OTC"},
            {id:"Alibaba_OTC",name:"Alibaba OTC",market:"OTC"},{id:"Netflix_OTC",name:"Netflix OTC",market:"OTC"}
        ],
        docs: [
            {id:"US100_OTC",name:"US100 OTC",market:"OTC"},{id:"SP500_OTC",name:"SP500 OTC",market:"OTC"},
            {id:"JPN225_OTC",name:"JPN225 OTC",market:"OTC"},{id:"DJI30_OTC",name:"DJI30 OTC",market:"OTC"}
        ]
    };

    function open() { document.getElementById("cpPopup").setAttribute("aria-hidden","false"); render(); }
    function close() { document.getElementById("cpPopup").setAttribute("aria-hidden","true"); }
    function render() {
        const list = document.getElementById("cpList");
        const all = [].concat(DATA.fiat, DATA.crypto, DATA.commod, DATA.stocks, DATA.docs);
        list.innerHTML = all.map(it => `
            <div class="cp-item" onclick="selectPair('${it.name}')">
                <div class="cp-title"><div class="cp-name">${it.name}</div></div>
                <div class="cp-market">${it.market}</div>
            </div>
        `).join("");
    }
    window.selectPair = (name) => { state.pair = name; document.getElementById("pairField").value = name; close(); checkReady(); saveState(); };
    return { open, close };
})();

// =========================
// Expiry Popup
// =========================
const CurrencyExpiryPopup = (function(){
    const PRESETS = ["S5", "S15", "S30", "M1", "M3", "M5", "M30", "H1", "H4"];
    function open() { document.getElementById("exPopup").setAttribute("aria-hidden","false"); render(); }
    function close() { document.getElementById("exPopup").setAttribute("aria-hidden","true"); }
    function render() {
        const grid = document.getElementById("exGrid");
        grid.innerHTML = PRESETS.map(p => `<button class="ex-chip" onclick="selectExp('${p}')">${p}</button>`).join("");
    }
    window.selectExp = (p) => { state.time = p; document.getElementById("timeField").value = p; close(); checkReady(); saveState(); };
    return { open, close };
})();

// ===============================================
// Signal flow
// ===============================================
document.getElementById("getSignalBtn")?.addEventListener("click", () => {
    const viewA = document.getElementById("sigAnalysis");
    const viewR = document.getElementById("sigResult");
    const bar   = document.getElementById("sigProgress");
    document.body.classList.add("analysis-open");
    viewR.hidden = true; viewA.style.display = "block";
    
    let p = 0;
    const interval = setInterval(() => {
        p += 5; bar.style.width = p + "%";
        const stepIdx = Math.floor(p / 20);
        const steps = document.querySelectorAll("#sigSteps .sig-step");
        steps.forEach((s, i) => {
            s.classList.toggle("is-active", i === stepIdx);
            s.classList.toggle("is-done", i < stepIdx);
        });
        if (p >= 100) { clearInterval(interval); showResult(); }
    }, 150);
});

function showResult() {
    const isBuy = Math.random() > 0.5;
    const res = {
        isBuy, pair: state.pair, 
        conf: Math.floor(70 + Math.random() * 25) + "%", 
        acc: Math.floor(80 + Math.random() * 15) + "%",
        market: state.pair.includes("OTC") ? "OTC" : "REAL", 
        strCode: "High", volCode: "Medium", time: state.time, 
        valid: new Date(Date.now() + 300000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };
    saveResult(res); restoreResult();
}

document.getElementById("sigReset")?.addEventListener("click", () => {
    localStorage.removeItem(STATE_KEY); localStorage.removeItem(RESULT_KEY); location.reload();
});

document.addEventListener("DOMContentLoaded", () => {
    restoreState(); restoreResult(); ensureDefaultModel(); applyI18nToDOM(); renderLangMenu();
});