import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Thunk } from "../store";

import {
    Instruction
} from "../Engine";

import {
    Pattern,
    Step
} from "../types";

import Opcode from "../Opcode";

function makeSetPatternDataInstruction(patternIndex: number, stepIndex: number, step: Step): Instruction {
    return {
        opcode: Opcode.SetPatternData,
        operand: (patternIndex << 0) +
            (stepIndex << 8) +
            (step.pitch << 16) +
            (+step.octaveDown << 28) +
            (+step.octaveUp << 27) +
            (+step.hasSlide << 26) +
            (+step.hasAccent << 25) +
            (+step.hasNote << 24)
    };
}

interface State {
    isInitialized: boolean;
    isRunning: boolean;

    waveformIndex: number;
    tuning: number;
    cutoff: number;
    resonance: number;
    envMod: number;
    decay: number;
    accent: number;

    distortionThreshold: number;
    distortionShape: number;

    delaySend: number;
    delayFeedback: number;
    delayLength: number;

    sequencerStep: number;

    patterns: Pattern[];
    currentPatternIndex: number;
}

function makeDemoPattern(): Pattern {
    function step(pitch: number, octaveUp: boolean, octaveDown: boolean, hasNote: boolean, hasSlide: boolean, hasAccent: boolean): Step {
        return { pitch, octaveUp, octaveDown, hasNote, hasSlide, hasAccent };
    }

    return {
        steps: [
            step(39, false, false, true, false,  true),
            step(42, false, false, true, false, false),
            step(44, false, false, true, false, false),
            step(46, false, false, true, false, false),
            step(37,  true, false, true, false, false),
            step(39,  true, false, true, false, false),
            step(46, false, false, true, false, false),
            step(37,  true, false, true, false, false),
            step(39, false, false, true, false, false),
            step(42, false, false, true, false, false),
            step(44, false, false, true, false, false),
            step(37,  true, false, true, false, false),
            step(48, false, false, true, false, false),
            step(41, false, false, true,  true, false),
            step(40, false, false, true, false, false),
            step(47, false, false, true,  true, false)
        ]
    };
}

const initialState: State = {
    isInitialized: false,
    isRunning: false,

    waveformIndex: 0,
    tuning: 0,
    cutoff: 2000.0,
    resonance: 0.2,
    envMod: 0.2,
    decay: 150.0,
    accent: 0.2,

    distortionThreshold: 0.5,
    distortionShape: 0.5,

    delaySend: 0.5,
    delayFeedback: 0.5,
    delayLength: 1000,

    sequencerStep: 0,

    patterns: [
        makeDemoPattern()
    ],
    currentPatternIndex: 0
};

const slice = createSlice({
    name: "r303",
    initialState,
    reducers: {
        setIsInitialized(state, action: PayloadAction<boolean>) {
            state.isInitialized = action.payload;
        },

        setPatternData(state, action: PayloadAction<{
            patternIndex: number,
            stepIndex: number,
            step: Step
        }>) {
            state.patterns[action.payload.patternIndex].steps[action.payload.stepIndex] = action.payload.step;
        },

        setIsRunning(state, action: PayloadAction<boolean>) {
            state.isRunning = action.payload;
        },

        setWaveformIndex(state, action: PayloadAction<number>) {
            state.waveformIndex = action.payload;
        },

        setTuning(state, action: PayloadAction<number>) {
            state.tuning = action.payload;
        },

        setCutoff(state, action: PayloadAction<number>) {
            state.cutoff = action.payload;
        },

        setResonance(state, action: PayloadAction<number>) {
            state.resonance = action.payload;
        },

        setEnvMod(state, action: PayloadAction<number>) {
            state.envMod = action.payload;
        },

        setDecay(state, action: PayloadAction<number>) {
            state.decay = action.payload;
        },

        setAccent(state, action: PayloadAction<number>) {
            state.accent = action.payload;
        },

        setDistortionThreshold(state, action: PayloadAction<number>) {
            state.distortionThreshold = action.payload;
        },

        setDistortionShape(state, action: PayloadAction<number>) {
            state.distortionShape = action.payload;
        },

        setDelaySend(state, action: PayloadAction<number>) {
            state.delaySend = action.payload;
        },

        setDelayFeedback(state, action: PayloadAction<number>) {
            state.delayFeedback = action.payload;
        },

        setDelayLength(state, action: PayloadAction<number>) {
            state.delayLength = action.payload;
        },

        setSequencerStep(state, action: PayloadAction<number>) {
            state.sequencerStep = action.payload;
        }
    }
});

const handleInstruction = (dispatch: Parameters<Thunk>[0]) => (instruction: Instruction): void => {
    switch (instruction.opcode) {
        case Opcode.Nop:
            break;
        case Opcode.BootstrapFinished:
            break;
        case Opcode.SetSequencerStep:
            dispatch(setSequencerStep(instruction.operand));
            break;
        case Opcode.SetCutoff:
            break;
    }
}

