export interface Step {
    pitch: number;
    octaveUp: boolean;
    octaveDown: boolean;
    hasNote: boolean;
    hasSlide: boolean;
    hasAccent: boolean;
}

export interface Pattern {
    steps: Step[];
}
