const MAX_PROGRAM_SIZE: usize = 32768;

use enumtojs::enum_to_js;

#[repr(u8)]
#[enum_to_js(filename="../src/Opcode.ts")]
#[derive(Clone, Copy)]
pub enum Opcode {
    // No operands
    Nop = 0,

    // Single u32 operand
    SetWaveformIndex = 20,
    SetDelayLength,

    // Single f32 operand
    SetCutoff = 40,
    SetResonance,
    SetEnvMod,
    SetDecay,
    SetTempo,
    SetTuning,
    SetAccent,
    SetDistortionThreshold,
    SetDistortionShape,
    SetDelaySend,
    SetDelayFeedback,

    // Opcodes for frontend, no operands
    BootstrapFinished = 60,

    // Opcodes for frontend, single u32 operand
    SetSequencerStep = 80,

    // Opcodes for frontend, single f32 operand
    // ...

    // Sentinel
    Max
}

impl Opcode {
    fn from_u8(value: u8) -> Self {
        if value > Self::Max as u8 {
            Self::Nop
        } else {
            unsafe { std::mem::transmute(value) }
        }
    }

    fn operand_size(&self) -> usize {
        match *self as u8 {
            20..=39 => 4,
            40..=59 => 4,
            _ => 0
        }
    }
}

pub struct Instruction<'a> {
    pub opcode: Opcode,
    operands: &'a [u8]
}

impl<'a> Instruction<'a> {
    pub fn decode<T>(&self, slot: usize) -> T where T: Copy {
        let ptr = self.operands.as_ptr() as *const T;
        unsafe { ptr.add(slot).read_unaligned() }
    }

    pub fn decode_u32(&self, slot: usize) -> u32 {
        self.decode(slot)
    }

    pub fn decode_f32(&self, slot: usize) -> f32 {
        self.decode(slot)
    }
}

pub struct VM {
    program: Vec<u8>,
    position: usize
}

impl VM {
    pub fn new() -> Self {
        Self {
            program: vec![0; MAX_PROGRAM_SIZE],
            position: 0
        }
    }

    pub fn get_program_ptr(&mut self) -> *mut u8 {
        self.program.as_mut_ptr()
    }

    pub fn set_position(&mut self, position: usize) {
        self.position = position;
    }

    pub fn get_position(&self) -> usize {
        self.position
    }

    pub fn drain(&mut self) {
        self.position = 0;
    }

    pub fn push_opcode(&mut self, opcode: Opcode) {
        self.program[self.position] = opcode as u8;
        self.position += 1;
    }

    pub fn push_u8(&mut self, value: u8) {
        self.program[self.position] = value;
        self.position += 1;
    }
}

impl Default for VM {
    fn default() -> Self {
        Self::new()
    }
}

impl<'a> IntoIterator for &'a VM {
    type Item = <Self::IntoIter as Iterator>::Item;
    type IntoIter = ProgramIterator<'a>;

    fn into_iter(self) -> Self::IntoIter {
        ProgramIterator {
            program: &self.program,
            position: 0,
            end: self.position
        }
    }
}

pub struct ProgramIterator<'a> {
    program: &'a Vec<u8>,
    position: usize,
    end: usize
}

impl<'a> ProgramIterator<'a> {
    fn eat_u8(&mut self) -> Option<u8> {
        if self.position >= self.end {
            return None;
        }

        let byte = self.program[self.position];
        self.position += 1;

        Some(byte)
    }

    //fn eat_u32(&mut self) -> Option<u32> {
        //if self.position + 4 > self.end {
            //return None;
        //}

        //let value = self.program[self.position] as u32 &
            //((self.program[self.position + 1] as u32) << 8) &
            //((self.program[self.position + 2] as u32) << 16) &
            //((self.program[self.position + 3] as u32) << 24);

        //self.position += 4;

        //Some(value)
    //}
}

impl<'a> Iterator for ProgramIterator<'a> {
    type Item = Instruction<'a>;

    fn next(&mut self) -> Option<Self::Item> {
        let opcode = match self.eat_u8() {
            Some(byte) => Opcode::from_u8(byte),
            None => return None
        };

        // Check if we will not exhaust the buffer
        let operand_size = opcode.operand_size();
        if self.position + operand_size > self.end {
            return None;
        }

        Some(Instruction {
            operands: &self.program[self.position..self.position + operand_size],
            opcode
        })
    }
}
