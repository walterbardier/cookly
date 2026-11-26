import { useState, useEffect } from "react";

import { LanguageProvider } from "./context/LanguageContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LikesProvider } from "./context/LikesContext";
import { SavesProvider } from "./context/SavesContext";
import { RecipesProvider } from "./context/RecipesContext";

import Navbar from "./components/Navbar";
import HomeTab from "./components/HomeTab";
import DiscoverTab from "./components/DiscoverTab";
import AddRecipeTab from "./components/AddRecipeTab";
import FriendsTab from "./components/FriendsTab";
import ProfileTab from "./components/ProfileTab";
import LoginPage from "./components/LoginPage";
import { supabase } from "./lib/supabase";

type Tab = "home" | "discover" | "add" | "friends" | "profile";

const VALID_TABS: Tab[] = ["home", "discover", "add", "friends", "profile"];

function AppContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("home");

  // 1. Detectar si la URL actual contiene el parámetro de recuperación de Supabase
  const [isRecovery, setIsRecovery] = useState(
    window.location.hash.includes("type=recovery") ||
      window.location.search.includes("type=recovery")
  );

  const [newPassword, setNewPassword] = useState("");
  const [updating, setUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Escuchar si el evento de recuperación ocurre mientras la app está abierta
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Escuchar eventos personalizados para cambiar de pestaña
  useEffect(() => {
    const handleNavigateProfile = () => {
      setActiveTab("profile");
    };

    const handleNavigateTab = (event: Event) => {
      const customEvent = event as CustomEvent<{ tab?: string }>;
      const targetTab = customEvent.detail?.tab as Tab | undefined;
      if (targetTab && VALID_TABS.includes(targetTab)) {
        setActiveTab(targetTab);
      }
    };

    window.addEventListener("navigate-to-profile", handleNavigateProfile);
    window.addEventListener("cookly:navigate-tab", handleNavigateTab);

    return () => {
      window.removeEventListener("navigate-to-profile", handleNavigateProfile);
      window.removeEventListener("cookly:navigate-tab", handleNavigateTab);
    };
  }, []);

  const handleNavigateTabProp = (tab: string) => {
    if (VALID_TABS.includes(tab as Tab)) {
      setActiveTab(tab as Tab);
    }
  };

  const handleAddSuccess = () => {
    setActiveTab("profile");
  };

  // Función para guardar la nueva contraseña en Supabase
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      setToastMessage("Por favor ingresa tu nueva contraseña");
      return;
    }

    setUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      alert("¡Contraseña actualizada con éxito! Ya puedes iniciar sesión.");
      setIsRecovery(false);
      window.location.hash = "";
      window.location.href = window.location.origin;
    } catch (err: any) {
      setToastMessage(err.message || "Ocurrió un error al actualizar");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen select-none items-center justify-center bg-[#F2F2F7] text-sm font-semibold text-[#8E8E93]">
        Loading...
      </div>
    );
  }

  // 2. SI ESTÁ EN MODO RECUPERACIÓN: Muestra obligatoriamente esta pantalla de nueva contraseña
  if (isRecovery) {
    return (
      <div className="flex min-h-screen select-none items-center justify-center bg-[#F2F2F7] p-6">
        <div className="w-full max-w-[380px] rounded-[24px] bg-white p-[30px] shadow-[0_10px_40px_rgba(0,0,0,0.08)]">
          <h1 className="mb-2.5 text-[28px] font-extrabold text-[#1C1C1E]">
            Nueva contraseña 🔑
          </h1>
          <p className="mb-6 text-sm text-[#666666]">
            Ingresa tu nueva contraseña para actualizar tu cuenta.
          </p>

          {toastMessage && (
            <div className="mb-4 rounded-lg bg-[#ffe5e5] p-2.5 text-[13px] font-medium text-[#d9534f]">
              {toastMessage}
            </div>
          )}

          <form onSubmit={handleUpdatePassword}>
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mb-5 w-full rounded-[14px] border border-[#ddd] p-3.5 text-sm outline-none transition-colors focus:border-[#FF6B35]"
              required
            />
            <button
              type="submit"
              disabled={updating}
              className="w-full cursor-pointer rounded-[14px] border-none bg-[#FF6B35] p-4 font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:bg-[#ccc]"
            >
              {updating ? "Guardando..." : "Guardar contraseña"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="relative mx-auto min-h-screen max-w-[480px] select-none bg-[#F2F2F7]">
      <div className={activeTab === "home" ? "block" : "hidden"}>
        <HomeTab onNavigateTab={handleNavigateTabProp} />
      </div>

      <div className={activeTab === "discover" ? "block" : "hidden"}>
        <DiscoverTab />
      </div>

      <div className={activeTab === "add" ? "block" : "hidden"}>
        <AddRecipeTab onSuccess={handleAddSuccess} />
      </div>

      <div className={activeTab === "friends" ? "block" : "hidden"}>
        <FriendsTab />
      </div>

      <div className={activeTab === "profile" ? "block" : "hidden"}>
        <ProfileTab />
      </div>

      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <RecipesProvider>
          <LikesProvider>
            <SavesProvider>
              <AppContent />
            </SavesProvider>
          </LikesProvider>
        </RecipesProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}