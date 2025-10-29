"""
Chat402 - Basic Python Example

This example shows how to make a simple request to the Chat402 API
"""

import os
import requests

API_URL = 'https://api.chat402.xyz/api/v1'
API_KEY = os.getenv('CHAT402_API_KEY')  # Set this in your environment

def chat(prompt: str, model: str = 'gpt-3.5-turbo') -> dict:
    """Send a prompt to Chat402 API"""
    try:
        response = requests.post(
            f'{API_URL}/prompt',
            json={
                'model': model,
                'prompt': prompt
            },
            headers={
                'Authorization': f'Bearer {API_KEY}',
                'Content-Type': 'application/json'
            }
        )

        if response.status_code == 402:
            raise Exception('Insufficient balance - please top up your wallet')

        response.raise_for_status()
        return response.json()

    except requests.exceptions.RequestException as e:
        raise Exception(f'API request failed: {str(e)}')


def main():
    """Example usage"""
    try:
        result = chat('What is Ethereum?')

        print(f"Response: {result['text']}")
        print(f"Cost: ${result['cost']['totalCost']:.6f}")
        print(f"Tokens: {result['usage']['totalTokens']}")

    except Exception as e:
        print(f'Error: {str(e)}')


if __name__ == '__main__':
    main()
