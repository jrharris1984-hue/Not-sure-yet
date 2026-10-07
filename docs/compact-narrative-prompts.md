# Compact prompt format

In the character builder's generation area, choose **Prompt format → Compact · ordered description**. On mobile, tap **Settings** beside Generate in the bottom sheet, then find **Prompt compiler** beneath the output controls. The mobile render review and the full prompt preview also offer this selector. The choice is saved to the server and remembered in the browser. Switching formats clears a manually applied prompt override so the new format is actually submitted. Detailed remains the initial default for comparison.

Compact mode runs the existing wardrobe, age, pose, physique and composition resolvers, then describes each person independently in this order: identity and age, appearance, clothing, pose/framing, additional selections, then the shared scenario, setting, lighting, camera and style. The format never tries to identify selections by searching an already-expanded paragraph.

Qwen, Chroma, Z-Image, Krea and FLUX use ordered descriptive text. SDXL/Pony use comma-separated phrases within the same subject boundaries; Pony retains its quality and gender/count tags. Edit and video instruction compilers retain their existing output. Model-specific negative conditioning remains in place. Library rules and manually supplied freeform/LoRA text still apply.

## Library wording

Each option can now store:

- `short`: optional compact natural wording, maximum 500 characters.
- `short_tags`: optional compact SDXL/Pony tags, maximum 500 characters; falls back to `short`.

Edit these under the choice in Prompt Library. **Preview compact prompt** uses the unsaved draft. **Save library** makes the wording available to new renders; backups preserve both fields. Old libraries require no re-import.

When there is no compact wording, custom keywords are retained in full. Built-in appearance fields use concise contextual labels instead of repeated expansion boilerplate. No generic adjective-merging or text truncation is applied. A heavily detailed custom library can therefore still produce long prompts.

**Suggest compact wording with Ollama** (or the configured assistant) proposes a phrase for the current choice only. Review it, click **Apply compact wording**, then save the library. Suggestions cannot automatically rewrite the whole cast or replace detailed keywords. Check that every unique attribute and exact trigger or weight remains; generated suggestions are not a semantic guarantee.

## Verification and limits

The preview reports **word counts**, not tokenizer counts. Compact output preserves resolved active selections, rather than inactive cached clothing options or combinations removed by conflict rules. It does not promise a fixed token limit or guarantee every detail appears in a generated image.

Compare Detailed and Compact with the same character, workflow and seed in your own ComfyUI. Small details may need closer framing or a separate refinement workflow. This update does not install custom nodes or add automatic detail passes.

## Ollama format and saved preference

**Prompt format → Ollama · checked description** uses the Ollama URL and text model from Settings, even when another assistant provider is selected for other tools. It first compiles the resolved compact description, then asks Ollama to arrange that wording. Required phrases, numbers, weights, explicit negations and person ownership receive conservative checks. A failed check or unavailable model falls back to the compact description, with a visible status message. These are phrase checks, not a guarantee of semantic equivalence or image quality; novel paraphrases may be rejected deliberately.

Compilation starts after selections settle briefly. Requests from older selections are cancelled/discarded; generation waits until the current request finishes or falls back. Extra reference notes and LoRA triggers retain their existing handling. Edit/video workflows retain their dedicated instruction compilers.

All three formats are saved as the server preference when selected and mirrored in the browser. Other devices load that preference. If saving to the server fails, a message explains that only the browser preference was retained. Normal Settings saves do not overwrite this hidden preference. Choosing a different format also clears a manual prompt override, so the chosen compiler is used.

## Web-assisted prompting on mobile

In the character bottom sheet, open **Settings → Prompt compiler → Use web research with AI**. Configure the Ollama web search key in the app's main Settings first, and select Local Ollama as the assistant provider for prompt-assistance tools. The Ollama compiler always uses your configured local Ollama model independently of that provider selection.

Ultra Studio searches for reference snippets and passes them to the local assistant; the local model does not browse independently. Optional research focus narrows the search, and **Latest research sources** shows retrieved links. This shared toggle applies to interactive AI assistance and the Ollama compiler until it is switched off or the app reloads. Changing research settings recompiles the current Ollama description. The compiler's phrase checks still reject omitted or invented selections; web-assisted suggestions should be reviewed before applying.

For a cast of two or more people, mobile **Pose & framing → Poses for 2 people** (or the current cast size) opens the same shared composition choices as desktop. Choosing one edits the current person's pose and sets wide framing, matching desktop behavior; it preserves the other person's character settings.
