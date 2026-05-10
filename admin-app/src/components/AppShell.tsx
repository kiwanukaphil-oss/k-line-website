import type { ComponentChildren } from "preact";
import { useLocation } from "preact-iso";

// Header + nav strip + content frame. Wrapped around every page so the
// chrome stays consistent across routes.

interface NavItem {
  href: string;
  label: string;
  match: (path: string) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/",         label: "Dashboard",   match: (p) => p === "/" },
  { href: "/catalog",  label: "Catalog",     match: (p) => p === "/catalog" || p.startsWith("/catalog/") },
  { href: "/test",     label: "Pipeline",    match: (p) => p === "/test" }
];

export function AppShell(props: { children: ComponentChildren }) {
  const { path } = useLocation();

  return (
    <div class="shell">
      <header class="shell-header">
        <div class="shell-brand">
          <h1 class="shell-brand-name">K-LINE MEN</h1>
          <span class="shell-brand-sub">Admin</span>
        </div>
        <nav class="shell-nav" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              class="shell-nav-link"
              data-active={item.match(path) ? "true" : "false"}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </header>
      <main class="shell-main">{props.children}</main>
    </div>
  );
}
