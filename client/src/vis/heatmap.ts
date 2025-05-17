/**
 * Phase Coherence Heat Map Visualization
 * 
 * This module provides a WebGL-based visualization of phase coherence in ALAN oscillator networks.
 * It renders a heat map where each cell's color represents an oscillator's phase (hue)
 * and the overall brightness reflects the network's coherence (N_effective).
 */

import { fragmentShaderSource } from './shaderSources';

// Frame data structure from WebSocket
interface FrameData {
  count: number;         // Number of oscillators
  n_effective: number;   // Network coherence metric
  phases: Float32Array;  // Phase values normalized to [0, 1]
  spins?: Float32Array;  // Optional spin values (x, y, z triples)
}

// Configuration options
interface HeatMapOptions {
  width: number;         // Canvas width
  height: number;        // Canvas height
  maxNodes: number;      // Maximum number of nodes to display
  showStats?: boolean;   // Whether to show FPS stats
}

// Default configuration
const DEFAULT_OPTIONS: HeatMapOptions = {
  width: 800,
  height: 200,
  maxNodes: 10000,
  showStats: true
};

/**
 * PhaseHeatMap class for WebGL-based visualization of oscillator phases
 */
export class PhaseHeatMap {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | null;
  private program: WebGLProgram | null;
  private frameData: FrameData | null;
  private phaseTexture: WebGLTexture | null;
  private options: HeatMapOptions;
  private animationFrameId: number | null;
  private startTime: number;
  private frameCount: number;
  private lastFpsUpdate: number;
  private fpsDisplay: HTMLDivElement | null;
  private statsContainer: HTMLDivElement | null;

  // Shader locations
  private locations: {
    position?: number;
    phaseTexture?: WebGLUniformLocation | null;
    nEffective?: WebGLUniformLocation | null;
    time?: WebGLUniformLocation | null;
    resolution?: WebGLUniformLocation | null;
    nodeCount?: WebGLUniformLocation | null;
  };

  /**
   * Create a new PhaseHeatMap
   * @param container Element ID or HTMLElement to contain the visualization
   * @param options Configuration options
   */
  constructor(container: string | HTMLElement | HTMLCanvasElement, options: Partial<HeatMapOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.locations = {};
    this.frameData = null;
    this.phaseTexture = null;
    this.program = null;
    this.animationFrameId = null;
    this.startTime = performance.now();
    this.frameCount = 0;
    this.lastFpsUpdate = 0;

    // Create or find canvas element
    if (typeof container === 'string') {
      const el = document.getElementById(container);
      if (!el) {
        throw new Error(`Container element not found: ${container}`);
      }
      
      this.canvas = document.createElement('canvas');
      this.canvas.width = this.options.width;
      this.canvas.height = this.options.height;
      el.appendChild(this.canvas);
    } else if (container instanceof HTMLElement) {
      // Check if it's already a canvas
      if ('tagName' in container && container.tagName === 'CANVAS') {
        this.canvas = container as HTMLCanvasElement;
        this.canvas.width = this.options.width;
        this.canvas.height = this.options.height;
      } else {
        // It's another type of HTML element, create a canvas inside it
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.options.width;
        this.canvas.height = this.options.height;
        container.appendChild(this.canvas);
      }
    } else {
      throw new Error('Invalid container type');
    }

    // Create stats display if enabled
    if (this.options.showStats) {
      this.statsContainer = document.createElement('div');
      this.statsContainer.style.position = 'absolute';
      this.statsContainer.style.top = '10px';
      this.statsContainer.style.left = '10px';
      this.statsContainer.style.background = 'rgba(0, 0, 0, 0.5)';
      this.statsContainer.style.color = 'white';
      this.statsContainer.style.padding = '5px';
      this.statsContainer.style.fontFamily = 'monospace';
      this.statsContainer.style.fontSize = '12px';
      this.statsContainer.style.borderRadius = '3px';
      this.statsContainer.style.zIndex = '1000';
      
      this.fpsDisplay = document.createElement('div');
      this.fpsDisplay.textContent = 'FPS: --';
      this.statsContainer.appendChild(this.fpsDisplay);
      
      const container = this.canvas.parentElement || document.body;
      container.appendChild(this.statsContainer);
    } else {
      this.fpsDisplay = null;
      this.statsContainer = null;
    }

    // Initialize WebGL
    this.gl = this.canvas.getContext('webgl');
    if (!this.gl) {
      throw new Error('WebGL not supported');
    }

    // Setup GL context
    this.initGL();
  }

