package main

import (
	"syscall/js"
)

// Function to be exported to JavaScript
func processData(this js.Value, args []js.Value) interface{} {
	if len(args) < 1 {
		return "Error: No input provided"
	}

	input := args[0].String()
	// Process the input (this is where your actual logic would go)
	output := "Processed: " + input

	return output
}

// Main function required by TinyGo
func main() {
	// Register functions to be called from JavaScript
	js.Global().Set("processData", js.FuncOf(processData))

	// Keep the program running
	c := make(chan struct{}, 0)
	<-c
}
