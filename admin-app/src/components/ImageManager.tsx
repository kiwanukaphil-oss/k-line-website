import { useRef, useState } from "preact/hooks";
import { resolveImageUrl } from "../lib/imageUrl";

// Manages a product's image list: shows current images as a horizontal
// strip, supports drag-to-reorder, click-X to remove, and adds new images
// via the same Cloudflare Images direct-creator-upload pipeline as Phase 1c.
// First image (index 0) is treated as the cover; the editor can drag any
// image to that position.

export interface ManagedImage {
  url: string;
  alt: string | null;
}

interface Props {
  images: ManagedImage[];
  onChange: (next: ManagedImage[]) => void;
}

type UploadState = "idle" | "uploading" | { error: string };

type UploadUrlResponse = {
  ok: boolean;
  imageId?: string;
  uploadURL?: string;
  accountHash?: string;
  error?: string;
};

export function ImageManager(props: Props) {
  const { images, onChange } = props;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [upload, setUpload] = useState<UploadState>("idle");
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  // Adds a fresh upload to the end of the list. Errors surface in the
  // upload-state slot rather than the chip strip, keeping the visual
  // diff small.
  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setUpload({ error: `${file.name} isn't an image — got ${file.type || "unknown type"}.` });
      return;
    }
    setUpload("uploading");
    try {
      const urlRes = await fetch("/api/images/upload-url", { method: "POST" });
      const urlData = (await urlRes.json()) as UploadUrlResponse;
      if (!urlRes.ok || !urlData.ok || !urlData.uploadURL || !urlData.imageId || !urlData.accountHash) {
        throw new Error(urlData.error ?? "Could not get an upload URL");
      }
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch(urlData.uploadURL, { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error(`Cloudflare Images rejected the upload (HTTP ${uploadRes.status})`);

      const url = `https://imagedelivery.net/${urlData.accountHash}/${urlData.imageId}/public`;
      onChange([...images, { url, alt: null }]);
      setUpload("idle");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setUpload({ error: message });
    }
  };

  const onPick = (e: Event) => {
    const file = (e.currentTarget as HTMLInputElement).files?.[0];
    if (file) void uploadFile(file);
    (e.currentTarget as HTMLInputElement).value = "";  // allow re-picking same file
  };

  // Reorder by drag: drop at the dragIndex's new position.
  const onDragStart = (index: number) => setDragIndex(index);
  const onDragOver = (e: DragEvent) => e.preventDefault();
  const onDropTarget = (targetIndex: number) => {
    if (dragIndex == null || dragIndex === targetIndex) {
      setDragIndex(null);
      return;
    }
    const next = images.slice();
    const [moved] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, moved);
    onChange(next);
    setDragIndex(null);
  };

  const remove = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div class="image-manager">
      <div class="image-manager-strip">
        {images.map((img, index) => {
          const src = resolveImageUrl(img.url);
          return (
            <div
              key={`${img.url}-${index}`}
              class="image-manager-tile"
              data-cover={index === 0 ? "true" : undefined}
              draggable
              onDragStart={() => onDragStart(index)}
              onDragOver={onDragOver}
              onDrop={() => onDropTarget(index)}
            >
              {src ? <img src={src} alt={img.alt ?? ""} loading="lazy" /> : <span class="image-manager-tile-broken">missing</span>}
              {index === 0 && <span class="image-manager-cover-badge">Cover</span>}
              <button
                type="button"
                class="image-manager-remove"
                onClick={() => remove(index)}
                aria-label={`Remove image ${index + 1}`}
              >
                ×
              </button>
            </div>
          );
        })}
        <button
          type="button"
          class="image-manager-add"
          onClick={() => fileInputRef.current?.click()}
          data-state={upload === "uploading" ? "uploading" : "idle"}
        >
          {upload === "uploading" ? "Uploading…" : "+ Add image"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          class="image-manager-input"
          onChange={onPick}
        />
      </div>
      {typeof upload === "object" && (
        <p class="image-manager-error">{upload.error}</p>
      )}
      {images.length > 0 && (
        <p class="image-manager-hint">
          Drag tiles to reorder. The first image is the cover used in the catalog and product card.
        </p>
      )}
    </div>
  );
}
