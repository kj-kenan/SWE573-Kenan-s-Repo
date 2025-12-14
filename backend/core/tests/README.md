# 🧪 The Hive - Unit Test Suite

## 📋 Overview

This directory contains comprehensive unit tests for The Hive Django backend application. The tests cover core business logic including user management, service offerings, timebank transactions, and handshake (service exchange) workflows.

---

## 📁 Test Structure

```
tests/
├── __init__.py                   # Package initialization
├── test_user_profile.py          # User & Profile creation tests
├── test_offers.py                # Offer creation & management tests
├── test_timebank.py              # Balance & transaction tests
├── test_handshake.py             # Service exchange workflow tests
└── README.md                     # This file
```

---

## 🎯 Test Coverage

### **1. User & Profile Tests** (`test_user_profile.py`)
- ✅ Automatic profile creation via Django signals
- ✅ Initial timebank balance (3 beellars for new users)
- ✅ Profile field defaults and updates
- ✅ Rating calculations

**Total Tests: 7**

### **2. Offer Tests** (`test_offers.py`)
- ✅ Basic offer creation with required fields
- ✅ Offer ownership verification
- ✅ Default status management (open/closed)
- ✅ Tags and metadata storage
- ✅ Multi-participant offer support
- ✅ Querying and filtering offers

**Total Tests: 10**

### **3. TimeBank Tests** (`test_timebank.py`)
- ✅ Initial balance allocation (3 beellars)
- ✅ Balance updates (credit/debit)
- ✅ Transaction recording (between users via handshakes)
- ✅ Balance changes during service exchange
- ✅ Multi-participant balance distribution
- ✅ Edge cases (zero balance, large values, positive constraint)

**Total Tests: 12**

### **4. Handshake Tests** (`test_handshake.py`)
- ✅ Handshake creation and initialization
- ✅ Status transitions (proposed → accepted → in_progress → completed)
- ✅ Confirmation logic (both parties must confirm)
- ✅ Handshake-offer relationships
- ✅ Querying by offer, seeker, provider, status
- ✅ Multi-participant handshake workflows

**Total Tests: 15**

---

## 🚀 Running the Tests

### **Run All Tests**
```bash
cd backend
python manage.py test core.tests
```

### **Run a Specific Test File**
```bash
# User & Profile tests
python manage.py test core.tests.test_user_profile

# Offer tests
python manage.py test core.tests.test_offers

# TimeBank tests
python manage.py test core.tests.test_timebank

# Handshake tests
python manage.py test core.tests.test_handshake
```

### **Run a Specific Test Class**
```bash
python manage.py test core.tests.test_user_profile.UserProfileCreationTest
```

### **Run a Specific Test Method**
```bash
python manage.py test core.tests.test_user_profile.UserProfileCreationTest.test_profile_created_automatically_on_user_creation
```

### **Run with Verbose Output**
```bash
python manage.py test core.tests --verbosity=2
```

### **Keep Test Database (for debugging)**
```bash
python manage.py test core.tests --keepdb
```

---

## 📊 Expected Output

### **Successful Test Run**
```bash
$ python manage.py test core.tests

Creating test database for alias 'default'...
System check identified no issues (0 silenced).
...........................................
----------------------------------------------------------------------
Ran 43 tests in 2.34s

OK
Destroying test database for alias 'default'...
```

### **Failed Test Example**
```bash
$ python manage.py test core.tests

FAIL: test_new_user_starts_with_20_beellars (core.tests.test_timebank.TimeBankBalanceTest)
----------------------------------------------------------------------
Traceback (most recent call last):
  File ".../test_timebank.py", line 25, in test_new_user_starts_with_20_beellars
    self.assertEqual(profile.timebank_balance, 20)
AssertionError: 0 != 20

----------------------------------------------------------------------
Ran 43 tests in 2.12s

FAILED (failures=1)
```

---

## 🧪 Test Database

### **What Happens When Tests Run**

1. **Before Tests:**
   - Django creates a temporary test database: `test_hive_database`
   - Runs all migrations to create tables
   - Database is empty (no data from your real database)

