# Chat402 API Reference

## Table of Contents
- [Base URL](#base-url)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Request/Response Format](#requestresponse-format)
- [Endpoints](#endpoints)
  - [Generate API Key](#post-apiv1keysgenerate)
  - [Submit Prompt](#post-apiv1prompt)
  - [Get Models](#get-apiv1models)
  - [Get Pricing](#get-apiv1pricing)
  - [Get Balance](#get-apiv1balance)
- [Supported Models](#supported-models)
- [Error Codes](#error-codes)
- [Webhooks](#webhooks)

## Base URL

```
Production: https://api.chat402.xyz/api/v1
```

All API requests must be made over HTTPS. Requests made over plain HTTP will fail.

## Authentication

### API Key Authentication

Chat402 uses API keys for authentication. Include your API key in the `Authorization` header:

```http
Authorization: Bearer sk_live_...
```

#### Key Prefixes

- `sk_live_`: Production keys
- `sk_test_`: Test mode keys (sandbox)

### Wallet Signature Authentication

For non-custodial requests, include a wallet signature:

```http
X-Wallet-Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
X-Wallet-Signature: 0x...
X-Wallet-Nonce: 1698765432
```

## Rate Limiting

Rate limits are enforced at two levels:

1. **IP-based**: 100 requests per minute per IP address
2. **API key-based**: 100 requests per minute per API key

### Rate Limit Headers

All responses include rate limit information:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 97
X-RateLimit-Reset: 1698765492
```

### Rate Limit Exceeded Response

```http
HTTP/1.1 429 Too Many Requests

{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later",
    "details": {
      "limit": 100,
      "windowMs": 60000,
      "retryAfter": "45 seconds"
    },
    "requestId": "req_abc123",
    "timestamp": "2025-10-28T10:30:00.000Z"
  }
}
```

## Request/Response Format

### Successful Response

```json
{
  "success": true,
  "data": {
    "text": "Response from the model",
    "model": "gpt-3.5-turbo",
    "usage": {
      "promptTokens": 10,
      "completionTokens": 50,
      "totalTokens": 60
    },
    "cost": {
      "amount": 0.00003,
      "currency": "USDC"
    }
  },
  "metadata": {
    "requestId": "req_abc123",
    "timestamp": "2025-10-28T10:30:00.000Z",
    "processingTime": 1250
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "errors": [
        "prompt is required and must be a string"
      ]
    },
    "requestId": "req_abc123",
    "timestamp": "2025-10-28T10:30:00.000Z"
  }
}
```

## Endpoints

### POST /api/v1/keys/generate

Generate a new API key with dedicated wallet addresses.

#### Request

Requires wallet signature authentication.

```http
POST /api/v1/keys/generate HTTP/1.1
Host: api.chat402.xyz
Content-Type: application/json
X-Wallet-Address: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
X-Wallet-Signature: 0x...
X-Wallet-Nonce: 1698765432

{
  "name": "Production API Key",
  "scopes": ["prompt", "balance"],
  "expiresIn": 365
}
```

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| name | string | No | Human-readable name for the key |
| scopes | array | No | Permissions: `["prompt", "balance", "keys"]` |
| expiresIn | number | No | Days until expiration (default: never) |

#### Response

```json
{
  "success": true,
  "data": {
    "apiKey": "sk_live_abc123...",
    "keyId": "key_xyz789",
    "name": "Production API Key",
    "scopes": ["prompt", "balance"],
    "wallets": {
      "ethereum": {
        "address": "0x1234...5678",
        "network": "base",
        "balance": "0.00"
      },
      "solana": {
        "address": "ABC...XYZ",
        "network": "solana",
        "balance": "0.00"
      }
    },
    "createdAt": "2025-10-28T10:30:00.000Z",
    "expiresAt": "2026-10-28T10:30:00.000Z"
  }
}
```

⚠️ **Important**: The `apiKey` field is only returned once. Store it securely.

---

### POST /api/v1/prompt

Submit a prompt to an AI model.

#### Request

```http
POST /api/v1/prompt HTTP/1.1
Host: api.chat402.xyz
Authorization: Bearer sk_live_abc123...
Content-Type: application/json

{
  "model": "gpt-3.5-turbo",
  "prompt": "Explain quantum computing in simple terms",
  "maxTokens": 500,
  "temperature": 0.7,
  "stream": false
}
```

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| model | string | **Yes** | Model identifier (see [Supported Models](#supported-models)) |
| prompt | string | **Yes** | The input prompt (max 100,000 characters) |
| maxTokens | number | No | Maximum tokens in response (default: varies by model) |
| temperature | number | No | Sampling temperature 0.0-2.0 (default: 1.0) |
| topP | number | No | Nucleus sampling parameter (default: 1.0) |
| stream | boolean | No | Enable streaming responses (default: false) |
| stopSequences | array | No | Sequences where the model will stop |
| presencePenalty | number | No | Penalty for token presence (-2.0 to 2.0) |
| frequencyPenalty | number | No | Penalty for token frequency (-2.0 to 2.0) |
| user | string | No | User identifier for tracking |
| metadata | object | No | Custom metadata (key-value pairs) |

#### Response

```json
{
  "success": true,
  "data": {
    "text": "Quantum computing is a type of computing that uses quantum mechanics...",
    "model": "gpt-3.5-turbo",
    "finishReason": "stop",
    "usage": {
      "promptTokens": 8,
      "completionTokens": 150,
      "totalTokens": 158
    },
    "cost": {
      "amount": 0.000079,
      "currency": "USDC",
      "breakdown": {
        "promptCost": 0.000004,
        "completionCost": 0.000075
      }
    }
  },
  "metadata": {
    "requestId": "req_abc123",
    "timestamp": "2025-10-28T10:30:00.000Z",
    "processingTime": 1250,
    "modelVersion": "gpt-3.5-turbo-0125"
  }
}
```

#### Streaming Response

When `stream: true`, responses are sent as Server-Sent Events (SSE):

```http
HTTP/1.1 200 OK
Content-Type: text/event-stream

data: {"chunk":"Quantum","delta":{"role":"assistant","content":"Quantum"}}

data: {"chunk":" computing","delta":{"role":"assistant","content":" computing"}}

data: {"chunk":" is","delta":{"role":"assistant","content":" is"}}

data: [DONE]
```

#### Payment Required Response (402)

If insufficient balance:

```json
{
  "success": false,
  "error": {
    "code": "PAYMENT_REQUIRED",
    "message": "Payment is required to process this request",
    "details": {
      "paymentInfo": {
        "network": "base",
        "address": "0x...",
        "amount": "0.0005",
        "currency": "USDC"
      },
      "estimatedCost": {
        "amount": 0.0005,
        "currency": "USDC"
      },
      "currentBalance": {
        "amount": 0.0001,
        "currency": "USDC"
      },
      "instructions": "Include X-PAYMENT header with valid payment proof or top up your wallet balance"
    },
    "requestId": "req_abc123",
    "timestamp": "2025-10-28T10:30:00.000Z"
  }
}
```

---

### GET /api/v1/models

List all available models.

#### Request

```http
GET /api/v1/models HTTP/1.1
Host: api.chat402.xyz
Authorization: Bearer sk_live_abc123...
```

#### Response

```json
{
  "success": true,
  "data": {
    "models": [
      {
        "id": "gpt-3.5-turbo",
        "name": "GPT-3.5 Turbo",
        "provider": "OpenAI",
        "description": "Fast, general-purpose model",
        "contextWindow": 16385,
        "maxOutputTokens": 4096,
        "pricing": {
          "promptTokens": 0.0005,
          "completionTokens": 0.0015,
          "currency": "USDC",
          "per": 1000
        },
        "features": ["chat", "completion"],
        "capabilities": {
          "vision": false,
          "functionCalling": true,
          "streaming": true,
          "jsonMode": true
        },
        "status": "active"
      },
      {
        "id": "gpt-4-turbo",
        "name": "GPT-4 Turbo",
        "provider": "OpenAI",
        "description": "Most capable OpenAI model",
        "contextWindow": 128000,
        "maxOutputTokens": 4096,
        "pricing": {
          "promptTokens": 0.01,
          "completionTokens": 0.03,
          "currency": "USDC",
          "per": 1000
        },
        "features": ["chat", "completion", "vision"],
        "capabilities": {
          "vision": true,
          "functionCalling": true,
          "streaming": true,
          "jsonMode": true
        },
        "status": "active"
      }
    ]
  },
  "metadata": {
    "requestId": "req_abc123",
    "timestamp": "2025-10-28T10:30:00.000Z",
    "totalModels": 7
  }
}
```

---

### GET /api/v1/pricing

Get current pricing for all models.

#### Request

```http
GET /api/v1/pricing HTTP/1.1
Host: api.chat402.xyz
```

No authentication required.

#### Query Parameters

| Name | Type | Description |
|------|------|-------------|
| model | string | Filter by specific model |
| provider | string | Filter by provider (openai, anthropic, google, etc.) |

#### Response

```json
{
  "success": true,
  "data": {
    "pricing": [
      {
        "model": "gpt-3.5-turbo",
        "provider": "OpenAI",
        "promptTokens": 0.0005,
        "completionTokens": 0.0015,
        "currency": "USDC",
        "per": 1000,
        "lastUpdated": "2025-10-28T00:00:00.000Z"
      },
      {
        "model": "claude-sonnet-4-5-20250929",
        "provider": "Anthropic",
        "promptTokens": 0.003,
        "completionTokens": 0.015,
        "currency": "USDC",
        "per": 1000,
        "lastUpdated": "2025-10-28T00:00:00.000Z"
      }
    ]
  },
  "metadata": {
    "requestId": "req_abc123",
    "timestamp": "2025-10-28T10:30:00.000Z"
  }
}
```

---

### GET /api/v1/balance

Get wallet balance for an API key.

#### Request

```http
GET /api/v1/balance HTTP/1.1
Host: api.chat402.xyz
Authorization: Bearer sk_live_abc123...
```

#### Response

```json
{
  "success": true,
  "data": {
    "wallets": [
      {
        "network": "base",
        "address": "0x1234...5678",
        "balance": {
          "amount": 10.50,
          "currency": "USDC"
        },
        "lastUpdated": "2025-10-28T10:30:00.000Z"
      },
      {
        "network": "solana",
        "address": "ABC...XYZ",
        "balance": {
          "amount": 5.25,
          "currency": "USDC"
        },
        "lastUpdated": "2025-10-28T10:30:00.000Z"
      }
    ],
    "totalBalance": {
      "amount": 15.75,
      "currency": "USDC"
    }
  },
  "metadata": {
    "requestId": "req_abc123",
    "timestamp": "2025-10-28T10:30:00.000Z"
  }
}
```

---

## Supported Models

### OpenAI Models

| Model ID | Name | Context Window | Pricing (per 1K tokens) |
|----------|------|----------------|-------------------------|
| `gpt-3.5-turbo` | GPT-3.5 Turbo | 16,385 | $0.0005 / $0.0015 |
| `gpt-4` | GPT-4 | 8,192 | $0.03 / $0.06 |
| `gpt-4-turbo` | GPT-4 Turbo | 128,000 | $0.01 / $0.03 |
| `gpt-4o` | GPT-4 Omni | 128,000 | $0.005 / $0.015 |

### Anthropic Models

| Model ID | Name | Context Window | Pricing (per 1K tokens) |
|----------|------|----------------|-------------------------|
| `claude-sonnet-4-5-20250929` | Claude 4.5 Sonnet | 200,000 | $0.003 / $0.015 |
| `claude-opus-3-5` | Claude 3.5 Opus | 200,000 | $0.015 / $0.075 |

### Google Models

| Model ID | Name | Context Window | Pricing (per 1K tokens) |
|----------|------|----------------|-------------------------|
| `gemini-2.5-flash` | Gemini 2.5 Flash | 1,000,000 | $0.0001 / $0.0004 |
| `gemini-2.0-pro` | Gemini 2.0 Pro | 2,000,000 | $0.001 / $0.004 |

### xAI Models

| Model ID | Name | Context Window | Pricing (per 1K tokens) |
|----------|------|----------------|-------------------------|
| `grok-1` | Grok | 128,000 | $0.005 / $0.010 |

### DeepSeek Models

| Model ID | Name | Context Window | Pricing (per 1K tokens) |
|----------|------|----------------|-------------------------|
| `deepseek-chat` | DeepSeek Chat | 64,000 | $0.0001 / $0.0002 |
| `deepseek-coder` | DeepSeek Coder | 64,000 | $0.0001 / $0.0002 |

*Pricing format: Prompt / Completion*

---

## Error Codes

### Standard Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `AUTHENTICATION_ERROR` | 401 | Invalid or missing authentication |
| `PAYMENT_REQUIRED` | 402 | Insufficient balance or payment needed |
| `AUTHORIZATION_ERROR` | 403 | API key lacks required permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Internal server error |
| `MODEL_ERROR` | 502 | Upstream model provider error |
| `TIMEOUT_ERROR` | 504 | Request timeout |

### Model-Specific Errors

| Code | Description |
|------|-------------|
| `MODEL_UNAVAILABLE` | Requested model is temporarily unavailable |
| `MODEL_OVERLOADED` | Model provider is experiencing high load |
| `CONTEXT_LENGTH_EXCEEDED` | Prompt exceeds model's context window |
| `CONTENT_FILTERED` | Content filtered by safety systems |
| `TOKEN_LIMIT_EXCEEDED` | Response exceeded maxTokens parameter |

### Payment Errors

| Code | Description |
|------|-------------|
| `INSUFFICIENT_BALANCE` | Wallet balance too low for request |
| `INVALID_PAYMENT` | Payment verification failed |
| `PAYMENT_EXPIRED` | Payment window expired |
| `NETWORK_MISMATCH` | Payment network doesn't match expected |

---

## Webhooks

Subscribe to real-time events via webhooks.

### Webhook Events

- `payment.received` - Payment received in wallet
- `balance.low` - Balance below threshold ($1 default)
- `key.expiring` - API key expiring in 7 days
- `request.completed` - Async request completed
- `request.failed` - Request failed after retries

### Webhook Payload

```json
{
  "event": "payment.received",
  "timestamp": "2025-10-28T10:30:00.000Z",
  "data": {
    "network": "base",
    "txHash": "0x...",
    "amount": "10.00",
    "currency": "USDC",
    "from": "0x...",
    "to": "0x...",
    "confirmations": 12
  },
  "metadata": {
    "eventId": "evt_abc123",
    "apiKeyId": "key_xyz789"
  }
}
```

### Webhook Signature Verification

All webhooks include a signature header:

```http
X-Webhook-Signature: t=1698765432,v1=abc123...
```

Verify using HMAC-SHA256:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const [t, v1] = signature.split(',').map(s => s.split('=')[1]);
  const signedPayload = `${t}.${JSON.stringify(payload)}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(v1),
    Buffer.from(expectedSignature)
  );
}
```

---

## Versioning

The API uses URL-based versioning (`/api/v1`). Breaking changes will result in a new version (`/api/v2`), while backwards-compatible changes will be added to existing versions.

### Deprecation Policy

- **Advance Notice**: 6 months minimum
- **Support Period**: 12 months after deprecation announcement
- **Migration Guide**: Provided for all breaking changes

---

## SDKs and Client Libraries

Official SDKs available:

- **JavaScript/TypeScript**: `npm install @chat402/sdk`
- **Python**: `pip install chat402`
- **Go**: `go get github.com/chat402/chat402-go`
- **Rust**: `cargo add chat402`

See [Integration Guide](INTEGRATION_GUIDE.md) for detailed examples.

---

**Last Updated**: 2025-10-28
**API Version**: 1.0.0
**Maintained by**: Chat402 Team

For questions or support, contact: support@chat402.xyz
