import { LocationProvider, Router, Route } from "preact-iso";
import { AppShell } from "./components/AppShell";
import { Dashboard } from "./pages/Dashboard";
import { Catalog } from "./pages/Catalog";
import { Test } from "./pages/Test";

// Top-level router. preact-iso handles client-side navigation so anchor
// clicks within the SPA don't full-reload. NotFound catches any unknown
// path and bounces back to the dashboard message-style.

export function App() {
  return (
    <LocationProvider>
      <AppShell>
        <Router>
          <Route path="/" component={Dashboard} />
          <Route path="/catalog" component={Catalog} />
          <Route path="/test" component={Test} />
          <Route default component={NotFound} />
        </Router>
      </AppShell>
    </LocationProvider>
  );
}

function NotFound() {
  return (
    <div class="page page-not-found">
      <h1 class="page-title">Not found</h1>
      <p>That page doesn't exist. <a href="/">Back to dashboard</a>.</p>
    </div>
  );
}
