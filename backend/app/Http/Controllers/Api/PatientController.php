<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class PatientController extends Controller
{
    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', 'unique:users,email,'.$request->user()->id],
            'phone' => ['nullable', 'string', 'max:30'],
            'gender' => ['nullable', 'in:male,female'],
            'date_of_birth' => ['nullable', 'date'],
            'height' => ['nullable', 'integer', 'min:80', 'max:230'],
            'blood_type' => ['nullable', 'string', 'max:8'],
            'weight' => ['nullable', 'string', 'max:12'],
            'governorate' => ['nullable', 'string', 'max:120'],
            'area' => ['nullable', 'string', 'max:120'],
            'address' => ['nullable', 'string', 'max:2000'],
            'avatar' => ['nullable', 'image', 'max:2048'],
        ]);

        if ($request->hasFile('avatar')) {
            $validated['avatar'] = $request->file('avatar')->store('avatars', 'public');
        }

        $request->user()->update($validated);

        return response()->json([
            'message' => 'Patient profile updated successfully',
            'user' => $request->user()->fresh(),
        ]);
    }

    /**
     * Invoices for the current patient (same shape the dashboard expects, aligned with admin mapping).
     */
    public function listInvoices(Request $request): JsonResponse
    {
        $patientId = $request->user()->id;
        $appointments = Appointment::query()
            ->where('patient_id', $patientId)
            ->with(['doctor:id,name', 'patient:id,name'])
            ->latest()
            ->get();

        $invoices = $appointments->map(function (Appointment $a) {
            $statusPaid = $a->status === 'completed';
            $amount = $statusPaid ? 450 : 300;

            $num = 'INV-'.str_pad((string) $a->id, 4, '0', STR_PAD_LEFT);

            $dateVal = $a->appointment_date;
            if ($dateVal instanceof \DateTimeInterface) {
                $dateStr = $dateVal->format('Y-m-d');
            } else {
                $dateStr = is_string($dateVal) ? $dateVal : (string) ($a->created_at?->toDateString() ?? '');
            }

            return [
                'id' => $num,
                'invoiceNum' => '#'.$num,
                'patient' => $a->patient?->name ?? '-',
                'doctor' => $a->doctor?->name ?? '-',
                'service' => $a->notes ?: 'General consultation',
                'amount' => $amount,
                'date' => $dateStr,
                'paymentMethod' => '---',
                'status' => $statusPaid ? 'تم الدفع' : 'لم يتم الدفع',
            ];
        })->values();

        $pending = $invoices->where('status', 'لم يتم الدفع');
        $paid = $invoices->where('status', 'تم الدفع');

        return response()->json([
            'invoices' => $invoices,
            'summary' => [
                'total' => $invoices->count(),
                'pending' => $pending->sum('amount'),
                'paid' => $paid->sum('amount'),
            ],
        ]);
    }

    public function payInvoice(Request $request, string $invoiceRef): JsonResponse
    {
        $appId = $this->parseInvoiceToAppointmentId($invoiceRef);
        if ($appId < 1) {
            throw ValidationException::withMessages(['invoice' => ['Invalid invoice reference.']]);
        }

        $apt = Appointment::query()
            ->where('patient_id', $request->user()->id)
            ->where('id', $appId)
            ->first();

        if (!$apt) {
            return response()->json(['message' => 'Invoice not found.'], 404);
        }

        if ($apt->status === 'completed') {
            return response()->json(['message' => 'Already paid.'], 200);
        }

        $apt->update(['status' => 'completed']);

        return response()->json([
            'message' => 'Payment successful',
        ]);
    }

    private function parseInvoiceToAppointmentId(string $ref): int
    {
        $r = strtoupper($ref);
        if (preg_match('/INV-0*([0-9]+)/i', $r, $m)) {
            return (int) $m[1];
        }
        if (is_numeric($ref)) {
            return (int) $ref;
        }

        return 0;
    }
}
