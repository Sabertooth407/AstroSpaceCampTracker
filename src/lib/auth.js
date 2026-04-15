import { supabase } from './supabase'

export async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) throw error;

    const userId = data.user.id;

    const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    return userData;
}