import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true
});

export interface GenderDetectionResult {
  name: string;
  gender: 'male' | 'female' | 'unknown';
  confidence: number;
}

/**
 * Detecta o gênero de múltiplos nomes usando IA
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
    const prompt = `Analise a lista de nomes abaixo e determine o gênero de cada um. 
Retorne APENAS um JSON array com objetos no formato: {"name": "nome", "gender": "male" ou "female" ou "unknown", "confidence": 0-100}

Regras:
- "male" para nomes masculinos
- "female" para nomes femininos  
- "unknown" para nomes ambíguos, apelidos não identificáveis, ou strings sem sentido
- confidence: 0-100 (quão confiante você está)

Nomes para analisar:
${validNames.join('\n')}

Retorne APENAS o JSON array, sem explicações adicionais.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em identificação de gênero por nomes. Retorne apenas JSON válido.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 4000
    });

    const content = response.choices[0]?.message?.content || '[]';
    
    // Extrai JSON do conteúdo (remove markdown code blocks se existirem)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const jsonContent = jsonMatch ? jsonMatch[0] : content;
    
    const results: GenderDetectionResult[] = JSON.parse(jsonContent);
    
    return results;
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

