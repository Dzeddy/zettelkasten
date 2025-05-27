package parsers

import "io"

type Parser interface {
	Parse(file io.Reader, filename string) ([]string, map[string]interface{}, error)
}
