import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../utils/translations";
import { supabase } from "../lib/supabase";

export default function LoginPage() {
  const { language, setLanguage } = useLanguage();
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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecoveryMode(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      showToast(t.missingFieldsError, "error");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        showToast(t.loginSuccess, "success");
      } else {
        await signUp(email, password);
        showToast(t.registerSuccess, "success");
      }
    } catch (error: any) {
      showToast(error.message || t.genericError, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      showToast(t.forgotPasswordError, "error");
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });

      if (error) throw error;

      showToast(t.forgotPasswordSuccess, "success");
    } catch (error: any) {
      showToast(error.message || t.genericError, "error");
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword) {
      showToast(t.newPasswordError, "error");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      showToast(t.passwordUpdatedSuccess, "success");
      setIsRecoveryMode(false);
      setNewPassword("");

      window.location.href = window.location.origin;
    } catch (error: any) {
      showToast(error.message || t.genericError, "error");
    } finally {
      setLoading(false);
    }
  };

  const inputClassName =
    "w-full rounded-[14px] border border-[#E5E5EA] bg-[#F9F9FB] px-4 py-3.5 text-[15px] text-[#1C1C1E] outline-none transition-all duration-200 focus:border-[1.5px] focus:border-[#FF6B35] focus:bg-[#FFFDFB] focus:shadow-[0_0_0_4px_rgba(255,107,53,0.12)]";

  const submitButtonClassName =
    "w-full rounded-[16px] border-none py-[15px] text-[15px] font-bold text-white transition-all duration-200 disabled:cursor-not-allowed disabled:bg-[#D1D1D6] disabled:shadow-none bg-gradient-to-br from-[#FF6B35] to-[#FF9A5C] shadow-[0_8px_20px_rgba(255,107,53,0.3)] cursor-pointer";

  return (
    <>
      {/* Toast superior */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="fixed left-1/2 top-6 z-[9999] -translate-x-1/2"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-white/30 bg-white/85 px-5 py-3 shadow-2xl backdrop-blur-xl">
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

      {/* Fondo con toque cálido de Cookly */}
      <div className="flex min-h-screen items-center justify-center bg-[#F2F2F7] bg-[radial-gradient(circle_at_top,rgba(255,154,92,0.22),transparent_55%)] p-6">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-[400px] rounded-[28px] border border-white/80 bg-white px-7 pb-6 pt-8 shadow-[0_18px_45px_rgba(28,28,30,0.08)]"
        >
          {/* Marca y bienvenida */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3.5 flex h-[72px] w-[72px] items-center justify-center rounded-[22px] bg-gradient-to-br from-[#FFF3EC] to-[#FFE4D6] shadow-[0_10px_24px_rgba(255,107,53,0.18)]">
              <img
                src="/cookly-icon-logo.png"
                alt={t.title}
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                className="h-12 w-12 select-none object-contain"
              />
            </div>

            <span className="mb-2 inline-block rounded-full bg-[#FF6B35]/10 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#FF6B35]">
              {t.title}
            </span>

            {isRecoveryMode ? (
              <>
                <h1 className="m-0 mb-1.5 text-[26px] font-extrabold tracking-[-0.4px] text-[#1C1C1E]">
                  {t.newPasswordTitle}
                </h1>
                <p className="m-0 text-sm text-[#6E6E73]">
                  {t.newPasswordSubtitle}
                </p>
              </>
            ) : (
              <>
                <h1 className="m-0 mb-1.5 text-[28px] font-extrabold tracking-[-0.5px] text-[#1C1C1E]">
                  {isLogin ? t.welcomeLoginTitle : t.welcomeRegisterTitle}
                </h1>
                <p className="m-0 text-sm leading-[1.45] text-[#6E6E73]">
                  {isLogin ? t.welcomeLoginSubtitle : t.welcomeRegisterSubtitle}
                </p>
              </>
            )}
          </div>

          {isRecoveryMode ? (
            /* ================= FORMULARIO DE NUEVA CONTRASEÑA ================= */
            <form onSubmit={handleUpdatePassword}>
              <input
                placeholder={t.newPasswordPlaceholder}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`${inputClassName} mb-[18px]`}
              />

              <button
                type="submit"
                disabled={loading}
                className={submitButtonClassName}
              >
                {loading ? t.savingText : t.saveNewPasswordButton}
              </button>
            </form>
          ) : (
            /* ================= FORMULARIO PRINCIPAL DE LOGIN / REGISTRO ================= */
            <form onSubmit={handleSubmit}>
              {/* Selector Login / Registro con animación fluida */}
              <motion.div
                role="group"
                aria-label="Auth mode switch"
                whileTap={{ scale: 0.985 }}
                transition={{ type: "spring", stiffness: 520, damping: 32 }}
                className="relative mb-5 flex rounded-[16px] bg-[#F2F2F7] p-1"
              >
                {(
                  [
                    { mode: true, label: t.loginButton },
                    { mode: false, label: t.createAccountButton },
                  ] as const
                ).map(({ mode, label }) => {
                  const isSelected = isLogin === mode;

                  return (
                    <motion.button
                      key={String(mode)}
                      type="button"
                      onClick={() => setIsLogin(mode)}
                      whileHover={{ scale: isSelected ? 1.005 : 1.015 }}
                      whileTap={{ scale: 0.96 }}
                      transition={{ type: "spring", stiffness: 550, damping: 30 }}
                      className={`relative z-[1] flex-1 cursor-pointer select-none rounded-[12px] border-none bg-transparent px-3 py-[9px] text-[13.5px] font-bold transition-colors duration-200 ${
                        isSelected ? "text-[#1C1C1E]" : "text-[#8E8E93]"
                      }`}
                    >
                      {isSelected && (
                        <motion.span
                          layoutId="authModePill"
                          transition={{
                            type: "spring",
                            stiffness: 460,
                            damping: 32,
                            mass: 0.8,
                          }}
                          className="absolute inset-0 -z-[1] rounded-[12px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
                        />
                      )}
                      {label}
                    </motion.button>
                  );
                })}
              </motion.div>

              <input
                placeholder={t.email}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`${inputClassName} mb-3`}
              />

              <input
                placeholder={t.password}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputClassName} ${isLogin ? "mb-2.5" : "mb-5"}`}
              />

              {isLogin && (
                <div className="mb-[18px] flex justify-end">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="cursor-pointer border-none bg-transparent p-0 text-[13px] font-semibold text-[#FF6B35]"
                  >
                    {t.forgotPassword}
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={submitButtonClassName}
              >
                {loading
                  ? t.loadingText
                  : isLogin
                  ? t.loginButton
                  : t.createAccountButton}
              </button>

              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="mt-4 w-full cursor-pointer border-none bg-transparent text-[13.5px] font-medium text-[#6E6E73]"
              >
                {isLogin ? t.dontHaveAccount : t.alreadyHaveAccount}
              </button>
            </form>
          )}

          {/* Switch de idioma ES / EN con animación fluida y colores originales */}
          <div className="mt-[22px] flex justify-center border-t border-[#F2F2F7] pt-4">
            <motion.div
              role="group"
              aria-label="Language switch"
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 520, damping: 32 }}
              className="relative inline-flex items-center gap-0.5 rounded-full bg-[#F2F2F7] p-[3px]"
            >
              {(["es", "en"] as const).map((langOption) => {
                const isActive = language === langOption;

                return (
                  <motion.button
                    key={langOption}
                    type="button"
                    onClick={() => setLanguage(langOption)}
                    whileHover={{ scale: isActive ? 1.01 : 1.03 }}
                    whileTap={{ scale: 0.93 }}
                    transition={{ type: "spring", stiffness: 550, damping: 30 }}
                    className={`relative z-[1] cursor-pointer select-none rounded-full border-none bg-transparent px-3.5 py-[5px] text-xs font-bold transition-colors duration-200 ${
                      isActive ? "text-[#FF6B35]" : "text-[#8E8E93]"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="langSwitchPill"
                        transition={{
                          type: "spring",
                          stiffness: 460,
                          damping: 32,
                          mass: 0.8,
                        }}
                        className="absolute inset-0 -z-[1] rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.08)]"
                      />
                    )}
                    {langOption.toUpperCase()}
                  </motion.button>
                );
              })}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </>
  );
}