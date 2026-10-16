# Scene prompt planning and workflow review

## What changed

The existing compilers already expand library choices, resolve conflicting controls, preserve numeric selections and apply clothing-visibility rules. Their final wording can still read like separate keyword inventories. **Scene · connected composition** is a new selectable format that uses those resolved selections to assemble a connected description. Detailed, Compact and checked Ollama formats remain available for comparison.

The planner uses structured data from the compact compiler rather than guessing the meaning of the finished prompt. It preserves the subject-count/framing lead, establishes selected setting, lighting and camera context, then associates each subject's identity, clothing, action and appearance. Shared context is emitted once. It closes with physical scene coherence or temporal continuity. Existing cast-pose, coverage, hidden-detail and wardrobe-layer passes still apply.

Missing context is listed in the Scene plan disclosure. The planner supplies connective language and general perspective/lighting consistency, not an invented location, lens, prop, garment or action. It also reports when the requested cast count exceeds the number of individually described characters. This does not promise that a model will render every selected detail.

## Workflow-specific review

| Workflow family | Scene behavior / task handling |
| --- | --- |
| Krea 2, Kroma, downloaded Krea variants | Natural-language scene narrative with count/framing early; exact selected details and model conditioning retained |
| Chroma HD, Unlocked, Flash and downloaded variants | Natural scene description; no scene-word truncation; existing resolved proportions, coverage and layer guidance retained |
| Z-Image Turbo and Base | Natural scene description from resolved controls; sampler/model loading and zeroed-negative behavior remain separate |
| FLUX.1 Dev and FLUX.2 Klein text-to-image | Natural scene description; sampler settings and model-specific guidance/negative behavior retained |
| Qwen Image and Rapid | Natural scene description; Image/Edit roles are not interchanged |
| SDXL and Pony | Scene organization with supplied compact tag/weight syntax retained; Pony score prefix remains first |
| Qwen Edit, Klein reference editing and Qwen reference composition | Direct edit/composition instructions; no new scene automatically substituted for source/reference instructions |
| WAN image-to-video | Full requested motion retained; previous silent 180-word cutoff removed. Camera movement can change framing instead of fighting a blanket fixed-composition instruction |
| WAN and LTX text-to-video | Scene format includes initial scene, ordered character descriptions and requested action over time as one continuous shot |

The backend AI prompt helper now normalizes downloaded workflow aliases to their model family, applies family-specific syntax guidance to free-form requests too, and asks for connected scene organization without inventing facts. The former blanket instruction to shorten Chroma below 512 tokens was removed: it was app guidance, not a verified encoder limit, and could encourage dropping selected details. Returned suggestions still require review before application; AI instructions do not prove the generated wording retained every fact.

## Try it

In the character builder's Prompt compiler area, choose **Prompt format → Scene · connected composition**. The choice is saved, and the existing desktop/mobile controls expose it. Review the Scene plan and full prompt before rendering. For builder text-to-video, open the Motion prompt disclosure and choose Detailed or Scene there.

Free Text to Image continues to accept literal user text. Its existing Refine with AI action now receives the revised scene-planning/model-family guidance; it does not silently rewrite and submit the user's text. Dedicated reference editors continue to use numbered source-image instructions.

For a useful comparison, keep checkpoint, resolution, seed, sampling settings, LoRAs and character selections fixed. Render Detailed and Scene versions of a neutral clothed studio portrait, then repeat with an environmental scene. Check intended framing, subject count, outfit, action, setting and light. For two people, verify that clothes and appearance stay attached to the right person. For video, check that the complete requested ending and camera movement appear in the submitted prompt, then inspect temporal consistency in the generated clip.

Prompt structure can help communicate intent, but cannot repair missing model files, incompatible LoRA tensors or incorrect sampling settings. Automated wording tests verify selection fidelity and scene structure; GPU output quality still requires the comparisons above.

## Validation scope

Regression coverage includes the Scene output across still-image model families and aliases; full-length framing; age/outfit/action retention; custom weighted wording; independent multi-subject descriptions; Pony score syntax; missing context disclosure; visibility and shared-pose guards; saved format settings; text-to-video temporal instructions; and long image-to-video requests. Backend tests inspect model-family AI guidance and format persistence using mocked providers. No model inference or visual-quality benchmark is included.
