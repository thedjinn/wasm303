export default class RandomWalker {
    readonly averageFrequency: number;
    readonly sampleRate: number;

    private averageSegmentLength: number;
    private segmentLength: number;
    private segmentPosition: number;

    private frequencyOffset: number;
    private lastFrequencyOffset: number;
    private frequencyOffsetDelta: number;

    private phase: number;

    private previousSign: number;

    private amplitude: number;
    private targetAmplitude: number;
    private amplitudeCoefficient: number;

    constructor(averageFrequency: number, sampleRate: number) {
        this.averageFrequency = averageFrequency;
        this.sampleRate = sampleRate;

        this.averageSegmentLength = this.sampleRate / (1.0 * this.averageFrequency);

        this.segmentLength = 0.0;
        this.segmentPosition = this.segmentLength;

        this.lastFrequencyOffset = 0.0;
        this.frequencyOffsetDelta = 0.0;

        this.phase = Math.random() * 2.0 * Math.PI;

        this.previousSign = 0.0;

        this.amplitude = 0.25 + 0.75 * Math.random();
        this.targetAmplitude = this.amplitude;
        this.amplitudeCoefficient = Math.exp(-1.0 / (2.0 * this.sampleRate));
    }

    render(): number {
        // Check if the current segment has ended
        if (this.segmentPosition >= this.segmentLength) {
            // Set a new random segment length
            this.segmentLength = Math.floor(this.averageSegmentLength * (0.5 + Math.random()));

            // Compute target frequency offset and linear interpolation delta
            const newFrequencyOffset = 0.1 + 0.9 * Math.random();
            this.frequencyOffsetDelta = (newFrequencyOffset - this.lastFrequencyOffset) / this.segmentLength;
            this.frequencyOffset = this.lastFrequencyOffset;
            this.lastFrequencyOffset = newFrequencyOffset;

            // Reset segment position
            this.segmentPosition = 0;
        }

        // Oscillator
        const result = Math.sin(this.phase) * this.amplitude;

        // Move the amplitude towards the target amplitude (leaky integrator)
        this.amplitude = this.targetAmplitude + (this.amplitude - this.targetAmplitude) * this.amplitudeCoefficient;

        // Increment and wrap phase
        this.phase += 2.0 * Math.PI * this.averageFrequency * this.frequencyOffset / this.sampleRate;
        if (this.phase >= 2.0 * Math.PI) {
            this.phase -= 2.0 * Math.PI;
        }

        // Set a new target amplitude on zero crossings
        if (Math.sign(result) !== 0 && Math.sign(result) !== this.previousSign) {
            this.previousSign = Math.sign(result);
            this.targetAmplitude = 0.25 + 0.75 * Math.random();
        }

        // Increment counters
        this.segmentPosition += 1;
        this.frequencyOffset += this.frequencyOffsetDelta;

        return 0.5 + result * 0.5;
    }
}
