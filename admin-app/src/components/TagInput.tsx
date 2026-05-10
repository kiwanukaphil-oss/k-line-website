import { useState } from "preact/hooks";

// Generic tag input. Used for occasions ("work", "smart-casual"), badges
// ("new", "bestseller"), and product sizes ("S", "M", "L"). Each entry
// renders as a chip with an × to remove; new entries are added on Enter or
// comma. Value can be edited via parent through the onChange callback.
//
// Suggestions are optional — pass a list and they appear as a dropdown of
// quick-add chips below the input. Typing "wo" filters them down to "work",
// "weekend", etc., so the editor doesn't have to remember exact spellings.

interface Props {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  ariaLabel?: string;
}

export function TagInput(props: Props) {
  const { values, onChange, placeholder, suggestions, ariaLabel } = props;
  const [draft, setDraft] = useState("");

  const trimmedDraft = draft.trim();
  const filteredSuggestions = (suggestions ?? [])
    .filter((s) => !values.includes(s))
    .filter((s) => trimmedDraft === "" || s.toLowerCase().includes(trimmedDraft.toLowerCase()));

  const commit = (raw: string) => {
    const value = raw.trim();
    if (value === "") return;
    if (values.includes(value)) {
      setDraft("");
      return;
    }
    onChange([...values, value]);
    setDraft("");
  };

  const remove = (value: string) => {
    onChange(values.filter((v) => v !== value));
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Backspace" && draft === "" && values.length > 0) {
      // Quick-edit: remove last chip on backspace from an empty input.
      remove(values[values.length - 1]);
    }
  };

  return (
    <div class="tag-input">
      <div class="tag-input-row">
        {values.map((v) => (
          <span key={v} class="tag-input-chip">
            {v}
            <button type="button" class="tag-input-chip-remove" onClick={() => remove(v)} aria-label={`Remove ${v}`}>×</button>
          </span>
        ))}
        <input
          type="text"
          class="tag-input-field"
          value={draft}
          placeholder={values.length === 0 ? (placeholder ?? "Add…") : ""}
          onInput={(e) => setDraft((e.currentTarget as HTMLInputElement).value)}
          onKeyDown={onKey}
          onBlur={() => commit(draft)}
          aria-label={ariaLabel}
        />
      </div>
      {filteredSuggestions.length > 0 && (
        <div class="tag-input-suggestions">
          {filteredSuggestions.slice(0, 8).map((s) => (
            <button
              key={s}
              type="button"
              class="tag-input-suggestion"
              onClick={() => commit(s)}
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
