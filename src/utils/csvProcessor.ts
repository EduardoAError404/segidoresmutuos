export interface UserData {
  username: string;
  fullName: string;
}

const cleanFirstName = (fullName: string): string => {
  // Remove emojis and special characters, keep only letters, numbers and spaces
  const cleaned = fullName.replace(/[^\p{L}\p{N}\s]/gu, '').trim();
  // Get only the first word (first name)
  const firstName = cleaned.split(/\s+/)[0] || '';
  return firstName;
};

export const parseCSV = (text: string): UserData[] => {
  const lines = text.split('\n').filter(line => line.trim());
  const users: UserData[] = [];
  
  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const columns = lines[i].split(',');
    if (columns.length >= 3) {
      // User Name is the second column (index 1), Full Name is third column (index 2)
      const username = columns[1].trim();
      const fullName = cleanFirstName(columns[2].trim());
      if (username) {
        users.push({ username, fullName });
      }
    }
  }
  
  return users;
};

export const findCommonUsers = (file1Users: UserData[], file2Users: UserData[]): UserData[] => {
  const map1 = new Map(file1Users.map(u => [u.username, u.fullName]));
  const map2 = new Map(file2Users.map(u => [u.username, u.fullName]));
  
  const common: UserData[] = [];
  map1.forEach((fullName, username) => {
    if (map2.has(username)) {
      common.push({ username, fullName });
    }
  });
  
  return common;
};

export const generateCSV = (data: string[]): string => {
  return data.join(',');
};

export const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
