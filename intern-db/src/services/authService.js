import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '@/lib/config';
import { findUserByEmail, createUser } from '@/repositories/userRepository';

const SALT_ROUNDS = 12;

/**
 * Register a new user.
 * @param {{ email: string, password: string, name?: string, role?: string }} data
 */
export const registerUser = async ({ email, password, name = 'New User', role = 'CUSTOMER' }) => {
  // 1. Check for duplicate email
  const existing = await findUserByEmail(email);
  if (existing) {
    const err = new Error('Email already in use');
    err.statusCode = 409;
    throw err;
  }

  // 2. Hash password
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // 3. Create user
  const user = await createUser({
    email,
    password_hash: hashedPassword,
    name,
    role
  });

  return user;
};

/**
 * Login an existing user.
 * @param {{ email: string, password: string }} data
 */
export const loginUser = async ({ email, password }) => {
  // 1. Find user
  const user = await findUserByEmail(email);
  if (!user) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  // 2. Compare password
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  // 3. Sign JWT
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  // 4. Return token + user
  const { password_hash: _pw, ...safeUser } = user;
  return { token, user: safeUser };
};
