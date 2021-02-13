const Opcode: {[identifier: string]: number} = {
    Nop: 0,
    SetCutoff: 10,
    SetResonance: 11,
    SetEnvMod: 12,
    SetDecay: 13,
    SetTempo: 14,
    SetTuning: 15,
    SetAccent: 16,
    SetDistortionThreshold: 17,
    SetDistortionShape: 18,
    SetDelaySend: 19,
    SetDelayFeedback: 20,
    SetWaveformIndex: 30,
    SetDelayLength: 31,
    SetSequencerStep: 32,
    Max: 33
};

export default Opcode;
