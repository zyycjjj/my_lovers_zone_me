declare namespace Express {
  export interface Request {
    userToken?: string;
    userId?: number;
    sessionToken?: string;
    accountId?: number;
    workspaceId?: number;
  }
}
