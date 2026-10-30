import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../utils/translations";

export default function LoginPage() {
  const { language } = useLanguage();
  const t = translations[language].login;

  const { signIn, signUp } = useAuth();

  const [isLogin, setIsLogin] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [toast, setToast] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (
    text: string,
    type: "success" | "error" = "error"
  ) => {
    setToast({ text, type });
  
    window.setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const handleSubmit = async () => {
    console.log("CLICK LOGIN");
  
    try {
      console.log("ANTES SIGN IN");
  
      const result = await signIn(email, password);
  
      console.log("LOGIN OK", result);
  
      showToast("Login correcto", "success");
  
    } catch (error: any) {
  
      console.log("ENTRO AL CATCH");
      console.log("ERROR:", error);
      console.log("MESSAGE:", error.message);
  
      showToast(error.message, "error");
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
                  toast.type === "success"
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              />

              <span className="font-semibold text-zinc-900">
                {toast.text}
              </span>
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
          <h1
            style={{
              fontSize: 34,
              fontWeight: 800,
              marginBottom: 30,
            }}
          >
            {t.title}
          </h1>

          <input
            placeholder={t.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: 14,
              marginBottom: 16,
              borderRadius: 14,
              border: "1px solid #ddd",
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
              marginBottom: 24,
              borderRadius: 14,
              border: "1px solid #ddd",
            }}
          />

          <button
            type="button"
            onClick={() => handleSubmit()}
            style={{
              width: "100%",
              padding: 16,
              borderRadius: 14,
              background: "#FF6B35",
              color: "white",
              fontWeight: 700,
            }}
          >
            {isLogin ? t.loginButton : t.createAccountButton}
          </button>

          <button
            onClick={() => setIsLogin(!isLogin)}
            style={{
              marginTop: 16,
              width: "100%",
              color: "#666",
            }}
          >
            {isLogin
              ? t.dontHaveAccount
              : t.alreadyHaveAccount}
          </button>
        </div>
      </div>
    </>
  );
}