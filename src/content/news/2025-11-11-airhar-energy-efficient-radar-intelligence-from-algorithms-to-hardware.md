---
{
  "title": "AIRHAR: energy-efficient radar intelligence, from algorithms to hardware",
  "date": "2025-11-11",
  "summary": "We are thrilled to announce the successful completion of the AIRHAR (An Energy-Efficient AI-Powered Portable Radar System for Human Activity Recognition) project in collaboration with Dr. Francesco Fioranelli and…",
  "category": "Research",
  "image": "/images/1092993b49f7f8.webp",
  "images": [
    "/images/1092993b49f7f8.webp"
  ],
  "source": "https://www.tudemi.com/home#h.15641ca3df9a19c6_0",
  "originalTitle": "📰 New Nature Communications Paper Explores Brain-Inspired AI for Energy Efficiency"
}
---

We are thrilled to announce the successful completion of the **AIRHAR (An Energy-Efficient AI-Powered Portable Radar System for Human Activity Recognition)** project in collaboration with Dr. Francesco Fioranelli and Prof. Alexander Yarovoy. Funded by a Horizon Europe MSCA Postdoctoral Fellowship, this 24-month project aimed to address a significant challenge: making advanced AI for radar-based human activity recognition (HAR) efficient enough to run on low-power, portable edge devices. We are proud to report that the project has exceeded its core objectives, delivering two major breakthroughs in hardware-software co-design.

### **The Challenge: "Heavy" AI on "Light" Hardware**

Radar-based HAR is a powerful technology that can monitor well-being and activity while preserving privacy. However, the most accurate AI models, like Transformers or complex recurrent networks, are too computationally "heavy" for the small, battery-powered devices needed for in-home or portable use. Our goal was to bridge this gap.

### **Key Outcome 1: RadMamba — A New SOTA for Radar AI**

Instead of just shrinking existing models, we developed a new, radar-specific architecture from the ground up: **RadMamba**. This model, based on efficient state-space models (SSM), is tailored specifically for micro-Doppler signatures.

The results were outstanding. RadMamba achieves state-of-the-art accuracy on multiple public datasets while being **100x to 400x more parameter-efficient** than previous Transformer-based methods, with orders of magnitude fewer FLOPs.

- **Read the full paper (preprint):** "RadMamba: Efficient Human Activity Recognition through Radar-based Micro-Doppler-Oriented Mamba State-Space Model"

  - **Link:** <https://arxiv.org/abs/2504.12039>

### **Key Outcome 2: Neural-HAR — Proving Real-Time, Ultra-Low-Power Inference**

To prove the hardware-software co-design concept, we ran a parallel track to develop an ultra-efficient CNN model (GateCNN) and its dedicated hardware accelerator, **Neural-HAR**.

By co-designing the algorithm and the hardware, we achieved real-time inference on a low-cost Xilinx Z-7007S FPGA. The accelerator demonstrated:

- **Real-Time Speed:** ~107.5 µs latency per inference (far faster than the 20 ms real-time requirement).
- **Ultra-Low Power:** Approximately 15 mW of dynamic power, making it suitable for battery-powered devices.
- **Extreme Efficiency:** The design used **0% of the FPGA's dedicated DSP blocks and 0% BRAM**, proving that complex AI can run on minimal, low-cost hardware.
- **Read the full accelerator paper (preprint):** "Neural-HAR: A Dimension-Gated CNN Accelerator for Real-Time Radar Human Activity Recognition"

  - **Link:** <https://arxiv.org/abs/2510.22772>

### **Open Science and Future Impact**

In line with our commitment to Open Science, all code, models, and scripts to reproduce our results are publicly available.

- **Visit our Open-Source Repository:** <https://github.com/lab-emi/AIRHAR>

The principles developed in AIRHAR are already being applied to new challenges, including efficient Digital Pre-Distortion (DPD) for 5G and 6G transmitters. The project was also instrumental in helping Dr. Chang Gao secure a tenure-track position and a new NWO Veni grant, as well as an industrial collaboration with NXP, to continue this line of research.

We are grateful to the European Commission and the MSCA program for their support, and we look forward to building on the success of this project to create the next generation of efficient, intelligent sensors.