export const bootstrap = (): Thunk => async (dispatch, getState, engine) => {
    try {
        await engine.initialize(handleInstruction(dispatch));
    } catch (err) {
        console.error(err);
        // TODO: Set error state
        return;
    }

    // Emit initial state instructions
    const r303 = getState().r303;

    const instructions: Instruction[] = r303.patterns.flatMap(
        (pattern, patternIndex) => pattern.steps.map(
            (step, stepIndex) => makeSetPatternDataInstruction(patternIndex, stepIndex, step)
        )
    );

    instructions.push({ opcode: Opcode.SetWaveformIndex, operand: r303.waveformIndex });
    instructions.push({ opcode: Opcode.SetTuning, operand: r303.tuning });
    instructions.push({ opcode: Opcode.SetCutoff, operand: r303.cutoff });
    instructions.push({ opcode: Opcode.SetResonance, operand: r303.resonance });
    instructions.push({ opcode: Opcode.SetEnvMod, operand: r303.envMod });
    instructions.push({ opcode: Opcode.SetDecay, operand: r303.decay });
    instructions.push({ opcode: Opcode.SetAccent, operand: r303.accent });
    instructions.push({ opcode: Opcode.SetDistortionThreshold, operand: r303.distortionThreshold });
    instructions.push({ opcode: Opcode.SetDistortionShape, operand: r303.distortionShape });
    instructions.push({ opcode: Opcode.SetDelaySend, operand: r303.delaySend });
    instructions.push({ opcode: Opcode.SetDelayFeedback, operand: r303.delayFeedback });
    instructions.push({ opcode: Opcode.SetDelayLength, operand: r303.delayLength });

    engine.sendInstructions(instructions);

    dispatch(slice.actions.setIsInitialized(true));
};

export const start = (): Thunk => (dispatch, getState, engine) => {
    engine.toggleStart();
    dispatch(setIsRunning(true));
};

export const setCurrentPatternData = (stepIndex: number, step: Step): Thunk => (dispatch, getState, engine) => {
    const patternIndex = getState().r303.currentPatternIndex;
    engine.sendInstruction(makeSetPatternDataInstruction(patternIndex, stepIndex, step));

    dispatch(slice.actions.setPatternData({ patternIndex, stepIndex, step }));
}

export const setPatternData = (patternIndex: number, stepIndex: number, step: Step): Thunk => (dispatch, getState, engine) => {
    engine.sendInstruction(makeSetPatternDataInstruction(patternIndex, stepIndex, step));

    dispatch(slice.actions.setPatternData({ patternIndex, stepIndex, step }));
}

export const setWaveformIndex = (index: number): Thunk => (dispatch, getState, engine) => {
    engine.sendInstruction({
        opcode: Opcode.SetWaveformIndex,
        operand: index
    });

    dispatch(slice.actions.setWaveformIndex(index));
};

export const setTuning = (tuning: number): Thunk => (dispatch, getState, engine) => {
    engine.sendInstruction({
        opcode: Opcode.SetTuning,
        operand: tuning
    });

    dispatch(slice.actions.setTuning(tuning));
};

export const setCutoff = (cutoff: number): Thunk => (dispatch, getState, engine) => {
    engine.sendInstruction({
        opcode: Opcode.SetCutoff,
        operand: cutoff
    });

    dispatch(slice.actions.setCutoff(cutoff));
};

export const setResonance = (resonance: number): Thunk => (dispatch, getState, engine) => {
    engine.sendInstruction({
        opcode: Opcode.SetResonance,
        operand: resonance
    });

    dispatch(slice.actions.setResonance(resonance));
};

export const setEnvMod = (envMod: number): Thunk => (dispatch, getState, engine) => {
    engine.sendInstruction({
        opcode: Opcode.SetEnvMod,
        operand: envMod
    });

    dispatch(slice.actions.setEnvMod(envMod));
};

export const setDecay = (decay: number): Thunk => (dispatch, getState, engine) => {
    engine.sendInstruction({
        opcode: Opcode.SetDecay,
        operand: decay
    });

    dispatch(slice.actions.setDecay(decay));
};

export const setAccent = (accent: number): Thunk => (dispatch, getState, engine) => {
    engine.sendInstruction({
        opcode: Opcode.SetAccent,
        operand: accent
    });

    dispatch(slice.actions.setAccent(accent));
};

export const setDistortionThreshold = (threshold: number): Thunk => (dispatch, getState, engine) => {
    engine.sendInstruction({
        opcode: Opcode.SetDistortionThreshold,
        operand: threshold
    });

    dispatch(slice.actions.setDistortionThreshold(threshold));
};

export const setDistortionShape = (shape: number): Thunk => (dispatch, getState, engine) => {
    engine.sendInstruction({
        opcode: Opcode.SetDistortionShape,
        operand: shape
    });

    dispatch(slice.actions.setDistortionShape(shape));
};

export const setDelaySend = (send: number): Thunk => (dispatch, getState, engine) => {
    engine.sendInstruction({
        opcode: Opcode.SetDelaySend,
        operand: send
    });

    dispatch(slice.actions.setDelaySend(send));
};

export const setDelayFeedback = (feedback: number): Thunk => (dispatch, getState, engine) => {
    engine.sendInstruction({
        opcode: Opcode.SetDelayFeedback,
        operand: feedback
    });

    dispatch(slice.actions.setDelayFeedback(feedback));
};

export const setDelayLength = (length: number): Thunk => (dispatch, getState, engine) => {
    engine.sendInstruction({
        opcode: Opcode.SetDelayLength,
        operand: length
    });

    dispatch(slice.actions.setDelayLength(length));
};

export const {
    setIsInitialized,
    setIsRunning,

    setSequencerStep
} = slice.actions;

export default slice.reducer;
