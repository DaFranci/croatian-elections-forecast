# Croatian Parliamentary Election Visualization Platform

An interactive, high-performance web application for visualizing Croatian parliamentary election results at the municipality level using WebGL-accelerated mapping technology.

![Croatian Elections App](https://img.shields.io/badge/React-18.3-blue) ![MapLibre GL JS](https://img.shields.io/badge/MapLibre-4.7-green) ![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)

## Features

### 🗺️ Interactive Map Visualization
- **WebGL-powered rendering** using MapLibre GL JS for smooth performance with 500+ municipalities
- **Multiple visualization modes**:
  - **Winner Map**: Color-coded by winning party/coalition
  - **Margin of Victory**: Opacity-based visualization showing strength of wins
  - **Turnout Heatmap**: Gradient visualization of voter participation
  - **Swing Analysis**: Comparison between elections (planned)

### 📊 Rich Data Display
- **Municipality Details**: Click any municipality to see:
  - Detailed vote breakdown by party
  - Interactive bar charts
  - Turnout statistics
  - Winner information with margin of victory
  
- **National Summary**: Parliament seat distribution using D'Hondt method
  - Pie chart visualization
  - Seat count by party
  - Total seats allocated

### 🎨 Modern Design
- Glassmorphism UI effects
- Smooth animations and transitions
- Responsive design for mobile and desktop
- Dark theme optimized for data visualization
- Croatian party brand colors (HDZ blue, SDP red, etc.)

## Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite 6
- **Mapping**: MapLibre GL JS 4.7 (WebGL)
- **Charts**: Recharts 2.12
- **Data Visualization**: D3.js 7
- **Geospatial**: Turf.js for spatial calculations

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Elections
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The optimized build will be in the `dist/` directory.

## Project Structure

```
Elections/
├── public/
│   └── data/
│       ├── elections/          # Election results JSON
│       │   ├── 2024-parliamentary.json
│       │   └── parties.json
│       └── geospatial/         # GeoJSON boundaries
│           └── municipalities.geojson
├── src/
│   ├── components/
│   │   ├── Map/               # Map components
│   │   │   ├── ElectionMap.tsx
│   │   │   └── MapControls.tsx
│   │   └── UI/                # UI components
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       ├── MunicipalityDetail.tsx
│   │       ├── NationalSummary.tsx
│   │       └── VisualizationSelector.tsx
│   ├── context/
│   │   └── AppContext.tsx     # Global state management
│   ├── types/
│   │   └── index.ts           # TypeScript definitions
│   ├── utils/
│   │   ├── dataLoader.ts      # Data loading utilities
│   │   └── dataProcessor.ts   # Data processing functions
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Data Sources

### Current Implementation
- **Election Data**: Sample 2024 parliamentary election data for 15 major Croatian cities
- **Geospatial Data**: Simplified GeoJSON with approximate municipality boundaries

### Future Enhancements
The application is designed to work with:
- **Official DIP Data**: State Electoral Commission (Državno izborno povjerenstvo) results
- **OpenStreetMap**: Detailed administrative boundaries via Overpass API
- **Historical Data**: Elections from 1990-2024
- **Full Coverage**: All 556 municipalities and 6,750+ settlements

## Usage

### Visualization Modes

1. **Winner Map** (🏆): Shows which party/coalition won each municipality
   - Each municipality is colored by the winning party's brand color
   - HDZ (blue), SDP Coalition (red), Most (gold), etc.

2. **Margin Map** (📊): Shows the strength of victory
   - Same colors as Winner Map
   - Opacity indicates margin: solid = landslide, pale = narrow win

3. **Turnout Map** (📈): Visualizes voter participation
   - Gradient from grey (low turnout) to green (high turnout)
   - Independent of party results

4. **Swing Map** (↔️): Compare two elections (coming soon)
   - Shows percentage point changes between elections
   - Red-to-blue gradient for left-to-right swing

### Interacting with the Map

- **Pan**: Click and drag the map
- **Zoom**: Use mouse wheel or zoom controls
- **Select Municipality**: Click on any municipality polygon
- **View Details**: Selected municipality details appear in the sidebar
- **Reset View**: Click the reset button to return to initial view

## Development

### Adding New Election Data

1. Create a new JSON file in `public/data/elections/`:
```json
{
  "election_id": "2020-parliamentary",
  "date": "2020-07-05",
  "turnout_national": 0.463,
  "results": {
    "municipality_id": {
      "name": "Zagreb",
      "total_voters": 598000,
      "votes_cast": 276854,
      "turnout": 0.463,
      "parties": {
        "HDZ": 83056,
        "Restart": 110741,
        ...
      }
    }
  }
}
```

2. Update the election selector component to include the new election

### Adding New Geospatial Data

Replace `public/data/geospatial/municipalities.geojson` with:
- Real OSM data from Overpass API
- GADM administrative boundaries
- Custom processed GeoJSON

Ensure the `id` property in GeoJSON features matches the `municipality_id` in election data.

## Performance Considerations

- **WebGL Rendering**: Can handle 10,000+ features at 60 FPS
- **Data Caching**: Election and geospatial data cached in memory
- **Code Splitting**: Vendor, map, and chart libraries split into separate bundles
- **Lazy Loading**: Data loaded on demand

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

## Contributing

Contributions are welcome! Areas for improvement:
- Integration with real DIP data sources
- Historical election data (1990-2024)
- County and constituency-level views
- Zagreb city district drill-down
- Polling station point visualization
- Export/share functionality
- Multi-language support (Croatian/English)

## License

This project is open source and available under the MIT License.

## Acknowledgments

- **Data Sources**: State Electoral Commission (DIP), OpenStreetMap
- **Inspiration**: Based on comprehensive technical specification for Croatian election visualization
- **Technologies**: React, MapLibre GL JS, Recharts, D3.js

## Contact

For questions, suggestions, or data contributions, please open an issue on GitHub.

---

**Note**: This is a demonstration application with sample data. For production use with real election data, please ensure compliance with data licensing and attribution requirements.
