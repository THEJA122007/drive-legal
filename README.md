# 🛣️ DriveLegal

> Know the road before you drive.

A location-aware traffic law reference app for South and Southeast Asia. DriveLegal detects your current country and surfaces the traffic laws, violation penalties, travel requirements, and AI-powered Q&A relevant to where you are — all in one clean interface.

---

## ✨ Features

| Feature | Description |
|---|---|
| **📍 Location Detection** | Automatically detects your country via GPS + reverse geocoding |
| **🌏 Country Overview** | AI-generated traffic law summary for your current location |
| **⚠️ Violation Lookup** | Search any violation to see the law, fine, and how to avoid it |
| **⇄ Law Comparison** | Side-by-side comparison of traffic rules between two countries |
| **✓ Travel Checklist** | Interactive pre-drive checklist — documents, gear, and local rules |
| **💬 Ask AI** | Conversational Q&A about traffic laws in any supported country |

---

## 🗺️ Supported Countries

Bangladesh · Bhutan · India · Nepal · Sri Lanka · Myanmar · Thailand

---

## 🖥️ Tech Stack

**Frontend**
- React 18 (hooks-based, no class components)
- Custom CSS with CSS variables for theming
- GPS geolocation + reverse geocoding for automatic country detection

**Backend**
- Node.js / Express REST API (`http://localhost:3001/api`)
- AI-powered endpoints for country overviews, violation lookups, and chat

**API Endpoints**

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/location` | Reverse geocode lat/lng → country, city, state |
| `POST` | `/api/country` | Get traffic law overview for a country |
| `POST` | `/api/violation` | Look up a specific violation's law and penalties |
| `POST` | `/api/chat` | Answer a free-form traffic law question |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/drive-legal.git
cd drive-legal
```

```bash
# Install frontend dependencies
cd client
npm install

# Install backend dependencies
cd ../server
npm install
```

### Running Locally

```bash
# Start the backend (port 3001)
cd server
npm start

# In a separate terminal, start the frontend (port 3000)
cd client
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note:** The app requests browser geolocation permission on load. You can also pick a country manually from the dashboard if permission is denied.

---

## 📁 Project Structure

```
drive-legal/
├── client/                  # React frontend
│   ├── src/
│   │   ├── App.jsx          # Root component (DriveLegal)
│   │   ├── index.css        # Global styles & CSS variables
│   │   └── components/      # Panel components (if split out)
│   └── package.json
│
└── server/                  # Express backend
    ├── index.js             # API routes
    └── package.json
```

---

## 🗃️ Static Data

The following data is bundled client-side and does not require an API call:

- **`COMPARE_DATA`** — Speed limits, helmet laws, BAC limits, driving side, and licence requirements for all 7 countries
- **`CHECKLISTS`** — Categorised pre-drive checklists (Documents, Visitor Requirements, On the Road, Know Before You Go) for each country
- **`COUNTRY_ALIASES`** — Robust country name normalisation to handle variations returned by reverse geocoding APIs

---

## ⚙️ Configuration

The API base URL is set at the top of `App.jsx`:

```js
const API = "http://localhost:3001/api";
```

Update this to your deployed backend URL for production.

---

## 🔒 Disclaimer

DriveLegal is intended for **reference purposes only**. Traffic laws change frequently. Always verify current rules with your local transport or road authority before driving. This app does not constitute legal advice.

---

## 📄 License

MIT © 2025 — see [LICENSE](LICENSE) for details.
