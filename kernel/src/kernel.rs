use crate::r303::R303;
use crate::vm::VM;

use std::rc::Rc;
use std::cell::RefCell;

const BUFFER_SIZE: usize = 128;

pub const ANTI_DENORMAL: f32 = 1.0e-20;
pub const SAMPLE_RATE: f32 = 44100.0;

pub struct Kernel {
    pub current_sample: u32,

    pub left_buffer: Vec::<f32>,
    pub right_buffer: Vec::<f32>,

    pub vm: Rc<RefCell<VM>>,

    r303: R303
}

impl Kernel {
    pub fn new() -> Self {
        let vm = Rc::new(RefCell::new(VM::new()));

        Kernel {
            current_sample: 0,

            left_buffer: vec![0.0; BUFFER_SIZE],
            right_buffer: vec![0.0; BUFFER_SIZE],

            r303: R303::new(Rc::clone(&vm)),
            vm
        }
    }

    pub fn initialize(&mut self) {
        self.current_sample = 0;
    }

    pub fn process(&mut self, program_size: u32) -> u32 {
        {
            let mut vm = self.vm.borrow_mut();

            // Execute VM opcodes
            vm.set_position(program_size as usize);

            for instruction in vm.into_iter() {
                self.r303.execute(instruction);
            }

            vm.drain();
        }

        // Fill audio buffer
        for i in 0..BUFFER_SIZE {
            let sample = self.r303.render();

            self.left_buffer[i] = sample;
            self.right_buffer[i] = sample;

            self.current_sample += 1;
        }

        return self.vm.borrow_mut().get_position() as u32;
    }
}
