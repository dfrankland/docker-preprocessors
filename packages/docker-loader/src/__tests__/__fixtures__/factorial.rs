#[no_mangle]
pub fn factorial(n:i32) -> i32 {
    match n < 1 {
        true => 1,
        false => n * factorial(n - 1),
    }
}

fn main() {
    // Intentionally left blank, can't compile without this
}
