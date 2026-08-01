import type { User } from "../models/user.model";

export interface UserRepository {
  findByPhone(phone: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<User>;
}
