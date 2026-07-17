import { z } from 'zod';

export const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const UserSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  role: z.enum(['player', 'organizer', 'admin']),
  avatar_path: z.string().nullable(),
  created_at: z.string(),
});

export const ProfileUpdateSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/)
    .optional(),
});

export const OnboardingStatusSchema = z.object({
  hasAdmin: z.boolean(),
});

export const UserResponseSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  role: z.enum(['player', 'organizer', 'admin']),
  avatar_path: z.string().nullable(),
  banned_at: z.string().nullable(),
  suspended_at: z.string().nullable(),
  created_at: z.string(),
});

export const AccountActionResponseSchema = z.object({
  success: z.boolean(),
});

export type SignupInput = z.input<typeof SignupSchema>;
export type LoginInput = z.input<typeof LoginSchema>;
export type User = z.infer<typeof UserSchema>;
export type ProfileUpdate = z.input<typeof ProfileUpdateSchema>;
export type OnboardingStatus = z.infer<typeof OnboardingStatusSchema>;
export type UserResponse = z.infer<typeof UserResponseSchema>;
export type AccountActionResponse = z.infer<typeof AccountActionResponseSchema>;
