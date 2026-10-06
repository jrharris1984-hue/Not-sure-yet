# Photo shoot queue

New photo shoots save every frame into Ultra Studio's persistent render queue. The shared worker submits one job at a time and waits for it to finish before starting the next. Other renders and shoots share this order. Seeds, resolved per-frame prompts, cast selections and outfit variations are saved with each job.

Open **Queue** from a shoot's **View render queue** link. Each shoot job shows its frame number and a link back to the shoot. Waiting frames can be cancelled, and failed or cancelled jobs can be retried. Retrying from the shoot also uses the same queue.

Closing the browser does not stop rendering. Already saved queue jobs survive backend restarts. Clearing finished queue history preserves the render links used by shoot thumbnails, covers and downloads. Deleting a shoot cancels its waiting jobs so they cannot create additional photos afterward.

Existing shoots submitted directly to ComfyUI keep their original render links. This change applies to new shoots and retries; it does not move jobs already accepted by ComfyUI into the app queue. Let those jobs finish before testing a new shoot.
