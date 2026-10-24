import { AdminInventoryPage, AdminInventoryQuery } from './AdminInventoryPage.js';

export interface IAdminInventoryRepository { list(query: AdminInventoryQuery): Promise<AdminInventoryPage>; }
