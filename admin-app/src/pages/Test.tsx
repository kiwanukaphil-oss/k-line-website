import { ImageUploader } from "../components/ImageUploader";

// Image upload smoke test — the Phase 1c demo surface. Stays around
// independent of where uploads end up being used (1d-iii product editor,
// 1f homepage hero, etc.) because it's a useful "is the pipeline up?"
// check without touching any other surface.

export function Test() {
  return (
    <div class="page page-test">
      <h1 class="page-title">Image upload — pipeline test</h1>
      <p class="page-lede">
        Drop any PNG or JPEG to confirm the Cloudflare Images pipeline is reachable
        and the API token is set correctly. Successful uploads return a delivery URL
        the rest of the admin can use.
      </p>
      <ImageUploader />
    </div>
  );
}
