# 🚀 Quick Test Reference - The Hive

## ⚡ Most Common Commands

```bash
# Run ALL tests (46 tests)
python manage.py test core.tests

# Run tests with details
python manage.py test core.tests --verbosity=2

# Run specific test file
python manage.py test core.tests.test_user_profile
python manage.py test core.tests.test_offers
python manage.py test core.tests.test_timebank
python manage.py test core.tests.test_handshake
```

---

## 📊 Test Count by File

| File | Tests | Coverage |
|------|-------|----------|
| `test_user_profile.py` | 7 | User & Profile creation |
| `test_offers.py` | 10 | Offer management |
| `test_timebank.py` | 12 | Balance & transactions |
| `test_handshake.py` | 15 | Service exchanges |
| **TOTAL** | **46** | **All passing ✅** |

---

## 🎯 Key Business Rules Verified

```
✅ New users get 3 beellars automatically
✅ Profiles are created via Django signal
✅ Offers start with "open" status
✅ Handshakes track service exchanges
✅ Balance is PositiveIntegerField (≥ 0)
✅ Provider gains hours, seeker loses hours
✅ Both parties must confirm completion
✅ Multi-participant offers supported
```

---

## 🔧 Common Test Patterns

### Create a User
```python
user = User.objects.create_user(username='test', password='pass')
profile = user.profile  # Auto-created via signal
```

### Create an Offer
```python
offer = Offer.objects.create(
    user=provider,
    title="Test Service",
    duration=2,
    latitude=40.0,
    longitude=29.0
)
```

### Create a Handshake
```python
handshake = Handshake.objects.create(
    offer=offer,
    seeker=seeker,
    provider=provider,
    hours=2,
    status='proposed'
)
```

### Assert Balance
```python
self.assertEqual(profile.timebank_balance, 3)  # Initial balance
```

---

## 📁 File Locations

```
backend/core/tests/
├── test_user_profile.py   ← User & Profile tests
├── test_offers.py         ← Offer tests
├── test_timebank.py       ← Balance & transaction tests
├── test_handshake.py      ← Handshake workflow tests
└── README.md              ← Detailed documentation
```

---

## 🐛 Quick Fixes

### Set DEBUG for testing
```bash
$env:DEBUG="True"
python manage.py test core.tests
```

### Run from correct directory
```bash
cd C:\Users\kaltu\Documents\django_project\backend
python manage.py test core.tests
```

### Keep test database for debugging
```bash
python manage.py test core.tests --keepdb
```

---

## ✅ Expected Success Output

```
Creating test database for alias 'default'...
System check identified no issues (0 silenced).
..............................................
----------------------------------------------------------------------
Ran 46 tests in 130.184s

OK
Destroying test database for alias 'default'...
```

---

**💡 Pro Tip:** Run tests before every commit!  
**📖 Full Guide:** See `TESTING_GUIDE.md` for comprehensive documentation

