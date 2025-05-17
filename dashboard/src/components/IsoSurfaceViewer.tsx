import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

interface IsoSurfaceViewerProps {
  levelValue: number;
  width?: number;
  height?: number;
  functionType?: 'barrier' | 'lyapunov';
  backgroundColor?: string;
  surfaceColor?: string;
  wireframe?: boolean;
}

/**
 * Component to display 3D iso-surfaces for barrier or Lyapunov functions.
 * Uses three.js for WebGL-based rendering.
 */
const IsoSurfaceViewer: React.FC<IsoSurfaceViewerProps> = ({
  levelValue,
  width = 500,
  height = 500,
  functionType = 'barrier',
  backgroundColor = '#f0f0f0',
  surfaceColor = '#1e88e5',
  wireframe = false
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Store three.js objects in refs to clean up on unmount
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  
  // Set up three.js scene
  useEffect(() => {
    if (!mountRef.current) return;
    
    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(backgroundColor);
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    cameraRef.current = camera;
    camera.position.z = 5;
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    
    // Add orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
    
    // Add coordinate axes for reference
    const axesHelper = new THREE.AxesHelper(2);
    scene.add(axesHelper);
    
    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Clean up on unmount
    return () => {
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      if (meshRef.current && sceneRef.current) {
        sceneRef.current.remove(meshRef.current);
        meshRef.current.geometry.dispose();
        if (Array.isArray(meshRef.current.material)) {
          meshRef.current.material.forEach(material => material.dispose());
        } else {
          meshRef.current.material.dispose();
        }
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [width, height, backgroundColor]);
  
  // Load iso-surface mesh when level value changes
  useEffect(() => {
    if (!sceneRef.current) return;
    
    setLoading(true);
    setError(null);
    
    // Remove existing mesh if any
    if (meshRef.current && sceneRef.current) {
      sceneRef.current.remove(meshRef.current);
      meshRef.current.geometry.dispose();
      if (Array.isArray(meshRef.current.material)) {
        meshRef.current.material.forEach(material => material.dispose());
      } else {
        meshRef.current.material.dispose();
      }
      meshRef.current = null;
    }
    
    // Fetch iso-surface mesh
    const loader = new GLTFLoader();
    const url = `/api/v1/barrier/isosurface?type=${functionType}&lvl=${levelValue}`;
    
    loader.load(
      url,
      (gltf) => {
        // Process loaded GLTF model
        const model = gltf.scene;
        
        // Apply material to all meshes
        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = new THREE.MeshPhongMaterial({
              color: new THREE.Color(surfaceColor),
              wireframe,
              side: THREE.DoubleSide,
              flatShading: true,
            });
          }
        });
        
        // Center model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        
        // Scale model to fit view
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 3 / maxDim;
        model.scale.multiplyScalar(scale);
        
        // Add to scene
        if (sceneRef.current) {
          sceneRef.current.add(model);
          meshRef.current = model.children[0] as THREE.Mesh;
        }
        
        setLoading(false);
      },
      (progress) => {
        // Handle load progress if needed
      },
      (error) => {
        setError('Failed to load iso-surface model.');
        setLoading(false);
        console.error('Error loading GLTF model:', error);
      }
    );
  }, [levelValue, functionType, surfaceColor, wireframe]);
  
  return (
    <div className="iso-surface-viewer">
      <h3>{functionType === 'barrier' ? 'Barrier' : 'Lyapunov'} Function Iso-Surface</h3>
      <div style={{ position: 'relative' }}>
        <div ref={mountRef}></div>
        {loading && (
          <div 
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 255, 255, 0.7)'
            }}
          >
            <div>Loading iso-surface...</div>
          </div>
        )}
        {error && (
          <div 
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255, 0, 0, 0.1)',
              color: 'red'
            }}
          >
            <div>{error}</div>
          </div>
        )}
      </div>
      <div className="info" style={{ marginTop: '10px' }}>
        <div>Level: {levelValue.toFixed(2)}</div>
        <div>Type: {functionType}</div>
        <div style={{ marginTop: '5px', fontSize: '0.8em', color: '#666' }}>
          Use mouse to rotate, scroll to zoom, shift+click to pan
        </div>
      </div>
    </div>
  );
};

export default IsoSurfaceViewer;
