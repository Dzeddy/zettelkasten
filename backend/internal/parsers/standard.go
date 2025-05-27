package parsers

import (
	"io"
	"path/filepath"
	"strings"
)

type StandardParser struct{}

func NewStandardParser() *StandardParser {
	return &StandardParser{}
}

func (p *StandardParser) Parse(file io.Reader, filename string) ([]string, map[string]interface{}, error) {
	// Read entire file content
	content, err := io.ReadAll(file)
	if err != nil {
		return nil, nil, err
	}

	text := string(content)
	metadata := make(map[string]interface{})

	// Extract title from filename
	title := filename
	if strings.Contains(filename, ".") {
		title = strings.TrimSuffix(filename, filepath.Ext(filename))
	}
	metadata["title"] = title
	metadata["original_path"] = filename

	// Use paragraph-based chunking with minimum 100 words per chunk
	chunks := ChunkByParagraphs(text, 100)

	return chunks, metadata, nil
}
