use crate::delay::Delay;
use crate::distortion::FoldbackDistortion;
use crate::filters::{OnePole,BiQuad,TBFilter};
use crate::kernel::{ANTI_DENORMAL,SAMPLE_RATE};
use crate::sequencer::Sequencer;
use crate::vco::VCO;
use crate::vm::{Instruction, Opcode, VM};

use std::rc::Rc;
use std::cell::RefCell;

pub struct R303 {
    waveform_index: u32, // 0..1
    cutoff: f32, // Hz
    resonance: f32, // 0..1
    envmod: f32, // 0..1
    pub decay: f32, // in ms
    pub accent: f32, // 0..1

    vm: Rc<RefCell<VM>>,

    sequencer: Sequencer,
    vco: VCO,
    distortion: FoldbackDistortion,
    delay: Delay,

    accent_gain: f32,

    amplitude_envelope: f32,
    amplitude_multiplier: f32,

    filter_envelope: f32,
    filter_multiplier: f32,

    envelope_scaler: f32,
    envelope_offset: f32,

    highpass1: OnePole,
    allpass: OnePole,
    highpass2: OnePole,
    tb_filter: TBFilter,
    notch: BiQuad,
    declicker: BiQuad
}

impl R303 {
    pub fn new(vm: Rc<RefCell<VM>>) -> Self {
        let mut r303 = R303 {
            waveform_index: 0,
            cutoff: 450.0,
            resonance: 0.9,
            envmod: 0.7,
            decay: 150.0,
            accent: 0.2,

            vm: vm,

            delay: Delay::new(),
            sequencer: Sequencer::demo(),
            vco: VCO::new(),
            distortion: FoldbackDistortion::new(),

            accent_gain: 0.0,

            amplitude_envelope: 0.0,
            amplitude_multiplier: 0.0,

            filter_envelope: 0.0,
            filter_multiplier: 0.0,

            envelope_scaler: 0.0,
            envelope_offset: 0.0,

            highpass1: OnePole::high_pass(44.486),
            allpass: OnePole::all_pass(14.008),
            highpass2: OnePole::high_pass(24.167),
            tb_filter: TBFilter::new(),
            notch: BiQuad::notch(7.5164, 4.7),
            declicker: BiQuad::lowpass_12db(200.0, (0.5_f32).sqrt())
        };

        r303.set_waveform_index(r303.waveform_index);
        r303.tb_filter.set_resonance(r303.resonance);

        r303.update_envmod_coefficients();

        return r303;
    }

    fn set_waveform_index(&mut self, waveform_index: u32) {
        self.waveform_index = waveform_index;
        self.vco.waveform_index = waveform_index as usize;
    }

    fn set_cutoff(&mut self, cutoff: f32) {
        self.cutoff = cutoff;
        self.update_envmod_coefficients();
    }

    fn set_resonance(&mut self, resonance: f32) {
        self.resonance = resonance;
        self.tb_filter.set_resonance(resonance);
    }

    fn set_envmod(&mut self, envmod: f32) {
        self.envmod = envmod;
        self.update_envmod_coefficients();
    }

    fn update_envmod_coefficients(&mut self) {
        let c0 = 3.138152786059267e+2;
        let c1 = 2.394411986817546e+3;
        let c = (self.cutoff / c0).ln() / (c1 / c0).ln();

        let slo = 3.773996325111173 * self.envmod + 0.736965594166206;
        let shi = 4.194548788411135 * self.envmod + 0.864344900642434;

        self.envelope_scaler = (1.0 - c) * slo + c * shi;
        self.envelope_offset = 0.048292930943553 * c + 0.294391201442418;
    }

    pub fn render(&mut self) -> f32 {
        if let Some(step) = self.sequencer.update() {
            // decay multiplier
            self.amplitude_multiplier = (-1.0 / (0.001 * self.decay * SAMPLE_RATE)).exp();

            if step.has_accent {
                self.filter_multiplier = (-1.0 / (0.001 * 200.0 * SAMPLE_RATE)).exp();
                self.accent_gain = self.accent;
            } else {
                self.filter_multiplier = self.amplitude_multiplier;
                self.accent_gain = 0.0_f32;
            }

            self.amplitude_envelope = (1.0 / self.amplitude_multiplier) * step.is_enabled as u32 as f32;

            // calculate target pitch
            let pitch = step.pitch - step.has_down as u32 * 12 + step.has_up as u32 * 12;

            // VCO parameters
            if step.has_slide {
                self.vco.slide(pitch as f32);
            } else {
                self.filter_envelope = 1.0 / self.filter_multiplier;
                self.vco.reset(pitch as f32);
            }

            // Tell VM that we advanced a step
            let mut vm = self.vm.borrow_mut();
            vm.push_opcode(Opcode::SetSequencerStep);
            vm.push_u8(self.sequencer.pattern_position as u8);
        }

        // TODO: set amplitude_envelope to 0 when not running sequencer

        // envelopes
        self.amplitude_envelope = self.amplitude_envelope * self.amplitude_multiplier + ANTI_DENORMAL;
        self.filter_envelope = self.filter_envelope * self.filter_multiplier + ANTI_DENORMAL;

        // VCO
        let mut sample = self.vco.render();

        // Modulators
        if self.sequencer.sample_position % 63 == 0 {
            self.vco.update();

            // Cutoff modulation
            let effective_cutoff = (self.cutoff * (2.0_f32).powf(self.envelope_scaler * (self.filter_envelope - self.envelope_offset) + self.accent_gain * self.filter_envelope)).min(20000.0);
            self.tb_filter.update_coefficients(effective_cutoff);
        }

        // Filter bank
        sample = self.highpass1.render(sample);
        sample = self.tb_filter.render(sample);
        sample = self.allpass.render(sample);
        sample = self.highpass2.render(sample);
        sample = self.notch.render(sample);

        // Output gain and declicker
        let mut output_gain = (self.accent_gain * 4.0 + 1.0) * self.amplitude_envelope;
        output_gain = self.declicker.render(output_gain);
        sample *= output_gain;

        // Foldback distortion
        sample = self.distortion.render(sample);

        // Delay
        sample = self.delay.render(sample);

        return sample;
    }

    pub fn execute(&mut self, instruction: Instruction) {
        use Opcode::*;

        match instruction.opcode {
            SetCutoff => self.set_cutoff(instruction.decode(0)),
            SetResonance => self.set_resonance(instruction.decode(0)),
            SetEnvMod => self.set_envmod(instruction.decode(0)),
            SetDecay => self.decay = instruction.decode(0),
            SetTempo => self.sequencer.set_tempo(instruction.decode(0)),
            SetTuning => (), // TODO
            SetAccent => self.accent = instruction.decode(0),
            SetDistortionThreshold => self.distortion.set_threshold(instruction.decode(0)),
            SetDistortionShape => self.distortion.shape = instruction.decode(0),
            SetDelaySend => self.delay.send = instruction.decode(0),
            SetDelayFeedback => self.delay.feedback = instruction.decode(0),
            SetWaveformIndex => self.waveform_index = instruction.decode(0),
            SetDelayLength => self.delay.length = instruction.decode_u32(0) as usize,
            _ => ()
        }
    }
}
