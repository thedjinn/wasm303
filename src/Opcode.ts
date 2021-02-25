const Opcode = {
    Nop: 0,
    SetWaveformIndex: 20,
    SetDelayLength: 21,
    SetPatternData: 22,
    SetCutoff: 40,
    SetResonance: 41,
    SetEnvMod: 42,
    SetDecay: 43,
    SetTempo: 44,
    SetTuning: 45,
    SetAccent: 46,
    SetDistortionThreshold: 47,
    SetDistortionShape: 48,
    SetDelaySend: 49,
    SetDelayFeedback: 50,
    BootstrapFinished: 60,
    SetSequencerStep: 80,
    Max: 81
} as const;

export default Opcode;
