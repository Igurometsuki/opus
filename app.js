// ========================================
// 3D Code Graph Visualizer
// ========================================

let scene, camera, renderer, controls;
let nodes = [];
let edges = [];
let particles = [];
let raycaster, mouse;
let selectedNode = null;
let hoveredNode = null;
let animationTime = 0;
let introAnimationProgress = 0;
const INTRO_DURATION = 3; // seconds

// Node type configurations
const NODE_TYPES = {
    module: {
        color: 0x00ffff,
        geometry: 'sphere',
        size: 1.2,
        emissive: 0x00ffff,
        emissiveIntensity: 0.5
    },
    class: {
        color: 0xff00ff,
        geometry: 'octahedron',
        size: 1.0,
        emissive: 0xff00ff,
        emissiveIntensity: 0.5
    },
    function: {
        color: 0x8a2be2,
        geometry: 'box',
        size: 0.8,
        emissive: 0x8a2be2,
        emissiveIntensity: 0.5
    },
    variable: {
        color: 0x00bfff,
        geometry: 'tetrahedron',
        size: 0.6,
        emissive: 0x00bfff,
        emissiveIntensity: 0.5
    }
};

// Mock Python code graph data
const graphData = {
    nodes: [
        // Modules
        { id: 0, name: 'main.py', type: 'module', code: 'from utils import helper\nfrom models import User\n\ndef main():\n    print("Hello World")' },
        { id: 1, name: 'utils.py', type: 'module', code: 'def helper(x):\n    return x * 2' },
        { id: 2, name: 'models.py', type: 'module', code: 'class User:\n    def __init__(self):\n        pass' },

        // Classes
        { id: 3, name: 'User', type: 'class', code: 'class User:\n    def __init__(self, name):\n        self.name = name\n    \n    def greet(self):\n        return f"Hello {self.name}"' },
        { id: 4, name: 'Database', type: 'class', code: 'class Database:\n    def connect(self):\n        pass' },

        // Functions
        { id: 5, name: 'main()', type: 'function', code: 'def main():\n    user = User("Alice")\n    print(user.greet())' },
        { id: 6, name: 'helper()', type: 'function', code: 'def helper(x):\n    return process(x) * 2' },
        { id: 7, name: 'process()', type: 'function', code: 'def process(data):\n    return data.upper()' },
        { id: 8, name: 'greet()', type: 'function', code: 'def greet(self):\n    return f"Hello {self.name}"' },

        // Variables
        { id: 9, name: 'config', type: 'variable', code: 'config = {\n    "debug": True,\n    "port": 8080\n}' },
        { id: 10, name: 'API_KEY', type: 'variable', code: 'API_KEY = "secret_key_123"' },
    ],
    edges: [
        // Module imports
        { source: 0, target: 1, type: 'import' },
        { source: 0, target: 2, type: 'import' },

        // Module contains class
        { source: 2, target: 3, type: 'contains' },
        { source: 2, target: 4, type: 'contains' },

        // Module contains function
        { source: 0, target: 5, type: 'contains' },
        { source: 1, target: 6, type: 'contains' },
        { source: 1, target: 7, type: 'contains' },

        // Class contains method
        { source: 3, target: 8, type: 'contains' },

        // Function calls
        { source: 5, target: 3, type: 'instantiates' },
        { source: 5, target: 8, type: 'calls' },
        { source: 6, target: 7, type: 'calls' },

        // Uses variable
        { source: 0, target: 9, type: 'uses' },
        { source: 5, target: 10, type: 'uses' },
    ]
};

// ========================================
// Initialization
// ========================================

function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // Camera setup
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 10, 25);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('container').appendChild(renderer.domElement);

    // Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 100;

    // Raycaster for mouse interaction
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00ffff, 1, 100);
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff00ff, 1, 100);
    pointLight2.position.set(-10, -10, -10);
    scene.add(pointLight2);

    // Create graph
    createGraph();

    // Add background particles
    createBackgroundParticles();

    // Event listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onMouseClick);
    document.getElementById('close-panel').addEventListener('click', closeInfoPanel);

    // Hide loading screen after a delay
    setTimeout(() => {
        document.getElementById('loading').classList.add('hidden');
    }, 3000);

    // Start animation
    animate();
}

