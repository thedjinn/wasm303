import React, { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { RootState } from "./reducers";
import Backdrop from "./Backdrop";
import Dial from "./Dial";
import RealDial from "./RealDial";
import RandomWalker from "./RandomWalker";
import Led from "./Led";
import LedButton from "./LedButton";
import Pattern from "./Pattern";

const randomWalker = new RandomWalker(0.1, 30);

import {
    bootstrap,
    setTuning,
    setCutoff,
    setResonance,
    setEnvMod,
    setDecay,
    setAccent,
    setDistortionThreshold,
    setDistortionShape,
    setDelaySend,
    setDelayFeedback,
    setDelayLength,
    setWaveformIndex,
    start
} from "./reducers/r303";

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

    const distortionThreshold = useSelector((state: RootState) => state.r303.distortionThreshold);
    const distortionShape = useSelector((state: RootState) => state.r303.distortionShape);
    const delaySend = useSelector((state: RootState) => state.r303.delaySend);
    const delayFeedback = useSelector((state: RootState) => state.r303.delayFeedback);
    const delayLength = useSelector((state: RootState) => state.r303.delayLength);

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

    const handleDistortionThresholdChange = useCallback((value: number) => {
        dispatch(setDistortionThreshold(value));
    }, [dispatch]);

    const handleDistortionShapeChange = useCallback((value: number) => {
        dispatch(setDistortionShape(value));
    }, [dispatch]);

    const handleDelaySendChange = useCallback((value: number) => {
        dispatch(setDelaySend(value));
    }, [dispatch]);

    const handleDelayFeedbackChange = useCallback((value: number) => {
        dispatch(setDelayFeedback(value));
    }, [dispatch]);

    const handleDelayLengthChange = useCallback((value: number) => {
        dispatch(setDelayLength(value));
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
                            <div className="flex-column flex-center">
                                <span className="label">TUNING</span>
                                <RealDial value={tuning} min={-12} max={12} onChange={handleTuningChange} />
                            </div>

                            <div className="flex-column flex-center">
                                <span className="label">CUT OFF FREQ</span>
                                <RealDial value={cutoff} min={20} max={10000} onChange={handleCutoffChange} isLogarithmic />
                            </div>

                            <div className="flex-column flex-center">
                                <span className="label">RESONANCE</span>
                                <RealDial value={resonance} min={0} max={1} onChange={handleResonanceChange} />
                            </div>

                            <div className="flex-column flex-center">
                                <span className="label">ENV MOD</span>
                                <RealDial value={envMod} min={0} max={1} onChange={handleEnvModChange} />
                            </div>

                            <div className="flex-column flex-center">
                                <span className="label">DECAY</span>
                                <RealDial value={decay} min={1} max={2000} onChange={handleDecayChange} isLogarithmic />
                            </div>

                            <div className="flex-column flex-center">
                                <span className="label">ACCENT</span>
                                <RealDial value={accent} min={0} max={1} onChange={handleAccentChange} />
                            </div>
                        </div>

                        <div className="half-box flex-row narrow-spacing">
                            <LedButton title="START" isActive={false} onClick={handleStart} />
                            <LedButton title="WAVEFORM" isActive={false} onClick={handleToggleWaveform} />
                            <LedButton title="RANDOM WALK" isActive={false} onClick={startRandomWalker} />

                            <Led isActive={isInitialized} />

                            {isInitialized || <p>Loading...</p>}
                        </div>
                    </div>

                    <div className="box flex-column">
                        <div className="flex-column flex-center">
                            <span className="label">THRESHOLD</span>
                            <RealDial value={distortionThreshold} min={0} max={1} onChange={handleDistortionThresholdChange} />
                        </div>

                        <div className="flex-column flex-center">
                            <span className="label">SHAPE</span>
                            <RealDial value={distortionShape} min={0} max={1} onChange={handleDistortionShapeChange} />
                        </div>
                    </div>

                    <div className="box flex-column">
                        <div className="flex-column flex-center">
                            <span className="label">SEND</span>
                            <RealDial value={delaySend} min={0} max={1} onChange={handleDelaySendChange} />
                        </div>

                        <div className="flex-column flex-center">
                            <span className="label">FEEDBACK</span>
                            <RealDial value={delayFeedback} min={0} max={0.99} onChange={handleDelayFeedbackChange} />
                        </div>

                        <div className="flex-column flex-center">
                            <span className="label">TIME</span>
                            <RealDial value={delayLength} min={50} max={2000} onChange={handleDelayLengthChange} />
                        </div>
                    </div>

                    <div className="box flex-column flex-1">
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

                <div className="flex-row flex-1">
                    <div className="box dark pattern-box flex-1">
                        <Pattern />
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
