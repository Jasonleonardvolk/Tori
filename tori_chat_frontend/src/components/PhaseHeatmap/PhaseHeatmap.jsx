import React, { useEffect, useRef, useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';
import './PhaseHeatmap.css';

/**
 * PhaseHeatmap - Component for visualizing phase data with adaptive rendering
 * Automatically switches to WebGL for large datasets (>5000 points)
 */
const PhaseHeatmap = ({
  data,
  width = 800,
  height = 400,
  colorRange = ['#0000CC', '#00CCFF', '#00FFCC', '#CCFF00', '#FFCC00', '#CC0000'],
  minValue = 0,
  maxValue = 2 * Math.PI,
  cellSize = 10,
  renderMode = 'auto', // 'auto', 'canvas', or 'webgl'
  title = 'Phase Heatmap',
  showLegend = true,
  onCellClick = null,
}) => {
  const canvasRef = useRef(null);
  const webglRef = useRef(null);
  const legendRef = useRef(null);
  const [dataSize, setDataSize] = useState(0);
  const [fps, setFps] = useState(60);
  const [currentMode, setCurrentMode] = useState('canvas');
  const [isWebGLSupported, setIsWebGLSupported] = useState(true);

  // Check if WebGL is supported on mount
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setIsWebGLSupported(!!gl);
    } catch (e) {
      setIsWebGLSupported(false);
    }
  }, []);

  // Determine actual data size
  useEffect(() => {
    if (Array.isArray(data)) {
      setDataSize(data.length);
    } else if (data && typeof data === 'object') {
      // Assume it's an object with nested data arrays
      let totalSize = 0;
      Object.values(data).forEach(agentData => {
        if (Array.isArray(agentData.data || agentData)) {
          totalSize += (agentData.data || agentData).length;
        }
      });
      setDataSize(totalSize);
    }
  }, [data]);

  // Determine rendering mode based on data size and available capabilities
  useEffect(() => {
    if (renderMode !== 'auto') {
      setCurrentMode(renderMode);
      return;
    }

    // Choose mode based on data size
    if (dataSize > 5000 && isWebGLSupported) {
      setCurrentMode('webgl');
    } else {
      setCurrentMode('canvas');
    }
  }, [renderMode, dataSize, isWebGLSupported]);

  // Color scale
  const colorScale = useMemo(() => {
    return d3.scaleSequential(d3.interpolateRgbBasis(colorRange))
      .domain([minValue, maxValue]);
  }, [colorRange, minValue, maxValue]);

  // Render color legend
  useEffect(() => {
    if (!showLegend || !legendRef.current) return;

    const legendWidth = 200;
    const legendHeight = 20;
    
    const svg = d3.select(legendRef.current);
    svg.selectAll("*").remove();
    
    // Create linear gradient
    const defs = svg.append("defs");
    const linearGradient = defs.append("linearGradient")
      .attr("id", "heatmap-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "100%")
      .attr("y2", "0%");
    
    // Add color stops
    colorRange.forEach((color, i) => {
      linearGradient.append("stop")
        .attr("offset", `${(i / (colorRange.length - 1)) * 100}%`)
        .attr("stop-color", color);
    });
    
    // Add gradient rectangle
    svg.append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#heatmap-gradient)");
    
    // Add tick marks
    const scale = d3.scaleLinear()
      .domain([minValue, maxValue])
      .range([0, legendWidth]);
    
    const axis = d3.axisBottom(scale)
      .ticks(5)
      .tickFormat(d => d.toFixed(1));
    
    svg.append("g")
      .attr("transform", `translate(0, ${legendHeight})`)
      .call(axis);
    
  }, [colorRange, minValue, maxValue, showLegend]);

  // Canvas rendering
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, width, height);
    
    if (!data || dataSize === 0) return;
    
    const startTime = performance.now();
    
    // Calculate cell dimensions
    let cols, rows;
    if (Array.isArray(data)) {
      // Simple 1D array case
      cols = Math.ceil(Math.sqrt(data.length));
      rows = Math.ceil(data.length / cols);
      
      const cellWidth = width / cols;
      const cellHeight = height / rows;
      
      // Draw cells
      data.forEach((value, i) => {
        const x = (i % cols) * cellWidth;
        const y = Math.floor(i / cols) * cellHeight;
        
        ctx.fillStyle = colorScale(value);
        ctx.fillRect(x, y, cellWidth, cellHeight);
      });
    } else {
      // Multiple agent data case
      const agents = Object.keys(data);
      rows = agents.length;
      
      const rowHeight = height / rows;
      
      agents.forEach((agent, rowIdx) => {
        const agentData = data[agent].data || data[agent];
        cols = Math.ceil(Math.sqrt(agentData.length));
        
        const cellWidth = width / cols;
        const cellHeight = rowHeight / Math.ceil(agentData.length / cols);
        
        // Draw agent label
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.fillText(agent, 5, rowIdx * rowHeight + 15);
        
        // Draw cells
        agentData.forEach((value, i) => {
          const x = (i % cols) * cellWidth;
          const y = rowIdx * rowHeight + Math.floor(i / cols) * cellHeight + 20; // Offset for label
          
          ctx.fillStyle = colorScale(value);
          ctx.fillRect(x, y, cellWidth, cellHeight);
        });
      });
    }
    
    // Calculate FPS
    const endTime = performance.now();
    const frameTime = endTime - startTime;
    if (frameTime > 0) {
      const newFps = Math.min(60, Math.round(1000 / frameTime));
      setFps(prevFps => 0.8 * prevFps + 0.2 * newFps); // Smooth FPS
    }
  };

  // WebGL rendering
  const renderWebGL = () => {
    const canvas = webglRef.current;
    if (!canvas) return;
    
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;
    
    if (!data || dataSize === 0) return;
    
    const startTime = performance.now();
    
    // Create shaders
    const vertexShaderSource = `
      attribute vec2 a_position;
      attribute float a_value;
      
      uniform vec2 u_resolution;
      
      varying float v_value;
      
      void main() {
        // Convert position from pixels to 0.0 to 1.0
        vec2 zeroToOne = a_position / u_resolution;
        
        // Convert from 0->1 to 0->2
        vec2 zeroToTwo = zeroToOne * 2.0;
        
        // Convert from 0->2 to -1->+1 (clipspace)
        vec2 clipSpace = zeroToTwo - 1.0;
        
        // Flip Y axis
        gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        
        // Pass value to fragment shader
        v_value = a_value;
      }
    `;
    
    const fragmentShaderSource = `
      precision mediump float;
      
      varying float v_value;
      
      uniform float u_minValue;
      uniform float u_maxValue;
      uniform vec3 u_colorStops[6];
      
      vec3 getColor(float value) {
        float normalized = (value - u_minValue) / (u_maxValue - u_minValue);
        normalized = clamp(normalized, 0.0, 1.0);
        
        // Interpolate between color stops
        float segment = normalized * 5.0; // We have 6 color stops, so 5 segments
        int index = int(segment);
        float t = segment - float(index);
        
        if (index >= 5) return u_colorStops[5];
        return mix(u_colorStops[index], u_colorStops[index + 1], t);
      }
      
      void main() {
        vec3 color = getColor(v_value);
        gl_FragColor = vec4(color, 1.0);
      }
    `;
    
    // Create and compile shaders
    function createShader(gl, type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      
      return shader;
    }
    
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    // Create program and link shaders
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program linking error:', gl.getProgramInfoLog(program));
      return;
    }
    
    // Set up buffers and attributes
    const positionBuffer = gl.createBuffer();
    const valueBuffer = gl.createBuffer();
    
    const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    const valueAttributeLocation = gl.getAttribLocation(program, 'a_value');
    
    // Set up uniforms
    const resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution');
    const minValueUniformLocation = gl.getUniformLocation(program, 'u_minValue');
    const maxValueUniformLocation = gl.getUniformLocation(program, 'u_maxValue');
    const colorStopsUniformLocation = gl.getUniformLocation(program, 'u_colorStops');
    
    // Clear canvas
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // Use the program
    gl.useProgram(program);
    
    // Set uniforms
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);
    gl.uniform1f(minValueUniformLocation, minValue);
    gl.uniform1f(maxValueUniformLocation, maxValue);
    
    // Convert color stops to RGB arrays
    const colorStops = colorRange.map(color => {
      const rgb = d3.rgb(color);
      return [rgb.r / 255, rgb.g / 255, rgb.b / 255];
    });
    
    // Flatten color stops for uniform
    const flatColorStops = colorStops.flat();
    gl.uniform3fv(colorStopsUniformLocation, flatColorStops);
    
    // Process data and draw
    if (Array.isArray(data)) {
      // Simple 1D array case
      const cols = Math.ceil(Math.sqrt(data.length));
      const rows = Math.ceil(data.length / cols);
      
      const cellWidth = width / cols;
      const cellHeight = height / rows;
      
      // Generate position and value data
      const positions = [];
      const values = [];
      
      data.forEach((value, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        
        const x = col * cellWidth;
        const y = row * cellHeight;
        
        // Add two triangles to form a quad
        // First triangle
        positions.push(
          x, y,
          x + cellWidth, y,
          x, y + cellHeight
        );
        values.push(value, value, value);
        
        // Second triangle
        positions.push(
          x + cellWidth, y,
          x + cellWidth, y + cellHeight,
          x, y + cellHeight
        );
        values.push(value, value, value);
      });
      
      // Bind position buffer
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(positionAttributeLocation);
      gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
      
      // Bind value buffer
      gl.bindBuffer(gl.ARRAY_BUFFER, valueBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(valueAttributeLocation);
      gl.vertexAttribPointer(valueAttributeLocation, 1, gl.FLOAT, false, 0, 0);
      
      // Draw
      gl.drawArrays(gl.TRIANGLES, 0, positions.length / 2);
    } else {
      // Multiple agent data - render in rows
      const agents = Object.keys(data);
      const rows = agents.length;
      const rowHeight = height / rows;
      
      // Generate all position and value data
      const positions = [];
      const values = [];
      
      agents.forEach((agent, rowIdx) => {
        const agentData = data[agent].data || data[agent];
        const cols = Math.ceil(Math.sqrt(agentData.length));
        
        const cellWidth = width / cols;
        const cellHeight = rowHeight / Math.ceil(agentData.length / cols);
        
        // Draw cells
        agentData.forEach((value, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          
          const x = col * cellWidth;
          const y = rowIdx * rowHeight + row * cellHeight + 20; // Offset for label
          
          // Add two triangles to form a quad
          // First triangle
          positions.push(
            x, y,
            x + cellWidth, y,
            x, y + cellHeight
          );
          values.push(value, value, value);
          
          // Second triangle
          positions.push(
            x + cellWidth, y,
            x + cellWidth, y + cellHeight,
            x, y + cellHeight
          );
          values.push(value, value, value);
        });
        
        // Add agent labels using canvas (WebGL doesn't handle text well)
        const ctx = canvasRef.current.getContext('2d');
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.fillText(agent, 5, rowIdx * rowHeight + 15);
      });
      
      // Bind position buffer
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(positionAttributeLocation);
      gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);
      
      // Bind value buffer
      gl.bindBuffer(gl.ARRAY_BUFFER, valueBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(valueAttributeLocation);
      gl.vertexAttribPointer(valueAttributeLocation, 1, gl.FLOAT, false, 0, 0);
      
      // Draw
      gl.drawArrays(gl.TRIANGLES, 0, positions.length / 2);
    }
    
    // Calculate FPS
    const endTime = performance.now();
    const frameTime = endTime - startTime;
    if (frameTime > 0) {
      const newFps = Math.min(60, Math.round(1000 / frameTime));
      setFps(prevFps => 0.8 * prevFps + 0.2 * newFps); // Smooth FPS
    }
  };

  // Render the appropriate mode
  useEffect(() => {
    if (currentMode === 'webgl' && isWebGLSupported) {
      renderWebGL();
    } else {
      renderCanvas();
    }
    
    // Set up animation frame for continuous updates if needed
    // const animationId = requestAnimationFrame(renderFrame);
    // return () => cancelAnimationFrame(animationId);
  }, [data, currentMode, width, height, colorRange, minValue, maxValue]);

  // Handle click events
  const handleClick = (e) => {
    if (!onCellClick) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate which cell was clicked
    if (Array.isArray(data)) {
      const cols = Math.ceil(Math.sqrt(data.length));
      const cellWidth = width / cols;
      const cellHeight = height / Math.ceil(data.length / cols);
      
      const col = Math.floor(x / cellWidth);
      const row = Math.floor(y / cellHeight);
      const index = row * cols + col;
      
      if (index >= 0 && index < data.length) {
        onCellClick(index, data[index]);
      }
    } else {
      // More complex for multi-agent data
      const agents = Object.keys(data);
      const rows = agents.length;
      const rowHeight = height / rows;
      
      const rowIdx = Math.floor(y / rowHeight);
      if (rowIdx >= 0 && rowIdx < agents.length) {
        const agent = agents[rowIdx];
        const agentData = data[agent].data || data[agent];
        const cols = Math.ceil(Math.sqrt(agentData.length));
        
        const cellWidth = width / cols;
        const cellHeight = rowHeight / Math.ceil(agentData.length / cols);
        
        const col = Math.floor(x / cellWidth);
        const row = Math.floor((y - rowIdx * rowHeight) / cellHeight);
        const index = row * cols + col;
        
        if (index >= 0 && index < agentData.length) {
          onCellClick(index, agentData[index], agent);
        }
      }
    }
  };

  return (
    <div className="phase-heatmap-container">
      <div className="phase-heatmap-header">
        <h3>{title}</h3>
        <div className="phase-heatmap-stats">
          <span>Mode: {currentMode}</span>
          <span>Points: {dataSize}</span>
          <span>FPS: {Math.round(fps)}</span>
        </div>
      </div>
      
      <div className="phase-heatmap-canvas-container">
        {/* Canvas for regular rendering */}
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{ display: currentMode === 'canvas' ? 'block' : 'none' }}
          onClick={handleClick}
        />
        
        {/* Canvas for WebGL rendering */}
        <canvas
          ref={webglRef}
          width={width}
          height={height}
          style={{ display: currentMode === 'webgl' ? 'block' : 'none' }}
          onClick={handleClick}
        />
      </div>
      
      {showLegend && (
        <div className="phase-heatmap-legend">
          <svg ref={legendRef} width="200" height="40" />
        </div>
      )}
    </div>
  );
};

PhaseHeatmap.propTypes = {
  data: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.number),
    PropTypes.object
  ]).isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
  colorRange: PropTypes.arrayOf(PropTypes.string),
  minValue: PropTypes.number,
  maxValue: PropTypes.number,
  cellSize: PropTypes.number,
  renderMode: PropTypes.oneOf(['auto', 'canvas', 'webgl']),
  title: PropTypes.string,
  showLegend: PropTypes.bool,
  onCellClick: PropTypes.func
};

export default PhaseHeatmap;
