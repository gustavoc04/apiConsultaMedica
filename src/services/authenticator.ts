import jwt from 'jsonwebtoken';
import { hash, compare } from './hashManager';
import { generateId } from './idGenerator';

export const generateToken = (input: AuthenticationData): string => {
  const token = jwt.sign(
    {
      id: input.id,
      role: input.role,
    },
    process.env.JWT_KEY as string,
    {
      expiresIn: '1d',
    }
  );
  return token;
};

export const getData = (token: string): AuthenticationData => {
  const payload = jwt.verify(token, process.env.JWT_KEY as string) as any;
  const result = {
    id: payload.id,
    role: payload.role,
  };
  return result;
};

export const comparePasswords = async (
  plainText: string,
  cypherText: string
): Promise<boolean> => {
  return compare(plainText, cypherText);
};

export interface AuthenticationData {
  id: string;
  role?: string;
}
