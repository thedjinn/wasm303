import React, { MouseEvent, useCallback, useMemo, useState } from "react";

function polarToCartesian(centerX: number, centerY: number, radius: number, degrees: number): [number, number] {
    const radians = degrees * Math.PI / 180.0;

    // Note: we flip the Y axis because SVG has the origin at the top left.
    return [
        centerX + radius * Math.cos(radians),
        centerY - radius * Math.sin(radians)
    ];
}

// Note: ensure that startAngle <= endAngle
function makeArc(x: number, y: number, innerRadius: number, outerRadius: number, startAngle: number, endAngle: number): string {
    const innerStart = polarToCartesian(x, y, innerRadius, startAngle);
    const innerEnd = polarToCartesian(x, y, innerRadius, endAngle);
    const outerStart = polarToCartesian(x, y, outerRadius, startAngle);
    const outerEnd = polarToCartesian(x, y, outerRadius, endAngle);

    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return `M ${outerStart[0]} ${outerStart[1]} A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${outerEnd[0]} ${outerEnd[1]} L ${innerEnd[0]} ${innerEnd[1]} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${innerStart[0]} ${innerStart[1]} L ${outerStart[0]} ${outerStart[1]} Z`;
}

function clamp(x: number, min: number, max: number): number {
    return x > max ? max : (x < min ? min : x);
}

function computeValue(event: MouseEvent<SVGSVGElement>, gap: number, min: number, max: number, isLogarithmic: boolean): number {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.x - 0.5 * rect.width;
    const y = event.clientY - rect.y - 0.5 * rect.height;

    const value = clamp(((Math.atan2(-x, y) * (180.0 / Math.PI) + 360.0) % 360.0 - gap / 2) / (360.0 - gap), 0, 1);

    if (isLogarithmic) {
        return min * Math.exp(value * Math.log(max / min));
    } else {
        return min + value * (max - min);
    }
}

interface Props {
    size?: number;
    min?: number;
    max?: number;
    value: number;
    decimalCount?: number;
    isLogarithmic?: boolean

    onChange: (value: number) => void;
}

interface UseDial {
    handleMouseDown: (event: MouseEvent<SVGSVGElement>) => void;
    handleMouseMove: (event: MouseEvent<SVGSVGElement>) => void;
    normalizedValue: number;
}

function useDial(
    gap: number,
    min: number,
    max: number,
    value: number,
    isLogarithmic: boolean,
    onChange: (value: number) => void
): UseDial {
    const [isMouseDown, setIsMouseDown] = useState(false);

    const handleMouseDown = useCallback((event: MouseEvent<SVGSVGElement>) => {
        onChange(computeValue(event, gap, min, max, isLogarithmic));
        setIsMouseDown(true);

        window.addEventListener("mouseup", function(event) {
            setIsMouseDown(false);
        }, { once: true });
    }, [gap, min, max, onChange, isLogarithmic]);

    const handleMouseMove = useCallback((event: MouseEvent<SVGSVGElement>) => {
        onChange(computeValue(event, gap, min, max, isLogarithmic));
    }, [gap, min, max, onChange, isLogarithmic]);

    const normalizedValue = useMemo(() => {
        if (isLogarithmic) {
            return (Math.log(value) - Math.log(min)) / (Math.log(max) - Math.log(min));
        } else {
            return (value - min) / (max - min);
        }
    }, [min, max, value, isLogarithmic]);

    return {
        handleMouseDown,
        handleMouseMove: isMouseDown ? handleMouseMove : undefined,
        normalizedValue
    }
}

