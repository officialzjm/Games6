// Main Application Entry Point

document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d', { alpha: false });
    const status = document.getElementById('status');
    const debug = document.getElementById('debug');
    const romFile = document.getElementById('romFile');
    const systemSelect = document.getElementById('systemSelect');
    const gbaEngineGroup = document.getElementById('gbaEngineGroup');
    const gbaEngineSelect = document.getElementById('gbaEngineSelect');
    const gbaSaveHint = document.getElementById('gbaSaveHint');

    const pickerBtn = document.getElementById("gamePickerBtn");
    const pickerDropdown = document.getElementById("gamePickerDropdown");
    const searchBox = document.getElementById("gameSearch");
    const gameList = document.getElementById("gameList");
    // Core managers
    const emulator = new EmulatorManager(canvas, ctx, status, debug);
    const inputHandler = new InputHandler(emulator);
    const controlSettings = new ControlSettings(inputHandler);
    const touchControls = new TouchControls(emulator, inputHandler);

    emulator.touchControls = touchControls;

    // Initial canvas
    emulator.initCanvas('nes');

    // -----------------------------------------------------------
    // Touch device detection
    // -----------------------------------------------------------
    const isTouchDevice = (window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches)
                         || ('ontouchstart' in window);

    function syncSystemClass() {
        const system = systemSelect.value || emulator.currentSystem;
        document.body.classList.toggle('is-nes', system === 'nes');
        document.body.classList.toggle('is-gba', system === 'gba');
        document.body.classList.toggle('system-nes', system === 'nes');
        document.body.classList.toggle('system-gba', system === 'gba');
        if (gbaEngineGroup) {
            gbaEngineGroup.style.display = system === 'gba' ? 'block' : 'none';
        }
        if (gbaSaveHint) {
            const isEmulatorJsGba = system === 'gba' && (!gbaEngineSelect || gbaEngineSelect.value !== 'iodine');
            gbaSaveHint.style.display = isEmulatorJsGba ? 'block' : 'none';
        }
    }

    function syncTouchOverlay() {
        // Inline NES touch controls — shown only on touch devices with NES selected.
        // No fullscreen requirement; they live below the game screen.
        if (!touchControls.container) return;
        syncSystemClass();
        const shouldShow = isTouchDevice && (systemSelect.value || emulator.currentSystem) === 'nes';
        if (shouldShow) touchControls.show();
        else touchControls.hide();
    }
    window.__syncTouchOverlay = syncTouchOverlay;

    // -----------------------------------------------------------
    // System selection
    // -----------------------------------------------------------
    function changeSystem(system) {
        console.log('Changing system');
        systemSelect.value = system;
        emulator.setSystem(system);
        console.log(system);
        status.textContent = `System: ${systemSelect.options[systemSelect.selectedIndex].text} - Load a ROM file`;
        if (system === 'gba' && gbaEngineSelect && gbaEngineSelect.value === 'iodine') {
            emulator.setGBAEngine('iodine');
            emulator.loadGBA();
        }
        syncTouchOverlay();
        console.log('System change complete');
    }
    /*
    if (gbaEngineSelect) {
        gbaEngineSelect.addEventListener('change', async (e) => {
            emulator.setGBAEngine(e.target.value);
            if (emulator.currentSystem !== 'gba') return;

            const file = romFile.files && romFile.files[0];
            if (emulator.gbaEngine === 'iodine' || file) {
                status.textContent = 'Switching GBA engine...';
                try {
                    emulator.stop();
                    await emulator.loadGBA(file);
                } catch (err) {
                    emulator.log('ERROR: ' + err.message);
                    status.textContent = 'Error: ' + err.message;
                    console.error(err);
                }
            } else {
                emulator.setSystem('gba');
                status.textContent = 'GBA engine changed - load a ROM file';
            }
            syncTouchOverlay();
        });
    }
    */

    // -----------------------------------------------------------
    // ROM loader
    // -----------------------------------------------------------
    
    function loadRom(romUrl) {
        console.log('loadRom called');
        const response = await fetch(romUrl);

        if (!response.ok) {
            console.log('Invalid response);
            throw new Error(`HTTP ${response.status}`);
        }

        const blob = await response.blob();
        console.log('Blob');
        const fileName = romUrl.split("/").pop() || "game.gba";
        console.log(`Loading rom: '${fileName}'`);
        const file = new File([blob], fileName);
        
        if (!file) return;
        console.log('File found');
        status.textContent = 'Loading ROM...';
        emulator.log('Reading ROM file...');

        try {
            emulator.stop();

            if (emulator.currentSystem === 'nes') {
                await emulator.loadNES(file);
            } else if (emulator.currentSystem === 'gba') {
                await emulator.loadGBA(file);
            }

            syncTouchOverlay();
        } catch (err) {
            emulator.log('ERROR: ' + err.message);
            status.textContent = 'Error: ' + err.message;
            console.error(err);
        }
    }
    
    // Canvas focus helper for keyboard input
    canvas.setAttribute('tabindex', '0');
    canvas.addEventListener('keydown', (e) => e.preventDefault());

    // file:// protocol warning
    if (window.location.protocol === 'file:') {
        const warning = document.getElementById('fileProtocolWarning');
        if (warning) warning.style.display = 'block';
        status.textContent = '⚠ Please use a web server (see warning above)';
        emulator.log('⚠ Running from file:// - CORS restrictions will prevent loading external resources');
    } else {
        status.textContent = 'Ready! Select a system and load a ROM file.';
        emulator.log('Emulator ready');
    }
   
    const games = [
        {
            name: "Pokemon Emerald",
            rom: "roms/pokemonemerald.gba"
        },
        {
            name: "Pokemon Fire Red",
            rom: "roms/pokemonred.gba"
        },
        {
            name: "Pokemon Leaf Green",
            rom: "roms/pokemongreen.gba"
        }
    ];
    
    pickerBtn.addEventListener("click", () => {
        pickerDropdown.classList.toggle("open");
    });
    
    function renderGames(filter = "") {
    
        gameList.innerHTML = "";
    
        const filtered = games.filter(game =>
            game.name.toLowerCase().includes(
                filter.toLowerCase()
            )
        );
    
        filtered.forEach(game => {
    
            const entry = document.createElement("div");
    
            entry.className = "game-entry";
            entry.textContent = game.name;
    
            entry.addEventListener("click", () => {
                pickerDropdown.classList.remove("open");
                changeSystem(game.rom.split('.').pop());
                loadRom(game.rom);
            });
    
            gameList.appendChild(entry);
        });
    }
    
    searchBox.addEventListener("input", () => {
        renderGames(searchBox.value);
    });

    renderGames();
    console.log('Games5 Test2');
    // Initial sync
    syncSystemClass();
    syncTouchOverlay();
});
