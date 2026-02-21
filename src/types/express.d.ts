declare namespace Express {
  export interface Request {
    userToken?: string;
    userId?: number;
  }
}
