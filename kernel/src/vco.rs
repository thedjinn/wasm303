use std::f32::consts::PI;

use crate::kernel::SAMPLE_RATE;

const WAVEFORM_SIZE: usize = 4096;
const WAVEFORM_GROUP_SIZE: usize = 128 * WAVEFORM_SIZE;
const WAVETABLE_SIZE: usize = 2 * WAVEFORM_GROUP_SIZE;

fn make_wavetable() -> Vec<f32> {
    // create sine table to speed up initialization
    let mut sine_table: Vec<f32> = vec![0.0; WAVEFORM_SIZE];
    for i in 0..WAVEFORM_SIZE {
        sine_table[i] = (2.0 * PI * (i as f32 / WAVEFORM_SIZE as f32)).sin();
    }

    // create wavetable
    let mut wavetable = vec![0.0 as f32; WAVETABLE_SIZE];

    // create a waveform for each midi note
    let mut last: f32 = 0.0;
    for i in 0..128 {
        // compute the number of partials in the waveform
        let h = ((SAMPLE_RATE / 2.0) / (440.0 * 2.0_f32.powf((i as f32 - 69.0) / 12.0))).round();

        // skip this note if the number of partials is equal to the previously generated
        // waveform
        if h == last {
            // copy over previously generated waveforms
            for k in 0..WAVEFORM_SIZE {
                wavetable[k + i * WAVEFORM_SIZE] = wavetable[k + (i - 1) * WAVEFORM_SIZE];
            }

            for k in 0..WAVEFORM_SIZE {
                wavetable[WAVEFORM_GROUP_SIZE + k + i * WAVEFORM_SIZE] = wavetable[WAVEFORM_GROUP_SIZE + k + (i - 1) * WAVEFORM_SIZE];
            }

            continue;
        }

        // compute the sawtooth waveform using even and odd harmonics up to h partials
        for j in 1..=h as usize {
            // compensate for gibbs phenomenon and scale amplitude
            let m1 = ((j as f32 - 1.0) * PI / (2.0 * h)).cos();
            let m = (m1 * m1) / j as f32;

            // render this partial to the wavetable
            for k in 0..WAVEFORM_SIZE {
                let f = m * sine_table[(j * k) % WAVEFORM_SIZE];
                wavetable[k + i * WAVEFORM_SIZE] += f;
            }
        }

        // compute the square waveform using odd harmonics up to h partials
        for j in 1..=h as usize {
            // only add odd partials to the square wave table
            if j % 2 == 0 {
                continue;
            }

            // compensate for gibbs phenomenon and scale amplitude
            let m1 = ((j as f32 - 1.0) * PI / (2.0 * h)).cos();
            let m = (m1 * m1) / j as f32;

            // render this partial to the wavetable
            for k in 0..WAVEFORM_SIZE {
                let f = m * sine_table[(j * k) % WAVEFORM_SIZE];
                wavetable[WAVEFORM_GROUP_SIZE + k + i * WAVEFORM_SIZE] += f;
            }
        }

        last = h;
    }

    // normalize the wavetable
    let mut max0: f32 = 0.0;
    let mut max1: f32 = 0.0;
    for i in 0..WAVEFORM_GROUP_SIZE {
        max0 = f32::max(max0, wavetable[i].abs());
        max1 = f32::max(max1, wavetable[WAVEFORM_GROUP_SIZE + i].abs());
    }

    max0 = 1.0 / max0;
    max1 = 1.0 / max1;

    for i in 0..WAVEFORM_GROUP_SIZE {
        wavetable[i] *= max0;
        wavetable[WAVEFORM_GROUP_SIZE + i] *= max1;
    }

    return wavetable;
}

