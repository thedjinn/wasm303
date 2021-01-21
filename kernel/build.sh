#!/bin/bash

set -e

#RUSTFLAGS="-C link-args=-c stack-size=1500000"

cargo build --target wasm32-unknown-unknown --release
ls -la target/wasm32-unknown-unknown/release/kernel.wasm

#wasm-strip target/wasm32-unknown-unknown/release/kernel.wasm
#ls -la target/wasm32-unknown-unknown/release/kernel.wasm

wasm-opt target/wasm32-unknown-unknown/release/kernel.wasm -o target/wasm32-unknown-unknown/release/kernel.wasm -Oz --strip-debug --strip-producers  --vacuum
ls -la target/wasm32-unknown-unknown/release/kernel.wasm

cp target/wasm32-unknown-unknown/release/kernel.wasm ../public/kernel.wasm
