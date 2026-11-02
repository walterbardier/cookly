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

type Tab =
  | "home"
  | "discover"
  | "add"
  | "friends"
  | "profile";

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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Escuchar el evento personalizado para ir al perfil propio
  useEffect(() => {
    const handleNavigateProfile = () => {
      setActiveTab("profile");
    };
    window.addEventListener("navigate-to-profile", handleNavigateProfile);
    return () => {
      window.removeEventListener("navigate-to-profile", handleNavigateProfile);
    };
  }, []);

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
      window.location.hash = ""; // Limpiamos los tokens de la URL
      window.location.href = window.location.origin; // Recargamos para ir al login limpio
    } catch (err: any) {
      setToastMessage(err.message || "Ocurrió un error al actualizar");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        Loading...
      </div>
    );
  }

  // 2. SI ESTÁ EN MODO RECUPERACIÓN: Muestra obligatoriamente esta pantalla de nueva contraseña
  if (isRecovery) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#F2F2F7",
          padding: 24,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 380,
            background: "white",
            borderRadius: 24,
            padding: 30,
            boxShadow: "0 10px 40px rgba(0,0,0,.08)",
          }}
        >
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 10, color: "#1C1C1E" }}>
            Nueva contraseña 🔑
          </h1>
          <p style={{ fontSize: 14, color: "#666", marginBottom: 24 }}>
            Ingresa tu nueva contraseña para actualizar tu cuenta.
          </p>

          {toastMessage && (
            <div style={{ background: "#ffe5e5", color: "#d9534f", padding: 10, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
              {toastMessage}
            </div>
          )}

          <form onSubmit={handleUpdatePassword}>
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{
                width: "100%",
                padding: 14,
                marginBottom: 20,
                borderRadius: 14,
                border: "1px solid #ddd",
                fontSize: 14,
                outline: "none",
              }}
              required
            />
            <button
              type="submit"
              disabled={updating}
              style={{
                width: "100%",
                padding: 16,
                borderRadius: 14,
                background: updating ? "#ccc" : "#FF6B35",
                color: "white",
                fontWeight: 700,
                border: "none",
                cursor: updating ? "not-allowed" : "pointer",
              }}
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
    <div
      style={{
        maxWidth: 480,
        margin: "0 auto",
        minHeight: "100vh",
        position: "relative",
        background: "#F2F2F7",
      }}
    >
      <div style={{ display: activeTab === "home" ? "block" : "none" }}>
        <HomeTab />
      </div>

      <div style={{ display: activeTab === "discover" ? "block" : "none" }}>
        <DiscoverTab />
      </div>

      <div style={{ display: activeTab === "add" ? "block" : "none" }}>
        <AddRecipeTab onSuccess={handleAddSuccess} />
      </div>

      <div style={{ display: activeTab === "friends" ? "block" : "none" }}>
        <FriendsTab />
      </div>

      <div style={{ display: activeTab === "profile" ? "block" : "none" }}>
        <ProfileTab />
      </div>

      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
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
              <LanguageProvider>
                <AppContent />
              </LanguageProvider>
            </SavesProvider>
          </LikesProvider>
        </RecipesProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}