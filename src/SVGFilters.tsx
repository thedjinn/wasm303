import React from "react";

export default function SVGFilters(): JSX.Element {
    return (
        <svg className="svg-filters" viewBox="0 0 100 100">
            <defs>
                <filter id="knobbevel" filterUnits="objectBoundingBox" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="bumpmap" />

                    <feSpecularLighting in="bumpmap" surfaceScale="9" specularConstant="1.3" specularExponent="10" result="specularmap" lightingColor="white">
                        <fePointLight x="-5000" y="-5000" z="8000" />
                    </feSpecularLighting>

                    <feComposite in="specularmap" in2="SourceAlpha" operator="in" result="specular" />
                    <feComposite in="SourceGraphic" in2="specular" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="beveled" />

                    <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                    <feOffset dx="2" dy="6" result="offsetblur" />

                    <feComponentTransfer result="blur1">
                        <feFuncA type="linear" slope="0.5" />
                    </feComponentTransfer>

                    <feGaussianBlur in="SourceAlpha" stdDeviation="9" />
                    <feOffset dx="4" dy="5" result="offsetblur" />

                    <feComponentTransfer result="blur2">
                        <feFuncA type="linear" slope="0.5" />
                    </feComponentTransfer>

                    <feMerge> 
                        <feMergeNode in="blur2" />
                        <feMergeNode in="blur1" />
                        <feMergeNode in="beveled" />
                    </feMerge>
                </filter>

                <filter id="knobinset" filterUnits="userSpaceOnUse" x="-50%" y="-50%" width="200%" height="200%">
                    <feComponentTransfer in="SourceAlpha">
                        <feFuncA type="table" tableValues="1 0" />
                    </feComponentTransfer>

                    <feGaussianBlur stdDeviation="1" />
                    <feOffset dx="0" dy="1" result="offsetblur"/>
                    <feFlood floodColor="rgb(0, 0, 0)" result="color"/>

                    <feComposite in2="offsetblur" operator="in" />
                    <feComposite in2="SourceAlpha" operator="in" result="darkshadow" />

                    <feComponentTransfer in="SourceAlpha">
                        <feFuncA type="table" tableValues="1 0" />
                    </feComponentTransfer>

                    <feGaussianBlur stdDeviation="0.5" />
                    <feOffset dx="0" dy="-0.5" result="offsetblur"/>
                    <feFlood floodColor="rgb(255, 128, 128)" result="color"/>

                    <feComposite in2="offsetblur" operator="in" />
                    <feComposite in2="SourceAlpha" operator="in" result="lightshadow" />

                    <feMerge>
                        <feMergeNode in="SourceGraphic" />
                        <feMergeNode in="lightshadow" />
                        <feMergeNode in="darkshadow" />
                    </feMerge>
                </filter>
            </defs>
        </svg>
    );
}
