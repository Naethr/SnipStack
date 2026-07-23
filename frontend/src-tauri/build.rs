use std::env;

fn main() {
    println!("cargo:rerun-if-env-changed=SNIPSTACK_ALLOW_RELEASE_WEBDRIVER");

    let release_webdriver = env::var("PROFILE").as_deref() == Ok("release")
        && env::var_os("CARGO_FEATURE_WEBDRIVER").is_some();
    let explicit_test_override = env::var_os("SNIPSTACK_ALLOW_RELEASE_WEBDRIVER").is_some();

    if release_webdriver && !explicit_test_override {
        panic!(
            "release builds cannot include the webdriver feature; \
             set SNIPSTACK_ALLOW_RELEASE_WEBDRIVER=1 only for the documented \
             local performance probe"
        );
    }

    tauri_build::build()
}
