import React from "react";

export default function Backdrop(): JSX.Element {
    return (
        <div className="backdrop">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <pattern id="pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse" patternTransform="rotate(-20 50 50)">
                        <rect x="0" y="0" width="100" height="100" fill="#204060" />
                        <line x1="13" y1="0" x2="13" y2="100" stroke="#1e4b70" strokeDasharray="1 1" strokeDashoffset="0.5" />
                        <line x1="38" y1="0" x2="38" y2="100" stroke="#1e4b70" strokeDasharray="1 1" strokeDashoffset="0.5" />
                        <line x1="63" y1="0" x2="63" y2="100" stroke="#1e4b70" strokeDasharray="1 1" strokeDashoffset="0.5" />
                        <line x1="88" y1="0" x2="88" y2="100" stroke="#1e4b70" strokeDasharray="1 1" strokeDashoffset="0.5" />
                        <line x1="0" y1="13" x2="100" y2="13" stroke="#1e4b70" strokeDasharray="1 1" strokeDashoffset="0.5" />
                        <line x1="0" y1="38" x2="100" y2="38" stroke="#1e4b70" strokeDasharray="1 1" strokeDashoffset="0.5" />
                        <line x1="0" y1="63" x2="100" y2="63" stroke="#1e4b70" strokeDasharray="1 1" strokeDashoffset="0.5" />
                        <line x1="0" y1="88" x2="100" y2="88" stroke="#1e4b70" strokeDasharray="1 1" strokeDashoffset="0.5" />
                        <line x1="25.5" y1="0" x2="25.5" y2="100" stroke="#2a567b" />
                        <line x1="50.5" y1="0" x2="50.5" y2="100" stroke="#2a567b" />
                        <line x1="75.5" y1="0" x2="75.5" y2="100" stroke="#2a567b" />
                        <line x1="0" y1="25.5" x2="100" y2="25.5" stroke="#2a567b" />
                        <line x1="0" y1="50.5" x2="100" y2="50.5" stroke="#2a567b" />
                        <line x1="0" y1="75.5" x2="100" y2="75.5" stroke="#2a567b" />
                        <line x1="0.5" y1="0" x2="0.5" y2="100" stroke="#4e7a9f" />
                        <line x1="0" y1="0.5" x2="100" y2="0.5" stroke="#4e7a9f" />
                    </pattern>

                    <radialGradient id="vignette" gradientUnits="userSpaceOnUse" r="100%">
                        <stop offset="0%" stopColor="rgba(0, 0, 0, 0.0)" />
                        <stop offset="100%" stopColor="rgba(0, 0, 0, 0.6)" />
                    </radialGradient>
                </defs>

                <rect fill="url(#pattern)" width="100%" height="100%" />
                <rect fill="url(#vignette)" width="100%" height="100%" />
            </svg>
        </div>
    );
}
