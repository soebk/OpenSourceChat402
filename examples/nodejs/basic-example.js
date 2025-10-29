/**
 * Chat402 - Basic Node.js Example
 *
 * This example shows how to make a simple request to the Chat402 API
 */

const axios = require('axios');

const API_URL = 'https://api.chat402.xyz/api/v1';
const API_KEY = process.env.CHAT402_API_KEY; // Set this in your environment

async function chat(prompt, model = 'gpt-3.5-turbo') {
  try {
    const response = await axios.post(`${API_URL}/prompt`, {
      model,
      prompt
    }, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    if (error.response?.status === 402) {
      throw new Error('Insufficient balance - please top up your wallet');
    }
    throw error;
  }
}

// Example usage
async function main() {
  try {
    const result = await chat('What is Bitcoin?');

    console.log('Response:', result.text);
    console.log('Cost:', `$${result.cost.totalCost.toFixed(6)}`);
    console.log('Tokens:', result.usage.totalTokens);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
