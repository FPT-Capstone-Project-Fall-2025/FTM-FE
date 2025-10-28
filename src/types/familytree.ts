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

export interface FamilytreeUpdateProps {
  Name: string;
  OwnerId: string;
  Description: string;
  File?: File;
  GPModeCode: number;
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

export enum CategoryCode {
  FirstNode = 504,
  Parent = 5001,
  Sibling = 5003,
  Spouse = 5002,
  Child = 5004,
}

export interface AddingNodeProps {
  fullname: string;
  gender: 0 | 1;
  isDeath: boolean;
  categoryCode: CategoryCode | undefined;
  ftId: string;
  birthday?: string;
  birthplace: string;
  deathDescription?: string | undefined;
  deathDate?: string | undefined;
  burialAddress?: string | undefined;
  burialWardId?: number | undefined;
  burialProvinceId?: number | undefined;
  identificationType: string | undefined;
  identificationNumber?: number | undefined;
  ethnicId?: number | undefined;
  religionId?: number | undefined;
  address?: string | undefined;
  wardId?: number | undefined;
  provinceId?: number | undefined;
  email?: string | undefined;
  phoneNumber?: string | undefined;
  content?: string | undefined;
  storyDescription?: string | undefined;
  rootId?: string;
  fromFTMemberId?: string | undefined;
  fromFTMemberPartnerId?: string | undefined;
  ftMemberFiles?: FileProps[]
}

export interface FamilyNode {
  id?: string;
  ftMemberId?: string;
  userId: string;
  ftId: string;
  ftRole: string;
  fullname: string;
  gender: 0 | 1;
  isDeath: boolean;
  birthday: string;
  deathDescription: string;
  deathDate: string;
  burialAddress: string;
  burialWardId: number;
  burialProvinceId: number;
  identificationType: string;
  identificationNumber: number;
  ethnicId: number;
  religionId: number;
  address: string;
  wardId: number;
  provinceId: number;
  email: string;
  phoneNumber: string;
  content: string;
  storyDescription: string;
  privacyData: null;
  picture: string;
  ftMemberFiles: FileProps[]
}

export interface UpdateFamilyNode {
  id?: string;
  userId?: string;
  ftId?: string;
  ftRole?: string;
  fullname?: string;
  gender?: 0 | 1;
  isDeath?: boolean;
  birthday?: string;
  deathDescription?: string;
  deathDate?: string;
  burialAddress?: string;
  burialWardId?: number;
  burialProvinceId?: number;
  identificationType?: string;
  identificationNumber?: number;
  ethnicId?: number;
  religionId?: number;
  address?: string;
  wardId?: number;
  provinceId?: number;
  email?: string;
  phoneNumber?: string;
  content?: string;
  storyDescription?: string;
  privacyData?: null;
  picture?: string;
  ftMemberFiles?: FileProps[]
}

export interface FileProps {
  file?: File;
  title?: string;
  fileType?: string;
  description?: string;
  content?: string;
  thumbnail?: string | null;
}

