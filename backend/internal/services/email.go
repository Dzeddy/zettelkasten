package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type EmailService struct {
	apiKey string
	from   string
	client *http.Client
}

func NewEmailService(apiKey, from string) *EmailService {
	return &EmailService{
		apiKey: apiKey,
		from:   from,
		client: &http.Client{Timeout: 10 * time.Second},
	}
}

func (s *EmailService) SendVerificationEmail(to, token string) error {
	subject := "Verify your email address"
	body := fmt.Sprintf(`
		<h2>Welcome to Zettelkasten!</h2>
		<p>Please click the link below to verify your email address:</p>
		<a href="https://app.zettelkasten.com/verify?token=%s">Verify Email</a>
		<p>If you didn't create an account, you can safely ignore this email.</p>
	`, token)

	return s.sendEmail(to, subject, body)
}

func (s *EmailService) SendPasswordResetEmail(to, token string) error {
	subject := "Reset your password"
	body := fmt.Sprintf(`
		<h2>Password Reset Request</h2>
		<p>Click the link below to reset your password:</p>
		<a href="https://app.zettelkasten.com/reset-password?token=%s">Reset Password</a>
		<p>This link will expire in 1 hour.</p>
		<p>If you didn't request a password reset, you can safely ignore this email.</p>
	`, token)

	return s.sendEmail(to, subject, body)
}

func (s *EmailService) sendEmail(to, subject, body string) error {
	// This is a generic email sending implementation
	// In production, you would use a service like SendGrid, Resend, or AWS SES

	payload := map[string]interface{}{
		"from":    s.from,
		"to":      to,
		"subject": subject,
		"html":    body,
	}

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	// Example using a generic email API endpoint
	req, err := http.NewRequest("POST", "https://api.emailservice.com/send", bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}

	req.Header.Set("Authorization", "Bearer "+s.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("email sending failed with status: %d", resp.StatusCode)
	}

	return nil
}
