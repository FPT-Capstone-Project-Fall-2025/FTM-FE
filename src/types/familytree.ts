export interface FamilyMember {
  id: string;
  name: string;
  birthDate: string;
  gender: 'male' | 'female';
  avatar?: string;
  bio?: string;
  images?: string[];
}