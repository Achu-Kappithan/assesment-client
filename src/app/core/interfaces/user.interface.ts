// Core interfaces — mirrors backend User document shape
export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  age: number | null;
  address: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  name: string;
  email: string;
  phone?: string;
  age?: number;
  address?: string;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  phone?: string;
  age?: number;
  address?: string;
  isActive?: boolean;
}
