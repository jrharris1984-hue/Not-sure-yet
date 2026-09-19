import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import AppShell from "@/components/AppShell";
import Library from "@/pages/Library";
import Builder from "@/pages/Builder";
import Gallery from "@/pages/Gallery";
import Queue from "@/pages/Queue";
import Settings from "@/pages/Settings";
import Shoots from "@/pages/Shoots";
import ShootSetup from "@/pages/ShootSetup";
import ShootDetail from "@/pages/ShootDetail";

function App() {
  return (
    <div className="App grain min-h-screen bg-obsidian text-zinc-100 font-body">
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<Library />} />
            <Route path="/character/new" element={<Builder />} />
            <Route path="/character/new/s/:section" element={<Builder />} />
            <Route path="/character/:id" element={<Builder />} />
            <Route path="/character/:id/s/:section" element={<Builder />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/queue" element={<Queue />} />
            <Route path="/shoots" element={<Shoots />} />
            <Route path="/shoot/new/:characterId" element={<ShootSetup />} />
            <Route path="/shoot/:shootId" element={<ShootDetail />} />
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
