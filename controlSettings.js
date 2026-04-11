// Control Settings Manager

class ControlSettings {
    constructor(inputHandler) {
        this.inputHandler = inputHandler;
        this.currentSystem = 'nes';
        this.waitingForKey = null;
        this.init();
    }

    init() {
        const modal = document.getElementById('controlModal');
        const openBtn = document.getElementById('controlSettingsBtn');
        const closeBtn = document.getElementById('closeModal');
        const systemSelect = document.getElementById('controlSystemSelect');
        const saveBtn = document.getElementById('saveControls');
        const resetBtn = document.getElementById('resetControls');

        openBtn.addEventListener('click', () => {
            this.currentSystem = document.getElementById('systemSelect').value;
            systemSelect.value = this.currentSystem;
            this.updateControlDisplay();
            modal.style.display = 'flex';
        });

        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            this.waitingForKey = null;
        });

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                this.waitingForKey = null;
            }
        });

        systemSelect.addEventListener('change', (e) => {
            this.currentSystem = e.target.value;
            this.updateControlDisplay();
        });

        saveBtn.addEventListener('click', () => {
            this.saveControls();
            modal.style.display = 'none';
        });

        resetBtn.addEventListener('click', () => {
            if (confirm('Reset controls to default for ' + this.currentSystem.toUpperCase() + '?')) {
                this.resetControls();
            }
        });
    }

    updateControlDisplay() {
        const mapping = document.getElementById('controlMapping');
        mapping.innerHTML = '';

        const buttonNames = {
            nes: [
                { id: 'A', name: 'A Button' },
                { id: 'B', name: 'B Button' },
                { id: 'SELECT', name: 'Select' },
                { id: 'START', name: 'Start' },
                { id: 'UP', name: 'Up' },
                { id: 'DOWN', name: 'Down' },
                { id: 'LEFT', name: 'Left' },
                { id: 'RIGHT', name: 'Right' }
            ],
            gba: [
                { id: 'A', name: 'A Button' },
                { id: 'B', name: 'B Button' },
                { id: 'SELECT', name: 'Select' },
                { id: 'START', name: 'Start' },
                { id: 'UP', name: 'Up' },
                { id: 'DOWN', name: 'Down' },
                { id: 'LEFT', name: 'Left' },
                { id: 'RIGHT', name: 'Right' },
                { id: 'L', name: 'L Button' },
                { id: 'R', name: 'R Button' }
            ]
        };

        const buttons = buttonNames[this.currentSystem] || buttonNames.nes;
        const currentKeys = this.inputHandler.keys[this.currentSystem] || {};
        const reverseMap = {};

        // Create reverse mapping: button -> key codes
        for (const [keyCode, button] of Object.entries(currentKeys)) {
            if (!reverseMap[button]) {
                reverseMap[button] = [];
            }
            reverseMap[button].push(keyCode);
        }

        buttons.forEach(btn => {
            const buttonId = this.inputHandler.BUTTON[btn.id];
            const keyCodes = reverseMap[buttonId] || [];
            
            const controlItem = document.createElement('div');
            controlItem.className = 'control-item';
            
            controlItem.innerHTML = `
                <div class="control-label">
                    <span class="control-name">${btn.name}</span>
                </div>
                <div class="control-keys">
                    ${keyCodes.map(keyCode => `
                        <div class="key-badge">
                            <span>${this.inputHandler.getKeyName(keyCode)}</span>
                            <button class="remove-key" data-key="${keyCode}" data-button="${buttonId}">×</button>
                        </div>
                    `).join('')}
                    <button class="add-key-btn" data-button="${buttonId}">
                        + Add Key
                    </button>
                </div>
            `;
            
            mapping.appendChild(controlItem);
        });

        // Add event listeners
        mapping.querySelectorAll('.add-key-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const buttonId = parseInt(e.target.dataset.button);
                this.startKeyCapture(buttonId, e.target);
            });
        });

        mapping.querySelectorAll('.remove-key').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const keyCode = e.target.dataset.key;
                const buttonId = parseInt(e.target.dataset.button);
                this.removeKeyMapping(keyCode, buttonId);
            });
        });
    }

    startKeyCapture(buttonId, targetBtn) {
        if (this.waitingForKey) {
            return;
        }

        this.waitingForKey = { buttonId, targetBtn };
        targetBtn.textContent = 'Press any key...';
        targetBtn.classList.add('waiting');

        const keyHandler = (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (e.code === 'Escape') {
                this.cancelKeyCapture();
                return;
            }

            // Remove old mappings for this key
            this.removeKeyFromAllButtons(e.code);

            // Add new mapping
            if (!this.inputHandler.keys[this.currentSystem]) {
                this.inputHandler.keys[this.currentSystem] = {};
            }
            this.inputHandler.keys[this.currentSystem][e.code] = buttonId;

            this.waitingForKey = null;
            targetBtn.classList.remove('waiting');
            document.removeEventListener('keydown', keyHandler);
            this.updateControlDisplay();
        };

        document.addEventListener('keydown', keyHandler, { once: true });
    }

    removeKeyFromAllButtons(keyCode) {
        if (this.inputHandler.keys[this.currentSystem]) {
            delete this.inputHandler.keys[this.currentSystem][keyCode];
        }
    }

    removeKeyMapping(keyCode, buttonId) {
        if (this.inputHandler.keys[this.currentSystem]) {
            delete this.inputHandler.keys[this.currentSystem][keyCode];
            this.updateControlDisplay();
        }
    }

    cancelKeyCapture() {
        if (this.waitingForKey) {
            this.waitingForKey.targetBtn.textContent = '+ Add Key';
            this.waitingForKey.targetBtn.classList.remove('waiting');
            this.waitingForKey = null;
        }
    }

    saveControls() {
        this.inputHandler.saveCustomKeys();
        this.showNotification('Controls saved successfully!');
    }

    resetControls() {
        this.inputHandler.keys[this.currentSystem] = JSON.parse(
            JSON.stringify(this.inputHandler.defaultKeys[this.currentSystem])
        );
        this.updateControlDisplay();
        this.showNotification('Controls reset to default!');
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }
}

