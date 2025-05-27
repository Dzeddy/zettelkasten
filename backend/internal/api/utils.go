package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
)

func respondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	response, _ := json.Marshal(payload)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(response)
}

func respondWithError(w http.ResponseWriter, code int, message string) {
	respondWithJSON(w, code, map[string]interface{}{
		"error": map[string]interface{}{
			"message": message,
		},
	})
}

func validateEmail(email string) error {
	regex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	if !regex.MatchString(email) {
		return fmt.Errorf("invalid email format")
	}
	return nil
}

func validatePassword(password string) error {
	if len(password) < 8 {
		return fmt.Errorf("Password must be at least 8 characters long")
	}
	return nil
}

func isValidSourceType(sourceType string) bool {
	validTypes := []string{"notion", "obsidian", "roam", "logseq", "standard"}
	for _, valid := range validTypes {
		if sourceType == valid {
			return true
		}
	}
	return false
}
