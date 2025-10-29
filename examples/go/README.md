# Chat402 Go Client Example

This example demonstrates how to use the Chat402 API with Go.

## Installation

```bash
go mod init your-project
go get github.com/your-org/chat402-go
```

## Quick Start

```go
package main

import (
	"context"
	"fmt"
	"log"
)

func main() {
	client := NewClient("sk_live_your_api_key_here")
	ctx := context.Background()

	// Simple prompt
	temp := 0.7
	response, err := client.Prompt(ctx, &PromptRequest{
		Model:       "gpt-3.5-turbo",
		Prompt:      "Hello, world!",
		Temperature: &temp,
	})
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println(response.Data.Text)
}
```

## Features

- ✅ Type-safe API client
- ✅ Context support for cancellation
- ✅ Comprehensive error handling
- ✅ Balance checking
- ✅ Full model support

## Running

```bash
export CHAT402_API_KEY=sk_live_...
go run client.go
```
