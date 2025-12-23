const LANG_KEY = "ps_lang_v1";
let CURRENT_LANG = localStorage.getItem(LANG_KEY) || "pl";

const PAIRS_DATA = [
    {id:"AUD_CAD_OTC",name:"AUD/CAD OTC",market:"OTC"}, {id:"EUR_USD_OTC",name:"EUR/USD OTC",market:"OTC"},
    {id:"GBP_USD_OTC",name:"GBP/USD OTC",market:"OTC"}, {id:"EUR_JPY_OTC",name:"EUR/JPY OTC",market:"OTC"},
    {id:"BTC_USD",name:"BTC/USD",market:"CRYPTO"}, {id:"ETH_USD",name:"ETH/USD",market:"CRYPTO"},
    {id:"EUR_USD",name:"EUR/USD",market:"REAL"}, {id:"GBP_USD",name:"GBP/USD",market:"REAL"},
    {id:"XAU_USD",name:"Gold",market:"COMMOD"}, {id:"AMZN_OTC",name:"Amazon OTC",market:"OTC"}
];

const I18N = {
    pl: {
        hero_title: "Handluj z AI", hero_sub: "Inteligentne sygnały dla zyskownego handlu",
        field_pair: "Para walutowa", field_expiry: "Czas wygaśnięcia", btn_get: "Pobierz sygnał",
        dir_buy: "GÓRA", dir_sell: "DÓŁ", k_conf: "PEWNOŚĆ", k_acc: "DOKŁADNOŚĆ",
        cp_search: "Szukaj pary...", btn_repeat: "Powtórz", btn_reset: "Resetuj"
    },
    en: {
        hero_title: "Trade with AI", hero_sub: "Smart signals for profitable trading",
        field_pair: "Currency Pair", field_expiry: "Expiry Time", btn_get: "Get Signal",
        dir_buy: "CALL", dir_sell: "PUT", k_conf: "CONFIDENCE", k_acc: "ACCURACY",
        cp_search: "Search pair...", btn_repeat: "Repeat", btn_reset: "Reset"
    }
};

function t(key) { return I18N[CURRENT_LANG][key] || I18N.en[key]; }

function applyI18n() {
    document.querySelector(".main-heading h1").textContent = t("hero_title");
    document.querySelector(".main-heading p").textContent = t("hero_sub");
    document.getElementById("getSignalBtn").textContent = t("btn_get");
    document.querySelectorAll(".field-block label")[0].textContent = t("field_pair");
    document.querySelectorAll(".field-block label")[1].textContent = t("field_expiry");
    document.getElementById("langCode").textContent = CURRENT_LANG.toUpperCase();
    document.getElementById("langFlag").src = `images/flags/${CURRENT_LANG}.svg`;
    document.getElementById("cpSearch").placeholder = t("cp_search");
}

window.setLang = (code) => { 
    CURRENT_LANG = code; localStorage.setItem(LANG_KEY, code); 
    applyI18n(); document.getElementById("langMenu").classList.remove("open");
};

// ПОПАПИ
window.selectField = (type) => {
    if (type === 'pair') {
        document.getElementById("cpPopup").setAttribute("aria-hidden", "false");
        renderPairs(PAIRS_DATA);
    } else if (type === 'expiry') {
        document.getElementById("exPopup").setAttribute("aria-hidden", "false");
        renderExpiry();
    }
};

function renderPairs(data) {
    const list = document.getElementById("cpList");
    list.innerHTML = data.map(p => `
        <div class="cp-item" onclick="setPair('${p.name}')">
            <span>${p.name}</span>
            <small>${p.market}</small>
        </div>
    `).join("");
}

function renderExpiry() {
    const grid = document.getElementById("exGrid");
    const times = ["S3", "S15", "S30", "M1", "M3", "M5", "M30", "H1", "H4"];
    grid.innerHTML = times.map(t => `<button class="ex-chip" onclick="setExpiry('${t}')">${t}</button>`).join("");
}

window.setPair = (val) => { document.getElementById("pairField").value = val; closePopups(); checkReady(); };
window.setExpiry = (val) => { document.getElementById("timeField").value = val; closePopups(); checkReady(); };

function closePopups() {
    document.getElementById("cpPopup").setAttribute("aria-hidden", "true");
    document.getElementById("exPopup").setAttribute("aria-hidden", "true");
}

function checkReady() {
    const btn = document.getElementById("getSignalBtn");
    if (document.getElementById("pairField").value && document.getElementById("timeField").value) {
        btn.disabled = false; btn.classList.add("active");
    }
}

// СИГНАЛИ
document.getElementById("getSignalBtn").onclick = startAnalysis;
document.getElementById("sigRepeat").onclick = startAnalysis;
document.getElementById("sigReset").onclick = () => location.reload();

function startAnalysis() {
    document.getElementById("getSignalBtn").disabled = true;
    const progress = document.getElementById("sigProgress");
    const loader = document.querySelector(".wave-loader");
    const analysisBox = document.getElementById("sigAnalysis");
    const resultBox = document.getElementById("sigResult");

    resultBox.hidden = true;
    analysisBox.style.display = "block";
    loader.style.display = "block";

    let p = 0;
    const interval = setInterval(() => {
        p += 5; progress.style.width = p + "%";
        if (p >= 100) {
            clearInterval(interval);
            loader.style.display = "none";
            analysisBox.style.display = "none";
            showResult();
        }
    }, 100);
}

function showResult() {
    document.getElementById("sigResult").hidden = false;
    const isBuy = Math.random() > 0.5;
    document.getElementById("sigDirection").textContent = isBuy ? t("dir_buy") : t("dir_sell");
    document.getElementById("sigDirection").className = `rg2-ribbon ${isBuy ? 'buy' : 'sell'}`;
    document.getElementById("sigPair").textContent = document.getElementById("pairField").value;
    document.getElementById("sigConf").textContent = Math.floor(Math.random() * 10 + 85) + "%";
    document.getElementById("sigAcc").textContent = Math.floor(Math.random() * 5 + 93) + "%";
}

document.getElementById("langBtn").onclick = (e) => {
    e.stopPropagation(); document.getElementById("langMenu").classList.toggle("open");
};

// Закриття по фону
window.onclick = (e) => {
    if (e.target.classList.contains('cp-overlay') || e.target.classList.contains('ex-overlay')) closePopups();
    if (!e.target.closest('.lang-dropdown')) document.getElementById("langMenu").classList.remove("open");
};

document.getElementById("cpSearch").oninput = function() {
    const q = this.value.toLowerCase();
    renderPairs(PAIRS_DATA.filter(p => p.name.toLowerCase().includes(q)));
};

document.addEventListener("DOMContentLoaded", applyI18n);