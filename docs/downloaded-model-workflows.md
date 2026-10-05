# Downloaded models in Ultra Studio

Save model weights in the models directory used by your **ComfyUI server**, not Ultra Studio's Docker containers.
If your shared installation still uses `C:\Users\jrhar\AppData\Local\Comfy-Desktop\ComfyUI-Shared\models`, append the folder below to that path. Confirm the file appears in the corresponding ComfyUI loader dropdown.

| File | Folder under models | Ultra Studio workflow |
| --- | --- | --- |
| `krea2TurboNSFWAIO_v10.safetensors` | `checkpoints` | Krea 2 Turbo · AIO v1.0 |
| `qwenImageEditRemix_aioV20.safetensors` | `checkpoints` | Qwen Remix AIO v2 · Image Edit |
| `sulphur2DistilledNVFP4_nvfp4.safetensors` | `checkpoints` | Sulphur 2 Distilled NVFP4 · Text → Video + Audio |
| `ltx_full_vae.safetensors` | `vae` | Required Sulphur companion |
| `gemma_3_12B_it_fp4_mixed.safetensors` | `text_encoders` (subfolders also work) | Required Sulphur companion |

Krea and Qwen AIO use CheckpointLoaderSimple's model, encoder, and VAE outputs. No additional acceleration LoRA is added. Qwen uses the uploaded source image in both edit conditioning and VAE encoding. Its initial recipe is 8 steps, CFG 1, Euler ancestral/beta; the step count is a starting point, not a measured optimum.

Sulphur uses CheckpointLoaderSimple, LTXAVTextEncoderLoader and LTXVAudioVAELoader, all of which enumerate **checkpoints**. The publisher's README lists diffusion_models, but its provided API graph uses checkpoint loaders. For this bundled workflow, use checkpoints. The standalone full video VAE replaces the embedded video VAE, as required by the quantizer. Keep the embedded audio VAE through LTXVAudioVAELoader.

The published quantizer graph has been adapted: filenames, photographic example prompt, output prefix, and audio duration. Current native LTXVEmptyLatentAudio takes video frames and frame rate and computes the audio latent count internally; passing the publisher's precomputed 289 count would produce the wrong duration. Ultra Studio keeps video frames, audio frames, conditioning frame rate, and playback FPS aligned. LTX dimensions use multiples of 32, with 8n+1 video frames.

## Enable

1. Update ComfyUI so the native Krea, Qwen Edit Plus and LTX audio/video nodes are available.
2. Save weights in the folders above; restart ComfyUI.
3. For Sulphur NVFP4, the quantizer reports needing ComfyUI launch arguments `--disable-async-offload --disable-dynamic-vram`. Configure these on ComfyUI's own launcher, not Docker Compose.
4. Merge the workflow change, update Ultra Studio and rebuild. In Settings, refresh/install bundled workflows. Existing saved workflows are retained.
5. Choose Krea AIO for new images, Qwen Remix for edits (upload a source image), or Sulphur for a complete video description. Include `Audio: ...` to describe sound. Start video testing with the Draft recipe.

The dispatch check resolves exact filenames inside subfolders and reports missing nodes or companion files. It never replaces a missing model with an unrelated checkpoint. Alternate publisher filenames accepted: `Qwen-Image-Edit-Remix-AIO-v2.0.safetensors` and `sulphur_distil_nvfp4.safetensors`.

The Sulphur quantizer reports a ~19 GB checkpoint tested on GB10 and describes a 32 GB GPU fit. This does not establish performance or compatibility on your RTX 4060/4070 Super. Offloading, available system memory and NVFP4 support in your installed ComfyUI/PyTorch must be tested locally. No GPU render was performed while preparing these workflows.

## Sources

- Krea author: https://huggingface.co/lynaNSFW/Krea2turboNSFWAIO
- Qwen publisher on behalf of author: https://huggingface.co/RunningHubAI/rh-qwen-image-edit-remix-aio-v2.0-checkpoint
- Sulphur quantizer and original API graph: https://huggingface.co/coolthor/Sulphur-2-distilled-NVFP4
- Native LTX audio and loader definitions: https://github.com/Comfy-Org/ComfyUI/blob/master/comfy_extras/nodes_lt_audio.py
- Native ComfyUI model folders: https://github.com/Comfy-Org/ComfyUI/blob/master/folder_paths.py
