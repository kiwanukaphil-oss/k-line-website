import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { useLocation, useRoute } from "preact-iso";
import type { Category, Product } from "../../functions/_lib/types";
import { ApiError, archiveProduct, createProduct, getProduct, listCategories, updateProduct } from "../lib/api";
import type { ProductCreateInput, ProductWriteInput } from "../lib/api";
import { ImageManager, type ManagedImage } from "../components/ImageManager";
import { ProductPreview } from "../components/ProductPreview";
import { RevisionHistory } from "../components/RevisionHistory";
import { TagInput } from "../components/TagInput";

// Product editor — handles both edit (route /catalog/:id) and create
// (route /catalog/new). Manual save in 1d-iii; autosave + revision-history
// undo land in 1d-iv. Layout is a two-column grid on desktop (form +
// preview); collapses to single column on mobile.
//
// "Pristine" tracking — we keep the originally-loaded product in state
// alongside the editable copy so we know whether anything has actually
// changed (controls the Save button's disabled state and the "Discard"
// confirm).

const OCCASION_SUGGESTIONS = ["work", "smart-casual", "weekend", "casual", "formal", "event", "sport"] as const;
const BADGE_SUGGESTIONS = ["new", "bestseller", "signature"] as const;
const SIZE_PRESETS: Record<string, readonly string[]> = {
  shirts:    ["S", "M", "L", "XL", "XXL"],
  polos:     ["S", "M", "L", "XL", "XXL"],
  sweaters:  ["S", "M", "L", "XL", "XXL"],
  blazers:   ["S", "M", "L", "XL", "XXL"],
  suits:     ["S", "M", "L", "XL", "XXL"],
  coats:     ["S", "M", "L", "XL", "XXL"],
  jackets:   ["S", "M", "L", "XL", "XXL"],
  gym:       ["S", "M", "L", "XL", "XXL"],
  trousers:  ["30", "32", "34", "36", "38", "40"],
  khakis:    ["30", "32", "34", "36", "38", "40"],
  jeans:     ["30", "32", "34", "36", "38", "40"],
  shoes:     ["40", "41", "42", "43", "44", "45"],
  sandals:   ["40", "41", "42", "43", "44", "45"]
};

interface FormState {
  id: string;
  name: string;
  categorySlug: string;
  price: number;
  salePrice: number | null;
  colorName: string;
  colorHex: string;
  description: string;
  featured: boolean;
  status: Product["status"];
  images: ManagedImage[];
  sizes: string[];
  occasions: string[];
  badges: string[];
}

const EMPTY_FORM: FormState = {
  id: "",
  name: "",
  categorySlug: "",
  price: 0,
  salePrice: null,
  colorName: "",
  colorHex: "#000000",
  description: "",
  featured: false,
  status: "draft",
  images: [],
  sizes: [],
  occasions: [],
  badges: []
};

function productToFormState(p: Product): FormState {
  return {
    id: p.id,
    name: p.name,
    categorySlug: p.categorySlug,
    price: p.price,
    salePrice: p.salePrice,
    colorName: p.colorName ?? "",
    colorHex: p.colorHex ?? "#000000",
    description: p.description ?? "",
    featured: p.featured,
    status: p.status,
    images: p.images.map((i) => ({ url: i.url, alt: i.alt })),
    sizes: p.sizes.map((s) => s.size),
    occasions: [...p.occasions],
    badges: [...p.badges]
  };
}

// Builds the request payload from form state. PATCH always sends the
// complete form state because the backend treats child arrays as full
// replacement; POST needs id/name/categorySlug/price as the required
// quartet.
function formToPatch(form: FormState): ProductWriteInput {
  return {
    name: form.name,
    categorySlug: form.categorySlug,
    price: form.price,
    salePrice: form.salePrice,
    colorName: form.colorName.trim() || null,
    colorHex: form.colorHex || null,
    description: form.description.trim() || null,
    featured: form.featured,
    status: form.status,
    images: form.images,
    sizes: form.sizes.map((s) => ({ size: s })),
    occasions: form.occasions,
    badges: form.badges
  };
}

