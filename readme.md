# ☕ Coffee Sensory Lexicon PWA

[![PWA](https://img.shields.io/badge/PWA-Ready-orange?style=for-the-badge&logo=progressive-web-apps)](https://web.dev/progressive-web-apps/)
[![Tech](https://img.shields.io/badge/Tech-Vanilla_JS_|_Tailwind-blue?style=for-the-badge)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Storage](https://img.shields.io/badge/Storage-IndexedDB-green?style=for-the-badge)](https://dexie.org/)

A minimalist, premium, and local-first Coffee Sensory Lexicon application designed for coffee enthusiasts and professionals. Track your coffee tasting journeys with ease, precision, and complete privacy.

---

## ✨ Features

- **📱 Mobile-First Experience**: Designed specifically for handheld devices with a sleek bottom navigation bar and fluid transitions.
- **🌐 Offline-First (PWA)**: Works seamlessly without an internet connection. Install it on your home screen for a native app feel.
- **🧪 Sensory Drill-down**: Navigate through a structured flavor lexicon to pinpoint precise tasting notes (Category → Sub-category → Specific Flavor).
- **📊 Detailed Logging**: Capture essential metadata (Origin, Roast, Process) alongside sensory metrics (Acid, Bitter, Sweet, Body) and star ratings.
- **🔒 Privacy First**: Your data stays on your device. Powered by **IndexedDB** (via Dexie.js), ensuring zero server-side tracking.
- **📥 Data Portability**: Export your entire coffee history to a standardized JSON format at any time.

---

## 🛠️ Tech Stack

- **Core**: HTML5, Vanilla JavaScript (ES6+)
- **Styling**: [TailwindCSS](https://tailwindcss.com/) for a modern, responsive design system.
- **Database**: [Dexie.js](https://dexie.org/) (IndexedDB wrapper) for robust local storage.
- **PWA**: Service Workers and Web App Manifest for offline capabilities and installability.
- **Icons**: Custom SVG icons for a lightweight and crisp UI.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- [pnpm](https://pnpm.io/) (recommended) or `npm`

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/my-simple-coffee.git
    cd my-simple-coffee
    ```

2.  **Install dependencies**:
    ```bash
    pnpm install
    ```

3.  **Run in development mode**:
    ```bash
    pnpm dev
    ```
    This will start a local server and watch for CSS changes.

---

## 📂 Project Structure

```text
├── css/
│   ├── input.css      # Tailwind input
│   └── style.css      # Compiled styles
├── js/
│   ├── app.js         # Application entry point
│   ├── db.js          # Database schema & Dexie initialization
│   ├── state.js       # App state management
│   └── ui.js          # UI rendering & Event handlers
├── flavorLexicon.json # Sensory data source
├── manifest.json      # PWA manifest
├── sw.js              # Service Worker for offline support
└── index.html         # Main entry page
```

---

## 📝 Data Schema

Logs are stored in the following format:

```json
{
  "id": "uuid-or-timestamp",
  "bean_name": "Ethiopia Yirgacheffe",
  "origin": "Ethiopia",
  "roast": "Light",
  "process": "Washed",
  "date": "2024-05-07",
  "ratings": {
    "acid": 4,
    "bitter": 1,
    "sweet": 5,
    "body": 3,
    "overall": 4.5
  },
  "flavor_tags": ["Citrus", "Berry", "Fruity"],
  "notes": "Very clean cup with high jasmine aroma."
}
```

---

## 📄 License

This project is licensed under the ISC License.

---

## ☕ Support

If you find this project helpful, feel free to give it a ⭐!
