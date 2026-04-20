<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AppointmentApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_patient_can_book_appointment(): void
    {
        $patient = User::factory()->patient()->create();
        $doctor = User::factory()->doctor()->create(['is_active' => true]);
        Sanctum::actingAs($patient);

        $date = Carbon::now()->addDay()->toDateString();

        $res = $this->postJson('/api/appointments', [
            'doctor_id' => $doctor->id,
            'appointment_date' => $date,
            'appointment_time' => '10:00',
            'notes' => 'Test visit',
        ]);

        $res->assertCreated()
            ->assertJsonPath('message', 'Appointment booked successfully');
    }

    public function test_patient_cannot_update_another_patient_appointment(): void
    {
        $a = User::factory()->patient()->create();
        $b = User::factory()->patient()->create();
        $doctor = User::factory()->doctor()->create(['is_active' => true]);

        $appointment = Appointment::create([
            'patient_id' => $a->id,
            'doctor_id' => $doctor->id,
            'appointment_date' => Carbon::now()->addDay()->toDateString(),
            'appointment_time' => '11:00:00',
            'status' => 'pending',
        ]);

        Sanctum::actingAs($b);

        $this->patchJson("/api/appointments/{$appointment->id}", [
            'status' => 'cancelled',
        ])->assertStatus(403);
    }
}