function TickMarkers({
    gap,
    tickCount,
    cx,
    cy,
    radius,
    markerLength
}: {
    gap: number;
    tickCount: number;
    cx: number;
    cy: number;
    radius: number;
    markerLength: number;
}): JSX.Element {
    const [thickPath, thinPath] = useMemo(() => {
        const startAngle = 270 - gap / 2;
        const endAngle = 270 + gap / 2 - 360;

        const thinPath = [];
        const thickPath = [];

        const tickCount = 10;

        for (let i = 0; i <= tickCount; ++i) {
            const angle = startAngle + (endAngle - startAngle) / tickCount * i;

            const outer = polarToCartesian(cx, cy, radius, angle);
            const inner = polarToCartesian(cx, cy, radius - markerLength, angle);

            const segment = `M ${outer[0]} ${outer[1]} L ${inner[0]} ${inner[1]}`;

            if (i === 0 || i === tickCount || i === tickCount / 2) {
                thickPath.push(segment);
            } else {
                thinPath.push(segment);
            }
        }

        return [thickPath.join(" "), thinPath.join(" ")];
    }, [gap, cx, cy, radius, markerLength]);

    return (
        <>
            <path d={thinPath} stroke="#060606" />
            <path d={thickPath} stroke="#060606" strokeWidth={1.75} />
        </>
    );
}

function DialProgress({
    value,
    gap,
    cx,
    cy,
    radius,
    innerRadius
}: {
    value: number;
    gap: number;
    cx: number;
    cy: number;
    radius: number;
    innerRadius: number;
}): JSX.Element {
    const startAngle = 270 - gap / 2;
    const endAngle = 270 + gap / 2 - 360;

    const backgroundArc = useMemo(() => makeArc(cx, cy, innerRadius, radius, endAngle, startAngle), [startAngle, endAngle, cx, cy, radius, innerRadius]);

    const foregroundArc = useMemo(() => {
        return makeArc(cx, cy, innerRadius, radius, endAngle + (1 - value) * (startAngle - endAngle), startAngle);
    }, [startAngle, endAngle, value, cx, cy, radius, innerRadius]);

    return (
        <g style={{filter: "url(#knobinset)"}}>
            <path d={backgroundArc} fill="darkred" />
            <path d={foregroundArc} fill="red" />
        </g>
    );
}

function Knob({
    gap,
    value,
    cx,
    cy,
    radius
}: {
    gap: number;
    value: number;
    cx: number;
    cy: number;
    radius: number;
}): JSX.Element {
    const markerPath = useMemo(() => {
        const startAngle = 270 - gap / 2;
        const endAngle = 270 + gap / 2 - 360;

        const angle = startAngle + (endAngle - startAngle) * value;

        const outer = polarToCartesian(cx, cy, radius, angle);
        const inner = polarToCartesian(cx, cy, radius - 7.5, angle);

        return `M ${outer[0]} ${outer[1]} L ${inner[0]} ${inner[1]}`;
    }, [gap, value, cx, cy, radius]);

    return (
        <>
            <circle cx={cx} cy={cy} r={radius} fill="#3c382e" style={{filter: "url(#knobbevel)"}} />
            <path d={markerPath} stroke="#ff0000" strokeWidth={3} style={{filter: "url(#knobinset)", mixBlendMode: "multiply"}} />
        </>
    );
}

export default function RealDial({
    min = 0,
    max = 1,
    value,
    decimalCount = 2,
    isLogarithmic = false,
    onChange,
    size = 80
}: Props): JSX.Element {
    const gap = 72;
    const halfSize = 0.5 * size;

    const dial = useDial(gap, min, max, value, isLogarithmic, onChange);

    return (
        <svg viewBox={`0 0 ${size} ${size}`} preserveAspectRatio="xMidYMid meet" width={size} height={size} onMouseDown={dial.handleMouseDown} onMouseMove={dial.handleMouseMove}>
            <DialProgress cx={halfSize} cy={halfSize} radius={halfSize - 10} innerRadius={halfSize - 15} gap={gap} value={dial.normalizedValue} />
            <TickMarkers cx={halfSize} cy={halfSize} radius={halfSize} markerLength={5} gap={gap + 4 / Math.PI} tickCount={10} />
            <Knob cx={halfSize} cy={halfSize} radius={halfSize - 20} gap={gap} value={dial.normalizedValue} />
        </svg>
    );
}
