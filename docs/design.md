# Product & UI Design
# AI Developer Intelligence Platform

## 1. Design Direction

The product should feel like a serious modern developer tool rather than a student AI chatbot.

Design characteristics:
- Clean
- Technical
- Minimal
- Professional
- Information-dense but not cluttered
- Strong typography
- Clear hierarchy
- Developer-tool aesthetic
- Responsive

Avoid:
- Excessive gradients
- Overly playful illustrations
- Generic AI sparkle imagery
- Excessive animations
- Unnecessary cards everywhere

## 2. Visual Language

Suggested direction:
- Neutral/dark developer-tool interface with an optional light theme.
- One restrained accent colour.
- Monospace typography for code, file paths and technical metadata.
- Standard sans-serif typography for normal UI.
- Subtle borders.
- Consistent spacing.
- Clear severity indicators.

Do not hard-code a color palette into business logic. Keep theme tokens centralized.

## 3. Main Navigation

Desktop sidebar:

```text
DEVINTEL AI

Overview
Repositories
Codebase
AI Chat
Code Review
Debugging
Plans
Activity
Settings
```

Top bar:
- Current repository
- Search
- Notifications/status
- User menu

## 4. Landing Page

Sections:
1. Hero
2. Problem statement
3. Core capabilities
4. How it works
5. Security
6. Demo/product preview
7. Call to action

Hero message example:

> Understand any codebase with AI grounded in your actual repository.

Do not make unsupported claims about accuracy.

## 5. Authentication Screens

Login:
- GitHub sign-in
- Clear privacy explanation
- Minimal form if local authentication is supported

States:
- Loading
- OAuth failure
- Session expired

## 6. Dashboard

Dashboard should show:

```text
Welcome back

Repositories
[3]

Indexed Files
[1,248]

AI Questions
[84]

Recent Activity
...
```

Repository cards:
- Name
- Owner
- Language
- Last indexed
- Indexing status
- Actions

## 7. Repository Detail

Tabs:

```text
Overview | Files | AI Chat | Reviews | Debug | Plans
```

Overview:
- Repository metadata
- Index status
- Last commit indexed
- Files/chunks count
- Indexing controls

## 8. Codebase Explorer

Layout:

```text
+----------------+-----------------------------+
| File tree      | Code viewer                 |
|                |                             |
| src/           | auth.ts                     |
| components/    | 1  import ...               |
| services/      | 2  ...                       |
| ...            |                             |
+----------------+-----------------------------+
```

Features:
- Search files
- Language badges
- Line numbers
- Source references
- Copy code
- Jump to referenced source

## 9. AI Chat

The AI chat should look like a developer assistant, not a generic chatbot.

Message should support:
- Markdown
- Code blocks
- File references
- Line references
- Copy button
- Feedback
- Regenerate where appropriate

Context indicator:

```text
Context used
8 files
23 chunks
```

Source panel:

```text
Sources
src/auth/authService.ts:20-58
src/middleware/auth.ts:10-42
```

## 10. Code Review

Input:
- Paste diff
- Upload diff
- Select GitHub PR if implemented

Review display:

```text
CRITICAL
Potential authorization bypass

src/controllers/orderController.ts:84

Explanation:
...

Recommendation:
...
```

Use severity levels:
- Critical
- High
- Medium
- Low
- Informational

Do not use severity as a claim of objective security impact without context.

## 11. Debugging

Input:
- Error message
- Stack trace
- Optional reproduction notes

Output:

```text
Likely cause
Evidence
Relevant files
Suggested fix
Suggested tests
Confidence
```

Make uncertainty visible.

## 12. Implementation Plans

Display:

```text
Goal
Current architecture
Files affected
Step 1
Step 2
Step 3
Potential risks
Testing strategy
```

No automatic code modifications in MVP.

## 13. Indexing Experience

When indexing:

```text
Repository
   |
Fetching files       ✓
Filtering files      ✓
Processing code      ⟳
Generating embeddings ⟳
Building index       ○
Complete             ○
```

Show:
- Current stage
- Files processed
- Errors
- Retry button

Never leave users staring at an indefinite spinner.

## 14. Analytics

Initial metrics:
- Questions asked
- AI request count
- Average latency
- Token usage if available
- Estimated cost if available
- Retrieval count
- User feedback
- Indexing duration

Charts should be simple and useful.

## 15. Responsive Design

Desktop is the primary target.

Tablet:
- Collapsible sidebar
- Adaptive code explorer

Mobile:
- Simplified navigation
- Chat remains usable
- Code viewer supports horizontal scrolling
- Avoid trying to replicate full desktop IDE experience

## 16. Accessibility

- Keyboard navigation.
- Visible focus states.
- Semantic HTML.
- Sufficient contrast.
- Form labels.
- ARIA only when necessary.
- Do not rely solely on color for severity/status.

## 17. UX States

Every major screen must handle:
- Loading
- Empty
- Success
- Error
- Unauthorized
- Not found
- Partial data
- Retry

## 18. Component Strategy

Reusable components:
- Button
- Input
- Select
- Dialog
- Tabs
- Badge
- Status indicator
- Code block
- File tree
- Data table
- Toast
- Skeleton
- Empty state
- Error state
- Markdown renderer

Feature-specific components should remain inside their feature modules.

## 19. UI Data Contract

Frontend should consume typed API responses.

Avoid embedding backend/database assumptions directly in visual components.

Use mock data only during UI prototyping.

## 20. Lovable Handoff

If Lovable is used:
- Generate UI only.
- Use mock data.
- Keep API calls abstract.
- Do not introduce Supabase as the application backend unless the architecture is deliberately changed.
- Preserve component quality and accessibility.
- Move the final UI into the main React/TypeScript codebase.
