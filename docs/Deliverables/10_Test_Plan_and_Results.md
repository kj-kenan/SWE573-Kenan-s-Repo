# 10. Test Plan and Results

## 10.1 Test Strategy

Testing for The Hive was conducted using a comprehensive two-tier approach:

- **Automated Unit Testing**: 46 tests validating backend models, business logic, and data integrity using Django's testing framework
- **Manual User Acceptance Testing**: 93 test cases executed on the deployed system to verify end-to-end workflows and requirements compliance

This combined approach ensures both technical correctness at the code level and functional accuracy from the user perspective.

---

## 10.2 Automated Unit Testing

Unit tests were implemented using Django's built-in testing framework. All tests execute against an isolated test database and validate core business logic, model behavior, and data integrity.

**Test Suite Status**: ✅ 46/46 Tests Passing  
**Execution Time**: ~130 seconds  
**Framework**: Django TestCase

---

### 10.2.1 User & Profile Tests (7 tests)

**File**: `backend/core/tests/test_user_profile.py`  
**Status**: ✅ All Passing

#### Test Case 1: Profile Created Automatically

- **Test ID**: `test_profile_created_automatically_on_user_creation`
- **Purpose**: Verify that when a User is created, a UserProfile is automatically created via Django signal
- **Steps**:
  - Creates a new User with username, email, password
  - Checks that a UserProfile exists for that user
  - Verifies the profile is correctly linked to the user
- **Expected Result**: Profile exists and is linked to user
- **Result**: ✅ PASS

#### Test Case 2: Initial TimeBank Balance

- **Test ID**: `test_new_user_receives_initial_timebank_balance`
- **Purpose**: New users should receive an initial balance of 3 beellars
- **Steps**:
  - Creates a new user
  - Checks the automatically created profile's balance
  - Verifies it equals 3 beellars
- **Expected Result**: Balance = 3 beellars
- **Result**: ✅ PASS

#### Test Case 3: Profile Default Values

- **Test ID**: `test_profile_has_correct_default_values`
- **Purpose**: Verify UserProfile has sensible defaults when created
- **Steps**:
  - Creates a user
  - Checks all default field values
  - Verifies: balance=3, bio='', skills='', is_visible=True, email_verified=False
- **Expected Result**: All defaults correct
- **Result**: ✅ PASS

#### Test Case 4: Profile Fields Update

- **Test ID**: `test_profile_fields_can_be_updated`
- **Purpose**: Profile fields should be updatable and persist to database
- **Steps**:
  - Creates a user
  - Updates profile fields (bio, skills, interests, location)
  - Saves and reloads from database
  - Verifies updates persisted
- **Expected Result**: Updates saved to database
- **Result**: ✅ PASS

#### Test Case 5: Average Rating (No Ratings)

- **Test ID**: `test_average_rating_with_no_ratings`
- **Purpose**: Users with no ratings should have average_rating = 0.0
- **Expected Result**: average_rating = 0.0
- **Result**: ✅ PASS

#### Test Case 6: Username Property Access

- **Test ID**: `test_profile_username_property`
- **Purpose**: Profile should provide easy access to username
- **Expected Result**: Username accessible via profile
- **Result**: ✅ PASS

#### Test Case 7: User Profile Model Integrity

- **Purpose**: Verify overall UserProfile model integrity
- **Result**: ✅ PASS

---

### 10.2.2 Offer Tests (10 tests)

**File**: `backend/core/tests/test_offers.py`  
**Status**: ✅ All Passing

#### Test Case 7: Create Basic Offer

- **Test ID**: `test_create_basic_offer`
- **Purpose**: Should be able to create an offer with required fields
- **Steps**:
  - Creates a user (offer owner)
  - Creates an offer with: title, description, duration, location
  - Verifies offer was created with correct attributes
- **Expected Result**: Offer created successfully
- **Result**: ✅ PASS

#### Test Case 8: Offer Has Correct Owner

