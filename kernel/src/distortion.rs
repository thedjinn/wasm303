pub struct FoldbackDistortion {
    shape: f32, // 0..1

    gain: f32,
    effective_threshold: f32
}

impl FoldbackDistortion {
    pub fn new() -> Self {
        Self {
            shape: 0.5,

            gain: 2.0,
            effective_threshold: 0.5
        }
    }

    // 0.1..1
    pub fn set_threshold(&mut self, threshold: f32) {
        self.effective_threshold = 1.0 - 0.9 * threshold;
        self.gain = 1.0 / self.effective_threshold;
    }

    pub fn render(&self, sample: f32) -> f32 {
        if sample.abs() > self.effective_threshold {
            let clipped = sample.signum() * self.effective_threshold;
            let a = (1.0 - self.shape) * clipped + self.shape * sample;

            // wrap around
            return (((a - self.effective_threshold) % (self.effective_threshold * 4.0).abs() - self.effective_threshold * 2.0).abs() - self.effective_threshold) * self.gain;
        } else {
            return sample * self.gain;
        }
    }
}
