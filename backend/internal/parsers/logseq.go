package parsers

import (
	"io"
	"regexp"
	"strings"
)

type LogseqParser struct {
	blockRegex *regexp.Regexp
	tagRegex   *regexp.Regexp
}

func NewLogseqParser() *LogseqParser {
	return &LogseqParser{
		blockRegex: regexp.MustCompile(`^(\s*)-\s+(.+)$`),
		tagRegex:   regexp.MustCompile(`#[\w-]+`),
	}
}

func (p *LogseqParser) Parse(file io.Reader, filename string) ([]string, map[string]interface{}, error) {
	// Read entire file content
	content, err := io.ReadAll(file)
	if err != nil {
		return nil, nil, err
	}

	text := string(content)
	metadata := make(map[string]interface{})

	// Extract title from filename
	title := strings.TrimSuffix(filename, ".md")
	metadata["title"] = title
	metadata["original_path"] = filename

	// Extract tags from the entire content
	var tags []string
	if matches := p.tagRegex.FindAllString(text, -1); matches != nil {
		tags = append(tags, matches...)
	}

	// Deduplicate tags
	tagSet := make(map[string]bool)
	for _, tag := range tags {
		tagSet[strings.TrimPrefix(tag, "#")] = true
	}

	uniqueTags := make([]string, 0, len(tagSet))
	for tag := range tagSet {
		uniqueTags = append(uniqueTags, tag)
	}
	metadata["tags"] = uniqueTags

	// Use paragraph-based chunking with minimum 100 words per chunk
	chunks := ChunkByParagraphs(text, 100)

	return chunks, metadata, nil
}
