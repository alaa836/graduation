<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MedicalRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MedicalRecordController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $record = MedicalRecord::firstOrCreate(
            ['patient_id' => $request->user()->id],
            []
        );

        return response()->json(['medical_record' => $record]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'allergies' => ['nullable', 'string'],
            'chronic_conditions' => ['nullable', 'string'],
            'medications' => ['nullable', 'string'],
            'surgeries' => ['nullable', 'string'],
            'family_history' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $record = MedicalRecord::updateOrCreate(
            ['patient_id' => $request->user()->id],
            $validated
        );

        return response()->json([
            'message' => 'Medical record updated successfully',
            'medical_record' => $record,
        ]);
    }
}