fn make_wavetable_orig() -> Vec<f32> {
    // create sine table to speed up initialization
    let mut sine_table: Vec<f32> = vec![0.0; WAVEFORM_SIZE];
    for i in 0..WAVEFORM_SIZE {
        sine_table[i] = (2.0 * PI * (i as f32 / WAVEFORM_SIZE as f32)).sin();
    }

    // create wavetable
    let mut wavetable = vec![0.0 as f32; WAVETABLE_SIZE];

    // create a waveform for each midi note
    let mut last: f32 = 0.0;
    for i in 0..128 {
        // compute the number of partials in the waveform
        let h = ((SAMPLE_RATE / 2.0) / (440.0 * 2.0_f32.powf((i as f32 - 69.0) / 12.0))).round();

        // skip this note if the number of partials is equal to the previously generated
        // waveform
        if h == last {
            continue;
        }

        // compute the waveform using fourier series up to h partials
        for j in 1..=h as usize {
            // compensate for gibbs phenomenon and scale amplitude
            let m1 = ((j as f32 - 1.0) * PI / (2.0 * h)).cos();
            let m = (m1 * m1) / j as f32;

            // render this partial to the wavetable
            for k in 0..WAVEFORM_SIZE {
                let f = m * sine_table[(j * k) % WAVEFORM_SIZE];
                wavetable[k + i * WAVEFORM_SIZE] += f;

                // only add odd partials to the square wave table
                if j % 2 == 1 {
                    wavetable[WAVEFORM_GROUP_SIZE + k + i * WAVEFORM_SIZE] += f;
                }
            }
        }

        last = h;
    }

    // normalize the wavetable
    let mut max0: f32 = 0.0;
    let mut max1: f32 = 0.0;
    for i in 0..WAVEFORM_GROUP_SIZE {
        max0 = f32::max(max0, wavetable[i].abs());
        max1 = f32::max(max1, wavetable[WAVEFORM_GROUP_SIZE + i].abs());
    }

    max0 = 1.0 / max0;
    max1 = 1.0 / max1;

    for i in 0..WAVEFORM_GROUP_SIZE {
        wavetable[i] *= max0;
        wavetable[WAVEFORM_GROUP_SIZE + i] *= max1;
    }

    return wavetable;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_make_wavetable() {
        make_wavetable();
    }
}

pub struct VCO {
    wavetable: Vec<f32>,

    position: f32,
    delta: f32,

    pub waveform_index: usize,
    current_waveform_start: usize,

    // TODO: Find better names for these
    slide: f32,
    slide_step: u32
}

impl VCO {
    pub fn new() -> Self {
        Self {
            wavetable: make_wavetable(),

            position: 0.0,
            delta: 0.0,

            waveform_index: 0,
            current_waveform_start: 0,

            slide: 0.0,
            slide_step: 0
        }
    }

    pub fn reset(&mut self, pitch: f32) {
        let frequency = 440.0 * (2.0_f32).powf((pitch - 69.0) / 12.0);

        self.position = 0.0;
        // TODO: use wavetable length constant
        self.delta = frequency * WAVEFORM_SIZE as f32 / SAMPLE_RATE;

        // Compute waveform index
        self.current_waveform_start = self.waveform_index * WAVEFORM_GROUP_SIZE + (pitch as usize * WAVEFORM_SIZE);

        // Reset slide parameters
        self.slide = 0.0;
        self.slide_step = 64;
    }

    pub fn slide(&mut self, pitch: f32) {
        let frequency = 440.0 * (2.0_f32).powf((pitch - 69.0) / 12.0);

        self.slide = (self.delta - (frequency * WAVEFORM_SIZE as f32 / SAMPLE_RATE)) / 64.0;
        self.slide_step = 0;
    }

    pub fn render(&mut self) -> f32 {
        let index = (self.position).floor() as usize;
        let r = self.position - index as f32;
        let sample = (1.0 - r) * self.wavetable[self.current_waveform_start + index] + r * self.wavetable[self.current_waveform_start + ((index + 1) % WAVEFORM_SIZE)];

        self.position += self.delta;
        if self.position >= WAVEFORM_SIZE as f32 {
            self.position -= WAVEFORM_SIZE as f32;
        }

        return sample;
    }

    // Note: to be called every 64 samples
    pub fn update(&mut self) {
        // apply portamento
        if self.slide_step < 64 {
            self.delta -= self.slide;
        }
    }
}
