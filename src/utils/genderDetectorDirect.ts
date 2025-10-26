// Detector de gênero que aceita API key diretamente (sem rebuild)

export interface GenderDetectionResult {
  name: string;
  gender: 'male' | 'female' | 'unknown';
  confidence: number;
}

/**
 * Detecta o gênero de múltiplos nomes usando OpenAI
 * @param names Array de nomes para detectar o gênero
 * @param apiKey Chave da API OpenAI
 * @returns Array com resultados de detecção de gênero
 */
export const detectGenderBatch = async (names: string[], apiKey: string): Promise<GenderDetectionResult[]> => {
  if (!apiKey || apiKey.trim().length === 0) {
    throw new Error('API Key da OpenAI é obrigatória');
  }

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

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
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
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Erro na API OpenAI:', errorData);
      
      if (response.status === 401) {
        throw new Error('API Key inválida. Verifique se a chave está correta.');
      }
      
      throw new Error(`Erro na API OpenAI: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '[]';
    
    // Extrai JSON do conteúdo (remove markdown code blocks se existirem)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    const jsonContent = jsonMatch ? jsonMatch[0] : content;
    
    const results: GenderDetectionResult[] = JSON.parse(jsonContent);
    
    return results;
  } catch (error) {
    console.error('Erro ao detectar gênero:', error);
    throw error;
  }
};

/**
 * Detecta o gênero de um único nome
 * @param name Nome para detectar o gênero
 * @param apiKey Chave da API OpenAI
 * @returns Resultado de detecção de gênero
 */
export const detectGender = async (name: string, apiKey: string): Promise<GenderDetectionResult> => {
  const results = await detectGenderBatch([name], apiKey);
  return results[0] || { name, gender: 'unknown', confidence: 0 };
};

