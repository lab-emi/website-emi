---
{
  "title": "Introducing RustSys: fast, open-source RTL synthesis in Rust",
  "date": "2026-10-23",
  "summary": "Meet RustSys, our Rust-based Verilog/SystemVerilog synthesizer built for terminals, CI and coding agents. Explore the code, benchmarks and documentation.",
  "category": "Research",
  "image": "/images/rustsys-banner.webp",
  "images": ["/images/rustsys-banner.webp"],
  "source": "https://github.com/lab-emi/RustSys"
}
---

Meet [**RustSys**](https://github.com/lab-emi/RustSys), our open-source RTL synthesis tool written in Rust and part of the **RustEDA** family. It converts Verilog/SystemVerilog designs into standard-cell netlists, with gate-level Verilog output and structured reports.

### Built for terminals and coding agents

RustSys brings synthesis into command-line, continuous integration and AI coding-agent workflows. Machine-readable output, reproducible workspaces and revision checks help users automate runs, inspect results and resume work. Equivalence-checking tools support verification of the synthesized designs.

### Promising performance on open hardware

The project's published benchmarks cover **five RISC-V designs across three process design kits**, with **16 physical CPU cores per tool**. In this measured suite, RustSys runs **1.50×–42.46× faster than Yosys 0.67**. Explore the [full results and methodology](https://github.com/lab-emi/RustSys#benchmarks) for the tested configurations and verification evidence.

RustSys is currently a **development preview**: version 0.1.0 is unreleased and must be built from source.

Explore the [**GitHub repository**](https://github.com/lab-emi/RustSys) and [**documentation**](https://github.com/lab-emi/RustSys/tree/main/docs) to get started. Try it on your designs, share feedback or contribute to the project!

*Banner: [RustSys contributors](https://github.com/lab-emi/RustSys/blob/main/docs/assets/rustsys-banner.svg), [Apache-2.0](/images/rustsys-banner.LICENSE.txt).*
