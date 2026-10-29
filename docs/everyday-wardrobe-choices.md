# Everyday wardrobe choices

Adds 65 individual choices: 21 tops, 22 bottoms and 22 footwear options. Tops now include everyday shirts, blouses and knitwear; bottoms include trousers, jeans, shorts and skirts; footwear includes flats, dress shoes, boots and sandals.

In **Build from garments**, open the relevant wardrobe control and choose a group or use its existing search. Original styles remain in the first group. Choosing a new garment does not choose a color, material or fit for you. Full outfit mode continues to use complete outfits; switch to garments to use individual pieces.

Existing saved prompt libraries receive missing choices once, through wardrobe catalog version 2. Existing option labels, keywords, groups and order remain unchanged. Missing fields are not recreated. Previously removed full outfit sets are not reintroduced on version 1 installations. Once the migration has run, users can remove added choices without having them reappear at startup. No library reset or import is needed.

Frontend and backend copies of the additions are checked for equality by the migration tests. Existing selections remain valid.

Deployment requires rebuilding **both backend and frontend**. Browser and generation checks must be performed on the user's running installation; local component tests do not verify ComfyUI output.
