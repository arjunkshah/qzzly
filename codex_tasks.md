# Quiz.io - MVP Task List

This document outlines the remaining critical tasks required to launch a functional Minimum Viable Product (MVP).

---

### 1. Core Functionality & AI Integration

- [ ] **Standardize on a Single AI Service:**
  - [ ] **Task:** Refactor `FilesComponent.tsx` to use `openaiService.ts` for summary generation, removing the dependency on `geminiService.ts`.
  - [ ] **Reason:** The project has migrated to OpenAI, but `FilesComponent.tsx` still uses the old Gemini service for summaries. This is a critical functionality gap.

- [ ] **Refine AI Generation Prompts:**
  - [ ] **Task:** Systematically review and improve the prompts in `openaiService.ts` for generating summaries, quizzes, and flashcards.
  - [ ] **Reason:** To ensure the quality, accuracy, and reliability of the core AI-generated content meet MVP standards.

- [ ] **Validate PDF Text Extraction:**
  - [ ] **Task:** Test the PDF text extraction with a variety of documents (e.g., multi-column, text-heavy, mixed-content) to ensure reliability.
  - [ ] **Reason:** The core value of the app depends on accurately extracting text from user-uploaded files.

---

### 2. State Management & Data Fetching

- [ ] **Implement Server State Management with React Query:**
  - [ ] **Task:** Refactor data-fetching logic in components like `SessionsPage.tsx` and `StudySession.tsx` to use `useQuery` and `useMutation` from `@tanstack/react-query`.
  - [ ] **Reason:** To replace manual `useEffect` and `useState` hooks for data fetching, which will provide better caching, automatic re-fetching, and a cleaner codebase.

---

### 3. User Authentication (MVP)

- [x] **Verify Core Authentication Flow:**
  - [x] **Task:** Ensure the existing signup, login, and logout functionalities are working correctly and are robust.
  - [x] **Reason:** A working authentication system is essential for a multi-user MVP.

- [x] **Implement Protected Routes:**
  - [x] **Task:** Create and apply a mechanism (e.g., a higher-order component or a router check) to protect all session-related pages from unauthenticated access.
  - [x] **Reason:** To ensure user data is secure and accessible only after logging in.

---

### 4. Testing & Deployment

- [x] **Write Basic Integration Tests:**
  - [x] **Task:** Create tests for the most critical user flow: uploading a PDF, generating flashcards, and starting a quiz.
  - [x] **Reason:** To ensure the core application workflow is stable and prevent regressions.

- [x] **Prepare for Deployment:**
  - [x] **Task:** Create a production build and test it locally. Prepare deployment configurations for a target platform (e.g., Vercel, Netlify).
  - [x] **Reason:** To ensure the application can be successfully deployed and made available to users.

---
## Post-MVP / Future Work

- **Full Backend Integration:** Transition from `localStorage` to a persistent database and backend API.
- **Advanced File Support:** Add OCR for image-based PDFs and support for `.docx` / `.txt` files.
- **Account Management:** Implement "Forgot Password" and user profile pages.
- **Enhanced UI/UX:** Add more sophisticated loading states, themes, and animations.
- **Comprehensive Testing:** Implement a full suite of unit, integration, and E2E tests with CI/CD. 