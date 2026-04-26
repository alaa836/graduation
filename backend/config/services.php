<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'payments' => [
        // fake: succeeds locally for dev/testing
        // rest: calls external provider endpoint with bearer token
        'driver' => env('PAYMENT_GATEWAY_DRIVER', 'fake'),
        'endpoint' => env('PAYMENT_GATEWAY_ENDPOINT', ''),
        'api_key' => env('PAYMENT_GATEWAY_API_KEY', ''),
        'timeout' => env('PAYMENT_GATEWAY_TIMEOUT', 15),
        // HMAC SHA256 secret used by /api/payments/webhook
        'webhook_secret' => env('PAYMENT_WEBHOOK_SECRET', ''),
    ],

    'ai' => [
        // fake: simple echo (dev)
        // database: replies from ai_knowledge_entries (no API key)
        // openai: calls OpenAI Chat Completions API
        'driver' => env('AI_DRIVER', 'database'),
        'api_key' => env('AI_API_KEY', ''),
        'model' => env('AI_MODEL', 'gpt-4o-mini'),
        'endpoint' => env('AI_ENDPOINT', 'https://api.openai.com/v1/chat/completions'),
        'timeout' => (int) env('AI_TIMEOUT', 20),
        'system_prompt' => env('AI_SYSTEM_PROMPT', 'You are a safe medical assistant. Give general guidance only and suggest seeing a doctor for emergencies.'),
        'database_fallback' => env(
            'AI_DATABASE_FALLBACK',
            'لم أجد إجابة مطابقة في قاعدة المعرفة. جرّب كلمات أخرى أو راجع المشرف لإضافة ردود جديدة.'
        ),
        'database_empty_user' => env('AI_DATABASE_EMPTY', 'كيف أقدر أساعدك؟'),
    ],

];
