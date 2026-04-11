// Multi-System Emulator - Core Logic

class EmulatorManager {
    constructor(canvas, ctx, status, debug) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.status = status;
        this.debug = debug;
        this.currentSystem = 'nes';
        this.nes = null;
        this.running = false;
        this.rafId = null;
        this.pressedKeys = new Set();
        this.emulatorInstance = null;
    }

    log(msg) {
        console.log(msg);
        this.debug.textContent = msg;
    }

    initCanvas(system) {
        if (system === 'nes') {
            this.canvas.width = 256;
            this.canvas.height = 240;
            this.canvas.className = '';
        } else if (system === 'gba') {
            this.canvas.width = 240;
            this.canvas.height = 160;
            this.canvas.className = 'gba';
        }
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.log(`Canvas initialized: ${this.canvas.width}x${this.canvas.height} (${system.toUpperCase()})`);
    }

    createNESEmulator() {
        this.log('Creating NES emulator instance...');
        
        const imageData = this.ctx.createImageData(256, 240);
        let frameCount = 0;
        
        return new jsnes.NES({
            onFrame: (buffer) => {
                frameCount++;
                
                if (!buffer) {
                    this.log('ERROR: No buffer received');
                    return;
                }
                
                const pixelCount = 256 * 240;
                const data = imageData.data;
                
                // Detect buffer format on first frame
                if (frameCount === 1) {
                    this.log(`Buffer length: ${buffer.length}, expected: ${pixelCount}`);
                }
                
                // jsNES 1.2.1 uses 32-bit RGB integers (0x00RRGGBB format)
                if (buffer.length === pixelCount) {
                    // Each element is a 32-bit integer containing RGB values
                    for (let i = 0; i < pixelCount; i++) {
                        const color = buffer[i];
                        const dstIdx = i * 4;
                        data[dstIdx] = (color >> 16) & 0xFF;     // Red
                        data[dstIdx + 1] = (color >> 8) & 0xFF;   // Green
                        data[dstIdx + 2] = color & 0xFF;          // Blue
                        data[dstIdx + 3] = 255;                    // Alpha
                    }
                    
                    if (frameCount === 1) {
                        this.log('Using 32-bit RGB integer format');
                    }
                } else if (buffer.length === pixelCount * 3) {
                    // RGB format (3 bytes per pixel)
                    for (let i = 0; i < pixelCount; i++) {
                        const srcIdx = i * 3;
                        const dstIdx = i * 4;
                        data[dstIdx] = buffer[srcIdx];
                        data[dstIdx + 1] = buffer[srcIdx + 1];
                        data[dstIdx + 2] = buffer[srcIdx + 2];
                        data[dstIdx + 3] = 255;
                    }
                    if (frameCount === 1) this.log('Using RGB byte array format');
                } else {
                    this.log(`ERROR: Unexpected buffer size: ${buffer.length}`);
                    return;
                }
                
                // Draw to canvas
                this.ctx.putImageData(imageData, 0, 0);
                
                if (frameCount === 1) {
                    this.log('First frame rendered successfully!');
                }
            },
            onAudioSample: () => {}
        });
    }

    async loadNES(file) {
        if (typeof jsnes === 'undefined') {
            throw new Error('NES emulator library not loaded');
        }

        const buffer = await file.arrayBuffer();
        this.log(`ROM file size: ${buffer.byteLength} bytes`);
        
        const data = new Uint8Array(buffer);
        
        // Check NES header
        if (data.length < 16) {
            throw new Error('File too small');
        }
        
        const header = String.fromCharCode(data[0], data[1], data[2]);
        if (header !== 'NES' || data[3] !== 0x1A) {
            throw new Error('Invalid NES ROM header');
        }
        
        this.log('Valid NES ROM detected');
        
        // Convert to binary string
        let romString = '';
        const chunkSize = 8192;
        for (let i = 0; i < data.length; i += chunkSize) {
            const chunk = data.slice(i, Math.min(i + chunkSize, data.length));
            romString += String.fromCharCode.apply(null, chunk);
        }
        
        // Create emulator
        this.nes = this.createNESEmulator();
        
        // Load ROM
        this.log('Loading ROM into emulator...');
        this.nes.loadROM(romString);
        this.log('ROM loaded successfully!');
        
        // Start game loop
        this.running = true;
        this.status.textContent = `Playing: ${file.name}`;
        
        const gameLoop = () => {
            if (!this.running || !this.nes) return;
            this.nes.frame();
            this.rafId = requestAnimationFrame(gameLoop);
        };
        
        this.rafId = requestAnimationFrame(gameLoop);
        this.log('Game loop started');
    }

    async loadGBA(file) {
        this.log('Loading GBA ROM with WebAssembly emulator...');
        this.status.textContent = 'Loading GBA emulator (WASM)...';
        
        // Show canvas for GBA
        this.canvas.style.display = 'block';
        const gameContainer = document.getElementById('game-container');
        gameContainer.style.display = 'none';
        gameContainer.innerHTML = '';
        
        // Initialize canvas for GBA
        this.initCanvas('gba');
        
        // Read ROM file
        const buffer = await file.arrayBuffer();
        this.log(`ROM size: ${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB`);
        
        try {
            await this.loadGBAWithWASM(file, buffer);
        } catch (err) {
            this.log('ERROR: ' + err.message);
            this.status.textContent = 'Error loading GBA emulator: ' + err.message;
            console.error(err);
        }
    }
    
    async loadGBAWithWASM(file, buffer) {
        this.log('Initializing WebAssembly GBA emulator (mGBA C core)...');
        
        // Check if WASM module is already loaded
        if (!window.GBAWASM) {
            await this.loadGBAWASMModule();
        }
        
        if (!window.GBAWASM || !window.GBAWASM.core) {
            throw new Error('Failed to load GBA WebAssembly module');
        }
        
        const core = window.GBAWASM.core;
        this.log('WebAssembly module ready');
        
        // Create emulator instance
        this.gbaWasm = {
            core: core,
            romData: new Uint8Array(buffer),
            imageData: this.ctx.createImageData(240, 160)
        };
        
        // Load ROM
        this.log('Loading ROM into emulator...');
        try {
            await core.loadROM(this.gbaWasm.romData);
            this.log('ROM loaded successfully!');
        } catch (err) {
            throw new Error('Failed to load ROM: ' + err.message);
        }
        
        // Set up frame callback
        core.setFrameCallback((frameData) => {
            if (!this.running || !this.gbaWasm) return;
            
            // frameData is Uint8Array in RGBA format (240 * 160 * 4)
            const imageData = this.gbaWasm.imageData;
            imageData.data.set(frameData);
            this.ctx.putImageData(imageData, 0, 0);
        });
        
        // Start emulator
        core.start();
        this.log('GBA emulator started');
        
        // Start game loop
        this.running = true;
                this.status.textContent = `Playing: ${file.name}`;
        
        const gameLoop = () => {
            if (!this.running || !this.gbaWasm) return;
            
            // Run one frame (60 FPS)
            core.runFrame();
            
            this.rafId = requestAnimationFrame(gameLoop);
        };
        
        this.rafId = requestAnimationFrame(gameLoop);
        this.log('GBA game loop started');
    }
    
    async loadGBAWASMModule() {
        return new Promise((resolve, reject) => {
            if (window.GBAWASM && window.GBAWASM.core) {
                resolve();
                return;
            }
            
            this.log('Loading GBA WebAssembly module...');
            this.status.textContent = 'Downloading emulator (WASM)...';
            
            // Try multiple WASM sources
            const wasmSources = [
                {
                    name: 'gbajs3',
                    wasm: 'https://unpkg.com/@thenick775/gbajs3@latest/dist/mgba.wasm',
                    js: 'https://unpkg.com/@thenick775/gbajs3@latest/dist/mgba.js'
                },
                {
                    name: 'jsdelivr gbajs3',
                    wasm: 'https://cdn.jsdelivr.net/npm/@thenick775/gbajs3@latest/dist/mgba.wasm',
                    js: 'https://cdn.jsdelivr.net/npm/@thenick775/gbajs3@latest/dist/mgba.js'
                }
            ];
            
            // First, try to load from local files if they exist
            const tryLocalWASM = () => {
                return new Promise((localResolve) => {
                    fetch('./mgba.wasm', { method: 'HEAD' })
                        .then((wasmResponse) => {
                            if (wasmResponse.ok) {
                                return fetch('./mgba.js', { method: 'HEAD' });
                            }
                            throw new Error('Local WASM not found');
                        })
                        .then((jsResponse) => {
                            if (jsResponse.ok) {
                                this.log('Found local WASM files, loading...');
                                const script = document.createElement('script');
                                script.src = './mgba.js';
                                
                                script.onload = () => {
                                    if (window.Module) {
                                        window.Module = window.Module || {};
                                        window.Module.locateFile = (path) => {
                                            if (path.endsWith('.wasm')) {
                                                return './mgba.wasm';
                                            }
                                            return path;
                                        };
                                        
                                        const checkReady = () => {
                                            if (window.Module.HEAPU8) {
                                                const core = this.createGBACoreAPI(window.Module);
                                                window.GBAWASM = { core, Module: window.Module };
                                                this.log('✓ Local GBA WebAssembly module loaded');
                                                resolve();
                                                localResolve(true);
                                            } else if (window.Module.onRuntimeInitialized) {
                                                const originalCallback = window.Module.onRuntimeInitialized;
                                                window.Module.onRuntimeInitialized = () => {
                                                    if (originalCallback) originalCallback();
                                                    const core = this.createGBACoreAPI(window.Module);
                                                    window.GBAWASM = { core, Module: window.Module };
                                                    this.log('✓ Local GBA WebAssembly module loaded');
                                                    resolve();
                                                    localResolve(true);
                                                };
                                            } else {
                                                setTimeout(checkReady, 100);
                                            }
                                        };
                                        
                                        checkReady();
                                    } else {
                                        localResolve(false);
                                    }
                                };
                                
                                script.onerror = () => {
                                    localResolve(false);
                                };
                                
                                document.head.appendChild(script);
                            } else {
                                localResolve(false);
                            }
                        })
                        .catch(() => {
                            localResolve(false);
                        });
                });
            };
            
            const tryLoadSource = (sourceIndex) => {
                if (sourceIndex >= wasmSources.length) {
                    // All CDN sources failed, try using a JavaScript-based emulator
                    // that can be easily replaced with WASM
                    this.log('All WASM sources failed. Using JavaScript emulator as fallback.');
                    this.log('To use WASM: Place compiled mgba.wasm and mgba.js files in the project directory.');
                    this.loadGBAJavaScriptFallback().then(resolve).catch(reject);
                    return;
                }
                
                const source = wasmSources[sourceIndex];
                this.log(`Trying WASM source: ${source.name}...`);
                
                const script = document.createElement('script');
                script.src = source.js;
                
                script.onload = () => {
                    this.log(`WASM script loaded from ${source.name}, initializing...`);
                    
                    // Check for different module patterns
                    let moduleReady = false;
                    
                    // Pattern 1: Emscripten Module factory
                    if (typeof createModule !== 'undefined') {
                        createModule({
                            locateFile: (path) => {
                                if (path.endsWith('.wasm')) {
                                    return source.wasm;
                                }
                                return path;
                            },
                            onRuntimeInitialized: () => {
                                if (moduleReady) return;
                                moduleReady = true;
                                
                                const Module = window.Module;
                                if (Module) {
                                    const core = this.createGBACoreAPI(Module);
                                    window.GBAWASM = { core, Module };
                                    this.log('✓ GBA WebAssembly module ready (C-based mGBA core)');
                                    resolve();
                                } else {
                                    tryLoadSource(sourceIndex + 1);
                                }
                            }
                        });
                        return;
                    }
                    
                    // Pattern 2: Direct Module object
                    if (typeof Module !== 'undefined') {
                        const moduleConfig = {
                            locateFile: (path) => {
                                if (path.endsWith('.wasm')) {
                                    return source.wasm;
                                }
                                return path;
                            },
                            onRuntimeInitialized: () => {
                                if (moduleReady) return;
                                moduleReady = true;
                                
                                const Module = window.Module;
                                if (Module && Module.HEAPU8) {
                                    const core = this.createGBACoreAPI(Module);
                                    window.GBAWASM = { core, Module };
                                    this.log('✓ GBA WebAssembly module ready (C-based mGBA core)');
                                    resolve();
                                } else {
                                    tryLoadSource(sourceIndex + 1);
                                }
                            }
                        };
                        
                        // If Module is a function, call it
                        if (typeof Module === 'function') {
                            window.Module = Module(moduleConfig);
                        } else {
                            Object.assign(Module, moduleConfig);
                            if (Module.ready) {
                                moduleConfig.onRuntimeInitialized();
                            }
                        }
                        return;
                    }
                    
                    // Pattern 3: Check if module auto-initialized
                    setTimeout(() => {
                        if (window.Module && window.Module.HEAPU8 && !moduleReady) {
                            moduleReady = true;
                            const core = this.createGBACoreAPI(window.Module);
                            window.GBAWASM = { core, Module: window.Module };
                            this.log('✓ GBA WebAssembly module ready (auto-detected)');
                            resolve();
                        } else if (!moduleReady) {
                            tryLoadSource(sourceIndex + 1);
                        }
                    }, 2000);
                };
                
                script.onerror = () => {
                    this.log(`Failed to load from ${source.name}, trying next source...`);
                    tryLoadSource(sourceIndex + 1);
                };
                
                document.head.appendChild(script);
            };
            
            // Try local first, then CDN sources
            tryLocalWASM().then((loaded) => {
                if (!loaded) {
                    tryLoadSource(0);
                }
            });
        });
    }
    
    async loadGBAJavaScriptFallback() {
        // Use a JavaScript-based GBA emulator as fallback
        // This can be easily replaced with WASM when available
        this.log('Loading JavaScript-based GBA emulator...');
        
        // Check if running from file:// protocol
        if (window.location.protocol === 'file:') {
            const errorMsg = 'Cannot load emulator from file:// protocol due to CORS restrictions.\n\n' +
                'Please use a web server:\n' +
                '1. Open terminal in this directory\n' +
                '2. Run: python -m http.server 8000\n' +
                '3. Open: http://localhost:8000 in your browser';
            this.log('⚠ ERROR: ' + errorMsg);
            this.status.textContent = 'ERROR: Please use a web server (see console for instructions)';
            return Promise.reject(new Error(errorMsg));
        }
        
        return new Promise((resolve, reject) => {
            // Try multiple CDN sources - using different libraries
            const cdnSources = [
                // Try gbajs3 which includes mGBA WASM
                {
                    url: 'https://unpkg.com/@thenick775/gbajs3@latest/dist/gbajs3.js',
                    type: 'gbajs3'
                },
                // Try VBA.js - another GBA emulator
                {
                    url: 'https://cdn.jsdelivr.net/gh/taisel/VBA.js@master/build/vba.js',
                    type: 'vba'
                },
                // Try gameboy-advance from different sources
                {
                    url: 'https://unpkg.com/gameboy-advance@0.2.0/dist/GameBoyAdvance.js',
                    type: 'gba'
                },
                {
                    url: 'https://cdn.jsdelivr.net/npm/gameboy-advance@0.2.0/dist/GameBoyAdvance.js',
                    type: 'gba'
                }
            ];
            
            let currentSource = 0;
            
            const tryLoadSource = (sourceIndex) => {
                if (sourceIndex >= cdnSources.length) {
                    // All sources failed - create a minimal placeholder
                    this.log('All CDN sources failed. Creating minimal GBA emulator placeholder...');
                    this.createMinimalGBAPlaceholder().then(resolve).catch(() => {
                        const errorMsg = 'Failed to load GBA emulator from all CDN sources. ' +
                            'Please check your internet connection or compile mGBA to WASM locally.';
                        reject(new Error(errorMsg));
                    });
                    return;
                }
                
                const source = cdnSources[sourceIndex];
                this.log(`Trying CDN source ${sourceIndex + 1}/${cdnSources.length} (${source.type})...`);
                const script = document.createElement('script');
                script.src = source.url;
                
                script.onload = () => {
                    // Check which library loaded
                    if (source.type === 'gbajs3' && typeof gbajs3 !== 'undefined') {
                        this.setupGBajs3().then(resolve).catch(() => tryLoadSource(sourceIndex + 1));
                        return;
                    }
                    
                    if (source.type === 'vba' && typeof VBA !== 'undefined') {
                        this.setupVBA().then(resolve).catch(() => tryLoadSource(sourceIndex + 1));
                        return;
                    }
                    
                    if (source.type === 'gba' && typeof GameBoyAdvance !== 'undefined') {
                        this.setupGameBoyAdvance().then(resolve).catch(() => tryLoadSource(sourceIndex + 1));
                        return;
                    }
                    
                    // Try next source
                    tryLoadSource(sourceIndex + 1);
                };
                
                script.onerror = () => {
                    // Try next source
                    tryLoadSource(sourceIndex + 1);
                };
                
                document.head.appendChild(script);
            };
            
            tryLoadSource(0);
        });
    }
    
    async setupGameBoyAdvance() {
        return new Promise((resolve) => {
            const core = {
                gba: null,
                frameCallback: null,
                imageData: this.ctx.createImageData(240, 160),
                
                loadROM: async (romData) => {
                    return new Promise((resolveLoad, rejectLoad) => {
                        const gba = new GameBoyAdvance();
                        
                        gba.onFrameFinished = () => {
                            if (this.gbaWasm && this.gbaWasm.core && this.gbaWasm.core.frameCallback) {
                                const canvas = gba.getDisplay();
                                if (canvas) {
                                    const ctx = canvas.getContext('2d');
                                    const frameData = ctx.getImageData(0, 0, 240, 160);
                                    this.gbaWasm.core.frameCallback(frameData.data);
                                }
                            }
                        };
                        
                        gba.loadROM(new Uint8Array(romData), () => {
                            core.gba = gba;
                            resolveLoad();
                        }, (err) => {
                            rejectLoad(new Error('Failed to load ROM: ' + err));
                        });
                    });
                },
                
                setFrameCallback: (callback) => {
                    this.gbaWasm = this.gbaWasm || {};
                    this.gbaWasm.core = this.gbaWasm.core || core;
                    core.frameCallback = callback;
                },
                
                start: () => {
                    if (core.gba) {
                        core.gba.play();
                    }
                },
                
                runFrame: () => {
                    if (core.gba) {
                        core.gba.runStable();
                    }
                },
                
                buttonDown: (button) => {
                    if (core.gba && core.gba.keypad) {
                        const gbaButtons = ['A', 'B', 'SELECT', 'START', 'RIGHT', 'LEFT', 'UP', 'DOWN', 'R', 'L'];
                        if (button < gbaButtons.length) {
                            core.gba.keypad.keyDown(gbaButtons[button]);
                        }
                    }
                },
                
                buttonUp: (button) => {
                    if (core.gba && core.gba.keypad) {
                        const gbaButtons = ['A', 'B', 'SELECT', 'START', 'RIGHT', 'LEFT', 'UP', 'DOWN', 'R', 'L'];
                        if (button < gbaButtons.length) {
                            core.gba.keypad.keyUp(gbaButtons[button]);
                        }
                    }
                },
                
                cleanup: () => {
                    if (core.gba) {
                        core.gba.pause();
                        core.gba = null;
                    }
                }
            };
            
            window.GBAWASM = { core };
            this.log('✓ GBA emulator ready (GameBoyAdvance.js)');
            resolve();
        });
    }
    
    async setupGBajs3() {
        // gbajs3 uses mGBA WASM
        return new Promise((resolve) => {
            this.log('gbajs3 library detected, but full integration requires additional setup');
            // For now, fall through to next option
            resolve();
        });
    }
    
    async setupVBA() {
        // VBA.js setup
        return new Promise((resolve) => {
            this.log('VBA.js library detected, but full integration requires additional setup');
            // For now, fall through to next option
            resolve();
        });
    }
    
    async createMinimalGBAPlaceholder() {
        // Create a minimal placeholder that shows a message
        // This allows the UI to work even if no emulator loads
        return new Promise((resolve) => {
            // Test network connectivity
            fetch('https://www.google.com/favicon.ico', { mode: 'no-cors' })
                .then(() => {
                    this.log('Network connection detected, but GBA emulator libraries are not available on CDN.');
                })
                .catch(() => {
                    this.log('⚠ No network connection detected.');
                });
            
            const core = {
                loadROM: async () => {
                    const errorMsg = 'GBA emulator library not available.\n\n' +
                        'Solutions:\n' +
                        '1. Compile mGBA to WASM:\n' +
                        '   - Install Emscripten SDK\n' +
                        '   - Compile mGBA: emcc mgba.c -o mgba.js -s WASM=1\n' +
                        '   - Place mgba.wasm and mgba.js in project directory\n\n' +
                        '2. Check internet connection for CDN libraries\n\n' +
                        '3. Use a pre-compiled WASM build from: https://github.com/mgba-emu/mgba';
                    throw new Error(errorMsg);
                },
                setFrameCallback: () => {},
                start: () => {},
                runFrame: () => {},
                buttonDown: () => {},
                buttonUp: () => {},
                cleanup: () => {}
            };
            
            window.GBAWASM = { core };
            this.log('⚠ Minimal GBA placeholder created - emulator not fully functional');
            this.status.textContent = 'GBA emulator not available. See console (F12) for setup instructions.';
            resolve();
        });
    }
    
    createGBACoreAPI(Module) {
        // Create a clean API that wraps the C functions from mGBA
        // The actual function names depend on how mGBA was compiled
        return {
            romPtr: null,
            frameBuffer: null,
            frameCallback: null,
            Module: Module,
            
            loadROM: async (romData) => {
                // Allocate memory for ROM in WASM heap
                const romPtr = Module._malloc(romData.length);
                if (!romPtr) {
                    throw new Error('Failed to allocate memory for ROM');
                }
                
                // Copy ROM data to WASM memory
                Module.HEAPU8.set(romData, romPtr);
                
                // Load ROM using mGBA C function
                // Function names may vary based on compilation, adjust as needed
                const loadFunc = Module._mgba_load_rom || Module._GBA_loadROM || Module._loadROM;
                if (!loadFunc) {
                    Module._free(romPtr);
                    throw new Error('ROM loading function not found in WASM module');
                }
                
                const result = loadFunc(romPtr, romData.length);
                if (result !== 0) {
                    Module._free(romPtr);
                    throw new Error('Failed to load ROM (error code: ' + result + ')');
                }
                
                this.romPtr = romPtr;
                
                // Allocate frame buffer (240 * 160 * 4 bytes for RGBA)
                const frameSize = 240 * 160 * 4;
                this.frameBuffer = Module._malloc(frameSize);
                if (!this.frameBuffer) {
                    Module._free(romPtr);
                    throw new Error('Failed to allocate frame buffer');
                }
                
                // Set frame buffer in emulator
                const setBufferFunc = Module._mgba_set_frame_buffer || Module._GBA_setFrameBuffer;
                if (setBufferFunc) {
                    setBufferFunc(this.frameBuffer);
                }
            },
            
            setFrameCallback: (callback) => {
                this.frameCallback = callback;
            },
            
            start: () => {
                const resetFunc = this.Module._mgba_reset || this.Module._GBA_reset || this.Module._reset;
                if (resetFunc) {
                    resetFunc();
                }
            },
            
            runFrame: () => {
                // Run one frame of emulation
                const runFunc = this.Module._mgba_run_frame || this.Module._GBA_runFrame || this.Module._runFrame;
                if (runFunc) {
                    runFunc();
                }
                
                // Copy frame buffer to JavaScript
                if (this.frameCallback && this.frameBuffer) {
                    const frameSize = 240 * 160 * 4;
                    const frameData = new Uint8Array(
                        this.Module.HEAPU8.buffer,
                        this.frameBuffer,
                        frameSize
                    );
                    this.frameCallback(new Uint8Array(frameData));
                }
            },
            
            buttonDown: (button) => {
                const btnFunc = this.Module._mgba_button_down || this.Module._GBA_buttonDown;
                if (btnFunc) {
                    btnFunc(button);
                }
            },
            
            buttonUp: (button) => {
                const btnFunc = this.Module._mgba_button_up || this.Module._GBA_buttonUp;
                if (btnFunc) {
                    btnFunc(button);
                }
            },
            
            cleanup: () => {
                if (this.romPtr && this.Module._free) {
                    this.Module._free(this.romPtr);
                    this.romPtr = null;
                }
                if (this.frameBuffer && this.Module._free) {
                    this.Module._free(this.frameBuffer);
                    this.frameBuffer = null;
                }
            }
        };
    }
    

    stop() {
        this.running = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        
        // Clean up GBA WASM emulator
        if (this.gbaWasm && this.gbaWasm.core) {
            try {
                if (this.gbaWasm.core.cleanup) {
                    this.gbaWasm.core.cleanup();
                }
            } catch (e) {
                console.log('Could not cleanup GBA WASM:', e);
            }
            this.gbaWasm = null;
        }
        
        // Clean up old EmulatorJS if it exists
        if (this.emulatorInstance) {
            try {
                this.emulatorInstance.destroy();
            } catch (e) {
                console.log('Could not destroy emulator:', e);
            }
            this.emulatorInstance = null;
        }
        
        if (window.EJS_emulator) {
            try {
                window.EJS_emulator.destroy();
            } catch (e) {}
        }
    }

    setSystem(system) {
        this.currentSystem = system;
        const gameContainer = document.getElementById('game-container');
        
        this.stop();
        
        if (system === 'nes') {
            this.canvas.style.display = 'block';
            gameContainer.style.display = 'none';
            gameContainer.innerHTML = '';
            this.initCanvas('nes');
        } else if (system === 'gba') {
            this.canvas.style.display = 'none';
            gameContainer.style.display = 'flex';
            gameContainer.innerHTML = '';
        }
    }
}