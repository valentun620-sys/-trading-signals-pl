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

    vipBtn?.addEventListener("click", openVip);

    sheet?.addEventListener("click", (e) => {
        const t = e.target;
        if (t.matches("[data-close]") || t.closest("#vipClose")) closeVip();
    });
    document.getElementById("vipClose")?.addEventListener("click", closeVip);

    document.addEventListener("keydown", (e)=>{ if (e.key === "Escape" && sheet && sheet.getAttribute("aria-hidden")==="false") closeVip(); });
});

// =============================
// Global state & Data
// =============================
let state = {
    pair: null,
    time: null,
    expiry: "1m",
    model: "NeuralEdge v2.0"
};

const PAIRS_DATA = [
    { name: "GBP/USD OTC", market: "OTC" }, { name: "USD/CAD OTC", market: "OTC" },
    { name: "EUR/GBP OTC", market: "OTC" }, { name: "EUR/JPY OTC", market: "OTC" },
    { name: "GBP/JPY OTC", market: "OTC" }, { name: "AUD/NZD OTC", market: "OTC" },
    { name: "USD/RUB OTC", market: "OTC" }, { name: "CAD/JPY OTC", market: "OTC" },
    { name: "EUR/USD", market: "REAL" }, { name: "BTC/USD", market: "CRYPTO" },
    { name: "ETH/USD", market: "CRYPTO" }, { name: "XAU/USD", market: "COMMOD" },
    { name: "USD/JPY", market: "REAL" }, { name: "GBP/USD", market: "REAL" }
];

const STATE_KEY  = "ps_state_v2";
const LANG_KEY   = "ps_lang_v1";

// =============================
// Languages + I18N (PL & EN)
// =============================
const I18N = {
    pl: {
        app_title: "Signal AI Pro",
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
        dir_buy: "GÓRA",
        dir_sell: "DÓŁ",
        k_conf: "PEWNOŚĆ",
        k_acc: "DOKŁADNOŚĆ",
        k_market: "RYNEK",
        k_strength: "SIŁA",
        k_volume: "WOLUMEN",
        k_time: "CZAS",
        k_valid: "WAŻNE DO",
        v_strength_high: "Wysoka",
        v_vol_medium: "Średni",
        cp_search_ph: "Szukaj pary...",
        btn_reset: "Resetuj"
    },
    en: {
        app_title: "Signal AI Pro",
        hero_title: "Trade with AI",
        hero_sub: "Smart signals for profitable trading",
        header_become_vip: "VIP Status",
        field_pair_label: "Currency Pair",
        field_pair_ph: "Select pair",
        field_expiry_label: "Expiry Time",
        field_expiry_ph: "Select time",
        field_model_label: "AI Model",
        btn_get_signal: "Get Signal",
        signal_title: "Signal",
        dir_buy: "CALL",
        dir_sell: "PUT",
        k_conf: "CONFIDENCE",
        k_acc: "ACCURACY",
        k_market: "MARKET",
        k_strength: "STRENGTH",
        k_volume: "VOLUME",
        k_time: "TIME",
        k_valid: "VALID UNTIL",
        v_strength_high: "Strong",
        v_vol_medium: "Medium",
        cp_search_ph: "Search pair...",
        btn_reset: "Reset"
    }
};

let CURRENT_LANG = (localStorage.getItem(LANG_KEY) || "pl");

function t(key) {
    return I18N[CURRENT_LANG][key] || I18N["en"][key] || "";
}

function applyI18nToDOM() {
    document.getElementById("vipText").textContent = t("header_become_vip");
    document.querySelector(".main-heading h1").textContent = t("hero_title");
    document.querySelector(".main-heading p").textContent = t("hero_sub");
    
    document.getElementById("getSignalBtn").textContent = t("btn_get_signal");
    document.getElementById("pairField").placeholder = t("field_pair_ph");
    document.getElementById("timeField").placeholder = t("field_expiry_ph");

    // Оновлення ярликів полів
    const labels = document.querySelectorAll(".field-block label");
    labels[0].textContent = t("field_pair_label");
    labels[1].textContent = t("field_expiry_label");
    labels[2].textContent = t("field_model_label");

    if (document.getElementById("langCode")) {
        document.getElementById("langCode").textContent = CURRENT_LANG.toUpperCase();
        document.getElementById("langFlag").src = `images/flags/${CURRENT_LANG}.svg`;
    }
}

