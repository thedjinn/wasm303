console.log("bootstrapped");

(async function() {
    // TODO: Load in parallel with worklet
    const response = await fetch("kernel.wasm");
    if (!response.ok) {
        throw Error("Error loading kernel: " + response.status);
    }

    const kernel = await response.arrayBuffer();
    console.log(kernel);

    // Initialize audio context
    const context = new AudioContext({
        sampleRate: 44100,
        latencyHint: "interactive"
    });

    // Load and instantiate worklet
    await context.audioWorklet.addModule("worklet2.js");

    const node = new AudioWorkletNode(context, "kernel", {
        numberOfInputs: 0,
        numberOfOutputs: 1,
        outputChannelCount: [2]
    });

    node.connect(context.destination);

    // Send kernel to worklet
    node.port.postMessage({
        command: "bootstrap",
        payload: kernel
    });

    console.log("Audio graph initialized");

    document.getElementById("start").addEventListener("click", event => {
        context.resume();
    });
})();

export default 0;
