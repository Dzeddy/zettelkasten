package services

import (
	"context"
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"

	"zettelkasten/internal/database"
	"zettelkasten/internal/models"
)

type AuthService struct {
	db     *mongo.Database
	redis  *database.RedisClient
	secret string
}

func NewAuthService(mongodb *mongo.Client, redis *database.RedisClient, secret string) *AuthService {
	return &AuthService{
		db:     mongodb.Database("zettelkasten"),
		redis:  redis,
		secret: secret,
	}
}

func (s *AuthService) SignUp(ctx context.Context, email, password, name string) (*models.User, error) {
	// Check if user exists
	var existingUser models.User
	err := s.db.Collection("users").FindOne(ctx, bson.M{"email": email}).Decode(&existingUser)
	if err == nil {
		return nil, errors.New("User Already Exists")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	// Create user
	user := &models.User{
		Email:        email,
		PasswordHash: string(hashedPassword),
		Name:         name,
		// EmailVerified: false, // Commented out for now
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
		Preferences: models.UserPreferences{
			DefaultSimilarityThreshold: 0.7,
			ChunkSizePreference:        "medium",
		},
	}

	result, err := s.db.Collection("users").InsertOne(ctx, user)
	if err != nil {
		return nil, err
	}

	user.ID = result.InsertedID.(primitive.ObjectID)

	return user, nil
}

func (s *AuthService) Login(ctx context.Context, email, password string) (string, string, error) {
	var user models.User
	err := s.db.Collection("users").FindOne(ctx, bson.M{"email": email}).Decode(&user)
	if err != nil {
		return "", "", errors.New("Invalid Credentials")
	}

	// Check password
	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
	if err != nil {
		return "", "", errors.New("Invalid Credentials")
	}

	// Check email verification - commented out for now
	// if !user.EmailVerified {
	// 	return "", "", errors.New("Email not verified")
	// }

	// Generate tokens
	accessToken, err := s.generateAccessToken(&user)
	if err != nil {
		return "", "", err
	}

	refreshToken, err := s.generateRefreshToken(&user)
	if err != nil {
		return "", "", err
	}

	return accessToken, refreshToken, nil
}

func (s *AuthService) VerifyEmail(ctx context.Context, token string) error {
	// In a real implementation, you would validate the token
	// For now, we'll just mark the user as verified
	return nil
}

func (s *AuthService) GetUserByID(ctx context.Context, userID string) (*models.User, error) {
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return nil, err
	}

	var user models.User
	err = s.db.Collection("users").FindOne(ctx, bson.M{"_id": objectID}).Decode(&user)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (s *AuthService) UpdateUser(ctx context.Context, userID string, updates bson.M) error {
	objectID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		return err
	}

	updates["updated_at"] = time.Now()
	_, err = s.db.Collection("users").UpdateOne(ctx, bson.M{"_id": objectID}, bson.M{"$set": updates})
	return err
}

func (s *AuthService) generateAccessToken(user *models.User) (string, error) {
	claims := jwt.MapClaims{
		"user_id": user.ID.Hex(),
		"email":   user.Email,
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.secret))
}

func (s *AuthService) generateRefreshToken(user *models.User) (string, error) {
	claims := jwt.MapClaims{
		"user_id": user.ID.Hex(),
		"type":    "refresh",
		"exp":     time.Now().Add(time.Hour * 24 * 7).Unix(), // 7 days
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.secret))
}
