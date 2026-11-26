import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { translations } from "../utils/translations";

const iosEase = [0.22, 1, 0.36, 1] as const;

type Comment = {
  id: string;
  recipe_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: {
    id: string;
    name: string;
    username: string;
    avatar: string;
  };
  likes_count?: number;
  liked_by_me?: boolean;
};

export default function CommentsModal({
  recipe,
  onClose,
}: {
  recipe: any;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = translations[language].comments;

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    loadComments();
  }, [recipe.id, user?.id]);

  async function loadComments() {
    if (!user?.id) return;

    const { data: commentsData, error } = await supabase
      .from("comments")
      .select(`
        *,
        user:profiles!comments_user_id_fkey(id, name, username, avatar)
      `)
      .eq("recipe_id", recipe.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error cargando comentarios:", error);
      return;
    }

    if (!commentsData) return;

    const commentIds = commentsData.map((c) => c.id);
    let userLikes: string[] = [];

    if (commentIds.length > 0) {
      const { data: likesData } = await supabase
        .from("comment_likes")
        .select("comment_id")
        .eq("user_id", user.id)
        .in("comment_id", commentIds);

      userLikes = likesData?.map((l) => l.comment_id) || [];
    }

    const formattedComments = await Promise.all(
      commentsData.map(async (comment) => {
        const { count } = await supabase
          .from("comment_likes")
          .select("*", { count: "exact", head: true })
          .eq("comment_id", comment.id);

        return {
          ...comment,
          likes_count: count || 0,
          liked_by_me: userLikes.includes(comment.id),
        };
      })
    );

    setComments(formattedComments);
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

    if (error) {
      console.error("Error al publicar comentario:", error);
      alert(t.errorPrefix + error.message);
    } else {
      setNewComment("");
      loadComments();
    }
    setLoading(false);
  }

  async function toggleCommentLike(commentId: string, likedByMe: boolean) {
    if (!user) return;

    if (likedByMe) {
      await supabase
        .from("comment_likes")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("comment_likes")
        .insert({ comment_id: commentId, user_id: user.id });
    }

    loadComments();
  }

  async function handleDeleteComment(commentId: string) {
    const { error } = await supabase.from("comments").delete().eq("id", commentId);
    if (!error) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
    setActiveMenuId(null);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.32, ease: iosEase }}
      className="fixed inset-0 z-[100] flex h-screen w-screen select-none flex-col overflow-hidden bg-white"
    >
      {/* HEADER SUPERIOR FLOTANTE SIN FONDO SÓLIDO, CON DEGRADADO SUAVE HACIA ABAJO */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, ease: iosEase }}
        className="pointer-events-none fixed left-0 right-0 top-0 z-20 flex flex-col pt-[env(safe-area-inset-top,44px)]"
      >
        {/* Degradado superior suave hacia 0% de opacidad abajo */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[192px] bg-gradient-to-b from-white/100 via-white/70 to-white/80" />

        {/* Barra de navegación */}
        <div className="pointer-events-auto relative z-10 flex items-center justify-between px-5 pb-3 pt-2">
          <h3 className="m-0 text-[22px] font-extrabold tracking-[-0.4px] text-[#1C1C1E]">
            {t.title}
          </h3>
          <motion.button
            type="button"
            aria-label="Cerrar"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            onClick={onClose}
            className="flex h-10 w-10 cursor-pointer select-none items-center justify-center rounded-full border-none bg-white/90 text-sm font-extrabold text-[#1C1C1E] shadow-sm backdrop-blur-md transition-colors duration-200 hover:bg-white"
          >
            ✕
          </motion.button>
        </div>

        {/* Hero / Preview flotando libremente */}
        <div className="pointer-events-auto relative z-10 px-4">
          <div className="group/hero relative flex h-[132px] w-full flex-col justify-end overflow-hidden rounded-[24px] bg-zinc-900 shadow-[0_10px_28px_rgba(0,0,0,0.14)]">
            <img
              src={recipe.image}
              alt={recipe.title}
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
              className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover opacity-60 transition-transform duration-500 ease-out group-hover/hero:scale-[1.03]"
            />

            {/* Degradado oscuro marcado dentro de la card */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/20" />

            {/* Info de usuario y título un poco más arriba */}
            <div className="relative z-10 flex items-center justify-between gap-3 px-4 pb-3.5 pt-2">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <h2 className="m-0 line-clamp-1 text-[15px] font-extrabold leading-snug text-white drop-shadow-[0_1px_5px_rgba(0,0,0,0.6)]">
                  {recipe.title}
                </h2>

                <div className="flex items-center gap-2">
                  {recipe.author?.avatar ? (
                    <img
                      src={recipe.author.avatar}
                      alt={recipe.author?.name}
                      draggable={false}
                      onContextMenu={(e) => e.preventDefault()}
                      className="pointer-events-none h-6 w-6 shrink-0 select-none rounded-full border border-white/45 object-cover"
                    />
                  ) : (
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/25 text-[10px] font-bold text-white backdrop-blur-sm">
                      {recipe.author?.name?.[0]}
                    </div>
                  )}
                  <span className="truncate text-xs font-bold text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.55)]">
                    {recipe.author?.name}
                  </span>
                  <span className="truncate text-[11px] font-medium text-white/80">
                    @{recipe.author?.username}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Degradado suave debajo de la card hacia 0% de opacidad */}
        <div className="pointer-events-none relative z-10 h-8 w-full bg-gradient-to-b from-white/70 via-white/30 to-transparent" />
      </motion.div>

      {/* PARTE INFERIOR: LISTADO ESTILO X / TWITTER PASANDO POR DEBAJO */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: iosEase, delay: 0.06 }}
        className="h-full w-full overflow-y-auto bg-white pb-28 pt-[calc(env(safe-area-inset-top,44px)+210px)]"
      >
        {comments.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center text-sm text-zinc-400">
            <p className="m-0 font-semibold">{t.empty}</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {comments.map((comment, index) => (
              <motion.article
                key={comment.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{
                  duration: 0.26,
                  ease: iosEase,
                  delay: Math.min(index * 0.03, 0.2),
                }}
                className="group/row relative flex gap-3 border-b border-black/[0.06] px-5 py-3.5 transition-colors duration-200 ease-out hover:bg-[#FAFAFC] last:border-b-0"
              >
                {comment.user?.avatar ? (
                  <img
                    src={comment.user.avatar}
                    alt={comment.user?.name}
                    draggable={false}
                    onContextMenu={(e) => e.preventDefault()}
                    className="pointer-events-none mt-0.5 h-9 w-9 shrink-0 select-none rounded-full object-cover transition-transform duration-200 ease-out group-hover/row:scale-[1.03]"
                  />
                ) : (
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F2F2F7] text-xs font-bold text-zinc-600 transition-transform duration-200 ease-out group-hover/row:scale-[1.03]">
                    {comment.user?.name?.[0] || "?"}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-baseline gap-1.5">
                      <span className="truncate text-[13px] font-extrabold text-[#1C1C1E] transition-colors duration-200 group-hover/row:text-black">
                        {comment.user?.name}
                      </span>
                      <span className="truncate text-xs font-medium text-[#8E8E93]">
                        @{comment.user?.username}
                      </span>
                      <span className="shrink-0 text-[11px] text-[#AEAEB2]">
                        ·{" "}
                        {new Date(comment.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  <p className="m-0 mt-1 break-words text-[14px] leading-[1.45] text-[#1C1C1E]/90">
                    {comment.content}
                  </p>

                  <div className="mt-2.5 flex items-center justify-between">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.88 }}
                      onClick={() =>
                        toggleCommentLike(comment.id, !!comment.liked_by_me)
                      }
                      className="group/like flex cursor-pointer select-none items-center gap-1.5 rounded-full border-none bg-transparent px-1.5 py-0.5 transition-colors duration-200 hover:bg-[#FF2D55]/[0.07]"
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill={comment.liked_by_me ? "#FF2D55" : "none"}
                        stroke={comment.liked_by_me ? "#FF2D55" : "#AEAEB2"}
                        strokeWidth="2"
                        className="transition-all duration-200 group-hover/like:stroke-[#FF2D55]"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                      </svg>
                      <span
                        className={`text-xs font-semibold transition-colors duration-200 ${
                          comment.liked_by_me
                            ? "text-[#FF2D55]"
                            : "text-[#AEAEB2] group-hover/like:text-[#FF2D55]"
                        }`}
                      >
                        {comment.likes_count || 0}
                      </span>
                    </motion.button>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveMenuId(
                            activeMenuId === comment.id ? null : comment.id
                          )
                        }
                        className="flex h-7 w-7 cursor-pointer select-none items-center justify-center rounded-full border-none bg-transparent text-xs text-[#AEAEB2] transition-all duration-200 hover:bg-[#F2F2F7] hover:text-[#1C1C1E]"
                      >
                        •••
                      </button>

                      <AnimatePresence>
                        {activeMenuId === comment.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.94, y: 4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.94, y: 4 }}
                            transition={{ duration: 0.18, ease: iosEase }}
                            className="absolute bottom-8 right-0 z-20 min-w-[112px] overflow-hidden rounded-2xl border border-black/[0.06] bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
                          >
                            {comment.user_id === user?.id ? (
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(comment.id)}
                                className="w-full cursor-pointer border-none bg-transparent px-3.5 py-2 text-left text-xs font-bold text-red-500 transition-colors duration-150 hover:bg-red-500/10"
                              >
                                {t.delete}
                              </button>
                            ) : (
                              <div className="px-3.5 py-2 text-[11px] italic text-zinc-400">
                                {t.noOptions}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        )}
      </motion.div>

      {/* BARRA FLOTANTE DE COMENTARIO CON FADE GRIS ABAJO Y 0% ARRIBA */}
      <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-30 flex flex-col justify-end bg-gradient-to-t from-[#E5E5EA] via-[#E5E5EA]/70 to-transparent px-4 pb-[calc(env(safe-area-inset-bottom,12px)+14px)] pt-8">
        <form
          onSubmit={handleAddComment}
          className="pointer-events-auto flex items-center gap-2 rounded-full border border-black/[0.06] bg-white/95 p-1.5 pl-4 shadow-[0_10px_28px_rgba(0,0,0,0.12)] backdrop-blur-xl"
        >
          <input
            type="text"
            placeholder={t.placeholder}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="flex-1 select-text border-none bg-transparent py-2 text-sm text-zinc-900 outline-none placeholder:text-[#8E8E93]"
          />
          <motion.button
            type="submit"
            whileHover={loading || !newComment.trim() ? undefined : { scale: 1.03 }}
            whileTap={loading || !newComment.trim() ? undefined : { scale: 0.94 }}
            disabled={loading || !newComment.trim()}
            className={`cursor-pointer select-none rounded-full border-none px-5 py-2.5 text-xs font-bold text-white transition-all duration-200 ${
              loading || !newComment.trim()
                ? "cursor-not-allowed bg-zinc-300"
                : "bg-gradient-to-br from-[#FF6B35] to-[#FF9A5C] shadow-[0_4px_12px_rgba(255,107,53,0.35)] hover:shadow-[0_6px_16px_rgba(255,107,53,0.45)]"
            }`}
          >
            {loading ? t.sending : t.submit}
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}