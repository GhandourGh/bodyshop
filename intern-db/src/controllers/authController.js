import {
  registerUser,
  loginUser,
  completeTotpLogin,
  requestPasswordReset,
  resetPasswordWithToken,
  totpSetup,
  totpEnable,
  totpDisable,
} from '@/services/authService';
import {
  registerSchema,
  loginSchema,
  totpCompleteSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  totpEnableSchema,
  totpDisableSchema,
} from '@/validators/authValidator';
import { successResponse, errorResponse } from '@/lib/apiResponse';
import { authenticate } from '@/middlewares/authMiddleware';

/**
 * POST /api/auth/register
 */
export const register = async (request) => {
  try {
    const body = await request.json();

    // Validate input
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return errorResponse('Validation failed', 400, result.error.flatten().fieldErrors);
    }

    // Public registration is customer-only (admin accounts via seed / ops).
    const user = await registerUser({ ...result.data, role: 'customer' });
    return successResponse(user, 'User registered successfully', 201);
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 500);
  }
};

/**
 * POST /api/auth/login
 */
export const login = async (request) => {
  try {
    const body = await request.json();

    // Validate input
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return errorResponse('Validation failed', 400, result.error.flatten().fieldErrors);
    }

    const data = await loginUser(result.data);
    const msg = data.step === 'totp_required' ? 'Enter your authenticator code' : 'Login successful';
    return successResponse(data, msg);
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 500);
  }
};

/**
 * POST /api/auth/login/complete — finish login after TOTP
 */
export const loginComplete = async (request) => {
  try {
    const body = await request.json();
    const result = totpCompleteSchema.safeParse(body);
    if (!result.success) {
      return errorResponse('Validation failed', 400, result.error.flatten().fieldErrors);
    }
    const data = await completeTotpLogin(result.data);
    return successResponse(data, 'Login successful');
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 500);
  }
};

/**
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (request) => {
  try {
    const body = await request.json();
    const result = forgotPasswordSchema.safeParse(body);
    if (!result.success) {
      return errorResponse('Validation failed', 400, result.error.flatten().fieldErrors);
    }
    const out = await requestPasswordReset(result.data.email);
    return successResponse(
      { devLink: out.devLink || null },
      'If an account exists for that email, we sent reset instructions.'
    );
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 500);
  }
};

/**
 * POST /api/auth/reset-password
 */
export const resetPassword = async (request) => {
  try {
    const body = await request.json();
    const result = resetPasswordSchema.safeParse(body);
    if (!result.success) {
      return errorResponse('Validation failed', 400, result.error.flatten().fieldErrors);
    }
    await resetPasswordWithToken(result.data);
    return successResponse({ ok: true }, 'Password updated. You can sign in.');
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 500);
  }
};

/**
 * POST /api/auth/totp/setup — returns secret + otpauth (authenticated)
 */
export const totpSetupHandler = async (request) => {
  const auth = authenticate(request);
  if (auth.error) return auth.error;
  try {
    const data = await totpSetup(auth.user.id);
    return successResponse(data, 'Scan the QR code with your authenticator app');
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 500);
  }
};

/**
 * POST /api/auth/totp/enable
 */
export const totpEnableHandler = async (request) => {
  const auth = authenticate(request);
  if (auth.error) return auth.error;
  try {
    const body = await request.json();
    const result = totpEnableSchema.safeParse(body);
    if (!result.success) {
      return errorResponse('Validation failed', 400, result.error.flatten().fieldErrors);
    }
    const data = await totpEnable(auth.user.id, result.data.secret, result.data.code);
    return successResponse(data, 'Two-factor authentication is now enabled');
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 500);
  }
};

/**
 * POST /api/auth/totp/disable
 */
export const totpDisableHandler = async (request) => {
  const auth = authenticate(request);
  if (auth.error) return auth.error;
  try {
    const body = await request.json();
    const result = totpDisableSchema.safeParse(body);
    if (!result.success) {
      return errorResponse('Validation failed', 400, result.error.flatten().fieldErrors);
    }
    await totpDisable(auth.user.id, result.data.password, result.data.code);
    return successResponse({ ok: true }, 'Two-factor authentication disabled');
  } catch (err) {
    return errorResponse(err.message, err.statusCode || 500);
  }
};
