use std::f32::consts::{LN_2, PI};

use crate::kernel::SAMPLE_RATE;
use super::BiQuad;

// This file contains BiQuad filters modeled after Robert Bristow-Johnson's filter cookbook.

impl BiQuad {
    pub fn lowpass_12db(frequency: f32, q: f32) -> Self {
        let omega = 2.0 * PI * frequency / SAMPLE_RATE;
        let sin_omega = omega.sin();
        let cos_omega = omega.cos();
        let alpha = sin_omega / (2.0 * q);

        let one_over_a0 = 1.0 / (1.0 + alpha);

        BiQuad {
            x1: 0.0,
            x2: 0.0,
            y1: 0.0,
            y2: 0.0,
            a1: -2.0 * cos_omega * one_over_a0,
            a2: (1.0 - alpha) * one_over_a0,
            b0: 0.5 * (1.0 - cos_omega) * one_over_a0,
            b1: (1.0 - cos_omega) * one_over_a0,
            b2: 0.5 * (1.0 - cos_omega) * one_over_a0
        }
    }

    pub fn highpass_12db(frequency: f32, q: f32) -> Self {
        let omega = 2.0 * PI * frequency / SAMPLE_RATE;
        let sin_omega = omega.sin();
        let cos_omega = omega.cos();
        let alpha = sin_omega / (2.0 * q);

        let one_over_a0 = 1.0 / (1.0 + alpha);

        BiQuad {
            x1: 0.0,
            x2: 0.0,
            y1: 0.0,
            y2: 0.0,
            a1: -2.0 * cos_omega * one_over_a0,
            a2: (1.0 - alpha) * one_over_a0,
            b0: 0.5 * (1.0 + cos_omega) * one_over_a0,
            b1: -(1.0 + cos_omega) * one_over_a0,
            b2: 0.5 * (1.0 + cos_omega) * one_over_a0
        }
    }

    pub fn bandpass_constant_skirt_gain(frequency: f32, bandwidth: f32) -> Self {
        // Constant skirt gain
        // Note: q = peak gain
        let omega = 2.0 * PI * frequency / SAMPLE_RATE;
        let sin_omega = omega.sin();
        let cos_omega = omega.cos();
        let alpha = sin_omega * (0.5 * LN_2 * bandwidth * (omega / sin_omega)).sinh();

        let one_over_a0 = 1.0 / (1.0 + alpha);

        BiQuad {
            x1: 0.0,
            x2: 0.0,
            y1: 0.0,
            y2: 0.0,
            a1: -2.0 * cos_omega * one_over_a0,
            a2: (1.0 - alpha) * one_over_a0,
            b0: 0.5 * sin_omega * one_over_a0, // equal to q * alpha
            b1: 0.0,
            b2: -0.5 * sin_omega * one_over_a0 //equal to -q * alpha
        }
    }

    pub fn bandpass_constant_peak_gain(frequency: f32, bandwidth: f32) -> Self {
        // Constant 0 dB peak gain
        let omega = 2.0 * PI * frequency / SAMPLE_RATE;
        let sin_omega = omega.sin();
        let cos_omega = omega.cos();
        let alpha = sin_omega * (0.5 * LN_2 * bandwidth * (omega / sin_omega)).sinh();

        let one_over_a0 = 1.0 / (1.0 + alpha);

        BiQuad {
            x1: 0.0,
            x2: 0.0,
            y1: 0.0,
            y2: 0.0,
            a1: -2.0 * cos_omega * one_over_a0,
            a2: (1.0 - alpha) * one_over_a0,
            b0: alpha * one_over_a0,
            b1: 0.0,
            b2: -alpha * one_over_a0
        }
    }

    pub fn notch(frequency: f32, bandwidth: f32) -> Self {
        // TODO: Verify correctness
        let omega = 2.0 * PI * frequency / SAMPLE_RATE;
        let sin_omega = omega.sin();
        let cos_omega = omega.cos();
        let alpha = sin_omega * (0.5 * LN_2 * bandwidth * (omega / sin_omega)).sinh();

        let one_over_a0 = 1.0 / (1.0 + alpha);

        BiQuad {
            x1: 0.0,
            x2: 0.0,
            y1: 0.0,
            y2: 0.0,
            a1: -2.0 * cos_omega * one_over_a0,
            a2: (1.0 - alpha) * one_over_a0,
            b0: 1.0 * one_over_a0,
            b1: (-2.0 * cos_omega) * one_over_a0,
            b2: 1.0 * one_over_a0
        }
    }

