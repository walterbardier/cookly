import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Check, Trash2 } from "lucide-react";

import { CATEGORIES, Recipe } from "../data/mockData";
import RecipeModal from "./RecipeModal";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../utils/translations";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useRecipes } from "../context/RecipesContext";
import { useSaves } from "../context/SavesContext";

const iosEase = [0.22, 1, 0.36, 1] as const;

export default function ProfileTab() {
  const { language, setLanguage } = useLanguage();
  const t = translations[language].profile;
  const { user } = useAuth();

  const { recipes } = useRecipes();
  const { savedRecipes } = useSaves();

  const [profile, setProfile] = useState<any>(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const [interests, setInterests] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"recipes" | "saved">("recipes");

  const [openRecipe, setOpenRecipe] = useState<Recipe | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const [isEditing, setIsEditing] = useState(false);

  const [editData, setEditData] = useState({
    name: "",
    username: "",
    bio: "",
    interests: [] as string[],
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 18);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error(profileError);
        return;
      }

      setProfile(profileData);

      // Cargar contador real de seguidores
      const { count: followersTotal, error: followersError } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", user.id);

      if (!followersError) {
        setFollowersCount(followersTotal || 0);
      }

      // Cargar contador real de seguidos
      const { count: followingTotal, error: followingError } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", user.id);

      if (!followingError) {
        setFollowingCount(followingTotal || 0);
      }

      setEditData({
        name: profileData.name || "",
        username: profileData.username || "",
        bio: profileData.bio || "",
        interests: profileData.interests || [],
      });

      setInterests(profileData.interests || []);
    };

    loadData();
  }, [user]);

  const myRecipes = recipes.filter((recipe) => recipe.author_id === user?.id);

  const savedList = recipes.filter((recipe) => savedRecipes.has(recipe.id));

  const startEditing = () => {
    setEditData({
      name: profile.name || "",
      username: profile.username || "",
      bio: profile.bio || "",
      interests: profile.interests || [],
    });

    setIsEditing(true);
  };

  const handleRemoveAvatar = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAvatarFile(null);
    setProfile((prev: any) => ({ ...prev, avatar: null }));
  };

  const toggleEditInterest = (catId: string) => {
    setEditData((prev) => {
      const exists = prev.interests.includes(catId);
      return {
        ...prev,
        interests: exists
          ? prev.interests.filter((id) => id !== catId)
          : [...prev.interests, catId],
      };
    });
  };

  const saveProfile = async () => {
    if (!user || !profile) return;

    let avatarUrl = profile.avatar;
    let bannerUrl = profile.banner;

    // Subir Avatar si hay archivo nuevo
    if (avatarFile) {
      const fileName = `${user.id}-avatar-${Date.now()}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, avatarFile);

      if (!uploadError) {
        const { data } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);
        avatarUrl = data.publicUrl;
      }
    } else if (profile.avatar === null) {
      avatarUrl = null;
    }

    // Subir Banner si hay archivo nuevo
    if (bannerFile) {
      const fileName = `${user.id}-banner-${Date.now()}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, bannerFile);

      if (!uploadError) {
        const { data } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);
        bannerUrl = data.publicUrl;
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        name: editData.name,
        username: editData.username,
        bio: editData.bio,
        avatar: avatarUrl,
        banner: bannerUrl,
        interests: editData.interests,
      })
      .eq("id", user.id);

    if (error) {
      console.error(error);
      return;
    }

    setProfile({
      ...profile,
      ...editData,
      avatar: avatarUrl,
      banner: bannerUrl,
    });

    setInterests(editData.interests);
    setAvatarFile(null);
    setBannerFile(null);
    setIsEditing(false);

    setToast(t.profileSaved);

    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error(error);
    }
  };

  const displayRecipes = activeTab === "recipes" ? myRecipes : savedList;

  return (
    <div className="mt-4 min-h-screen select-none bg-[#F2F2F7] pb-[100px]">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -14, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -14, x: "-50%" }}
            transition={{ duration: 0.25, ease: iosEase }}
            className="fixed left-1/2 top-6 z-[9999] select-none rounded-[20px] bg-white/85 px-5 py-3 font-bold text-[#1C1C1E] shadow-[0_10px_30px_rgba(0,0,0,0.15)] backdrop-blur-[20px]"
          >
            ✅ {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Sticky con degradé de desvanecimiento (100% arriba -> 0% abajo) */}
      <header
        style={{
          WebkitMaskImage:
            "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 64%, rgba(0,0,0,0) 100%)",
          maskImage:
            "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 64%, rgba(0,0,0,0) 100%)",
        }}
        className="sticky top-0 z-30 select-none bg-[#F2F2F7]/85 pb-7 pt-[calc(env(safe-area-inset-top,44px)+12px)] backdrop-blur-[20px] backdrop-saturate-[180%]"
      >
        <div className="flex items-center justify-between px-5 pb-3 pt-3">
          <motion.h1
            animate={{ color: isScrolled ? "#FF6B35" : "#18181B" }}
            transition={{ duration: 0.25, ease: iosEase }}
            className="m-0 text-2xl font-extrabold tracking-[-0.4px]"
          >
            {t.title}
          </motion.h1>

          <div className="flex items-center gap-2.5">
            {isEditing ? (
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                onClick={saveProfile}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-none bg-[#34C759] text-white shadow-lg transition-shadow duration-200"
              >
                <Check size={20} strokeWidth={3} />
              </motion.button>
            ) : (
              <>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startEditing}
                  className="flex cursor-pointer items-center gap-2 rounded-full border-none bg-gradient-to-br from-[#FF6B35] to-[#FF9A5C] px-4 py-2 text-[13px] font-bold text-white shadow-[0_6px_18px_rgba(255,107,53,.28)] transition-shadow duration-200 hover:shadow-[0_8px_22px_rgba(255,107,53,.38)]"
                >
                  <Pencil size={15} />
                  {t.editProfile}
                </motion.button>

                {/* Settings button */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.92 }}
                  transition={{ type: "spring", stiffness: 460, damping: 28 }}
                  onClick={() => setShowSettings(true)}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-none bg-white text-[#1C1C1E] shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-shadow duration-200 hover:shadow-[0_6px_16px_rgba(0,0,0,0.09)]"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06-.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                  </svg>
                </motion.button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="px-5 pt-3">
        {/* Contenedor del Perfil con Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: iosEase }}
          className="mb-4 overflow-hidden rounded-[32px] bg-white shadow-[0_10px_30px_rgba(0,0,0,.06)]"
        >
          {/* Banner de fondo */}
          <div
            style={{
              background: bannerFile
                ? `url(${URL.createObjectURL(bannerFile)}) center/cover no-repeat`
                : profile?.banner
                  ? `url(${profile.banner}) center/cover no-repeat`
                  : "linear-gradient(135deg, #FF6B35, #FF9A5C)",
            }}
            className="relative h-[130px] w-full"
          >
            {/* Botón de lápiz gris oscuro para editar banner en modo edición */}
            {isEditing && (
              <label
                title="Cambiar banner"
                className="absolute right-3 top-3 z-[3] flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#3A3A3C] text-white shadow-[0_2px_8px_rgba(0,0,0,0.25)] transition-transform duration-200 hover:scale-105"
              >
                <Pencil size={15} />
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => setBannerFile(e.target.files?.[0] ?? null)}
                />
              </label>
            )}

            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-black/15 to-transparent" />
          </div>

          <div className="px-6 pb-6">
            <div className="relative z-[2] -mt-[46px] mb-[18px] flex justify-center">
              {/* Contenedor del Avatar con soporte para Hover y Borrado */}
              <div className="group relative inline-block">
                {avatarFile || profile?.avatar ? (
                  <img
                    src={
                      avatarFile
                        ? URL.createObjectURL(avatarFile)
                        : profile?.avatar
                    }
                    alt={profile?.name}
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                    className="pointer-events-none h-[84px] w-[84px] select-none rounded-full border-4 border-white object-cover shadow-[0_8px_20px_rgba(0,0,0,.15)]"
                  />
                ) : (
                  <div className="flex h-[84px] w-[84px] items-center justify-center rounded-full border-4 border-white bg-[#E5E5EA] shadow-[0_8px_20px_rgba(0,0,0,.15)]">
                    <svg
                      width="34"
                      height="34"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#8E8E93"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                )}

                {/* Tacho de basura rojo al hacer hover en modo edición */}
                {isEditing && (avatarFile || profile?.avatar) && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-none bg-red-500 text-white shadow-lg transition-transform hover:scale-110"
                      title="Eliminar foto"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}

                {/* Botón de lápiz para cambiar foto */}
                {isEditing && (
                  <label className="absolute bottom-0 right-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-[#FF6B35] text-white shadow-[0_4px_10px_rgba(0,0,0,0.15)] transition-transform duration-200 hover:scale-105">
                    <Pencil size={13} />
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) =>
                        setAvatarFile(e.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="text-center">
              {isEditing ? (
                <input
                  value={editData.name}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      name: e.target.value,
                    })
                  }
                  className="w-full select-text rounded-xl bg-[#F2F2F7] px-3 py-2 text-center text-2xl font-extrabold outline-none"
                />
              ) : (
                <h2 className="m-0 text-2xl font-extrabold text-[#1C1C1E]">
                  {profile?.name}
                </h2>
              )}

              {isEditing ? (
                <input
                  value={editData.username}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      username: e.target.value,
                    })
                  }
                  className="mt-2 w-full select-text rounded-xl bg-[#F2F2F7] px-3 py-2 text-center text-zinc-500 outline-none"
                />
              ) : (
                <p className="m-0 mt-1 font-semibold text-[#8E8E93]">
                  @{profile?.username}
                </p>
              )}

              {isEditing ? (
                <textarea
                  value={editData.bio}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      bio: e.target.value,
                    })
                  }
                  className="mt-4 w-full resize-none select-text rounded-2xl bg-[#F2F2F7] p-3 text-center text-sm text-zinc-700 outline-none"
                  rows={3}
                />
              ) : (
                <p className="mx-auto mt-3 max-w-[320px] text-sm leading-relaxed text-zinc-500">
                  {profile?.bio}
                </p>
              )}
            </div>

            {/* Contenedor de Contadores */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                {
                  value: myRecipes.length,
                  label: t.recipesCount,
                },
                {
                  value: followersCount,
                  label: t.followers,
                },
                {
                  value: followingCount,
                  label: t.following,
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl bg-[#F7F7FA] px-2 py-4 text-center transition-transform duration-200 hover:-translate-y-0.5"
                >
                  <div className="text-2xl font-extrabold text-zinc-900">
                    {stat.value}
                  </div>

                  <div className="mt-1 text-xs font-semibold text-zinc-400">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* INTERESTS */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: iosEase, delay: 0.04 }}
          className="mb-4 rounded-[32px] bg-white p-4 shadow-sm"
        >
          <div className="mx-1 mt-1">
            <p className="mb-3 mt-0 text-xs font-bold uppercase tracking-wider text-zinc-500">
              {t.interests}
            </p>

            <div className="flex flex-wrap gap-2">
              {isEditing
                ? CATEGORIES.map((cat) => {
                    const isSelected = editData.interests.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleEditInterest(cat.id)}
                        style={{
                          background: isSelected ? cat.bgColor : "#F2F2F7",
                          border: `1.5px solid ${isSelected ? cat.color : "#E5E5EA"}`,
                          opacity: isSelected ? 1 : 0.6,
                        }}
                        className="flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 transition-all"
                      >
                        <span>{cat.emoji}</span>
                        <span
                          style={{
                            color: isSelected ? cat.color : "#8E8E93",
                          }}
                          className="text-xs font-bold"
                        >
                          {cat.name[language]}
                        </span>
                      </button>
                    );
                  })
                : interests.map((id) => {
                    const cat = CATEGORIES.find((c) => c.id === id);
                    if (!cat) return null;
                    return (
                      <div
                        key={cat.id}
                        style={{
                          background: cat.bgColor,
                        }}
                        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-transform duration-200 hover:-translate-y-0.5"
                      >
                        <span>{cat.emoji}</span>
                        <span
                          style={{
                            color: cat.color,
                          }}
                          className="text-xs font-bold"
                        >
                          {cat.name[language]}
                        </span>
                      </div>
                    );
                  })}

              {!isEditing && interests.length === 0 && (
                <p className="m-0 text-xs italic text-zinc-400">
                  Sin intereses seleccionados
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* TABS */}
        <div className="mb-4 flex rounded-full bg-white p-1 shadow-sm">
          {(
            [
              {
                key: "recipes" as const,
                label: t.myRecipes,
                icon: "👨‍🍳",
              },
              {
                key: "saved" as const,
                label: t.saved,
                icon: "🔖",
              },
            ] as { key: "recipes" | "saved"; label: string; icon: string }[]
          ).map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex-1 cursor-pointer rounded-full border-none py-3 text-sm font-bold transition-colors duration-200 ${
                  isActive ? "text-white" : "bg-transparent text-zinc-400"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="profile-active-tab-pill"
                    transition={{ type: "spring", stiffness: 460, damping: 32 }}
                    className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF9A5C] shadow-md"
                  />
                )}
                <span className="relative z-[1]">
                  {tab.icon} {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* RECIPES GRID */}
        {
          displayRecipes.length===0 ? (
            <div className="
            py-12
            text-center
            ">
              <div className="
              mb-3
              text-5xl
              ">
                {
                  activeTab==="recipes"
                  ?
                  "🍳"
                  :
                  "🔖"
                }
              </div>

              <p className="
              font-bold
              text-zinc-900
              ">
                {activeTab==="recipes"
                ?"Aún no hay recetas"
                :"Sin guardadas"}
              </p>

              <p className="
              mt-1
              text-sm
              text-zinc-400
              ">
                {activeTab==="recipes"
                ?"Comparte tu primera receta"
                :"Guarda recetas que te gusten"}
              </p>
            </div>
          ) : (
            <div className="
            grid
            grid-cols-3
            gap-0
            overflow-hidden
            rounded-3xl
            mb-10
            ">
            {displayRecipes.map(recipe=>(
              <button
                key={recipe.id}
                onClick={()=>
                  setOpenRecipe(recipe)
                }
                className="
                relative
                aspect-square
                overflow-hidden
                bg-zinc-100
                "
              >
                <img
                  src={recipe.image}
                  alt={recipe.title}
                  className="
                  h-full
                  w-full
                  object-cover
                  transition
                  hover:scale-105
                  "
                />

                <div className="
                absolute
                inset-0
                bg-gradient-to-t
                from-black/70
                to-transparent
                "/>

                <p className="
                absolute
                bottom-4
                left-4
                right-2
                text-left
                text-xs
                font-bold
                text-white
                ">
                  {recipe.title}
                </p>
              </button>

            ))}
            </div>
          )
        }

        {/* SETTINGS */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: iosEase }}
              onClick={() => setShowSettings(false)}
              className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 backdrop-blur-[4px]"
            >
              <motion.div
                onClick={(e) => e.stopPropagation()}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 280, damping: 28 }}
                className="w-full max-w-[480px] rounded-t-[28px] bg-white p-6 shadow-[0_-12px_40px_rgba(0,0,0,0.16)]"
              >
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="m-0 text-xl font-extrabold text-[#1C1C1E]">
                    {t.settings}
                  </h3>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowSettings(false)}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-none bg-[#F2F2F7] text-xs font-bold text-[#636366] transition-colors duration-200 hover:bg-[#E5E5EA]"
                  >
                    ✕
                  </motion.button>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Switch de Idioma iOS 26 Vibes */}
                  <div className="flex items-center justify-between rounded-[20px] bg-[#F2F2F7] p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🌐</span>
                      <span className="font-bold text-[#1C1C1E]">
                        {t.language}
                      </span>
                    </div>

                    <div className="relative flex rounded-full border border-black/[0.04] bg-[#E5E5EA] p-1 shadow-inner">
                      {(["es", "en"] as const).map((langOption) => {
                        const isSelected = language === langOption;
                        return (
                          <button
                            key={langOption}
                            type="button"
                            onClick={() => setLanguage(langOption)}
                            className={`relative z-[1] cursor-pointer rounded-full border-none px-4 py-1.5 text-[13px] font-extrabold uppercase transition-colors duration-200 ${
                              isSelected ? "text-[#1C1C1E]" : "text-[#8E8E93]"
                            }`}
                          >
                            {isSelected && (
                              <motion.div
                                layoutId="ios26-language-switch-thumb"
                                transition={{
                                  type: "spring",
                                  stiffness: 520,
                                  damping: 32,
                                }}
                                className="absolute inset-0 -z-[1] rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.06)]"
                              />
                            )}
                            {langOption.toUpperCase()}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.985 }}
                    onClick={handleLogout}
                    className="flex w-full cursor-pointer items-center justify-between rounded-2xl border-none bg-[#F2F2F7] px-4 py-4 font-bold text-red-500 transition-colors hover:bg-[#E9E9EE]"
                  >
                    <span>🚪 {t.logout}</span>
                    <span>→</span>
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {openRecipe && (
          <RecipeModal
            recipe={openRecipe}
            onClose={() => setOpenRecipe(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}