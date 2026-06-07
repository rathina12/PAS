# OOAD Documentation — Performance Appraisal System
## Object-Oriented Analysis and Design

---

## 1. SYSTEM OVERVIEW

The Performance Appraisal System (PAS) is designed using core OOAD principles.
Every layer of the application — from database models to React components —
maps to specific OOP concepts studied in an OOAD course.

---

## 2. CLASSES AND OBJECTS

### Domain Classes (MongoDB Models)

```
┌─────────────────────────────────┐
│           User                  │
├─────────────────────────────────┤
│ - _id : ObjectId                │
│ - name : String                 │
│ - email : String                │
│ - password : String (hashed)    │
│ - role : Enum {admin,manager,   │
│          employee}              │
│ - department : String           │
│ - designation : String          │
│ - managerId : ObjectId (ref)    │
│ - isActive : Boolean            │
├─────────────────────────────────┤
│ + comparePassword(pwd) : Bool   │
│ + pre('save') : void (hash pwd) │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│         Appraisal               │
├─────────────────────────────────┤
│ - _id : ObjectId                │
│ - employeeId : ObjectId (ref)   │
│ - managerId : ObjectId (ref)    │
│ - period : String               │
│ - year : Number                 │
│ - selfRatings : RatingSchema    │
│ - selfComments : CommentSchema  │
│ - selfScore : Number            │
│ - managerRatings : RatingSchema │
│ - managerComments: CommentSchema│
│ - managerScore : Number         │
│ - finalScore : Number           │
│ - grade : Enum {A,B,C,D,F,N/A} │
│ - status : Enum {draft,         │
│   submitted,under_review,       │
│   approved,rejected}            │
├─────────────────────────────────┤
│ + calculateScore(ratings):Number│  ← Static method
│ + scoreToGrade(score): String   │  ← Static method
└─────────────────────────────────┘

┌─────────────────────────────────┐
│        Notification             │
├─────────────────────────────────┤
│ - _id : ObjectId                │
│ - userId : ObjectId (ref)       │
│ - title : String                │
│ - message : String              │
│ - type : Enum{info,success,     │
│          warning,error}         │
│ - isRead : Boolean              │
└─────────────────────────────────┘
```

---

## 3. THE FOUR PILLARS OF OOP

### 3.1 ENCAPSULATION

Encapsulation = bundling data + methods that operate on it, and hiding
internal implementation details.

**Example 1 — Password Hashing (User model)**
```javascript
// The User class HIDES how passwords are stored.
// External code just calls .save() — hashing is automatic.
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// External code never sees plain-text passwords:
UserSchema.methods.comparePassword = async function(entered) {
  return bcrypt.compare(entered, this.password);
};
```

**Example 2 — Score Calculation (Appraisal model)**
```javascript
// Score calculation logic is ENCAPSULATED inside the model.
// Controllers just call Appraisal.calculateScore() — they don't
// know HOW it's calculated.
AppraisalSchema.statics.calculateScore = function(ratings) {
  const values = RATING_KEYS
    .map(k => ratings[k])
    .filter(v => typeof v === 'number' && v > 0);
  if (!values.length) return 0;
  return parseFloat((values.reduce((a,b)=>a+b,0) / values.length).toFixed(2));
};
```

---

### 3.2 ABSTRACTION

Abstraction = exposing only what is necessary, hiding implementation complexity.

**Example — Controller layer abstracts DB queries from Routes**
```javascript
// Route only knows: "call this function"
router.post('/', authorize('employee'), submitSelfAppraisal);

// Controller abstracts: finding, validating, saving, notifying
const submitSelfAppraisal = async (req, res) => {
  const existing = await Appraisal.findOne({...});
  const { score } = calcScoreAndGrade(ratings);
  const appraisal = await Appraisal.create({...});
  await Notification.create({...});
  res.json({ success: true, appraisal });
};
// The route doesn't need to know any of this internal logic.
```