  /**
   * Initialize WebGL context and shaders
   */
  private initGL(): void {
    const gl = this.gl!;

    // Create shader program
    const vertexShader = this.createShader(gl.VERTEX_SHADER, `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0, 1);
      }
    `);

    // Use the fragment shader from shaderSources
    const fragmentShaderText = fragmentShaderSource || 
      // Fallback if import fails
      `precision mediump float;
      uniform sampler2D u_phaseTexture;
      uniform float u_nEffective;
      uniform vec2 u_resolution;
      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;
        gl_FragColor = vec4(uv.x, uv.y, u_nEffective, 1.0);
      }`;
    
    const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentShaderText);

    if (!vertexShader || !fragmentShader) {
      throw new Error('Failed to create shaders');
    }

    // Create and link program
    this.program = gl.createProgram();
    if (!this.program) {
      throw new Error('Failed to create shader program');
    }

    gl.attachShader(this.program, vertexShader);
    gl.attachShader(this.program, fragmentShader);
    gl.linkProgram(this.program);

    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      const info = gl.getProgramInfoLog(this.program);
      throw new Error(`Failed to link program: ${info}`);
    }

    // Get attribute and uniform locations
    this.locations.position = gl.getAttribLocation(this.program, 'a_position');
    this.locations.phaseTexture = gl.getUniformLocation(this.program, 'u_phaseTexture');
    this.locations.nEffective = gl.getUniformLocation(this.program, 'u_nEffective');
    this.locations.time = gl.getUniformLocation(this.program, 'u_time');
    this.locations.resolution = gl.getUniformLocation(this.program, 'u_resolution');
    this.locations.nodeCount = gl.getUniformLocation(this.program, 'u_nodeCount');

    // Create a buffer for the position (full-screen quad)
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,  // bottom left
         1, -1,  // bottom right
        -1,  1,  // top left
         1,  1,  // top right
      ]),
      gl.STATIC_DRAW
    );

    // Create the phase texture
    this.phaseTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.phaseTexture);
    
    // Use simple texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    
    // Initialize with empty data
    const maxNodes = this.options.maxNodes;
    const emptyPhases = new Float32Array(maxNodes);
    gl.texImage2D(
      gl.TEXTURE_2D, 0, gl.LUMINANCE, 
      maxNodes, 1, 0, 
      gl.LUMINANCE, gl.FLOAT, emptyPhases
    );

    // Initialize default frame data
    this.frameData = {
      count: 0,
      n_effective: 0,
      phases: new Float32Array(0)
    };
  }

  /**
   * Create a WebGL shader
   */
  private createShader(type: number, source: string): WebGLShader | null {
    const gl = this.gl!;
    const shader = gl.createShader(type);
    if (!shader) {
      console.error('Failed to create shader');
      return null;
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      console.error(`Failed to compile shader: ${info}`);
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  /**
   * Update the visualization with new oscillator data
   * @param data Frame data containing phases and coherence
   */
  public update(data: FrameData): void {
    this.frameData = data;
    
    // Update the texture with new phase data
    if (this.gl && this.phaseTexture && data.phases) {
      const gl = this.gl;
      gl.bindTexture(gl.TEXTURE_2D, this.phaseTexture);
      
      // Update texture with new phase data
      gl.texSubImage2D(
        gl.TEXTURE_2D, 0, 0, 0, 
        data.count, 1, 
        gl.LUMINANCE, gl.FLOAT, data.phases
      );
    }
  }

  /**
   * Start the rendering loop
   */
  public start(): void {
    if (this.animationFrameId !== null) {
      return;  // Already running
    }
    this.render();
  }

  /**
   * Stop the rendering loop
   */
  public stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Render the current frame
   */
  private render = (): void => {
    const gl = this.gl!;
    const now = performance.now();
    const data = this.frameData;
    
    if (!data || !this.program) {
      this.animationFrameId = requestAnimationFrame(this.render);
      return;
    }

    // Clear the canvas
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Use the program
    gl.useProgram(this.program);

    // Set up the position attribute
    gl.enableVertexAttribArray(this.locations.position!);
    gl.vertexAttribPointer(this.locations.position!, 2, gl.FLOAT, false, 0, 0);

    // Set uniforms
    gl.uniform1i(this.locations.phaseTexture!, 0);  // Use texture unit 0
    gl.uniform1f(this.locations.nEffective!, data.n_effective);
    gl.uniform1f(this.locations.time!, (now - this.startTime) / 1000);  // Time in seconds
    gl.uniform2f(this.locations.resolution!, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.locations.nodeCount!, data.count);

    // Bind the texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.phaseTexture);

    // Draw the quad
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Update FPS counter
    this.frameCount++;
    const elapsed = now - this.lastFpsUpdate;
    if (elapsed >= 1000) {  // Update every second
      const fps = Math.round((this.frameCount * 1000) / elapsed);
      this.lastFpsUpdate = now;
      this.frameCount = 0;
      
      if (this.fpsDisplay) {
        this.fpsDisplay.textContent = `FPS: ${fps} | Nodes: ${data.count} | N_eff: ${data.n_effective.toFixed(2)}`;
      }
    }

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.render);
  };

  /**
   * Clean up resources
   */
  public dispose(): void {
    this.stop();
    
    const gl = this.gl;
    if (!gl) return;
    
    // Delete textures
    if (this.phaseTexture) {
      gl.deleteTexture(this.phaseTexture);
    }
    
    // Delete program and shaders
    if (this.program) {
      gl.deleteProgram(this.program);
    }
    
    // Remove stats display if present
    if (this.statsContainer && this.statsContainer.parentElement) {
      this.statsContainer.parentElement.removeChild(this.statsContainer);
    }
  }

  /**
   * Resize the canvas
   */
  public resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.gl?.viewport(0, 0, width, height);
  }
}

