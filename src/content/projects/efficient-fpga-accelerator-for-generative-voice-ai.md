---
{
  "title": "Efficient FPGA Accelerator for Generative Voice AI",
  "summary": "Co-design an efficient neural speech model and FPGA implementation for real-time voice cloning.",
  "skills": [
    "Python / PyTorch",
    "Verilog / SystemVerilog",
    "Vivado / Vitis"
  ],
  "image": null,
  "status": "Open",
  "source": "https://www.tudemi.com/msc-projects_1"
}
---

**Project Description:** This project builds an **energy-efficient** FPGA-based accelerator for real-time **voice cloning**. We will start from the open-source pipeline **Real-Time-Voice-Cloning** ([GitHub](https://github.com/CorentinJ/Real-Time-Voice-Cloning); [YouTube demo](https://www.youtube.com/watch?v=-O_hYhToKoA)) and **replace the backbone TTS model with EfficientSpeech** ([paper](https://arxiv.org/abs/2305.13905)) to reduce compute and memory costs while preserving naturalness. The student will co-design the model and hardware: apply **quantization, pruning, and sparsity/weight-sharing** to the encoder/decoder blocks, then map the kernels (mel-spectrogram, attention/FFN, vocoder) to an FPGA data path. We will prototype on the **Avnet MiniZed** board ([MiniZed](https://www.avnet.com/americas/products/avnet-boards/avnet-board-families/minized)), targeting end-to-end latency, intelligibility (WER), MOS-style quality metrics, and **performance-per-watt**.

**Ethics & consent:** all cloning experiments must use voices with explicit written consent and include a “cloned audio” watermark.

**Preferred Skills:**

- FPGA design (Verilog/SystemVerilog), toolflows (Vivado/Vitis)
- Python & PyTorch

**Deliverables:**

- Compressed EfficientSpeech-based TTS model integrated into the Real-Time-Voice-Cloning pipeline
- FPGA accelerator on **MiniZed** with real-time inference (encoder/decoder + vocoder offload)

**Reference Material:**

- Real-Time-Voice-Cloning:<https://github.com/CorentinJ/Real-Time-Voice-Cloning>
- Demo video:<https://www.youtube.com/watch?v=-O_hYhToKoA>
- EfficientSpeech paper:<https://arxiv.org/abs/2305.13905>
- Avnet **MiniZed** board:<https://www.avnet.com/americas/products/avnet-boards/avnet-board-families/minized>

**Contact Person:** Dr. Chang Gao (Chang.Gao@tudelft.nl)
