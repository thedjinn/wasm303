import RingBuffer from "./RingBuffer";

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

export default class Engine {
    sendBuffer: RingBuffer;
    receiveBuffer: RingBuffer;

    programBuffer: Uint8Array;

    context: AudioContext;

    resolveBootstrapPromise: () => void;

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
        this.context = new AudioContext({
            sampleRate: 44100,
            latencyHint: "interactive"
        });

        // Load and instantiate worklet
        await this.context.audioWorklet.addModule("worklet2.js");

        const node = new AudioWorkletNode(this.context, "kernel", {
            numberOfInputs: 0,
            numberOfOutputs: 1,
            outputChannelCount: [2]
        });

        node.port.onmessage = this.handleMessage;

        node.connect(this.context.destination);

        const sendStorage = new SharedArrayBuffer(4096);
        const receiveStorage = new SharedArrayBuffer(4096);

        this.sendBuffer = new RingBuffer(sendStorage);
        this.receiveBuffer = new RingBuffer(receiveStorage);

        this.programBuffer = new Uint8Array(1024);

        let bootstrapPromise = new Promise<void>((resolve, reject) => {
            this.resolveBootstrapPromise = resolve;
        });

        // Send kernel to worklet
        node.port.postMessage({
            command: "bootstrap",
            kernel: kernel,
            sendStorage: receiveStorage,
            receiveStorage: sendStorage
        });

        this.waitCallback("initialize");

        await bootstrapPromise;
    }

    toggleStart() {
        if (this.context.state === "running") {
            this.context.suspend();
        } else {
            this.context.resume();
        }
    }

    waitCallback = (result: string) => {
        while (true) {
            const bytesRead = this.receiveBuffer.read(this.programBuffer, this.programBuffer.length);

            // Process receive buffer
            if (bytesRead > 0) {
                this.processInstructions(bytesRead);
            }

            // Wait for new data
            const previousValue = this.receiveBuffer.signalPointer[0];
            const result = Atomics.waitAsync(this.receiveBuffer.signalPointer, 0, previousValue);
            if (result.async) {
                result.value.then(this.waitCallback);
                return;
            }
        }
    }

    processInstructions(bytesToProcess: number) {
        for (let i=0; i < bytesToProcess; ++i) {
            console.log(this.programBuffer[i]);

            // TODO: Use enum for this
            if (this.programBuffer[i] === 255) {
                this.resolveBootstrapPromise();
            }
        }
    }

    handleMessage = (event: Event) => {
        console.log("message from worklet:", event);
    }
}
