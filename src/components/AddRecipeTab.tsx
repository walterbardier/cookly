import { useState, useRef } from 'react';
import { CATEGORIES } from '../data/mockData';
import { useLanguage } from '../context/LanguageContext'; // <-- Importamos nuestro hook
import { translations } from '../utils/translations'; // <-- Importamos los textos

import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

type Props = {
  onSuccess: () => void;
};

export default function AddRecipeTab({ onSuccess }: Props) {
  const { language } = useLanguage(); // Extraemos el idioma actual
  const t = translations[language].addRecipe; // Accedemos a los textos

  const [photo, setPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [duration, setDuration] = useState('');
  const [servings, setServings] = useState('');
  const [ingredients, setIngredients] = useState(['', '']);
  const [steps, setSteps] = useState(['', '']);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
  
    if(file){
      const url = URL.createObjectURL(file);
      setPhoto(url);
      setPhotoFile(file);
    }
  };

  const addIngredient = () => setIngredients(prev => [...prev, '']);
  const addStep = () => setSteps(prev => [...prev, '']);
  const removeIngredient = (i: number) => setIngredients(prev => prev.filter((_, idx) => idx !== i));
  const removeStep = (i: number) => setSteps(prev => prev.filter((_, idx) => idx !== i));

  const { user } = useAuth();

  const canPublish =
  !!photoFile &&
  title.trim() !== "" &&
  category !== "" &&
  duration.trim() !== "" &&
  servings.trim() !== "" &&
  ingredients.some(i => i.trim() !== "") &&
  steps.some(s => s.trim() !== "");

  const handleSubmit = async () => {
    // Si se puede publicar (están los campos llenos) -> se habilita el botón publicar
    if (!canPublish || !user) return;
    try {
      setLoading(true);
      let imageUrl = "";
      // 1. Subir imagen
      if(photoFile){
        const extension = photoFile.name.split(".").pop();
        const filePath =
          `${user.id}/${Date.now()}.${extension}`;

        const { error: uploadError } =
          await supabase.storage
          .from("recipe-images")
          .upload(
            filePath,
            photoFile
          );
        if(uploadError){
          throw uploadError;
        }

        const { data } =
          supabase.storage
          .from("recipe-images")
          .getPublicUrl(filePath);
  
        imageUrl = data.publicUrl;
      }
  
      // 2. Crear receta
      const { data: recipe, error: recipeError } =
        await supabase
        .from("recipes")
        .insert({
          author_id:user.id,
          title,
          description,
          category,
          duration:
            duration ? Number(duration) : null,
          servings:
            servings ? Number(servings) : null,
          image:imageUrl
        })
        .select()
        .single();
  
      if(recipeError){
        throw recipeError;
      }

      // Actualizar ingredientes y pasos dentro de recipes

      const { error: updateError } =
      await supabase
      .from("recipes")
      .update({

        ingredients:
          ingredients.filter(i => i.trim() !== ""),

        steps:
          steps.filter(s => s.trim() !== ""),

        tags: []

      })
      .eq(
        "id",
        recipe.id
      );


      if(updateError){
      throw updateError;
      }
  
      setSubmitted(true);

      setTimeout(()=>{
        setSubmitted(false);
        onSuccess();
      },1800);

    } catch(error){
  
      console.error(
        "Error creando receta:",
        error
      );
      alert(
        "No se pudo publicar la receta"
      );
    } finally {
      setLoading(false);
    }
  };
  

  if (submitted) {
    return (
      <div style={{
        minHeight: '100vh', background: '#F2F2F7',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 16,
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: 28,
          background: 'linear-gradient(135deg, #34C759, #5DD67A)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(52,199,89,0.4)',
          fontSize: 40,
        }}>✓</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1C1C1E' }}>{t.successTitle}</h2>
        <p style={{ fontSize: 15, color: '#636366' }}>{t.successMessage}</p>
      </div>
    );
  }

  return (
    <div style={{ background: '#F2F2F7', minHeight: '100vh', paddingBottom: 110 }}>
      {/* Header */}
      <div style={{
        background: 'rgba(242,242,247,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        position: 'sticky', top: 0, zIndex: 30,
        paddingTop: 'env(safe-area-inset-top, 44px)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px 12px' }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1C1C1E' }}>{t.title}</h1>
          <button
            onClick={handleSubmit}
            disabled={loading || !canPublish}
            style={{
              background: canPublish
                ? 'linear-gradient(135deg, #FF6B35, #FF9A5C)'
                : '#E5E5EA',
              color: canPublish
                ? 'white'
                : '#AEAEB2',
              borderRadius: 14, padding: '10px 20px',
              fontSize: 14, fontWeight: 800,
              boxShadow: canPublish
                ? '0 4px 14px rgba(255,107,53,0.4)'
                : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? "Publicando..." : t.publish}
          </button>
        </div>
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        {/* Photo upload */}
        <div style={{ marginBottom: 20 }}>
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display: 'none' }} />
          <button
            onClick={() => fileRef.current?.click()}
            style={{
              width: '100%', height: 200, borderRadius: 24,
              background: photo ? 'transparent' : 'white',
              border: photo ? 'none' : '2px dashed #E5E5EA',
              overflow: 'hidden', position: 'relative',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 8, cursor: 'pointer',
            }}
          >
            {photo ? (
              <>
                <img src={photo} alt="foto de receta"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
                <div style={{
                  position: 'absolute', bottom: 12, right: 12,
                  background: 'rgba(0,0,0,0.5)', borderRadius: 10, padding: '6px 12px',
                }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>{t.changePhoto}</span>
                </div>
              </>
            ) : (
              <>
                <div style={{
                  width: 56, height: 56, borderRadius: 18,
                  background: 'linear-gradient(135deg, #FF6B3520, #FF6B3540)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#FF6B35' }}>{t.addPhoto}</span>
                <span style={{ fontSize: 12, color: '#AEAEB2' }}>{t.photoHint}</span>
              </>
            )}
          </button>
        </div>

        {/* Title */}
        <Field label={t.recipeTitle} required>
          <input
            type="text"
            placeholder={t.recipeTitlePlaceholder}
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={inputStyle}
          />
        </Field>

        {/* Description */}
        <Field label={t.description}>
          <textarea
            placeholder={t.descriptionPlaceholder}
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: 'none', lineHeight: 1.5 }}
          />
        </Field>

        {/* Category */}
        <Field label={t.category} required>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(category === cat.id ? '' : cat.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 20,
                  fontWeight: 700, fontSize: 13,
                  background: category === cat.id ? cat.color : 'white',
                  color: category === cat.id ? 'white' : '#1C1C1E',
                  border: `2px solid ${category === cat.id ? cat.color : '#E5E5EA'}`,
                  transition: 'all 0.2s ease',
                  boxShadow: category === cat.id ? `0 4px 12px ${cat.color}44` : 'none',
                }}
              >
                <span>{cat.emoji}</span><span>{cat.name[language]}</span>
              </button>
            ))}
          </div>
        </Field>

        {/* Duration + Servings */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <Field label={t.duration}>
            <input
              type="number"
              placeholder={t.durationPlaceholder}
              value={duration}
              onChange={e => setDuration(e.target.value)}
              style={inputStyle}
              min={1}
            />
          </Field>
          <Field label={t.servings}>
            <input
              type="number"
              placeholder={t.servingsPlaceholder}
              value={servings}
              onChange={e => setServings(e.target.value)}
              style={inputStyle}
              min={1}
            />
          </Field>
        </div>

        {/* Ingredients */}
        <Field label={t.ingredients} required>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ingredients.map((ing, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 10, flexShrink: 0,
                  background: '#FFF0EB', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#FF6B35' }}>{i + 1}</span>
                </div>
                <input
                  type="text"
                  placeholder={`${t.ingredientPlaceholder} ${i + 1}`} // Aquí concatenamos
                  value={ing}
                  onChange={e => setIngredients(prev => prev.map((v, idx) => idx === i ? e.target.value : v))}
                  style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
                />
                {ingredients.length > 1 && (
                  <button onClick={() => removeIngredient(i)} style={{
                    width: 30, height: 30, borderRadius: 10,
                    background: '#FFE5EA', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF2D55" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                )}
              </div>
            ))}
            <button onClick={addIngredient} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px', borderRadius: 14,
              border: '2px dashed #FF6B3560', background: 'transparent',
              color: '#FF6B35', fontWeight: 700, fontSize: 14,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              {t.addIngredient}
            </button>
          </div>
        </Field>

        {/* Steps */}
        <Field label={t.steps} required>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 10, flexShrink: 0, marginTop: 2,
                  background: 'linear-gradient(135deg, #FF6B35, #FF9A5C)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'white' }}>{i + 1}</span>
                </div>
                <textarea
                  placeholder={`${t.stepPlaceholder} ${i + 1}…`}
                  value={step}
                  onChange={e => setSteps(prev => prev.map((v, idx) => idx === i ? e.target.value : v))}
                  rows={2}
                  style={{ ...inputStyle, marginBottom: 0, flex: 1, resize: 'none', lineHeight: 1.5 }}
                />
                {steps.length > 1 && (
                  <button onClick={() => removeStep(i)} style={{
                    width: 30, height: 30, borderRadius: 10, marginTop: 2,
                    background: '#FFE5EA', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF2D55" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                )}
              </div>
            ))}
            <button onClick={addStep} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 14px', borderRadius: 14,
              border: '2px dashed #FF6B3560', background: 'transparent',
              color: '#FF6B35', fontWeight: 700, fontSize: 14,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              {t.addStep}
            </button>
          </div>
        </Field>
      </div>
    </div>
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
      <label style={{
        display: 'block', fontSize: 13, fontWeight: 700, color: '#636366',
        marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5,
      }}>
        {label}{required && <span style={{ color: '#FF6B35', marginLeft: 3 }}>*</span>}
      </label>
      {children}
    </div>
  );
}
