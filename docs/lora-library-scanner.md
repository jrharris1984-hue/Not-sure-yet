# Installed LoRA scanner

Open the Builder LoRA picker, then **Scan & manage installed LoRAs**. The same component serves desktop and mobile. Search filenames or filter unreviewed files; scan operates on that filtered list. Completed results persist in the application database. Stop finishes the current file before stopping. No generation is submitted.

Local scanning uses the connected ComfyUI `/view_metadata/loras?filename=...` endpoint. It does not require Docker model mounts or load tensors. Older ComfyUI builds, non-safetensors files and files with absent metadata remain reviewable. Training caption frequencies are never treated as trigger lists. Metadata architecture detection is a suggestion, not proof of compatibility.

## Optional exact online matching

From the Windows repository folder:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\Export-LoraHashes.ps1
```

Choose the root LoRA folder. The script recursively hashes files and writes `ultra-studio-lora-hashes.json` in the current directory. It performs no network calls and never modifies model files. Large libraries can take time to hash. Import the JSON in the scanner. Relative paths must match ComfyUI exactly; basename-only matching is deliberately not used. Repeat for additional configured LoRA roots and after replacing files. Changed hashes invalidate previously detected and reviewed profiles for that file.

Enable **Match imported file hashes online (Civitai)** and scan. Only full-file SHA256 values are sent to `https://civitai.com/api/v1/model-versions/by-hash/{hash}`. The returned file list must confirm that hash and model type must be LoRA/LoCon. Model name, base model, trigger words and source link are retained. No thumbnails, model files or remote descriptions are downloaded. Rate limiting stops the scan; missing matches/authentication/service failures retain local metadata. Successful matches are cached. Embedded hashes for a *training base model* are not LoRA file hashes and are never used.

## Review and strengths

Review settings, confirm family/triggers, and save a profile. The numeric range is user supplied; the API does not provide a universally trustworthy recommended range, so this implementation does not infer one from prose. Initial 0 / 0.8 / 1.5 values are explicitly app starting values, not creator recommendations. No detected settings are applied until reviewed. Profiles are stored in the backend; existing browser preferences take precedence field by field to preserve local edits.

The active picker includes model influence slider, numeric entry, reset and saved-default label. Negative influence reaches `LoraLoaderModelOnly`. The backend accepts finite signed strengths, caps them to ±2 (±3.5 for Krea2) and records the capped value in the recipe. A strength control is not proof a LoRA is trained as a semantic slider. No CLIP strength is displayed for a model-only loader. Existing embedded workflow LoRA controls are unchanged.

## Validation and limits

Automated tests cover metadata parsing, exact-hash confirmation, unsafe inventory paths, range validation, negative model-node injection, profile persistence, import invalidation, opt-in network lookup and partial UI scan results. Windows folder dialog/hash export, actual ComfyUI metadata responses, live Civitai access, responsive visual layout and GPU renders still require local verification. The library follows the app's single configured ComfyUI instance; rescan/review when changing that instance. Hash inventory is a local user assertion; the backend cannot independently hash Windows files.

References:
- https://github.com/Comfy-Org/ComfyUI/blob/master/server.py (`view_metadata`)
- https://github.com/Comfy-Org/ComfyUI/blob/master/nodes.py (`LoraLoaderModelOnly`)
- https://github.com/civitai/civitai/wiki/REST-API-Reference (API moved to https://developer.civitai.com)
