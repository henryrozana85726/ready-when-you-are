import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import ImageGen from "./pages/ImageGen";
import VideoGen from "./pages/VideoGen";
import TextToSpeech from "./pages/TextToSpeech";
import ImageUpscaler from "./pages/ImageUpscaler";
import Account from "./pages/Account";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";

// Tools pages
import ToolsIndex from "./pages/tools/ToolsIndex";
import VeoLauncher from "./pages/tools/VeoLauncher";
import AffiliateEditor from "./pages/tools/AffiliateEditor";
import ImageConverter from "./pages/tools/ImageConverter";
import ToolsTextToSpeech from "./pages/tools/ToolsTextToSpeech";
import ImageVideoToPrompt from "./pages/tools/ImageVideoToPrompt";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <Layout>
                  <Home />
                </Layout>
              }
            />
            <Route
              path="/image"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ImageGen />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/video"
              element={
                <ProtectedRoute>
                  <Layout>
                    <VideoGen />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tts"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TextToSpeech />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/upscaler"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ImageUpscaler />
                  </Layout>
                </ProtectedRoute>
              }
            />
            {/* Tools Routes */}
            <Route
              path="/tools"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ToolsIndex />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tools/veo-launcher"
              element={
                <ProtectedRoute>
                  <Layout>
                    <VeoLauncher />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tools/affiliate-editor"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AffiliateEditor />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tools/image-converter"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ImageConverter />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tools/text-to-speech"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ToolsTextToSpeech />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tools/image-video-to-prompt"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ImageVideoToPrompt />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Account />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <AdminPanel />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