// ========================================
// Graph Creation
// ========================================

function createGraph() {
    // Position nodes in a 3D space using force-directed layout (simplified)
    const positions = calculateNodePositions();

    // Create nodes
    graphData.nodes.forEach((nodeData, index) => {
        const node = createNode(nodeData, positions[index]);
        nodes.push(node);
        scene.add(node.mesh);

        // Add glow particles around node
        createNodeGlow(node);
    });

    // Create edges
    graphData.edges.forEach(edgeData => {
        const edge = createEdge(
            nodes[edgeData.source],
            nodes[edgeData.target],
            edgeData.type
        );
        edges.push(edge);
        scene.add(edge.line);

        // Create particles for this edge
        createEdgeParticles(edge);
    });
}

function calculateNodePositions() {
    // Position nodes on sphere surface (like cities on a globe)
    const positions = [];
    const radius = 12; // Globe radius

    graphData.nodes.forEach((node, index) => {
        // Fibonacci sphere distribution for even spacing
        const phi = Math.acos(-1 + (2 * index) / graphData.nodes.length);
        const theta = Math.sqrt(graphData.nodes.length * Math.PI) * phi;

        // Place exactly on sphere surface (no offset)
        positions.push({
            x: radius * Math.cos(theta) * Math.sin(phi),
            y: radius * Math.cos(phi),
            z: radius * Math.sin(theta) * Math.sin(phi)
        });
    });

    return positions;
}

function createNode(data, position) {
    const config = NODE_TYPES[data.type];

    // Count connections for this node
    const nodeIndex = graphData.nodes.indexOf(data);
    let connectionCount = 0;
    graphData.edges.forEach(edge => {
        if (edge.source === nodeIndex || edge.target === nodeIndex) {
            connectionCount++;
        }
    });

    // Choose geometry based on connection count (organic + artificial)
    let geometry;
    let size = config.size;

    if (connectionCount <= 2) {
        // Few connections: tetrahedron (simple)
        geometry = new THREE.TetrahedronGeometry(size);
    } else if (connectionCount <= 4) {
        // Moderate connections: box/cuboid
        geometry = new THREE.BoxGeometry(size, size, size);
    } else if (connectionCount <= 6) {
        // More connections: octahedron
        geometry = new THREE.OctahedronGeometry(size);
    } else if (connectionCount <= 8) {
        // Many connections: dodecahedron
        geometry = new THREE.DodecahedronGeometry(size * 0.9);
    } else {
        // Hub nodes: icosahedron (most complex)
        geometry = new THREE.IcosahedronGeometry(size * 1.1, 0);
    }

    // Create material with glow
    const material = new THREE.MeshStandardMaterial({
        color: config.color,
        emissive: config.emissive,
        emissiveIntensity: config.emissiveIntensity,
        metalness: 0.5,
        roughness: 0.2,
        flatShading: connectionCount > 6 // Faceted look for complex nodes
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position.x, position.y, position.z);

    // Store initial scale for animation
    const initialScale = 0.01;
    mesh.scale.set(initialScale, initialScale, initialScale);

    return {
        mesh,
        data,
        position,
        config,
        pulsePhase: Math.random() * Math.PI * 2,
        initialScale,
        targetScale: 1.0
    };
}

function createNodeGlow(node) {
    // Create a larger transparent sphere around the node for glow effect
    const glowGeometry = new THREE.SphereGeometry(node.config.size * 1.5, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: node.config.color,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide
    });

    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.position.copy(node.mesh.position);
    glowMesh.scale.set(0.01, 0.01, 0.01);

    scene.add(glowMesh);
    node.glowMesh = glowMesh;
}

