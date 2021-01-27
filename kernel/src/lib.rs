use std::cell::RefCell;
use std::panic;

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

fn panic_handler(info: &panic::PanicInfo) {
    error(&info.to_string());
}

extern "C" {
    #[link_name="console_log"]
    fn _console_log(a_ptr: *const u8, a_len: usize);

    #[link_name="console_error"]
    fn _console_error(a_ptr: *const u8, a_len: usize);
}

fn wrap(s: &str, f: unsafe extern "C" fn(*const u8, usize)) {
    let ptr = s.as_ptr();
    let len = s.len();

    unsafe {
        f(ptr, len);
    }
}

pub fn log(s: &str) {
    wrap(s, _console_log);
}

pub fn error(s: &str) {
    wrap(s, _console_error);
}

#[no_mangle]
pub extern "C" fn initialize() {
    panic::set_hook(Box::new(panic_handler));

    KERNEL.with(|k| k.borrow_mut().initialize());
}

#[no_mangle]
pub extern "C" fn process(program_size: u32) -> u32 {
    KERNEL.with(|k| k.borrow_mut().process(program_size))
}

#[no_mangle]
pub fn get_left_pointer() -> *mut f32 {
    KERNEL.with(|k| k.borrow_mut().left_buffer.as_mut_ptr())
}

#[no_mangle]
pub fn get_right_pointer() -> *mut f32 {
    KERNEL.with(|k| k.borrow_mut().right_buffer.as_mut_ptr())
}

#[no_mangle]
pub fn get_program_pointer() -> *mut u8 {
    KERNEL.with(|k| k.borrow_mut().program_buffer.as_mut_ptr())
}

#[no_mangle]
pub fn handle_message() {
}
