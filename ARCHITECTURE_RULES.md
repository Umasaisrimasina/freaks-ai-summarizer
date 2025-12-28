# UX & Interaction Design Specification: Study Platform

> **SYSTEM INSTRUCTION FOR AI AGENTS:**
> This document is the **immutable source of truth** for feature placement and user experience architecture.
> When generating code, UI components, or logic, you must **strictly adhere** to the "Cognitive Zones" and "Forbidden Pages" defined below.
> **DO NOT** suggest or implement features that violate the "Anti-Patterns" section.

---

## 1. System Cognitive Zones

### Login Page (The Doorway)
* **Purpose:** Frictionless transition from the external world to the system.
* **What belongs here:** Standard authentication and account recovery.
* **What must NEVER appear here:** Marketing content, feature lists, or complex configuration.

### Command Centre (Dashboard)
* **Purpose:** Orientation, status recognition, and habit cues using System 1 (automatic) processing.
* **What belongs here:** High-level progress metrics, streaks, schedules, and the "Next Best Action" trigger.
* **What must NEVER appear here:** Dense text, active testing, or ingestion workflows.

### Knowledge Lab (Ingestion & Review)
* **Purpose:** Constructive processing and grounding of knowledge using System 2 (effortful) thinking.
* **What belongs here:** Upload zones, AI summary reviews, source validation, and concept mapping.
* **What must NEVER appear here:** Game-like rankings or isolated flashcard testing.

### Study Arena (Active Learning)
* **Purpose:** Immersive, high-focus "Zen Zone" for active recall and deep focus.
* **What belongs here:** One-at-a-time flashcards, Socratic hints, and focus timers.
* **What must NEVER appear here:** Social feeds, distracting navigation, or new material ingestion.

### The Commons (Collaboration)
* **Purpose:** Social influence and shared meaning to boost motivation.
* **What belongs here:** Real-time study rooms, social rankings, and collective rewards.
* **What must NEVER appear here:** Individual administrative settings or primary content review.

---

## 2. Feature → Page Mapping Table

| FR ID | Feature Summary       | Primary Page   | Forbidden Pages | Reason                                               |
| :---- | :-------------------- | :------------- | :-------------- | :--------------------------------------------------- |
| FR-01 | Register/Login        | Login          | All Others      | Security and entry clarity.                          |
| FR-02 | User Data Mgt         | Command Centre | Login           | Centralizing the mental model of "My Stuff."         |
| FR-03 | Manual Paste          | Knowledge Lab  | Study Arena     | Prevents distraction during active learning.         |
| FR-04 | PDF Upload            | Knowledge Lab  | Dashboard       | Protects Dashboard from "Task Anxiety."              |
| FR-05 | Image Upload          | Knowledge Lab  | Commons         | Privacy during initial ingestion.                    |
| FR-06 | URL/YT Input          | Knowledge Lab  | Study Arena     | Ingestion requires a constructive mindset.           |
| FR-07 | Voice Input           | Knowledge Lab  | Knowledge Lab   | Minimizes "Noise" on the orientation page.           |
| FR-08 | Text Extraction       | Knowledge Lab  | All Others      | Processing happens in the "Constructive Zone."       |
| FR-09 | Chunking/Index        | Knowledge Lab  | All Others      | Background processing belongs in the Lab.            |
| FR-10 | Summary Gen           | Knowledge Lab  | All Others      | Direct oversight of AI in the Lab.                   |
| FR-11 | Source Grounding      | Knowledge Lab  | Study Arena     | Validation is a "System 2" review task.              |
| FR-12 | Ext. Knowledge Flag   | Knowledge Lab  | Dashboard       | Too granular for a high-level view.                  |
| FR-13 | Missing Info Flag     | Knowledge Lab  | Study Arena     | Contextual troubleshooting belongs in review.        |
| FR-14 | Missing Info Opts     | Knowledge Lab  | Dashboard       | Prevents decision fatigue on orientation.            |
| FR-15 | Structured Summs      | Knowledge Lab  | All Others      | Miller's Law: Chunking for initial review.           |
| FR-16 | Keyword Hi-light      | Knowledge Lab  | Study Arena     | Learning aids belong in the review phase.            |
| FR-17 | Update Source         | Knowledge Lab  | Study Arena     | Editing breaks focus in the Arena.                   |
| FR-18 | Visual Mind Maps      | Knowledge Lab  | Dashboard       | High cognitive load for a summary page.              |
| FR-19 | Flashcard Gen         | Study Arena    | Knowledge Lab   | Actionable cards only appear in the Arena.           |
| FR-20 | Q/A Structure         | Study Arena    | All Others      | Maintains the "Zen Zone" focus.                      |
| FR-21 | Verify Ext. Info      | Study Arena    | All Others      | Fact-checking during study builds trust.             |
| FR-22 | Self-Assess (Bad-Exc) | Study Arena    | All Others      | Performance cues belong with the task.               |
| FR-23 | Spaced Repetition     | Study Arena    | Dashboard       | Calculation is background; display is Arena.         |
| FR-24 | Image Occlusion       | Study Arena    | Knowledge Lab   | Advanced testing happens in the Arena.               |
| FR-25 | Active Recall View    | Study Arena    | Dashboard       | Prevents overwhelming the user with tasks.           |
| FR-26 | Revisit Incorrect     | Study Arena    | All Others      | Scaffolding for memory retention.                    |
| FR-27 | Socratic Mode         | Study Arena    | All Others      | Progressive Disclosure of hints.                     |
| FR-28 | Frustration Detect    | Study Arena    | All Others      | Emotional support is needed during strain.           |
| FR-29 | Role-Play Sims        | Study Arena    | Commons         | Deep solo immersion over social distraction.         |
| FR-30 | Podcast Summaries     | Knowledge Lab  | Study Arena     | Passive listening precedes active recall.            |
| FR-31 | Audio Formats         | Knowledge Lab  | All Others      | Configuration occurs in the Lab.                     |
| FR-32 | Interrupt Audio       | Study Arena    | Dashboard       | Interactional intent during learning.                |
| FR-33 | Video Learning        | Knowledge Lab  | All Others      | Ingestion/Video processing in the Lab.               |
| FR-34 | Lab Recording Ingest  | Knowledge Lab  | All Others      | Domain-specific ingestion.                           |
| FR-35 | Interactive Graphs    | Knowledge Lab  | Dashboard       | Exploration requires deep mental effort.             |
| FR-36 | Semantic Connects     | Knowledge Lab  | All Others      | Insight generation is a Lab task.                    |
| FR-37 | Node Interaction      | Knowledge Lab  | All Others      | Granular detail through progressive disclosure.      |
| FR-38 | Card Review Count     | Study Arena    | Dashboard       | Micro-progress in the moment.                        |
| FR-39 | Study Time Track      | Study Arena    | Login           | Contextual accountability.                           |
| FR-40 | Pomodoro Timer        | Study Arena    | Dashboard       | Focus tools belong in the focus zone.                |
| FR-41 | Progress Dash         | Command Centre | Study Arena     | Prevents performance pressure while learning.        |
| FR-42 | Calendar Integr.      | Command Centre | Knowledge Lab   | Logistics belong on the Command page.                |
| FR-43 | Collab Rooms          | The Commons    | Study Arena     | Social features break individual focus.              |
| FR-44 | Task Sync             | The Commons    | All Others      | Real-time social coordination.                       |
| FR-45 | XP/League Rank        | The Commons    | Study Arena     | Prevents test anxiety during learning.               |
| FR-46 | Streak Preserve       | The Commons    | Knowledge Lab   | Motivational mechanics belong in the Commons.        |
| FR-47 | Shared Playlist       | The Commons    | All Others      | "Reward of the Tribe" for finishing.                 |
| FR-48 | Persistent Storage    | System Level   | User Facing     | Technical requirement (not UI).                      |
| FR-49 | User Auth Sync        | System Level   | User Facing     | Data integrity requirement.                          |
| FR-50 | Hallucination Prev.   | Knowledge Lab  | Study Arena     | Validation must occur before active recall.          |
| FR-51 | Confidence Scores     | Knowledge Lab  | All Others      | Transparency for the "System Image."                 |
| FR-52 | Analogy Chats         | Study Arena    | Knowledge Lab   | Personalization during active engagement.            |
| FR-53 | AI Concept Images     | Knowledge Lab  | Dashboard       | Visual aids for review, not orientation.             |
| FR-54 | PTP Generation        | Knowledge Lab  | All Others      | Structuring knowledge in the Lab.                    |
| FR-55 | Custom API Keys       | Knowledge Lab  | Dashboard       | Advanced admin task.                                 |
| FR-56 | Experimental Sect.    | Command Centre | All Others      | Novelty should not clutter deep focus areas.         |

