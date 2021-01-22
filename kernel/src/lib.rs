use std::cell::RefCell;

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

thread_local! {
    static KERNEL: Box<RefCell<kernel::Kernel>> = Box::new(RefCell::new(kernel::Kernel::new()));
}

#[no_mangle]
pub extern "C" fn initialize() {
    KERNEL.with(|k| k.borrow_mut().initialize());
}

#[no_mangle]
pub extern "C" fn process() {
    KERNEL.with(|k| k.borrow_mut().process())
}

#[no_mangle]
pub fn get_left_pointer() -> *mut f32 {
    KERNEL.with(|k| k.borrow_mut().left_buffer.as_mut_ptr())
}

#[no_mangle]
pub fn get_right_pointer() -> *mut f32 {
    KERNEL.with(|k| k.borrow_mut().right_buffer.as_mut_ptr())
}