- **Test ID**: `test_offer_has_correct_owner`
- **Purpose**: Offer should be correctly linked to its creator
- **Expected Result**: Offer linked to correct user
- **Result**: ✅ PASS

#### Test Case 9: Offer Default Status

- **Test ID**: `test_offer_default_status_is_open`
- **Purpose**: New offers should have status 'open' by default
- **Expected Result**: status = 'open'
- **Result**: ✅ PASS

#### Test Case 10: Offer With Tags

- **Test ID**: `test_offer_with_tags`
- **Purpose**: Offers should support tags stored as JSONField
- **Steps**:
  - Creates an offer with tags ['cooking', 'food', 'teaching']
  - Verifies tags are stored correctly
- **Expected Result**: Tags stored as list
- **Result**: ✅ PASS

#### Test Case 11: Offer With Future Date

- **Test ID**: `test_offer_with_future_date`
- **Purpose**: Offers can have a scheduled date in the future
- **Expected Result**: Future date stored
- **Result**: ✅ PASS

#### Test Case 12: Offer With Available Slots

- **Test ID**: `test_offer_with_available_slots`
- **Purpose**: Offers can have available time slots (JSONField)
- **Expected Result**: Slots stored as JSON
- **Result**: ✅ PASS

#### Test Case 13: Max Participants

- **Test ID**: `test_offer_can_have_max_participants`
- **Purpose**: Offers can limit the number of participants
- **Expected Result**: max_participants = 5
- **Result**: ✅ PASS

#### Test Case 14: Single Participant Default

- **Test ID**: `test_single_participant_offer_by_default`
- **Purpose**: Default behavior for max_participants
- **Expected Result**: None or 1
- **Result**: ✅ PASS

#### Test Case 15: Query Offers By User

- **Test ID**: `test_query_offers_by_user`
- **Purpose**: Should be able to filter offers by creator
- **Expected Result**: User1: 2 offers, User2: 1 offer
- **Result**: ✅ PASS

#### Test Case 16: Query Open Offers

- **Test ID**: `test_query_open_offers`
- **Purpose**: Should be able to filter offers by status
- **Expected Result**: Only open offers returned
- **Result**: ✅ PASS

---

### 10.2.3 TimeBank Tests (12 tests)

**File**: `backend/core/tests/test_timebank.py`  
**Status**: ✅ All Passing

#### Test Case 17: New User Starts With 3 Beellars

- **Test ID**: `test_new_user_starts_with_3_beellars`
- **Purpose**: Every new user should start with 3 beellars in their timebank
- **Expected Result**: Balance = 3
- **Result**: ✅ PASS

#### Test Case 18: Balance Can Be Updated

- **Test ID**: `test_balance_can_be_updated`
- **Purpose**: Profile balance should be updatable
- **Steps**:
  - Creates user (starts with 3)
  - Adds 5 beellars
  - Verifies balance = 8
- **Expected Result**: Balance updates (3 + 5 = 8)
- **Result**: ✅ PASS

#### Test Case 19: Balance Can Increase

- **Test ID**: `test_balance_can_increase`
- **Purpose**: Balance can increase when user provides services
- **Result**: ✅ PASS

#### Test Case 20: Independent Balances

- **Test ID**: `test_multiple_users_have_independent_balances`
- **Purpose**: Each user should have their own independent balance
- **Expected Result**: User2 balance unchanged when User1 balance modified
- **Result**: ✅ PASS

#### Test Case 21: Create Transaction Between Users

- **Test ID**: `test_create_transaction_between_users`
- **Purpose**: Should be able to create a transaction recording transfer of beellars
- **Expected Result**: Transaction created with correct sender/receiver/amount
- **Result**: ✅ PASS

#### Test Case 22: Transaction Has Timestamp

- **Test ID**: `test_transaction_has_timestamp`
- **Purpose**: Transactions should automatically record creation timestamp
- **Expected Result**: Timestamp exists
- **Result**: ✅ PASS

#### Test Case 23: Handshake Creation Doesn't Change Balance

