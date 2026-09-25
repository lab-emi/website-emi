---
{
  "title": "ChipJev released: AI-powered analog circuit design with open-source EDA",
  "date": "2026-09-25",
  "summary": "ChipJev combines fast AI decisions with GPU-accelerated topology and sizing search. Try the live SKY130 circuit design demo at chipjev.com and explore the open-source code.",
  "category": "Research",
  "image": "/images/chipjev-circuit.jpg",
  "images": ["/images/chipjev-circuit.jpg"],
  "source": "https://chipjev.com/"
}
---

We are releasing [**ChipJev**](https://chipjev.com/), an open-source framework for analog circuit topology design and transistor sizing, developed by **Chang Gao and Qinyu Chen**.

ChipJev combines **Laya**, a compact System One decision model, with GPU-accelerated joint topology and sizing search. Parallel **ngspice** simulations evaluate candidate circuits, and verified designs can be inspected as wired **xschem** schematics.

The online demo lets you choose a **SKY130** circuit design prompt, watch the search progress, and inspect the resulting circuit and simulation measurements. You can download the schematic, SPICE netlist and results to explore the design further.

[**Try the live demo at chipjev.com →**](https://chipjev.com/)

The [**ChipJev GitHub repository**](https://github.com/lab-emi/ChipJev) provides the source code, research results and instructions.
