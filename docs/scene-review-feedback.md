# Scene review and render feedback

Builder's Prompt String includes a collapsed **Scene review** for image creation. Text-to-video includes it inside the motion prompt panel. Expand it to inspect resolved subjects, outfits, poses, framing and shared scene context. Unspecified scene, lighting and camera settings are disclosed. Existing compiler adjustment notes appear when available.

The review uses resolved compiler inputs. It does not infer facts from a generated image or independently certify that the final prompt contains every selection. Manual prompt edits, plain-language additions and AI suggestions may differ; inspect the saved final prompt for the actual submitted wording. Generation prompts and model sampling settings are unchanged.

Each Builder render stores its intentions in `scene_review` and the reusable `render_recipe.scene_review`. Smart-shoot, pose and camera batch variations compile their own snapshot. Pose-assist's final render also retains intentions. Feedback updates do not rewrite that snapshot, the prompt, seed or recipe.

Open an image in Gallery to expand **Saved scene intentions** and **How did this result match?** Rate likeness, pose, outfit, framing and scene/lighting as matched, missed, not applicable or not assessed. Save optional notes with **Save feedback**. Reloading restores the saved ratings. A failed save retains the draft for retry. Selecting another render starts its own draft.

Older renders and render paths that do not compile character selections can still receive feedback; they show that no intentions were saved. Reference edits and image-to-video do not invent scene plans from unused character DNA. Existing AI image alignment review remains a separate optional tool.

`PUT /api/renders/{id}/scene-feedback` accepts bounded typed ratings and up to 2,000 characters of notes. Empty ratings/notes clear the assessment. Missing renders return 404 and invalid inputs return 422. This stores human feedback for review; it does not train a model, adjust settings automatically or guarantee image quality.
