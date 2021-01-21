console.log("worklet bootstrapped");

interface AudioWorkletProcessor {
    readonly port: MessagePort;

    process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean;
}

declare var AudioWorkletProcessor: {
    prototype: AudioWorkletProcessor;

    new (options?: AudioWorkletNodeOptions): AudioWorkletProcessor;
};

declare function registerProcessor(name: string, processorCtor: (new (options?: AudioWorkletNodeOptions) => AudioWorkletProcessor) & { parameterDescriptors?: AudioParamDescriptor[]; }): undefined;

//interface Kernel extends Omit<WebAssembly.Instance, "exports"> {
interface Kernel extends WebAssembly.Instance {
    exports: {
        initialize(): void;
        process(): void;

        get_left_pointer(): number;
        get_right_pointer(): number;

        handle_message(): void;

        memory: WebAssembly.Memory;
    }
};

class Processor extends AudioWorkletProcessor {
    wasm: Kernel;

    leftBuffer: Float32Array;
    rightBuffer: Float32Array;

    constructor(options?: AudioWorkletNodeOptions) {
        super(options);

        this.port.onmessage = this.handleMessage;
    }

    handleMessage = (event: MessageEvent) => {
        console.log(event.data);

        if (event.data.command === "bootstrap") {
            const imports = {
                env: {
                }
            };

            WebAssembly.instantiate(event.data.payload, imports).then(webAssembly => {
                this.wasm = webAssembly.instance as Kernel;

                //this._wasm.exports.memory.grow(250)

                console.log(this.wasm.exports.initialize());

                const bufferSize = 128; // Note: Web Audio API nodes use a fixed 128-sample buffer size per channel

                this.leftBuffer = new Float32Array(this.wasm.exports.memory.buffer, this.wasm.exports.get_left_pointer(), bufferSize);
                this.rightBuffer = new Float32Array(this.wasm.exports.memory.buffer, this.wasm.exports.get_right_pointer(), bufferSize);

                console.log("Kernel initialized");
            });
        } else {
            // TODO: Pass message to wasm
            this.wasm.exports.handle_message();
        }
    }

    process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: Record<string, Float32Array>): boolean {
        if (!this.wasm) {
            return true;
        }

        // Process inside wasm
        this.wasm.exports.process();
        outputs[0][0].set(this.leftBuffer);
        outputs[0][1].set(this.rightBuffer);

        return true;
    }
}

registerProcessor("kernel", Processor);
