import { useEffect } from "react";
import { endpoints } from "@/lib/api";
import { setPromptCatalog } from "@/lib/promptCatalog";
import PromptLibraryEditor from "@/pages/PromptLibraryEditor";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { Toaster } from "sonner";
import AppShell from "@/components/AppShell";
import Library from "@/pages/Library";
import MediaLibrary from "@/pages/MediaLibrary";
import Builder from "@/pages/Builder";
import FreeformCreate from "@/pages/FreeformCreate";
import AIResearchPanel from '@/components/AIResearchPanel';
import Gallery from "@/pages/Gallery";
import Queue from "@/pages/Queue";
import Settings from "@/pages/Settings";
import Shoots from "@/pages/Shoots";
import ShootSetup from "@/pages/ShootSetup";
import ShootDetail from "@/pages/ShootDetail";

function LegacyStudioRedirect() {
  const { id, section } = useParams();
  const destination = id ? `/character/${id}${section ? `/s/${section}` : ""}` : `/character/new${section ? `/s/${section}` : ""}`;
  return <Navigate to={destination} replace />;
}

function ImageToolRoute() {
  const { workflowId } = useParams();
  return <Builder key={workflowId} imageToolId={workflowId} />;
}

function App() {
  useEffect(() => {endpoints.settings().then(settings => setPromptCatalog(settings.prompt_catalog)).catch(() => {});}, []);
  return (
    <div className="App grain min-h-screen bg-obsidian text-zinc-100 font-body">
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<Library />} />
            <Route path="/research" element={<div className="mx-auto max-w-4xl p-6"><AIResearchPanel open /></div>} />
            <Route path="/create/image" element={<FreeformCreate key="image" mode="image" />} />
            <Route path="/create/video" element={<FreeformCreate key="video" mode="video" />} />
            <Route path="/create/text-video" element={<FreeformCreate key="text_video" mode="text_video" />} />
            <Route path="/image-tools/:workflowId" element={<ImageToolRoute />} />
            <Route path="/media" element={<MediaLibrary />} />
            <Route path="/studios" element={<Navigate to="/character/new" replace />} />
            <Route path="/studio/:studio/:id/s/:section" element={<LegacyStudioRedirect />} />
            <Route path="/studio/:studio/:id" element={<LegacyStudioRedirect />} />
            <Route path="/studio/:studio/s/:section" element={<LegacyStudioRedirect />} />
            <Route path="/studio/:studio" element={<LegacyStudioRedirect />} />
            <Route path="/character/new" element={<Builder />} />
            <Route path="/character/new/s/:section" element={<Builder />} />
            <Route path="/character/:id" element={<Builder />} />
            <Route path="/character/:id/s/:section" element={<Builder />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/queue" element={<Queue />} />
            <Route path="/shoots" element={<Shoots />} />
            <Route path="/shoot/new/:characterId" element={<ShootSetup />} />
            <Route path="/shoot/:shootId" element={<ShootDetail />} />
            <Route path="/settings/prompts" element={<PromptLibraryEditor />} />
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
