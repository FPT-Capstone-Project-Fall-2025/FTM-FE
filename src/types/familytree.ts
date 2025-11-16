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
  statusCode?: number;
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
  ftMemberFiles?: Array<{
    ftMemberId: string;
    title: string;
    filePath: string;
    fileType: string;
    isActive: boolean;
  }>;
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
  isDivorced?: boolean;
  birthplace: string;
  deathDescription?: string | undefined;
  deathDate?: string | undefined;
  burialAddress?: string | undefined;
  burialWardId?: string | undefined;
  burialProvinceId?: string | undefined;
  identificationType: string | undefined;
  identificationNumber?: number | undefined;
  ethnicId?: number | undefined;
  religionId?: number | undefined;
  address?: string | undefined;
  wardId?: string | undefined;
  provinceId?: string | undefined;
  email?: string | undefined;
  phoneNumber?: string | undefined;
  content?: string | undefined;
  storyDescription?: string | undefined;
  rootId?: string;
  fromFTMemberId?: string | undefined;
  fromFTMemberPartnerId?: string | undefined;
  avatar?: File;
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
  isDivorced: boolean;
  deathDateUnknown?: boolean;
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
  picture: string | null;
  avatar?: File;
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
  isDivorced?: boolean;
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
  picture?: string | null;
  ftMemberFiles?: FileProps[];
  avatar?: File;
}

export interface FileProps {
  ftMemberId?: string;
  title?: string;
  description?: string;
  fileType?: string;
  file?: File | undefined;
  thumbnail?: string | null;
  content?: string;
  filePath?: string | undefined;
  isActive?: boolean;
  createdBy?: string;
  createdOn?: string;
  lastModifiedBy?: string;
  lastModifiedOn?: string;
}

export interface FTInvitation {
  createdOn: string;
  email: string;
  expirationDate: string;
  ftId: string;
  ftMemberId: string;
  ftMemberName: string;
  ftName: string;
  invitedName: string;
  invitedUserId: string;
  inviterName: string;
  inviterUserId: string;
  token: string;
  status: string;
}

export interface FTAuthList {
  ftId: string;
  datalist: Array<{
    key: {
      id: string;
      fullname: string;
      avatar?: string | null;
    }, value: FTAuthProp[]
  }>;
}

export interface FTAuthProp {
  featureCode: string;
  methodsList: string[];
}

export interface FTAuth {
  ftId: string;
  ftMemberId: string;
  authorizationList: FTAuthProp[]
}

