use crate::r303::R303;

const BUFFER_SIZE: usize = 128;

pub const ANTI_DENORMAL: f32 = 1.0e-20;
pub const SAMPLE_RATE: f32 = 44100.0;

const MAX_PROGRAM_SIZE: usize = 1024;

pub struct Kernel {
    pub current_sample: u32,

    pub left_buffer: Vec::<f32>,
    pub right_buffer: Vec::<f32>,

    pub program_buffer: Vec::<u8>,

    r303: R303
}

impl Kernel {
    pub fn new() -> Self {
        return Kernel {
            current_sample: 0,

            left_buffer: vec![0.0; BUFFER_SIZE],
            right_buffer: vec![0.0; BUFFER_SIZE],

            program_buffer: vec![0; MAX_PROGRAM_SIZE],

            r303: R303::new()
        };
    }

    pub fn initialize(&mut self) {
        self.current_sample = 0;
    }

    pub fn process(&mut self, program_size: u32) -> u32 {
        // TODO: Execute VM opcodes

        for i in 0..BUFFER_SIZE {
            let sample = self.r303.render();

            self.left_buffer[i] = sample;
            self.right_buffer[i] = sample;

            self.current_sample += 1;
        }

        self.program_buffer[0] = 123;

        return 1;
    }
}