export function ProductEditor() {
  const route = useRoute();
  const location = useLocation();
  const id = route.params.id as string | undefined;
  const isNew = id === undefined;

  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [pristine, setPristine] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  // Bumped after every save (manual or auto) so the RevisionHistory panel
  // refetches and shows the new entry without us having to drill a callback.
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  // Categories load once on mount, regardless of edit/create.
  useEffect(() => {
    listCategories().then(setCategories).catch((e) => setError(errorMessage(e)));
  }, []);

  // Load existing product when editing. New mode skips this and starts blank.
  useEffect(() => {
    if (isNew) return;
    setLoading(true);
    getProduct(id!)
      .then((p) => {
        const next = productToFormState(p);
        setForm(next);
        setPristine(next);
      })
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  const isDirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(pristine), [form, pristine]);

  // Autosave (1d-iv) — only kicks in when editing an existing product
  // (new products require a manual "Create" first to mint the id). Debounce
  // is 1500ms after the last edit so typing doesn't fire a save per
  // keystroke. The inFlightRef guard prevents concurrent saves; if the user
  // edits during a save, the next idle window picks up the new state.
  const autosaveTimerRef = useRef<number | null>(null);
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (isNew) return;
    if (!isDirty) return;
    if (inFlightRef.current) return;

    if (autosaveTimerRef.current !== null) {
      window.clearTimeout(autosaveTimerRef.current);
    }
    autosaveTimerRef.current = window.setTimeout(() => {
      void runAutosave();
    }, 1500);

    return () => {
      if (autosaveTimerRef.current !== null) {
        window.clearTimeout(autosaveTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runAutosave reads `form` from closure
  }, [form, isDirty, isNew]);

  // The actual autosave call. Skips if validation would obviously fail
  // (empty name) so we don't spam 400s while the user is mid-edit.
  const runAutosave = async () => {
    if (!form.name.trim() || !form.categorySlug || form.price <= 0) return;
    inFlightRef.current = true;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateProduct(id!, formToPatch(form));
      const next = productToFormState(updated);
      setPristine(next);
      // Don't replace `form` here — the user may have continued editing
      // during the save. setting pristine to the saved state is enough to
      // clear the dirty flag for the saved fields.
      setSavedAt(Date.now());
      setHistoryRefreshKey((k) => k + 1);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      inFlightRef.current = false;
      setSaving(false);
    }
  };

  // After a Restore from the history panel, blow away both form and pristine
  // with the freshly loaded product so the editor reflects the restored state.
  const refetchAfterRestore = async () => {
    if (isNew) return;
    setSaving(true);
    try {
      const p = await getProduct(id!);
      const next = productToFormState(p);
      setForm(next);
      setPristine(next);
      setSavedAt(Date.now());
      setHistoryRefreshKey((k) => k + 1);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const sizeSuggestions = useMemo(() => SIZE_PRESETS[form.categorySlug] ?? [], [form.categorySlug]);
  const categoryLabel = useMemo(
    () => categories.find((c) => c.slug === form.categorySlug)?.label ?? "",
    [categories, form.categorySlug]
  );

  const onSave = async () => {
    setError(null);
    setSaving(true);
    try {
      if (isNew) {
        if (!form.id.trim())             throw new Error("Product id is required (e.g. shirts-013)");
        if (!form.name.trim())           throw new Error("Name is required");
        if (!form.categorySlug)          throw new Error("Pick a category");
        if (!Number.isFinite(form.price) || form.price <= 0) throw new Error("Price must be a positive number");

        const created = await createProduct({
          ...formToPatch(form),
          id: form.id.trim(),
          name: form.name,
          categorySlug: form.categorySlug,
          price: form.price
        } as ProductCreateInput);
        const next = productToFormState(created);
        setForm(next);
        setPristine(next);
        setSavedAt(Date.now());
        location.route(`/catalog/${created.id}`, true);  // replace, no back-stack entry
      } else {
        const updated = await updateProduct(id!, formToPatch(form));
        const next = productToFormState(updated);
        setForm(next);
        setPristine(next);
        setSavedAt(Date.now());
        setHistoryRefreshKey((k) => k + 1);
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const onArchive = async () => {
    if (!id) return;
    if (!window.confirm("Archive this product? It'll be hidden from the storefront. Phase 1d-iv adds proper undo.")) return;
    setSaving(true);
    try {
      await archiveProduct(id);
      location.route("/catalog");
    } catch (e) {
      setError(errorMessage(e));
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div class="page page-editor">
        <p class="page-loading">Loading product…</p>
      </div>
    );
  }

  return (
    <div class="page page-editor">
      <header class="editor-header">
        <a href="/catalog" class="editor-back">← Back to catalog</a>
        <div class="editor-title-row">
          <h1 class="page-title">{isNew ? "New product" : form.name || form.id}</h1>
          <SaveStatus isDirty={isDirty} saving={saving} savedAt={savedAt} />
        </div>
      </header>

      {error && <div class="editor-error">{error}</div>}

      <div class="editor-grid">
        <form class="editor-form" onSubmit={(e) => { e.preventDefault(); void onSave(); }}>
          {isNew && (
            <Field label="Product ID" hint="Stable, lowercase, hyphenated. Used in URLs (/product/<id>.html). Example: shirts-013">
              <input
                type="text"
                value={form.id}
                onInput={(e) => update("id", (e.currentTarget as HTMLInputElement).value)}
                class="editor-input"
                pattern="[a-z0-9\-]+"
                required
              />
            </Field>
          )}

          <Field label="Name" hint="Shown on the catalog card and PDP. Keep under 60 characters.">
            <input
              type="text"
              value={form.name}
              onInput={(e) => update("name", (e.currentTarget as HTMLInputElement).value)}
              class="editor-input"
              required
            />
          </Field>

          <div class="editor-row">
            <Field label="Category" hint="Determines the size preset and where the product appears on /shop.">
              <select
                value={form.categorySlug}
                onChange={(e) => update("categorySlug", (e.currentTarget as HTMLSelectElement).value)}
                class="editor-input"
                required
              >
                <option value="" disabled>Select a category</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.label}</option>
                ))}
              </select>
            </Field>

            <Field label="Status" hint="Drafts are hidden from the public site. Phase 1j adds the approval flow.">
              <select
                value={form.status}
                onChange={(e) => update("status", (e.currentTarget as HTMLSelectElement).value as Product["status"])}
                class="editor-input"
              >
                <option value="draft">Draft</option>
                <option value="pending_review">Pending review</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </Field>
          </div>

          <div class="editor-row">
            <Field label="Price (UGX)" hint="Whole shillings, no decimals.">
              <input
                type="number"
                min="0"
                step="500"
                value={form.price}
                onInput={(e) => update("price", parseInt((e.currentTarget as HTMLInputElement).value, 10) || 0)}
                class="editor-input"
                required
              />
            </Field>

            <Field label="Sale price (UGX)" hint="Optional. Leave blank when not on sale.">
              <input
                type="number"
                min="0"
                step="500"
                value={form.salePrice ?? ""}
                onInput={(e) => {
                  const raw = (e.currentTarget as HTMLInputElement).value.trim();
                  update("salePrice", raw === "" ? null : parseInt(raw, 10) || 0);
                }}
                class="editor-input"
              />
            </Field>
          </div>

          <Field label="Images" hint="Drop or click to add. The first image is the cover. Drag tiles to reorder.">
            <ImageManager images={form.images} onChange={(next) => update("images", next)} />
          </Field>

          <div class="editor-row">
            <Field label="Color name" hint='Free text — "Sky Blue", "Charcoal", "Burgundy".'>
              <input
                type="text"
                value={form.colorName}
                onInput={(e) => update("colorName", (e.currentTarget as HTMLInputElement).value)}
                class="editor-input"
              />
            </Field>

            <Field label="Color hex" hint="Used as the swatch behind the colour name.">
              <div class="editor-color-row">
                <input
                  type="color"
                  value={form.colorHex}
                  onInput={(e) => update("colorHex", (e.currentTarget as HTMLInputElement).value)}
                  class="editor-color"
                />
                <input
                  type="text"
                  value={form.colorHex}
                  onInput={(e) => update("colorHex", (e.currentTarget as HTMLInputElement).value)}
                  class="editor-input editor-input-mono"
                  pattern="^#[0-9a-fA-F]{6}$"
                />
              </div>
            </Field>
          </div>

          <Field label="Description" hint="2–3 sentences. Editorial tone. The first sentence shows on the catalog card.">
            <textarea
              value={form.description}
              onInput={(e) => update("description", (e.currentTarget as HTMLTextAreaElement).value)}
              class="editor-textarea"
              rows={4}
            />
          </Field>

          <Field label="Sizes" hint="Click suggested chips or type custom sizes and press Enter.">
            <TagInput
              values={form.sizes}
              onChange={(next) => update("sizes", next)}
              suggestions={[...sizeSuggestions]}
              placeholder="Add a size"
              ariaLabel="Sizes"
            />
          </Field>

          <Field label="Occasions" hint="Tags that drive the /shop occasion filter.">
            <TagInput
              values={form.occasions}
              onChange={(next) => update("occasions", next)}
              suggestions={[...OCCASION_SUGGESTIONS]}
              placeholder="Add an occasion"
              ariaLabel="Occasions"
            />
          </Field>

          <Field label="Badges" hint='"new", "bestseller", "signature" — surfaces on the card.'>
            <TagInput
              values={form.badges}
              onChange={(next) => update("badges", next)}
              suggestions={[...BADGE_SUGGESTIONS]}
              placeholder="Add a badge"
              ariaLabel="Badges"
            />
          </Field>

          <div class="editor-row">
            <label class="editor-checkbox">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => update("featured", (e.currentTarget as HTMLInputElement).checked)}
              />
              <span>Featured on the homepage</span>
            </label>
          </div>

          <footer class="editor-actions">
            <button type="submit" class="editor-button editor-button-primary" disabled={!isDirty || saving}>
              {saving ? "Saving…" : isNew ? "Create product" : "Save changes"}
            </button>
            {!isNew && (
              <button type="button" class="editor-button editor-button-danger" onClick={() => void onArchive()} disabled={saving}>
                Archive
              </button>
            )}
            <a href="/catalog" class="editor-link">Cancel</a>
          </footer>
        </form>

        <ProductPreview
          name={form.name}
          categoryLabel={categoryLabel}
          price={form.price}
          salePrice={form.salePrice}
          colorName={form.colorName.trim() || null}
          colorHex={form.colorHex || null}
          badges={form.badges}
          description={form.description.trim() || null}
          images={form.images}
        />
      </div>

      {!isNew && (
        <section class="history" data-open={historyOpen ? "true" : "false"}>
          <button
            type="button"
            class="history-toggle"
            onClick={() => setHistoryOpen((o) => !o)}
            aria-expanded={historyOpen}
          >
            <span>{historyOpen ? "▾" : "▸"} Revision history</span>
            <span class="history-toggle-hint">Last 50 saves · 30-day retention</span>
          </button>
          {historyOpen && (
            <div class="history-body">
              <RevisionHistory
                productId={id!}
                refreshKey={historyRefreshKey}
                onRestored={() => void refetchAfterRestore()}
              />
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function Field(props: { label: string; hint?: string; children: preact.ComponentChildren }) {
  return (
    <label class="editor-field">
      <span class="editor-field-label">{props.label}</span>
      {props.children}
      {props.hint && <span class="editor-field-hint">{props.hint}</span>}
    </label>
  );
}

function SaveStatus(props: { isDirty: boolean; saving: boolean; savedAt: number | null }) {
  if (props.saving) return <span class="editor-save-status" data-state="saving">Saving…</span>;
  if (props.isDirty) return <span class="editor-save-status" data-state="dirty">Unsaved changes</span>;
  if (props.savedAt) return <span class="editor-save-status" data-state="saved">Saved · just now</span>;
  return <span class="editor-save-status" data-state="clean">No changes</span>;
}

function errorMessage(e: unknown): string {
  if (e instanceof ApiError) return `${e.message} (HTTP ${e.status})`;
  if (e instanceof Error) return e.message;
  return "Something went wrong";
}
