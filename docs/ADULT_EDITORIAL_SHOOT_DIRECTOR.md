# Adult Editorial Shoot Director

The Studio 3.0 Shot Director can create adult editorial plans with 40, 80, or 120 frames. Six built-in themes are available: Editorial Day-to-Night, Private Suite Boudoir, Heels & Hosiery Editorial, Retro Glamour, Resort Glamour, and Foot Fetish · Heels, Hosiery & Care.

Each template divides the shoot into four collapsible chapters and maps the coverage progression over eight stages: selected outfit, slightly revealing, revealing outfit, open or shifted outfit, lingerie showing, lingerie only, partially nude, and nude. The opening stages keep the wardrobe in place; per-frame wardrobe directions then describe a gradual, one-layer-at-a-time change. The final stage is non-explicit adult fine-art posing.

Each shot can be edited before queueing, including pose, subject view, camera height, framing, lens, outfit direction, coverage, backdrop, lighting, and wardrobe action. The foot-care theme adds hosiery, foot posing, and cosmetic lotion or massage-oil skin finishes. The subject remains the selected saved character; use **Edit this character** to adjust its DNA or the character selector to switch to another saved character. Draft plans are stored in that browser's local storage under the character ID.

## Validation limits

- The backend accepts and queues up to 120 frames in one shoot. ComfyUI processes the resulting renders through the existing queue, so a 120-image run may take a long time and will use the selected workflow's memory and sampling requirements.
- Prompt directions are per-frame and are editable, but text-to-image generation cannot guarantee exact garment removal, identical facial identity, or a distinct camera result in every image. Review the compiled prompts and run a small sample before committing a long render.
- Studio 3.0 code-level plan and backend unit checks pass in the development workspace. Full frontend build and Jest tests require the frontend dependencies, which are not installed in that workspace. Render quality, wardrobe transitions, and GPU behavior still need validation on the user's Windows ComfyUI system.
