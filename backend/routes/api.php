<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\MedicalRecordController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\DoctorController;
use App\Http\Controllers\Api\AdminController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:15,1');
    Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::put('/change-password', [AuthController::class, 'changePassword']);
    });
});

Route::middleware(['auth:sanctum', 'role:patient'])->group(function () {
    Route::get('/doctors/search', [DoctorController::class, 'search']);
    Route::get('/doctors/{doctor}/slots', [DoctorController::class, 'slots']);

    Route::get('/appointments', [AppointmentController::class, 'index']);
    Route::post('/appointments', [AppointmentController::class, 'store']);
    Route::patch('/appointments/{appointment}', [AppointmentController::class, 'update']);
    Route::delete('/appointments/{appointment}', [AppointmentController::class, 'destroy']);

    Route::get('/medical-records', [MedicalRecordController::class, 'show']);
    Route::put('/medical-records', [MedicalRecordController::class, 'update']);

    Route::post('/patient/profile', [PatientController::class, 'updateProfile']);

    Route::get('/invoices', [PatientController::class, 'listInvoices']);
    Route::post('/invoices/{invoiceRef}/pay', [PatientController::class, 'payInvoice'])->where('invoiceRef', '[A-Za-z0-9#\\-._]+');
});

// AI chat — مخطط لاحقاً (الواجهة تستخدم ردود mock محلياً؛ أضف AiController عند التفعيل)
// Route::middleware('throttle:20,1')->post('/ai/chat', [AiController::class, 'chat']);

Route::middleware(['auth:sanctum', 'role:doctor'])->group(function () {
    Route::post('/doctor/profile', [DoctorController::class, 'updateProfile']);
    Route::get('/doctor/schedule', [DoctorController::class, 'allSchedules']);
    Route::put('/doctor/schedule', [DoctorController::class, 'editSchedule']);
    Route::get('/doctor/patients', [DoctorController::class, 'patients']);
    Route::get('/doctor/patients/{patient}', [DoctorController::class, 'patientById']);
    Route::put('/doctor/patients/{patient}/care-status', [DoctorController::class, 'updatePatientCareStatus']);
    Route::get('/doctor/reports', [DoctorController::class, 'reports']);
    Route::post('/doctor/reports', [DoctorController::class, 'storeReport']);
    Route::put('/doctor/reports/{report}', [DoctorController::class, 'updateReport']);
    Route::get('/doctor/prescriptions', [DoctorController::class, 'prescriptions']);
    Route::post('/doctor/prescriptions', [DoctorController::class, 'storePrescription']);
    Route::put('/doctor/prescriptions/{prescription}', [DoctorController::class, 'updatePrescription']);
    Route::delete('/doctor/prescriptions/{prescription}', [DoctorController::class, 'deletePrescription']);
});

Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
    Route::get('/doctors', [AdminController::class, 'allDoctors']);
    Route::get('/doctors/{doctor}', [AdminController::class, 'doctorById']);
    Route::delete('/doctors/{doctor}', [AdminController::class, 'deleteDoctor']);
    Route::patch('/doctors/{doctor}/toggle-status', [AdminController::class, 'changeDoctorStatus']);
    Route::post('/doctors', [AdminController::class, 'addDoctor']);
    Route::put('/doctors/{doctor}', [AdminController::class, 'editDoctor']);
    Route::post('/doctors/{doctor}', [AdminController::class, 'editDoctorWithAvatar']);

    Route::get('/admins', [AdminController::class, 'allAdmins']);
    Route::post('/admins', [AdminController::class, 'addAdmin']);
    Route::delete('/admins/{admin}', [AdminController::class, 'deleteAdmin']);

    Route::get('/patients', [AdminController::class, 'allPatients']);
    Route::get('/patients/{patient}', [AdminController::class, 'patientById']);
    Route::post('/patients', [AdminController::class, 'addPatient']);
    Route::put('/patients/{patient}', [AdminController::class, 'editPatient']);
    Route::delete('/patients/{patient}', [AdminController::class, 'deletePatient']);

    Route::get('/appointments', [AdminController::class, 'allAppointments']);
    Route::get('/appointments/{appointment}', [AdminController::class, 'appointmentById']);
    Route::patch('/appointments/{appointment}', [AdminController::class, 'editAppointment']);
    Route::delete('/appointments/{appointment}', [AdminController::class, 'deleteAppointment']);

    Route::get('/stats', [AdminController::class, 'stats']);
    Route::get('/invoices', [AdminController::class, 'invoicesReport']);
    Route::get('/settings', [AdminController::class, 'getSettings']);
    Route::put('/settings', [AdminController::class, 'updateSettings']);
});
