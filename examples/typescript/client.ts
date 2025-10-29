/**
 * Chat402 TypeScript/JavaScript Client
 *
 * A type-safe client for the Chat402 API with full TypeScript support.
 */

export interface PromptRequest {
  model: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stream?: boolean;
  stopSequences?: string[];
  presencePenalty?: number;
  frequencyPenalty?: number;
  user?: string;
  metadata?: Record<string, any>;
}

export interface Usage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface Cost {
  amount: number;
  currency: string;
  breakdown?: {
    promptCost: number;
    completionCost: number;
  };
}

export interface PromptResponse {
  success: true;
  data: {
    text: string;
    model: string;
    finishReason: string;
    usage: Usage;
    cost: Cost;
  };
  metadata: {
    requestId: string;
    timestamp: string;
    processingTime: number;
    modelVersion?: string;
  };
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    requestId: string;
    timestamp: string;
  };
}

export interface BalanceWallet {
  network: 'base' | 'solana';
  address: string;
  balance: {
    amount: number;
    currency: string;
  };
  lastUpdated: string;
}

export interface BalanceResponse {
  success: true;
  data: {
    wallets: BalanceWallet[];
    totalBalance: {
      amount: number;
      currency: string;
    };
  };
  metadata: {
    requestId: string;
    timestamp: string;
  };
}

export class Chat402Error extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, any>,
    public requestId?: string
  ) {
    super(message);
    this.name = 'Chat402Error';
  }
}

export interface ClientOptions {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
}

export class Chat402Client {
  private apiKey: string;
  private baseURL: string;
  private timeout: number;

  constructor(options: ClientOptions) {
    this.apiKey = options.apiKey;
    this.baseURL = options.baseURL || 'https://api.chat402.xyz/api/v1';
    this.timeout = options.timeout || 30000;
  }

  /**
   * Send a prompt to the Chat402 API
   */
  async prompt(request: PromptRequest): Promise<PromptResponse> {
    const response = await this.makeRequest<PromptResponse>('/prompt', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    return response;
  }

  /**
   * Get wallet balance
   */
  async getBalance(): Promise<BalanceResponse> {
    const response = await this.makeRequest<BalanceResponse>('/balance', {
      method: 'GET',
    });

    return response;
  }

  /**
   * Stream a prompt response (Server-Sent Events)
   */
  async *streamPrompt(request: PromptRequest): AsyncGenerator<string, void, unknown> {
    const response = await fetch(`${this.baseURL}/prompt`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...request, stream: true }),
    });

    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      throw new Chat402Error(
        error.error.code,
        error.error.message,
        error.error.details,
        error.error.requestId
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.chunk) {
                yield parsed.chunk;
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Make an API request
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...options.headers,
        },
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        const error = data as ErrorResponse;
        throw new Chat402Error(
          error.error.code,
          error.error.message,
          error.error.details,
          error.error.requestId
        );
      }

      return data as T;
    } catch (error) {
      if (error instanceof Chat402Error) {
        throw error;
      }
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Chat402Error('TIMEOUT_ERROR', 'Request timed out');
        }
        throw new Chat402Error('NETWORK_ERROR', error.message);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

// Example usage
async function main() {
  const client = new Chat402Client({
    apiKey: 'sk_live_your_api_key_here',
  });

  try {
    // Check balance
    const balance = await client.getBalance();
    console.log(`Total Balance: $${balance.data.totalBalance.amount.toFixed(2)} ${balance.data.totalBalance.currency}`);

    // Send a prompt
    const response = await client.prompt({
      model: 'gpt-3.5-turbo',
      prompt: 'Explain quantum computing in simple terms',
      temperature: 0.7,
      maxTokens: 500,
    });

    console.log(`\nModel: ${response.data.model}`);
    console.log(`Response: ${response.data.text}`);
    console.log(`\nUsage:`);
    console.log(`  Prompt tokens: ${response.data.usage.promptTokens}`);
    console.log(`  Completion tokens: ${response.data.usage.completionTokens}`);
    console.log(`  Total tokens: ${response.data.usage.totalTokens}`);
    console.log(`\nCost: $${response.data.cost.amount.toFixed(6)} ${response.data.cost.currency}`);

    // Stream example
    console.log('\n\nStreaming response:');
    for await (const chunk of client.streamPrompt({
      model: 'gpt-3.5-turbo',
      prompt: 'Count from 1 to 5',
      temperature: 0.7,
    })) {
      process.stdout.write(chunk);
    }
    console.log('\n');

  } catch (error) {
    if (error instanceof Chat402Error) {
      console.error(`Error [${error.code}]: ${error.message}`);
      if (error.details) {
        console.error('Details:', JSON.stringify(error.details, null, 2));
      }
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export default Chat402Client;
