<?php

namespace Tests\Feature;

use App\Models\Prescription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DoctorApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_doctor_can_create_report_and_prescription(): void
    {
        $doctor = User::factory()->doctor()->create();
        Sanctum::actingAs($doctor);

        $this->postJson('/api/doctor/reports', [
            'patient_name' => 'John',
            'type' => 'lab',
            'details' => 'Blood work',
        ])->assertCreated()
            ->assertJsonPath('message', 'Report created successfully');

        $this->postJson('/api/doctor/prescriptions', [
            'patient_name' => 'John',
            'drug' => 'Aspirin',
        ])->assertCreated()
            ->assertJsonPath('message', 'Prescription created successfully');
    }

    public function test_doctor_cannot_delete_another_doctor_prescription(): void
    {
        $a = User::factory()->doctor()->create();
        $b = User::factory()->doctor()->create();

        $rx = Prescription::create([
            'doctor_id' => $a->id,
            'patient_name' => 'X',
            'drug' => 'X',
            'status' => 'active',
        ]);

        Sanctum::actingAs($b);

        $this->deleteJson("/api/doctor/prescriptions/{$rx->id}")
            ->assertStatus(403);
    }
}