- **Test ID**: `test_handshake_creation_doesnt_change_balance`
- **Purpose**: Creating/accepting a handshake should NOT yet change balances
- **Expected Result**: Balances unchanged until completion
- **Result**: ✅ PASS

#### Test Case 24: Balance Changes After Service Completion

- **Test ID**: `test_balance_changes_after_service_completion`
- **Purpose**: After BOTH parties confirm completion, balances should update
- **Steps**:
  - Creates completed handshake (2 hours)
  - Provider gains 2 hours (3 → 5)
  - Seeker loses 2 hours (3 → 1)
- **Expected Result**: Provider: +2, Seeker: -2
- **Result**: ✅ PASS

#### Test Case 25: Multi-Participant Balance Distribution

- **Test ID**: `test_multi_participant_offer_balance_distribution`
- **Purpose**: For multi-participant offers, provider receives from each seeker
- **Steps**:
  - Creates group offer (1 hour, max 3 participants)
  - 2 seekers complete the service
  - Provider gains 1 hour from each = 2 hours total
  - Each seeker loses 1 hour
- **Expected Result**: Provider: +2, Each seeker: -1
- **Result**: ✅ PASS

#### Test Case 26: Balance Cannot Go Negative

- **Test ID**: `test_balance_cannot_go_negative`
- **Purpose**: Users cannot have negative balance (PositiveIntegerField constraint)
- **Expected Result**: Balance = 0 (minimum)
- **Result**: ✅ PASS

#### Test Case 27: Balance Can Be Very Large

- **Test ID**: `test_balance_can_be_very_large`
- **Purpose**: Balance can grow to large positive values
- **Expected Result**: Balance = 1000
- **Result**: ✅ PASS

#### Test Case 28: Balance Can Be Zero

- **Test ID**: `test_balance_starts_at_zero_when_depleted`
- **Purpose**: Balance can be reduced to zero
- **Expected Result**: Balance = 0
- **Result**: ✅ PASS

---

### 10.2.4 Handshake Tests (15 tests)

**File**: `backend/core/tests/test_handshake.py`  
**Status**: ✅ All Passing

#### Test Case 29: Create Handshake

- **Test ID**: `test_create_handshake`
- **Purpose**: Should be able to create a handshake linking offer, provider, and seeker
- **Expected Result**: Handshake created with correct links
- **Result**: ✅ PASS

#### Test Case 30: Handshake Default Status

- **Test ID**: `test_handshake_default_status_is_proposed`
- **Purpose**: New handshakes should default to 'proposed' status
- **Expected Result**: status = 'proposed'
- **Result**: ✅ PASS

#### Test Case 31: Handshake Hours Match Offer

- **Test ID**: `test_handshake_hours_match_offer_duration`
- **Purpose**: Handshake hours should typically match the offer duration
- **Expected Result**: Hours match duration
- **Result**: ✅ PASS

#### Test Case 32: Transition Proposed to Accepted

- **Test ID**: `test_transition_from_proposed_to_accepted`
- **Purpose**: Provider can accept a proposed handshake
- **Expected Result**: Status = 'accepted'
- **Result**: ✅ PASS

#### Test Case 33: Transition to In Progress

- **Test ID**: `test_transition_to_in_progress`
- **Purpose**: Accepted handshake can move to in_progress
- **Expected Result**: Status = 'in_progress'
- **Result**: ✅ PASS

#### Test Case 34: Transition to Completed

- **Test ID**: `test_transition_to_completed`
- **Purpose**: In-progress handshake can be marked as completed
- **Expected Result**: Status = 'completed'
- **Result**: ✅ PASS

#### Test Case 35: Handshake Can Be Rejected

- **Test ID**: `test_handshake_can_be_rejected`
- **Purpose**: Provider can reject a proposed handshake
- **Expected Result**: Status = 'rejected'
- **Result**: ✅ PASS

#### Test Case 36: Initial Confirmation State

