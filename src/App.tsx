import React, { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import classNames from "classnames";

import { RootState } from "./reducers";
import Backdrop from "./Backdrop";
import Dial from "./Dial";
import RandomWalker from "./RandomWalker";

const randomWalker = new RandomWalker(0.1, 30);

import {
    bootstrap,
    setCutoff,
    setWaveformIndex,
    start
} from "./reducers/r303";

const visibleNotes = (function() {
    const result = [];

    for (let i = 52; i >= 30; --i) {
        result.push(i);
    }

    return result;
})();

export default function App(): JSX.Element {
    const dispatch = useDispatch();

    const isInitialized = useSelector((state: RootState) => state.r303.isInitialized);
    const sequencerStep = useSelector((state: RootState) => state.r303.sequencerStep);

    const cutoff = useSelector((state: RootState) => state.r303.cutoff);
    const waveformIndex = useSelector((state: RootState) => state.r303.waveformIndex);

    const pattern = useSelector((state: RootState) => state.r303.patterns[state.r303.currentPatternIndex]);

    const handleStart = useCallback(() => {
        dispatch(start());
    }, [dispatch]);

    const handleToggleWaveform = useCallback(() => {
        dispatch(setWaveformIndex(1 - waveformIndex));
    }, [dispatch, waveformIndex]);

    useEffect(() => {
        dispatch(bootstrap());
    }, [dispatch]);

    const handleChange = useCallback((value: number) => {
        dispatch(setCutoff(value));
    }, [dispatch]);

    const startRandomWalker = useCallback(() => {
        setInterval(() => {
            dispatch(setCutoff(20 + randomWalker.render() * 10000));
        }, 1000.0 / randomWalker.sampleRate);
    }, [dispatch]);

    return (
        <>
            <Backdrop />

            <div className="flex-column wide-spacing flex-1">
                <div className="flex-row wide-spacing">
                    <div className="box flex-row narrow-spacing">
                        <Dial value={cutoff} min={20} max={10000} onChange={handleChange} />
                        <Dial value={cutoff} min={20} max={10000} onChange={handleChange} isLogarithmic />
                    </div>

                    <div className="box" style={{flexDirection: "column", flex: 1}}>
                        <h1>r303</h1>

                        <div>
                            <div className="flex-row narrow-spacing" style={{alignItems: "center"}}>
                                <div className="display">
                                    Hello
                                </div>

                                <button onClick={handleStart}>Start</button>
                                <button onClick={handleToggleWaveform}>Toggle waveform</button>
                                <button onClick={startRandomWalker}>Enable random walker</button>

                                {isInitialized || <p>Loading...</p>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="box pattern">
                    {pattern.steps.map((step, index) => (
                        <div className={classNames("step", sequencerStep === index && "current")} key={"step" + index}>
                            {visibleNotes.map(note => (
                                <div className={classNames("note", step.pitch === note && "selected")} key={"note" + note}></div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
