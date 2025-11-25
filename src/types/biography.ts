export interface BiographyEntry {
    id: string;
    title: string;
    description: string;
    eventDate: string;
    createdAt?: string;
    updateAt?: string;
}

export interface BiographyDesc {
    createdAt: string;
    description: string;
    updateAt: string;
}

export interface Education {
    id: string;
    institutionName: string;
    major: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    description: string;
    location: string;
}

export interface WorkPosition {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    description: string;
}

export interface WorkExperience {
    id: string;
    companyName: string;
    description: string;
    location: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    positions: WorkPosition[];
}
