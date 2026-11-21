# 🌕 Celestia — Immersive Planetary Exploration Console

Celestia is an edge-to-edge 3D lunar exploration environment and interactive rover mission simulator inspired by space exploration consoles. It visualizes high-resolution Digital Elevation Models (DEMs) derived from lunar orbiter datasets (NASA LOLA and ISRO Chandrayaan TMC-2) and features real-time deterministic A* pathfinding with physical 3D rover traversal.

---

## 🚀 Key Features

- **Full-Screen 3D Lunar Environment:** Complete interactive 3D Moon with smooth orbit, pan, and zoom controls.
- **Micro-Topography Digital Elevation Models (DEM):** 64×64 surface heightfields for key lunar sites:
  - **Shiv Shakti Point:** Chandrayaan-3 landing site ($69.37^\circ\text{S}, 32.32^\circ\text{E}$)
  - **Shackleton Connecting Ridge:** Lunar South Pole illuminated ridge
  - **Tranquility Base:** Apollo 11 landing site ($0.67^\circ\text{N}, 23.47^\circ\text{E}$)
  - **Tycho Crater Terraces:** Prominent impact crater rim with stepped scarps
- **Integrated Rover Mission Simulator:**
  - Deterministic A* route planning with slope hazard avoidance and energy consumption estimates.
  - Physically grounded 3D Pragyan rover traversing terrain with continuous elevation sampling and pitch tilting.
  - Multi-camera director: **Orbital 3D**, **Top-Down Nadir**, and dynamic **Rover Chase** mode.
- **Translucent Glassmorphic Controls:** Floating, draggable, collapsible panels for navigation, mission planning, surface probing, and scientific observations.
- **Bonus Deep Space Observatory:** High-energy astrophysical event viewer (cosmic ray, gamma-ray, and neutrino observations).

---

## 🛠️ Tech Stack

- **Framework:** React 19 + TypeScript + Vite
- **3D Graphics & Physics:** Three.js + React Three Fiber (`@react-three/fiber`) + Drei (`@react-three/drei`)
- **Styling:** Tailwind CSS 4
- **Icons:** Lucide React
- **Algorithms:** Deterministic 8-directional A* grid search with bi-directional elevation weighting

---

## 💻 Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
   cd <YOUR_REPO_NAME>
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   # or: npm install
   ```

3. **Start local development server:**
   ```bash
   pnpm run dev
   # or: npm run dev
   ```

4. **Build for production:**
   ```bash
   pnpm run build
   ```

---

## 🌐 Deploy to GitHub Pages

This project is configured with a continuous deployment GitHub Actions workflow (`.github/workflows/deploy.yml`).

1. Create a new repository on [GitHub](https://github.com/new).
2. Push your code to the `main` branch:
   ```bash
   git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
   git push -u origin main
   ```
3. Enable GitHub Pages:
   - Navigate to **Settings** > **Pages** in your repository.
   - Under **Build and deployment** > **Source**, select **GitHub Actions**.
4. The deployment workflow will automatically build and publish your site!
