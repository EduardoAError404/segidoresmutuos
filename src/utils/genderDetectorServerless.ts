import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export interface GenderDetectionResult {
  name: string;
  gender: 'male' | 'female' | 'unknown';
  confidence: number;
}

/**
 * Detecta o gênero de múltiplos nomes usando Edge Function do Supabase
 * @param names Array de nomes para detectar o gênero
 * @returns Array com resultados de detecção de gênero
 */
export const detectGenderBatch = async (names: string[]): Promise<GenderDetectionResult[]> => {
  if (names.length === 0) {
    return [];
  }

  // Remove nomes vazios
  const validNames = names.filter(name => name && name.trim().length > 0);
  
  if (validNames.length === 0) {
    return [];
  }

  try {
    // Chama a Edge Function do Supabase
    const { data, error } = await supabase.functions.invoke('detect-gender', {
      body: { names: validNames }
    });

    if (error) {
      console.error('Erro ao chamar Edge Function:', error);
      throw error;
    }

    if (!data.success) {
      console.error('Edge Function retornou erro:', data.error);
      throw new Error(data.error || 'Erro desconhecido na detecção de gênero');
    }

    return data.results || [];
  } catch (error) {
    console.error('Erro ao detectar gênero:', error);
    // Retorna array vazio em caso de erro
    return validNames.map(name => ({
      name,
      gender: 'unknown' as const,
      confidence: 0
    }));
  }
};

/**
 * Detecta o gênero de um único nome
 * @param name Nome para detectar o gênero
 * @returns Resultado de detecção de gênero
 */
export const detectGender = async (name: string): Promise<GenderDetectionResult> => {
  const results = await detectGenderBatch([name]);
  return results[0] || { name, gender: 'unknown', confidence: 0 };
};

