# Node.js Examples

Quick start guides for using Chat402 with Node.js/JavaScript.

## Installation

```bash
npm install axios
```

## Basic Usage

```javascript
const axios = require('axios');

const response = await axios.post('https://api.chat402.xyz/api/v1/prompt', {
  model: 'gpt-3.5-turbo',
  prompt: 'What is Bitcoin?'
}, {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
});

console.log(response.data.text);
console.log(`Cost: $${response.data.cost.totalCost}`);
```

## Environment Variables

Set your API key:

```bash
export CHAT402_API_KEY="your_api_key_here"
```

## Running the Examples

```bash
# Basic example
node basic-example.js
```

## Available Models

- `gpt-3.5-turbo` - Fast, affordable
- `gpt-4` - Advanced reasoning
- `claude-sonnet-4-5-20250929` - Best for analysis
- `gemini-2.5-flash` - Ultra-affordable
- `deepseek-chat` - Best for code

## Error Handling

```javascript
try {
  const result = await chat('Hello');
} catch (error) {
  if (error.response?.status === 402) {
    console.log('Insufficient balance - top up at chat402.xyz');
  }
}
```

## More Examples Coming Soon

- Streaming responses
- Image generation
- Multi-turn conversations
- Custom parameters

Want to contribute? See [CONTRIBUTING.md](../../CONTRIBUTING.md)!
