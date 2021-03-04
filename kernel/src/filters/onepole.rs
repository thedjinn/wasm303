use std::f32::consts::PI;

use crate::kernel::{ANTI_DENORMAL, SAMPLE_RATE};
use super::OnePole;

impl OnePole {
    pub fn bypass() -> Self {
        OnePole {
            x1: 0.0,
            y1: 0.0,
            b0: 0.0,
            b1: 0.0,
            a1: 0.0
        }
    }

    pub fn high_pass(cutoff: f32) -> Self {
        let alpha = (-2.0 * PI * cutoff * (1.0 / SAMPLE_RATE)).exp();

        OnePole {
            x1: 0.0,
            y1: 0.0,
            b0: 0.5 * (1.0 + alpha),
            b1: -0.5 * (1.0 + alpha),
            a1: -alpha
        }
    }

    pub fn all_pass(cutoff: f32) -> Self {
        let tau = (PI * cutoff * (1.0 / SAMPLE_RATE)).tan();
        let alpha = (1.0 - tau) / (1.0 + tau);

        OnePole {
            x1: 0.0,
            y1: 0.0,
            b0: alpha,
            b1: 1.0,
            a1: alpha
        }
    }

    pub fn render(&mut self, x0: f32) -> f32 {
        self.y1 = self.b0 * x0 + self.b1 * self.x1 - self.a1 * self.y1 + ANTI_DENORMAL;
        self.x1 = x0;

        self.y1
    }
}
