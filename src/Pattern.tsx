import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import classNames from "classnames";

import { RootState } from "./reducers";
import { Step } from "./types";
import memoize from "./memoize";

import {
    setCurrentPatternData
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

interface StepColumnProps {
    step: Step;
    index: number;
}

function StepColumn({
    step,
    index
}: StepColumnProps): JSX.Element {
    const dispatch = useDispatch();

    const sequencerStep = useSelector((state: RootState) => state.r303.sequencerStep);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const makeHandleClick = useCallback(memoize((note: number) => () => {
        dispatch(setCurrentPatternData(index, {
            ...step,
            pitch: note
        }));
    }), [index, step, dispatch]);

    const handleSlideToggle = useCallback(() => {
        dispatch(setCurrentPatternData(index, {
            ...step,
            hasSlide: !step.hasSlide
        }));
    }, [index, step, dispatch]);

    const handleAccentToggle = useCallback(() => {
        dispatch(setCurrentPatternData(index, {
            ...step,
            hasAccent: !step.hasAccent
        }));
    }, [index, step, dispatch]);

    const handleOctaveUpToggle = useCallback(() => {
        dispatch(setCurrentPatternData(index, {
            ...step,
            octaveUp: !step.octaveUp
        }));
    }, [index, step, dispatch]);

    const handleOctaveDownToggle = useCallback(() => {
        dispatch(setCurrentPatternData(index, {
            ...step,
            octaveDown: !step.octaveDown
        }));
    }, [index, step, dispatch]);

    return (
        <div className={classNames("step", sequencerStep === index && "current")} key={"step" + index}>
            {visibleNotes.map(([note, isBlackKey]) => (
                <div className={classNames("note", step.pitch === note && "selected", isBlackKey && "black-key")} key={"note" + note} onClick={makeHandleClick(note)}></div>
            ))}

            <div className="step-indicator"></div>

            <div className="modifiers flex-row">
                <div className="flex-column flex-1">
                    <div className={classNames("modifier", step.hasSlide && "active")} onClick={handleSlideToggle}>slide</div>
                    <div className={classNames("modifier", step.hasAccent && "active")} onClick={handleAccentToggle}>accent</div>
                </div>

                <div className="flex-column flex-1">
                    <div className={classNames("modifier", step.octaveUp && "active")} onClick={handleOctaveUpToggle}>up</div>
                    <div className={classNames("modifier", step.octaveDown && "active")} onClick={handleOctaveDownToggle}>down</div>
                </div>
            </div>
        </div>
    );
}

export default function Pattern(): JSX.Element {
    const pattern = useSelector((state: RootState) => state.r303.patterns[state.r303.currentPatternIndex]);

    return (
        <div className="pattern">
            <div className="piano-roll">
                {visibleNotes.map(([note, isBlackKey]) => (
                    <div className={classNames("piano-key", isBlackKey && "black-key")} key={"note" + note}>{noteNames[note % 12]}</div>
                ))}

                <div className="gap"></div>
            </div>

            {pattern.steps.map((step, index) => (
                <StepColumn step={step} index={index} key={"step" + index} />
            ))}
        </div>
    );
}
