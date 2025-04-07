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

    // Dynamically create the Arduino controls UI (Connect button and status bar)
    // arduinoController.js (updated portion)
    function createArduinoControls(containerId = "arduino-controls", options = {}) {
        let container = document.getElementById(containerId);
        if (!container) {
            container = document.createElement("div");
            container.id = containerId;
            container.style.textAlign = "center";
            container.style.marginTop = "10px";
            document.body.appendChild(container);
        }

        // Check if the connect button already exists.
        connectButton = document.getElementById("connect-button");
        if (!connectButton) {
            connectButton = document.createElement("button");
            connectButton.id = "connect-button";
            connectButton.textContent = "Connect to Device";

            // Apply custom styles if provided in options.buttonStyle
            if (options.buttonStyle && typeof options.buttonStyle === 'object') {
                Object.keys(options.buttonStyle).forEach(property => {
                    connectButton.style[property] = options.buttonStyle[property];
                });
            }

            // Optionally add a custom CSS class
            if (options.buttonClass) {
                connectButton.className = options.buttonClass;
            }

            container.appendChild(connectButton);
            connectButton.addEventListener("click", handleConnection);
        }

        // Check if the status bar already exists.
        statusBar = document.getElementById("status-bar");
        if (!statusBar) {
            statusBar = document.createElement("div");
            statusBar.id = "status-bar";
            statusBar.textContent = "Status: Disconnected";
            statusBar.style.color = "#ccc";
            container.appendChild(statusBar);
        }
    }


    // Handle connection and disconnection to the Arduino device
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

    // Continuously read data from the serial port
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
                // Reset buffer if it grows too large
                if (serialBuffer.length > 1000) serialBuffer = "";
            } catch (err) {
                console.error("Read error:", err);
                break;
            }
        }
    }

    // Process each line of serial data using the encapsulated control state.
    // This function is exposed in case you want to override/extend its behavior.
    function processSerialInput(data) {
        const actions = {
            "Left button pressed": () => phaserControls.left = true,
            "Left button released": () => phaserControls.left = false,
            "Right button pressed": () => phaserControls.right = true,
            "Right button released": () => phaserControls.right = false,
            "Thrust button pressed": () => phaserControls.up = true,
            "Thrust button released": () => phaserControls.up = false,
            "Fire button pressed": () => phaserControls.down = true,
            "Fire button released": () => phaserControls.down = false
        };

        if (actions[data]) {
            actions[data]();
        } else {
            console.warn("Unknown input:", data);
        }
    }

    // Public getter for the current control state.
    // Returns a shallow copy so the internal state can't be directly modified.
    function getControls() {
        return { ...phaserControls };
    }

    // Public API
    return {
        createArduinoControls,
        processSerialInput,
        getControls
    };
})();
