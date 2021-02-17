import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Thunk } from "../store";

import {
    Instruction
} from "../Engine";

import Opcode from "../Opcode";

interface State {
    isInitialized: boolean;
    isRunning: boolean;

    waveformIndex: number;
    cutoff: number;

    sequencerStep: number;
}

const initialState: State = {
    isInitialized: false,
    isRunning: false,

    waveformIndex: 0,
    cutoff: 2000.0,

    sequencerStep: 0
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

        setCutoff(state, action: PayloadAction<number>) {
            state.cutoff = action.payload;
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
        case Opcode.Max:
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

export const {
    setIsInitialized,
    setIsRunning,

    setCutoff,

    setSequencerStep
} = slice.actions;

export default slice.reducer;
