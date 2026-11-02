import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../utils/translations";

type Comment = {
  id: string;
  recipe_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: {
    name: string;
    username: string;
    avatar: string;
  };
};

export default function CommentsModal({ recipe, onClose }: { recipe: any; onClose: () => void }) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = translations[language].friends;

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadComments();
  }, [recipe.id]);

  async function loadComments() {
    const { data, error } = await supabase
      .from("comments")
      .select(`
        *,
        user:profiles(id, name, username, avatar)
      `)
      .eq("recipe_id", recipe.id)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setComments(data);
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setLoading(true);
    const { error } = await supabase.from("comments").insert({
      recipe_id: recipe.id,
      user_id: user.id,
      content: newComment.trim(),
    });

    if (!error) {
      setNewComment("");
      loadComments();
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full max-w-lg h-[90vh] sm:h-[85vh] rounded-t-[32px] sm:rounded-3xl flex flex-col overflow-hidden shadow-2xl">
        
        {/* PARTE SUPERIOR: PREvisualización DEL POST (Media pantalla aprox) */}
        <div className="relative h-[45%] bg-zinc-900 shrink-0 flex flex-col justify-between overflow-hidden">
          <img 
            src={recipe.image} 
            alt={recipe.title} 
            className="absolute inset-0 w-full h-full object-cover opacity-50 blur-xs scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/40 to-transparent" />

          {/* Botón Cerrar */}
          <div className="relative z-10 flex justify-between items-center p-4">
            <h3 className="text-white font-extrabold text-base drop-shadow-md">Comentarios</h3>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-md hover:bg-black/60 transition"
            >
              ✕
            </button>
          </div>

          {/* Información del Post (Autor y Título) */}
          <div className="relative z-10 p-5 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              {recipe.author?.avatar ? (
                <img src={recipe.author.avatar} alt={recipe.author?.name} className="w-10 h-10 rounded-full object-cover border border-white/20" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-white font-bold">
                  {recipe.author?.name?.[0]}
                </div>
              )}
              <div>
                <p className="text-white font-bold text-sm drop-shadow">{recipe.author?.name}</p>
                <p className="text-zinc-300 text-xs">@{recipe.author?.username}</p>
              </div>
            </div>
            <h2 className="text-white font-extrabold text-lg leading-snug drop-shadow-md line-clamp-2">
              {recipe.title}
            </h2>
          </div>
        </div>

        {/* PARTE INFERIOR: COMENTARIOS */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F2F2F7]">
          {comments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 text-sm">
              <p>No hay comentarios aún. ¡Sé el primero en comentar! 💬</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="bg-white p-3.5 rounded-2xl shadow-xs flex gap-3">
                {comment.user?.avatar ? (
                  <img src={comment.user.avatar} alt={comment.user?.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-zinc-200 flex items-center justify-center font-bold text-zinc-600 shrink-0 text-xs">
                    {comment.user?.name?.[0] || "?"}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-zinc-900">{comment.user?.name}</span>
                    <span className="text-[10px] text-zinc-400">
                      {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mb-1">@{comment.user?.username}</p>
                  <p className="text-sm text-zinc-800 leading-relaxed">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* INPUT PARA ESCRIBIR COMENTARIO */}
        <form onSubmit={handleAddComment} className="p-3 bg-white border-t border-zinc-200 flex items-center gap-2">
          <input
            type="text"
            placeholder="Escribe un comentario..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 bg-[#F2F2F7] px-4 py-2.5 rounded-full text-sm outline-none text-zinc-900 focus:ring-2 focus:ring-[#FF6B35]/30 transition"
          />
          <button
            type="submit"
            disabled={loading || !newComment.trim()}
            className={`px-5 py-2.5 rounded-full text-xs font-bold text-white transition ${
              loading || !newComment.trim() ? "bg-zinc-300 cursor-not-allowed" : "bg-[#FF6B35] hover:opacity-90 active:scale-95"
            }`}
          >
            {loading ? "Enviando..." : "Comentar"}
          </button>
        </form>

      </div>
    </div>
  );
}