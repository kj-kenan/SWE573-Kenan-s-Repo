# 4. Software Requirements Specification

## 4.1 Introduction
### 4.1.1 Purpose
Define functional and non-functional requirements for The Hive — an open, community-oriented service exchange platform using a TimeBank model ("beellars"). Audience: developers, maintainers, and moderators.
### 4.1.2 Scope
The Hive lets members post Offers/Requests, discover nearby opportunities via an interactive Service Map, match via a mutual Handshake, message, and settle transfers in beellars (1 hour = 1 credit). No commercial payments or ads. Focus: reciprocity, safety, and accessibility.
### 4.1.3 Definitions, Acronyms, Abbreviations
Provider / Seeker: Roles in an exchange (a user may be both)
Offer / Request: Listings to give or receive help
Handshake: Mutual acceptance forming a planned exchange
TimeBank (beellars): 1 hour service = 1 credit
Service Map: Map view of Offers/Requests with privacy controls
The Commons: Community forum outside individual listings
Badge: Profile recognition for milestones
## 4.2 System Constraints
The system must be developed using Django for the backend and React for the frontend
The database must use PostgreSQL for data storage
The platform must run in a Dockerized environment for deployment consistency
All communication between frontend and backend must occur via RESTful APIs
User authentication must follow JWT standards for security
The system must support responsive design for desktop and mobile devices
The application must operate within the hosting provider's free-tier resource limits
Only authenticated users can create or edit offers and needs
## 4.3 Functional Requirements
### 4.3.1 User Management
The system shall allow new users to register with a unique username and password
The system shall verify user credentials during login
The system shall prevent duplicate usernames during registration
The system shall authenticate users using JWT-based tokens
The system shall allow users to edit their profile information (bio, skills, interests, and profile picture)
The system shall allow users to view other users' public profiles
The system shall allow users to delete or deactivate their accounts
The system shall allow administrators to view and manage all registered users
The system shall store and publicly display user ratings and feedback on user profiles
The system shall allow users to view and track their earned badges on their profiles
The system shall only allow users to rate each other after a handshake is fully completed
Ratings shall not be given for posts, questions, or any interaction other than a completed handshake
### 4.3.2 User Email & Verification
The system shall require users to register with a unique and valid email address
The system shall prevent duplicate email addresses during registration
The system shall allow users to reset their passwords via email
The system shall notify users upon successful registration or account changes
The system shall send a verification email containing a secure, time-limited activation token to newly registered users
The system shall require users to verify their email address before allowing login or access to any authenticated features
The system shall store an "email_verified" status flag for each user in the database
The system shall prevent unverified users from logging in until their email has been successfully activated
The system shall provide an endpoint for email verification using a token-based activation link
The verification token shall expire after a predefined time period (e.g., 24 hours)
The system shall allow users to request a new verification email if the token has expired or was not received
After registration, the system shall display a "Check your email to activate your account" confirmation message
The system shall display appropriate success or error messages when a user attempts to verify their email or log in without verification
The system shall notify users upon successful verification of their email address
### 4.3.3 Post Management
The system shall allow users to create new posts for offers and needs
The system shall require a title, description, and semantic tag for each post
The system shall allow users to add fuzzy location data to their posts
The system shall display all posts on the interactive service map
The system shall allow users to edit or delete their own posts
The system shall allow users to filter and search posts by category, tag, or distance
The system shall ensure only authenticated users can create, edit, or delete posts
The system shall mark completed posts as inactive after a successful handshake
The system shall prevent empty or duplicate posts from being submitted
The system shall allow administrators to remove or hide inappropriate posts
The system shall allow users to specify their available time slots when creating or editing an offer or need post
The system shall visually distinguish posts owned by the logged-in user in public listings
The system shall display owner-specific controls (Edit, Delete, Answer Questions, Manage Handshake) only on posts created by the logged-in user
The system shall rename the navigation item "Offers & Needs" to "Offers & Requests"
The system shall provide secure API endpoints for editing and deleting posts
The system shall allow offer creators to specify a maximum number of participants when creating or editing an offer
The system shall not allow participant limits to be set for requests
The system shall display remaining participant slots for offers
### 4.3.4 Map & Discovery
The system shall display all active offers and needs on an interactive map
The system shall represent each post as a fuzzy location on the map
The system shall use different icons or colors to distinguish offers and needs
The system shall allow users to click an icon to view post details
The system shall allow users to filter visible markers by category or distance
The system shall automatically update the map when new posts are created or removed
The system shall support zooming and panning interactions
The system shall allow users to filter map markers by tag, category, and distance
The system shall provide a distance slider on the map to limit visible posts based on proximity to the user's current location
The system shall update all map markers dynamically when filters change
### 4.3.5 Handshake and Interaction
The system shall allow a user to send a handshake request to another user's post
The system shall notify the recipient when a handshake request is received
The system shall allow the recipient to accept or decline a handshake request
The system shall mark a post as "in progress" once a handshake is accepted
The system shall mark a post as "completed" after both users confirm service delivery
The system shall automatically transfer Beellar credits upon completion of the handshake
The system shall record all handshake transactions in the database
The system shall allow users to view their active and past handshakes
The system shall display all pre-handshake questions publicly under the related post
The system shall switch the conversation to private mode once a handshake is accepted
The system shall not allow users to ask questions on their own posts
The system shall automatically create a private conversation channel when a handshake is accepted
The system shall allow multiple users to participate in a single offer, up to the defined maximum participant limit
The system shall prevent new handshake requests once the offer's participant limit is reached
### 4.3.6 TimeBank System
The system shall define 1 Beellar as equivalent to 1 hour of service
The system shall only allow whole-hour transactions with no fractional Beellars
The system shall assign Beellar credits to a user after successfully completing a handshake
The system shall deduct Beellar credits from the user who receives the service
The system shall record every credit transaction in a transaction history table
The system shall allow users to view their current Beellar balance within their profile
The system shall prevent transactions that would cause a negative Beellar balance
The system shall initialize every newly registered user with 3 Beellars as a starting balance
The user profile shall display the user's current Beellar balance
The user profile shall display a chronological transaction history
For multi-participant offers, each participant shall spend one Beellar upon service completion
For multi-participant offers, the offer owner shall earn one Beellar total per completed offer, regardless of the number of participants
### 4.3.7 Ratings & Reputation
The system shall allow both users to rate each other and leave comments after each completed handshake
The system shall store and publicly display user ratings and feedback on profiles
The system shall allow users to view and track their earned badges
### 4.3.8 Communication and Forum
The system shall allow users to send direct messages after a handshake is established
The system shall include a community forum where users can post public discussions
The system shall allow users to create new topics and reply to existing ones
The system shall allow administrators to moderate forum content and remove inappropriate posts
The system shall display timestamps and usernames for all forum messages
## 4.4 Non-Functional Requirements
The system shall respond to user requests within 3 seconds under normal load
The system shall use HTTPS for all client–server communication
All passwords shall be securely hashed and never stored in plain text
The system shall be available at least 99% of the time
The user interface shall be responsive and easy to use on both desktop and mobile
The system shall use modular, maintainable code architecture
The application shall run smoothly on all major web browsers
