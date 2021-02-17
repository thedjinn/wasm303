import React, { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { RootState } from "./reducers";

import {
    bootstrap,
    setWaveformIndex,
    start
} from "./reducers/r303";

export default function App(): JSX.Element {
    const dispatch = useDispatch();

    const isInitialized = useSelector((state: RootState) => state.r303.isInitialized);
    const sequencerStep = useSelector((state: RootState) => state.r303.sequencerStep);

    const waveformIndex = useSelector((state: RootState) => state.r303.waveformIndex);

    const handleStart = useCallback(() => {
        dispatch(start());
    }, [dispatch]);

    const handleToggleWaveform = useCallback(() => {
        dispatch(setWaveformIndex(1 - waveformIndex));
    }, [dispatch, waveformIndex]);

    useEffect(() => {
        dispatch(bootstrap());
    }, [dispatch]);

    return (
        <div>
            <h1>r303</h1>

            {isInitialized || <p>Loading...</p>}

            <p>{sequencerStep}</p>

            <button onClick={handleStart}>Start</button>
            <button onClick={handleToggleWaveform}>Toggle waveform</button>
        </div>
    );
}
