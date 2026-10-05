# Qwen pose and camera reference tools

Run `install-qwen-reference-tools.bat` from this folder. It requires the adjacent PowerShell script and download manifest. It installs the missing pose/camera LoRAs and verifies SHA-256 hashes using Hugging Face metadata. Valid existing files, including AnyPose files in subfolders, are reused. Interrupted downloads use `.part` files and can be resumed. Invalid existing destination files are backed up before replacement.

The default model folder is `%LOCALAPPDATA%\Comfy-Desktop\ComfyUI-Shared\models`. Enter a different models folder if ComfyUI uses another location. It should contain `loras`, `diffusion_models`, `text_encoders`, and `vae`. Additional externally configured model directories must be checked by running with that models root.

```powershell
.\scripts\install-qwen-reference-tools.bat
# Only one action:
.\scripts\install-qwen-reference-tools.bat -Mode Pose
.\scripts\install-qwen-reference-tools.bat -Mode Camera
# Optional: download the base dependencies if missing (about 30 GB):
.\scripts\install-qwen-reference-tools.bat -IncludeBaseModels
```

The default downloads total about 1.74 GB if none are installed. Both workflows reuse:
- `diffusion_models/qwen_image_edit_2511_fp8mixed.safetensors`
- `text_encoders/qwen_2.5_vl_7b_fp8_scaled.safetensors`
- `vae/qwen_image_vae.safetensors`

AnyPose uses its base and helper LoRAs at 0.7, plus **2511** Lightning at 1.0, with four steps and CFG 1. Camera Angle uses the Multiple-Angles LoRA at 0.9, with 40 steps and CFG 4. These use built-in ComfyUI nodes, including `TextEncodeQwenImageEditPlus`, `FluxKontextImageScale` and `CFGNorm`. Update ComfyUI if the dependency check reports missing nodes.

After restarting ComfyUI, click **Settings → Refresh bundled workflows** in Ultra Studio.

**Qwen Change Pose · AnyPose:** upload the original person photo, then a different single-person pose photo or mannequin. The workflow sends the original as image 1 and the target pose as image 2. It requests the original identity, body proportions, outfit, lighting and environment; image 2 supplies pose and framing. Rotate sideways photos upright first.

**Qwen Camera Angle · Multiple Angles:** upload the original photo and select view, camera height and framing. The `<sks>` trigger and exact trained camera descriptors are generated automatically. It requests that the original body pose remains unchanged.

These are reconstruction workflows, not exact pixel-preservation tools. Identity, fabric detail and background can drift, particularly where the new pose/view exposes unseen areas. Test modest changes first. AnyPose's author documents occasional background transfer and limitations with multiple people and complex poses. No live render on your hardware has been verified yet.

Sources:
- https://huggingface.co/lilylilith/AnyPose
- https://huggingface.co/fal/Qwen-Image-Edit-2511-Multiple-Angles-LoRA
- https://huggingface.co/lightx2v/Qwen-Image-Edit-2511-Lightning
- https://huggingface.co/Comfy-Org/Qwen-Image-Edit_ComfyUI
- https://huggingface.co/Comfy-Org/Qwen-Image_ComfyUI
