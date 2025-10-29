# Security Best Practices

## Table of Contents
- [API Key Security](#api-key-security)
- [Wallet Security](#wallet-security)
- [Request Security](#request-security)
- [Network Security](#network-security)
- [Data Privacy](#data-privacy)
- [Incident Response](#incident-response)
- [Security Checklist](#security-checklist)

## API Key Security

### Key Management

#### DO

✅ **Store API keys in environment variables**
```bash
export CHAT402_API_KEY=sk_live_...
```

✅ **Use secret management services in production**
- AWS Secrets Manager
- HashiCorp Vault
- Google Secret Manager
- Azure Key Vault

✅ **Rotate keys regularly** (recommended: every 90 days)

✅ **Use different keys for development, staging, and production**

#### DON'T

❌ **Never commit API keys to version control**
```bash
# Add to .gitignore
.env
.env.local
secrets.json
config/prod.yaml
```

❌ **Never hardcode API keys in source code**
```javascript
// BAD
const apiKey = "sk_live_abc123...";

// GOOD
const apiKey = process.env.CHAT402_API_KEY;
```

❌ **Never expose API keys in client-side code**
```html
<!-- BAD: API key visible in browser -->
<script>
  const apiKey = "sk_live_abc123...";
</script>
```

❌ **Never share API keys in logs or error messages**
```javascript
// BAD
console.log(`Using API key: ${apiKey}`);
console.error(new Error(`Failed with key ${apiKey}`));

// GOOD
console.log('API request initiated');
console.error(new Error('API request failed'));
```

### Key Scoping

Limit API key permissions to minimum required:

```typescript
// Generate key with limited scopes
await chat402.keys.generate({
  name: "Read-only key",
  scopes: ["balance"],  // Only allow balance checks
  expiresIn: 30  // Expire in 30 days
});
```

### Key Rotation

Implement automated key rotation:

```typescript
async function rotateApiKey() {
  // 1. Generate new key
  const newKey = await chat402.keys.generate({
    name: `Production key ${new Date().toISOString()}`,
    scopes: ["prompt", "balance"],
    expiresIn: 90
  });

  // 2. Update application configuration
  await updateConfig({ apiKey: newKey.apiKey });

  // 3. Wait for propagation (24 hours recommended)
  await sleep(24 * 60 * 60 * 1000);

  // 4. Revoke old key
  await chat402.keys.revoke(oldKeyId);
}
```

## Wallet Security

### Custodial Wallets

For custodial API-key wallets:

✅ **Monitor balance regularly**
```typescript
setInterval(async () => {
  const balance = await client.getBalance();
  if (balance.data.totalBalance.amount < MINIMUM_THRESHOLD) {
    await alertOps('Low balance warning');
  }
}, 60 * 60 * 1000); // Every hour
```

✅ **Set up balance alerts via webhooks**
```typescript
// Subscribe to balance.low event
await chat402.webhooks.subscribe({
  url: 'https://your-app.com/webhooks/chat402',
  events: ['balance.low'],
  threshold: 1.0 // Alert when < $1
});
```

✅ **Export and back up private keys securely**
```typescript
// One-time export, store in secure vault
const keys = await client.exportKeys();
await vault.store('chat402-eth-key', keys.ethereum);
await vault.store('chat402-sol-key', keys.solana);
```

### Non-Custodial Wallets

✅ **Use hardware wallets for large amounts**
- Ledger
- Trezor

✅ **Enable multi-signature for critical operations**

✅ **Use separate wallets for different environments**

❌ **Never share seed phrases or private keys**

❌ **Never use production wallets for testing**

### Transaction Security

✅ **Verify transaction details before signing**
```typescript
async function safeTransfer(to: string, amount: number) {
  // 1. Verify address format
  if (!isValidAddress(to)) {
    throw new Error('Invalid recipient address');
  }

  // 2. Check balance
  const balance = await getBalance();
  if (balance < amount) {
    throw new Error('Insufficient balance');
  }

  // 3. Estimate gas
  const gasEstimate = await estimateGas(to, amount);

  // 4. Display confirmation prompt
  const confirmed = await confirmTransaction({
    to,
    amount,
    estimatedGas: gasEstimate,
    network: 'base'
  });

  if (!confirmed) {
    return;
  }

  // 5. Sign and send
  return await wallet.sendTransaction({
    to,
    value: amount
  });
}
```

✅ **Implement transaction signing with user confirmation**

✅ **Validate network before transactions** (Base vs Solana)

## Request Security

### Input Validation

Always validate and sanitize inputs:

```typescript
function validatePromptRequest(req: PromptRequest) {
  // Length check
  if (req.prompt.length > 100_000) {
    throw new ValidationError('Prompt too long (max 100,000 characters)');
  }

  // Model whitelist
  const allowedModels = [
    'gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo',
    'claude-sonnet-4-5-20250929', 'gemini-2.5-flash'
  ];
  if (!allowedModels.includes(req.model)) {
    throw new ValidationError(`Invalid model: ${req.model}`);
  }

  // Parameter bounds
  if (req.temperature !== undefined) {
    if (req.temperature < 0 || req.temperature > 2) {
      throw new ValidationError('Temperature must be between 0 and 2');
    }
  }

  if (req.maxTokens !== undefined) {
    if (req.maxTokens < 1 || req.maxTokens > 100_000) {
      throw new ValidationError('maxTokens must be between 1 and 100,000');
    }
  }

  return true;
}
```

### Rate Limiting

Implement client-side rate limiting:

```typescript
class RateLimiter {
  private requests: number[] = [];
  private limit: number;
  private window: number;

  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.window = windowMs;
  }

  async acquire(): Promise<void> {
    const now = Date.now();

    // Remove old requests
    this.requests = this.requests.filter(
      timestamp => timestamp > now - this.window
    );

    if (this.requests.length >= this.limit) {
      const oldestRequest = this.requests[0];
      const waitTime = this.window - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.acquire();
    }

    this.requests.push(now);
  }
}

const limiter = new RateLimiter(100, 60000); // 100 req/min

async function makeRequest(prompt: string) {
  await limiter.acquire();
  return client.prompt({ model: 'gpt-3.5-turbo', prompt });
}
```

### Retry Logic

Implement exponential backoff with jitter:

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors
      if (error instanceof Chat402Error) {
        if (error.code === 'VALIDATION_ERROR' ||
            error.code === 'AUTHENTICATION_ERROR') {
          throw error;
        }
      }

      // Exponential backoff with jitter
      const baseDelay = Math.pow(2, i) * 1000;
      const jitter = Math.random() * 1000;
      const delay = baseDelay + jitter;

      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
```

## Network Security

### HTTPS Only

✅ **Always use HTTPS endpoints**
```typescript
// GOOD
const baseURL = 'https://api.chat402.xyz';

// BAD
const baseURL = 'http://api.chat402.xyz';
```

### Certificate Pinning

For mobile apps, implement certificate pinning:

```typescript
// React Native example
import { fetch } from 'react-native-ssl-pinning';

const response = await fetch('https://api.chat402.xyz/api/v1/prompt', {
  method: 'POST',
  pkPinning: true,
  sslPinning: {
    certs: ['chat402-cert']
  }
});
```

### Request Signing

For non-custodial requests, always sign requests:

```typescript
async function signRequest(
  payload: any,
  privateKey: string
): Promise<string> {
  const message = JSON.stringify(payload);
  const signature = await wallet.signMessage(message);
  return signature;
}

async function makeSignedRequest(payload: PromptRequest) {
  const signature = await signRequest(payload, privateKey);

  return fetch('https://api.chat402.xyz/api/v1/prompt', {
    method: 'POST',
    headers: {
      'X-Wallet-Address': walletAddress,
      'X-Wallet-Signature': signature,
      'X-Wallet-Nonce': Date.now().toString()
    },
    body: JSON.stringify(payload)
  });
}
```

## Data Privacy

### Sensitive Data Handling

❌ **Never include PII in prompts without user consent**

✅ **Redact sensitive information**
```typescript
function redactSensitiveInfo(text: string): string {
  return text
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN_REDACTED]')  // SSN
    .replace(/\b\d{16}\b/g, '[CARD_REDACTED]')  // Credit card
    .replace(/\b[\w.-]+@[\w.-]+\.\w+\b/g, '[EMAIL_REDACTED]');  // Email
}

const sanitizedPrompt = redactSensitiveInfo(userInput);
await client.prompt({ model: 'gpt-3.5-turbo', prompt: sanitizedPrompt });
```

✅ **Use metadata field for tracking, not prompts**
```typescript
await client.prompt({
  model: 'gpt-3.5-turbo',
  prompt: 'Generic question here',
  metadata: {
    userId: hashUserId(actualUserId),  // Hashed, not plain
    sessionId: generateSessionId()
  }
});
```

### Compliance

Ensure compliance with:
- **GDPR** (EU)
- **CCPA** (California)
- **HIPAA** (Healthcare, if applicable)
- **SOC 2** requirements

## Incident Response

### Detection

Monitor for:
- Unusual API usage patterns
- Unexpected balance drops
- Failed authentication attempts
- Rate limit violations

### Response Plan

1. **Detection**: Automated monitoring alerts
2. **Containment**: Immediately revoke compromised keys
3. **Investigation**: Review logs and audit trail
4. **Recovery**: Rotate all credentials, restore from backups
5. **Post-mortem**: Document and improve processes

### Example: Compromised Key Response

```typescript
async function handleCompromisedKey(keyId: string) {
  // 1. Immediately revoke
  await chat402.keys.revoke(keyId);

  // 2. Alert security team
  await alert.security({
    severity: 'high',
    message: `API key ${keyId} compromised and revoked`,
    timestamp: new Date()
  });

  // 3. Generate replacement
  const newKey = await chat402.keys.generate({
    name: `Emergency replacement for ${keyId}`,
    scopes: getKeyScopes(keyId),
    expiresIn: 30
  });

  // 4. Update configuration
  await updateConfig({ apiKey: newKey.apiKey });

  // 5. Audit recent activity
  const recentActivity = await getKeyActivity(keyId, { hours: 24 });
  await logSecurityEvent({
    type: 'key_compromise',
    keyId,
    recentActivity
  });

  return newKey;
}
```

## Security Checklist

### Development

- [ ] API keys stored in environment variables
- [ ] No secrets in source code
- [ ] `.gitignore` includes secret files
- [ ] Input validation on all user inputs
- [ ] Rate limiting implemented
- [ ] Error handling doesn't expose sensitive data
- [ ] HTTPS only for all API calls

### Production

- [ ] API keys in secret management service
- [ ] Separate keys per environment
- [ ] Automated key rotation enabled
- [ ] Monitoring and alerting configured
- [ ] Incident response plan documented
- [ ] Regular security audits scheduled
- [ ] Balance monitoring and alerts active
- [ ] Webhook signature verification implemented
- [ ] Certificate pinning (for mobile apps)
- [ ] Security headers configured
- [ ] Rate limiting per user/IP
- [ ] Request/response logging (excluding sensitive data)

### Compliance

- [ ] Privacy policy updated
- [ ] Terms of service includes API usage
- [ ] Data retention policy defined
- [ ] User consent for data processing
- [ ] GDPR/CCPA compliance verified
- [ ] Security questionnaire completed
- [ ] Penetration testing conducted
- [ ] Vulnerability scanning automated

---

## Reporting Security Issues

If you discover a security vulnerability, please email:

**security@chat402.xyz**

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We aim to respond within 24 hours.

---

**Last Updated**: 2025-10-28
**Version**: 1.0.0
**Maintained by**: Chat402 Security Team
