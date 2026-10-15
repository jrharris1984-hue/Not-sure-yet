# LoRA folder matching

The picker reads relative filenames from the connected ComfyUI instance, including nested folders. Files remain on disk and the full relative path is dispatched when selected; the app does not relocate files or enable every adapter at once.

| Folder below models/loras | Workflow family |
| --- | --- |
| Krea, Krea2, Krea 2, Kroma | Krea 2, downloaded Krea variants, Kroma OPD |
| Chroma | Chroma variants |
| Z-Image | Z-Image |
| Flux | FLUX (explicit Klein filenames remain Klein) |
| Flux2_Klein | FLUX.2 Klein |
| Pony | Pony |
| SDXL | SDXL; existing Pony/SDXL allowance retained |
| SD15 | SD 1.5 |
| Wan, Wan2.2 | WAN 2.2 |
| Qwen Image, Qwen Image 2512 | Qwen Image, Rapid |
| Qwen Edit, Qwen Image Edit, Qwen Edit 2511 | Qwen Edit |

Slash and backslash separators work. Nested organization folders can sit below the family directory. More specific family subfolders take precedence; saved manual family assignments take precedence over folder detection. A generic Qwen folder cannot distinguish Image from Edit: use specific subfolders, recognized filenames, or the picker's existing manual assignment control.

Known root filenames continue to use registry metadata. Unclassified root files are not newly assigned by this change. Registered triggers/strengths stay intact. New folder-classified files remain unverified, with no invented trigger words or automatic recommendations. Folder organization is a user's family label, not proof of tensor compatibility or a GPU test. Use the creator's exact model/version requirements when uncertain.

The family profile now recognizes Kroma even after renaming its workflow. LTX is no longer classified as WAN merely because it is a video workflow. Existing optional-adapter injection and single-selection behavior remain in place.

After merging and rebuilding, reload Ultra Studio (and restart ComfyUI if files were moved). Choose a workflow and open its LoRA picker. Family matches are discovered at runtime, so newly added files in recognized subfolders do not need another bundled registry update.
