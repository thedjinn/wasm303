use std::f32::consts::{PI, SQRT_2};

use crate::kernel::SAMPLE_RATE;
use super::BiQuad;

// This file contains BiQuad filters modeled after Moorer's paper "The Manifold Joys of Conformal
// Mapping".

fn bandwidth_to_bandedge_angle(a: f32, bandwidth: f32) -> f32 {
    // Note: bandwidth is a normalized frequency (0..0.5)
    let a_2 = a * a;
    let a_4 = a_2 * a_2;

    let sin_t = (2.0 * PI * bandwidth).sin();
    let cos_t = (2.0 * PI * bandwidth).cos();
    let sine = (1.0 + a_4) * sin_t;
    let cosine = (1.0 - a_4) * cos_t;

    let magnitude = (sine * sine + cosine * cosine).sqrt();
    let d = (2.0 * a_2 * sin_t) / magnitude;

    let asnd = d.asin();
    let delta = sine.atan2(cosine);

    // Compute prototype bandedge frequency (theta in paper)
    let theta = 0.5 * (PI - asnd - delta);
    let tmp = 0.5 * (asnd - delta);

    // Take the principal branch and normalize the frequency
    if tmp > 0.0 && tmp < theta {
        tmp / (2.0 * PI)
    } else {
        theta / (2.0 * PI)
    }
}

impl BiQuad {
    pub fn presence_moorer(frequency: f32, bandwidth: f32, gain: f32) -> Self {
        // Presence filter, after Moorer's "The Manifold Joys of Conformal Mapping"
        // Seems to behave like a peaking EQ filter.
        // Note: frequency and bandwidth in Hz, gain in dB
        let normalized_frequency = frequency / SAMPLE_RATE;
        let normalized_bandwidth = bandwidth / SAMPLE_RATE;

        // Compute warp factor
        let a = (PI * (normalized_frequency - 0.25)).tan();
        let a_squared = a * a;

        // Convert decibels to amplification factor
        let amplification_factor = 10.0_f32.powf(gain / 20.0);

        // Prevent divide overflow
        let f: f32;
        if gain > -6.0 && gain < 6.0 {
            f = amplification_factor.sqrt();
        } else if amplification_factor > 1.0 {
            f = amplification_factor / SQRT_2;
        } else {
            f = amplification_factor * SQRT_2;
        }

        let angle_cotangent = 1.0 / (2.0 * PI * bandwidth_to_bandedge_angle(a, normalized_bandwidth)).tan();
        let f_squared = f * f;
        let tmp = amplification_factor * amplification_factor - f_squared;

        let alpha_denominator: f32;
        if tmp.abs() <= f32::MIN {
            alpha_denominator = angle_cotangent;
        } else {
            alpha_denominator = (angle_cotangent * angle_cotangent * (f_squared - 1.0) / tmp).sqrt();
        }

        let alpha_numerator = amplification_factor * alpha_denominator;

        let one_over_a0 = 1.0 / ((1.0 + a_squared) + alpha_denominator * (1.0 - a_squared));
        let a1 = 4.0 * a * one_over_a0;

        BiQuad {
            x1: 0.0,
            x2: 0.0,
            y1: 0.0,
            y2: 0.0,
            a1,
            a2: ((1.0 + a_squared) - alpha_denominator * (1.0 - a_squared)) * one_over_a0,
            b0: ((1.0 + a_squared) + alpha_numerator * (1.0 - a_squared)) * one_over_a0,
            b1: a1,
            b2: ((1.0 + a_squared) - alpha_numerator * (1.0 - a_squared)) * one_over_a0
        }
    }

    pub fn shelving_moorer(frequency: f32, gain: f32, slope: f32, high_shelf: bool) -> Self {
        // Shelving filter, after Moorer's "The Manifold Joys of Conformal Mapping"
        // Note: frequency in Hz, gain in dB. Set high_shelf to true to get a high shelving filter,
        // or false to get a low shelving one. Shelf slope is specified in decibels per octave. Set
        // to 0.5 * sqrt(2) to have sharpest slope that is still monotonic. Smaller vallues will
        // generate a peak in the response. Larger values will make the slope more gradual.
        let normalized_frequency = frequency / SAMPLE_RATE;

        // Compute warp factor
        let a = (PI * (normalized_frequency - 0.25)).tan();
        let a_squared = a * a;

        // Convert decibels to amplification factor
        let amplification_factor = 10.0_f32.powf(gain / 20.0);

        let f: f32;
        if gain > -6.0 && gain < 6.0 {
            f = amplification_factor.sqrt();
        } else if amplification_factor > 1.0 {
            f = amplification_factor / SQRT_2;
        } else {
            f = amplification_factor * SQRT_2;
        }

        let f_squared = f * f;
        let tmp = amplification_factor * amplification_factor - f_squared;

        // Prevent divide overflow
        let gamma_denominator: f32;
        if tmp.abs() <= f32::MIN {
            gamma_denominator = 1.0;
        } else {
            gamma_denominator = ((f_squared - 1.0) / tmp).powf(0.25);
        }

        let gamma_numerator = amplification_factor.sqrt() * gamma_denominator;
        let two_sigma = 2.0 * slope;

        // Numerator coefficients
        let gamma_numerator_squared = gamma_numerator * gamma_numerator;
        let tb0 = (1.0 + gamma_numerator_squared) + two_sigma * gamma_numerator;
        let mut tb1 = -2.0 * (1.0 - gamma_numerator_squared);
        let tb2 = (1.0 + gamma_numerator_squared) - two_sigma * gamma_numerator;

        // Denominator coefficients
        let gamma_denominator_squared = gamma_denominator * gamma_denominator;
        let ta0 = (1.0 + gamma_denominator_squared) + two_sigma * gamma_denominator;
        let mut ta1 = -2.0 * (1.0 - gamma_denominator_squared);
        let ta2 = (1.0 + gamma_denominator_squared) - two_sigma * gamma_denominator;

        // Transform to high shelf by flipping sign of z^-1 terms
        if high_shelf {
            tb1 = -tb1;
            ta1 = -ta1;
        }

        // Apply bilinear transform around center freqency and generate coefficients
        let aa1 = a * ta1;
        let ab1 = a * tb1;

        let one_over_a0 = 1.0 / (ta0 + aa1 + a_squared * ta2);

        BiQuad {
            x1: 0.0,
            x2: 0.0,
            y1: 0.0,
            y2: 0.0,
            a1: (2.0 * a * (ta0 + ta2) + (1.0 + a_squared) * ta1) * one_over_a0,
            a2: (a_squared * ta0 + aa1 + ta2) * one_over_a0,
            b0: (tb0 + ab1 + a_squared * tb2) * one_over_a0,
            b1: (2.0 * a * (tb0 + tb2) + (1.0 + a_squared) * tb1) * one_over_a0,
            b2: (a_squared * tb0 + ab1 + tb2) * one_over_a0
        }
    }
}
