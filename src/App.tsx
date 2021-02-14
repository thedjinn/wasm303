import React, { useCallback, useEffect, useState } from "react";

import Engine, {
    Instruction
} from "./Engine";

import Opcode from "./Opcode";

interface Props {
    engine: Engine
}

export default function App({
    engine
}: Props): JSX.Element {
    const [isInitialized, setIsInitialized] = useState(false);

    const [sequencerStep, setSequencerStep] = useState(0);

    const handleStart = useCallback(() => {
        engine.toggleStart();
    }, [engine]);

    const handleInstruction = useCallback((instruction: Instruction) => {
        switch (instruction.opcode) {
            case Opcode.Nop:
                break;
            case Opcode.BootstrapFinished:
                break;
            case Opcode.SetSequencerStep:
                console.log("set sequencer step", instruction.operand);
                setSequencerStep(instruction.operand);
                break;
            case Opcode.Max:
                break;
        }
    }, []);

    useEffect(() => {
        engine.initialize(handleInstruction).then(() => {
            setIsInitialized(true);
        }).catch(err => {
            console.error(err);
        });
    }, [engine, handleInstruction]);

    return (
        <div>
            <h1>r303</h1>

            {isInitialized || <p>Loading...</p>}

            <p>{sequencerStep}</p>

            <button onClick={handleStart}>Start</button>
        </div>
    );
}
