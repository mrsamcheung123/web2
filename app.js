const DATA_URL =
    "http://www.edb.gov.hk/attachment/en/student-parents/sch-info/sch-search/sch-location-info/SCH_LOC_EDB.json";
const FALLBACK_DATA_URL = "data/sample-schools.json";
const FAVORITE_KEY = "hk-school-favorites";

const state = {
    schools: [],
    filtered: [],
    favorites: new Set(JSON.parse(localStorage.getItem(FAVORITE_KEY) || "[]")),
    deferredPrompt: null,
};

const ui = {
    installButton: document.querySelector("#installButton"),
    refreshButton: document.querySelector("#refreshButton"),
    installHint: document.querySelector("#installHint"),
    statusBanner: document.querySelector("#statusBanner"),
    resultMeta: document.querySelector("#resultMeta"),
    searchInput: document.querySelector("#searchInput"),
    districtSelect: document.querySelector("#districtSelect"),
    levelSelect: document.querySelector("#levelSelect"),
    favoritesOnly: document.querySelector("#favoritesOnly"),
    schoolList: document.querySelector("#schoolList"),
    cardTemplate: document.querySelector("#cardTemplate"),
    detailDialog: document.querySelector("#detailDialog"),
    detailContent: document.querySelector("#detailContent"),
};

function setStatus(message, isError = false) {
    ui.statusBanner.textContent = message;
    ui.statusBanner.classList.toggle("error", isError);
}

function get(record, keys) {
    for (const key of keys) {
        if (record[key] !== undefined && record[key] !== null && String(record[key]).trim() !== "") {
            return String(record[key]).trim();
        }
    }
    return "";
}

function normalizeRecord(record) {
    return {
        id: get(record, ["SCHOOL NO.", "school_no", "id"]),
        name: get(record, ["ENGLISH NAME", "SCHOOL NAME", "name_en", "name"]),
        category: get(record, ["ENGLISH CATEGORY", "CATEGORY", "cat"]),
        address: get(record, ["ENGLISH ADDRESS", "ADDRESS", "addr"]),
        district: get(record, ["DISTRICT", "DISTRICT NAME", "district"]),
        level: get(record, ["SCHOOL LEVEL", "LEVEL", "school_level"]),
        gender: get(record, ["STUDENTS GENDER", "GENDER"]),
        session: get(record, ["SESSION", "SCHOOL SESSION"]),
        financeType: get(record, ["FINANCE TYPE", "FINANCE"]),
        telephone: get(record, ["TELEPHONE", "PHONE", "TEL"]),
        fax: get(record, ["FAX NUMBER", "FAX"]),
        website: get(record, ["WEBSITE", "URL", "WEB"]),
        religion: get(record, ["RELIGION", "RELIGION TYPE"]),
        latitude: Number(get(record, ["LATITUDE", "lat"])),
        longitude: Number(get(record, ["LONGITUDE", "lng", "lon"])),
    };
}

function uniqueSorted(values) {
    return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function fillSelect(selectElement, values, defaultLabel) {
    const current = selectElement.value;
    selectElement.innerHTML = `<option value="">${defaultLabel}</option>`;
    values.forEach((value) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        selectElement.appendChild(option);
    });
    if (values.includes(current)) {
        selectElement.value = current;
    }
}

function matchesKeyword(school, keyword) {
    if (!keyword) {
        return true;
    }
    const haystack = [school.name, school.address, school.district, school.category, school.level]
        .join(" ")
        .toLowerCase();
    return haystack.includes(keyword.toLowerCase());
}

function applyFilters() {
    const keyword = ui.searchInput.value.trim();
    const district = ui.districtSelect.value;
    const level = ui.levelSelect.value;
    const favoritesOnly = ui.favoritesOnly.checked;

    state.filtered = state.schools.filter((school) => {
        if (district && school.district !== district) {
            return false;
        }
        if (level && school.level !== level) {
            return false;
        }
        if (favoritesOnly && !state.favorites.has(school.id)) {
            return false;
        }
        return matchesKeyword(school, keyword);
    });

    renderSchoolList();
}

function toggleFavorite(schoolId) {
    if (!schoolId) {
        return;
    }
    if (state.favorites.has(schoolId)) {
        state.favorites.delete(schoolId);
    } else {
        state.favorites.add(schoolId);
    }
    localStorage.setItem(FAVORITE_KEY, JSON.stringify([...state.favorites]));
    applyFilters();
}