    pub fn allpass(frequency: f32, q: f32) -> Self {
        let omega = 2.0 * PI * frequency / SAMPLE_RATE;
        let sin_omega = omega.sin();
        let cos_omega = omega.cos();
        let alpha = sin_omega / (2.0 * q);

        let one_over_a0 = 1.0 / (1.0 + alpha);

        BiQuad {
            x1: 0.0,
            x2: 0.0,
            y1: 0.0,
            y2: 0.0,
            a1: -2.0 * cos_omega * one_over_a0,
            a2: (1.0 - alpha) * one_over_a0,
            b0: (1.0 - alpha) * one_over_a0,
            b1: -2.0 * cos_omega * one_over_a0,
            b2: (1.0 + alpha) * one_over_a0
        }
    }

    pub fn peaking_eq(frequency: f32, gain: f32, bandwidth: f32) -> Self {
        // Note: gain is specified in decibels, can be positive or negative
        let a = 10.0_f32.powf(gain / 40.0);
        let omega = 2.0 * PI * frequency / SAMPLE_RATE;
        let sin_omega = omega.sin();
        let cos_omega = omega.cos();
        let alpha = sin_omega * (0.5 * LN_2 * bandwidth * (omega / sin_omega)).sinh();

        let one_over_a0 = 1.0 / (1.0 + alpha / a);

        BiQuad {
            x1: 0.0,
            x2: 0.0,
            y1: 0.0,
            y2: 0.0,
            a1: -2.0 * cos_omega * one_over_a0,
            a2: (1.0 - alpha / a) * one_over_a0,
            b0: (1.0 + alpha * a) * one_over_a0,
            b1: -2.0 * cos_omega * one_over_a0,
            b2: (1.0 - alpha * a) * one_over_a0
        }
    }

    pub fn low_shelf(frequency: f32, gain: f32, shelf_slope: f32) -> Self {
        // Note: gain is specified in decibels, can be positive or negative
        // Note: shelf slope is specified in decibels per octave. Set to 0.5 * sqrt(2) to have
        // sharpest slope that is still monotonic. Smaller vallues will generate a peak in the
        // response. Larger values will make the slope more gradual.
        let a = 10.0_f32.powf(gain / 40.0);
        let omega = 2.0 * PI * frequency / SAMPLE_RATE;
        let sin_omega = omega.sin();
        let cos_omega = omega.cos();
        let alpha = 0.5 * sin_omega * ((a + 1.0 / a) * (1.0 / shelf_slope - 1.0) + 2.0).sqrt();

        let two_sqrt_a_alpha = 2.0 * a.sqrt() * alpha;
        let one_over_a0 = 1.0 / ((a + 1.0) + (a - 1.0) * cos_omega + two_sqrt_a_alpha);

        BiQuad {
            x1: 0.0,
            x2: 0.0,
            y1: 0.0,
            y2: 0.0,
            a1: -2.0 * ((a - 1.0) + (a + 1.0) * cos_omega) * one_over_a0,
            a2: ((a + 1.0) + (a - 1.0) * cos_omega - two_sqrt_a_alpha) * one_over_a0,
            b0: a * ((a + 1.0) - (a - 1.0) * cos_omega + two_sqrt_a_alpha) * one_over_a0,
            b1: 2.0 * a * ((a - 1.0) - (a + 1.0) * cos_omega) * one_over_a0,
            b2: a * ((a + 1.0) - (a - 1.0) * cos_omega - two_sqrt_a_alpha) * one_over_a0
        }
    }

    pub fn high_shelf(frequency: f32, gain: f32, shelf_slope: f32) -> Self {
        // Note: gain is specified in decibels, can be positive or negative
        // Note: shelf slope is specified in decibels per octave. Set to 0.5 * sqrt(2) to have
        // sharpest slope that is still monotonic. Smaller vallues will generate a peak in the
        // response. Larger values will make the slope more gradual.
        let a = 10.0_f32.powf(gain / 40.0);
        let omega = 2.0 * PI * frequency / SAMPLE_RATE;
        let sin_omega = omega.sin();
        let cos_omega = omega.cos();
        let alpha = 0.5 * sin_omega * ((a + 1.0 / a) * (1.0 / shelf_slope - 1.0) + 2.0).sqrt();

        let two_sqrt_a_alpha = 2.0 * a.sqrt() * alpha;
        let one_over_a0 = 1.0 / ((a + 1.0) - (a - 1.0) * cos_omega + two_sqrt_a_alpha);

        BiQuad {
            x1: 0.0,
            x2: 0.0,
            y1: 0.0,
            y2: 0.0,
            a1: 2.0 * ((a - 1.0) - (a + 1.0) * cos_omega) * one_over_a0,
            a2: ((a + 1.0) - (a - 1.0) * cos_omega - two_sqrt_a_alpha) * one_over_a0,
            b0: a * ((a + 1.0) + (a - 1.0) * cos_omega + two_sqrt_a_alpha) * one_over_a0,
            b1: -2.0 * a * ((a - 1.0) + (a + 1.0) * cos_omega) * one_over_a0,
            b2: a * ((a + 1.0) + (a - 1.0) * cos_omega - two_sqrt_a_alpha) * one_over_a0
        }
    }
}
