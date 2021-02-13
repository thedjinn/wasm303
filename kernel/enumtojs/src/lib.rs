extern crate proc_macro;
use proc_macro::TokenStream;

use std::fs::File;
use std::io::prelude::*;
use std::path::Path;

use syn::{parse_macro_input, Expr, Ident, ItemEnum, Lit, Token};
use syn::parse::{Parse, ParseStream};
use syn::punctuated::Punctuated;

struct KeyValuePair {
    ident: Ident,
    _eq_token: Token![=],
    value: Lit
}

impl Parse for KeyValuePair {
    fn parse(input: ParseStream) -> syn::parse::Result<Self> {
        Ok(Self {
            ident: input.parse()?,
            _eq_token: input.parse()?,
            value: input.parse()?
        })
    }
}

struct Args {
    filename: String
}

impl Parse for Args {
    fn parse(input: ParseStream) -> syn::parse::Result<Self> {
        let pairs = Punctuated::<KeyValuePair, Token![,]>::parse_terminated(input)?;
        let attributes: Vec<(String, Lit)> = pairs.into_iter().map(|pair| (pair.ident.to_string(), pair.value)).collect();

        let mut filename: Option<String> = None;

        for (key, lit) in attributes {
            match (key.as_str(), lit) {
                ("filename", Lit::Str(value)) => filename = Some(value.value()),
                ("filename", _) => panic!("filename must be a string"),
                _ => panic!("unrecognized attribute '{}'", key)
            }
        }

        Ok(Args {
            filename: filename.expect("no filename was provided")
        })
    }
}

fn extract_value(literal: &Lit) -> isize {
    match literal {
        Lit::Int(value) => value.base10_parse().expect("error parsing enum discriminant"),
        _ => panic!("the enum discriminant must be of integer type")
    }
}

#[proc_macro_attribute]
pub fn enum_to_js(args: TokenStream, input: TokenStream) -> TokenStream {
    // Parse arguments
    let arguments = parse_macro_input!(args as Args);

    // Parse input
    let cloned = input.clone();
    let ast = parse_macro_input!(cloned as ItemEnum);

    // Build output string
    let mut output = String::with_capacity(16384);

    output.push_str(&format!("export const {}: [str: number] = {{\n", ast.ident));

    let mut discriminant = 0;

    let lines = ast.variants.iter().map(|variant| {
        discriminant = match &variant.discriminant {
            Some((_, Expr::Lit(literal))) => extract_value(&literal.lit),
            None => discriminant + 1,
            _ => panic!("enum discriminant must be a literal")
        };

        format!("    {}: {}", variant.ident, discriminant)
    }).collect::<Vec<String>>().join(",\n");

    output.push_str(&lines);
    output.push_str("\n};\n");

    // Write file to disk
    let path = Path::new(&arguments.filename);
    let mut file = File::create(&path).expect("error opening output file");
    file.write_all(output.as_bytes()).expect("error writing output file");

    // Leave original enum untouched
    input
}