function renderSchoolList() {
    ui.schoolList.innerHTML = "";
    const fragment = document.createDocumentFragment();

    state.filtered.forEach((school) => {
        const node = ui.cardTemplate.content.firstElementChild.cloneNode(true);
        node.querySelector(".school-card__title").textContent = school.name || "Unknown school";
        node.querySelector(".category").textContent = school.category || "Category not available";
        node.querySelector(".district").textContent = school.district || "District not available";
        node.querySelector(".address").textContent = school.address || "Address not available";

        const favoriteButton = node.querySelector(".favorite-btn");
        const favorited = state.favorites.has(school.id);
        favoriteButton.textContent = favorited ? "★" : "☆";
        favoriteButton.classList.toggle("active", favorited);
        favoriteButton.addEventListener("click", () => toggleFavorite(school.id));

        const detailsButton = node.querySelector(".details-btn");
        detailsButton.addEventListener("click", () => openDetails(school));

        const mapButton = node.querySelector(".map-btn");
        mapButton.href = `https://www.google.com/maps?q=${encodeURIComponent(school.address || school.name)}`;

        fragment.appendChild(node);
    });

    ui.schoolList.appendChild(fragment);

    ui.resultMeta.textContent = `${state.filtered.length} result(s) shown, ${state.favorites.size} favorite(s).`;

    if (state.filtered.length === 0) {
        ui.schoolList.innerHTML = '<p class="meta">No schools match your filters.</p>';
    }
}

function safeLink(url) {
    if (!url) {
        return "";
    }
    if (url.startsWith("http://") || url.startsWith("https://")) {
        return url;
    }
    return `https://${url}`;
}

function detailRow(label, value) {
    return `<div>${label}</div><div>${value || "N/A"}</div>`;
}

function openDetails(school) {
    const site = safeLink(school.website);
    const websiteHtml = site ? `<a href="${site}" target="_blank" rel="noopener">${school.website}</a>` : "N/A";
    ui.detailContent.innerHTML = `
    <h3>${school.name || "Unknown school"}</h3>
    <p>${school.address || "Address not available"}</p>
    <div class="detail-grid">
      ${detailRow("District", school.district)}
      ${detailRow("Level", school.level)}
      ${detailRow("Category", school.category)}
      ${detailRow("Gender", school.gender)}
      ${detailRow("Session", school.session)}
      ${detailRow("Finance Type", school.financeType)}
      ${detailRow("Telephone", school.telephone)}
      ${detailRow("Fax", school.fax)}
      ${detailRow("Religion", school.religion)}
      ${detailRow("Website", websiteHtml)}
    </div>
  `;
    ui.detailDialog.showModal();
}

async function fetchSchoolData() {
    setStatus("Loading school data...");
    try {
        const response = await fetch(DATA_URL, { cache: "no-store" });
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        const payload = await response.json();
        if (!Array.isArray(payload)) {
            throw new Error("Unexpected API payload format.");
        }
        return payload;
    } catch (error) {
        setStatus("Live API unavailable. Using local fallback data.", true);
        const fallback = await fetch(FALLBACK_DATA_URL);
        return fallback.json();
    }
}

async function loadAndRenderData() {
    const rows = await fetchSchoolData();
    state.schools = rows.map(normalizeRecord).filter((school) => school.id || school.name);
    fillSelect(ui.districtSelect, uniqueSorted(state.schools.map((s) => s.district)), "All districts");
    fillSelect(ui.levelSelect, uniqueSorted(state.schools.map((s) => s.level)), "All levels");
    applyFilters();
    setStatus(`Loaded ${state.schools.length} schools.`);
}

function setupInstallFlow() {
    window.addEventListener("beforeinstallprompt", (event) => {
        event.preventDefault();
        state.deferredPrompt = event;
        ui.installButton.hidden = false;
        ui.installHint.hidden = false;
        ui.installHint.textContent = "Tip: install for full-screen app experience and offline support.";
    });

    ui.installButton.addEventListener("click", async () => {
        if (!state.deferredPrompt) {
            return;
        }
        state.deferredPrompt.prompt();
        await state.deferredPrompt.userChoice;
        state.deferredPrompt = null;
        ui.installButton.hidden = true;
        ui.installHint.textContent = "If already installed, open it from your home screen/app launcher.";
    });

    window.addEventListener("appinstalled", () => {
        ui.installButton.hidden = true;
        ui.installHint.hidden = false;
        ui.installHint.textContent = "App installed successfully.";
    });

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    if (isIOS && !window.matchMedia("(display-mode: standalone)").matches) {
        ui.installHint.hidden = false;
        ui.installHint.textContent = "On iPhone/iPad: Share -> Add to Home Screen.";
    }
}

function setupEvents() {
    [ui.searchInput, ui.districtSelect, ui.levelSelect, ui.favoritesOnly].forEach((el) => {
        el.addEventListener("input", applyFilters);
        el.addEventListener("change", applyFilters);
    });

    ui.refreshButton.addEventListener("click", loadAndRenderData);
}

function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
        return;
    }
    navigator.serviceWorker.register("sw.js").catch(() => {
        setStatus("Service worker registration failed.", true);
    });
}

async function bootstrap() {
    setupEvents();
    setupInstallFlow();
    registerServiceWorker();
    await loadAndRenderData();
}

bootstrap().catch((error) => {
    setStatus(`App failed to start: ${error.message}`, true);
});
