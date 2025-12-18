let cooldowns = {}; 
let currentPair = ""; 

document.addEventListener("DOMContentLoaded", () => {
    const generateButton = document.getElementById("generate-btn");
    const signalResult = document.getElementById("signal-result");
    const signalTime = document.getElementById("signal-time");
    const currencySelect = document.getElementById("currency-pair");

    let signalUpdateTimeout = null;
    currentPair = currencySelect.value;

    generateButton.addEventListener("click", () => {
        const language = document.getElementById("language").value;
        generateButton.disabled = true;
        generateButton.textContent = language === "pl" ? "Czekaj..." : "Waiting...";

        if (signalUpdateTimeout) clearTimeout(signalUpdateTimeout);

        signalUpdateTimeout = setTimeout(() => {
            const currencyPair = currencySelect.value;
            const timeframeText = document.getElementById("timeframe").value;
            const cooldownDuration = parseTimeframeToMs(timeframeText);

            const isBuy = Math.random() > 0.5;
            const accuracy = (Math.random() * 10 + 85).toFixed(2);
            
            // Використовуємо системний час без прив'язки до ru-RU
            const now = new Date().toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit"
            });

            const signalDetails = `
                <div class="signal-details">
                    <div class="signal-pair">${currencyPair}</div>
                    <div class="signal-direction ${isBuy ? "green" : "red"}">
                        ${isBuy ? translations[language].buy : translations[language].sell}
                    </div>
                    <div class="signal-timeframe">${translations[language].timeframe}: ${timeframeText}</div>
                    <div class="signal-probability">${translations[language].accuracy}: ${accuracy}%</div>
                </div>
            `;
            signalResult.innerHTML = signalDetails;
            signalTime.textContent = now;

            const endTime = Date.now() + cooldownDuration;

            if (cooldowns[currencyPair]?.intervalId) {
                clearInterval(cooldowns[currencyPair].intervalId);
            }

            cooldowns[currencyPair] = { endTime };
            startCooldown(currencyPair);
        }, 1000);
    });

    currencySelect.addEventListener("change", () => {
        const newPair = currencySelect.value;
        if (cooldowns[currentPair]?.intervalId) {
            clearInterval(cooldowns[currentPair].intervalId);
        }
        currentPair = newPair;

        if (cooldowns[newPair] && cooldowns[newPair].endTime > Date.now()) {
            startCooldown(newPair);
        } else {
            generateButton.disabled = false;
            generateButton.textContent = translations[document.getElementById("language").value].generateButton;
        }
    });
});

function startCooldown(pair) {
    const generateButton = document.getElementById("generate-btn");

    function updateCooldown() {
        const now = Date.now();
        const remaining = Math.ceil((cooldowns[pair].endTime - now) / 1000);
        const language = document.getElementById("language").value;
        const baseText = translations[language].generateButton;

        if (remaining <= 0) {
            clearInterval(cooldowns[pair].intervalId);
            generateButton.disabled = false;
            generateButton.textContent = baseText;
            delete cooldowns[pair];
        } else {
            generateButton.disabled = true;
            generateButton.textContent = `${baseText} (${remaining}s)`;
        }
    }

    updateCooldown();
    cooldowns[pair].intervalId = setInterval(updateCooldown, 1000);
}

function parseTimeframeToMs(timeframeText) {
    const lowercase = timeframeText.toLowerCase();
    const numberMatch = lowercase.match(/\d+/);
    const value = numberMatch ? parseInt(numberMatch[0], 10) : 30; 

    // Логіка для Польської мови
    if (lowercase.includes("sekund")) {
        return value * 1000;
    }
    if (lowercase.includes("minut")) {
        return value * 60 * 1000;
    }

    // Логіка для Англійської мови
    if (lowercase.includes("second")) {
        return value * 1000;
    }
    if (lowercase.includes("minute") || lowercase.includes("min")) {
        return value * 60 * 1000;
    }

    return 30000; 
}

const translations = {
    pl: {
        logoText: "Trade Signal",
        currencyLabel: "Instrument",
        timeframeLabel: "Czas",
        generateButton: "Pobierz sygnał",
        signalTitle: "Sygnał",
        signalPlaceholder: "Kliknij „Pobierz sygnał”",
        languageLabel: "Język",
        timeframes: ["5 sekund", "15 sekund", "1 minuta", "3 minuty", "5 minut", "10 minut"],
        buy: "GÓRA",
        sell: "DÓŁ",
        timeframe: "Czas",
        accuracy: "Dokładność"
    },
    en: {
        logoText: "Trade Signal",
        currencyLabel: "Instrument",
        timeframeLabel: "Time",
        generateButton: "Get Signal",
        signalTitle: "Signal",
        signalPlaceholder: "Click 'Get Signal'",
        languageLabel: "Language",
        timeframes: ["5 seconds", "15 seconds", "1 minute", "3 minutes", "5 minutes", "10 minutes"],
        buy: "CALL",
        sell: "PUT",
        timeframe: "Timeframe",
        accuracy: "Accuracy"
    }
};

function changeLanguage() {
    const language = document.getElementById("language").value;

    document.getElementById("logo-text").textContent = translations[language].logoText;
    document.getElementById("currency-label").textContent = translations[language].currencyLabel;
    document.getElementById("timeframe-label").textContent = translations[language].timeframeLabel;
    document.getElementById("generate-btn").textContent = translations[language].generateButton;
    document.getElementById("signal-title").textContent = translations[language].signalTitle;
    
    const placeholder = document.getElementById("placeholder-text");
    if (placeholder) {
        placeholder.textContent = translations[language].signalPlaceholder;
    }

    const languageLabelElement = document.querySelector('.language-selector label');
    if (languageLabelElement) languageLabelElement.textContent = translations[language].languageLabel;

    const timeframeSelect = document.getElementById("timeframe");
    const timeframes = translations[language].timeframes;

    timeframeSelect.innerHTML = "";
    timeframes.forEach(timeframe => {
        const option = document.createElement("option");
        option.textContent = timeframe;
        timeframeSelect.appendChild(option);
    });

    // Очищення результатів при зміні мови
    document.getElementById("signal-result").innerHTML = `<div class="signal-placeholder" id="placeholder-text">${translations[language].signalPlaceholder}</div>`;
    document.getElementById("signal-time").textContent = "";
}