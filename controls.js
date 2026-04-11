// Input Controls Handler

class InputHandler {
    constructor(emulatorManager) {
        this.emulator = emulatorManager;
        this.BUTTON = {
            A: 0, B: 1, SELECT: 2, START: 3,
            UP: 4, DOWN: 5, LEFT: 6, RIGHT: 7,
            L: 8, R: 9
        };

        // Default key mappings
        this.defaultKeys = {
            nes: {
                'KeyZ': this.BUTTON.A,
                'KeyJ': this.BUTTON.A,
                'KeyN': this.BUTTON.A,
                'KeyX': this.BUTTON.B,
                'KeyK': this.BUTTON.B,
                'KeyM': this.BUTTON.B,
                'ShiftLeft': this.BUTTON.SELECT,
                'ShiftRight': this.BUTTON.SELECT,
                'KeyC': this.BUTTON.SELECT,
                'Enter': this.BUTTON.START,
                'Space': this.BUTTON.START,
                'KeyReturn': this.BUTTON.START,
                'ArrowUp': this.BUTTON.UP,
                'KeyW': this.BUTTON.UP,
                'ArrowDown': this.BUTTON.DOWN,
                'KeyS': this.BUTTON.DOWN,
                'ArrowLeft': this.BUTTON.LEFT,
                'KeyA': this.BUTTON.LEFT,
                'ArrowRight': this.BUTTON.RIGHT,
                'KeyD': this.BUTTON.RIGHT
            },
            gba: {
                'KeyZ': this.BUTTON.A,
                'KeyJ': this.BUTTON.A,
                'KeyN': this.BUTTON.A,
                'KeyX': this.BUTTON.B,
                'KeyK': this.BUTTON.B,
                'KeyM': this.BUTTON.B,
                'ShiftLeft': this.BUTTON.SELECT,
                'ShiftRight': this.BUTTON.SELECT,
                'KeyC': this.BUTTON.SELECT,
                'Enter': this.BUTTON.START,
                'Space': this.BUTTON.START,
                'KeyReturn': this.BUTTON.START,
                'ArrowUp': this.BUTTON.UP,
                'KeyW': this.BUTTON.UP,
                'ArrowDown': this.BUTTON.DOWN,
                'KeyS': this.BUTTON.DOWN,
                'ArrowLeft': this.BUTTON.LEFT,
                'KeyA': this.BUTTON.LEFT,
                'ArrowRight': this.BUTTON.RIGHT,
                'KeyD': this.BUTTON.RIGHT,
                'KeyQ': this.BUTTON.L,
                'KeyE': this.BUTTON.R
            }
        };

        // Load custom mappings from localStorage
        this.keys = this.loadCustomKeys();
        this.pressedKeys = new Set();
        this.init();
    }

