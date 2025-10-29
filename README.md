# Chat402 - Crypto-Native LLM API Gateway

> **Pay for AI with Crypto. No subscriptions. No credit cards. Just crypto and control.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![API Status](https://img.shields.io/badge/API-Production-success)](https://api.chat402.xyz)
[![Documentation](https://img.shields.io/badge/docs-comprehensive-blue)](./API_REFERENCE.md)

Chat402 is the first LLM API gateway built for x402 payments. Access GPT-4, Claude, Gemini, Grok, and DeepSeek using USDC on Base (Ethereum L2) or Solana. Pay-per-prompt with transparent pricing.

🌐 **Website:** [chat402.xyz](https://www.chat402.xyz)
📚 **API Reference:** [API_REFERENCE.md](./API_REFERENCE.md)
🏗️ **Architecture:** [ARCHITECTURE.md](./ARCHITECTURE.md)
🔒 **Security:** [SECURITY.md](./SECURITY.md)
💬 **Discord:** [discord.gg/chat402](https://discord.gg/chat402)

## Features

✅ **Pay-per-use** - Only pay for what you use in USDC
✅ **Multi-model access** - GPT-4, Claude, Gemini, Grok, DeepSeek
✅ **Dual-chain support** - Base (Ethereum L2) and Solana
✅ **Transparent pricing** - Real-time costs per request
✅ **Developer-first** - REST API with comprehensive docs

## Quick Start

### 1. Get an API Key

Visit [chat402.xyz](https://www.chat402.xyz), connect your wallet, and generate an API key.

### 2. Make Your First Request

```bash
curl -X POST https://api.chat402.xyz/api/v1/prompt \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "prompt": "What is Bitcoin?"
  }'
```

### 3. Check the Response

```json
{
  "success": true,
  "text": "Bitcoin is a decentralized digital currency...",
  "usage": {
    "totalTokens": 150
  },
  "cost": {
    "totalCost": 0.000075
  }
}
```

## Documentation

### Core Documentation

| Document | Description |
|----------|-------------|
| [📖 API Reference](./API_REFERENCE.md) | Complete API documentation with all endpoints, parameters, and responses |
| [🏗️ Architecture](./ARCHITECTURE.md) | System architecture, protocol design, and technical specifications |
| [🔒 Security Guide](./SECURITY.md) | Best practices for API keys, wallets, and secure integration |
| [🛠️ API Improvements](./API_IMPROVEMENTS.md) | Recent API enhancements and migration guides |
| [🤝 Contributing](./CONTRIBUTING.md) | Guidelines for contributing to the project |

### Code Examples

Check out the [`/examples`](./examples) directory for production-ready code samples:

| Language | Features | Documentation |
|----------|----------|---------------|
| **TypeScript/JavaScript** | Complete client with streaming, error handling, type safety | [README](./examples/typescript/) |
| **Go** | Idiomatic Go client with context support | [README](./examples/go/README.md) |
| **Python** | Async/sync support, pandas integration | [README](./examples/python/README.md) |
| **Node.js** | Express.js integration examples | [README](./examples/nodejs/README.md) |
| **cURL** | Quick command-line examples | [README](./examples/curl/) |

## Contributing

We welcome contributions! Whether it's:

- 🛠️ New language examples
- 📦 SDK/library integrations
- 🎨 UI components
- 📖 Documentation improvements
- 🐛 Bug reports
- 🔒 Security enhancements

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## Supported Models

| Model | Provider | Cost (per 1K tokens) |
|-------|----------|---------------------|
| GPT-3.5 Turbo | OpenAI | $0.0005 |
| GPT-4 | OpenAI | $0.030 |
| Claude 4.5 | Anthropic | $0.003 |
| Gemini 2.5 Flash | Google | $0.0001 |
| Grok | xAI | $0.005 |
| DeepSeek | DeepSeek | $0.0001 |

## API Endpoints

- **POST** `/api/v1/prompt` - Send a prompt to an AI model
- **GET** `/api/v1/keys` - List your API keys
- **GET** `/api/v1/models` - List available models

Full API docs: [docs.chat402.xyz](https://docs.chat402.xyz)

## License

MIT License - See [LICENSE](./LICENSE) for details.

## Links

- **Website:** https://www.chat402.xyz
- **Documentation:** https://docs.chat402.xyz
- **Discord:** https://discord.gg/chat402
- **Twitter:** https://twitter.com/chat402
- **GitHub:** https://github.com/soebk/OpenSourceChat402

---

**Built with ❤️ for the crypto-native AI future**
