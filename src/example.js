/**
 * Example usage of the enhanced audio system
 */

import { EnhancedAudioManager } from './core/EnhancedAudioManager.js';

// Create DOM elements for the demo
function createDemoUI() {
  const container = document.createElement('div');
  container.id = 'audio-system-demo';
  container.style.cssText = 'max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif;';
  
  // Add title
  const title = document.createElement('h1');
  title.textContent = 'Enhanced Audio System Demo';
  title.style.cssText = 'color: #333; text-align: center;';
  container.appendChild(title);
  
  // Create controls container
  const controls = document.createElement('div');
  controls.style.cssText = 'display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 20px;';
  container.appendChild(controls);
  
  // Create generator type selector
  const generatorGroup = document.createElement('div');
  generatorGroup.style.cssText = 'flex: 1; min-width: 200px;';
  
  const generatorLabel = document.createElement('label');
  generatorLabel.textContent = 'Generator Type:';
  generatorLabel.style.cssText = 'display: block; margin-bottom: 5px; font-weight: bold;';
  generatorGroup.appendChild(generatorLabel);
  
  const generatorSelect = document.createElement('select');
  generatorSelect.id = 'generator-type';
  generatorSelect.style.cssText = 'width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ccc;';
  ['binaural', 'solfeggio', 'monaural', 'isochronic', 'emdr', 'hrv', 'ambient'].forEach(type => {
    const option = document.createElement('option');
    option.value = type;
    option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    generatorSelect.appendChild(option);
  });
  generatorGroup.appendChild(generatorSelect);
  controls.appendChild(generatorGroup);
  
  // Create frequency controls
  const frequencyGroup = document.createElement('div');
  frequencyGroup.style.cssText = 'flex: 1; min-width: 200px;';
  
  const frequencyLabel = document.createElement('label');
  frequencyLabel.textContent = 'Frequency (Hz):';
  frequencyLabel.style.cssText = 'display: block; margin-bottom: 5px; font-weight: bold;';
  frequencyGroup.appendChild(frequencyLabel);
  
  const frequencyRange = document.createElement('input');
  frequencyRange.type = 'range';
  frequencyRange.id = 'frequency';
  frequencyRange.min = '0.5';
  frequencyRange.max = '40';
  frequencyRange.step = '0.5';
  frequencyRange.value = '10';
  frequencyRange.style.cssText = 'width: 100%;';
  frequencyGroup.appendChild(frequencyRange);
  
  const frequencyValue = document.createElement('span');
  frequencyValue.id = 'frequency-value';
  frequencyValue.textContent = '10 Hz';
  frequencyValue.style.cssText = 'display: block; text-align: center;';
  frequencyGroup.appendChild(frequencyValue);
  controls.appendChild(frequencyGroup);
  
  // Create volume control
  const volumeGroup = document.createElement('div');
  volumeGroup.style.cssText = 'flex: 1; min-width: 200px;';
  
  const volumeLabel = document.createElement('label');
  volumeLabel.textContent = 'Volume:';
  volumeLabel.style.cssText = 'display: block; margin-bottom: 5px; font-weight: bold;';
  volumeGroup.appendChild(volumeLabel);
  
  const volumeRange = document.createElement('input');
  volumeRange.type = 'range';
  volumeRange.id = 'volume';
  volumeRange.min = '0';
  volumeRange.max = '1';
  volumeRange.step = '0.01';
  volumeRange.value = '0.5';
  volumeRange.style.cssText = 'width: 100%;';
  volumeGroup.appendChild(volumeRange);
  
  const volumeValue = document.createElement('span');
  volumeValue.id = 'volume-value';
  volumeValue.textContent = '50%';
  volumeValue.style.cssText = 'display: block; text-align: center;';
  volumeGroup.appendChild(volumeValue);
  controls.appendChild(volumeGroup);
  
  // Create button group
  const buttonGroup = document.createElement('div');
  buttonGroup.style.cssText = 'display: flex; gap: 10px; margin-bottom: 20px;';
  
  const startButton = document.createElement('button');
  startButton.id = 'start-button';
  startButton.textContent = 'Start';
  startButton.style.cssText = 'flex: 1; padding: 10px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;';
  buttonGroup.appendChild(startButton);
  
  const stopButton = document.createElement('button');
  stopButton.id = 'stop-button';
  stopButton.textContent = 'Stop';
  stopButton.disabled = true;
  stopButton.style.cssText = 'flex: 1; padding: 10px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; opacity: 0.5;';
  buttonGroup.appendChild(stopButton);
  
  container.appendChild(buttonGroup);
  
  // Create effects section
  const effectsSection = document.createElement('div');
  effectsSection.style.cssText = 'margin-bottom: 20px;';
  
  const effectsTitle = document.createElement('h2');
  effectsTitle.textContent = 'Effects';
  effectsTitle.style.cssText = 'margin-bottom: 10px;';
  effectsSection.appendChild(effectsTitle);
  
  // Spatial effect controls
  const spatialGroup = document.createElement('div');
  spatialGroup.style.cssText = 'margin-bottom: 15px;';
  
  const spatialLabel = document.createElement('label');
  spatialLabel.htmlFor = 'spatial-enabled';
  spatialLabel.style.cssText = 'display: flex; align-items: center; margin-bottom: 10px;';
  
  const spatialCheckbox = document.createElement('input');
  spatialCheckbox.type = 'checkbox';
  spatialCheckbox.id = 'spatial-enabled';
  spatialCheckbox.style.cssText = 'margin-right: 10px;';
  spatialLabel.appendChild(spatialCheckbox);
  
  const spatialText = document.createElement('span');
  spatialText.textContent = 'Enable 3D Audio';
  spatialLabel.appendChild(spatialText);
  
  spatialGroup.appendChild(spatialLabel);
  
  const spatialControls = document.createElement('div');
  spatialControls.id = 'spatial-controls';
  spatialControls.style.cssText = 'display: flex; gap: 10px; flex-wrap: wrap;';
  
  ['x', 'y', 'z'].forEach(axis => {
    const axisGroup = document.createElement('div');
    axisGroup.style.cssText = 'flex: 1; min-width: 100px;';
    
    const axisLabel = document.createElement('label');
    axisLabel.textContent = `${axis.toUpperCase()} Position:`;
    axisLabel.style.cssText = 'display: block; margin-bottom: 5px;';
    axisGroup.appendChild(axisLabel);
    
    const axisRange = document.createElement('input');
    axisRange.type = 'range';
    axisRange.id = `spatial-${axis}`;
    axisRange.min = '-5';
    axisRange.max = '5';
    axisRange.step = '0.1';
    axisRange.value = '0';
    axisRange.disabled = true;
    axisRange.style.cssText = 'width: 100%;';
    axisGroup.appendChild(axisRange);
    
    spatialControls.appendChild(axisGroup);
  });
  
  spatialGroup.appendChild(spatialControls);
  effectsSection.appendChild(spatialGroup);
  
  // Filter effect controls
  const filterGroup = document.createElement('div');
  filterGroup.style.cssText = 'margin-bottom: 15px;';
  
  const filterLabel = document.createElement('label');
  filterLabel.htmlFor = 'filter-enabled';
  filterLabel.style.cssText = 'display: flex; align-items: center; margin-bottom: 10px;';
  
  const filterCheckbox = document.createElement('input');
  filterCheckbox.type = 'checkbox';
  filterCheckbox.id = 'filter-enabled';
  filterCheckbox.style.cssText = 'margin-right: 10px;';
  filterLabel.appendChild(filterCheckbox);
  
  const filterText = document.createElement('span');
  filterText.textContent = 'Enable Filter';
  filterLabel.appendChild(filterText);
  
  filterGroup.appendChild(filterLabel);
  
  const filterControls = document.createElement('div');
  filterControls.id = 'filter-controls';
  filterControls.style.cssText = 'display: flex; gap: 10px; flex-wrap: wrap;';
  
  const filterTypeGroup = document.createElement('div');
  filterTypeGroup.style.cssText = 'flex: 1; min-width: 150px;';
  
  const filterTypeLabel = document.createElement('label');
  filterTypeLabel.textContent = 'Filter Type:';
  filterTypeLabel.style.cssText = 'display: block; margin-bottom: 5px;';
  filterTypeGroup.appendChild(filterTypeLabel);
  
  const filterTypeSelect = document.createElement('select');
  filterTypeSelect.id = 'filter-type';
  filterTypeSelect.disabled = true;
  filterTypeSelect.style.cssText = 'width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #ccc;';
  ['lowpass', 'highpass', 'bandpass', 'notch'].forEach(type => {
    const option = document.createElement('option');
    option.value = type;
    option.textContent = type.charAt(0).toUpperCase() + type.slice(1);
    filterTypeSelect.appendChild(option);
  });
  filterTypeGroup.appendChild(filterTypeSelect);
  filterControls.appendChild(filterTypeGroup);
  
  const filterFreqGroup = document.createElement('div');
  filterFreqGroup.style.cssText = 'flex: 1; min-width: 150px;';
  
  const filterFreqLabel = document.createElement('label');
  filterFreqLabel.textContent = 'Frequency (Hz):';
  filterFreqLabel.style.cssText = 'display: block; margin-bottom: 5px;';
  filterFreqGroup.appendChild(filterFreqLabel);
  
  const filterFreqRange = document.createElement('input');
  filterFreqRange.type = 'range';
  filterFreqRange.id = 'filter-frequency';
  filterFreqRange.min = '20';
  filterFreqRange.max = '20000';
  filterFreqRange.step = '1';
  filterFreqRange.value = '1000';
  filterFreqRange.disabled = true;
  filterFreqRange.style.cssText = 'width: 100%;';
  filterFreqGroup.appendChild(filterFreqRange);
  
  const filterFreqValue = document.createElement('span');
  filterFreqValue.id = 'filter-frequency-value';
  filterFreqValue.textContent = '1000 Hz';
  filterFreqValue.style.cssText = 'display: block; text-align: center;';
  filterFreqGroup.appendChild(filterFreqValue);
  
  filterControls.appendChild(filterFreqGroup);
  
  filterGroup.appendChild(filterControls);
  effectsSection.appendChild(filterGroup);
  
  container.appendChild(effectsSection);
  
  // Create canvas for visualization
  const visualizerContainer = document.createElement('div');
  visualizerContainer.style.cssText = 'width: 100%; height: 300px; background: #f0f0f0; border-radius: 4px; overflow: hidden;';
  
  const canvas = document.createElement('canvas');
  canvas.id = 'visualizer';
  canvas.width = 800;
  canvas.height = 300;
  canvas.style.cssText = 'width: 100%; height: 100%;';
  visualizerContainer.appendChild(canvas);
  
  container.appendChild(visualizerContainer);
  
  // System status section
  const statusSection = document.createElement('div');
  statusSection.style.cssText = 'margin-top: 20px;';
  
  const statusTitle = document.createElement('h2');
  statusTitle.textContent = 'System Status';
  statusSection.appendChild(statusTitle);
  
  const statusDisplay = document.createElement('pre');
  statusDisplay.id = 'system-status';
  statusDisplay.style.cssText = 'background: #f5f5f5; padding: 10px; border-radius: 4px; overflow: auto; font-size: 12px;';
  statusSection.appendChild(statusDisplay);
  
  container.appendChild(statusSection);
  
  // Add to document
  document.body.appendChild(container);
}