---

## 3. Page-Level Feature Contracts

* **Command Centre Contract:** Only allowed to present summarized data and navigation triggers. Forbidden from accepting multi-field inputs.
* **Knowledge Lab Contract:** Must provide source links for every AI output (FR-50). Mandatory "Accept/Reject" gate for all AI-suggested changes.
* **Study Arena Contract:** Total Achromatic Isolation. All global navigation elements must be hidden unless the user exits the session.
* **The Commons Contract:** All competitive data (XP/Streaks) must be presented as "White Hat" motivation (Epic Meaning) rather than "Black Hat" punishment.

---

## 4. Global Rules for Code Generation

* **User Approval Gate (FR-50):** AI shall never commit changes to a study document permanently without an explicit "Accept" action.
* **Confidence Scoring (FR-51):** Every AI summary must be accompanied by a color-coded "High/Medium/Low" grounding score.
* **Undo over Confirmation:** Provide a 5-second "Undo" bar for deletions instead of "Are you sure?" pop-ups to reduce cognitive friction.
* **Progressive Disclosure:** Hide Subjective/Advanced metrics (e.g., topic-wise study time) behind a "View Insights" interaction.
* **Doherty Threshold:** All buttons must provide visual feedback (e.g., state change) within <400ms.

---

## 5. Engineer Safety Net (Checklist)

Before implementing a new feature, verify:
- [ ] Is the user uploading something? → **Route to Knowledge Lab.**
- [ ] Is the user answering a test question? → **Route to Study Arena.**
- [ ] Is the user comparing themselves to others? → **Route to The Commons.**
- [ ] Is the user deciding what to do today? → **Route to Command Centre.**

---

## 6. Hard Anti-Patterns (STRICT PROHIBITION)

* **NO Ingestion fields on the Dashboard** (prevents "System 1" overwhelm).
* **NO Rankings or XP alerts in the Study Arena** (prevents breaking the "Flow State").
* **NO Auto-accepting AI modifications** (prevents "Hallucinations" from entering long-term memory).
* **NO Social notifications during active recall sessions** (prevents "Stimulus-Driven Attention" distractions).