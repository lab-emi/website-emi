---
{
  "title": "Ultra-Low-Power Keyword Spotting Accelerator for RISC-V Audio SoCs",
  "summary": "Design a RISC-V audio accelerator that detects wake words in real time from a continuous microphone stream in noisy environments.",
  "skills": [
    "Verilog / SystemVerilog",
    "RTL simulation and FPGA design",
    "Digital signal processing",
    "Neural network quantization"
  ],
  "image": null,
  "status": "Open",
  "order": 1
}
---

## Project overview

Design and evaluate an ultra-low-power keyword spotting (KWS) accelerator for an on-chip RISC-V subsystem. The project combines AI hardware and hardware–algorithm co-design to enable always-on voice activation with low current draw and fast wake-up.

To express interest, sign in with your TU Delft account and select **I am interested!**. [View on TU Delft Project Forum](https://projectforum.tudelft.nl/course_editions/133/thesis_projects/850)

## Technical scope

- **Audio front end.** Frame and window microphone samples and extract features such as mel-frequency cepstral coefficients (MFCCs) or log filterbank energies (LFBEs).
- **Noise reduction.** Evaluate lightweight methods such as spectral subtraction or adaptive filtering to suppress ambient noise.
- **Keyword spotting.** Implement a compact neural network suitable for hardware deployment, such as a depthwise-separable CNN or a temporal convolutional network.
- **Optional extension.** Explore acoustic echo cancellation to suppress playback leakage using an adaptive filter such as LMS or NLMS.

## Thesis milestones

1. Prototype the audio pipeline in Python or MATLAB. Evaluate INT8 or INT16 fixed-point quantization against a floating-point reference and aim to retain its detection accuracy.
2. Design a fixed-function or programmable low-power accelerator in Verilog or SystemVerilog and integrate it into the RISC-V subsystem.
3. Verify the RTL through simulation and on an FPGA. Use Synopsys Design Compiler to synthesize the design for a 22 nm or 28 nm low-leakage CMOS process, then estimate listening-mode current under documented operating conditions.

## Evaluation targets

- **Listening-mode current.** Below 300 µA during continuous active listening.
- **Keyword detection rate.** Above 95% under representative noisy office and home conditions.

## Candidate profile

Open to students enrolled in or entering an MSc programme in Electrical Engineering, Computer Engineering, Microelectronics or a related field. Candidates should be comfortable with Verilog or SystemVerilog, RTL simulation tools such as VCS or ModelSim, and FPGA workflows such as Vivado or Quartus. A foundation in digital signal processing, audio filtering and neural network quantization is expected, along with the ability to work independently and document design decisions clearly.

## Internship and supervision

An internship opportunity is available at Silicon Integrated Co., Ltd. The project will be jointly supervised by Dr. Chang Gao (TU Delft) and a mentor from the company.
