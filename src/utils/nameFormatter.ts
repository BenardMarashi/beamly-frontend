export const formatNameWithInitial = (fullName: string | undefined | null): string => {
  if (!fullName || fullName.trim() === '') {
    return 'User';
  }
  const trimmedName = fullName.trim();
  const nameParts = trimmedName.split(' ').filter(part => part.length > 0);
  
  if (nameParts.length === 0) return 'User';
  if (nameParts.length === 1) return nameParts[0];
  
  const firstNameParts = nameParts.slice(0, -1);
  const lastName = nameParts[nameParts.length - 1];
  const lastInitial = lastName.charAt(0).toUpperCase();
  
  return `${firstNameParts.join(' ')} ${lastInitial}.`;
};