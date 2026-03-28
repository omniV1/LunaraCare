import { IUser } from '../models/User';

// Augment Express types so Passport's req.user matches our IUser interface,
// eliminating the need for `as any` casts in every route handler.
declare global {
  namespace Express {
    interface User extends IUser {}
  }
}
