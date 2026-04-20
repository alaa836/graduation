<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_doctors_and_patients(): void
    {
        User::factory()->doctor()->count(2)->create();
        User::factory()->patient()->count(2)->create();

        $admin = User::factory()->admin()->create();
        Sanctum::actingAs($admin);

        $this->getJson('/api/admin/doctors')
            ->assertOk()
            ->assertJsonStructure(['doctors']);

        $this->getJson('/api/admin/patients')
            ->assertOk()
            ->assertJsonStructure(['patients']);
    }

    public function test_admin_can_toggle_doctor_status(): void
    {
        $doctor = User::factory()->doctor()->create(['is_active' => true]);
        $admin = User::factory()->admin()->create();
        Sanctum::actingAs($admin);

        $res = $this->patchJson("/api/admin/doctors/{$doctor->id}/toggle-status")
            ->assertOk()
            ->assertJsonPath('doctor.is_active', false);
    }

    public function test_admin_can_see_stats_and_invoices(): void
    {
        $admin = User::factory()->admin()->create();
        Sanctum::actingAs($admin);

        $this->getJson('/api/admin/stats')
            ->assertOk()
            ->assertJsonStructure(['stats' => [
                'total_doctors', 'total_patients', 'total_appointments',
            ]]);

        $this->getJson('/api/admin/invoices')
            ->assertOk()
            ->assertJsonStructure(['invoices', 'summary']);
    }

    public function test_admin_settings_get_and_update(): void
    {
        $admin = User::factory()->admin()->create();
        Sanctum::actingAs($admin);

        $get = $this->getJson('/api/admin/settings')->assertOk();
        $get->assertJsonStructure(['settings' => [
            'siteName', 'siteEmail', 'language', 'maxAppointmentsPerDay',
        ]]);

        $payload = [
            'siteName' => 'Lesahtak',
            'siteEmail' => 'admin@lesahtak.com',
            'sitePhone' => '01012345678',
            'address' => 'Beni Suef, Egypt',
            'emailNotifications' => true,
            'smsNotifications' => false,
            'newAppointmentAlert' => true,
            'paymentAlert' => true,
            'language' => 'ar',
            'maxAppointmentsPerDay' => '20',
            'appointmentDuration' => '30',
        ];

        $this->putJson('/api/admin/settings', $payload)
            ->assertOk()
            ->assertJsonPath('message', 'Settings updated successfully');
    }
}
