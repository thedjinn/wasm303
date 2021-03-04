pub struct LeakyIntegrator {
    coefficient: f32,
    y1: f32
}

pub struct OnePole {
    x1: f32, // [0]
    y1: f32, // [1]

    pub b0: f32, // [2]
    pub b1: f32, // [3]
    pub a1: f32, // [4]
}

pub struct BiQuad {
    x1: f32,
    x2: f32,
    y1: f32,
    y2: f32,

    pub b0: f32,
    pub b1: f32,
    pub b2: f32,
    pub a1: f32,
    pub a2: f32
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

mod biquad;
mod biquad_butterworth;
mod biquad_moorer;
mod biquad_rbj;
mod leaky_integrator;
mod onepole;
mod tb_filter;
