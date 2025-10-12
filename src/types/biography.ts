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