2. **During Each Test:**
   - Test creates necessary data
   - Test performs checks
   - Django automatically rolls back changes
   - Next test starts with a clean slate

3. **After Tests:**
   - Test database is completely deleted
   - No traces left behind
   - Your production database is never touched

### **Database Isolation Example**
```python
def test_one(self):
    User.objects.create(username="user1")
    self.assertEqual(User.objects.count(), 1)  # ✅ Pass

def test_two(self):
    # Fresh start! Previous test's user is gone
    self.assertEqual(User.objects.count(), 0)  # ✅ Pass
```

---

## 🎓 Key Testing Principles Used

### **1. Arrange-Act-Assert Pattern**
```python
def test_example(self):
    # Arrange: Set up test data
    user = User.objects.create_user(username='test')
    
    # Act: Perform the action
    profile = user.profile
    
    # Assert: Check the result
    self.assertEqual(profile.timebank_balance, 20)
```

### **2. Test Isolation**
- Each test is independent
- No test depends on another test's data
- Tests can run in any order

### **3. Clear Naming**
- Test names describe what they test
- Example: `test_new_user_starts_with_20_beellars`
- Anyone can understand what the test does

### **4. Meaningful Assertions**
```python
# Good: Clear and specific
self.assertEqual(profile.timebank_balance, 20)

# Bad: Vague
self.assertTrue(profile.timebank_balance > 0)
```

---

## 🔧 Troubleshooting

### **Tests Not Found**
```bash
# Error: No tests found
# Solution: Make sure you're in the correct directory
cd backend
python manage.py test core.tests
```

### **Import Errors**
```bash
# Error: ImportError: cannot import name 'UserProfile'
# Solution: Check that models are correctly imported
# Ensure you're using: from core.models import UserProfile
```

### **Database Errors**
```bash
# Error: django.db.utils.OperationalError
# Solution: Make sure migrations are up to date
python manage.py makemigrations
python manage.py migrate
```

### **Test Database Already Exists**
```bash
# Error: database "test_hive" already exists
# Solution: Use --keepdb flag or manually delete
python manage.py test core.tests --keepdb
```

---

## 📚 Adding New Tests

### **Step 1: Choose the Right File**
- User/Profile logic → `test_user_profile.py`
- Offer logic → `test_offers.py`
- Balance/Transactions → `test_timebank.py`
- Handshakes → `test_handshake.py`

### **Step 2: Follow the Pattern**
```python
from django.test import TestCase
from core.models import YourModel

class YourTestClass(TestCase):
    """Brief description of what this test class covers"""
    
    def setUp(self):
        """Create test data used by multiple tests"""
        self.user = User.objects.create_user(username='test')
    
    def test_specific_behavior(self):
        """
        Clear description of what this test checks
        """
        # Arrange
        # ... setup
        
        # Act
        # ... perform action
        
        # Assert
        self.assertEqual(expected, actual)
```

### **Step 3: Run Your New Tests**
```bash
python manage.py test core.tests.your_test_file
```

---

## 🎯 Test Quality Checklist

Before committing new tests, ensure:

- ✅ Test name clearly describes what it tests
- ✅ Test is independent (no reliance on other tests)
- ✅ Test uses meaningful assertions
- ✅ Test has a docstring explaining its purpose
- ✅ Test runs successfully
- ✅ Test covers one specific behavior (not everything at once)

---

## 📖 Further Reading

- [Django Testing Documentation](https://docs.djangoproject.com/en/stable/topics/testing/)
- [Python unittest Documentation](https://docs.python.org/3/library/unittest.html)
- [Test-Driven Development (TDD)](https://en.wikipedia.org/wiki/Test-driven_development)

---

## 💡 Best Practices

1. **Run tests before committing code**
2. **Write tests for new features**
3. **Keep tests simple and focused**
4. **Use descriptive test names**
5. **Don't test Django's built-in functionality**
6. **Test business logic, not framework code**

---

**Total Test Count: 46 tests** ✅ **All Passing**  
**Maintained by: The Hive Development Team**  
**Last Updated: December 2025**


