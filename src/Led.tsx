import React from "react";
import classNames from "classnames";

interface Props {
    isActive: boolean
}

export default function Led({
    isActive
}: Props): JSX.Element {
    return (
        <div className={classNames("led", isActive && "active")} />
    );
}
