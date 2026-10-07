"""Memory and timeout limits for the optional local prompt assistants."""
GEMMA_PROMPT_MODELS = frozenset(name.casefold() for name in (
    "ultra-big-tiger-gemma:27b",
    "ultra-gemma3-abliterated:27b",
    "hf.co/TheDrummer/Big-Tiger-Gemma-27B-v3-GGUF:Q4_K_M",
    "mdq100/Gemma3-Instruct-Abliterated:27b",
))


FAST_PROMPT_MODELS = frozenset(name.casefold() for name in (
    "llama3-gradient:8b-instruct-1048k-q4_K_M",
))


LLAMA_PROMPT_MODELS = frozenset(name.casefold() for name in (
    "llama3-gradient:8b-instruct-1048k-q4_K_M",
    "ultra-neuraldaredevil:8b",
    "ultra-dark-champion:18.4b",
    "hf.co/QuantFactory/NeuralDaredevil-8B-abliterated-GGUF:Q4_K_M",
    "hf.co/DavidAU/Llama-3.2-8X3B-MOE-Dark-Champion-Instruct-uncensored-abliterated-18.4B-GGUF:Q4_K_M",
))


def configure_prompt_request(model, payload):
    """Tune local prompt-assistant requests for responsiveness and memory use."""
    normalized = model.casefold()
    if normalized in FAST_PROMPT_MODELS:
        payload["options"].update(num_ctx=4096, num_predict=600)
        payload["keep_alive"] = "10m"
        return 300.0
    if normalized in LLAMA_PROMPT_MODELS:
        payload["options"].update(num_ctx=4096, num_predict=1400)
        payload["keep_alive"] = 0
        return 600.0
    if normalized not in GEMMA_PROMPT_MODELS:
        return 180.0
    payload["options"].update(num_ctx=8192, num_predict=1400)
    payload["keep_alive"] = 0
    return 600.0
