<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\PasswordResetOtpMail;
use App\Models\PasswordResetOtp;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'role' => ['nullable', Rule::in(['patient', 'doctor', 'admin'])],
            'phone' => ['nullable', 'string', 'max:30'],
            'gender' => ['required', Rule::in(['male', 'female'])],
            'height' => ['required', 'integer', 'min:80', 'max:230'],
            'date_of_birth' => ['nullable', 'date'],
            'blood_type' => ['nullable', 'string', 'max:8'],
            'weight' => ['nullable', 'string', 'max:12'],
            'governorate' => ['nullable', 'string', 'max:120'],
            'area' => ['nullable', 'string', 'max:120'],
            'address' => ['nullable', 'string', 'max:2000'],
            'avatar' => ['nullable', 'image', 'max:2048'],
        ]);

        $avatarPath = null;
        if ($request->hasFile('avatar')) {
            $avatarPath = $request->file('avatar')->store('avatars', 'public');
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => $validated['role'] ?? 'patient',
            'phone' => $validated['phone'] ?? null,
            'gender' => $validated['gender'],
            'height' => $validated['height'],
            'date_of_birth' => $validated['date_of_birth'] ?? null,
            'blood_type' => $validated['blood_type'] ?? null,
            'weight' => $validated['weight'] ?? null,
            'governorate' => $validated['governorate'] ?? null,
            'area' => $validated['area'] ?? null,
            'address' => $validated['address'] ?? null,
            'avatar' => $avatarPath,
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'User registered successfully',
            'token' => $token,
            'user' => $user,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'role' => ['nullable', Rule::in(['patient', 'doctor', 'admin'])],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (!$user->is_active) {
            return response()->json([
                'message' => 'Your account is currently inactive.',
            ], 403);
        }

        if (!empty($validated['role']) && $user->role !== $validated['role']) {
            return response()->json([
                'message' => 'Role mismatch for this account.',
            ], 403);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Logged in successfully',
            'token' => $token,
            'user' => $user,
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = $request->user();

        if (!$user || !Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Current password is incorrect.'],
            ]);
        }

        $user->update([
            'password' => $validated['password'],
        ]);

        return response()->json([
            'message' => 'Password changed successfully',
        ]);
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'exists:users,email'],
        ]);

        $email = Str::lower($validated['email']);

        PasswordResetOtp::where('email', $email)->delete();

        $otp = (string) random_int(100000, 999999);
        $record = PasswordResetOtp::create([
            'email' => $email,
            'otp_hash' => Hash::make($otp),
            'attempts' => 0,
            'expires_at' => now()->addMinutes(10),
        ]);

        try {
            Mail::to($email)->send(new PasswordResetOtpMail($otp, 10));
        } catch (\Throwable $e) {
            Log::error('Failed to send password reset OTP email', [
                'email' => $email,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Could not send OTP email. Please check mail settings.',
            ], 500);
        }

        return response()->json([
            'message' => 'OTP sent successfully',
        ]);
    }

    public function verifyOtp(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'otp' => ['required', 'string'],
        ]);

        $email = Str::lower($validated['email']);
        /** @var PasswordResetOtp|null $record */
        $record = PasswordResetOtp::where('email', $email)->valid()->latest()->first();

        if (!$record) {
            return response()->json([
                'message' => 'OTP expired or not found.',
            ], 422);
        }

        if ($record->attempts >= 5) {
            return response()->json([
                'message' => 'Too many attempts. Please request a new OTP.',
            ], 429);
        }

        $record->increment('attempts');

        if (!Hash::check($validated['otp'], $record->otp_hash)) {
            return response()->json([
                'message' => 'Invalid OTP.',
            ], 422);
        }

        $record->update(['verified_at' => now()]);

        return response()->json([
            'message' => 'OTP verified successfully',
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'exists:users,email'],
            'otp' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $email = Str::lower($validated['email']);

        /** @var PasswordResetOtp|null $record */
        $record = PasswordResetOtp::where('email', $email)->valid()->latest()->first();
        if (!$record) {
            return response()->json([
                'message' => 'OTP expired or not found.',
            ], 422);
        }

        if ($record->attempts >= 5) {
            return response()->json([
                'message' => 'Too many attempts. Please request a new OTP.',
            ], 429);
        }

        $record->increment('attempts');

        if (!Hash::check($validated['otp'], $record->otp_hash)) {
            return response()->json([
                'message' => 'Invalid OTP.',
            ], 422);
        }

        if (!$record->verified_at) {
            $record->update(['verified_at' => now()]);
        }

        $user = User::where('email', $email)->firstOrFail();
        $user->update(['password' => $validated['password']]);
        $user->tokens()->delete();

        PasswordResetOtp::where('email', $email)->delete();

        return response()->json([
            'message' => 'Password reset successfully',
        ]);
    }
}
