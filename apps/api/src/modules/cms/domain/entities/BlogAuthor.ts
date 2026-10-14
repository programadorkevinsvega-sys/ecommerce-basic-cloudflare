export interface BlogAuthor { id: string; name: string; bio: string; imageMediaId?: string; active: boolean; createdAt: string; updatedAt: string; }

export interface BlogCategory { id: string; name: string; slug: string; description: string; active: boolean; createdAt: string; updatedAt: string; }

export type BlogTaxonomyInput = { id?: string; name: string; description?: string; imageMediaId?: string; active?: boolean };
