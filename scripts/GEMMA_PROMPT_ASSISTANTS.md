# Gemma 27B prompt assistants on Windows

Install or update [Ollama](https://ollama.com/download/windows), then open the Ollama app. From PowerShell in your Ultra Studio repository:

```powershell
.\scripts\install-gemma-prompt-assistants.bat
```

Choose Big Tiger, Gemma 3 Abliterated, or both. To skip the menu, pass `--tiger`, `--abliterated`, or `--both`. Failed downloads can be resumed by running the same command again. The installer reports failure with exit code 1 and does not change Ultra Studio settings.

| Settings name | Download source | Local Ollama alias |
| --- | --- | --- |
| TheDrummer Big Tiger Gemma 27B v3 | [Author's Q4_K_M GGUF](https://huggingface.co/TheDrummer/Big-Tiger-Gemma-27B-v3-GGUF) | `ultra-big-tiger-gemma:27b` |
| Gemma 3 27B Instruct Abliterated | [mdq100's Q4_K_M package](https://ollama.com/mdq100/Gemma3-Instruct-Abliterated:27b) | `ultra-gemma3-abliterated:27b` |

These are text prompt assistants, separate from ComfyUI's checkpoints and text encoders. Ollama manages their model folder; no manual file copying is needed. Big Tiger downloads about 17.3 GB and the abliterated package about 17 GB. Allow roughly 35 GB for both. The aliases reuse the downloaded weights. Memory needs exceed file size; a smaller GPU may require RAM offload and respond slowly.

After installation, go to **Settings → AI Assist → Local Ollama → Check again**. Select either under **Prompt assistant model**, then **Save AI settings**. Keep a vision-capable model selected independently under **Image review model**. Models that are not installed appear disabled. Existing models remain available.

The backend uses an 8,192-token context and at most 1,400 generated tokens for these assistants, allows up to ten minutes for a response, and unloads them afterward to release memory for ComfyUI. Each subsequent request must reload the model. These limits also apply if you choose their original download names instead of the aliases.

For Docker Desktop on the same Windows PC, the existing Ollama URL is normally `http://host.docker.internal:11434`. The installer respects `OLLAMA_HOST` if configured and never changes Ollama's network binding or your image-review selection.
