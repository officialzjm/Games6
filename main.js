// Main Application Entry Point

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d', { alpha: false });
    const status = document.getElementById('status');
    const debug = document.getElementById('debug');
    const romFile = document.getElementById('romFile');
    const systemSelect = document.getElementById('systemSelect');

    // Initialize emulator manager
    const emulator = new EmulatorManager(canvas, ctx, status, debug);
    
    // Initialize input handler
    const inputHandler = new InputHandler(emulator);

    // Initialize control settings
    const controlSettings = new ControlSettings(inputHandler);

    // Initialize canvas
    emulator.initCanvas('nes');

    // System selection handler
    systemSelect.addEventListener('change', (e) => {
        const system = e.target.value;
        emulator.setSystem(system);
        status.textContent = `System: ${systemSelect.options[systemSelect.selectedIndex].text} - Load a ROM file`;
    });

    // ROM file handler
    romFile.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        status.textContent = 'Loading ROM...';
        emulator.log('Reading ROM file...');
        
        try {
            // Stop any running game
            emulator.stop();

            // Load ROM based on selected system
            if (emulator.currentSystem === 'nes') {
                await emulator.loadNES(file);
            } else if (emulator.currentSystem === 'gba') {
                await emulator.loadGBA(file);
            }
            
        } catch (err) {
            emulator.log('ERROR: ' + err.message);
            status.textContent = 'Error: ' + err.message;
            console.error(err);
        }
    });

    // Make canvas focusable for better input
    canvas.setAttribute('tabindex', '0');
    canvas.addEventListener('keydown', (e) => {
        e.preventDefault();
    });

    // Check if running from file:// protocol and show warning
    if (window.location.protocol === 'file:') {
        const warning = document.getElementById('fileProtocolWarning');
        if (warning) {
            warning.style.display = 'block';
        }
        status.textContent = '⚠ Please use a web server (see warning above)';
        emulator.log('⚠ Running from file:// - CORS restrictions will prevent loading external resources');
    } else {
        status.textContent = 'Ready! Select a system and load a ROM file.';
        emulator.log('Emulator ready');
    }
});

