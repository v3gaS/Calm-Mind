// AudioBuffer (supports positional args and options object used by BufferPool)
global.AudioBuffer = class AudioBuffer {
  constructor(a, b, c) {
    if (typeof a === 'object' && a !== null && !Array.isArray(a)) {
      this.numberOfChannels = a.numberOfChannels;
      this.length = a.length;
      this.sampleRate = a.sampleRate;
    } else {
      this.numberOfChannels = a;
      this.length = b;
      this.sampleRate = c;
    }
    this.duration = this.length / this.sampleRate;
  }
  getChannelData() {
    return new Float32Array(this.length);
  }
};

// Mock Web Audio API
class AudioContext {
  constructor() {
    this.destination = {};
    this.sampleRate = 44100;
    this.currentTime = 0;
    this.state = 'running';
  }
  close() {
    return Promise.resolve();
  }
  createOscillator() {
    return {
      connect: jest.fn().mockReturnThis(),
      disconnect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      frequency: { value: 0 },
    };
  }
  createGain() {
    return {
      connect: jest.fn().mockReturnThis(),
      disconnect: jest.fn(),
      gain: { value: 0 },
    };
  }
  createStereoPanner() {
    return {
      connect: jest.fn().mockReturnThis(),
      disconnect: jest.fn(),
      pan: { value: 0 },
    };
  }
  createAnalyser() {
    return {
      connect: jest.fn().mockReturnThis(),
      disconnect: jest.fn(),
      fftSize: 512,
      frequencyBinCount: 256,
      getByteFrequencyData: jest.fn(),
    };
  }
  createBuffer(numberOfChannels, length, sampleRate) {
    return new global.AudioBuffer(numberOfChannels, length, sampleRate);
  }
  resume() {
    return Promise.resolve();
  }
  suspend() {
    return Promise.resolve();
  }
}

global.AudioContext = AudioContext;
global.webkitAudioContext = AudioContext;

global.requestAnimationFrame = (callback) => setTimeout(callback, 0);
global.cancelAnimationFrame = (id) => clearTimeout(id);

global.performance = {
  now: () => Date.now(),
};

jest.setTimeout(10000);

afterEach(() => {
  jest.clearAllMocks();
});

class MockWebGLRenderingContext {
  constructor() {
    this.canvas = document.createElement('canvas');
  }

  getContext() {
    return {
      clearColor: jest.fn(),
      clear: jest.fn(),
      createBuffer: jest.fn().mockReturnValue({}),
      bindBuffer: jest.fn(),
      bufferData: jest.fn(),
      createShader: jest.fn().mockReturnValue({}),
      shaderSource: jest.fn(),
      compileShader: jest.fn(),
      createProgram: jest.fn().mockReturnValue({}),
      attachShader: jest.fn(),
      linkProgram: jest.fn(),
      useProgram: jest.fn(),
      getAttribLocation: jest.fn().mockReturnValue(0),
      enableVertexAttribArray: jest.fn(),
      vertexAttribPointer: jest.fn(),
      drawArrays: jest.fn(),
      viewport: jest.fn(),
    };
  }
}

global.WebGLRenderingContext = MockWebGLRenderingContext;
global.WebGL2RenderingContext = MockWebGLRenderingContext;

HTMLCanvasElement.prototype.getContext = jest.fn().mockImplementation(() => {
  return new MockWebGLRenderingContext().getContext();
});
