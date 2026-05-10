import { useRef, useState } from "preact/hooks";

// Direct-creator-upload flow with Cloudflare Images. The browser asks our
// /api/images/upload-url for a one-time URL, then POSTs the file straight to
// Cloudflare. No file bytes pass through our Worker. The variants array in
// the response is purely informational; the canonical delivery pattern is
// `https://imagedelivery.net/{accountHash}/{imageId}/{variantName}`.

type UploadState =
  | { phase: "idle" }
  | { phase: "uploading"; fileName: string }
  | { phase: "success"; imageId: string; accountHash: string; fileName: string }
  | { phase: "error"; message: string };

type UploadUrlResponse = {
  ok: boolean;
  imageId?: string;
  uploadURL?: string;
  accountHash?: string;
  error?: string;
};

const VARIANTS = ["public"] as const;

export function ImageUploader() {
  const [state, setState] = useState<UploadState>({ phase: "idle" });
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => setState({ phase: "idle" });

  // Handles a single file from drop or picker. Validates type, requests a
  // signed URL, and POSTs the file. Errors at any step land in the error
  // phase with a human-readable message.
  const uploadFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setState({ phase: "error", message: `${file.name} isn't an image — got ${file.type || "unknown type"}.` });
      return;
    }

    setState({ phase: "uploading", fileName: file.name });

    try {
      const urlRes = await fetch("/api/images/upload-url", { method: "POST" });
      const urlData = (await urlRes.json()) as UploadUrlResponse;

      if (!urlRes.ok || !urlData.ok || !urlData.uploadURL || !urlData.imageId || !urlData.accountHash) {
        throw new Error(urlData.error ?? "Could not get an upload URL from Cloudflare Images");
      }

      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch(urlData.uploadURL, {
        method: "POST",
        body: formData
      });

      if (!uploadRes.ok) {
        throw new Error(`Cloudflare Images rejected the upload (HTTP ${uploadRes.status})`);
      }

      setState({
        phase: "success",
        imageId: urlData.imageId,
        accountHash: urlData.accountHash,
        fileName: file.name
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setState({ phase: "error", message });
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) void uploadFile(file);
  };

  const onPick = (e: Event) => {
    const file = (e.currentTarget as HTMLInputElement).files?.[0];
    if (file) void uploadFile(file);
  };

  return (
    <section class="uploader">
      <h2 class="uploader-heading">Image upload — Phase 1c</h2>

      {state.phase !== "success" && (
        <div
          class="uploader-dropzone"
          data-drag={dragActive}
          data-state={state.phase}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            class="uploader-input"
            onChange={onPick}
          />
          {state.phase === "uploading" ? (
            <p class="uploader-hint">Uploading {state.fileName}…</p>
          ) : (
            <>
              <p class="uploader-hint uploader-hint-primary">Drop a PNG or JPEG here</p>
              <p class="uploader-hint uploader-hint-secondary">or click to choose a file</p>
            </>
          )}
        </div>
      )}

      {state.phase === "success" && (
        <UploadSuccess
          imageId={state.imageId}
          accountHash={state.accountHash}
          fileName={state.fileName}
          onReset={reset}
        />
      )}

      {state.phase === "error" && (
        <div class="uploader-error">
          <p>{state.message}</p>
          <button type="button" onClick={reset} class="uploader-button">Try again</button>
        </div>
      )}
    </section>
  );
}

// Renders the uploaded image plus a copyable list of delivery URLs once
// upload finishes. Variants are constructed from the account hash returned
// by our /api/images/upload-url endpoint — no extra round-trip needed.
function UploadSuccess(props: {
  imageId: string;
  accountHash: string;
  fileName: string;
  onReset: () => void;
}) {
  const { imageId, accountHash, fileName, onReset } = props;
  const previewUrl = `https://imagedelivery.net/${accountHash}/${imageId}/public`;

  return (
    <div class="uploader-success">
      <img class="uploader-preview" src={previewUrl} alt={fileName} />
      <div class="uploader-meta">
        <p class="uploader-meta-label">Uploaded</p>
        <p class="uploader-meta-value">{fileName}</p>
        <p class="uploader-meta-label">Image ID</p>
        <p class="uploader-meta-value uploader-meta-mono">{imageId}</p>
        <p class="uploader-meta-label">Variants</p>
        <ul class="uploader-variants">
          {VARIANTS.map((variant) => (
            <VariantRow key={variant} variant={variant} accountHash={accountHash} imageId={imageId} />
          ))}
        </ul>
        <button type="button" onClick={onReset} class="uploader-button">Upload another</button>
      </div>
    </div>
  );
}

function VariantRow(props: { variant: string; accountHash: string; imageId: string }) {
  const url = `https://imagedelivery.net/${props.accountHash}/${props.imageId}/${props.variant}`;
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked (older browsers, insecure context); ignore silently.
    }
  };

  return (
    <li class="uploader-variant">
      <code class="uploader-variant-url">{url}</code>
      <button type="button" onClick={onCopy} class="uploader-variant-copy">
        {copied ? "Copied" : "Copy"}
      </button>
    </li>
  );
}
