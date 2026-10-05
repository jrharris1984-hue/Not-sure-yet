# Qwen text-to-image test models

Two bundled image workflows are included:

| Ultra Studio choice | Model folder | Sampling baseline |
| --- | --- | --- |
| Qwen 2512 · AGQI V2 FP8 | `models/diffusion_models` | Euler / simple, 40 steps, CFG 4 |
| Qwen Rapid AIO v23 · Text to Image | `models/checkpoints` | Euler ancestral / beta, 4 steps, CFG 1 |

AGQI replaces the base Qwen diffusion model. It still uses `qwen_2.5_vl_7b_fp8_scaled.safetensors` in `models/text_encoders` and `qwen_image_vae.safetensors` in `models/vae`. Reuse the companions from the existing Qwen workflows. Rapid AIO includes the encoder and VAE and already contains acceleration; these templates do not add another Lightning LoRA. Neither template requires an input photograph.

The AGQI workflow targets V2 **FP8**, not the BF16 variant. Recognized filenames include `agqi2512NSFW_agqi2512V2_full_fp8.safetensors` as well as `AGQI_2512_V2_fp8_e5m2.safetensors`, `agqi2512NSFW_agqi2512V2_2456477.safetensors` and `agqi2512NSFW_agqi2512V2.safetensors`. Rapid accepts `Qwen-Rapid-AIO-NSFW-v23.safetensors` and Civitai’s `phr00tQwenImageEditRapid_v230.safetensors`. Keep the original filename when copying manually. ComfyUI subfolders are resolved at render time; another Qwen version is never silently substituted.

After copying completed files, restart ComfyUI and select **Settings → Refresh bundled workflows** in Ultra Studio. Use either workflow in the Character Builder or Freeform Text to Image. Start with one image and the Draft tier before trying larger canvases. Download size is not a guarantee that the model fits entirely in GPU memory; offloading, RAM and ComfyUI settings affect whether it runs.

## Optional installer

From the repository PowerShell terminal:

```powershell
.\scripts\install-qwen-t2i-test-models.bat
```

The batch file also works by itself from Downloads: it contains the PowerShell script, transfer helper and model manifest and extracts temporary copies automatically. Standalone mode installs both models. Advanced flags use the companion scripts in the repository. It verifies existing models and completed downloads with SHA-256 before reusing them. Completed files in your Downloads folder are copied rather than moved. Hashing these large files can take several minutes. It never downloads the separate Qwen base diffusion model.

Options:

```powershell
# Only AGQI; install missing encoder/VAE companions too
.\scripts\install-qwen-t2i-test-models.bat -Mode AGQI -IncludeCompanions

# Only the all-in-one Rapid checkpoint
.\scripts\install-qwen-t2i-test-models.bat -Mode Rapid

# Custom ComfyUI models folder and completed-download folder
.\scripts\install-qwen-t2i-test-models.bat -ModelsRoot "G:\Comfy.ui\models" -ImportFolder "D:\Downloads"

# List planned files without downloading
.\scripts\install-qwen-t2i-test-models.bat -ListOnly
```

Downloads resume through `.part` files with up to five attempts and are verified before installation. A complete file that passes SHA-256 is accepted even if curl reports a connection error at the end. Incomplete data stays in place for the next attempt. A full-length file with an invalid checksum is retained separately before a fresh transfer. Full-size browser `.crdownload`, `.part` and `.download` files in Downloads can also be recovered if their checksum matches the selected model; browser originals are left untouched. At 100%, hashing can take several minutes and does not mean the download has restarted. Existing mismatched destination files are backed up. If Civitai requires authentication, complete the website download and copy it manually, or provide your own `CIVITAI_API_KEY` environment variable to the installer. No key is stored in the repository.

## Sources

- AGQI V2 FP8: https://civitai.red/models/2281041/agqi2512nsfw?modelVersionId=2567280 (file ID 2456477; the author's baseline also permits 20 or 40–50 steps).
- Rapid AIO v23: https://huggingface.co/Phr00t/Qwen-Image-Edit-Rapid-AIO (author documents text-to-image with no image inputs, CFG 1 and 4–8 steps; v23 uses Euler ancestral / beta).
- Shared companions: https://huggingface.co/Comfy-Org/Qwen-Image_ComfyUI

The installer pins hashes for the two model versions. The shared-companion downloads resolve and verify Hugging Face metadata before downloading. The workflows have offline tests; Windows installer execution and actual ComfyUI outputs still need validation on the user's machine.
