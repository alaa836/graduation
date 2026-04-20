<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\DoctorPatientStatus;
use App\Models\DoctorReport;
use App\Models\Prescription;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DoctorController extends Controller
{
    public function search(Request $request): JsonResponse
    {
        $query = User::where('role', 'doctor')
            ->where('is_active', true);

        if ($search = $request->query('q')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('email', 'like', '%'.$search.'%')
                    ->orWhere('phone', 'like', '%'.$search.'%');
            });
        }

        $doctors = $query
            ->orderByDesc('id')
            ->limit(50)
            ->get(['id', 'name', 'email', 'phone', 'gender', 'date_of_birth', 'avatar']);

        return response()->json(['doctors' => $doctors]);
    }

    public function slots(User $doctor): JsonResponse
    {
        if ($doctor->role !== 'doctor' || !$doctor->is_active) {
            return response()->json(['message' => 'Doctor not found.'], 404);
        }

        $today = now()->startOfDay();

        $appointments = Appointment::where('doctor_id', $doctor->id)
            ->whereDate('appointment_date', '>=', $today->toDateString())
            ->get()
            ->groupBy('appointment_date');

        $days = [];

        for ($i = 0; $i < 7; $i++) {
            $date = $today->copy()->addDays($i);
            $dateKey = $date->toDateString();

            $takenTimes = ($appointments[$dateKey] ?? collect())
                ->pluck('appointment_time')
                ->map(fn ($time) => substr($time, 0, 5))
                ->all();

            $slots = [];
            foreach (['09:00', '10:00', '11:00', '12:00', '13:00', '17:00', '18:00', '19:00'] as $time) {
                if (!in_array($time, $takenTimes, true)) {
                    $slots[] = $time;
                }
            }

            $days[] = [
                'date' => $dateKey,
                'day_name' => $date->translatedFormat('l'),
                'slots' => $slots,
            ];
        }

        return response()->json([
            'doctor' => [
                'id' => $doctor->id,
                'name' => $doctor->name,
                'email' => $doctor->email,
                'phone' => $doctor->phone,
                'avatar' => $doctor->avatar,
            ],
            'days' => $days,
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', 'unique:users,email,'.$request->user()->id],
            'phone' => ['nullable', 'string', 'max:30'],
            'gender' => ['nullable', 'in:male,female'],
            'date_of_birth' => ['nullable', 'date'],
            'avatar' => ['nullable', 'image', 'max:2048'],
        ]);

        if ($request->hasFile('avatar')) {
            $validated['avatar'] = $request->file('avatar')->store('avatars', 'public');
        }

        $request->user()->update($validated);

        return response()->json([
            'message' => 'Doctor profile updated successfully',
            'user' => $request->user()->fresh(),
        ]);
    }

    public function allSchedules(Request $request): JsonResponse
    {
        $appointments = Appointment::where('doctor_id', $request->user()->id)
            ->with('patient:id,name,email')
            ->latest()
            ->get();

        return response()->json(['schedules' => $appointments]);
    }

    public function editSchedule(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'appointment_id' => ['required', 'integer', 'exists:appointments,id'],
            'appointment_date' => ['sometimes', 'date'],
            'appointment_time' => ['sometimes', 'date_format:H:i'],
            'status' => ['sometimes', 'in:pending,confirmed,completed,cancelled'],
            'notes' => ['nullable', 'string'],
        ]);

        $appointment = Appointment::findOrFail($validated['appointment_id']);
        if ($appointment->doctor_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized schedule access.'], 403);
        }

        unset($validated['appointment_id']);
        $appointment->update($validated);

        return response()->json([
            'message' => 'Schedule updated successfully',
            'schedule' => $appointment->fresh()->load('patient:id,name,email'),
        ]);
    }

    public function patients(Request $request): JsonResponse
    {
        $doctorId = $request->user()->id;

        $careByPatient = DoctorPatientStatus::where('doctor_id', $doctorId)
            ->get()
            ->keyBy('patient_id');

        $rows = Appointment::where('doctor_id', $doctorId)
            ->with('patient:id,name,email,phone,gender,date_of_birth')
            ->orderByDesc('appointment_date')
            ->orderByDesc('appointment_time')
            ->get()
            ->groupBy('patient_id')
            ->map(function ($items) use ($careByPatient) {
                $latest = $items->first();
                $patient = $latest?->patient;
                if (!$patient) {
                    return null;
                }

                $care = $careByPatient->get($patient->id);

                return [
                    'id' => $patient->id,
                    'name' => $patient->name,
                    'email' => $patient->email,
                    'phone' => $patient->phone,
                    'gender' => $patient->gender,
                    'date_of_birth' => $patient->date_of_birth,
                    'last_visit' => $latest->appointment_date,
                    'appointments_count' => $items->count(),
                    'care_status' => $care?->status ?? 'active',
                ];
            })
            ->filter()
            ->values();

        return response()->json(['patients' => $rows]);
    }

    public function updatePatientCareStatus(Request $request, int $patient): JsonResponse
    {
        $patientUser = User::where('id', $patient)->where('role', 'patient')->first();

        if (!$patientUser) {
            return response()->json(['message' => 'Patient not found.'], 404);
        }

        $doctorId = $request->user()->id;

        $hasAppointment = Appointment::where('doctor_id', $doctorId)
            ->where('patient_id', $patientUser->id)
            ->exists();

        if (!$hasAppointment) {
            return response()->json(['message' => 'Patient not found in your list.'], 404);
        }

        $validated = $request->validate([
            'care_status' => ['required', 'in:active,follow_up,stable,archived'],
        ]);

        DoctorPatientStatus::updateOrCreate(
            ['doctor_id' => $doctorId, 'patient_id' => $patientUser->id],
            ['status' => $validated['care_status']]
        );

        return response()->json([
            'message' => 'Patient status updated',
            'patient_id' => $patientUser->id,
            'care_status' => $validated['care_status'],
        ]);
    }

    public function patientById(Request $request, User $patient): JsonResponse
    {
        $doctorId = $request->user()->id;

        $appointments = Appointment::where('doctor_id', $doctorId)
            ->where('patient_id', $patient->id)
            ->latest()
            ->get();

        if ($appointments->isEmpty()) {
            return response()->json(['message' => 'Patient not found in your list.'], 404);
        }

        return response()->json([
            'patient' => [
                'id' => $patient->id,
                'name' => $patient->name,
                'email' => $patient->email,
                'phone' => $patient->phone,
                'gender' => $patient->gender,
                'date_of_birth' => $patient->date_of_birth,
            ],
            'appointments' => $appointments,
        ]);
    }

    public function reports(Request $request): JsonResponse
    {
        $reports = DoctorReport::where('doctor_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json(['reports' => $reports]);
    }

    public function storeReport(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_name' => ['required', 'string', 'max:255'],
            'patient_id' => ['nullable', 'integer', 'exists:users,id'],
            'type' => ['required', 'in:lab,xray,periodic,rx'],
            'report_date' => ['nullable', 'date'],
            'details' => ['nullable', 'string'],
            'status' => ['nullable', 'in:completed,underReview,pending'],
        ]);

        $report = DoctorReport::create([
            ...$validated,
            'doctor_id' => $request->user()->id,
            'status' => $validated['status'] ?? 'underReview',
        ]);

        return response()->json([
            'message' => 'Report created successfully',
            'report' => $report,
        ], 201);
    }

    public function prescriptions(Request $request): JsonResponse
    {
        $prescriptions = Prescription::where('doctor_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json(['prescriptions' => $prescriptions]);
    }

    public function storePrescription(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'patient_name' => ['required', 'string', 'max:255'],
            'patient_id' => ['nullable', 'integer', 'exists:users,id'],
            'diagnosis' => ['nullable', 'string'],
            'drug' => ['required', 'string'],
            'prescribed_at' => ['nullable', 'date'],
            'status' => ['nullable', 'in:active,ended'],
            'notes' => ['nullable', 'string'],
        ]);

        $prescription = Prescription::create([
            ...$validated,
            'doctor_id' => $request->user()->id,
            'status' => $validated['status'] ?? 'active',
        ]);

        return response()->json([
            'message' => 'Prescription created successfully',
            'prescription' => $prescription,
        ], 201);
    }

    public function deletePrescription(Request $request, int $prescription): JsonResponse
    {
        $model = Prescription::where('id', $prescription)
            ->where('doctor_id', $request->user()->id)
            ->first();

        if (!$model) {
            return response()->json(['message' => 'Prescription not found.'], 404);
        }

        $model->delete();

        return response()->json(['message' => 'Prescription deleted successfully']);
    }

    public function updatePrescription(Request $request, int $prescription): JsonResponse
    {
        $model = Prescription::where('id', $prescription)
            ->where('doctor_id', $request->user()->id)
            ->first();

        if (!$model) {
            return response()->json(['message' => 'Prescription not found.'], 404);
        }

        $validated = $request->validate([
            'status' => ['required', 'in:active,ended'],
        ]);

        $model->update($validated);

        return response()->json([
            'message' => 'Prescription updated',
            'prescription' => $model->fresh(),
        ]);
    }

    public function updateReport(Request $request, int $report): JsonResponse
    {
        $model = DoctorReport::where('id', $report)
            ->where('doctor_id', $request->user()->id)
            ->first();

        if (!$model) {
            return response()->json(['message' => 'Report not found.'], 404);
        }

        $validated = $request->validate([
            'status' => ['required', 'in:completed,underReview,pending'],
        ]);

        $model->update($validated);

        return response()->json([
            'message' => 'Report updated',
            'report' => $model->fresh(),
        ]);
    }
}
