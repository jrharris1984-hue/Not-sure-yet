# Photo shoot queue

New photo shoots save every frame into Ultra Studio's persistent render queue. The shared worker submits one job at a time and waits for it to finish before starting the next. Other renders and shoots share this order. Seeds, resolved per-frame prompts, cast selections and outfit variations are saved with each job.

Open **Queue** from a shoot's **View render queue** link. Each shoot job shows its frame number and a link back to the shoot. Waiting frames can be cancelled, and failed or cancelled jobs can be retried. Retrying from the shoot also uses the same queue.

Closing the browser does not stop rendering. Already saved queue jobs survive backend restarts. Clearing finished queue history preserves the render links used by shoot thumbnails, covers and downloads. Deleting a shoot cancels its waiting jobs so they cannot create additional photos afterward.

Existing shoots submitted directly to ComfyUI keep their original render links. This change applies to new shoots and retries; it does not move jobs already accepted by ComfyUI into the app queue. Let those jobs finish before testing a new shoot.

## Planning a shoot

Setup is organized into **Character**, **Shot list**, **Wardrobe**, **Set & lighting**, and **Review & queue**. Sections keep their state when you switch. Set, light and camera choices apply to every subject and frame; per-shot AI lighting can override the shared lighting. On mobile the full frame review appears in the final section, while desktop keeps it beside the active controls.

**Match saved photo** uses the character's default photo, or its latest non-shoot render, with a standard Qwen image-edit workflow. The same original photo is uploaded once and passed to every queued frame and retry. Instructions ask to preserve the people, faces, ages, hair and body proportions while changing the planned pose, wardrobe and scene. Large changes can still cause identity drift; this is not a guaranteed face lock. Choose a different default photo through the character's image picker in Library before starting a new shoot.

**Generate from selections** reuses the source workflow, seed, selected LoRAs and sampling controls when available. Switching workflows clears incompatible LoRA overrides and stops carrying sampling settings from the previous model. Text-only prompts and even identical seeds cannot guarantee an identical face after pose or wardrobe changes. Source render settings are recovered for existing characters; no prompt-library reupload is needed.
