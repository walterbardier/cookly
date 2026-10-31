import { useEffect, useState } from 'react';
import RecipeModal from "./RecipeModal";

import { CATEGORIES } from "../data/mockData";
import type { Recipe } from '../data/mockData';

import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/translations';

import { useLikes } from "../context/LikesContext";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export default function FriendsTab() {
  const { language } = useLanguage();
  const t = translations[language].friends;

  const { user } = useAuth();
  const [openRecipe, setOpenRecipe] = useState<Recipe | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [following, setFollowing] = useState<string[]>([]);

  const {
    initializeLikes,
    getLikes,
    isLiked,
    toggleLike,
  } = useLikes();

  useEffect(() => {
    loadFriends();
  }, [user]);

  async function loadFriends() {
    if (!user) return;

    // 1. Cargar usuarios (excluyendo al usuario actual)
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .neq("id", user.id);

    if (profilesError) {
      console.log(profilesError);
      return;
    }

    // 2. Cargar recetas públicas de otros usuarios con su información de perfil asociada
    const { data: recipeData, error: recipeError } = await supabase
      .from("recipes")
      .select(`
        *,
        author:profiles!recipes_author_id_fkey(
          id,
          username,
          name,
          avatar
        )
      `)
      .neq("author_id", user.id)
      .neq("is_public", false) // <-- Filtramos para traer solo recetas públicas
      .order("created_at", { ascending: false });

    if (recipeError) {
      console.log(recipeError);
      return;
    }
    
    setRecipes(recipeData ?? []);

    initializeLikes(
      (recipeData ?? []).map(recipe => ({
        id: recipe.id,
        likes: recipe.likes,
      }))
    );

    // 3. Mapear perfiles calculando cuántas recetas públicas pertenecen a cada author_id
    const profilesWithCounts = (profiles ?? []).map(profile => ({
      ...profile,
      recipesCount: recipeData?.filter(
        recipe => recipe.author_id === profile.id
      ).length ?? 0,
    }));

    setUsers(profilesWithCounts);

    // 4. Cargar a qué usuarios sigue el usuario actual
    const { data: follows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);

    setFollowing(
      follows?.map(f => f.following_id) ?? []
    );
  }

  async function toggleFollow(id: string) {
    if (!user) return;

    const exists = following.includes(id);

    if (exists) {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", id);

      setFollowing(prev =>
        prev.filter(x => x !== id)
      );
    } else {
      await supabase
        .from("follows")
        .insert({
          follower_id: user.id,
          following_id: id
        });

      setFollowing(prev => [
        ...prev,
        id
      ]);
    }
  }

  const suggestions = users;

  const followingRecipes = recipes.filter(recipe =>
    following.includes(recipe.author?.id) && recipe.is_public !== false
  );

  return (
    <div style={{ background: '#F2F2F7', minHeight: '100vh', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{
        background: 'rgba(242,242,247,0.85)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 30,
        paddingTop: 'env(safe-area-inset-top, 44px)',
      }}
      className='mt-4'>
        <div style={{ padding: '14px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <h1 className="text-3xl font-extrabold text-zinc-900">
            {t.title}
          </h1>

          <button style={{
            width: 36, height: 36, borderRadius: 12, background: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1C1C1E" strokeWidth="2" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      <div style={{ padding: '16px 0' }}>
        {/* Suggestions */}
        {suggestions.length > 0 && (
          <section style={{ marginBottom: 24 }}>
            <div style={{ padding: '0 20px', marginBottom: 12 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1C1C1E' }}>{t.suggestions}</h2>
            </div>
            {/* Cards de usuarios */}
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingLeft: 20, paddingRight: 20 }}>
              {suggestions.map(u => (
                <div 
                  key={u.id}
                  className="
                    w-40 shrink-0
                    bg-white
                    rounded-3xl
                    p-4
                    text-center
                    shadow-[0_2px_8px_rgba(0,0,0,0.05)]
                    flex
                    flex-col
                    items-center
                  "
                >
                  {u.avatar ? (
                    <img src={u.avatar} alt={u.name} className="w-14 h-14 rounded-full object-cover mb-2"/>
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-[#E5E5EA] flex items-center justify-center mb-2">
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                  )}

                  <p style={{ fontSize: 13, fontWeight: 800, color: '#1C1C1E', marginBottom: 2 }}>{u.name}</p>

                  <p style={{ fontSize: 11, color: '#AEAEB2', fontWeight: 600, marginBottom: 4 }}>@{u.username}</p>

                  {/* Cantidad real de recetas públicas */}
                  <p style={{ fontSize: 11, color: '#636366', marginBottom: 12 }}>
                    {u.recipesCount} {t.recipes}
                  </p>
                  
                  <button
                    onClick={() => toggleFollow(u.id)}
                    className={`
                      w-full py-2 rounded-4xl
                      text-xs font-extrabold
                      transition-all duration-300 ease-out
                      active:scale-95
                      ${
                        following.includes(u.id)
                          ? `
                            bg-[#F2F2F7]
                            text-[#636366]
                            shadow-none
                            hover:bg-[#E5E5EA]
                          `
                          : `
                            bg-gradient-to-br from-[#FF6B35] to-[#FF9A5C]
                            text-white
                            shadow-[0_4px_12px_rgba(255,107,53,0.35)]
                            hover:shadow-[0_8px_20px_rgba(255,107,53,0.45)]
                            hover:scale-[1.03]
                          `
                      }
                    `}
                  >
                    {following.includes(u.id)
                      ? t.following
                      : t.follow
                    }
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Following feed */}
        <section>
          <div style={{ padding: '0 20px', marginBottom: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1C1C1E' }}>{t.recentActivity}</h2>
          </div>
          {
            followingRecipes.length === 0 ? (
              <div style={{
                height: 220,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '0 40px'
              }}>
                <p style={{
                  color: '#8E8E93',
                  fontSize: 15,
                  fontWeight: 600,
                  lineHeight: 1.4
                }}>
                  {t.emptyActivity}
                </p>
              </div>
            ) : (
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 16, 
                padding: '0 20px' 
              }}>
                {followingRecipes.map(recipe => {
                  const category = CATEGORIES.find(c => c.id === recipe.category);

                  return (
                    <div key={recipe.id} style={{
                      background: 'white',
                      borderRadius: 24,
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    }}>
                      {/* Post header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {recipe.author?.avatar ? (
                            <img src={recipe.author.avatar} alt={recipe.author?.name}
                              style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#E5E5EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                              </svg>
                            </div>
                          )}
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 800, color: '#1C1C1E' }}>{recipe.author?.name}</p>
                            <p style={{ fontSize: 11, color: '#AEAEB2', fontWeight: 600 }}>@{recipe.author?.username}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleFollow(recipe.author?.id)}
                          style={{
                            padding: '6px 14px', borderRadius: 10,
                            fontSize: 12, fontWeight: 800,
                            background: following.includes(recipe.author?.id) ? '#F2F2F7' : 'linear-gradient(135deg, #FF6B35, #FF9A5C)',
                            color: following.includes(recipe.author?.id) ? '#636366' : 'white',
                            boxShadow: following.includes(recipe.author?.id) ? 'none' : '0 4px 12px rgba(255,107,53,0.35)',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {following.includes(recipe.author?.id) ? t.following : t.follow}
                        </button>
                      </div>
    
                      {/* Recipe image */}
                      <button onClick={() => setOpenRecipe(recipe)} style={{ display: 'block', width: '100%', border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}>
                        <div style={{ height: 200, background: '#F2F2F7', position: 'relative' }}>
                          <img src={recipe.image} alt={recipe.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <div style={{
                            position: 'absolute', bottom: 10, left: 12,
                            background: category?.bgColor, borderRadius: 16, padding: '4px 10px',
                            display: 'flex', alignItems: 'center', gap: 4,
                          }}>
                            <span style={{ fontSize: 12 }}>{category?.emoji}</span>
                            <span style={{ fontSize: 10, fontWeight: 700, color: category?.color }}>{category?.name[language]}</span>
                          </div>
                        </div>
                      </button>
    
                      {/* Post footer */}
                      <div style={{ padding: '12px 16px 14px' }}>
                        <p style={{ fontSize: 15, fontWeight: 800, color: '#1C1C1E', marginBottom: 4 }}>{recipe.title}</p>
                        <p style={{ fontSize: 13, color: '#636366', marginBottom: 12 }}>
                          {recipe.description && recipe.description.length > 60 ? recipe.description.slice(0, 60) + '…' : recipe.description}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                          <LikeButton
                            liked={isLiked(recipe.id)}
                            count={getLikes(recipe.id)}
                            onClick={() => toggleLike(recipe.id)}
                          />
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#AEAEB2' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                            </svg>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{t.comment}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#AEAEB2' }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                            </svg>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{t.share}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          }
        </section>
      </div>

      {openRecipe && <RecipeModal recipe={openRecipe} onClose={() => setOpenRecipe(null)} />}
    </div>
  );
}

function LikeButton({
  liked,
  count,
  onClick,
}: {
  liked: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        background: "none",
        border: "none",
        cursor: "pointer",
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={liked ? "#FF2D55" : "none"}
        stroke={liked ? "#FF2D55" : "#AEAEB2"}
        strokeWidth="2"
      >
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
      </svg>

      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: liked ? "#FF2D55" : "#AEAEB2",
        }}
      >
        {count}
      </span>
    </button>
  );
}