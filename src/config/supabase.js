import { createClient } from '@supabase/supabase-js';

// ============================================================
// CONFIGURACIÓN DE SUPABASE
// ============================================================
const SUPABASE_URL = 'https://jrmvdcaoonxxlcawbpjh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_4ojcaW4thUOspVi_k1W5cQ_noKqSm1m';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================================
// SUBIR VIDEO A SUPABASE STORAGE
// ============================================================
export const subirVideoSupabase = async (usuario, file) => {
    try {
        if (!file) throw new Error('No se seleccionó ningún archivo');
        if (!file.type.startsWith('video/')) throw new Error('Solo se permiten videos');
        if (file.size > 50 * 1024 * 1024) throw new Error('El video es demasiado grande. Máximo 50MB');

        const timestamp = Date.now();
        const fileExt = file.name.split('.').pop();
        const fileName = `${usuario}_${timestamp}.${fileExt}`;

        const { data, error } = await supabase.storage
            .from('videos')
            .upload(fileName, file, { cacheControl: '3600', upsert: false });

        if (error) throw new Error(error.message);

        const { data: urlData } = supabase.storage.from('videos').getPublicUrl(fileName);

        return {
            success: true,
            url: urlData.publicUrl,
            fileName: fileName,
            name: file.name
        };
    } catch (error) {
        console.error('Error al subir video:', error);
        return { success: false, error: error.message };
    }
};

// ============================================================
// ELIMINAR VIDEO DE SUPABASE
// ============================================================
export const eliminarVideoSupabase = async (fileName) => {
    try {
        const { error } = await supabase.storage.from('videos').remove([fileName]);
        if (error) throw new Error(error.message);
        return { success: true };
    } catch (error) {
        console.error('Error al eliminar video:', error);
        return { success: false, error: error.message };
    }
};