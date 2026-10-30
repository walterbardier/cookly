import { useState, useEffect } from "react";
import { Pencil, Plus, Check } from "lucide-react";

import { CATEGORIES, Recipe } from "../data/mockData";
import RecipeModal from "./RecipeModal";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../utils/translations";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useRecipes } from "../context/RecipesContext";
import { useSaves } from "../context/SavesContext";


export default function ProfileTab() {
  const { language, setLanguage } = useLanguage();
  const t = translations[language].profile;
  const { user } = useAuth();

  const { recipes } = useRecipes();
  const { savedRecipes } = useSaves();

  const [profile, setProfile] = useState<any>(null);

  const [interests, setInterests] = useState<string[]>([]);
  const [showInterests, setShowInterests] = useState(false);

  const [activeTab, setActiveTab] = useState<"recipes" | "saved">("recipes");
  
  const [openRecipe, setOpenRecipe] = useState<Recipe | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const [isEditing, setIsEditing] = useState(false);

  const [editData, setEditData] = useState({
    name: "",
    username: "",
    bio: "",
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [toast, setToast] = useState<string | null>(null);

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

      setEditData({
        name: profileData.name || "",
        username: profileData.username || "",
        bio: profileData.bio || "",
      });

      setInterests(profileData.interests || []);

    };

    loadData();
  },[user]);

  const myRecipes = recipes.filter(
    recipe => recipe.author_id === user?.id
  );
  
  const savedList = recipes.filter(
    recipe => savedRecipes.has(recipe.id)
  );

  const startEditing = () => {
    setEditData({
      name: profile.name,
      username: profile.username,
      bio: profile.bio,
    });

    setIsEditing(true);
  };

  const saveProfile = async() => {
    if(!user || !profile) return;

    let avatarUrl = profile.avatar;

    if(avatarFile){
      const fileName = `${user.id}-${Date.now()}`;

      const { error:uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, avatarFile);

      if(uploadError){
        console.error(uploadError);
        return;
      }

      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      avatarUrl = data.publicUrl;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        name: editData.name,
        username: editData.username,
        bio: editData.bio,
        avatar: avatarUrl,
      })
      .eq("id", user.id);

    if(error){
      console.error(error);
      return;
    }

    setProfile({
      ...profile,
      ...editData,
      avatar: avatarUrl,
    });

    setAvatarFile(null);
    setIsEditing(false);

    setToast(t.profileSaved);

    setTimeout(()=>{
      setToast(null);
    },3000);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if(error){
      console.error(error);
    }
  };

  const displayRecipes =
    activeTab === "recipes"
      ? myRecipes
      : savedList;

  return (
    <div style={{
      background:"#F2F2F7",
      minHeight:"100vh",
      paddingBottom:100
    }}
    className='mt-4'>
      {toast && (
        <div
          style={{
            position:"fixed",
            top:24,
            left:"50%",
            transform:"translateX(-50%)",
            zIndex:9999,
            background:"rgba(255,255,255,.85)",
            backdropFilter:"blur(20px)",
            padding:"12px 20px",
            borderRadius:20,
            boxShadow:"0 10px 30px rgba(0,0,0,.15)",
            fontWeight:700,
            color:"#1C1C1E"
          }}
        >
          ✅ {toast}
        </div>
      )}

      <div
        style={{
          background:"rgba(242,242,247,.85)",
          backdropFilter:"blur(5px)",
          position:"sticky",
          top:0,
          zIndex:30,
          paddingTop:"env(safe-area-inset-top,44px)"
        }}
      >
        <div className="flex items-center justify-between px-5 pt-3 pb-3">
          <h1 className="text-2xl font-extrabold text-zinc-900">
            {t.title}
          </h1>

          <div className="flex items-center gap-2.5">
            {
              isEditing ? (
                <button
                  onClick={saveProfile}
                  className="
                  flex h-10 w-10
                  items-center justify-center
                  rounded-full
                  bg-[#34C759]
                  text-white
                  shadow-lg
                  active:scale-95
                  "
                >
                  <Check size={20} strokeWidth={3}/>
                </button>
              ) : (
                <>
                  <button
                    onClick={startEditing}
                    className="
                    flex items-center gap-2
                    rounded-full
                    bg-gradient-to-br
                    from-[#FF6B35]
                    to-[#FF9A5C]
                    px-4 py-2
                    text-[13px]
                    font-bold
                    text-white
                    shadow-[0_6px_18px_rgba(255,107,53,.28)]
                    "
                  >
                    <Pencil size={15}/>
                    {t.editProfile}
                  </button>

                  {/* Settings button */}
                  <button onClick={() => setShowSettings(true)} className="flex h-10 w-10 items-center justify-center rounded-4xl bg-white shadow-md transition-all hover:scale-105 active:scale-95" >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"> <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
                    </svg>
                  </button>
                </>
              )
            }
          </div>
        </div>
      </div>

      <div style={{
        padding:"20px 20px 0"
      }}>
        {/* Contenedor del Perfil */}
        <div
          style={{
            background:"white",
            padding:24,
            boxShadow:"0 10px 30px rgba(0,0,0,.06)"
          }}
          className="
          rounded-4xl
          mb-4"
        >
          <div
            style={{
              display:"flex",
              justifyContent:"center",
              marginBottom:18
            }}
          >
            <label
              style={{
                position:"relative",
                cursor:isEditing ? "pointer" : "default"
              }}
            >
              {/* Avatar / Profile Pic */}
              <img
                src={
                  avatarFile
                  ? URL.createObjectURL(avatarFile)
                  : profile?.avatar
                }
                alt={profile?.name}
                style={{
                  width:96,
                  height:96,
                  borderRadius:"50%",
                  objectFit:"cover",
                  border:"4px solid white",
                  boxShadow:"0 10px 25px rgba(0,0,0,.15)"
                }}
              />

              {
                isEditing && (
                  <div
                    style={{
                      position:"absolute",
                      bottom:0,
                      right:0,
                      width:32,
                      height:32,
                      borderRadius:"50%",
                      background:"#FF6B35",
                      color:"white",
                      display:"flex",
                      alignItems:"center",
                      justifyContent:"center"
                    }}
                  >
                    <Pencil size={15}/>
                  </div>
                )
              }
              
              <input
                type="file"
                accept="image/*"
                hidden
                disabled={!isEditing}
                onChange={(e)=>
                  setAvatarFile(
                    e.target.files?.[0] ?? null
                  )
                }
              />
            </label>
          </div>

          <div style={{
            textAlign:"center"
          }}>
            {
              isEditing ? (

                <input
                  value={editData.name}
                  onChange={(e)=>
                    setEditData({
                      ...editData,
                      name:e.target.value
                    })
                  }
                  className="
                  w-full
                  text-center
                  text-2xl
                  font-extrabold
                  bg-[#F2F2F7]
                  rounded-xl
                  px-3 py-2
                  outline-none
                  "
                />
              ) : (
                <h2
                  style={{
                    fontSize:24,
                    fontWeight:800,
                    color:"#1C1C1E"
                  }}
                >
                  {profile?.name}
                </h2>
              )
            }

            {
              isEditing ? (
                <input
                  value={editData.username}
                  onChange={(e)=>
                    setEditData({
                      ...editData,
                      username:e.target.value
                    })
                  }
                  className="
                  mt-2
                  w-full
                  text-center
                  bg-[#F2F2F7]
                  rounded-xl
                  px-3 py-2
                  text-zinc-500
                  outline-none
                  "
                />
              ) : (
                <p
                  style={{
                    color:"#8E8E93",
                    fontWeight:600,
                    marginTop:4
                  }}
                >
                  @{profile?.username}
                </p>
              )
            }
             {
              isEditing ? (
                <textarea
                  value={editData.bio}
                  onChange={(e)=>
                    setEditData({
                      ...editData,
                      bio:e.target.value
                    })
                  }
                  className="
                  mt-4
                  w-full
                  rounded-2xl
                  bg-[#F2F2F7]
                  p-3
                  text-center
                  text-sm
                  text-zinc-700
                  outline-none
                  resize-none
                  "
                  rows={3}
                />
              ) : (
                <p
                  className="
                  mx-auto
                  mt-3
                  max-w-[320px]
                  text-sm
                  leading-relaxed
                  text-zinc-500
                  "
                >
                  {profile?.bio}
                </p>
              )
            }
          </div>

          {/* Contenedor de Contadores */}
          <div className="
          mt-6
          grid
          grid-cols-3
          gap-3
          ">
            {[
              {
                value:myRecipes.length,
                label:t.recipesCount
              },
              {
                value:profile?.followers ?? 0,
                label:t.followers
              },
              {
                value:profile?.following ?? 0,
                label:t.following
              }
            ].map(stat=>(
              // Tarjetas con contadores
              <div
                key={stat.label}
                className="
                rounded-2xl
                bg-[#F7F7FA]
                px-2
                py-4
                text-center
                "
              >
                <div className="
                text-2xl
                font-extrabold
                text-zinc-900
                ">
                  {stat.value}
                </div>

                <div className="
                mt-1
                text-xs
                font-semibold
                text-zinc-400
                ">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* INTERESTS */}
        <div className="
        mb-4
        rounded-4xl
        bg-white
        p-4
        shadow-sm
        ">
          <div className="mt-1 ml-1 mr-1">
            <p className="
            mb-3
            text-xs
            font-bold
            uppercase
            tracking-wider
            text-zinc-500
            ">
              {t.interests}
            </p>

            <div className="
            flex
            flex-wrap
            gap-2
            ">
              {interests.map(id=>{
                const cat =
                CATEGORIES.find(
                  c=>c.id===id
                );
                if(!cat) return null;
                return (
                  <div
                    key={cat.id}
                    className="
                    flex
                    items-center
                    gap-1.5
                    rounded-full
                    px-3
                    py-1.5
                    "
                    style={{
                      background:cat.bgColor
                    }}
                  >
                    <span>
                      {cat.emoji}
                    </span>

                    <span
                      className="
                      text-xs
                      font-bold
                      "
                      style={{
                        color:cat.color
                      }}
                    >
                      {cat.name[language]}
                    </span>
                  </div>
                )
              })}

              <button
                onClick={()=>
                  setShowInterests(
                    !showInterests
                  )
                }
                className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-full
                bg-gradient-to-br
                from-[#FF6B35]
                to-[#FF9A5C]
                text-white
                shadow-lg
                transition
                active:scale-95
                "
              >
                <Plus size={18}/>
              </button>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="
        mb-4
        flex
        rounded-4xl
        bg-white
        p-1
        shadow-sm
        ">
          {([
            {
              key:"recipes",
              label:t.myRecipes,
              icon:"👨‍🍳"
            },
            {
              key:"saved",
              label:t.saved,
              icon:"🔖"
            }
          ] as const).map(tab=>(
            <button
              key={tab.key}
              onClick={()=>
                setActiveTab(tab.key)
              }
              className={`
              flex-1
              rounded-4xl
              py-3
              text-sm
              font-bold
              transition
              ${
                activeTab===tab.key
                ?
                "bg-gradient-to-br from-[#FF6B35] to-[#FF9A5C] text-white shadow-md"
                :
                "text-zinc-400"
              }
              `}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
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
            // Card con mi receta / guardada
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
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-end bg-black/40 backdrop-blur-sm">
            <div className="w-full rounded-t-[28px] bg-white p-6">
              {/* Header */}
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-extrabold">
                  {t.settings}
                </h3>

                <button
                  onClick={()=> setShowSettings(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F2F2F7]">
                  ✕
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {/* Selector de Idioma */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: '#F2F2F7', borderRadius: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 20 }}>🌐</span>
                    <span style={{ fontWeight: 700, color: '#1C1C1E' }}>{t.language}</span>
                  </div>

                  <div style={{ display: 'flex', background: '#E5E5EA', borderRadius: 10, padding: 3 }}>
                    <button
                      onClick={() => setLanguage('es')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 8,
                        background: language === 'es' ? 'white' : 'transparent',
                        boxShadow: language === 'es' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                        fontWeight: 700,
                        fontSize: 13,
                        color: language === 'es' ? '#1C1C1E' : '#8E8E93',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      ES
                    </button>

                    <button
                      onClick={() => setLanguage('en')}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 8,
                        background: language === 'en' ? 'white' : 'transparent',
                        boxShadow: language === 'en' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                        fontWeight: 700,
                        fontSize: 13,
                        color: language === 'en' ? '#1C1C1E' : '#8E8E93',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      EN
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center justify-between rounded-2xl bg-[#F2F2F7] px-4 py-4 font-bold text-red-500 transition-colors hover:bg-[#E9E9EE]"
                >
                  <span>🚪 {t.logout}</span>
                  <span>→</span>
                </button>
              </div>
              
            </div>
          </div>
        )}
      </div>

      {
        openRecipe &&
        <RecipeModal
          recipe={openRecipe}
          onClose={()=>
            setOpenRecipe(null)
          }
        />
      }

    </div>
  );
}