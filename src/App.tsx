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

type Tab =
  | "home"
  | "discover"
  | "add"
  | "friends"
  | "profile";

function AppContent() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("home");

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