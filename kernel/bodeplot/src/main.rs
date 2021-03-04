use clap::{Arg, App};
use kernel::filters::{OnePole, BiQuad};
use num_complex::Complex;
use std::f32::consts::PI;
use textplots::{Chart, Plot, Shape};

#[derive(Debug)]
struct Opts {
    filter: String,
    frequency: f32,
    q: f32,
    bandwidth: f32,
    gain: f32,
    shelf_slope: f32
}

fn parse_args() -> Opts {
    let matches = App::new("bodeplot")
        .version("1.0.0")
        .author("Emil Loer <emil@koffietijd.net>")
        .about("Generate bode plots for kernel::BiQuad filters")
        .arg(Arg::new("filter")
             .about("The filter to use")
             .required(true))
        .arg(Arg::new("frequency")
             .short('f')
             .long("frequency")
             .takes_value(true)
             .default_value("2000.0")
             .about("The center/cutoff frequency (in Hz)"))
        .arg(Arg::new("q")
             .short('q')
             .long("q-factor")
             .takes_value(true)
             .default_value("0.707")
             .about("The Q-value"))
        .arg(Arg::new("bandwidth")
             .short('b')
             .long("bandwidth")
             .takes_value(true)
             .default_value("1.0")
             .about("The bandwidth (in octaves)"))
        .arg(Arg::new("gain")
             .short('g')
             .long("gain")
             .takes_value(true)
             .allow_hyphen_values(true)
             .default_value("1.0")
             .about("The gain (in dB)"))
        .arg(Arg::new("shelf-slope")
             .short('s')
             .long("shelf-slope")
             .takes_value(true)
             .default_value("1.0")
             .about("The shelf slope (in dB/octave)"))
        .get_matches();

    Opts {
        filter: matches.value_of_t_or_exit("filter"),
        frequency: matches.value_of_t_or_exit("frequency"),
        q: matches.value_of_t_or_exit("q"),
        bandwidth: matches.value_of_t_or_exit("bandwidth"),
        gain: matches.value_of_t_or_exit("gain"),
        shelf_slope: matches.value_of_t_or_exit("shelf-slope")
    }
}

trait TransferFunction {
    fn transfer_function(&self, z: Complex<f32>) -> Complex<f32>;
}

impl TransferFunction for OnePole {
    fn transfer_function(&self, z: Complex<f32>) -> Complex<f32> {
        let numerator = self.b0 + self.b1 * z;
        let denominator = 1.0 + self.a1 * z;

        numerator / denominator
    }
}

impl TransferFunction for BiQuad {
    fn transfer_function(&self, z: Complex<f32>) -> Complex<f32> {
        let numerator = self.b0 + (self.b1 + self.b2 * z) * z;
        let denominator = 1.0 + (self.a1 + self.a2 * z) * z;

        numerator / denominator
    }
}

fn main() {
    let opts = parse_args();

    let filter: Box<dyn TransferFunction> = match opts.filter.as_str() {
        // One-pole filters
        "onepole_bypass" => Box::new(OnePole::bypass()),
        "highpass_6db" => Box::new(OnePole::high_pass(opts.frequency)),
        "allpass_6db" => Box::new(OnePole::all_pass(opts.frequency)),

        // BiQuad filters
        "biquad_bypass" => Box::new(BiQuad::bypass()),
        "lowpass_6db_butterworth" => Box::new(BiQuad::lowpass_6db_butterworth(opts.frequency)),
        "highpass_6db_butterworth" => Box::new(BiQuad::highpass_6db_butterworth(opts.frequency)),
        "lowpass_12db" => Box::new(BiQuad::lowpass_12db(opts.frequency, opts.q)),
        "highpass_12db" => Box::new(BiQuad::highpass_12db(opts.frequency, opts.q)),
        "bandpass_constant_skirt_gain" => Box::new(BiQuad::bandpass_constant_skirt_gain(opts.frequency, opts.bandwidth)),
        "bandpass_constant_peak_gain" => Box::new(BiQuad::bandpass_constant_peak_gain(opts.frequency, opts.bandwidth)),
        "notch" => Box::new(BiQuad::notch(opts.frequency, opts.bandwidth)),
        "allpass" => Box::new(BiQuad::allpass(opts.frequency, opts.q)),
        "peaking_eq" => Box::new(BiQuad::peaking_eq(opts.frequency, opts.gain, opts.bandwidth)),
        "low_shelf" => Box::new(BiQuad::low_shelf(opts.frequency, opts.gain, opts.shelf_slope)),
        "high_shelf" => Box::new(BiQuad::high_shelf(opts.frequency, opts.gain, opts.shelf_slope)),
        "presence_moorer" => Box::new(BiQuad::presence_moorer(opts.frequency, opts.bandwidth, opts.gain)),
        "low_shelving_moorer" => Box::new(BiQuad::shelving_moorer(opts.frequency, opts.gain, opts.shelf_slope, false)),
        "high_shelving_moorer" => Box::new(BiQuad::shelving_moorer(opts.frequency, opts.gain, opts.shelf_slope, true)),
        _ => panic!("Invalid filter specified!")
    };

    let num_frequencies = 1000;
    let frequencies: Vec<f32> = (0..num_frequencies).map(|x| x as f32 / num_frequencies as f32).collect();

    let response: Vec<(f32, f32)> = frequencies.iter().map(|frequency| {
        let omega = -PI * frequency;

        let z = Complex::new(omega.cos(), omega.sin());

        let response = filter.transfer_function(z);

        let magnitude = response.norm();
        let phase = response.arg();

        (magnitude, phase)
    }).collect();

    let (magnitudes, phases): (Vec<f32>, Vec<f32>) = response.iter().cloned().unzip();

    let magnitude_response: Vec<(f32, f32)> = frequencies.iter().cloned().zip(magnitudes).collect();
    let phase_response: Vec<(f32, f32)> = frequencies.iter().cloned().zip(phases).collect();

    println!("Magnitude response:");
    Chart::new(120, 60, 0.0, 1.0).lineplot(&Shape::Lines(&magnitude_response)).nice();

    println!("\nPhase response:");
    Chart::new(120, 60, 0.0, 1.0).lineplot(&Shape::Lines(&phase_response)).nice();
}
