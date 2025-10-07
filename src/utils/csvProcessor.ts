export const parseCSV = (text: string): string[] => {
  const lines = text.split('\n').filter(line => line.trim());
  const usernames: string[] = [];
  
  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const columns = lines[i].split(',');
    if (columns.length >= 2) {
      // User Name is the second column (index 1)
      const username = columns[1].trim();
      if (username) {
        usernames.push(username);
      }
    }
  }
  
  return usernames;
};

export const findCommonUsernames = (file1Users: string[], file2Users: string[]): string[] => {
  const set1 = new Set(file1Users);
  const set2 = new Set(file2Users);
  
  const common: string[] = [];
  set1.forEach(user => {
    if (set2.has(user)) {
      common.push(user);
    }
  });
  
  return common;
};

export const generateCSV = (usernames: string[]): string => {
  return usernames.join(',');
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
