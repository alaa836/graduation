<?php

namespace App\Services\Ai;

use App\Models\AiKnowledgeEntry;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class AiResponder
{
    /**
     * @param  array<int, array{sender:string, content:string}>  $history
     */
    public function respond(array $history, string $roleContext = 'general'): string
    {
        $driver = (string) config('services.ai.driver', 'database');

        if ($driver === 'openai') {
            return $this->openAiResponse($history, $roleContext);
        }

        if ($driver === 'database') {
            return $this->databaseResponse($history, $roleContext);
        }

        return $this->fakeResponse($history, $roleContext);
    }

    /**
     * @param  array<int, array{sender:string, content:string}>  $history
     */
    private function openAiResponse(array $history, string $roleContext): string
    {
        $apiKey = (string) config('services.ai.api_key');
        if ($apiKey === '') {
            throw new RuntimeException('AI driver is openai but AI_API_KEY is missing.');
        }

        $messages = [
            [
                'role' => 'system',
                'content' => (string) config('services.ai.system_prompt'),
            ],
            [
                'role' => 'system',
                'content' => 'User role context: '.$roleContext,
            ],
        ];

        foreach ($history as $item) {
            $messages[] = [
                'role' => $item['sender'] === 'assistant' ? 'assistant' : 'user',
                'content' => $item['content'],
            ];
        }

        $response = Http::timeout((int) config('services.ai.timeout', 20))
            ->withToken($apiKey)
            ->acceptJson()
            ->post((string) config('services.ai.endpoint'), [
                'model' => (string) config('services.ai.model', 'gpt-4o-mini'),
                'messages' => $messages,
                'temperature' => 0.4,
            ]);

        if (! $response->successful()) {
            throw new RuntimeException('AI provider request failed.');
        }

        $text = (string) Arr::get($response->json(), 'choices.0.message.content', '');

        return trim($text) !== '' ? trim($text) : 'I could not generate a response now.';
    }

    /**
     * @param  array<int, array{sender:string, content:string}>  $history
     */
    private function fakeResponse(array $history, string $roleContext): string
    {
        $last = trim((string) Arr::get(end($history), 'content', ''));
        $prefix = match ($roleContext) {
            'doctor' => 'Medical assistant (doctor mode): ',
            'patient' => 'Medical assistant (patient mode): ',
            default => 'Medical assistant: ',
        };

        if ($last === '') {
            return $prefix.'How can I help you today?';
        }

        return $prefix.'I understood your message: "'.$last.'". This is a development response. Configure AI_DRIVER=openai for live model output.';
    }

    /**
     * Match last user message against `ai_knowledge_entries` (keyword / substring triggers). No external API.
     *
     * @param  array<int, array{sender:string, content:string}>  $history
     */
    private function databaseResponse(array $history, string $roleContext): string
    {
        $last = trim((string) Arr::get(end($history), 'content', ''));
        if ($last === '') {
            return (string) config('services.ai.database_empty_user', 'How can I help you?');
        }

        $context = $roleContext !== '' ? $roleContext : 'general';

        $entries = AiKnowledgeEntry::query()
            ->active()
            ->forRoleContext($context)
            ->orderByDesc('priority')
            ->get();

        $bestScore = 0;
        $bestResponse = null;

        foreach ($entries as $entry) {
            $score = 0;
            $parts = preg_split('/[,\n،]+/u', (string) $entry->triggers) ?: [];
            foreach ($parts as $part) {
                $trigger = trim($part);
                if ($trigger === '') {
                    continue;
                }
                if (mb_stripos($last, $trigger) !== false) {
                    $score += mb_strlen($trigger);
                }
            }
            if ($score > $bestScore) {
                $bestScore = $score;
                $bestResponse = (string) $entry->response;
            }
        }

        if ($bestResponse !== null && $bestScore > 0) {
            return $bestResponse;
        }

        return (string) config('services.ai.database_fallback');
    }
}
