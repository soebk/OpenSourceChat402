# Chat402 Community

> **Pay for AI with Crypto. No subscriptions. No credit cards. Just crypto and control.**

Welcome to the Chat402 community repository! This is a space for developers to share examples, integrations, and contributions to the Chat402 ecosystem.

## What is Chat402?

Chat402 is the first LLM API gateway built for x402 payments. Access GPT-4, Claude, Gemini, and more using USDC on Base or Solana. Pay-per-prompt.

🌐 **Website:** [chat402.xyz](https://www.chat402.xyz)
📚 **Docs:** [docs.chat402.xyz](https://docs.chat402.xyz)
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

## Community Examples

Check out the [`/examples`](./examples) directory for code samples in various languages:

- **Node.js** - TypeScript/JavaScript integration
- **Python** - Python SDK examples
- **Go** - Golang implementation
- **Rust** - Rust examples

## Contributing

We welcome contributions! Whether it's:

- 🛠️ New language examples
- 📦 SDK/library integrations
- 🎨 UI components
- 📖 Documentation improvements
- 🐛 Bug reports

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
