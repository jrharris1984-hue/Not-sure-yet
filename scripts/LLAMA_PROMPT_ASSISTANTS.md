# Lighter prompt assistant downloads on Windows

Keep Ollama running, then launch `install-llama-prompt-assistants.bat` from this folder, or run it from PowerShell in your Ultra Studio repository:

```powershell
.\scripts\install-llama-prompt-assistants.bat
```

Choose 1 for Dark Champion, 2 for NeuralDaredevil, or 3 for both. Optional arguments skip the menu: `--champion`, `--daredevil`, `--both`. Downloads resume when you rerun the installer. It leaves your downloaded Gemmas and existing settings intact.

| Assistant | Download | Alias used in Ultra Studio |
| --- | --- | --- |
| NeuralDaredevil 8B Abliterated | [QuantFactory Q4_K_M](https://huggingface.co/QuantFactory/NeuralDaredevil-8B-abliterated-GGUF), about 4.9 GB | `ultra-neuraldaredevil:8b` |
| Llama 3.2 Dark Champion 8×3B MoE | [DavidAU Q4_K_M](https://huggingface.co/DavidAU/Llama-3.2-8X3B-MOE-Dark-Champion-Instruct-uncensored-abliterated-18.4B-GGUF), about 11.3 GB | `ultra-dark-champion:18.4b` |

Dark Champion has **18.4B total parameters**, not 8B. “8×3B” describes its mixture of experts. Memory requirements include weights and runtime overhead; an 11.3 GB download does not guarantee it fits a 12 GB GPU. NeuralDaredevil is the lighter option. Allow about 17 GB of disk space to install both. Ollama stores their weights automatically; the aliases reuse the files.

In Ultra Studio, open **Settings → AI Assist → Local Ollama → Check again**, select either model under **Prompt assistant model**, then **Save AI settings**. Both Gemmas and your other installed models remain selectable. Image review uses its separate model setting; these text assistants do not replace it.

The two new assistants use a 4,096-token context and at most 1,400 generated tokens. Ultra Studio allows up to ten minutes per response and unloads the model afterward to release memory for ComfyUI. The next request reloads it. Direct source names use the same settings as the aliases. Prompt quality and structured output still depend on the model; this integration does not guarantee every described change will appear in generated images.

The installer requires a current Ollama installation and internet access. It respects `OLLAMA_HOST`, does not change network bindings, and exits with code 1 if a download or alias creation fails. Downloading models does not automatically activate them in Ultra Studio.
