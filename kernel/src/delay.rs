use crate::kernel::{ANTI_DENORMAL,SAMPLE_RATE};

const DELAY_BUFFER_SIZE: usize = 2 * SAMPLE_RATE as usize;

pub struct Delay {
    buffer: Vec<f32>,

    pub send: f32, // 0..1
    pub feedback: f32, // 0..1
    pub length: usize, // in samples

    position: usize
}

impl Delay {
    pub fn new() -> Self {
        Self {
            buffer: vec![0.0; DELAY_BUFFER_SIZE],

            send: 0.5,
            feedback: 0.5,
            length: 20000,

            position: 0
        }
    }

    pub fn render(&mut self, sample: f32) -> f32 {
        let previous = self.buffer[self.position];
        self.buffer[self.position] = self.send * sample + self.feedback * previous + ANTI_DENORMAL;

        self.position += 1;
        if self.position >= self.length {
            self.position = 0;
        }

        sample + previous
    }
}
