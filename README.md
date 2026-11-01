# Izborna karta

An interactive map of Croatian election results by municipality and constituency, with a forecast of
the next parliamentary election and a blog. The site is in Croatian.

![React](https://img.shields.io/badge/React-18.3-blue) ![MapLibre GL JS](https://img.shields.io/badge/MapLibre-4.7-green) ![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)

## Features

### Results map (Rezultati)

Official results from the State Electoral Commission (DIP) for:

| Election | Years |
|---|---|
| Parliamentary | 2003, 2007, 2011, 2015, 2016, 2020, 2024 |
| European Parliament | 2013, 2014, 2019, 2024 |
| Presidential (both rounds) | 2005, 2009, 2014, 2019, 2024 |
| Local (municipal and city councils; mayors listed per municipality) | 2013, 2017, 2021, 2025 |

- **Two views:** electoral constituencies (parliamentary elections) or municipalities and cities.
- **Three map modes:** winner, turnout, and margin of victory.
- **Results panel:** national, constituency or municipality results, with a hemicycle of the
  seats won. Coalitions are shown under their campaign names (Kukuriku, Restart, Rijeke pravde, …)
  with their partners.
- **Diaspora (XI) and national minorities (XII)** appear as cards beside the map, with their own
  results.
- **Historical boundaries:** each election is drawn on the municipalities and constituencies in
  force at the time (2003 and 2005 municipalities; constituencies before the 2024 redistricting).

### Forecast (Prognoza)

A forecast of the next parliamentary election: seats per list with their ranges, the chance of
each list coming first and of reaching a majority, and the poll average since the 2024 election.
The page displays a published forecast (`public/data/forecast/forecast.json`); the model that
produces it is not part of this repository.

### Blog

Analyses of elections, polls and the forecast. Posts are React components registered in
`src/components/Blog/posts.ts`; any data they show lives in `public/data/blog/`.

## Technology Stack

- **Frontend:** React 18 with TypeScript, built with Vite 6
- **Styling:** Tailwind CSS 4, Radix UI primitives, Lucide icons
- **Mapping:** MapLibre GL JS 4 (WebGL) via react-map-gl
- **Charts:** Recharts
- **Data pipeline:** Python scripts in `scripts/`

## Getting Started

Requires Node.js 18+ and npm.

```bash
git clone <repository-url>
cd Elections
npm install
npm run dev
```

Then open `http://localhost:5173`.

### Build for Production

```bash
npm run build
```

The optimized build will be in the `dist/` directory. Asset URLs are relative (`base: './'` in
`vite.config.ts`), so the build works at any path, including `https://<user>.github.io/<repo>/`.

### Deploying to GitHub Pages

`.github/workflows/deploy.yml` builds the site and publishes it on every push to `master`.
One-time setup: in the repository, go to **Settings → Pages** and set **Source** to **GitHub Actions**.

Everything in `public/` is copied into the build and published, so source files the site doesn't
load belong elsewhere (raw results CSVs are in `data/elections/csvs/`).

## Project Structure

```
Elections/
├── .github/workflows/deploy.yml   # Build and publish to GitHub Pages
├── data/
│   └── elections/csvs/            # Raw DIP results (input to scripts/, not published)
├── public/
│   ├── logo.svg
│   └── data/                      # Everything the site loads
│       ├── elections/             # <year>-<type>[-<round>].json, parties.json
│       ├── geospatial/            # Municipality, constituency and Zagreb district boundaries
│       ├── forecast/              # Published forecast
│       └── blog/                  # Data for blog posts
├── scripts/                       # Turn DIP results and boundary data into the files above
└── src/
    ├── components/
    │   ├── Map/                   # Map and the diaspora/minority cards
    │   ├── Panels/                # Election picker, legend, results panel, hemicycle
    │   ├── Forecast/              # Prognoza page and poll average chart
    │   ├── Blog/                  # Blog list, article view and posts
    │   └── Layout/                # Top bar and shared page layout
    ├── context/AppContext.tsx     # Selected election, view and map mode
    ├── types/                     # Election list and data types
    └── utils/                     # Data loading, coalitions, region results, formatting
```

## Data

- **Election results:** [DIP](https://www.izbori.hr/), converted to JSON by the scripts below.
- **Boundaries:** GeoJSON in `public/data/geospatial/`, built from OpenStreetMap and GADM data (see
  [scripts/README.md](scripts/README.md)).
- **Forecast and blog data:** published results only.

### Updating results

```bash
python scripts/transform_election_data.py <year>         # parliamentary, from data/elections/csvs/<year>/
python scripts/transform_eu_data.py <year>               # European Parliament
python scripts/transform_presidential_data.py [year ...] # presidential, both rounds
python scripts/transform_local_data.py [year ...]        # local; downloads DIP's archive into a temp cache
python scripts/validate_election_data.py                 # check vote totals, IDs and parties
```

Older parliamentary results published per polling station are converted first with
`scripts/convert_legacy_csv.py <year>`.

To add an election to the site, add its JSON file and an entry to `ELECTIONS` in `src/types/index.ts`.

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- **Data:** State Electoral Commission of the Republic of Croatia (DIP), OpenStreetMap contributors, GADM
- **Technologies:** React, MapLibre GL JS, Recharts, Tailwind CSS
