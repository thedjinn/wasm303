use crate::kernel::SAMPLE_RATE;

const MAX_PATTERN_LENGTH: usize = 16;
const MAX_PATTERN_COUNT: usize = 8;

pub struct Step {
    pub pitch: u8,
    pub is_enabled: bool,
    pub has_accent: bool,
    pub has_slide: bool,
    pub has_down: bool,
    pub has_up: bool
}

impl Step {
    fn new() -> Self {
        Step {
            pitch: 36,
            is_enabled: true,
            has_accent: false,
            has_slide: false,
            has_down: false,
            has_up: false
        }
    }
}

struct Pattern {
    steps: Vec<Step>,
    length: usize
}

impl Pattern {
    fn new() -> Self {
        Pattern {
            steps: (0..MAX_PATTERN_LENGTH).map(|_| Step::new()).collect(),
            length: MAX_PATTERN_LENGTH
        }
    }
}

pub struct Sequencer {
    pub is_running: bool,
    pub sample_position: u32,
    step_length: u32,
    pub pattern_position: usize,

    patterns: Vec<Pattern>,
    current_pattern: usize,
    next_pattern: usize
}

impl Sequencer {
    pub fn new() -> Self {
        Sequencer {
            is_running: true,
            sample_position: 10000000,
            step_length: (SAMPLE_RATE / 8.0) as u32, // 120 bpm
            pattern_position: 10000000,

            patterns: (0..MAX_PATTERN_COUNT).map(|_| Pattern::new()).collect(),
            current_pattern: 0,
            next_pattern: 0
        }
    }

    pub fn set_pattern_data(&mut self, pattern_index: usize, step_index: usize, step: Step) {
        self.patterns[pattern_index].steps[step_index] = step;
    }

    pub fn set_tempo(&mut self, tempo: f32) {
        self.step_length = (SAMPLE_RATE * 60.0 / tempo / 4.0) as u32;
    }

    pub fn update(&mut self) -> Option<&Step> {
        if !self.is_running {
            // TODO: this.amp_env = 0
            return None;
        }

        self.sample_position += 1;
        if self.sample_position < self.step_length {
            return None;
        }

        // advance sequencer
        self.sample_position = 0;
        self.pattern_position += 1;

        // advance pattern if we reached the end
        if self.pattern_position >= self.patterns[self.current_pattern].length {
            self.pattern_position = 0;
            self.current_pattern = self.next_pattern;
        }

        // return new step
        Some(&self.patterns[self.current_pattern].steps[self.pattern_position])
    }
}

