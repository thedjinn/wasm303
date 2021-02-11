use std::f32::consts::PI;

use crate::kernel::{ANTI_DENORMAL,SAMPLE_RATE};

pub struct LeakyIntegrator {
    coefficient: f32,
    y1: f32
}

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

pub struct OnePole {
    x1: f32, // [0]
    y1: f32, // [1]

    b0: f32, // [2]
    b1: f32, // [3]
    a1: f32, // [4]
}

impl OnePole {
    //fn low_pass(cutoff: f32) -> Self {
    //}

    pub fn high_pass(cutoff: f32) -> Self {
        let alpha = (-2.0 * PI * cutoff * (1.0 / SAMPLE_RATE)).exp();

        OnePole {
            x1: 0.0,
            y1: 0.0,
            b0: 0.5 * (1.0 + alpha),
            b1: -0.5 * (1.0 + alpha),
            a1: alpha
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
            a1: -alpha
        }
    }

    pub fn render(&mut self, x0: f32) -> f32 {
        self.y1 = self.b0 * x0 + self.b1 * self.x1 + self.a1 * self.y1 + ANTI_DENORMAL;
        self.x1 = x0;

        self.y1
    }
}

pub struct BiQuad {
    x1: f32,
    x2: f32,
    y1: f32,
    y2: f32,

    b0: f32,
    b1: f32,
    b2: f32,
    a1: f32,
    a2: f32
}

impl BiQuad {
    pub fn lowpass_12db(frequency: f32, q: f32) -> Self {
        let omega = 2.0 * PI * frequency / SAMPLE_RATE;
        let s = omega.sin();
        let c = omega.cos();
        let alpha = s / (2.0 * q);
        let scale = 1.0 / (1.0 + alpha);

        let b1 = (1.0 - c) * scale;
        let b0 = 0.5 * b1;

        BiQuad {
            x1: 0.0,
            x2: 0.0,
            y1: 0.0,
            y2: 0.0,
            a1: 2.0 * c * scale,
            a2: (alpha - 1.0) * scale,
            b1,
            b0,
            b2: b0
        }
    }

    pub fn notch(frequency: f32, bandwidth: f32) -> Self {
        let omega = 2.0 * PI * frequency / SAMPLE_RATE;
        let s = omega.sin();
        let c = omega.cos();
        let alpha = s * (0.5 * 2.0_f32.ln() * bandwidth * omega / s).sinh();
        let scale = 1.0 / (1.0 + alpha);

        BiQuad {
            x1: 0.0,
            x2: 0.0,
            y1: 0.0,
            y2: 0.0,
            a1: 2.0 * c * scale,
            a2: (alpha - 1.0) * scale,
            b0: 1.0 * scale,
            b1: (-2.0 * c) * scale,
            b2: 1.0 * scale
        }
    }

    pub fn render(&mut self, x0: f32) -> f32 {
        let y1 = self.b0 * x0 + self.b1 * self.x1 + self.b2 * self.x2 + self.a1 * self.y1 + self.a2 * self.y2 + ANTI_DENORMAL;

        self.x2 = self.x1;
        self.x1 = x0;
        self.y2 = self.y1;
        self.y1 = y1;

        y1
    }
}

pub struct TBFilter {
    y0: f32,
    y1: f32,
    y2: f32,
    y3: f32,
    y4: f32,

    b0: f32,
    g: f32,
    k: f32,

    resonance_skewed: f32,

    feedback_highpass: OnePole
}

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
