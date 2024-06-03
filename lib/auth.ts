import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const hashPassword = async (password: any) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: any, hashedPassword: string) => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateToken = (user: { id: any; email?: string; username?: string; password?: string; roleId: any; createdAt?: Date; updatedAt?: Date; }) => {
  const token = jwt.sign({ userId: user.id, role: user.roleId }, JWT_SECRET, {
    expiresIn: '1h',
  });
  return token;
};

export const verifyToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
};

export const authenticateUser = async (email: any, password: any) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error('User not found');
  }

  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new Error('Invalid password');
  }

  const token = generateToken(user);
  return { token, user };
};