function createEdge(sourceNode, targetNode, type) {
    // Color based on type
    const colorMap = {
        'import': 0x00ffff,
        'contains': 0xff00ff,
        'calls': 0x8a2be2,
        'instantiates': 0x00ff00,
        'uses': 0xffff00
    };

    const color = colorMap[type] || 0x00ffff;

    // Create tree-branch-like path - less wobble, more direct
    const start = sourceNode.mesh.position.clone();
    const end = targetNode.mesh.position.clone();

    // Calculate subtle curve like tree branches
    const midpoint = start.clone().lerp(end, 0.5);
    const distance = start.distanceTo(end);

    // Much subtler offset - mostly straight with slight organic bend
    // Use perpendicular vector for natural branching
    const direction = end.clone().sub(start).normalize();
    const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x).normalize();

    // Very subtle offset (reduced from 0.15 to 0.05)
    const offset = perpendicular.multiplyScalar(distance * 0.05 * (Math.random() - 0.5));
    midpoint.add(offset);

    // Simple 3-point curve for clean tree-branch look
    // Create geodesic curve along sphere surface (like flight paths)
    const points = [];
    const segments = 25; // More segments for smoother curve
    const globeRadius = 12;

    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        // Linear interpolation between start and end
        const interpolated = start.clone().lerp(end, t);
        // Project onto sphere and add slight arc
        interpolated.normalize().multiplyScalar(globeRadius + Math.sin(t * Math.PI) * 0.8);
        points.push(interpolated);
    }

    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5); // Lower tension for straighter lines

    // Create tube geometry along the curve
    const tubeGeometry = new THREE.TubeGeometry(curve, 16, 0.08, 8, false);

    const material = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0,
        metalness: 0.8,
        roughness: 0.2
    });

    const tube = new THREE.Mesh(tubeGeometry, material);

    return {
        line: tube, // Keep the property name for compatibility
        tube: tube,
        curve: curve,
        sourceNode,
        targetNode,
        type,
        color,
        fullCurve: curve, // Store the complete curve
        growthProgress: 0,
        pulsePhase: Math.random() * Math.PI * 2
    };
}

function createEdgeParticles(edge) {
    const particleCount = 3;
    const particleGeometry = new THREE.SphereGeometry(0.1, 8, 8);

    for (let i = 0; i < particleCount; i++) {
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: edge.color,
            transparent: true,
            opacity: 0
        });

        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        scene.add(particle);

        particles.push({
            mesh: particle,
            edge: edge,
            progress: i / particleCount,
            speed: 0.2 + Math.random() * 0.3
        });
    }
}

function createBackgroundParticles() {
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = [];

    for (let i = 0; i < particleCount; i++) {
        positions.push(
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 100,
            (Math.random() - 0.5) * 100
        );
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0x00ffff,
        size: 0.1,
        transparent: true,
        opacity: 0.6
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);
}

// ========================================
// Animation
// ========================================

function animate() {
    requestAnimationFrame(animate);

    animationTime += 0.016; // ~60fps

    // Update intro animation
    if (introAnimationProgress < 1) {
        introAnimationProgress = Math.min(1, introAnimationProgress + 0.016 / INTRO_DURATION);
        updateIntroAnimation();
    }

    // Animate nodes (pulsing/breathing)
    nodes.forEach(node => {
        animateNode(node);
    });

    // Animate edges (pulsing glow)
    edges.forEach(edge => {
        animateEdge(edge);
    });

    // Animate particles along edges
    particles.forEach(particle => {
        animateParticle(particle);
    });

    // Update hover effect
    updateHoverEffect();

    // Gentle auto-rotation of camera
    if (!controls.enabled || !selectedNode) {
        scene.rotation.y += 0.0005;
    }

    controls.update();
    renderer.render(scene, camera);
}