/**
 * Create a WebSocket connection to the simulation server
 * and feed data to the heat map visualization
 */
export class SimulationSocket {
  private socket: WebSocket;
  private heatMap: PhaseHeatMap;
  private connected: boolean = false;
  private dataBuffer: ArrayBuffer;
  private phaseBuffer: Float32Array;
  private spinBuffer: Float32Array | null = null;
  private frameHeader = new Uint32Array(2); // [count, n_effective_float_bits]
  
  /**
   * Create a new simulation socket
   * @param url WebSocket URL to connect to
   * @param heatMap Heat map visualization to update
   */
  constructor(url: string, heatMap: PhaseHeatMap) {
    this.heatMap = heatMap;
    this.socket = new WebSocket(url);
    
    // Preallocate buffers for efficient data handling
    this.dataBuffer = new ArrayBuffer(8 + 4 * 10000); // Header + space for 10k nodes
    this.phaseBuffer = new Float32Array(10000);
    
    // Setup event handlers
    this.socket.binaryType = 'arraybuffer';
    this.socket.onopen = this.handleOpen;
    this.socket.onclose = this.handleClose;
    this.socket.onerror = this.handleError;
    this.socket.onmessage = this.handleMessage;
  }
  
  private handleOpen = (): void => {
    console.log('WebSocket connected to simulation server');
    this.connected = true;
  };
  
  private handleClose = (): void => {
    console.log('WebSocket disconnected');
    this.connected = false;
  };
  
  private handleError = (event: Event): void => {
    console.error('WebSocket error:', event);
  };
  
  private handleMessage = (event: MessageEvent): void => {
    if (!(event.data instanceof ArrayBuffer)) {
      console.warn('Received non-binary message, ignoring');
      return;
    }
    
    const data = event.data;
    
    // Parse the binary message:
    // [uint32 count, float32 n_effective, float32 phases[], float32 spins[]]
    const header = new Uint32Array(data, 0, 2);
    const count = header[0];
    
    // Extract n_effective from the second uint32 slot (reinterpreted as float)
    const nEffView = new Float32Array(data, 4, 1);
    const nEffective = nEffView[0];
    
    // Extract phases (normalized to [0,1])
    const phases = new Float32Array(data, 8, count);
    
    // Extract spins if present (each node has a 3D vector)
    let spins: Float32Array | undefined = undefined;
    if (data.byteLength >= 8 + (count * 4) + (count * 3 * 4)) {
      spins = new Float32Array(data, 8 + (count * 4), count * 3);
    }
    
    // Update the heat map
    this.heatMap.update({
      count,
      n_effective: nEffective,
      phases,
      spins
    });
  };
  
  /**
   * Close the WebSocket connection
   */
  public close(): void {
    if (this.connected) {
      this.socket.close();
    }
  }
  
  /**
   * Check if the socket is connected
   */
  public isConnected(): boolean {
    return this.connected;
  }
}

/**
 * Create a heat map visualization and connect it to a simulation
 * @param container Element to contain the visualization
 * @param options Configuration options
 * @param simulationUrl WebSocket URL for the simulation server
 */
export function createHeatMap(
  container: string | HTMLElement,
  options: Partial<HeatMapOptions> = {},
  simulationUrl: string = 'ws://localhost:8000/ws/simulate'
): { heatMap: PhaseHeatMap, socket: SimulationSocket } {
  const heatMap = new PhaseHeatMap(container, options);
  const socket = new SimulationSocket(simulationUrl, heatMap);
  
  // Start the visualization
  heatMap.start();
  
  return { heatMap, socket };
}
