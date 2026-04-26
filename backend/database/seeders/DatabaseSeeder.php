<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $adminDefaults = User::factory()->admin()->make([
            'name' => 'Main Admin',
            'email' => 'admin@lesahtak.com',
            'password' => 'password123',
        ])->toArray();

        User::query()->updateOrCreate(
            ['email' => 'admin@lesahtak.com'],
            $adminDefaults
        );

        $this->call(DoctorCatalogSeeder::class);
        $this->call(AiKnowledgeSeeder::class);
        User::factory()->patient()->count(8)->create();
    }
}
