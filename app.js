let schoolsData = [];
const schoolListContainer = document.getElementById('school-list');
const searchInput = document.getElementById('search-input');
const loadingElement = document.getElementById('loading');

// PWA Install Button Logic
let deferredPrompt;
const installBtn = document.getElementById('install-btn');

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.hidden = false; // Show the install button
});

installBtn.addEventListener('click', async () => {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        }
        deferredPrompt = null;
        installBtn.hidden = true;
    }
});

window.addEventListener('appinstalled', () => {
    installBtn.hidden = true;
    console.log('PWA was installed');
});

// Fetch School Data
// Note: We use a CORS proxy (allorigins) because the HK Gov API sometimes blocks direct frontend requests (CORS).
async function fetchSchoolData() {
    try {
        const targetUrl = encodeURIComponent('https://www.edb.gov.hk/attachment/en/student-parents/sch-info/sch-search/sch-locationinfo/SCH_LOC_EDB.json');
        const proxyUrl = `https://api.allorigins.win/get?url=${targetUrl}`;
        
        const response = await fetch(proxyUrl);
        const data = await response.json();
        
        // Parse the JSON string hidden inside the proxy's 'contents' property
        const parsedData = JSON.parse(data.contents); 
        schoolsData = parsedData; 
        
        loadingElement.style.display = 'none';
        displaySchools(schoolsData);
    } catch (error) {
        console.error('Error fetching data:', error);
        loadingElement.textContent = 'Failed to load school data. Please check your connection.';
    }
}

// Render schools to the DOM
function displaySchools(schools) {
    schoolListContainer.innerHTML = '';
    
    // Display only first 50 to prevent browser lag (you can add pagination as another feature later)
    const limitedSchools = schools.slice(0, 50);

    limitedSchools.forEach(school => {
        const card = document.createElement('div');
        card.className = 'school-card';
        
        // Handling both English and Chinese names based on the EDB JSON structure
        const schoolName = school['School Name(English)'] || school['School Name(Chinese)'] || 'Unknown School';
        const address = school['School Address(English)'] || school['School Address(Chinese)'] || 'No Address';
        const district = school['District'] || 'Unknown District';
        const telephone = school['Telephone'] || 'N/A';
        const type = school['Finance Type'] || 'N/A';

        card.innerHTML = `
            <h2>${schoolName}</h2>
            <p><strong>📍 District:</strong> ${district}</p>
            <p><strong>🏢 Address:</strong> ${address}</p>
            <p><strong>📞 Phone:</strong> ${telephone}</p>
            <span class="tag">${type}</span>
        `;
        schoolListContainer.appendChild(card);
    });

    if (limitedSchools.length === 0) {
        schoolListContainer.innerHTML = '<p style="text-align:center; width:100%;">No schools found matching your search.</p>';
    }
}

// Search / Filter Logic
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    
    const filteredSchools = schoolsData.filter(school => {
        const nameEn = (school['School Name(English)'] || '').toLowerCase();
        const nameZh = (school['School Name(Chinese)'] || '').toLowerCase();
        const district = (school['District'] || '').toLowerCase();
        
        return nameEn.includes(searchTerm) || nameZh.includes(searchTerm) || district.includes(searchTerm);
    });
    
    displaySchools(filteredSchools);
});

// Initialize app
fetchSchoolData();