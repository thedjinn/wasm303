use std::f32::consts::PI;

use crate::kernel::SAMPLE_RATE;
use super::{OnePole, TBFilter};

impl TBFilter {
    pub fn new() -> Self {
        TBFilter {
            y0: 0.0,
            y1: 0.0,
            y2: 0.0,
            y3: 0.0,
            y4: 0.0,
            b0: 0.0,
            g: 0.0,
            k: 0.0,
            resonance_skewed: 0.0,
            feedback_highpass: OnePole::high_pass(150.0)
        }
    }

    pub fn set_resonance(&mut self, resonance: f32) {
        self.resonance_skewed = (1.0 - (-3.0 * resonance).exp()) / (1.0 - (-3.0_f32).exp());
    }

    #[allow(clippy::excessive_precision)]
    pub fn update_coefficients(&mut self, cutoff: f32) {
        // Recalculate main filter coefficients
        // TODO: optimize into lookup table
        let wc = ((2.0 * PI) / SAMPLE_RATE) * cutoff;
        let fx = wc * 0.11253953951963826; // (1.0 / sqrt(2)) / (2.0 * PI)

        self.b0 = (0.00045522346 + 6.1922189 * fx) / (1.0 + 12.358354 * fx + 4.4156345 * (fx * fx));

        let k = fx * (fx * (fx * (fx * (fx * (fx + 7198.6997) - 5837.7917) - 476.47308) + 614.95611) + 213.87126) + 16.998792;
        self.g = (((k * 0.058823529411764705) - 1.0) * self.resonance_skewed + 1.0) * (1.0 + self.resonance_skewed);
        self.k = k * self.resonance_skewed;
    }

    pub fn render(&mut self, x0: f32) -> f32 {
        // TODO: Add anti-denormalization
        self.y0 = x0 - self.feedback_highpass.render(self.k * self.y4);
        self.y1 += 2.0 * self.b0 * (self.y0 -       self.y1 + self.y2);
        self.y2 +=       self.b0 * (self.y1 - 2.0 * self.y2 + self.y3);
        self.y3 +=       self.b0 * (self.y2 - 2.0 * self.y3 + self.y4);
        self.y4 +=       self.b0 * (self.y3 - 2.0 * self.y4);

        2.0 * self.g * self.y4
    }
}
