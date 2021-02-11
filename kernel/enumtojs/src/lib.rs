extern crate proc_macro;
use proc_macro::TokenStream;

use std::fs::File;
use std::io::prelude::*;
use std::path::Path;

use syn::{parse_macro_input, Expr, ItemEnum, Lit};

fn extract_value(literal: Lit) -> isize {
    match literal {
        Lit::Int(value) => value.base10_parse().expect("Error parsing enum discriminant"),
        _ => panic!("The enum discriminant must be of integer type")
    }
}

#[proc_macro_attribute]
pub fn enum_to_js(_args: TokenStream, input: TokenStream) -> TokenStream {
    // Parse input
    let cloned = input.clone();
    let ast = parse_macro_input!(cloned as ItemEnum);

    let mut output = String::with_capacity(16384);

    output.push_str(&format!("export const {}: [str: number] = {{\n", ast.ident));

    let mut discriminant = 0;

    // Convert the variants to object properties
    for variant in ast.variants {
        discriminant = match variant.discriminant {
            Some((_, Expr::Lit(literal))) => extract_value(literal.lit),
            None => discriminant + 1,
            _ => panic!("Unexpected enum discriminant")
        };

        output.push_str(&format!("    {}: {},\n", variant.ident, discriminant));
    }

    output.push_str("};\n");

    // Write file to disk
    let path = Path::new("test.ts");
    let mut file = File::create(&path).expect("Error opening output file");
    file.write_all(output.as_bytes()).expect("Error writing output file");

    // Leave original enum untouched
    input
}
