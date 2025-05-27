package parsers

import (
	"encoding/json"
	"io"
)

type NotionParser struct{}

func NewNotionParser() *NotionParser {
	return &NotionParser{}
}

func (p *NotionParser) Parse(file io.Reader, filename string) ([]string, map[string]interface{}, error) {
	var notionData map[string]interface{}
	if err := json.NewDecoder(file).Decode(&notionData); err != nil {
		return nil, nil, err
	}

	var chunks []string
	metadata := make(map[string]interface{})

	// Extract title
	if title, ok := notionData["title"].(string); ok {
		metadata["title"] = title
	} else {
		metadata["title"] = filename
	}
	metadata["original_path"] = filename

	// Extract content
	if content, ok := notionData["content"].(string); ok {
		chunks = ChunkByParagraphs(content, 100)
	}

	// Extract tags if available
	if tags, ok := notionData["tags"].([]interface{}); ok {
		var tagStrings []string
		for _, tag := range tags {
			if tagStr, ok := tag.(string); ok {
				tagStrings = append(tagStrings, tagStr)
			}
		}
		metadata["tags"] = tagStrings
	}

	return chunks, metadata, nil
}
