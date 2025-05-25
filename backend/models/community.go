package models

import (
	"time"

	"github.com/google/uuid"
)

type Community struct {
	ID          uuid.UUID `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Location    Location  `json:"location"`
	ImageURL    string    `json:"image_url,omitempty"`
	Type        string    `json:"type"` // General, Location-based, Women-only, Beginners, etc.
	Members     []Member  `json:"members,omitempty"`
	Messages    []Message `json:"messages,omitempty"`
	CreatedBy   uuid.UUID `json:"created_by"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Member represents a user who is a member of a community
type Member struct {
	ID          uuid.UUID `json:"id"`
	CommunityID uuid.UUID `json:"community_id"`
	UserID      uuid.UUID `json:"user_id"`
	UserName    string    `json:"user_name"`
	Role        string    `json:"role"` // Admin, Moderator, Member
	JoinedAt    time.Time `json:"joined_at"`
}

// Message represents a message posted in a community
type Message struct {
	ID          uuid.UUID  `json:"id"`
	CommunityID uuid.UUID  `json:"community_id"`
	UserID      uuid.UUID  `json:"user_id"`
	UserName    string     `json:"user_name"`
	Content     string     `json:"content"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	ReplyTo     *uuid.UUID `json:"reply_to,omitempty"`
}

// HasMember checks if a user is a member of the community
func (c *Community) HasMember(userID uuid.UUID) bool {
	for _, member := range c.Members {
		if member.UserID == userID {
			return true
		}
	}
	return false
}

// AddMember adds a new member to the community
func (c *Community) AddMember(userID uuid.UUID, userName string) {
	if c.HasMember(userID) {
		return
	}

	newMember := Member{
		ID:          uuid.New(),
		CommunityID: c.ID,
		UserID:      userID,
		UserName:    userName,
		Role:        "Member",
		JoinedAt:    time.Now(),
	}

	c.Members = append(c.Members, newMember)
}

// AddMessage adds a new message to the community
func (c *Community) AddMessage(userID uuid.UUID, userName string, content string, replyTo *uuid.UUID) Message {
	newMessage := Message{
		ID:          uuid.New(),
		CommunityID: c.ID,
		UserID:      userID,
		UserName:    userName,
		Content:     content,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		ReplyTo:     replyTo,
	}

	c.Messages = append(c.Messages, newMessage)
	return newMessage
}
