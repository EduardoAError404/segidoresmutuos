import { UserData } from './csvProcessor';
import { detectGenderBatch, GenderDetectionResult } from './genderDetector';

export interface UserDataWithGender extends UserData {
  gender?: 'male' | 'female' | 'unknown';
  confidence?: number;
}

/**
 * Filtra usuários mantendo apenas homens com nomes válidos
 * @param users Array de usuários para filtrar
 * @returns Array de usuários masculinos com nomes válidos
 */
export const filterMaleUsers = async (users: UserData[]): Promise<UserDataWithGender[]> => {
  // Filtra apenas usuários que têm nome (não vazios)
  const usersWithNames = users.filter(u => u.fullName && u.fullName.trim().length > 0);
  
  if (usersWithNames.length === 0) {
    return [];
  }

  // Extrai apenas os nomes para análise
  const names = usersWithNames.map(u => u.fullName);
  
  // Detecta gênero em lote
  const genderResults: GenderDetectionResult[] = await detectGenderBatch(names);
  
  // Cria um mapa de nome -> resultado de gênero
  const genderMap = new Map<string, GenderDetectionResult>();
  genderResults.forEach(result => {
    genderMap.set(result.name, result);
  });
  
  // Filtra apenas usuários masculinos
  const maleUsers: UserDataWithGender[] = usersWithNames
    .map(user => {
      const genderResult = genderMap.get(user.fullName);
      return {
        ...user,
        gender: genderResult?.gender || 'unknown',
        confidence: genderResult?.confidence || 0
      };
    })
    .filter(user => user.gender === 'male');
  
  return maleUsers;
};

/**
 * Gera lista formatada apenas com usuários masculinos
 * @param users Array de usuários para processar
 * @returns String formatada com username:Nome (apenas homens)
 */
export const generateMaleUserFormat = async (users: UserData[]): Promise<string> => {
  const maleUsers = await filterMaleUsers(users);
  return maleUsers.map(u => `${u.username}:${u.fullName}`).join('\n');
};

/**
 * Gera estatísticas sobre a filtragem de gênero
 * @param users Array de usuários para analisar
 * @returns Objeto com estatísticas
 */
export const getGenderStats = async (users: UserData[]): Promise<{
  total: number;
  withNames: number;
  male: number;
  female: number;
  unknown: number;
}> => {
  const usersWithNames = users.filter(u => u.fullName && u.fullName.trim().length > 0);
  const names = usersWithNames.map(u => u.fullName);
  const genderResults = await detectGenderBatch(names);
  
  const male = genderResults.filter(r => r.gender === 'male').length;
  const female = genderResults.filter(r => r.gender === 'female').length;
  const unknown = genderResults.filter(r => r.gender === 'unknown').length;
  
  return {
    total: users.length,
    withNames: usersWithNames.length,
    male,
    female,
    unknown
  };
};

