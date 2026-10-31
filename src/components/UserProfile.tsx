import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES } from '../data/mockData';
import type { Recipe } from '../data/mockData';
import RecipeModal from './RecipeModal';
import { useLanguage } from '../context/LanguageContext';
import { useLikes } from '../context/LikesContext';
import { translations } from '../utils/translations';

type Props = {
  userId: string;
  onClose: () => void;
};

export default function UserProfile({ userId, onClose }: Props) {
  const { user: currentUser } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];

  const [profile, setProfile] = useState<any>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openRecipe, setOpenRecipe] = useState<Recipe | null>(null);

  const { initializeLikes } = useLikes();

  useEffect(() => {
    if (!userId) return;

    async function loadUserProfile() {
      setLoading(true);
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        const { data: recipeData, error: recipeError } = await supabase
          .from('recipes')
          .select(`
            *,
            author:profiles!recipes_author_id_fkey(
              id,
              username,
              name,
              avatar
            )
          `)
          .eq('author_id', userId)
          .neq('is_public', false)
          .order('created_at', { ascending: false });

        if (!recipeError && recipeData) {
          setRecipes(recipeData);
          initializeLikes(recipeData);
        }

        const { count: followersTotal } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', userId);
        setFollowersCount(followersTotal || 0);

        const { count: followingTotal } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', userId);
        setFollowingCount(followingTotal || 0);

        if (currentUser && currentUser.id !== userId) {
          const { data: followCheck } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', currentUser.id)
            .eq('following_id', userId)
            .maybeSingle();

          setIsFollowing(!!followCheck);
        }
      } catch (err) {
        console.error('Error cargando perfil de usuario:', err);
      } finally {
        setLoading(false);
      }
    }

    loadUserProfile();
  }, [userId, currentUser]);

  const toggleFollow = async () => {
    if (!currentUser || currentUser.id === userId) return;

    if (isFollowing) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUser.id)
        .eq('following_id', userId);

      setIsFollowing(false);
      setFollowersCount(prev => Math.max(0, prev - 1));
    } else {
      await supabase
        .from('follows')
        .insert({
          follower_id: currentUser.id,
          following_id: userId,
        });

      setIsFollowing(true);
      setFollowersCount(prev => prev + 1);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="w-12 h-12 rounded-full border-4 border-[#FF6B35] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        paddingTop: '2vh',
      }}
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 220, damping: 26 }}
        style={{
          width: '100%',
          maxWidth: 480,
          height: '96vh',
          maxHeight: '96vh',
          background: '#F2F2F7',
          borderRadius: '28px 28px 0 0',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          paddingBottom: 40,
        }}
      >
        {/* Header Sticky */}
        <div
          style={{
            background: 'rgba(242,242,247,0.85)',
            backdropFilter: 'blur(20px)',
            position: 'sticky',
            top: 0,
            zIndex: 30,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(0,0,0,0.05)',
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1C1C1E', margin: 0 }}>
            {profile.name}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(0,0,0,0.08)',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontWeight: 700,
              color: '#1C1C1E',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: '16px 16px 0' }}>
          {/* Tarjeta de Perfil principal con Banner limpio */}
          <div
            style={{
              background: 'white',
              borderRadius: 32,
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0,0,0,.06)',
              marginBottom: 16,
            }}
          >
            {/* Imagen del Banner */}
            <div
              style={{
                width: '100%',
                height: 130,
                background: profile.banner 
                  ? `url(${profile.banner}) center/cover no-repeat` 
                  : 'linear-gradient(135deg, #FF6B35, #FF9A5C)',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 24,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.15), transparent)',
                }}
              />
            </div>

            {/* Contenido del Perfil */}
            <div style={{ padding: '0 20px 24px', textAlign: 'center' }}>
              {/* Avatar flotante sobre el banner */}
              <div 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  marginTop: '-46px', 
                  marginBottom: 12, 
                  position: 'relative', 
                  zIndex: 2 
                }}
              >
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    style={{
                      width: 84,
                      height: 84,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '4px solid white',
                      boxShadow: '0 8px 20px rgba(0,0,0,.15)',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 84,
                      height: 84,
                      borderRadius: '50%',
                      background: '#E5E5EA',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '4px solid white',
                      boxShadow: '0 8px 20px rgba(0,0,0,.15)',
                    }}
                  >
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                )}
              </div>

              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1C1C1E', marginBottom: 2 }}>
                {profile.name}
              </h1>
              <p style={{ color: '#8E8E93', fontWeight: 600, fontSize: 13, marginBottom: 8 }}>
                @{profile.username}
              </p>
              {profile.bio && (
                <p
                  style={{
                    maxWidth: 300,
                    margin: '0 auto 16px',
                    fontSize: 13,
                    lineHeight: 1.5,
                    color: '#636366',
                  }}
                >
                  {profile.bio}
                </p>
              )}

              {/* Botón Seguir / Siguiendo */}
              {currentUser && currentUser.id !== userId && (
                <button
                  onClick={toggleFollow}
                  style={{
                    width: '100%',
                    padding: '12px 0',
                    borderRadius: 20,
                    fontWeight: 800,
                    fontSize: 14,
                    border: 'none',
                    cursor: 'pointer',
                    background: isFollowing
                      ? '#E5E5EA'
                      : 'linear-gradient(135deg, #FF6B35, #FF9A5C)',
                    color: isFollowing ? '#1C1C1E' : 'white',
                    boxShadow: isFollowing ? 'none' : '0 4px 14px rgba(255,107,53,0.35)',
                    transition: 'all 0.2s ease',
                    marginBottom: 16,
                  }}
                >
                  {isFollowing ? t.friends.following : t.friends.follow}
                </button>
              )}

              {/* Contadores */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 8,
                }}
              >
                {[
                  { value: recipes.length, label: t.profile.recipesCount },
                  { value: followersCount, label: t.profile.followers },
                  { value: followingCount, label: t.profile.following },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    style={{
                      background: '#F7F7FA',
                      borderRadius: 18,
                      padding: '10px 4px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#1C1C1E' }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#8E8E93', marginTop: 2 }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Intereses */}
          {profile.interests && profile.interests.length > 0 && (
            <div
              style={{
                background: 'white',
                borderRadius: 32,
                padding: 20,
                marginBottom: 16,
                boxShadow: '0 10px 30px rgba(0,0,0,.06)',
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#8E8E93',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 12,
                }}
              >
                {t.profile.interests}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {profile.interests.map((catId: string) => {
                  const cat = CATEGORIES.find((c) => c.id === catId);
                  if (!cat) return null;
                  return (
                    <div
                      key={cat.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        background: cat.bgColor,
                        padding: '6px 12px',
                        borderRadius: 20,
                        border: `1.5px solid ${cat.color}33`,
                      }}
                    >
                      <span>{cat.emoji}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: cat.color }}>
                        {cat.name[language]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recetas Públicas Grid */}
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1C1C1E', marginBottom: 12, paddingLeft: 4 }}>
              {t.profile.publicRecipes}
            </h3>

            {recipes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', background: 'white', borderRadius: 32 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🍳</div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#1C1C1E' }}>Sin recetas públicas</p>
                <p style={{ fontSize: 12, color: '#8E8E93', marginTop: 2 }}>Este usuario aún no ha compartido recetas.</p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 8,
                  overflow: 'hidden',
                  borderRadius: 24,
                }}
              >
                {recipes.map((recipe) => (
                  <button
                    key={recipe.id}
                    onClick={() => setOpenRecipe(recipe)}
                    style={{
                      position: 'relative',
                      aspectRatio: '1',
                      overflow: 'hidden',
                      background: '#E5E5EA',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      borderRadius: 16,
                    }}
                  >
                    <img
                      src={recipe.image}
                      alt={recipe.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.2s ease',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%)',
                      }}
                    />
                    <p
                      style={{
                        position: 'absolute',
                        bottom: 8,
                        left: 8,
                        right: 8,
                        textAlign: 'left',
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'white',
                        margin: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {recipe.title}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {openRecipe && (
          <RecipeModal recipe={openRecipe} onClose={() => setOpenRecipe(null)} />
        )}
      </motion.div>
    </motion.div>
  );
}