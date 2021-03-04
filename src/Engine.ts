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

export type OpcodeWithoutOperand =
    typeof Opcode.Nop |
    typeof Opcode.BootstrapFinished;

export type OpcodeWithU32 =
    typeof Opcode.SetWaveformIndex |
    typeof Opcode.SetDelayLength |
    typeof Opcode.SetSequencerStep |
    typeof Opcode.SetPatternData;

export type OpcodeWithF32 =
    typeof Opcode.SetTuning |
    typeof Opcode.SetCutoff |
    typeof Opcode.SetResonance |
    typeof Opcode.SetEnvMod |
    typeof Opcode.SetDecay |
    typeof Opcode.SetAccent |
    typeof Opcode.SetDistortionThreshold |
    typeof Opcode.SetDistortionShape |
    typeof Opcode.SetDelaySend |
    typeof Opcode.SetDelayFeedback;

export type Opcode =
    OpcodeWithoutOperand |
    OpcodeWithU32 |
    OpcodeWithF32;

export const isOpcodeWithU32 = (x: Opcode): x is OpcodeWithU32 => (x >= 20 && x < 40) || (x >= 80 && x < 100);
export const isOpcodeWithF32 = (x: Opcode): x is OpcodeWithF32 => (x >= 40 && x < 60) || (x >= 100 && x < 120);

export interface InstructionWithoutOperand {
    opcode: OpcodeWithoutOperand
}

export interface InstructionWithU32 {
    opcode: OpcodeWithU32,
    operand: number
}

export interface InstructionWithF32 {
    opcode: OpcodeWithF32,
    operand: number
}

export type Instruction =
    InstructionWithoutOperand |
    InstructionWithU32 |
    InstructionWithF32;

const isInstructionWithU32 = (x: Instruction): x is InstructionWithU32 => isOpcodeWithU32(x.opcode);
const isInstructionWithF32 = (x: Instruction): x is InstructionWithF32 => isOpcodeWithF32(x.opcode);

export type InstructionCallback = (instruction: Instruction) => void;

export default class Engine {
    private sendBuffer: RingBuffer;
    private receiveBuffer: RingBuffer;

    private programBuffer: Uint8Array;
    private programDataView: DataView;

    private encodeBuffer: Uint8Array;
    private encodeDataView: DataView;

    private context: AudioContext;

    private resolveBootstrapPromise: () => void;

    private instructionCallback: InstructionCallback;

    async initialize(instructionCallback: InstructionCallback): Promise<void> {
        this.instructionCallback = instructionCallback;

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

        const sendStorage = new SharedArrayBuffer(32768);
        const receiveStorage = new SharedArrayBuffer(32768);

        this.sendBuffer = new RingBuffer(sendStorage);
        this.receiveBuffer = new RingBuffer(receiveStorage);

        this.programBuffer = new Uint8Array(1024);
        this.programDataView = new DataView(this.programBuffer.buffer);

        this.encodeBuffer = new Uint8Array(1024);
        this.encodeDataView = new DataView(this.encodeBuffer.buffer);

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

    sendInstruction(instruction: Instruction): void {
        let ptr = 0;
        this.encodeBuffer[ptr++] = instruction.opcode;

        if (isInstructionWithU32(instruction)) {
            this.encodeDataView.setUint32(ptr, instruction.operand, true);
            ptr += 4;
        } else if (isInstructionWithF32(instruction)) {
            this.encodeDataView.setFloat32(ptr, instruction.operand, true);
            ptr += 4;
        }

        this.sendBuffer.write(this.encodeBuffer, ptr);
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

    private *decodeInstructions(bytesToProcess: number): Generator<Instruction> {
        let ptr = 0;

        while (ptr < bytesToProcess) {
            const opcode = this.programBuffer[ptr++] as Opcode;

            // Extract operands
            if (isOpcodeWithU32(opcode)) {
                yield {
                    opcode,
                    operand: this.programDataView.getInt32(ptr, true)
                };

                ptr += 4;
            } else if (isOpcodeWithF32(opcode)) {
                yield {
                    opcode,
                    operand: this.programDataView.getFloat32(ptr, true)
                };

                ptr += 4;
            } else {
                yield { opcode };
            }
        }
    }

    private processInstructions(bytesToProcess: number): void {
        for (const instruction of this.decodeInstructions(bytesToProcess)) {
            if (instruction.opcode === Opcode.BootstrapFinished) {
                this.resolveBootstrapPromise();
            } else {
                this.instructionCallback(instruction);
            }
        }
    }

    private handleMessage: (event: Event) => void = (event: Event) => {
        console.log("message from worklet:", event);
    }
}
