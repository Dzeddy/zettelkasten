package parsers

import (
	"strings"
	"testing"
)

func TestChunkByParagraphs(t *testing.T) {
	tests := []struct {
		name     string
		text     string
		minWords int
		expected int // expected number of chunks
	}{
		{
			name:     "Single short paragraph",
			text:     "This is a short paragraph with only ten words in it.",
			minWords: 100,
			expected: 1, // Should still create one chunk even if under 100 words
		},
		{
			name: "Multiple short paragraphs that combine",
			text: `This is the first paragraph with some words.

This is the second paragraph with more words to add.

This is the third paragraph that should combine with the others to reach the minimum word count of one hundred words total.`,
			minWords: 100,
			expected: 1, // Should combine into one chunk
		},
		{
			name:     "Long paragraph that exceeds minimum",
			text:     strings.Repeat("This is a sentence with exactly ten words in it. ", 15), // 150 words
			minWords: 100,
			expected: 1, // Should be one chunk since it's one paragraph
		},
		{
			name: "Multiple paragraphs that should be separate chunks",
			text: strings.Repeat("This is a sentence with exactly ten words in it. ", 15) + "\n\n" +
				strings.Repeat("This is another sentence with exactly ten words too. ", 15), // 150 + 150 words
			minWords: 100,
			expected: 2, // Should be two chunks
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			chunks := ChunkByParagraphs(tt.text, tt.minWords)
			if len(chunks) != tt.expected {
				t.Errorf("ChunkByParagraphs() = %d chunks, want %d chunks", len(chunks), tt.expected)
			}

			// Verify each chunk has content
			for i, chunk := range chunks {
				if strings.TrimSpace(chunk) == "" {
					t.Errorf("Chunk %d is empty", i)
				}
			}
		})
	}
}

func TestCountWords(t *testing.T) {
	tests := []struct {
		name     string
		text     string
		expected int
	}{
		{
			name:     "Empty string",
			text:     "",
			expected: 0,
		},
		{
			name:     "Single word",
			text:     "hello",
			expected: 1,
		},
		{
			name:     "Multiple words",
			text:     "hello world test",
			expected: 3,
		},
		{
			name:     "Words with punctuation",
			text:     "Hello, world! How are you?",
			expected: 5,
		},
		{
			name:     "Words with extra spaces",
			text:     "  hello   world  test  ",
			expected: 3,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := countWords(tt.text)
			if result != tt.expected {
				t.Errorf("countWords(%q) = %d, want %d", tt.text, result, tt.expected)
			}
		})
	}
}
