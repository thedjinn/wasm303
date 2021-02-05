export default class RingBuffer {
    sharedArrayBuffer: SharedArrayBuffer;
    capacity: number;
    readPointer: Uint32Array;
    writePointer: Uint32Array;
    signalPointer: Int32Array;
    storage: Uint8Array;

    constructor(sharedArrayBuffer: SharedArrayBuffer) {
        this.sharedArrayBuffer = sharedArrayBuffer;
        this.capacity = this.sharedArrayBuffer.byteLength - 8;

        this.readPointer = new Uint32Array(this.sharedArrayBuffer, 0, 1);
        this.writePointer = new Uint32Array(this.sharedArrayBuffer, 4, 1);
        this.signalPointer = new Int32Array(this.sharedArrayBuffer, 4, 1);
        this.storage = new Uint8Array(this.sharedArrayBuffer, 8, this.sharedArrayBuffer.byteLength - 8);
    }

    read(buffer: Uint8Array, count: number): number {
        const readPointer = Atomics.load(this.readPointer, 0);
        const writePointer = Atomics.load(this.writePointer, 0);

        // Check if there is anything to read
        if (readPointer == writePointer) {
            return 0;
        }

        // Compute bytes to read and first/last split
        let bytesRead;
        if (writePointer > readPointer) {
            bytesRead = Math.min(writePointer - readPointer, count);
        } else {
            bytesRead = Math.min(writePointer + this.capacity - readPointer, count);
        }

        const firstHalf = Math.min(this.capacity - readPointer, bytesRead);
        const lastHalf = bytesRead - firstHalf;

        // Copy data
        for (let i=0; i < firstHalf; ++i) {
            buffer[i] = this.storage[readPointer + i];
        }

        for (let i=0; i < lastHalf; ++i) {
            buffer[firstHalf + i] = this.storage[i];
        }

        // Advance read pointer
        Atomics.store(this.readPointer, 0, (readPointer + bytesRead) % this.capacity);

        return bytesRead;
    }

    write(buffer: Uint8Array, count: number): number {
        const readPointer = Atomics.load(this.readPointer, 0);
        const writePointer = Atomics.load(this.writePointer, 0);

        // Check if there is still capacity left
        if ((writePointer + 1) % this.capacity == readPointer) {
            return 0;
        }

        // Compute bytes to write and first/last split
        let bytesWritten;
        if (writePointer >= readPointer) {
            bytesWritten = Math.min(readPointer - writePointer - 1 + this.capacity, count);
        } else {
            bytesWritten = Math.min(readPointer - writePointer - 1, count);
        }

        const firstHalf = Math.min(this.capacity - writePointer, bytesWritten);
        const lastHalf = bytesWritten - firstHalf;

        // Copy data
        for (let i=0; i < firstHalf; ++i) {
            this.storage[writePointer + i] = buffer[i];
        }

        for (let i=0; i < lastHalf; ++i) {
            this.storage[i] = buffer[firstHalf + i];
        }

        // Advance write pointer
        Atomics.store(this.writePointer, 0, (writePointer + bytesWritten) % this.capacity);

        // Notify reader
        Atomics.notify(this.signalPointer, 0);

        return bytesWritten;
    }
}
