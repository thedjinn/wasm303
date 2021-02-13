import React, { useCallback, useEffect, useState } from "react";

import Engine, { Instruction } from "./Engine";

interface Props {
    engine: Engine
}

export default function App({
    engine
}: Props): JSX.Element {
    const [isInitialized, setIsInitialized] = useState(false);

    const handleStart = useCallback(() => {
        engine.toggleStart();
    }, [engine]);

    const handleInstruction = useCallback((instruction: Instruction) => {
        console.log(instruction);
        //console.log(instruction.operand);
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

            <button onClick={handleStart}>Start</button>
        </div>
    );
}
