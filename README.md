# Opus - 3D Code Graph Visualizer

A living 3D globe visualization of code structure, powered by WebAssembly and C++ for high-performance graph calculations.

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)

## Features

- **Globe Layout** - Nodes positioned on sphere surface using Fibonacci distribution
- **Dynamic Geometry** - Node shapes adapt based on connection count
- **Geodesic Edges** - Flight-path-like curves along sphere surface
- **Organic Animations** - Breathing/bloodflow effects on edges
- **C++ Backend** - Vector math and graph algorithms run in WebAssembly
- **Interactive** - Click, drag, zoom to explore code relationships

## Quick Start

1. **Open in browser:**
   ```bash
   # Simply double-click index.html
   # Or open: file:///path/to/opus/index.html
   ```

2. **Interact:**
   - **Click nodes** → View code details
   - **Drag** → Rotate globe
   - **Scroll** → Zoom in/out

## Build from Source

### Prerequisites

- Emscripten SDK (for compiling C++ to WebAssembly)

### Installation

1. **Clone Emscripten SDK:**
   ```bash
   git clone https://github.com/emscripten-core/emsdk.git
   cd emsdk
   emsdk install latest
   emsdk activate latest
   ```

2. **Build WASM module:**
   ```bash
   cd opus
   .\build.bat
   ```

   Output: `build/opus_engine.js` and `build/opus_engine.wasm`

## Architecture

### Frontend (JavaScript)
- **Three.js** - 3D rendering and visualization
- **app.js** - Main application logic, UI, animations

### Backend (C++ → WebAssembly)
- **vector.hpp** - Vec3 class with vector operations
- **graph.hpp** - Graph algorithms (Fibonacci sphere, geodesic curves)
- **bindings.cpp** - Emscripten exports to JavaScript

```
┌─────────────────────────────────────┐
│          Browser (JS)               │
│  ┌──────────────────────────────┐   │
│  │ Three.js Renderer            │   │
│  │ (Visual + Interaction)       │   │
│  └──────────┬───────────────────┘   │
│             │ calls                 │
│  ┌──────────▼───────────────────┐   │
│  │ OpusEngine (WASM Module)     │   │
│  │ ┌────────────────────────┐   │   │
│  │ │ C++ Graph Engine       │   │   │
│  │ │ • Fibonacci Sphere     │   │   │
│  │ │ • Geodesic Curves      │   │   │
│  │ │ • Vector Math          │   │   │
│  │ └────────────────────────┘   │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

## Performance

- **C++ Math:** Near-native speed for vector operations
- **Optimized:** Compiled with `-O3` flag
- **Small Binary:** ~29KB WASM module
- **60 FPS:** Smooth animations even with many nodes

## Project Structure

```
opus/
├── index.html          # Main HTML entry point
├── app.js              # Frontend application logic
├── style.css           # UI styling
├── build.bat           # Build script for WASM
├── src/
│   ├── cpp/
│   │   ├── vector.hpp  # Vector math library
│   │   └── graph.hpp   # Graph algorithms
│   └── wasm/
│       └── bindings.cpp # Emscripten bindings
└── build/
    ├── opus_engine.js   # Generated WASM glue code
    └── opus_engine.wasm # Compiled C++ binary
```

## Development

### Rebuilding WASM

After modifying C++ code:
```bash
.\build.bat
```

### Adding New Graph Algorithms

1. Add function to `src/cpp/graph.hpp`
2. Export in `src/wasm/bindings.cpp`
3. Rebuild and use in `app.js`

## License

MIT License - see LICENSE file for details

## Tech Stack

- **Frontend:** Three.js, JavaScript ES6
- **Backend:** C++17, Emscripten
- **Build:** Emscripten SDK 4.0.21
