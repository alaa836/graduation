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
        User::factory()->admin()->create([
            'name' => 'Main Admin',
            'email' => 'admin@lesahtak.com',
            'password' => 'password123',
        ]);

        User::factory()->doctor()->count(3)->create();
        User::factory()->patient()->count(8)->create();
    }
}
