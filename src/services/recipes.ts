import { supabase } from "../lib/supabase";

export async function getRecipes() {
    const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .order("created_at", {
            ascending: false,
        });

    if (error) throw error;

    return data;
}

export async function createRecipe(recipe: any) {
    const { error } = await supabase
        .from("recipes")
        .insert(recipe);

    if (error) throw error;
}

export async function updateRecipe(id: string, recipe: any) {
    const { error } = await supabase
        .from("recipes")
        .update(recipe)
        .eq("id", id);

    if (error) throw error;
}

export async function deleteRecipe(id: string) {
    const { error } = await supabase
        .from("recipes")
        .delete()
        .eq("id", id);

    if (error) throw error;
}