**Example — React AuthContext abstracts authentication state**
```javascript
// Any component just calls:
const { user, login, logout } = useContext(AuthContext);
// It doesn't know about localStorage, tokens, axios headers, etc.
```

---

### 3.3 INHERITANCE

Inheritance = a class inherits properties/behaviour from a parent class.

In this system, role-based inheritance is modelled through the `role` field:

```
        User (base class)
       /       |       \
   Admin    Manager   Employee
   (role)   (role)    (role)

Each inherits all User properties but gets DIFFERENT permissions:
- Admin    → can access ALL routes
- Manager  → can access team + evaluation routes
- Employee → can only access own appraisals + self-appraisal
```

**In code — Middleware enforces inherited permissions:**
```javascript
// authorize() acts as the inheritance enforcement mechanism
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied.' });
  }
  next();
};

// Usage:
router.get('/all',  authorize('admin'),            getAllAppraisals);
router.get('/team', authorize('manager'),          getTeamAppraisals);
router.post('/',    authorize('employee'),         submitSelfAppraisal);
router.put('/evaluate', authorize('manager'),      evaluateAppraisal);
```

---

### 3.4 POLYMORPHISM

Polymorphism = same interface, different behaviour depending on type.

**Example 1 — Dashboard renders differently for each role**
```javascript
// Same component, different output based on user.role
const Dashboard = () => {
  const { user } = useContext(AuthContext);
  if (user.role === 'admin')    return <AdminDashboard />;
  if (user.role === 'manager')  return <ManagerDashboard />;
  if (user.role === 'employee') return <EmployeeDashboard />;
};
// Same <Dashboard /> call, three completely different UIs.
```

**Example 2 — StatusBadge renders differently per status**
```javascript
// Same component, different style based on value
const StatusBadge = ({ status }) => {
  const map = {
    draft:        'badge-muted',
    submitted:    'badge-primary',
    under_review: 'badge-warning',
    approved:     'badge-success',
    rejected:     'badge-danger'
  };
  return <span className={`badge ${map[status]}`}>{status}</span>;
};
```

---

## 4. RELATIONSHIPS BETWEEN CLASSES

### 4.1 Association
A User (employee) is ASSOCIATED with a User (manager) via `managerId`.
```
Employee ──────managerId──────► Manager
(User)                           (User)
```

### 4.2 Aggregation (Has-A, weak)
An Appraisal HAS-A set of Ratings, but ratings can exist independently.
```
Appraisal ◇──── selfRatings  (RatingSchema)
          ◇──── managerRatings (RatingSchema)
```

### 4.3 Composition (Has-A, strong)
A Notification belongs entirely to one User. If the user is deleted,
notifications are deleted too.
```
User ◆──────── Notification[]
```

### 4.4 Dependency
Controllers DEPEND ON Models to perform operations.
```
appraisalController ──uses──► Appraisal (model)
appraisalController ──uses──► Notification (model)
```

---

## 5. DESIGN PATTERNS USED

### 5.1 MVC (Model-View-Controller)
```
MODEL      → Mongoose schemas (User, Appraisal, Notification)
VIEW       → React components (Dashboard, SelfAppraisal, etc.)
CONTROLLER → Express controllers (authController, appraisalController, etc.)
```

### 5.2 Singleton Pattern
```javascript
// MongoDB connection is a Singleton — established once, reused everywhere
mongoose.connect(process.env.MONGO_URI)
  .then(() => app.listen(PORT));
// All controllers share the SAME connection object.
```

### 5.3 Factory Pattern
```javascript
// Mongoose .create() acts as a Factory — it instantiates a new
// Appraisal object with validated structure every time
const appraisal = await Appraisal.create({ employeeId, period, ... });
```

### 5.4 Observer Pattern
```javascript
// When an appraisal is evaluated, the employee (observer) is
// automatically NOTIFIED (event fired)
await appraisal.save();
await Notification.create({       // ← Observer notified
  userId: appraisal.employeeId,
  title: 'Appraisal Approved',
  message: `Your score: ${finalScore}/5`
});
```

