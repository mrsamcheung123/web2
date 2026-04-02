# HK School Explorer PWA

A complete Progressive Web App for the COMP 3130SEF mobile application project.

## Features

- School information loaded from Hong Kong EDB open data JSON.
- Search by keyword (name, district, category, address).
- Filter by district and school level.
- School detail dialog with contact and website information.
- Favorite schools saved to local storage.
- Install App button with PWA install flow.
- Service worker for offline shell caching and API response caching.
- Offline fallback page.

## Run locally

Because service workers require a local server, run one of these commands in the project folder:

```powershell
# Option 1 (Python)
python -m http.server 8080

# Option 2 (Node)
npx serve .
```

Then open:

- http://localhost:8080 (Python)
- http://localhost:3000 (npx serve default)

## API Source

- http://www.edb.gov.hk/attachment/en/student-parents/sch-info/sch-search/sch-location-info/SCH_LOC_EDB.json
