import React from "react";
import classNames from "classnames";

interface Props {
    title: string;
    isActive: boolean;
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
}

export default function LedButton({
    title,
    isActive,
    onClick
}: Props): JSX.Element {
    return (
        <div className="led-button-wrapper">
            <div className={classNames("led", isActive && "active")}></div>
            <button onClick={onClick}></button>
            <span className="label">{title}</span>
        </div>
    );
}
