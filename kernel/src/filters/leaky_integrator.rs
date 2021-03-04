use crate::kernel::{ANTI_DENORMAL, SAMPLE_RATE};
use super::LeakyIntegrator;

impl LeakyIntegrator {
    pub fn new(decay_time: f32) -> Self {
        Self {
            // Leaky integrator coefficient for reduction of 1/e in decay_time ms
            coefficient: (-1.0 / (0.001 * decay_time * SAMPLE_RATE)).exp(),
            y1: 0.0
        }
    }

    pub fn render(&mut self, sample: f32) -> f32 {
        self.y1 = sample + (self.y1 - sample) * self.coefficient + ANTI_DENORMAL;
        self.y1
    }
}
