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
    min?: number;
    max?: number;
    value: number;
    decimalCount?: number;
    isLogarithmic?: boolean

    onChange: (value: number) => void;
}

export default function Dial({
    min = 0,
    max = 1,
    value,
    decimalCount = 2,
    isLogarithmic = false,
    onChange
}: Props): JSX.Element {
    const gap = 90;
    const startAngle = 270 - gap / 2;
    const endAngle = 270 + gap / 2 - 360;

    const backgroundArc = useMemo(() => makeArc(50, 50, 30, 50, endAngle, startAngle), [startAngle, endAngle]);

    const foregroundArc = useMemo(() => {
        let ratio;
        if (isLogarithmic) {
            ratio = (Math.log(value) - Math.log(min)) / (Math.log(max) - Math.log(min));
        } else {
            ratio = (value - min) / (max - min);
        }

        return makeArc(50, 50, 30, 50, endAngle + (1 - ratio) * (startAngle - endAngle), startAngle);
    }, [startAngle, endAngle, min, max, value, isLogarithmic]);

    const [isMouseDown, setIsMouseDown] = useState(false);

    const handleMouseDown = useCallback((event: MouseEvent<SVGSVGElement>) => {
        onChange(computeValue(event, gap, min, max, isLogarithmic));
        setIsMouseDown(true);

        window.addEventListener("mouseup", function(event) {
            setIsMouseDown(false);
        }, { once: true });
    }, [min, max, onChange, isLogarithmic]);

    const handleMouseMove = useCallback((event: MouseEvent<SVGSVGElement>) => {
        onChange(computeValue(event, gap, min, max, isLogarithmic));
    }, [min, max, onChange, isLogarithmic]);

    return (
        <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" width="200" height="100" onMouseDown={handleMouseDown} onMouseMove={isMouseDown ? handleMouseMove : undefined}>
            <path d={backgroundArc} fill="darkred" />
            <path d={foregroundArc} fill="red" />

            <text x="50" y="50" textAnchor="middle" dominantBaseline="middle" fill="#000">{value.toFixed(decimalCount)}</text>
        </svg>
    );
}
