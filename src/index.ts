import RingBuffer from "./RingBuffer";

console.log("bootstrapped");

// TypeScript doesn't understand Atomics.waitAsync, so we'll have to provide
// the declaration ourselves.
declare namespace Atomics {
    function waitAsync(i32a: Int32Array, index: number, value: number, timeout?: number): {
        async: true;
        value: Promise<string>;
    } | {
        async: false;
        value: string;
    };
};

class Engine {
    sendBuffer: RingBuffer;
    receiveBuffer: RingBuffer;

    programBuffer: Uint8Array;

    constructor() {
    }

    async initialize() {
        // TODO: Load in parallel with worklet
        const response = await fetch("kernel.wasm");
        if (!response.ok) {
            throw Error("Error loading kernel: " + response.status);
        }

        const kernel = await response.arrayBuffer();

        // Initialize audio context
        const context = new AudioContext({
            sampleRate: 44100,
            latencyHint: "interactive"
        });

        // Load and instantiate worklet
        await context.audioWorklet.addModule("worklet2.js");

        const node = new AudioWorkletNode(context, "kernel", {
            numberOfInputs: 0,
            numberOfOutputs: 1,
            outputChannelCount: [2]
        });

        node.port.onmessage = this.handleMessage;

        node.connect(context.destination);

        const sendStorage = new SharedArrayBuffer(4096);
        const receiveStorage = new SharedArrayBuffer(4096);

        this.sendBuffer = new RingBuffer(sendStorage);
        this.receiveBuffer = new RingBuffer(receiveStorage);

        this.programBuffer = new Uint8Array(1024);

        // Send kernel to worklet
        node.port.postMessage({
            command: "bootstrap",
            kernel: kernel,
            sendStorage: receiveStorage,
            receiveStorage: sendStorage
        });

        this.waitCallback("initialize");

        console.log("Audio graph initialized");

        document.getElementById("start").addEventListener("click", event => {
            if (context.state === "running") {
                context.suspend();
            } else {
                context.resume();
            }
        });
    }

    waitCallback = (result: string) => {
        while (true) {
            const bytesRead = this.receiveBuffer.read(this.programBuffer, this.programBuffer.length);

            // TODO: Process receive buffer
            //console.log("wait callback", bytesRead);

            // Wait for new data
            const previousValue = this.receiveBuffer.signalPointer[0];
            const result = Atomics.waitAsync(this.receiveBuffer.signalPointer, 0, previousValue);
            if (result.async) {
                result.value.then(this.waitCallback);
                return;
            }
        }
    }

    handleMessage = (event: Event) => {
        console.log("message from worklet:", event);
    }
}

const engine = new Engine();

(async function() {
    await engine.initialize();
})();

export default 0;
