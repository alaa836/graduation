<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AppointmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $appointments = Appointment::with(['doctor:id,name,email', 'patient:id,name,email'])
            ->when($user->role === 'patient', fn ($q) => $q->where('patient_id', $user->id))
            ->when($user->role === 'doctor', fn ($q) => $q->where('doctor_id', $user->id))
            ->latest()
            ->get();

        return response()->json(['appointments' => $appointments]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'doctor_id' => ['required', 'integer', 'exists:users,id'],
            'appointment_date' => ['required', 'date'],
            'appointment_time' => ['required', 'date_format:H:i'],
            'notes' => ['nullable', 'string'],
        ]);

        $doctor = User::find($validated['doctor_id']);
        if (!$doctor || $doctor->role !== 'doctor') {
            return response()->json(['message' => 'Invalid doctor selected.'], 422);
        }

        $appointment = Appointment::create([
            'patient_id' => $user->id,
            'doctor_id' => $validated['doctor_id'],
            'appointment_date' => $validated['appointment_date'],
            'appointment_time' => $validated['appointment_time'],
            'notes' => $validated['notes'] ?? null,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Appointment booked successfully',
            'appointment' => $appointment->load(['doctor:id,name,email', 'patient:id,name,email']),
        ], 201);
    }

    public function update(Request $request, Appointment $appointment): JsonResponse
    {
        $user = $request->user();
        if ($user->role === 'patient' && $appointment->patient_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized appointment access.'], 403);
        }

        if ($user->role === 'doctor' && $appointment->doctor_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized appointment access.'], 403);
        }

        $validated = $request->validate([
            'appointment_date' => ['sometimes', 'date'],
            'appointment_time' => ['sometimes', 'date_format:H:i'],
            'status' => ['sometimes', Rule::in(['pending', 'confirmed', 'completed', 'cancelled'])],
            'notes' => ['nullable', 'string'],
        ]);

        $appointment->update($validated);

        return response()->json([
            'message' => 'Appointment updated successfully',
            'appointment' => $appointment->fresh()->load(['doctor:id,name,email', 'patient:id,name,email']),
        ]);
    }

    public function destroy(Request $request, Appointment $appointment): JsonResponse
    {
        $user = $request->user();
        if ($user->role === 'patient' && $appointment->patient_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized appointment access.'], 403);
        }

        if ($user->role === 'doctor' && $appointment->doctor_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized appointment access.'], 403);
        }

        $appointment->delete();

        return response()->json(['message' => 'Appointment cancelled successfully']);
    }
}