function updateIntroAnimation() {
    const eased = easeOutCubic(introAnimationProgress);

    // Grow nodes
    nodes.forEach((node, index) => {
        const delay = index / nodes.length * 0.5;
        const nodeProgress = Math.max(0, Math.min(1, (eased - delay) / 0.5));
        const scale = node.initialScale + (node.targetScale - node.initialScale) * easeOutBack(nodeProgress);

        node.mesh.scale.set(scale, scale, scale);
        if (node.glowMesh) {
            node.glowMesh.scale.set(scale, scale, scale);
        }
    });

    // Grow edges from source to target
    edges.forEach((edge, index) => {
        const delay = 0.3 + index / edges.length * 0.4;
        const edgeProgress = Math.max(0, Math.min(1, (eased - delay) / 0.3));

        edge.growthProgress = easeOutCubic(edgeProgress);

        // Create a partial curve for the growing effect
        if (edgeProgress > 0 && edgeProgress < 1) {
            // Sample the full curve and create a partial version
            const points = [];
            const segments = 32;

            for (let i = 0; i <= segments * edgeProgress; i++) {
                const t = i / segments;
                points.push(edge.fullCurve.getPoint(t));
            }

            if (points.length > 1) {
                const partialCurve = new THREE.CatmullRomCurve3(points);
                const newGeometry = new THREE.TubeGeometry(partialCurve, Math.max(2, Math.floor(segments * edgeProgress)), 0.08, 8, false);
                edge.tube.geometry.dispose();
                edge.tube.geometry = newGeometry;
            }
        } else if (edgeProgress >= 1) {
            // Ensure full geometry is set
            const fullGeometry = new THREE.TubeGeometry(edge.fullCurve, 32, 0.08, 8, false);
            edge.tube.geometry.dispose();
            edge.tube.geometry = fullGeometry;
        }

        // Fade in opacity and emissive
        edge.tube.material.opacity = Math.min(edgeProgress * 0.7, 0.7);
        edge.tube.material.emissiveIntensity = Math.min(edgeProgress * 0.3, 0.3);
    });
}

function animateNode(node) {
    if (introAnimationProgress < 1) return;

    // Pulsing effect
    const pulse = Math.sin(animationTime * 2 + node.pulsePhase) * 0.1 + 1;
    const baseScale = node.targetScale;

    if (node === hoveredNode || node === selectedNode) {
        // Highlighted nodes pulse more
        const highlightScale = baseScale * (1.2 + Math.sin(animationTime * 4) * 0.1);
        node.mesh.scale.set(highlightScale, highlightScale, highlightScale);
        node.mesh.material.emissiveIntensity = 0.8 + Math.sin(animationTime * 3) * 0.2;

        // ROTATE selected node for emphasis
        if (node === selectedNode) {
            node.mesh.rotation.y += 0.02; // Continuous rotation
            node.mesh.rotation.x += 0.01;
        }
    } else {
        node.mesh.scale.set(baseScale * pulse, baseScale * pulse, baseScale * pulse);
        node.mesh.material.emissiveIntensity = node.config.emissiveIntensity;
    }

    // Update glow
    if (node.glowMesh) {
        const glowScale = baseScale * pulse * 1.5;
        node.glowMesh.scale.set(glowScale, glowScale, glowScale);
        node.glowMesh.material.opacity = 0.2 + Math.sin(animationTime * 2 + node.pulsePhase) * 0.1;
    }

    // Gentle floating motion - EXCEPT for selected node (needs to stay stable for camera)
    if (node === selectedNode) {
        // Keep selected node at exact base position for stable camera focus
        node.mesh.position.set(node.position.x, node.position.y, node.position.z);
        if (node.glowMesh) {
            node.glowMesh.position.copy(node.mesh.position);
        }
    } else {
        // Other nodes can float
        node.mesh.position.y = node.position.y + Math.sin(animationTime + node.pulsePhase) * 0.2;
        if (node.glowMesh) {
            node.glowMesh.position.copy(node.mesh.position);
        }
    }
}

function animateEdge(edge) {
    if (introAnimationProgress < 1 || edge.growthProgress < 0.99) return;

    // SLOW ORGANIC BLOODFLOW EFFECT
    // Multiple sine waves at different frequencies create organic pulsing
    const slowPulse1 = Math.sin(animationTime * 0.5 + edge.pulsePhase) * 0.5 + 0.5; // Very slow
    const slowPulse2 = Math.sin(animationTime * 0.3 + edge.pulsePhase * 1.5) * 0.3 + 0.5; // Even slower
    const mediumPulse = Math.sin(animationTime * 0.8 + edge.pulsePhase * 0.7) * 0.2 + 0.5; // Medium

    // Combine waves for organic "breathing" effect
    const combinedPulse = (slowPulse1 + slowPulse2 + mediumPulse) / 3;

    // Base values
    const baseOpacity = 0.4;
    const baseEmissive = 0.25;

    // Apply bloodflow-like pulsing
    edge.tube.material.opacity = baseOpacity + combinedPulse * 0.35;
    edge.tube.material.emissiveIntensity = baseEmissive + combinedPulse * 0.5;

    // Highlight if related to selected/hovered node
    if (selectedNode && (edge.sourceNode === selectedNode || edge.targetNode === selectedNode)) {
        // Selected edges pulse more intensely
        edge.tube.material.opacity = 0.8 + slowPulse1 * 0.2;
        edge.tube.material.emissiveIntensity = 0.7 + slowPulse1 * 0.3;
    }
}

