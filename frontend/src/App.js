import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import AppShell from "@/components/AppShell";
import Library from "@/pages/Library";
import Builder from "@/pages/Builder";
import Gallery from "@/pages/Gallery";
import Settings from "@/pages/Settings";

function App() {
  return (
    <div className="App grain min-h-screen bg-obsidian text-zinc-100 font-body">
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<Library />} />
            <Route path="/character/new" element={<Builder />} />
            <Route path="/character/:id" element={<Builder />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
      <Toaster theme="dark" position="top-right" richColors closeButton />
    </div>
  );
}

export default App;
