export interface FamilyMember {
  id: string;
  name: string;
  birthDate?: string;
  gender: number;
  avatar?: string;
  bio?: string;
  images?: string[];
  gpMemberFiles?: string[];
  partners?: string[];
  children?: any[],
}