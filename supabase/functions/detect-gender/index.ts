// Edge Function para detecção de gênero usando OpenAI
// Deno Deploy runtime

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Obtém a chave da API do OpenAI das variáveis de ambiente
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

interface GenderDetectionRequest {
  names: string[];
}

interface GenderDetectionResult {
  name: string;
  gender: 'male' | 'female' | 'unknown';
  confidence: number;
}

interface GenderDetectionResponse {
  success: boolean;
  results?: GenderDetectionResult[];
  error?: string;
}

/**
 * Detecta o gênero de múltiplos nomes usando OpenAI GPT-4.1-mini
 */
async function detectGenderBatch(names: string[]): Promise<GenderDetectionResult[]> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY não configurada');
  }

  if (names.length === 0) {
    return [];
  }

  // Remove nomes vazios
  const validNames = names.filter(name => name && name.trim().length > 0);
  
  if (validNames.length === 0) {
    return [];
  }

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

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
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
      const errorText = await response.text();
      console.error('Erro na API OpenAI:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
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
    // Retorna array com status unknown em caso de erro
    return validNames.map(name => ({
      name,
      gender: 'unknown' as const,
      confidence: 0
    }));
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const requestData: GenderDetectionRequest = await req.json();
    
    if (!requestData.names || !Array.isArray(requestData.names)) {
      throw new Error('Campo "names" é obrigatório e deve ser um array');
    }

    console.log(`Recebida requisição para analisar ${requestData.names.length} nomes`);
    
    // Detecta gênero em lote
    const results = await detectGenderBatch(requestData.names);
    
    console.log(`Análise concluída: ${results.length} resultados`);
    
    const response: GenderDetectionResponse = {
      success: true,
      results
    };

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Erro na Edge Function detect-gender:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    const response: GenderDetectionResponse = {
      success: false,
      error: errorMessage
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    );
  }
});

