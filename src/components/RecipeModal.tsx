import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import type { Recipe } from '../data/mockData';
import { CATEGORIES } from '../data/mockData';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../utils/translations';
import { useLikes } from '../context/LikesContext';
import { useSaves } from '../context/SavesContext';
import { useRecipes } from "../context/RecipesContext";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

type Props = {
  recipe: Recipe;
  onClose: () => void;
};

export default function RecipeModal({ recipe, onClose }: Props) {
  const { user } = useAuth();
  const { deleteRecipe } = useRecipes();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estado para controlar si estamos editando
  const [isEditing, setIsEditing] = useState(false);

  // Estados del formulario de edición (inicializados con los datos actuales de la receta)
  const [title, setTitle] = useState(recipe.title);
  const [description, setDescription] = useState(recipe.description || '');
  const [category, setCategory] = useState(recipe.category);
  const [duration, setDuration] = useState(recipe.duration ? String(recipe.duration) : '');
  const [servings, setServings] = useState(recipe.servings ? String(recipe.servings) : '');
  const [ingredients, setIngredients] = useState<string[]>(recipe.ingredients?.length ? recipe.ingredients : ['', '']);
  const [steps, setSteps] = useState<string[]>(recipe.steps?.length ? recipe.steps : ['', '']);
  const [photo, setPhoto] = useState<string | null>(recipe.image || null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { language } = useLanguage();
  const t = translations[language].recipeModal;
  const tAdd = translations[language].addRecipe;

  const [activeTab, setActiveTab] = useState<'ingredients' | 'steps'>('ingredients');

  const { isLiked, getLikes, toggleLike } = useLikes();
  const { isSaved, toggleSaved } = useSaves();

  const liked = isLiked(recipe.id);
  const saved = isSaved(recipe.id);
  const likes = getLikes(recipe.id);

  const currentCategory = CATEGORIES.find(c => c.id === recipe.category);
  const editCategoryObj = CATEGORIES.find(c => c.id === category);

  const handleLike = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    await toggleLike(recipe.id);
  };

  const handleSave = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    await toggleSaved(recipe.id);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhoto(url);
      setPhotoFile(file);
    }
  };

  const addIngredient = () => setIngredients(prev => [...prev, '']);
  const addStep = () => setSteps(prev => [...prev, '']);
  const removeIngredient = (i: number) => setIngredients(prev => prev.filter((_, idx) => idx !== i));
  const removeStep = (i: number) => setSteps(prev => prev.filter((_, idx) => idx !== i));

  const canSave =
    title.trim() !== "" &&
    category !== "" &&
    duration.trim() !== "" &&
    servings.trim() !== "" &&
    ingredients.some(i => i.trim() !== "") &&
    steps.some(s => s.trim() !== "");

  async function handleDeleteRecipe() {
    try {
      setDeleting(true);
      await deleteRecipe(recipe.id);
      setShowDeleteModal(false);
      setToastMessage(t.recipeDeleted);
      setToast(true);
      setTimeout(() => {
        setToast(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  }

  async function handleUpdateRecipe() {
    if (!canSave || !user) return;
    try {
      setLoading(true);
      let imageUrl = recipe.image;

      // 1. Si hay nueva foto, subirla a Supabase Storage
      if (photoFile) {
        const extension = photoFile.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("recipe-images")
          .upload(filePath, photoFile);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("recipe-images")
          .getPublicUrl(filePath);

        imageUrl = data.publicUrl;
      }

      // 2. Actualizar la receta en la BDD
      const { error: updateError } = await supabase
        .from("recipes")
        .update({
          title,
          description,
          category,
          duration: duration ? Number(duration) : null,
          servings: servings ? Number(servings) : null,
          image: imageUrl,
          ingredients: ingredients.filter(i => i.trim() !== ""),
          steps: steps.filter(s => s.trim() !== ""),
        })
        .eq("id", recipe.id);

      if (updateError) throw updateError;

      setToastMessage(t.recipeUpdated);
      setToast(true);

      setTimeout(() => {
        setToast(false);
        onClose();
        window.location.reload(); // Recarga para reflejar los cambios globales
      }, 1500);

    } catch (error) {
      console.error("Error actualizando receta:", error);
      alert("No se pudo actualizar la receta");
    } finally {
      setLoading(false);
    }
  }

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
          maxHeight: '92vh',
          background: 'white',
          borderRadius: '28px 28px 0 0',
          overflowY: 'auto',
        }}
      >
        {/* Toast Notificación */}
        {toast && (
          <div
            style={{
              position: "fixed",
              top: 30,
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(255,255,255,.92)",
              backdropFilter: "blur(20px)",
              padding: "14px 22px",
              borderRadius: 18,
              boxShadow: "0 10px 25px rgba(0,0,0,.12)",
              zIndex: 99999,
              fontWeight: 700,
            }}
          >
            ✅ {toastMessage}
          </div>
        )}

        {/* ================= VISTA DE EDICIÓN ================= */}
        {isEditing ? (
          <div style={{ padding: '20px 20px 100px', background: '#F2F2F7', minHeight: '100%' }}>
            {/* Header de Edición con Cancelar a la izquierda y Guardar con tick a la derecha */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
              background: 'rgba(242,242,247,0.85)',
              backdropFilter: 'blur(20px)',
              position: 'sticky',
              top: 0,
              zIndex: 30,
              paddingBottom: 12,
              paddingTop: 18,
            }}>
              {/* Botón Cancelar a la izquierda */}
              <button
                onClick={() => setIsEditing(false)}
                style={{
                  background: '#E5E5EA',
                  border: 'none',
                  borderRadius: 14,
                  padding: '10px 18px',
                  fontWeight: 700,
                  fontSize: 14,
                  color: '#1C1C1E',
                  cursor: 'pointer'
                }}
              >
                {t.cancel}
              </button>

              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1C1C1E', margin: 0 }}>{tAdd.editTitle}</h2>

              {/* Botón Guardar a la derecha con icono de Tick */}
              <button
                disabled={loading || !canSave}
                onClick={handleUpdateRecipe}
                style={{
                  background: canSave ? 'linear-gradient(135deg, #FF6B35, #FF9A5C)' : '#E5E5EA',
                  color: canSave ? 'white' : '#AEAEB2',
                  borderRadius: 14,
                  padding: '10px 18px',
                  fontSize: 14,
                  fontWeight: 800,
                  boxShadow: canSave ? '0 4px 14px rgba(255,107,53,0.4)' : 'none',
                  transition: 'all 0.2s ease',
                  border: 'none',
                  cursor: canSave ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {loading ? "Guardando..." : t.saveChanges}
              </button>
            </div>

            {/* Foto upload */}
            <div style={{ marginBottom: 20 }}>
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  width: '100%', height: 180, borderRadius: 20,
                  background: photo ? 'transparent' : 'white',
                  border: photo ? 'none' : '2px dashed #E5E5EA',
                  overflow: 'hidden', position: 'relative',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 8, cursor: 'pointer',
                }}
              >
                {photo ? (
                  <>
                    <img src={photo} alt="foto receta" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
                    <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.5)', borderRadius: 10, padding: '6px 12px' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>{tAdd.changePhoto}</span>
                    </div>
                  </>
                ) : (
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#FF6B35' }}>{tAdd.addPhoto}</span>
                )}
              </button>
            </div>

            {/* Título */}
            <Field label={tAdd.recipeTitle} required>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
            </Field>

            {/* Descripción */}
            <Field label={tAdd.description}>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'none' }} />
            </Field>

            {/* Categorías */}
            <Field label={tAdd.category} required>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 14px', borderRadius: 20, fontWeight: 700, fontSize: 13,
                      background: category === cat.id ? cat.color : 'white',
                      color: category === cat.id ? 'white' : '#1C1C1E',
                      border: `2px solid ${category === cat.id ? cat.color : '#E5E5EA'}`,
                      cursor: 'pointer'
                    }}
                  >
                    <span>{cat.emoji}</span><span>{cat.name[language]}</span>
                  </button>
                ))}
              </div>
            </Field>

            {/* Duración y Porciones */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <Field label={tAdd.duration}>
                <input type="number" value={duration} onChange={e => setDuration(e.target.value)} style={inputStyle} />
              </Field>
              <Field label={tAdd.servings}>
                <input type="number" value={servings} onChange={e => setServings(e.target.value)} style={inputStyle} />
              </Field>
            </div>

            {/* Ingredientes */}
            <Field label={tAdd.ingredients} required>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ingredients.map((ing, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="text"
                      value={ing}
                      onChange={e => setIngredients(prev => prev.map((v, idx) => idx === i ? e.target.value : v))}
                      style={{ ...inputStyle, flex: 1, marginBottom: 0 }}
                    />
                    {ingredients.length > 1 && (
                      <button onClick={() => removeIngredient(i)} style={{ width: 30, height: 30, background: '#FFE5EA', borderRadius: 10, border: 'none', color: '#FF2D55', fontWeight: 'bold', cursor: 'pointer' }}>×</button>
                    )}
                  </div>
                ))}
                <button onClick={addIngredient} style={{ padding: '10px', background: 'transparent', border: '2px dashed #FF6B3560', color: '#FF6B35', borderRadius: 14, fontWeight: 700, cursor: 'pointer' }}>
                  + {tAdd.addIngredient}
                </button>
              </div>
            </Field>

            {/* Pasos */}
            <Field label={tAdd.steps} required>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {steps.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <textarea
                      value={step}
                      onChange={e => setSteps(prev => prev.map((v, idx) => idx === i ? e.target.value : v))}
                      rows={2}
                      style={{ ...inputStyle, flex: 1, resize: 'none', marginBottom: 0 }}
                    />
                    {steps.length > 1 && (
                      <button onClick={() => removeStep(i)} style={{ width: 30, height: 30, background: '#FFE5EA', borderRadius: 10, border: 'none', color: '#FF2D55', fontWeight: 'bold', cursor: 'pointer' }}>×</button>
                    )}
                  </div>
                ))}
                <button onClick={addStep} style={{ padding: '10px', background: 'transparent', border: '2px dashed #FF6B3560', color: '#FF6B35', borderRadius: 14, fontWeight: 700, cursor: 'pointer' }}>
                  + {tAdd.addStep}
                </button>
              </div>
            </Field>
          </div>
        ) : (
          /* ================= VISTA DE DETALLE (NORMAL) ================= */
          <>
            {/* Hero image */}
            <div style={{ position: 'relative', height: 260, background: '#F2F2F7' }}>
              <img src={recipe.image} alt={recipe.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)' }} />
              <button
                onClick={onClose}
                style={{
                  position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.35)', borderRadius: '50%',
                  width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer'
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
              <div style={{ position: 'absolute', bottom: 14, left: 16, right: 16 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: currentCategory?.bgColor, borderRadius: 20, padding: '4px 10px', marginBottom: 6 }}>
                  <span>{currentCategory?.emoji}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: currentCategory?.color }}>{currentCategory?.name[language]}</span>
                </div>
              </div>
            </div>

            <div style={{ padding: '20px 20px 100px' }}>
              {/* Title + actions */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1C1C1E', lineHeight: 1.2, flex: 1 }}>{recipe.title}</h2>
                <div className="flex items-center gap-2">
                  <button onClick={handleLike} style={{ width: 40, height: 40, borderRadius: 12, background: liked ? "#FFF0F3" : "#F2F2F7", display: "flex", alignItems: "center", justifyContent: "center", border: 'none', cursor: 'pointer' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? "#FF2D55" : "none"} stroke={liked ? "#FF2D55" : "#636366"} strokeWidth="2">
                      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                    </svg>
                  </button>
                  <button onClick={handleSave} style={{ width: 40, height: 40, borderRadius: 12, background: saved ? "#FFF4E0" : "#F2F2F7", display: "flex", alignItems: "center", justifyContent: "center", border: 'none', cursor: 'pointer' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? "#FF9500" : "none"} stroke={saved ? "#FF9500" : "#636366"} strokeWidth="2">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Author */}
              <div className="flex items-center gap-2 mb-4">
                <img src={recipe.author?.avatar || recipe.profiles?.avatar} alt="Author" style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover" }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#636366" }}>
                  {t.authorPrefix} {recipe.author?.name || recipe.profiles?.name}
                </span>
              </div>

              {/* Stats */}
              <div className="flex gap-3 mb-5">
                {[
                  { icon: '⏱', label: `${recipe.duration} min` },
                  { icon: '👥', label: `${recipe.servings} pax` },
                  { icon: '❤️', label: `${likes}` },
                ].map(stat => (
                  <div key={stat.label} style={{ flex: 1, background: '#F2F2F7', borderRadius: 14, padding: '10px 6px', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, marginBottom: 2 }}>{stat.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1C1C1E' }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Description */}
              <p style={{ fontSize: 14, color: '#636366', lineHeight: 1.6, marginBottom: 20 }}>{recipe.description}</p>

              {/* Tabs */}
              <div style={{ display: 'flex', background: '#F2F2F7', borderRadius: 14, padding: 4, marginBottom: 20 }}>
                {(['ingredients', 'steps'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      flex: 1, padding: '10px 0', borderRadius: 11, fontSize: 14, fontWeight: 700,
                      background: activeTab === tab ? 'white' : 'transparent',
                      color: activeTab === tab ? '#1C1C1E' : '#AEAEB2',
                      border: 'none', cursor: 'pointer'
                    }}
                  >
                    {tab === 'ingredients' ? t.ingredientsTab : t.stepsTab}
                  </button>
                ))}
              </div>

              {/* Content Ingredients / Steps */}
              {activeTab === 'ingredients' ? (
                <div className="flex flex-col gap-2">
                  {recipe.ingredients?.map((ingredient, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: '#FFF0EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: '#FF6B35' }}>{i + 1}</span>
                      </div>
                      <span style={{ fontSize: 14, color: '#1C1C1E', fontWeight: 500 }}>{ingredient}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {recipe.steps?.map((step, i) => (
                    <div key={i} className="flex gap-3">
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #FF6B35, #FF9A5C)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: 'white' }}>{i + 1}</span>
                      </div>
                      <span style={{ fontSize: 14, color: '#1C1C1E', lineHeight: 1.6, fontWeight: 500 }}>{step}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Botones de Editar y Eliminar (Solo visibles si el usuario es el autor) */}
              {user?.id === recipe.author_id && (
              <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
                {/* Botón de Editar con icono SVG */}
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    flex: 1,
                    height: 50,
                    borderRadius: 16,
                    background: '#E8F2FF',
                    color: '#007AFF',
                    fontWeight: 700,
                    fontSize: 15,
                    border: "none",
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                  </svg>
                  {t.editRecipe}
                </button>

                {/* Botón de Eliminar */}
                <button
                  onClick={() => setShowDeleteModal(true)}
                  style={{
                    flex: 1,
                    height: 50,
                    borderRadius: 16,
                    background: '#FFF1F1',
                    color: '#FF3B30',
                    fontWeight: 700,
                    fontSize: 15,
                    border: "none",
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  {t.deleteRecipe}
                </button>
              </div>
            )}
            </div>
          </>
        )}

        {/* Modal de confirmación de eliminación */}
        {showDeleteModal && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.35)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }}>
            <div style={{ width: "100%", maxWidth: 340, background: "white", borderRadius: 28, padding: 24 }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 10 }}>{t.deleteRecipeTitle}</h3>
              <p style={{ color: "#666", lineHeight: 1.5, marginBottom: 24 }}>{t.deleteRecipeDescription}</p>
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => setShowDeleteModal(false)} style={{ flex: 1, height: 50, borderRadius: 16, background: "#F2F2F7", fontWeight: 700, border: 'none' }}>{t.cancel}</button>
                <button disabled={deleting} onClick={handleDeleteRecipe} style={{ flex: 1, height: 50, borderRadius: 16, background: "#FF3B30", color: "white", fontWeight: 700, border: 'none' }}>{t.confirmDelete}</button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', border: 'none', outline: 'none',
  background: 'white', borderRadius: 14,
  padding: '13px 16px', fontSize: 15,
  color: '#1C1C1E', fontWeight: 500,
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  fontFamily: 'inherit',
  marginBottom: 0,
};

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#636366', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}{required && <span style={{ color: '#FF6B35', marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  );
}