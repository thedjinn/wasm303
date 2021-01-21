use std::sync::Mutex;

mod delay;
mod distortion;
mod filters;
mod kernel;
mod r303;
mod sequencer;
mod vco;

#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

lazy_static::lazy_static! {
    static ref KERNEL: Mutex<kernel::Kernel> = Mutex::new(kernel::Kernel::new());
}

#[no_mangle]
pub extern "C" fn initialize() {
    KERNEL.lock().unwrap().initialize();
}

#[no_mangle]
pub extern "C" fn process() {
    KERNEL.lock().unwrap().process();
}

#[no_mangle]
pub fn get_left_pointer() -> *mut f32 {
    return KERNEL.lock().unwrap().left_buffer.as_mut_ptr();
}

#[no_mangle]
pub fn get_right_pointer() -> *mut f32 {
    return KERNEL.lock().unwrap().right_buffer.as_mut_ptr();
}