window.changeLanguage = () => {
    CURRENT_LANG = CURRENT_LANG === "pl" ? "en" : "pl";
    localStorage.setItem(LANG_KEY, CURRENT_LANG);
    applyI18nToDOM();
    location.reload(); 
};

// =============================
// Popups Logic
// =============================
window.selectField = (type) => {
    if (type === 'pair') {
        document.getElementById("cpPopup").setAttribute("aria-hidden", "false");
        renderPairs();
    } else {
        document.getElementById("exPopup").setAttribute("aria-hidden", "false");
        renderExpiry();
    }
};

function renderPairs() {
    const list = document.getElementById("cpList");
    list.innerHTML = PAIRS_DATA.map(p => `
        <div class="cp-item" onclick="setPair('${p.name}')">
            <span>${p.name}</span>
            <small>${p.market}</small>
        </div>
    `).join("");
}

window.setPair = (name) => {
    state.pair = name;
    document.getElementById("pairField").value = name;
    document.getElementById("cpPopup").setAttribute("aria-hidden", "true");
    checkReady();
};

function renderExpiry() {
    const grid = document.getElementById("exGrid");
    const times = ["5s", "15s", "1m", "2m", "5m", "15m"];
    grid.innerHTML = times.map(time => `
        <button class="ex-chip" onclick="setExpiry('${time}')">${time}</button>
    `).join("");
}

window.setExpiry = (time) => {
    state.time = time;
    document.getElementById("timeField").value = time;
    document.getElementById("exPopup").setAttribute("aria-hidden", "true");
    checkReady();
};

function checkReady() {
    const btn = document.getElementById("getSignalBtn");
    if (state.pair && state.time) {
        btn.disabled = false;
        btn.classList.add("active");
    }
}

// =============================
// Signal Generation
// =============================
document.getElementById("getSignalBtn").addEventListener("click", function() {
    const btn = this;
    btn.disabled = true;
    
    const analysis = document.getElementById("sigAnalysis");
    const result = document.getElementById("sigResult");
    const progressBar = document.getElementById("sigProgress");
    
    result.hidden = true;
    analysis.style.display = "block";
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += 2;
        progressBar.style.width = progress + "%";
        if (progress >= 100) {
            clearInterval(interval);
            showFinalSignal();
        }
    }, 50);
});

function showFinalSignal() {
    document.getElementById("sigAnalysis").style.display = "none";
    const resView = document.getElementById("sigResult");
    resView.hidden = false;

    const isBuy = Math.random() > 0.5;
    const accuracy = (Math.random() * 5 + 88).toFixed(1) + "%";
    const confidence = (Math.random() * 10 + 85).toFixed(0) + "%";
    
    const now = new Date();
    const timeStr = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
    
    // Розрахунок часу дії
    const validUntil = new Date(now.getTime() + 5 * 60000);
    const validStr = validUntil.getHours().toString().padStart(2, '0') + ":" + validUntil.getMinutes().toString().padStart(2, '0');

    document.getElementById("sigDirection").textContent = isBuy ? t("dir_buy") : t("dir_sell");
    document.getElementById("sigDirection").className = `rg2-ribbon ${isBuy ? 'buy' : 'sell'}`;
    document.getElementById("sigPair").textContent = state.pair;
    document.getElementById("sigConf").textContent = confidence;
    document.getElementById("sigAcc").textContent = accuracy;
    document.getElementById("sigTime").textContent = timeStr;
    document.getElementById("sigValid").textContent = validStr;
    document.getElementById("sigMarket").textContent = state.pair.includes("OTC") ? "OTC" : "REAL";
    document.getElementById("sigStrength").textContent = t("v_strength_high");
    document.getElementById("sigVol").textContent = t("v_vol_medium");
}

document.getElementById("sigReset").addEventListener("click", () => location.reload());

// Ініціалізація
applyI18nToDOM();