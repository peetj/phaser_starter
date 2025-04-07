// arduinoController.js
const ArduinoController = (function () {
    let port, reader, isConnected = false;
    let serialBuffer = "";
    let connectButton, statusBar;

    // Encapsulated control state
    const phaserControls = {
        left: false,
        right: false,
        up: false,
        down: false
    };

    // Default actions mapping using the full phrase commands
    let actionsMapping = {
        "Left button pressed": () => phaserControls.left = true,
        "Left button released": () => phaserControls.left = false,
        "Right button pressed": () => phaserControls.right = true,
        "Right button released": () => phaserControls.right = false,
        "Thrust button pressed": () => phaserControls.up = true,
        "Thrust button released": () => phaserControls.up = false,
        "Fire button pressed": () => phaserControls.down = true,
        "Fire button released": () => phaserControls.down = false
    };

    /**
     * Initialize the ArduinoController with options.
     * Options can include:
     *  - actions: an object mapping serial data strings to functions.
     *  - containerId: the id of the container element (default "arduino-controls").
     *  - buttonStyle: a style object to customize the connect/disconnect button.
     *  - buttonClass: a custom CSS class to add to the button.
     */
    function initialize(options = {}) {
        if (options.actions) {
            // Merge custom actions with the default ones; custom ones override defaults.
            actionsMapping = { ...actionsMapping, ...options.actions };
        }
        createArduinoControls(options.containerId, options.buttonStyle, options.buttonClass);
    }

    // Dynamically create the UI for Arduino controls
    function createArduinoControls(containerId = "arduino-controls", buttonStyle, buttonClass) {
        let container = document.getElementById(containerId);
        if (!container) {
            container = document.createElement("div");
            container.id = containerId;
            container.style.textAlign = "center";
            container.style.marginTop = "10px";
            document.body.appendChild(container);
        }

        // Only create the button if it doesn't already exist.
        connectButton = document.getElementById("connect-button");
        if (!connectButton) {
            connectButton = document.createElement("button");
            connectButton.id = "connect-button";
            connectButton.textContent = "Connect to Device";

            // Apply custom styles if provided.
            if (buttonStyle && typeof buttonStyle === 'object') {
                Object.keys(buttonStyle).forEach(property => {
                    connectButton.style[property] = buttonStyle[property];
                });
            }
            // Optionally add a custom CSS class.
            if (buttonClass) {
                connectButton.className = buttonClass;
            }

            container.appendChild(connectButton);
            connectButton.addEventListener("click", handleConnection);
        }

        // Create a status bar if it doesn't exist.
        statusBar = document.getElementById("status-bar");
        if (!statusBar) {
            statusBar = document.createElement("div");
            statusBar.id = "status-bar";
            statusBar.textContent = "Status: Disconnected";
            statusBar.style.color = "#ccc";
            container.appendChild(statusBar);
        }
    }

    // Handle connection and disconnection
    async function handleConnection() {
        if (!isConnected) {
            try {
                port = await navigator.serial.requestPort();
                await port.open({ baudRate: 9600 });
                const decoder = new TextDecoderStream();
                port.readable.pipeTo(decoder.writable);
                reader = decoder.readable.getReader();
                isConnected = true;
                connectButton.textContent = "Disconnect";
                statusBar.textContent = "Status: Connected";
                readData();
            } catch (err) {
                console.error("Connection failed:", err);
                alert("Failed to connect.");
            }
        } else {
            try {
                await reader.cancel();
                reader.releaseLock();
                await port.close();
            } catch (err) {
                console.error("Disconnection failed:", err);
            } finally {
                isConnected = false;
                connectButton.textContent = "Connect to Device";
                statusBar.textContent = "Status: Disconnected";
            }
        }
    }

    // Continuously read data from the serial port.
    async function readData() {
        while (isConnected) {
            try {
                const { value, done } = await reader.read();
                if (done) break;
                if (value) {
                    serialBuffer += value;
                    let lines = serialBuffer.split("\n");
                    serialBuffer = lines.pop();
                    lines.forEach(line => processSerialInput(line.trim()));
                }
                if (serialBuffer.length > 1000) serialBuffer = "";
            } catch (err) {
                console.error("Read error:", err);
                break;
            }
        }
    }

    // Process incoming serial data using the (possibly customized) actionsMapping.
    function processSerialInput(data) {
        if (actionsMapping[data]) {
            actionsMapping[data]();
        } else {
            console.warn("Unknown input:", data);
        }
    }

    // Getter for the current control state (returns a shallow copy)
    function getControls() {
        return { ...phaserControls };
    }

    // Public API
    return {
        initialize,
        processSerialInput, // Exposed for optional overriding/testing
        getControls
    };
})();
