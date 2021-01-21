use crate::kernel::SAMPLE_RATE;

pub struct Step {
    pub pitch: u32,
    pub is_enabled: bool,
    pub has_accent: bool,
    pub has_slide: bool,
    pub has_down: bool,
    pub has_up: bool
}

struct Pattern {
    steps: Vec<Step>
}

pub struct Sequencer {
    pub is_running: bool,
    pub sample_position: u32,
    step_length: u32,
    pattern_position: usize,

    patterns: Vec<Pattern>,
    current_pattern: usize,
    next_pattern: usize
}

impl Sequencer {
    pub fn new() -> Self {
        return Sequencer {
            is_running: true,
            sample_position: 10000000,
            step_length: (SAMPLE_RATE / 8.0) as u32, // 120 bpm
            pattern_position: 10000000,

            patterns: Vec::new(),
            current_pattern: 0,
            next_pattern: 0
        }
    }

    pub fn demo() -> Self {
        let mut sequencer = Self::new();

        sequencer.patterns.push(Pattern {
            steps: vec![
                Step { pitch: 40, is_enabled: true, has_accent: true, has_slide: false, has_down: false, has_up: false },
                Step { pitch: 45, is_enabled: true, has_accent: false, has_slide: true, has_down: false, has_up: false },
                Step { pitch: 47, is_enabled: true, has_accent: false, has_slide: false, has_down: false, has_up: false },
                Step { pitch: 52, is_enabled: true, has_accent: false, has_slide: false, has_down: false, has_up: false },
                Step { pitch: 45, is_enabled: true, has_accent: true, has_slide: false, has_down: false, has_up: false },
                Step { pitch: 47, is_enabled: true, has_accent: false, has_slide: false, has_down: false, has_up: false },
                Step { pitch: 40, is_enabled: true, has_accent: false, has_slide: false, has_down: false, has_up: false },
                Step { pitch: 45, is_enabled: true, has_accent: false, has_slide: false, has_down: false, has_up: false },
                Step { pitch: 47, is_enabled: true, has_accent: true, has_slide: false, has_down: false, has_up: false },
                Step { pitch: 52, is_enabled: true, has_accent: false, has_slide: true, has_down: false, has_up: false },
                Step { pitch: 47, is_enabled: true, has_accent: false, has_slide: true, has_down: false, has_up: false },
                Step { pitch: 45, is_enabled: true, has_accent: false, has_slide: false, has_down: false, has_up: false },
                Step { pitch: 40, is_enabled: true, has_accent: true, has_slide: false, has_down: false, has_up: false },
                Step { pitch: 52, is_enabled: true, has_accent: false, has_slide: false, has_down: false, has_up: false },
                Step { pitch: 40, is_enabled: true, has_accent: false, has_slide: false, has_down: false, has_up: false },
                Step { pitch: 47, is_enabled: true, has_accent: false, has_slide: false, has_down: false, has_up: false }
            ]
        });

        return sequencer;
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
        if self.pattern_position >= self.patterns[self.current_pattern].steps.len() {
            self.pattern_position = 0;
            self.current_pattern = self.next_pattern;
        }

        // return new step
        return Some(&self.patterns[self.current_pattern].steps[self.pattern_position]);
    }
}