### 5.5 Strategy Pattern
```javascript
// The authorization strategy changes based on role
router.get('/all',  authorize('admin'),   getAllAppraisals); // Strategy A
router.get('/team', authorize('manager'), getTeamAppraisals); // Strategy B
router.get('/my',                         getMyAppraisals);   // Strategy C
// Same endpoint structure, different access strategy injected.
```

### 5.6 State Pattern
The Appraisal object transitions through defined states:
```
draft ──submit──► submitted ──review──► under_review ──approve──► approved
                                     └──reject───────────────────► rejected
```
Only valid transitions are allowed (e.g., cannot approve a draft directly).

---

## 6. CLASS DIAGRAM (Simplified UML)

```
+──────────────+         +──────────────────+         +──────────────+
│    User      │1       *│    Appraisal     │*       1│    User      │
│ ──────────── │─────────│ ──────────────── │─────────│ ──────────── │
│ -name        │employee │ -employeeId (FK) │ manager │ -name        │
│ -email       │         │ -managerId (FK)  │         │ -email       │
│ -password    │         │ -period          │         │ -role:manager│
│ -role        │         │ -selfRatings     │         └──────────────┘
│ -managerId   │         │ -managerRatings  │
│ ──────────── │         │ -selfScore       │         +──────────────+
│+comparePass()│         │ -managerScore    │1       *│Notification  │
└──────┬───────┘         │ -finalScore      │─────────│ ──────────── │
       │ 1               │ -grade           │ userId  │ -title       │
       │ *               │ -status          │         │ -message     │
+──────┴───────+         │ ──────────────── │         │ -type        │
│Notification  │         │+calculateScore() │         │ -isRead      │
│ (userId ref) │         │+scoreToGrade()   │         └──────────────┘
└──────────────┘         └──────────────────┘
```

---

## 7. USE CASE DIAGRAM

```
                    Performance Appraisal System
    ┌─────────────────────────────────────────────────────┐
    │                                                     │
    │  [Register / Login]  ◄──────────────────────────── │──── All Users
    │                                                     │
    │  [Submit Self-Appraisal] ◄────────────────────────  │──── Employee
    │  [View Appraisal Results] ◄───────────────────────  │──── Employee
    │  [View Profile] ◄─────────────────────────────────  │──── Employee
    │                                                     │
    │  [View Team Members] ◄────────────────────────────  │──── Manager
    │  [Evaluate Appraisal] ◄───────────────────────────  │──── Manager
    │  [Approve / Reject] ◄─────────────────────────────  │──── Manager
    │                                                     │
    │  [Manage Users] ◄─────────────────────────────────  │──── Admin
    │  [Assign Manager to Employee] ◄───────────────────  │──── Admin
    │  [View All Appraisals] ◄──────────────────────────  │──── Admin
    │  [Generate Reports] ◄─────────────────────────────  │──── Admin
    │                                                     │
    └─────────────────────────────────────────────────────┘
```

---

## 8. SEQUENCE DIAGRAM — Self-Appraisal Submission

```
Employee        Frontend          Backend API       MongoDB
   │                │                  │               │
   │──submit form──►│                  │               │
   │                │──POST /appraisals►               │
   │                │                  │──findOne()───►│
   │                │                  │◄──null────────│
   │                │                  │──create()────►│
   │                │                  │◄──appraisal───│
   │                │                  │──Notification►│
   │                │◄──201 success────│               │
   │◄──toast popup──│                  │               │
   │                │                  │               │
```

---

## 9. SOLID PRINCIPLES APPLIED

| Principle | How it's applied |
|-----------|-----------------|
| **S** — Single Responsibility | Each controller handles one resource (auth, users, appraisals, reports) |
| **O** — Open/Closed | New roles can be added to `authorize()` without changing existing code |
| **L** — Liskov Substitution | Admin can do everything a Manager does + more |
| **I** — Interface Segregation | Employees only see employee routes; managers only see manager routes |
| **D** — Dependency Inversion | Controllers depend on Model abstractions, not raw MongoDB queries |
