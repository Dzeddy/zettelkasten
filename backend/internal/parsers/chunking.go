package parsers

import (
	"strings"
	"unicode"
)

// ChunkByParagraphs splits text into chunks where each chunk is a paragraph
// or combination of paragraphs that contains at least minWords words
func ChunkByParagraphs(text string, minWords int) []string {
	if minWords <= 0 {
		minWords = 100 // default minimum
	}

	// Split text into paragraphs (double newlines or more)
	paragraphs := splitIntoParagraphs(text)

	var chunks []string
	var currentChunk strings.Builder
	currentWordCount := 0

	for _, paragraph := range paragraphs {
		paragraph = strings.TrimSpace(paragraph)
		if paragraph == "" {
			continue
		}

		wordCount := countWords(paragraph)

		// If adding this paragraph would exceed reasonable chunk size (3000 chars),
		// finalize current chunk and start new one
		if currentChunk.Len() > 0 && currentChunk.Len()+len(paragraph) > 3000 {
			chunks = append(chunks, strings.TrimSpace(currentChunk.String()))
			currentChunk.Reset()
			currentWordCount = 0
		}

		// Add paragraph to current chunk
		if currentChunk.Len() > 0 {
			currentChunk.WriteString("\n\n")
		}
		currentChunk.WriteString(paragraph)
		currentWordCount += wordCount

		// If we have enough words, finalize this chunk
		if currentWordCount >= minWords {
			chunks = append(chunks, strings.TrimSpace(currentChunk.String()))
			currentChunk.Reset()
			currentWordCount = 0
		}
	}

	// Add any remaining content as final chunk
	if currentChunk.Len() > 0 {
		chunks = append(chunks, strings.TrimSpace(currentChunk.String()))
	}

	return chunks
}

// splitIntoParagraphs splits text by double newlines or more
func splitIntoParagraphs(text string) []string {
	// Normalize line endings
	text = strings.ReplaceAll(text, "\r\n", "\n")
	text = strings.ReplaceAll(text, "\r", "\n")

	// Split by double newlines or more
	paragraphs := strings.Split(text, "\n\n")

	var result []string
	for _, p := range paragraphs {
		// Further split if there are multiple consecutive newlines
		subParagraphs := strings.Split(p, "\n\n\n")
		for _, sp := range subParagraphs {
			trimmed := strings.TrimSpace(sp)
			if trimmed != "" {
				result = append(result, trimmed)
			}
		}
	}

	return result
}

// countWords counts the number of words in a text
func countWords(text string) int {
	if text == "" {
		return 0
	}

	words := 0
	inWord := false

	for _, r := range text {
		if unicode.IsSpace(r) || unicode.IsPunct(r) {
			if inWord {
				words++
				inWord = false
			}
		} else {
			inWord = true
		}
	}

	// Count the last word if text doesn't end with space/punct
	if inWord {
		words++
	}

	return words
}
