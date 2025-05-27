package parsers

import (
	"encoding/json"
	"io"
	"strings"
)

type RoamParser struct{}

func NewRoamParser() *RoamParser {
	return &RoamParser{}
}

func (p *RoamParser) Parse(file io.Reader, filename string) ([]string, map[string]interface{}, error) {
	var roamData []map[string]interface{}
	if err := json.NewDecoder(file).Decode(&roamData); err != nil {
		return nil, nil, err
	}

	metadata := make(map[string]interface{})
	metadata["title"] = filename
	metadata["original_path"] = filename

	// Process all pages and combine into single text
	var allContent strings.Builder
	for _, page := range roamData {
		if _, ok := page["title"].(string); ok {
			pageContent := p.processPage(page)
			allContent.WriteString(pageContent)
			allContent.WriteString("\n\n")
		}
	}

	// Use paragraph-based chunking with minimum 100 words per chunk
	chunks := ChunkByParagraphs(allContent.String(), 100)

	return chunks, metadata, nil
}

func (p *RoamParser) processPage(page map[string]interface{}) string {
	var content strings.Builder

	// Add page title
	if title, ok := page["title"].(string); ok {
		content.WriteString("# " + title + "\n\n")
	}

	// Process children (blocks)
	if children, ok := page["children"].([]interface{}); ok {
		p.processBlocks(children, &content, 0)
	}

	return content.String()
}

func (p *RoamParser) processBlocks(blocks []interface{}, content *strings.Builder, depth int) {
	for _, block := range blocks {
		if blockMap, ok := block.(map[string]interface{}); ok {
			// Add block content
			if str, ok := blockMap["string"].(string); ok {
				indent := strings.Repeat("  ", depth)
				content.WriteString(indent + "- " + str + "\n")
			}

			// Process nested blocks
			if children, ok := blockMap["children"].([]interface{}); ok {
				p.processBlocks(children, content, depth+1)
			}
		}
	}
}
