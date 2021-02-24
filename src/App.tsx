import React, { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import classNames from "classnames";

import { RootState } from "./reducers";
import Backdrop from "./Backdrop";
import Dial from "./Dial";
import RandomWalker from "./RandomWalker";
import Led from "./Led";
import LedButton from "./LedButton";

const randomWalker = new RandomWalker(0.1, 30);

import {
    bootstrap,
    setTuning,
    setCutoff,
    setResonance,
    setEnvMod,
    setDecay,
    setAccent,
    setWaveformIndex,
    start
} from "./reducers/r303";

const noteNames = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

const visibleNotes = (function() {
    const result: [number, boolean][] = [];

    //for (let i = 60; i >= 36; --i) {
    for (let i = 48; i >= 36; --i) {
        const pitchClass = i % 12;
        const isBlack = pitchClass === 1 ||
            pitchClass === 3 ||
            pitchClass === 6 ||
            pitchClass === 8 ||
            pitchClass === 10;

        result.push([i, isBlack]);
    }

    return result;
})();

export default function App(): JSX.Element {
    const dispatch = useDispatch();

    const isInitialized = useSelector((state: RootState) => state.r303.isInitialized);
    const sequencerStep = useSelector((state: RootState) => state.r303.sequencerStep);

    const tuning = useSelector((state: RootState) => state.r303.tuning);
    const cutoff = useSelector((state: RootState) => state.r303.cutoff);
    const resonance = useSelector((state: RootState) => state.r303.resonance);
    const envMod = useSelector((state: RootState) => state.r303.envMod);
    const decay = useSelector((state: RootState) => state.r303.decay);
    const accent = useSelector((state: RootState) => state.r303.accent);
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

    const handleTuningChange = useCallback((value: number) => {
        dispatch(setTuning(value));
    }, [dispatch]);

    const handleCutoffChange = useCallback((value: number) => {
        dispatch(setCutoff(value));
    }, [dispatch]);

    const handleResonanceChange = useCallback((value: number) => {
        dispatch(setResonance(value));
    }, [dispatch]);

    const handleEnvModChange = useCallback((value: number) => {
        dispatch(setEnvMod(value));
    }, [dispatch]);

    const handleDecayChange = useCallback((value: number) => {
        dispatch(setDecay(value));
    }, [dispatch]);

    const handleAccentChange = useCallback((value: number) => {
        dispatch(setAccent(value));
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
                    <div className="flex-column">
                        <div className="box flex-row narrow-spacing">
                            <Dial value={tuning} min={-12} max={12} onChange={handleTuningChange} />
                            <Dial value={cutoff} min={20} max={10000} onChange={handleCutoffChange} isLogarithmic />
                            <Dial value={resonance} min={0} max={1} onChange={handleResonanceChange} />
                            <Dial value={envMod} min={0} max={1} onChange={handleEnvModChange} />
                            <Dial value={decay} min={0} max={2000} onChange={handleDecayChange} isLogarithmic />
                            <Dial value={accent} min={0} max={1} onChange={handleAccentChange} />
                        </div>

                        <div className="half-box flex-row narrow-spacing">
                            <LedButton title="START" isActive={false} onClick={handleStart} />
                            <LedButton title="WAVEFORM" isActive={false} onClick={handleToggleWaveform} />
                            <LedButton title="RANDOM WALK" isActive={false} onClick={startRandomWalker} />

                            <Led isActive={isInitialized} />

                            {isInitialized || <p>Loading...</p>}
                        </div>
                    </div>

                    <div className="box" style={{flexDirection: "column", flex: 1}}>
                        <h1>r303</h1>

                        <div>
                            <div className="flex-row narrow-spacing" style={{alignItems: "center"}}>
                                <div className="display" style={{width: "64px", textAlign: "center"}}>
                                    {sequencerStep}
                                </div>

                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-row">
                    <div className="box dark pattern-box flex-1">
                        <div className="pattern">
                            <div className="piano-roll">
                                {visibleNotes.map(([note, isBlackKey]) => (
                                    <div className={classNames("piano-key", isBlackKey && "black-key")} key={"note" + note}>{noteNames[note % 12]}</div>
                                ))}

                                <div className="gap"></div>
                            </div>

                            {pattern.steps.map((step, index) => (
                                <div className={classNames("step", sequencerStep === index && "current")} key={"step" + index}>
                                    {visibleNotes.map(([note, isBlackKey]) => (
                                        <div className={classNames("note", step.pitch === note && "selected", isBlackKey && "black-key")} key={"note" + note}></div>
                                    ))}

                                    <div className="step-indicator"></div>

                                    <div className="modifiers flex-row">
                                        <div className="flex-column flex-1">
                                            <div className={classNames("modifier", step.hasSlide && "active")}>slide</div>
                                            <div className={classNames("modifier", step.hasAccent && "active")}>accent</div>
                                        </div>

                                        <div className="flex-column flex-1">
                                            <div className={classNames("modifier", step.octaveUp && "up")}>up</div>
                                            <div className={classNames("modifier", step.octaveDown && "down")}>down</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="half-box dark">
                        <div className="flex-column narrow-spacing">
                            <button>Clear</button>
                            <button>Randomize</button>
                            <button>Retrograde</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
