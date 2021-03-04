use std::f32::consts::PI;

use crate::kernel::SAMPLE_RATE;
use super::BiQuad;

impl BiQuad {
    pub fn lowpass_6db_butterworth(frequency: f32) -> Self {
        let omega = (2.0 * PI * frequency / SAMPLE_RATE) / 2.0;

        let tan_omega = omega.tan();
        let one_over_a0 = 1.0 / (2.0 + 2.0 * tan_omega);

        BiQuad {
            x1: 0.0,
            x2: 0.0,
            y1: 0.0,
            y2: 0.0,
            a1: (2.0 * tan_omega - 2.0) * one_over_a0,
            a2: 0.0,
            b0: 2.0 * tan_omega * one_over_a0,
            b1: 2.0 * tan_omega * one_over_a0,
            b2: 0.0
        }
    }

    pub fn highpass_6db_butterworth(frequency: f32) -> Self {
        let omega = (2.0 * PI * frequency / SAMPLE_RATE) / 2.0;

        let tan_omega = omega.tan();
        let one_over_a0 = 1.0 / (2.0 + 2.0 * tan_omega);

        BiQuad {
            x1: 0.0,
            x2: 0.0,
            y1: 0.0,
            y2: 0.0,
            a1: (2.0 * tan_omega - 2.0) * one_over_a0,
            a2: 0.0,
            b0: 2.0 * one_over_a0,
            b1: -2.0 * one_over_a0,
            b2: 0.0
        }
    }
}
