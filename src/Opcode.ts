const Opcode = {
    Nop: 0,
    SetCutoff: 20,
    SetResonance: 21,
    SetEnvMod: 22,
    SetDecay: 23,
    SetTempo: 24,
    SetTuning: 25,
    SetAccent: 26,
    SetDistortionThreshold: 27,
    SetDistortionShape: 28,
    SetDelaySend: 29,
    SetDelayFeedback: 30,
    SetWaveformIndex: 40,
    SetDelayLength: 41,
    BootstrapFinished: 60,
    SetSequencerStep: 80,
    Max: 81
} as const;

export default Opcode;