    loadCustomKeys() {
        try {
            const saved = localStorage.getItem('emulatorControls');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Merge with defaults to ensure all buttons have mappings
                const merged = {};
                for (const system in this.defaultKeys) {
                    merged[system] = { ...this.defaultKeys[system], ...(parsed[system] || {}) };
                }
                return merged;
            }
        } catch (e) {
            console.error('Failed to load custom controls:', e);
        }
        return JSON.parse(JSON.stringify(this.defaultKeys)); // Deep copy
    }

    saveCustomKeys() {
        try {
            localStorage.setItem('emulatorControls', JSON.stringify(this.keys));
        } catch (e) {
            console.error('Failed to save custom controls:', e);
        }
    }

    getCurrentKeys() {
        return this.keys[this.emulator.currentSystem] || this.keys.nes;
    }

    getKeyName(code) {
        // Convert key code to readable name
        const keyMap = {
            'KeyA': 'A', 'KeyB': 'B', 'KeyC': 'C', 'KeyD': 'D', 'KeyE': 'E',
            'KeyF': 'F', 'KeyG': 'G', 'KeyH': 'H', 'KeyI': 'I', 'KeyJ': 'J',
            'KeyK': 'K', 'KeyL': 'L', 'KeyM': 'M', 'KeyN': 'N', 'KeyO': 'O',
            'KeyP': 'P', 'KeyQ': 'Q', 'KeyR': 'R', 'KeyS': 'S', 'KeyT': 'T',
            'KeyU': 'U', 'KeyV': 'V', 'KeyW': 'W', 'KeyX': 'X', 'KeyY': 'Y',
            'KeyZ': 'Z', 'Digit0': '0', 'Digit1': '1', 'Digit2': '2', 'Digit3': '3',
            'Digit4': '4', 'Digit5': '5', 'Digit6': '6', 'Digit7': '7', 'Digit8': '8',
            'Digit9': '9', 'ArrowUp': '↑', 'ArrowDown': '↓', 'ArrowLeft': '←', 'ArrowRight': '→',
            'Enter': 'Enter', 'Space': 'Space', 'ShiftLeft': 'Left Shift', 'ShiftRight': 'Right Shift',
            'ControlLeft': 'Left Ctrl', 'ControlRight': 'Right Ctrl', 'AltLeft': 'Left Alt',
            'AltRight': 'Right Alt', 'Tab': 'Tab', 'Escape': 'Esc', 'Backspace': 'Backspace'
        };
        return keyMap[code] || code.replace('Key', '').replace('Digit', '');
    }

    init() {
        // Handle keydown
        document.addEventListener('keydown', (e) => {
            if (!this.emulator.running) return;
            
            const currentKeys = this.getCurrentKeys();
            const button = currentKeys[e.code];
            if (button !== undefined) {
                e.preventDefault();
                e.stopPropagation();
                
                if (!this.pressedKeys.has(e.code)) {
                    this.pressedKeys.add(e.code);
                    this.handleButtonDown(button);
                }
            }
        });

        // Handle keyup
        document.addEventListener('keyup', (e) => {
            if (!this.emulator.running) return;
            
            const currentKeys = this.getCurrentKeys();
            const button = currentKeys[e.code];
            if (button !== undefined) {
                e.preventDefault();
                e.stopPropagation();
                
                this.pressedKeys.delete(e.code);
                this.handleButtonUp(button);
            }
        });

        // Clear pressed keys when window loses focus
        window.addEventListener('blur', () => {
            this.releaseAllButtons();
            this.pressedKeys.clear();
        });
    }

    handleButtonDown(button) {
        try {
            if (this.emulator.currentSystem === 'nes' && this.emulator.nes) {
                if (button <= 7) {
                    this.emulator.nes.buttonDown(1, button);
                }
            } else if (this.emulator.currentSystem === 'gba') {
                // GBA WASM emulator input handling
                if (this.emulator.gbaWasm && this.emulator.gbaWasm.core) {
                    // Map buttons to GBA button codes
                    // GBA buttons: A=0, B=1, SELECT=2, START=3, RIGHT=4, LEFT=5, UP=6, DOWN=7, R=8, L=9
                    this.emulator.gbaWasm.core.buttonDown(button);
                }
            }
        } catch (err) {
            console.error('Error in buttonDown:', err);
        }
    }

    handleButtonUp(button) {
        try {
            if (this.emulator.currentSystem === 'nes' && this.emulator.nes) {
                if (button <= 7) {
                    this.emulator.nes.buttonUp(1, button);
                }
            } else if (this.emulator.currentSystem === 'gba') {
                // GBA WASM emulator input handling
                if (this.emulator.gbaWasm && this.emulator.gbaWasm.core) {
                    this.emulator.gbaWasm.core.buttonUp(button);
                }
            }
        } catch (err) {
            console.error('Error in buttonUp:', err);
        }
    }

    releaseAllButtons() {
        if (this.emulator.running) {
            if (this.emulator.currentSystem === 'nes' && this.emulator.nes) {
                for (let i = 0; i < 8; i++) {
                    try {
                        this.emulator.nes.buttonUp(1, i);
                    } catch (err) {
                        // Ignore errors
                    }
                }
            }
        }
    }
}

