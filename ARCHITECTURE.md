# Chat402 Architecture Documentation

## Table of Contents
- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Protocol Design: x402](#protocol-design-x402)
- [Payment Flow](#payment-flow)
- [Security Model](#security-model)
- [Scalability Considerations](#scalability-considerations)
- [Data Flow](#data-flow)

## Overview

Chat402 is a decentralized LLM API gateway that implements the x402 payment protocol, enabling pay-per-use access to multiple AI models through cryptocurrency payments. The system is designed to eliminate subscription friction and provide granular, usage-based pricing for AI services.

### Core Principles

1. **Payment Required First**: HTTP 402 status code enforcement
2. **Model Agnostic**: Unified interface for multiple LLM providers
3. **Blockchain Native**: USDC payments on Base (Ethereum L2) and Solana
4. **Non-Custodial by Default**: User-controlled wallets with optional custodial API keys
5. **Transparent Pricing**: Real-time, token-based billing

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Web    │  │   CLI    │  │  Mobile  │  │   SDK    │   │
│  │   App    │  │   Tool   │  │   App    │  │  Library │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTPS/WSS
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway Layer                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Rate Limiter  │  Auth  │  Validator  │  Router       │ │
│  └────────────────────────────────────────────────────────┘ │
└───────────────────────┬─────────────────────────────────────┘
                        │
         ┌──────────────┼──────────────┐
         ▼              ▼              ▼
┌────────────┐  ┌──────────────┐  ┌──────────────┐
│  Payment   │  │   Wallet     │  │   Model      │
│  Processor │  │   Manager    │  │   Router     │
└────────────┘  └──────────────┘  └──────────────┘
         │              │              │
         ▼              ▼              ▼
┌────────────┐  ┌──────────────┐  ┌──────────────┐
│ Blockchain │  │   Custody    │  │ LLM Provider │
│  Networks  │  │   Service    │  │   APIs       │
│ (Base/SOL) │  │              │  │              │
└────────────┘  └──────────────┘  └──────────────┘
```

### Component Breakdown

#### 1. API Gateway Layer
- **Express.js** application handling HTTP requests
- **Rate Limiting**: IP-based and API-key-based throttling (100 req/min default)
- **Request Validation**: Schema validation for all incoming requests
- **Error Handling**: Standardized error responses with request IDs

#### 2. Payment Processor
- Validates blockchain transactions
- Verifies USDC balance and transfers
- Implements atomic debit operations
- Handles multi-chain payment verification (Base + Solana)

#### 3. Wallet Manager
- **Custodial Wallets**: Server-side key management for API keys
- **Non-Custodial**: User-controlled wallet integration
- Dual-chain support (Ethereum/Base and Solana)
- Balance tracking and refresh logic

#### 4. Model Router
- Routes requests to appropriate LLM provider
- Implements provider-specific adapters
- Handles response normalization
- Token counting and billing calculation

## Protocol Design: x402

### HTTP 402 Payment Required

The x402 protocol extends HTTP 402 to support cryptocurrency micropayments for API access.

#### Request Flow

```
Client                    Server                  Blockchain
  |                         |                         |
  |----(1) POST /prompt---->|                         |
  |                         |                         |
  |<---(2) 402 Payment------|                         |
  |        Required         |                         |
  |                         |                         |
  |----(3) Sign TX--------->|                         |
  |                         |----(4) Verify TX------->|
  |                         |<---(5) Confirmed--------|
  |                         |                         |
  |<---(6) 200 OK-----------|                         |
  |        + Response       |                         |
```

#### Headers

**Request Headers:**
```
Authorization: Bearer <api_key>
Content-Type: application/json
X-Payment-Network: base | solana (optional)
```

**Response Headers (402):**
```
HTTP/1.1 402 Payment Required
X-Payment-Address: 0x...
X-Payment-Amount: 0.0005
X-Payment-Currency: USDC
X-Payment-Network: base
X-Payment-Memo: req_<request_id>
```

### Payment Models

#### 1. API Key Model (Custodial)
- Pre-fund dedicated wallet
- Automatic deduction per request
- No per-request signing
- Ideal for: High-volume applications, automated workflows

#### 2. Wallet Connect Model (Non-Custodial)
- User signs each transaction
- Direct USDC transfer
- Full user control
- Ideal for: Individual users, security-conscious applications

## Payment Flow

### Custodial (API Key) Flow

```typescript
// 1. Generate API Key
POST /api/v1/keys/generate
Response: {
  apiKey: "sk_...",
  wallets: {
    ethereum: "0x...",
    solana: "..."
  }
}

// 2. Fund Wallet
// User sends USDC to wallet address

// 3. Make Request (automatic deduction)
POST /api/v1/prompt
Headers: { Authorization: "Bearer sk_..." }
Body: { model: "gpt-4", prompt: "..." }
Response: { text: "...", usage: { tokens: 100, cost: 0.003 } }
```

### Non-Custodial Flow

```typescript
// 1. Connect Wallet
const wallet = await connectWallet();

// 2. Request Payment Details
POST /api/v1/prompt/estimate
Body: { model: "gpt-4", prompt: "..." }
Response: {
  estimatedCost: 0.003,
  paymentAddress: "0x...",
  paymentMemo: "req_..."
}

// 3. Sign and Submit Payment
const tx = await wallet.sendUSDC({
  to: paymentAddress,
  amount: estimatedCost,
  memo: paymentMemo
});

// 4. Submit Request with Payment Proof
POST /api/v1/prompt
Headers: { X-Payment-TX: tx.hash }
Body: { model: "gpt-4", prompt: "..." }
Response: { text: "...", usage: { tokens: 100, cost: 0.003 } }
```

## Security Model

### Authentication Layers

1. **API Key Authentication**
   - HMAC-SHA256 signed tokens
   - Scoped permissions
   - Automatic rotation capability
   - Rate limit per key

2. **Wallet Signature Verification**
   - EIP-712 structured data signing (Ethereum)
   - Ed25519 signatures (Solana)
   - Replay attack prevention via nonces

3. **Request Validation**
   - Input sanitization
   - Prompt length limits (max 100,000 chars)
   - Model whitelist enforcement
   - Parameter bounds checking

### Security Boundaries

```
┌─────────────────────────────────────────┐
│         Untrusted Zone                   │
│  ┌───────────────────────────────────┐  │
│  │   Client Applications              │  │
│  └───────────────────────────────────┘  │
└──────────────┬──────────────────────────┘
               │ TLS 1.3
               ▼
┌─────────────────────────────────────────┐
│         Trust Boundary                   │
│  ┌───────────────────────────────────┐  │
│  │  API Gateway (Input Validation)   │  │
│  │  Rate Limiter | Auth | Firewall   │  │
│  └───────────────────────────────────┘  │
└──────────────┬──────────────────────────┘
               │ Internal Network
               ▼
┌─────────────────────────────────────────┐
│         Trusted Zone                     │
│  ┌────────────┐  ┌─────────────────┐   │
│  │  Wallet    │  │  LLM Provider   │   │
│  │  Manager   │  │  Clients        │   │
│  └────────────┘  └─────────────────┘   │
└─────────────────────────────────────────┘
```

## Scalability Considerations

### Horizontal Scaling

The API gateway is designed to be stateless, enabling horizontal scaling:

```
                    Load Balancer
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
    Instance 1       Instance 2       Instance 3
        │                │                │
        └────────────────┼────────────────┘
                         │
                    Shared State
                ┌────────┴────────┐
                │                 │
           Redis Cache      PostgreSQL
        (Rate Limits)      (Wallet State)
```

### Performance Targets

- **Latency**:
  - P50: <500ms (GPT-3.5)
  - P95: <2s (GPT-4)
  - P99: <5s (all models)

- **Throughput**:
  - 1,000 req/s per instance
  - Linear scaling with instances

- **Availability**:
  - 99.9% uptime SLA
  - Multi-region deployment
  - Automatic failover

### Caching Strategy

```typescript
// Response Caching (Optional)
const cacheKey = hash(model + prompt);
const cached = await redis.get(cacheKey);
if (cached && !requiresFreshness) {
  return cached;
}

// Model Metadata Caching
const modelInfo = await redis.get(`model:${modelId}`);
if (!modelInfo) {
  modelInfo = await fetchModelInfo(modelId);
  await redis.setex(`model:${modelId}`, 3600, modelInfo);
}
```

## Data Flow

### Request Processing Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Request Ingress                                           │
│    ├─ TLS Termination                                        │
│    ├─ Request Logging (req_id generation)                    │
│    └─ Headers Parsing                                        │
└───────────────────────┬─────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Authentication & Authorization                            │
│    ├─ API Key Validation                                     │
│    ├─ Wallet Signature Verification                          │
│    └─ Permission Check                                       │
└───────────────────────┬─────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Rate Limiting                                             │
│    ├─ IP-based Check (100/min)                               │
│    ├─ API-key-based Check (100/min)                          │
│    └─ Response: 429 if exceeded                              │
└───────────────────────┬─────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Request Validation                                        │
│    ├─ Schema Validation (Joi/Zod)                            │
│    ├─ Parameter Bounds Checking                              │
│    └─ Model Availability Check                               │
└───────────────────────┬─────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Payment Verification                                      │
│    ├─ Balance Check (Custodial)                              │
│    ├─ Transaction Verification (Non-Custodial)               │
│    └─ Response: 402 if insufficient                          │
└───────────────────────┬─────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Model Routing                                             │
│    ├─ Provider Selection (OpenAI/Anthropic/Google/etc)       │
│    ├─ Request Translation                                    │
│    └─ Timeout Configuration                                  │
└───────────────────────┬─────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. LLM Provider Call                                         │
│    ├─ HTTP Request to Provider API                           │
│    ├─ Stream Processing (if applicable)                      │
│    └─ Response Buffering                                     │
└───────────────────────┬─────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. Response Processing                                       │
│    ├─ Token Counting                                         │
│    ├─ Cost Calculation                                       │
│    └─ Balance Deduction                                      │
└───────────────────────┬─────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. Response Egress                                           │
│    ├─ Response Formatting                                    │
│    ├─ Metadata Addition (usage, cost)                        │
│    └─ Logging & Metrics                                      │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema

```sql
-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  wallet_address VARCHAR(66) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);

-- API Keys Table
CREATE TABLE api_keys (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  key_hash VARCHAR(64) NOT NULL UNIQUE,
  eth_wallet VARCHAR(42),
  sol_wallet VARCHAR(44),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Wallet Balances Table
CREATE TABLE wallet_balances (
  wallet_address VARCHAR(66) PRIMARY KEY,
  network VARCHAR(20) NOT NULL,
  balance_usdc DECIMAL(20, 6) NOT NULL DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(wallet_address, network)
);

-- Transactions Table
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  request_id VARCHAR(50) UNIQUE,
  user_id UUID REFERENCES users(id),
  model VARCHAR(50) NOT NULL,
  tokens_used INTEGER NOT NULL,
  cost_usdc DECIMAL(10, 6) NOT NULL,
  network VARCHAR(20),
  tx_hash VARCHAR(66),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Request Logs Table
CREATE TABLE request_logs (
  id UUID PRIMARY KEY,
  request_id VARCHAR(50) UNIQUE,
  user_id UUID REFERENCES users(id),
  model VARCHAR(50),
  status_code INTEGER,
  latency_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_request_logs_created_at ON request_logs(created_at);
CREATE INDEX idx_wallet_balances_network ON wallet_balances(network);
```

## Technology Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript 5.x
- **Validation**: Joi / Zod
- **Database**: PostgreSQL 15+ (primary), Redis 7+ (cache)
- **Blockchain**: ethers.js (Ethereum/Base), @solana/web3.js (Solana)

### Infrastructure
- **Hosting**: AWS EC2 / ECS
- **CDN**: AWS CloudFront
- **Storage**: AWS S3
- **Monitoring**: DataDog / Prometheus + Grafana
- **Logging**: Winston + CloudWatch

### Frontend
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Vanilla CSS with CSS Variables
- **Wallet Integration**: WalletConnect, MetaMask, Phantom

## Deployment Architecture

```
                        ┌─────────────┐
                        │   Route53   │
                        │     DNS     │
                        └──────┬──────┘
                               │
                        ┌──────▼──────┐
                        │ CloudFront  │
                        │     CDN     │
                        └──────┬──────┘
                               │
                ┌──────────────┼──────────────┐
                │                             │
         ┌──────▼──────┐              ┌──────▼──────┐
         │     S3      │              │     ALB     │
         │  (Static)   │              │ (API Load   │
         └─────────────┘              │  Balancer)  │
                                      └──────┬──────┘
                                             │
                                ┌────────────┼────────────┐
                                │                         │
                         ┌──────▼──────┐          ┌──────▼──────┐
                         │   ECS Task  │          │   ECS Task  │
                         │  (API Inst) │          │  (API Inst) │
                         └──────┬──────┘          └──────┬──────┘
                                │                         │
                                └────────────┬────────────┘
                                             │
                                ┌────────────┼────────────┐
                                │                         │
                         ┌──────▼──────┐          ┌──────▼──────┐
                         │  RDS Postgres│         │    Redis    │
                         │  (Primary)   │         │   Cluster   │
                         └──────────────┘         └─────────────┘
```

---

**Last Updated**: 2025-10-28
**Version**: 1.0.0
**Maintained by**: Chat402 Team