// Main demo function
async function runDemo() {
  // Create UI
  createDemoUI();
  
  // Initialize audio manager
  const audioManager = new EnhancedAudioManager({
    useWorkers: true,
    autoStartOnUserGesture: true
  });
  
  let session = null;
  let cancelAnalysis = null;
  
  // Get DOM elements
  const startButton = document.getElementById('start-button');
  const stopButton = document.getElementById('stop-button');
  const generatorSelect = document.getElementById('generator-type');
  const frequencyRange = document.getElementById('frequency');
  const frequencyValue = document.getElementById('frequency-value');
  const volumeRange = document.getElementById('volume');
  const volumeValue = document.getElementById('volume-value');
  const spatialCheckbox = document.getElementById('spatial-enabled');
  const spatialXRange = document.getElementById('spatial-x');
  const spatialYRange = document.getElementById('spatial-y');
  const spatialZRange = document.getElementById('spatial-z');
  const filterCheckbox = document.getElementById('filter-enabled');
  const filterTypeSelect = document.getElementById('filter-type');
  const filterFreqRange = document.getElementById('filter-frequency');
  const filterFreqValue = document.getElementById('filter-frequency-value');
  const statusDisplay = document.getElementById('system-status');
  const canvas = document.getElementById('visualizer');
  
  // Set up canvas context for visualizer
  const canvasCtx = canvas.getContext('2d');
  
  // Update frequency value display
  frequencyRange.addEventListener('input', () => {
    const value = parseFloat(frequencyRange.value);
    frequencyValue.textContent = `${value} Hz`;
  });
  
  // Update volume value display
  volumeRange.addEventListener('input', () => {
    const value = parseFloat(volumeRange.value);
    volumeValue.textContent = `${Math.round(value * 100)}%`;
    
    if (audioManager) {
      audioManager.setMasterVolume(value);
    }
  });
  
  // Update filter frequency value display
  filterFreqRange.addEventListener('input', () => {
    const value = parseInt(filterFreqRange.value);
    filterFreqValue.textContent = `${value} Hz`;
  });
  
  // Toggle spatial controls
  spatialCheckbox.addEventListener('change', () => {
    const enabled = spatialCheckbox.checked;
    spatialXRange.disabled = !enabled;
    spatialYRange.disabled = !enabled;
    spatialZRange.disabled = !enabled;
  });
  
  // Toggle filter controls
  filterCheckbox.addEventListener('change', () => {
    const enabled = filterCheckbox.checked;
    filterTypeSelect.disabled = !enabled;
    filterFreqRange.disabled = !enabled;
  });
  
  // Update status display
  function updateStatus() {
    if (audioManager) {
      const status = audioManager.getSystemStatus();
      statusDisplay.textContent = JSON.stringify(status, null, 2);
    }
  }
  
  // Draw visualization
  function drawVisualization(audioData) {
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    canvasCtx.fillStyle = 'rgb(0, 0, 0)';
    canvasCtx.fillRect(0, 0, width, height);
    
    // Draw frequency data
    const frequencyData = audioData.frequencyData;
    if (frequencyData) {
      const barWidth = (width / frequencyData.length) * 2.5;
      let x = 0;
      
      canvasCtx.fillStyle = 'rgb(50, 50, 200)';
      
      for (let i = 0; i < frequencyData.length; i++) {
        const barHeight = (frequencyData[i] / 255) * height;
        canvasCtx.fillRect(x, height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    }
    
    // Draw energy bands
    const energyBands = audioData.energyByBands;
    if (energyBands) {
      const bandWidth = width / energyBands.length;
      let x = 0;
      
      canvasCtx.fillStyle = 'rgb(200, 50, 50)';
      
      for (let i = 0; i < energyBands.length; i++) {
        const bandHeight = energyBands[i] * height;
        canvasCtx.fillRect(x, height - bandHeight, bandWidth - 2, bandHeight);
        x += bandWidth;
      }
    }
    
    // Show dominant frequency
    if (audioData.dominantFrequency) {
      canvasCtx.fillStyle = 'rgb(255, 255, 255)';
      canvasCtx.font = '14px Arial';
      canvasCtx.fillText(`Dominant Frequency: ${audioData.dominantFrequency.toFixed(1)} Hz`, 10, 20);
    }
    
    // Show RMS level
    if (audioData.rms !== undefined) {
      canvasCtx.fillStyle = 'rgb(255, 255, 255)';
      canvasCtx.font = '14px Arial';
      canvasCtx.fillText(`RMS Level: ${audioData.rms.toFixed(3)}`, 10, 40);
      
      // Draw RMS meter
      const meterWidth = 100;
      const meterHeight = 10;
      canvasCtx.fillStyle = 'rgb(100, 100, 100)';
      canvasCtx.fillRect(10, 50, meterWidth, meterHeight);
      canvasCtx.fillStyle = 'rgb(0, 255, 0)';
      canvasCtx.fillRect(10, 50, meterWidth * audioData.rms, meterHeight);
    }
  }
  
  // Start button handler
  startButton.addEventListener('click', async () => {
    try {
      if (!audioManager.initialized) {
        await audioManager.initialize();
      }
      
      const generatorType = generatorSelect.value;
      const frequency = parseFloat(frequencyRange.value);
      const volume = parseFloat(volumeRange.value);
      
      // Create session config
      const config = {};
      
      // Configure generator based on type
      switch (generatorType) {
        case 'binaural':
          config.binaural = {
            carrierFrequency: 200,
            beatFrequency: frequency,
            amplitude: 0.7,
            waveform: 'sine'
          };
          break;
          
        case 'solfeggio':
          // Use closest Solfeggio frequency or default to 528 Hz (MI)
          config.solfeggio = {
            frequency: 528,
            amplitude: 0.7,
            harmonics: [1, 0.5, 0.25]
          };
          break;
          
        case 'monaural':
          config.monaural = {
            carrierFrequency: 200,
            beatFrequency: frequency,
            amplitude: 0.7
          };
          break;
          
        case 'isochronic':
          config.isochronic = {
            frequency: 200,
            rate: frequency,
            amplitude: 0.7
          };
          break;
          
        case 'emdr':
          config.emdr = {
            frequency: frequency,
            amplitude: 0.7,
            panRange: 0.9
          };
          break;
          
        case 'hrv':
          config.hrv = {
            breathsPerMinute: frequency < 1 ? 1 : (frequency > 20 ? 20 : frequency),
            amplitude: 0.7
          };
          break;
          
        case 'ambient':
          config.ambient = {
            type: 'ocean',
            amplitude: 0.7
          };
          break;
      }
      
      // Add effects if enabled
      config.effects = {};
      
      if (spatialCheckbox.checked) {
        config.effects.spatial = {
          x: parseFloat(spatialXRange.value),
          y: parseFloat(spatialYRange.value),
          z: parseFloat(spatialZRange.value)
        };
      }
      
      if (filterCheckbox.checked) {
        config.effects.filter = {
          type: filterTypeSelect.value,
          frequency: parseInt(filterFreqRange.value),
          Q: 1
        };
      }
      
      // Create therapeutic session
      session = await audioManager.createTherapeuticSession(config);
      
      // Set master volume
      audioManager.setMasterVolume(volume);
      
      // Start session
      await session.start();
      
      // Setup visualization
      if (cancelAnalysis) {
        cancelAnalysis();
      }
      
      cancelAnalysis = session.onAudioData((data) => {
        drawVisualization(data);
        updateStatus();
      });
      
      // Update UI
      startButton.disabled = true;
      stopButton.disabled = false;
      stopButton.style.opacity = '1';
      
    } catch (error) {
      console.error('Error starting session:', error);
      alert(`Error starting audio: ${error.message}`);
    }
  });
  
  // Stop button handler
  stopButton.addEventListener('click', async () => {
    try {
      if (session) {
        await session.stop();
        
        if (cancelAnalysis) {
          cancelAnalysis();
          cancelAnalysis = null;
        }
        
        session = null;
      }
      
      // Update UI
      startButton.disabled = false;
      stopButton.disabled = true;
      stopButton.style.opacity = '0.5';
      
      // Clear canvas
      canvasCtx.fillStyle = 'rgb(240, 240, 240)';
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
      
      updateStatus();
      
    } catch (error) {
      console.error('Error stopping session:', error);
    }
  });
  
  // Initial status update
  updateStatus();
  
  // Periodically update status
  setInterval(updateStatus, 1000);
}

// Run the demo when the page loads
window.addEventListener('load', runDemo); 