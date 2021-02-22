import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Thunk } from "../store";

import {
    Instruction
} from "../Engine";

import Opcode from "../Opcode";

interface Step {
    pitch: number;
    octaveUp: boolean;
    octaveDown: boolean;
    hasNote: boolean;
    hasSlide: boolean;
    hasAccent: boolean;
}

interface Pattern {
    steps: Step[];
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
            step(39, false, false, true,  false, true),
            step(42, false, false, true,  false, false),
            step(44, false, false, true,  false, false),
            step(46, false, false, true,  false, false),
            step(49, false, false, true,  false, false),
            step(51, false, false, true,  false, false),
            step(46, false, false, true,  false, false),
            step(49, false, false, true,  false, false),
            step(39, false, false, true,  false, false),
            step(42, false, false, true,  false, false),
            step(44, false, false, true,  false, false),
            step(49, false, false, true,  false, false),
            step(48, false, false, true,  false, false),
            step(41, false, false, false, true,  false),
            step(40, false, false, true,  false, false),
            step(47, false, false, false, true,  false)
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

    // TODO: Emit initial state instructions

    dispatch(slice.actions.setIsInitialized(true));
};

export const start = (): Thunk => (dispatch, getState, engine) => {
    engine.toggleStart();
    dispatch(setIsRunning(true));
};

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

export const {
    setIsInitialized,
    setIsRunning,

    setSequencerStep
} = slice.actions;

export default slice.reducer;
