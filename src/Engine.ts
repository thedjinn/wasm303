import Opcode from "./Opcode";
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
}

export default class Engine {
    private sendBuffer: RingBuffer;
    private receiveBuffer: RingBuffer;

    private programBuffer: Uint8Array;
    private programDataView: DataView;

    private context: AudioContext;

    private resolveBootstrapPromise: () => void;

    async initialize(): Promise<void> {
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
        this.programDataView = new DataView(this.programBuffer.buffer);

        const bootstrapPromise = new Promise<void>((resolve, reject) => {
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

    toggleStart(): void {
        if (this.context.state === "running") {
            this.context.suspend();
        } else {
            this.context.resume();
        }
    }

    private waitCallback: (result: string) => void = (result: string) => {
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

    private *decodeInstructions(bytesToProcess: number): Generator<number[]> {
        const instruction = [];

        let ptr = 0;
        while (ptr < bytesToProcess) {
            const opcode = this.programBuffer[ptr++];
            instruction.push(opcode);

            // Extract operands
            if (opcode >= 80 && opcode < 100) {
                instruction.push(this.programDataView.getInt32(ptr, true));
                ptr += 4;
            } else if (opcode >= 100 && opcode < 120) {
                instruction.push(this.programDataView.getFloat32(ptr, true));
                ptr += 4;
            }

            yield instruction;

            instruction.length = 0;
        }
    }

    private processInstructions(bytesToProcess: number): void {
        for (const instruction of this.decodeInstructions(bytesToProcess)) {
            if (instruction[0] === Opcode.BootstrapFinished) {
                this.resolveBootstrapPromise();
            }

            console.log(instruction);
        }
    }

    private handleMessage: (event: Event) => void = (event: Event) => {
        console.log("message from worklet:", event);
    }
}
