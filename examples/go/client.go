package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const (
	BaseURL        = "https://api.chat402.xyz/api/v1"
	DefaultTimeout = 30 * time.Second
)

// Client is the Chat402 API client
type Client struct {
	apiKey     string
	baseURL    string
	httpClient *http.Client
}

// NewClient creates a new Chat402 client
func NewClient(apiKey string) *Client {
	return &Client{
		apiKey:  apiKey,
		baseURL: BaseURL,
		httpClient: &http.Client{
			Timeout: DefaultTimeout,
		},
	}
}

// PromptRequest represents a request to the prompt endpoint
type PromptRequest struct {
	Model            string                 `json:"model"`
	Prompt           string                 `json:"prompt"`
	MaxTokens        *int                   `json:"maxTokens,omitempty"`
	Temperature      *float64               `json:"temperature,omitempty"`
	TopP             *float64               `json:"topP,omitempty"`
	Stream           bool                   `json:"stream,omitempty"`
	StopSequences    []string               `json:"stopSequences,omitempty"`
	PresencePenalty  *float64               `json:"presencePenalty,omitempty"`
	FrequencyPenalty *float64               `json:"frequencyPenalty,omitempty"`
	User             string                 `json:"user,omitempty"`
	Metadata         map[string]interface{} `json:"metadata,omitempty"`
}

// Usage represents token usage information
type Usage struct {
	PromptTokens     int `json:"promptTokens"`
	CompletionTokens int `json:"completionTokens"`
	TotalTokens      int `json:"totalTokens"`
}

// Cost represents pricing information
type Cost struct {
	Amount   float64 `json:"amount"`
	Currency string  `json:"currency"`
	Breakdown struct {
		PromptCost     float64 `json:"promptCost"`
		CompletionCost float64 `json:"completionCost"`
	} `json:"breakdown"`
}

// PromptResponse represents the response from the prompt endpoint
type PromptResponse struct {
	Success bool `json:"success"`
	Data    struct {
		Text         string `json:"text"`
		Model        string `json:"model"`
		FinishReason string `json:"finishReason"`
		Usage        Usage  `json:"usage"`
		Cost         Cost   `json:"cost"`
	} `json:"data"`
	Metadata struct {
		RequestID      string `json:"requestId"`
		Timestamp      string `json:"timestamp"`
		ProcessingTime int    `json:"processingTime"`
		ModelVersion   string `json:"modelVersion"`
	} `json:"metadata"`
}

// ErrorResponse represents an error from the API
type ErrorResponse struct {
	Success bool `json:"success"`
	Error   struct {
		Code      string                 `json:"code"`
		Message   string                 `json:"message"`
		Details   map[string]interface{} `json:"details"`
		RequestID string                 `json:"requestId"`
		Timestamp string                 `json:"timestamp"`
	} `json:"error"`
}

// Prompt sends a prompt to the Chat402 API
func (c *Client) Prompt(ctx context.Context, req *PromptRequest) (*PromptResponse, error) {
	body, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("marshaling request: %w", err)
	}

	httpReq, err := http.NewRequestWithContext(ctx, "POST", c.baseURL+"/prompt", bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("creating request: %w", err)
	}

	httpReq.Header.Set("Authorization", "Bearer "+c.apiKey)
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("making request: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("reading response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		var errResp ErrorResponse
		if err := json.Unmarshal(respBody, &errResp); err != nil {
			return nil, fmt.Errorf("status %d: %s", resp.StatusCode, string(respBody))
		}
		return nil, fmt.Errorf("[%s] %s: %v", errResp.Error.Code, errResp.Error.Message, errResp.Error.Details)
	}

	var promptResp PromptResponse
	if err := json.Unmarshal(respBody, &promptResp); err != nil {
		return nil, fmt.Errorf("unmarshaling response: %w", err)
	}

	return &promptResp, nil
}

// BalanceResponse represents wallet balance information
type BalanceResponse struct {
	Success bool `json:"success"`
	Data    struct {
		Wallets []struct {
			Network string `json:"network"`
			Address string `json:"address"`
			Balance struct {
				Amount   float64 `json:"amount"`
				Currency string  `json:"currency"`
			} `json:"balance"`
			LastUpdated string `json:"lastUpdated"`
		} `json:"wallets"`
		TotalBalance struct {
			Amount   float64 `json:"amount"`
			Currency string  `json:"currency"`
		} `json:"totalBalance"`
	} `json:"data"`
}

// GetBalance retrieves the current wallet balance
func (c *Client) GetBalance(ctx context.Context) (*BalanceResponse, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", c.baseURL+"/balance", nil)
	if err != nil {
		return nil, fmt.Errorf("creating request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+c.apiKey)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("making request: %w", err)
	}
	defer resp.Body.Close()

	var balanceResp BalanceResponse
	if err := json.NewDecoder(resp.Body).Decode(&balanceResp); err != nil {
		return nil, fmt.Errorf("decoding response: %w", err)
	}

	return &balanceResp, nil
}

// Example usage
func main() {
	client := NewClient("sk_live_your_api_key_here")

	ctx := context.Background()

	// Check balance
	balance, err := client.GetBalance(ctx)
	if err != nil {
		fmt.Printf("Error getting balance: %v\n", err)
		return
	}
	fmt.Printf("Total Balance: $%.2f %s\n", balance.Data.TotalBalance.Amount, balance.Data.TotalBalance.Currency)

	// Send a prompt
	temp := 0.7
	maxTokens := 500
	promptReq := &PromptRequest{
		Model:       "gpt-3.5-turbo",
		Prompt:      "Explain quantum computing in simple terms",
		Temperature: &temp,
		MaxTokens:   &maxTokens,
	}

	response, err := client.Prompt(ctx, promptReq)
	if err != nil {
		fmt.Printf("Error sending prompt: %v\n", err)
		return
	}

	fmt.Printf("\nModel: %s\n", response.Data.Model)
	fmt.Printf("Response: %s\n", response.Data.Text)
	fmt.Printf("\nUsage:\n")
	fmt.Printf("  Prompt tokens: %d\n", response.Data.Usage.PromptTokens)
	fmt.Printf("  Completion tokens: %d\n", response.Data.Usage.CompletionTokens)
	fmt.Printf("  Total tokens: %d\n", response.Data.Usage.TotalTokens)
	fmt.Printf("\nCost: $%.6f %s\n", response.Data.Cost.Amount, response.Data.Cost.Currency)
}
