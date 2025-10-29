# Python Examples

Quick start guides for using Chat402 with Python.

## Installation

```bash
pip install requests
```

## Basic Usage

```python
import requests

response = requests.post(
    'https://api.chat402.xyz/api/v1/prompt',
    json={
        'model': 'gpt-3.5-turbo',
        'prompt': 'What is Ethereum?'
    },
    headers={'Authorization': 'Bearer YOUR_API_KEY'}
)

data = response.json()
print(data['text'])
print(f"Cost: ${data['cost']['totalCost']:.6f}")
```

## Environment Variables

Set your API key:

```bash
export CHAT402_API_KEY="your_api_key_here"
```

Or in Python:

```python
import os
api_key = os.getenv('CHAT402_API_KEY')
```

## Running the Examples

```bash
# Basic example
python basic_example.py
```

## Available Models

| Model | Provider | Use Case |
|-------|----------|----------|
| `gpt-3.5-turbo` | OpenAI | Fast, general |
| `gpt-4` | OpenAI | Advanced reasoning |
| `claude-sonnet-4-5-20250929` | Anthropic | Best for analysis |
| `gemini-2.5-flash` | Google | Ultra-cheap |
| `deepseek-chat` | DeepSeek | Code generation |

## Error Handling

```python
try:
    result = chat('Hello')
except Exception as e:
    if '402' in str(e):
        print('Insufficient balance - top up at chat402.xyz')
    else:
        print(f'Error: {e}')
```

## Tips

- Always set timeouts on requests
- Cache responses when possible
- Monitor your usage and costs
- Use cheaper models for simple tasks

## More Examples Coming Soon

- Async requests
- Streaming responses
- Batch processing
- Custom retry logic

Want to contribute? See [CONTRIBUTING.md](../../CONTRIBUTING.md)!
