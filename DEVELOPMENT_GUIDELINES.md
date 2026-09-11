# Development Guidelines and Contribution Standards: `PICC-PP-Admin-Portal-Frontend`

This document defines the architectural standards, development workflows, coding conventions, and security requirements for contributors to **`PICC-PP-Admin-Portal-Frontend`**.

---

## Table of Contents

1. [Architecture & Design Principles](#1-architecture--design-principles)
2. [Development Environment Setup](#2-development-environment-setup)
3. [Directory Structure & Code Navigation](#3-directory-structure--code-navigation)
4. [Coding Standards & Best Practices](#4-coding-standards--best-practices)
   - [TypeScript Typing & Component Conventions](#typescript-typing--component-conventions)
   - [Shared Styling System & Tokens](#shared-styling-system--tokens)
   - [API Service Layer & Abstraction](#api-service-layer--abstraction)
   - [State Management & Routing Guards](#state-management--routing-guards)
   - [Zero-Trust Security & Credential Hygiene](#zero-trust-security--credential-hygiene)
5. [Security, Code Quality & Compliance Tooling](#5-security-code-quality--compliance-tooling)
   - [ESLint & Static Analysis](#eslint--static-analysis)
   - [Dependency Auditing (npm audit)](#dependency-auditing-npm-audit)
   - [Container Vulnerability Scanning](#container-vulnerability-scanning)
6. [Git Workflow & Branching Strategy](#6-git-workflow--branching-strategy)
   - [Branch Naming Conventions](#branch-naming-conventions)
   - [Conventional Commits](#conventional-commits)
7. [Pull Request (PR) Checklist](#7-pull-request-pr-checklist)
8. [Release Lifecycle & Versioning](#8-release-lifecycle--versioning)

---

## 1. Architecture & Design Principles

`PICC-PP-Admin-Portal-Frontend` is the administrative single-page application (SPA) for the **Nubo Native Platform (NNP)** within the **Platform Infrastructure and Core Components (PICC)** suite. It is designed around the following architectural principles:

1. **Modern Frontend Toolchain**: Built on **React 19**, **TypeScript 5.8**, and **Vite 7**, ensuring rapid local HMR (Hot Module Replacement) and optimized production bundles.
2. **Unified Platform Design System**: Leverages the open-source `@nubo-native-platform/nnp-shared-styles` library for unified color tokens, layout primitives, and theme variables across the platform ecosystem.
3. **Decoupled API Service Architecture**: All backend HTTP communication is isolated within strongly-typed service modules (`src/services/*`) utilizing a unified `ApiService` wrapper. Direct ad-hoc `fetch` or `axios` calls in UI components are prohibited.
4. **Resilient Configuration Externalization**: All backend URLs, domain roots, and cookie scopes are injected via Vite environment variables (`import.meta.env.VITE_*`) with safe fallbacks for local and containerized deployments.
5. **Zero-Trust Security**: No hardcoded API keys, private tokens, or customer URLs may exist in source control. Authentication states and session tokens are mediated securely through HTTP cookies and scoped authorization headers.

---

## 2. Development Environment Setup

### Required Prerequisites
- **Node.js**: `v20.x` or `v22.x` LTS.
- **npm**: `v10.x` or higher.
- **Docker**: For running containerized builds and end-to-end integration.

### Recommended IDE Extensions (VS Code)
- **ESLint** (`dbaeumer.vscode-eslint`)
- **Tailwind CSS IntelliSense** (`bradlc.vscode-tailwindcss`)
- **Prettier - Code formatter** (`esbenp.prettier-vscode`)

### Quick Setup Commands
```bash
# Clone the repository
git clone https://github.com/Nubo-Native-Platform/PICC-PP-Admin-Portal-Frontend.git
cd PICC-PP-Admin-Portal-Frontend

# Copy the environment variable configuration template
cp .env.example .env

# Install project dependencies
npm ci --legacy-peer-deps

# Start local development server
npm run dev
```

The application will be accessible at `http://localhost:5173/nnp-admin/`.

---

## 3. Directory Structure & Code Navigation

```
src/
├── assets/                    # Static brand assets (logos, icons, svg graphics)
├── contexts/                  # React Context providers (ThemeContext, LoaderContext)
├── guards/                    # Route navigation guards (ProtectedRoutesGuard)
├── pages/                     # Routed view components
│   ├── access_management.tsx      # Platform user RBAC and permission management
│   ├── billing.tsx                # Account billing metrics and cycle reports
│   ├── component.tsx              # Component registry and specification management
│   ├── config_server.tsx          # Spring Cloud Config Server property inspection
│   ├── configuration_management.tsx # Platform environment variable configuration
│   ├── dms_management.tsx         # Document Management Service deployments and terminals
│   ├── domain.tsx                 # Domain values and lookup dictionaries
│   ├── environment.tsx            # Environment topologies and feature element trees
│   ├── haproxy_management.tsx     # HAProxy DataPlane API v3 backend/server ingress rules
│   ├── login_modal.tsx            # Modal login credentials handler
│   ├── model_config.tsx           # Machine learning model metadata and configuration
│   ├── model_details.tsx          # Detailed ML model deployment configurations
│   ├── plan.tsx                   # Platform billing plans and component quotas
│   ├── registration_request.tsx   # Account registration requests and approvals
│   └── support.tsx                # Ticketing system and Redmine support integration
├── services/                  # Microservice HTTP client integrations
│   ├── api.service.tsx            # Core HTTP client wrapper with auth header injection
│   ├── auth.service.tsx           # Keycloak authentication and account retrieval
│   ├── billing.service.tsx        # Billing history and account statement APIs
│   ├── cookie.service.tsx         # Token, username, and environment cookie persistence
│   ├── dms.service.tsx            # DMS deployment orchestration and VM health APIs
│   ├── environment.service.tsx    # Environment feature elements and activity logs
│   ├── haproxy.service.tsx        # HAProxy backend and server registration endpoints
│   └── support.service.tsx        # Redmine ticketing API client
├── shared/                    # Reusable configurations, models, and layout wrappers
│   ├── config/                    # DataGrid schemas, input field configurations, and themes
│   ├── layout/                    # Topbar, Navbar, Header, and Loader UI wrappers
│   ├── models/                    # Data model classes
│   └── types/                     # TypeScript interface definitions (DMS, Env, User, etc.)
└── widgets/                   # Reusable UI widgets
    ├── confirmDialog.tsx          # SweetAlert2 wrapper for destructive action confirmations
    ├── dataGrid.tsx               # Material UI X-DataGrid wrapper with pagination
    ├── dynamicForm.tsx            # Schema-driven dynamic form engine
    ├── yamlEditor.tsx             # CodeMirror YAML configuration editor
    └── themetoggle.tsx            # Dark/Light theme mode switch
```

---

## 4. Coding Standards & Best Practices

### TypeScript Typing & Component Conventions
- Maintain strict TypeScript type annotations (`tsconfig.app.json`). Avoid using `any` unless integrating dynamic unvalidated JSON payloads.
- Define shared data structures in `src/shared/types/*.ts`.
- Prefer functional components with React hooks (`useState`, `useEffect`, `useCallback`, `useMemo`).
- Keep components focused and modular. Complex business logic should reside in dedicated custom hooks or services.

### Shared Styling System & Tokens
- Leverage `@nubo-native-platform/nnp-shared-styles` for standardized styling.
- SCSS styles are loaded globally via `src/App.scss`:
  ```scss
  @use '@nubo-native-platform/nnp-shared-styles/src/index.scss';
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  ```
- Use Tailwind utility classes for component-level layout and spacing, respecting dark mode classes (`dark:...`).

### API Service Layer & Abstraction
- All network calls must pass through `ApiService` (`src/services/api.service.tsx`).
- Endpoints must read base URLs from `import.meta.env` with sensible fallbacks:
  ```typescript
  const BASE_URL = (import.meta.env.VITE_API_ENVIRONMENT_MANAGEMENT_URL as string) || '/nnpconf/env';
  ```
- Never hardcode hostnames, IP addresses, or ports directly in service functions.

### State Management & Routing Guards
- Global cross-cutting state (user session, active environment ID, current tenant) is stored in cookies via `CookieService` with strict cookie domain scoping.
- Protected routes are wrapped in `ProtectedRoutesGuard` (`src/guards/protected_routes.guard.tsx`), verifying valid authentication before rendering administration views.

### Zero-Trust Security & Credential Hygiene
- **Never commit `.env` files** or real tokens into git. Always configure `.gitignore` to exclude secret files.
- Mask and sanitize all user input before transmission.
- Clean and escape user-supplied YAML or terminal commands.

---

## 5. Security, Code Quality & Compliance Tooling

### ESLint & Static Analysis
Verify code formatting and linting rules prior to committing:
```bash
npm run lint
```

### Dependency Auditing
Ensure dependencies are free of high or critical vulnerabilities:
```bash
npm audit --audit-level=high
```

### Container Vulnerability Scanning
All Docker containers are scanned in CI/CD using Trivy to prevent known CVEs in the base operating system and runtime packages.

---

## 6. Git Workflow & Branching Strategy

### Branch Naming Conventions
- `feature/<ticket-id>-<short-description>`: New portal features or pages
- `fix/<ticket-id>-<short-description>`: Bug fixes
- `refactor/<short-description>`: Code restructuring without feature alteration
- `docs/<short-description>`: Documentation additions and updates

### Conventional Commits
All commits must follow the **Conventional Commits** specification:
```
<type>(<scope>): <short description in imperative mood>

[optional body]

[optional footer(s)]
```

Examples:
- `feat(haproxy): add support for TCP stream backend configuration`
- `fix(dms): resolve web terminal redirect URL resolution`
- `docs(readme): update deployment guide and technology matrix`

---

## 7. Pull Request (PR) Checklist

Before submitting a PR for maintainer review, ensure:

- [ ] All TypeScript code compiles cleanly without errors (`npm run build`).
- [ ] ESLint reports zero errors or warnings (`npm run lint`).
- [ ] No hardcoded private IP addresses (`10.*`, `192.168.*`) or internal URLs exist in the changes.
- [ ] No credentials, `.env` files, or access tokens are committed.
- [ ] Tested UI responsiveness across both Light and Dark theme modes.
- [ ] Documentation updated in `README.md` or `USER_MANUAL_AND_DEPLOYMENT_GUIDE.md` if new environment variables were introduced.

---

## 8. Release Lifecycle & Versioning

The project adheres to **Semantic Versioning 2.0.0** (`MAJOR.MINOR.PATCH`):
- **MAJOR**: Incompatible API or architectural overhauls.
- **MINOR**: Backward-compatible new pages, features, or integrations.
- **PATCH**: Backward-compatible bug fixes and security patches.

Docker images are automatically tagged with Git release tags (e.g., `v1.0.0`) and published to GitHub Container Registry (GHCR) upon release creation.
