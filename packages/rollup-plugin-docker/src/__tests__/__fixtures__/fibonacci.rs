#[no_mangle]
pub fn fibonacci(n:i32) -> i32 {
    match n < 2 {
        true => 1,
        false => fibonacci(n - 1) + fibonacci(n - 2),
    }
}

fn main() {
    // Intentionally left blank, can't compile without this
}
