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

export interface FamilytreeCreationProps {
  name: string;
  ownerName: string;
  ownerId: string;
  description: string;
  file: File | null;
  gpModecode: number;
}

export interface Familytree {
  id: string;
  name: string;
  ownerId: string;
  owner: string;
  description: string;
  picture: string;
  isActive: string;
  gpModeCode: number;
  createAt: string;
  lastModifiedAt: string;
  createdAt: string;
  lastModifiedBy: string;
  memberCount: number;
}

export interface FamilytreeDataResponse {
  root: string;
  datalist: Array<{
    key: string;
    value: FamilyMember;
  }>;
}