/**
 * Client-side Authentication & Session Service
 */

import { UserProfile } from '../types/user.js';
import { SubscriptionPlanId } from '../types/subscription.js';

export interface RegisterPayload {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  country?: string;
  language?: string;
  timezone?: string;
  selectedPlan?: SubscriptionPlanId;
}

export interface AuthResponse {
  message: string;
  user: UserProfile;
  token?: string;
  error?: string;
}

export class AuthService {
  private static TOKEN_KEY = 'marketmind_auth_token';

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static clearToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  /**
   * Register new account with 15-day trial
   */
  static async register(payload: RegisterPayload): Promise<AuthResponse> {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }
      if (data.token) {
        this.setToken(data.token);
      }
      return data;
    } catch (e: any) {
      throw new Error(e.message || 'Network error during registration.');
    }
  }

  /**
   * Login with email and password
   */
  static async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed.');
      }
      if (data.token) {
        this.setToken(data.token);
      }
      return data;
    } catch (e: any) {
      throw new Error(e.message || 'Network error during login.');
    }
  }

  /**
   * Google SSO Login & Registration
   */
  static async loginWithGoogle(email: string, name?: string): Promise<AuthResponse> {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Google login failed.');
      }
      if (data.token) {
        this.setToken(data.token);
      }
      return data;
    } catch (e: any) {
      throw new Error(e.message || 'Network error during Google auth.');
    }
  }

  /**
   * Request password reset token / email
   */
  static async forgotPassword(email: string): Promise<{ message: string; resetToken?: string }> {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to request password reset.');
    return data;
  }

  /**
   * Reset password with token
   */
  static async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to reset password.');
    return data;
  }

  /**
   * Verify email address
   */
  static async verifyEmail(email: string, token?: string): Promise<{ message: string }> {
    const res = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to verify email.');
    return data;
  }

  /**
   * Change user password
   */
  static async changePassword(email: string, currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update password.');
    return data;
  }

  /**
   * Update Profile
   */
  static async updateProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update profile.');
    return data.user;
  }

  /**
   * Delete Account
   */
  static async deleteAccount(email: string): Promise<void> {
    const res = await fetch('/api/auth/delete-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete account.');
    this.clearToken();
  }
}
