import { useCallback, useEffect, useState } from "react";

import Engine from "./Engine";

interface Props {
    engine: Engine
};

export default function({
    engine
}: Props) {
    const [isInitialized, setIsInitialized] = useState(false);

    const handleStart = useCallback(() => {
        engine.toggleStart();
    }, [engine]);

    useEffect(() => {
        engine.initialize().then(() => {
            setIsInitialized(true);
        }).catch(err => {
            console.error(err);
        });
    }, [engine]);

    return (
        <div>
            <h1>r303</h1>

            {isInitialized || <p>Loading...</p>}

            <button onClick={handleStart}>Start</button>
        </div>
    );
};
