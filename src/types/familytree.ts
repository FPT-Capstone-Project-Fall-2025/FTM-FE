export interface FamilyMember {
  id: string;
  name: string;
  birthday?: string;
  gender: number;
  avatar?: string;
  bio?: string;
  images?: string[];
  gpMemberFiles?: string[];
  partners?: string[];
  children?: any[];
  isRoot: boolean,
  isCurrentMember: boolean,
  isPartner: boolean;
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
  filePath: string;
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

export interface FamilyMemberList {
  id: string;
  ftId: string;
  fullname: string;
  gender: number;
  birthday: string | null;
  filePath: string | null;
}