- **Test ID**: `test_initial_confirmation_state`
- **Purpose**: New handshakes should have both confirmations as False
- **Expected Result**: Both False
- **Result**: ✅ PASS

#### Test Case 37: Provider Can Confirm

- **Test ID**: `test_provider_can_confirm`
- **Purpose**: Provider can confirm service completion
- **Expected Result**: Provider: True, Seeker: False
- **Result**: ✅ PASS

#### Test Case 38: Seeker Can Confirm

- **Test ID**: `test_seeker_can_confirm`
- **Purpose**: Seeker can confirm service completion
- **Expected Result**: Seeker: True, Provider: False
- **Result**: ✅ PASS

#### Test Case 39: Both Parties Can Confirm

- **Test ID**: `test_both_parties_can_confirm`
- **Purpose**: Both provider and seeker can confirm
- **Expected Result**: Both True
- **Result**: ✅ PASS

#### Test Case 40: Status Changes After Both Confirm

- **Test ID**: `test_status_changes_to_completed_after_both_confirm`
- **Purpose**: When both parties confirm, status should become 'completed'
- **Expected Result**: Completed with both confirmations
- **Result**: ✅ PASS

#### Test Case 41: Query Handshakes By Offer

- **Test ID**: `test_query_handshakes_by_offer`
- **Purpose**: Should be able to get all handshakes for a specific offer
- **Expected Result**: 2 handshakes found
- **Result**: ✅ PASS

#### Test Case 42: Query Handshakes By Seeker

- **Test ID**: `test_query_handshakes_by_seeker`
- **Purpose**: Should be able to get all handshakes where user is seeker
- **Expected Result**: Seeker's handshakes found
- **Result**: ✅ PASS

#### Test Case 43: Query Handshakes By Provider

- **Test ID**: `test_query_handshakes_by_provider`
- **Purpose**: Should be able to get all handshakes where user is provider
- **Expected Result**: Provider's handshakes found
- **Result**: ✅ PASS

#### Test Case 44: Query Handshakes By Status

- **Test ID**: `test_query_handshakes_by_status`
- **Purpose**: Should be able to filter handshakes by status
- **Expected Result**: Filtered correctly
- **Result**: ✅ PASS

#### Test Case 45: Multiple Handshakes for Same Offer

- **Test ID**: `test_multiple_handshakes_for_same_offer`
- **Purpose**: Multi-participant offers can have multiple handshakes
- **Expected Result**: 3 handshakes for one offer
- **Result**: ✅ PASS

#### Test Case 46: Each Handshake Is Independent

- **Test ID**: `test_each_handshake_is_independent`
- **Purpose**: Each handshake in a multi-participant offer is independent
- **Expected Result**: Independent statuses
- **Result**: ✅ PASS

---

### 10.2.5 Unit Test Execution Summary

**Total**: 46 | **Passed**: 46 | **Failed**: 0  
**Status**: ✅ All tests passing

**Summary by Category**:
- User & Profile Tests: 7/7 ✅
- Offer Tests: 10/10 ✅
- TimeBank Tests: 12/12 ✅
- Handshake Tests: 15/15 ✅
- Integration Tests: 2/2 ✅

---

## 10.3 User Acceptance Testing

User acceptance tests were executed manually on the deployed system to validate end-to-end functionality and requirements compliance. A total of 93 test cases were performed across 7 functional categories.

### 10.3.1 User Management (17 tests)
**Status**: ✅ All Passing

### 10.3.2 Email & Verification (13 tests)
**Status**: ✅ All Passing

### 10.3.3 Post Management (18 tests)
**Status**: ✅ All Passing

### 10.3.4 Map & Discovery (13 tests)
**Status**: ✅ All Passing

### 10.3.5 Handshake & Interaction (18 tests)
**Status**: ✅ All Passing

### 10.3.6 TimeBank System (11 tests)
**Status**: ✅ All Passing

### 10.3.7 Community Forum (3 tests)
**Status**: ✅ All Passing

---

**Overall UAT Summary**: 93/93 tests passed ✅
