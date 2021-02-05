import RingBuffer from "./RingBuffer";

// TypeScript doesn't understand audio worklets, so we'll have to provide type
// declarations ourselves.
interface AudioWorkletProcessor {
    readonly port: MessagePort;

    process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean;
}

declare var AudioWorkletProcessor: {
    prototype: AudioWorkletProcessor;

    new (options?: AudioWorkletNodeOptions): AudioWorkletProcessor;
};

declare function registerProcessor(name: string, processorCtor: (new (options?: AudioWorkletNodeOptions) => AudioWorkletProcessor) & { parameterDescriptors?: AudioParamDescriptor[]; }): undefined;

class Bridge {
    wasm: WebAssembly.Instance;
    buffer: Uint8Array;

    bootstrap(wasm: WebAssembly.Instance) {
        this.wasm = wasm;
        this.buffer = new Uint8Array((wasm.exports.memory as WebAssembly.Memory).buffer);
    }

    getString(ptr: number, len: number): string {
        // Get a fresh Uint8Array if the wasm memory buffer was moved
        const buffer = (this.wasm.exports.memory as WebAssembly.Memory).buffer;
        if (this.buffer !== buffer) {
            this.buffer = new Uint8Array(buffer);
        }

        return String.fromCharCode.apply(null, this.buffer.slice(ptr, ptr + len));
    }

    wrap(fn: Function): Function {
        return (ptr: number, len: number) => {
            fn(this.getString(ptr, len));
        };
    }
}

//interface Kernel extends Omit<WebAssembly.Instance, "exports"> {
interface Kernel extends WebAssembly.Instance {
    exports: {
        initialize(): void;
        process(programSize: number): number;

        get_left_pointer(): number;
        get_right_pointer(): number;
        get_program_pointer(): number;

        handle_message(): void;

        memory: WebAssembly.Memory;
    }
};

class Processor extends AudioWorkletProcessor {
    wasm: Kernel;
    bridge: Bridge;

    sendBuffer: RingBuffer;
    receiveBuffer: RingBuffer;

    leftBuffer: Float32Array;
    rightBuffer: Float32Array;

    programBuffer: Uint8Array;

    constructor(options?: AudioWorkletNodeOptions) {
        super(options);

        this.port.onmessage = this.handleMessage;
    }

    handleMessage = (event: MessageEvent) => {
        if (event.data.command === "bootstrap") {
            this.bridge = new Bridge();

            const imports = {
                env: {
                    console_log: this.bridge.wrap(console.log),
                    console_error: this.bridge.wrap(console.error)
                }
            };

            WebAssembly.instantiate(event.data.kernel, imports).then(webAssembly => {
                this.wasm = webAssembly.instance as Kernel;
                this.bridge.bootstrap(this.wasm);

                //this._wasm.exports.memory.grow(250)

                this.wasm.exports.initialize();

                const bufferSize = 128; // Note: Web Audio API nodes use a fixed 128-sample buffer size per channel

                this.leftBuffer = new Float32Array(this.wasm.exports.memory.buffer, this.wasm.exports.get_left_pointer(), bufferSize);
                this.rightBuffer = new Float32Array(this.wasm.exports.memory.buffer, this.wasm.exports.get_right_pointer(), bufferSize);

                this.programBuffer = new Uint8Array(this.wasm.exports.memory.buffer, this.wasm.exports.get_program_pointer(), 1024);

                this.sendBuffer = new RingBuffer(event.data.sendStorage);
                this.receiveBuffer = new RingBuffer(event.data.receiveStorage);

                // Send initialization completed message
                // TODO: Use enum for this
                this.programBuffer[0] = 255;
                this.sendBuffer.write(this.programBuffer, 1);
            });
        } else {
            // TODO: Pass message to wasm
            console.log(event.data);
            this.wasm.exports.handle_message();
        }
    }

    process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
        if (!this.wasm) {
            return true;
        }

        // Send ringbuffer data to wasm
        let programSize = this.receiveBuffer.read(this.programBuffer, 1024);

        // Process inside wasm
        programSize = this.wasm.exports.process(programSize);
        outputs[0][0].set(this.leftBuffer);
        outputs[0][1].set(this.rightBuffer);

        // Send processed program buffer back to frontend
        if (programSize > 0) {
            this.sendBuffer.write(this.programBuffer, programSize);
        }

        return true;
    }
}

registerProcessor("kernel", Processor);
