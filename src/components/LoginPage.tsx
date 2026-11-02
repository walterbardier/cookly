import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../utils/translations";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const { language } = useLanguage();
  const t = translations[language].login;

  const { signIn, signUp } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [toast, setToast] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "error") => {
    setToast({ text, type });
    window.setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecoveryMode(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Manejador del submit de Login/Registro
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Evita recargar la página con Enter

    if (!email || !password) {
      showToast("Por favor completa todos los campos", "error");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        showToast("¡Bienvenido de nuevo!", "success");
      } else {
        await signUp(email, password);
        showToast("¡Cuenta creada con éxito! Revisa tu email si requiere confirmación.", "success");
      }
    } catch (error: any) {
      showToast(error.message || "Ocurrió un error", "error");
    } finally {
      setLoading(false);
    }
  };

  // Enviar correo de recuperación
  const handleForgotPassword = async () => {
    if (!email) {
      showToast("Por favor ingresa tu correo electrónico primero", "error");
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });

      if (error) throw error;

      showToast("¡Correo de recuperación enviado! Revisa tu bandeja de entrada.", "success");
    } catch (error: any) {
      showToast(error.message || "Ocurrió un error", "error");
    }
  };

  // Manejador del submit para la nueva contraseña
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault(); // Evita recargar la página con Enter

    if (!newPassword) {
      showToast("Por favor ingresa tu nueva contraseña", "error");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      showToast("¡Contraseña actualizada con éxito!", "success");
      setIsRecoveryMode(false);
      setNewPassword("");
      
      window.location.href = window.location.origin;
    } catch (error: any) {
      showToast(error.message || "Ocurrió un error", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="fixed left-1/2 top-6 z-[9999] -translate-x-1/2"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-white/30 bg-white/80 px-5 py-3 shadow-2xl backdrop-blur-xl">
              <div
                className={`h-2.5 w-2.5 rounded-full ${
                  toast.type === "success" ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="font-semibold text-zinc-900">{toast.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
          {isRecoveryMode ? (
            /* ================= FORMULARIO DE NUEVA CONTRASEÑA ================= */
            <form onSubmit={handleUpdatePassword}>
              <h1
                style={{
                  fontSize: 30,
                  fontWeight: 800,
                  marginBottom: 10,
                }}
              >
                Nueva contraseña 🔑
              </h1>
              <p style={{ fontSize: 14, color: "#666", marginBottom: 24 }}>
                Ingresa tu nueva contraseña para actualizar tu cuenta.
              </p>

              <input
                placeholder="Nueva contraseña"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: 14,
                  marginBottom: 20,
                  borderRadius: 14,
                  border: "1px solid #ddd",
                  outline: "none"
                }}
              />

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: 16,
                  borderRadius: 14,
                  background: loading ? "#ccc" : "#FF6B35",
                  color: "white",
                  fontWeight: 700,
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "background 0.2s",
                }}
              >
                {loading ? "Guardando..." : "Guardar contraseña"}
              </button>
            </form>
          ) : (
            /* ================= FORMULARIO PRINCIPAL DE LOGIN / REGISTRO ================= */
            <form onSubmit={handleSubmit}>
              <h1
                style={{
                  fontSize: 34,
                  fontWeight: 800,
                  marginBottom: 30,
                }}
              >
                {isLogin ? t.title : "Crear cuenta ✨"}
              </h1>

              <input
                placeholder={t.email}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: "100%",
                  padding: 14,
                  marginBottom: 16,
                  borderRadius: 14,
                  border: "1px solid #ddd",
                  outline: "none"
                }}
              />

              <input
                placeholder={t.password}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%",
                  padding: 14,
                  marginBottom: isLogin ? 8 : 24,
                  borderRadius: 14,
                  border: "1px solid #ddd",
                  outline: "none"
                }}
              />

              {/* Enlace de Olvidé mi contraseña */}
              {isLogin && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  style={{
                    marginBottom: 16,
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    color: "#FF6B35",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: 14,
                    textAlign: "right",
                  }}
                >
                  {t.forgotPassword || "¿Olvidaste tu contraseña?"}
                </button>
              )}

              {/* Botón submit que responderá a la tecla Enter */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: 16,
                  borderRadius: 14,
                  background: loading ? "#ccc" : "#FF6B35",
                  color: "white",
                  fontWeight: 700,
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "background 0.2s",
                }}
              >
                {loading
                  ? "Procesando..."
                  : isLogin
                  ? t.loginButton
                  : t.createAccountButton}
              </button>

              {/* Botón alternar modo (debe ser type="button" para no disparar el form) */}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                style={{
                  marginTop: 16,
                  width: "100%",
                  color: "#666",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                {isLogin
                  ? t.dontHaveAccount
                  : t.alreadyHaveAccount}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}