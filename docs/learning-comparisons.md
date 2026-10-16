# Controlled image-size comparisons

Open a completed image in Gallery and expand **Compare image sizes · A/B test**. Choose a compatible Learning History recommendation or enter B's width and height, then choose **Generate B and compare**. Manual sizes are available before a recommendation has enough evidence.

A reuses the saved source image; only B is queued. The comparison page shows the same output stage next to each other (preferring originals when available) on desktop and stacked on mobile, with dimensions and the shared seed. Choose **Prefer A**, **Prefer B**, **Tie**, or **Neither**, add optional notes, then save. Previous comparisons are available from the source image and Learning History, and the comparison page can be bookmarked.

The candidate copies the saved recipe and changes width/height, while recording comparison provenance and clearing photoshoot membership. Prompts, seed, sampling controls, LoRAs and character selections are preserved. Original/enhanced variants of one image are supported; multi-image batches and ambiguous outputs are excluded. The source must be one completed image with a known seed, dimensions, full recipe and learning context. This excludes legacy renders without reliable context and reference/edit workflows. Explicit camera aspect ratios take priority. The recorded canvas must belong to a supported latent node; B is checked again to ensure the requested dimensions were applied. Dimensions must differ from A, be between 256 and 2,048 pixels, and be multiples of eight.

The server checks workflow revision before queueing and checks actual graph/model setup, prompt, seed and learning profile before submitting B to ComfyUI. Changing a workflow or model setup causes a rejected comparison rather than a misleading controlled test. Preference saving rechecks both completed records and their links/dimensions. Missing or failed outputs cannot form an assessed pair. Model filenames/settings identify a setup; changed weights under the same filename cannot be detected without weight hashes. Changing canvas size changes latent shape, so matching seed values do not imply identical noise arrays or preserved composition.

Comparison creation uses a durable request UUID as the queue identity. Repeating a request recovers the same comparison/job, including after a response is lost; it does not enqueue a second B. Clearing completed queue entries still leaves the saved result accessible. Queue retry/cancellation retains the existing queue's explicit controls; uncertain submissions are not automatically duplicated by this feature.

Preferences are relative judgments and do not rewrite either image's Gallery framing rating. Learning History shows counts beside a matching image-size recommendation and links recent comparisons. The same prompt/seed/model/size pair counts once, using its latest saved preference. Invalid or deleted pairs do not contribute. Preference counts remain separate from absolute match rates and do not change the recommendation eligibility threshold or apply settings automatically. Summaries check the latest 2,000 comparisons for the selected workflow/profile and disclose truncation.

Endpoints:
- `GET /api/renders/{id}/comparison-options`: compatible, non-dismissed size suggestions.
- `POST /api/learning/comparisons`: create or recover a comparison request.
- `GET /api/learning/comparisons?source_render_id=...`: latest 20 source comparisons.
- `GET /api/learning/comparisons/{id}`: progress, original outputs and assessment.
- `PUT /api/learning/comparisons/{id}/preference`: save a validated relative preference.

Offline checks exercise queue identity, dispatch parity, model drift, preference persistence, duplicate-evidence handling and the UI. Actual image-quality comparisons still require a running ComfyUI installation.
