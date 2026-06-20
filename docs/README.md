# Panorama Docs Index

This directory contains Panorama Mobile documentation from Phase 0 through Phase 15.

| File                                                        | Description                                                            |
| ----------------------------------------------------------- | ---------------------------------------------------------------------- |
| `00_PROJECT_OVERVIEW.md`                                    | Project overview, problem statement, target users, and app boundaries. |
| `01_PRODUCT_DECISIONS.md`                                   | Core product decisions such as Arabic-first and RTL-first.             |
| `02_MVP_SCOPE.md`                                           | MVP scope and deferred features.                                       |
| `03_USER_ROLES.md`                                          | User roles, permissions, and constraints.                              |
| `04_USER_JOURNEYS.md`                                       | Main user journeys.                                                    |
| `05_FUNCTIONAL_REQUIREMENTS.md`                             | Functional requirements by module.                                     |
| `06_NON_FUNCTIONAL_REQUIREMENTS.md`                         | Performance, security, privacy, RTL, and maintainability requirements. |
| `07_MOBILE_ARCHITECTURE_DECISIONS.md`                       | Mobile architecture decisions.                                         |
| `08_VISUAL_IDENTITY.md`                                     | Visual identity and design tokens.                                     |
| `09_SCREEN_MAP.md`                                          | MVP screen map.                                                        |
| `10_API_INTEGRATION_ASSUMPTIONS.md`                         | API, WebSocket, and response assumptions.                              |
| `11_RELEASE_AND_ENVIRONMENT_STRATEGY.md`                    | Environments and release strategy.                                     |
| `12_CODEX_PROMPTING_RULES.md`                               | Codex implementation rules.                                            |
| `13_PHASE_1_PROJECT_INITIALIZATION.md`                      | Project initialization documentation.                                  |
| `14_PHASE_1_5_PROJECT_VALIDATION.md`                        | Validation issues before Phase 1.6.                                    |
| `15_PHASE_1_6_PRODUCTION_TOOLING_FIX.md`                    | Tooling and validation fix.                                            |
| `16_PHASE_2_DESIGN_SYSTEM_FOUNDATION.md`                    | Design system foundation.                                              |
| `17_PHASE_3_NAVIGATION_ARCHITECTURE.md`                     | Navigation architecture foundation.                                    |
| `18_PHASE_4_API_CLIENT_FOUNDATION.md`                       | API client and service foundations.                                    |
| `19_PHASE_5_AUTHENTICATION_FOUNDATION.md`                   | Authentication, session, and secure storage foundation.                |
| `20_PHASE_5_5_EXPO_SDK_AUDIT_AND_UPGRADE.md`                | Expo SDK audit and upgrade to SDK 56.                                  |
| `21_PHASE_6_STUDENT_PROFILE_AND_VERIFICATION_FOUNDATION.md` | Student profile, verification, and StudentSetup gate foundation.       |
| `22_PHASE_7_HOME_AND_ANNOUNCEMENTS_FOUNDATION.md`           | Home screen, announcements, and unread notification count foundation.  |
| `23_PHASE_8_SUBJECTS_AND_ACADEMIC_CONTENT_FOUNDATION.md`    | Subjects list, local search, and subject detail foundation.            |
| `24_PHASE_9_GROUPS_FOUNDATION.md`                           | Groups list/detail, join/leave, and WhatsApp link foundation.          |
| `25_PHASE_10_FILES_AND_IN_APP_VIEWER_FOUNDATION.md`         | Files list/detail, group files, and in-app viewer foundation.          |
| `26_PHASE_10_5_PRODUCTION_AUDIT_TRIAGE.md`                  | Production audit triage for Expo transitive tooling dependencies.      |
| `27_PHASE_11_PRINTING_FOUNDATION.md`                        | Printing order creation, listing, details, and cancel foundation.      |
| `28_PHASE_12_NOTIFICATIONS_FOUNDATION.md`                   | In-app notifications list, unread count, and read-state foundation.    |
| `29_PHASE_13_SUPPORT_TICKETS_FOUNDATION.md`                 | Student support tickets list, create, detail, and reply foundation.    |
| `30_PHASE_14_PROFILE_AND_SETTINGS_COMPLETION.md`            | Profile and settings completion for the MVP account area.              |
| `31_PHASE_15_CHAT_FOUNDATION.md`                            | Group chat foundation with REST list/send and optional WebSocket.      |

## Current status

Phase 15 Chat Foundation has been completed. Group ChatRoom, REST message loading/sending, optional WebSocket support, and permission-aware chat input are real, while advanced chat features remain deferred.

Runtime integration now targets the temporary HTTP VPS/Coolify backend. API base values must omit
`/api/v1`, WebSocket uses a separate WS base, and Android cleartext is temporary until production
HTTPS/WSS is available. See document 33 for the complete backend and missing-assets checklist.

## Runtime readiness

- `33_MOBILE_BACKEND_RUNTIME_INTEGRATION_AND_ASSETS_READINESS.md`: current backend, WebSocket,
  Android cleartext, production migration, and required asset checklist.
