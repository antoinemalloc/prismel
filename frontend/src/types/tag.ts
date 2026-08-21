export interface Tag {
  id: number;
  name: string;
  color: string;
  createdAt: string;
}

export interface TagWithUsage extends Tag {
  usageCount: number;
}

export interface CreateTagInput {
  name: string;
  color: string;
}

export interface UpdateTagInput {
  name?: string;
  color?: string;
}
