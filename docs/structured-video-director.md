# Structured video director

Open a video workflow and choose **Build a shot** in the Video director. On mobile text-to-video, the same controls are in the generation/output sheet. The original **Write freely** mode remains the default for existing drafts.

The main controls are Action, Camera movement and Pacing. Expand Beginning, ending & continuity to add an opening action, ending action and details to preserve. Each text field accepts up to 800 characters. Only one camera preset and one pacing preset can be selected. Empty optional controls add nothing; camera and pacing alone do not count as a video description.

For text-to-video, the director places the action sequence first and combines it with the selected character, clothing, setting, lighting and framing using the existing scene compiler. Selected static poses are described as initial poses. Structured direction is not passed through the old word-budget trimming pass, so a late action or audio instruction is not discarded. Detailed and Scene formats share this structured shot convention while the director is enabled.

For image-to-video, the starting frame remains the source for appearance and composition. The director supplies motion and continuity instructions, rather than adding a newly compiled character description.

Audio direction is shown and included only for the recognized LTX/Sulphur style when the stored graph contains audio decoding and a linked CreateVideo audio input. The control does not install audio nodes or add audio support to WAN. Saved audio direction is retained when switching to an unsupported workflow but is not included by the director there. Explicit freeform text remains user-controlled.

Structured choices and freeform notes are saved in the existing tab draft. Switching writing modes retains the fields. Editing direction clears a stale prompt override/exact mode so the preview reflects the new instruction. Opening an exact render recipe uses its stored prompt and does not silently append old director fields. Gallery handoff and reset clear stale director state. AI expansion converts the current assembled direction to freeform text and resets the structured fields, preventing the same instructions being added twice.

The final preview and video_instruction payload use the same compiled result. Existing image-LoRA isolation and image-to-video source-image checks remain in place. No workflow JSON, model settings or backend data schema changes are required.

Validation: 105 tests passed across six suites, including chronological composition, optional controls, audio gating, WAN/LTX prompt and payload integration, source-image behavior, draft restoration and writing-mode retention. Production build passed with the existing bundle-size warning. Browser checks and GPU renders remain pending.

Local acceptance:

1. Select text-to-video, enable Build a shot and enter a simple action. Add a start, ending and camera choice; inspect the final motion prompt.
2. Repeat in the mobile output sheet. Confirm an action-only structured setup enables generation without requiring duplicate freeform notes.
3. Switch to image-to-video and supply a starting image. Check that motion remains present without a separate character redesign.
4. Switch between WAN and the audio-enabled Sulphur graph. Verify audio controls and structured audio wording appear only for Sulphur.
5. Reload a saved draft, switch writing modes and reopen an exact recipe. Verify director choices persist in drafts and exact prompts remain exact until edited.

The duration hint is approximate. Start with one simple action for a short clip. These controls express intent; they do not guarantee exact timing, identity preservation, sound or visual quality from the model.
