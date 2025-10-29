# Chat402 API Improvements

## Overview

This document describes the improvements made to the Chat402 API to enhance developer experience, error handling, and security.

## ✅ Enhanced Error Handling

### Standardized Error Response Format

All errors now return a consistent structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "additionalInfo": "..."
    },
    "requestId": "uuid-for-tracking",
    "timestamp": "2025-10-29T00:00:00.000Z"
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `PAYMENT_REQUIRED` | 402 | Payment needed to process request |
| `PAYMENT_VERIFICATION_FAILED` | 400 | Payment proof invalid |
| `MODEL_NOT_FOUND` | 404 | Requested model doesn't exist |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `REQUEST_TIMEOUT` | 504 | Request took too long |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |

### Example Error Response

```bash
curl -X POST https://api.chat402.xyz/api/v1/prompt \
  -H "Content-Type: application/json" \
  -d '{}'
```

Response:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "errors": [
        "model is required and must be a string",
        "prompt is required and must be a string"
      ]
    },
    "timestamp": "2025-10-29T01:06:51.790Z"
  }
}
```

## ✅ Request Validation

### Validation Rules

**Required Fields:**
- `model` (string) - Model ID
- `prompt` (string, 1-100,000 chars) - User prompt

**Optional Fields:**
- `maxTokens` (number, 1-8,000) - Max output tokens
- `temperature` (number, 0-2) - Sampling temperature

### Input Sanitization

All requests are automatically sanitized to:
- Remove dangerous prototype properties
- Trim string values
- Prevent injection attacks

## ✅ Rate Limiting

### IP-Based Rate Limiting

- **100 requests per minute** per IP address
- Applies to all API endpoints

### API Key Rate Limiting

- **100 requests per minute** per API key
- Applied to `/api/v1/prompt` endpoint

### Rate Limit Headers

All responses include rate limit information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1698537600000
```

When rate limit is exceeded:

```
HTTP/1.1 429 Too Many Requests
Retry-After: 45

{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please slow down.",
    "details": {
      "limit": 100,
      "windowMs": 60000,
      "retryAfter": "45 seconds"
    }
  }
}
```

## ✅ Consistent Success Responses

### New Success Format

All successful responses now follow this structure:

```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "metadata": {
    "timestamp": "2025-10-29T00:00:00.000Z"
  }
}
```

### Example: Prompt Response

```json
{
  "success": true,
  "data": {
    "model": "gpt-3.5-turbo",
    "text": "Bitcoin is a decentralized digital currency...",
    "usage": {
      "inputTokens": 5,
      "outputTokens": 150,
      "totalTokens": 155
    },
    "cost": {
      "inputCost": 0.0000025,
      "outputCost": 0.000225,
      "totalCost": 0.0002275
    },
    "transactionId": "uuid"
  },
  "metadata": {
    "timestamp": "2025-10-29T01:00:00.000Z",
    "processingTime": 1250
  }
}
```

### Example: Models List

```json
{
  "success": true,
  "data": {
    "models": [
      {
        "id": "gpt-3.5-turbo",
        "name": "GPT-3.5 Turbo",
        "provider": "openai",
        "pricing": {
          "inputPricePer1kTokens": "0.000500",
          "outputPricePer1kTokens": "0.001500"
        },
        "limits": {
          "maxTokens": 4096,
          "contextWindow": 16385
        }
      }
    ],
    "count": 12
  },
  "metadata": {
    "timestamp": "2025-10-29T01:00:00.000Z"
  }
}
```

## 📝 Migration Guide

### Updating Your Code

**Before:**
```javascript
const response = await fetch('/api/v1/prompt', {
  method: 'POST',
  body: JSON.stringify({ model, prompt })
});
const data = await response.json();
console.log(data.text); // Direct access
```

**After:**
```javascript
const response = await fetch('/api/v1/prompt', {
  method: 'POST',
  body: JSON.stringify({ model, prompt })
});
const result = await response.json();

if (result.success) {
  console.log(result.data.text); // Access via data
} else {
  console.error(result.error.code, result.error.message);
}
```

### Error Handling

```javascript
try {
  const result = await chat('Hello');

  if (!result.success) {
    // Handle specific error codes
    switch (result.error.code) {
      case 'PAYMENT_REQUIRED':
        console.log('Please top up your wallet');
        break;
      case 'RATE_LIMIT_EXCEEDED':
        const retryAfter = result.error.details.retryAfter;
        console.log(`Rate limited. Retry after ${retryAfter}`);
        break;
      case 'VALIDATION_ERROR':
        console.log('Invalid request:', result.error.details.errors);
        break;
      default:
        console.error('Error:', result.error.message);
    }
  }
} catch (error) {
  console.error('Network error:', error);
}
```

## 🔒 Security Improvements

1. **Input Validation** - All inputs validated before processing
2. **Request Sanitization** - Automatic removal of dangerous properties
3. **Rate Limiting** - Protection against abuse and DDoS
4. **Request IDs** - Every error includes a unique request ID for tracking
5. **Structured Logging** - All errors logged with full context

## 📊 Monitoring

### Request IDs

Every error response includes a unique `requestId` for debugging:

```json
{
  "error": {
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

Use this ID when reporting issues or debugging problems.

### Rate Limit Monitoring

Monitor your rate limit usage via response headers:
- Check `X-RateLimit-Remaining` to see how many requests you have left
- `X-RateLimit-Reset` tells you when your limit resets (Unix timestamp)

## 🚀 Best Practices

1. **Handle all error codes** - Don't just check for 200 status
2. **Respect rate limits** - Implement exponential backoff
3. **Log request IDs** - Include them in your error reports
4. **Validate locally first** - Check inputs before sending requests
5. **Monitor rate limit headers** - Throttle requests proactively

## 📚 Documentation

- **API Reference:** https://docs.chat402.xyz
- **Code Examples:** See `/examples` directory
- **GitHub:** https://github.com/soebk/OpenSourceChat402

---

**Questions?** Join our [Discord](https://discord.gg/chat402) or open an issue on GitHub!