function animateParticle(particle) {
    if (introAnimationProgress < 1 || particle.edge.growthProgress < 1) return;

    // Move particle along edge
    particle.progress += particle.speed * 0.01;
    if (particle.progress > 1) {
        particle.progress = 0;
    }

    const start = particle.edge.sourceNode.mesh.position;
    const end = particle.edge.targetNode.mesh.position;
    const pos = start.clone().lerp(end, particle.progress);

    particle.mesh.position.copy(pos);

    // Fade in/out based on position
    const fadeIn = Math.min(particle.progress * 5, 1);
    const fadeOut = Math.min((1 - particle.progress) * 5, 1);
    particle.mesh.material.opacity = Math.min(fadeIn, fadeOut) * 0.8;

    // Scale pulsing
    const scale = 1 + Math.sin(animationTime * 5 + particle.progress * Math.PI * 2) * 0.3;
    particle.mesh.scale.set(scale, scale, scale);
}

// ========================================
// Interaction
// ========================================

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function updateHoverEffect() {
    raycaster.setFromCamera(mouse, camera);

    const meshes = nodes.map(n => n.mesh);
    const intersects = raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
        const intersectedMesh = intersects[0].object;
        const node = nodes.find(n => n.mesh === intersectedMesh);

        if (node !== hoveredNode) {
            hoveredNode = node;
            document.body.style.cursor = 'pointer';
        }
    } else {
        if (hoveredNode) {
            hoveredNode = null;
            document.body.style.cursor = 'default';
        }
    }
}

function onMouseClick() {
    if (hoveredNode) {
        selectedNode = hoveredNode;
        showInfoPanel(selectedNode);

        // Calculate camera target using node's BASE position (not animated floating position)
        // Position camera relative to the node
        const nodeBasePos = new THREE.Vector3(
            selectedNode.position.x,
            selectedNode.position.y,
            selectedNode.position.z
        );

        // Calculate camera position: move back from node along the direction from origin
        const direction = nodeBasePos.clone().normalize();
        const distance = 10;
        const targetPos = nodeBasePos.clone().add(direction.multiplyScalar(distance));

        animateCameraTo(targetPos, nodeBasePos);
    }
}

function showInfoPanel(node) {
    const panel = document.getElementById('info-panel');

    document.getElementById('node-title').textContent = node.data.name;
    document.getElementById('node-type').textContent = node.data.type;
    document.getElementById('node-name').textContent = node.data.name;
    document.getElementById('node-code').textContent = node.data.code;

    // Count connections
    const connections = edges.filter(e =>
        e.sourceNode === node || e.targetNode === node
    ).length;
    document.getElementById('node-connections').textContent = connections;

    panel.classList.remove('hidden');
}

function closeInfoPanel() {
    document.getElementById('info-panel').classList.add('hidden');
    selectedNode = null;
}

function animateCameraTo(targetPos, lookAtPos) {
    // Smooth camera animation to target position
    const startPos = camera.position.clone();
    const duration = 1000; // ms
    const startTime = Date.now();

    function updateCamera() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutCubic(progress);

        camera.position.lerpVectors(startPos, targetPos, eased);
        // Look at the BASE position (not animated mesh position) for stable focus
        camera.lookAt(lookAtPos);

        if (progress < 1) {
            requestAnimationFrame(updateCamera);
        }
    }

    updateCamera();
}

// ========================================
// Utility Functions
// ========================================

function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

function easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ========================================
// Start Application
// ========================================

window.addEventListener('DOMContentLoaded', init);
