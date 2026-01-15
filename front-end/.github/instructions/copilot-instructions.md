# Copilot Coding Agent Instructions for VisualFlow

## Project Overview

VisualFlow is a visual workflow automation editor built with Next.js. It provides a drag-and-drop interface for creating and executing workflows using nodes (Start, Task, Condition, End) connected by edges. The project uses React Flow (@xyflow/react) for the canvas-based editor.

**Tech Stack:**
- **Framework:** Next.js 16.1.1 with App Router
- **UI Library:** React 19, TypeScript 5.9
- **Styling:** Tailwind CSS 4, shadcn/ui (new-york style)
- **State Management:** Zustand 5
- **Data Fetching:** TanStack Query (React Query)
- **Flow Editor:** @xyflow/react 12

## Project Structure

```
front-end/                    # Main application directory
├── src/
│   ├── app/                  # Next.js App Router pages
│   │   ├── editor/[workflowId]/  # Workflow editor page
│   │   ├── page.tsx          # Home page
│   │   ├── layout.tsx        # Root layout
│   │   └── globals.css       # Global styles and CSS variables
│   ├── components/
│   │   ├── ui/               # shadcn/ui components
│   │   └── providers.tsx     # React Query provider
│   ├── features/
│   │   └── editor/           # Editor feature module
│   │       ├── components/   # Editor UI components
│   │       ├── nodes/        # Custom node components (Start, Task, Condition, End)
│   │       ├── edges/        # Custom edge components (AnimatedEdge)
│   │       └── hooks/        # Editor hooks (useWorkflowExecution)
│   ├── stores/               # Zustand stores
│   │   ├── editorStore.ts    # Nodes, edges, selection state
│   │   └── executionStore.ts # Workflow execution state
│   ├── types/                # TypeScript type definitions
│   │   ├── node.ts           # WorkflowNode types
│   │   ├── edge.ts           # WorkflowEdge types
│   │   ├── condition.ts      # Condition operators
│   │   └── workflow.ts       # Workflow and execution types
│   ├── lib/
│   │   └── utils.ts          # cn() utility for Tailwind class merging
│   ├── services/            # API service classes
│   │   └── httpActionResponse.ts # HttpActionResponse interface
│   ├── hooks/                # Shared hooks (currently empty)
│   ├── config/               # Configuration (currently empty)
│   └── constants/            # Constants (currently empty)
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── eslint.config.mjs         # ESLint flat config
├── .prettierrc               # Prettier configuration
├── postcss.config.mjs        # PostCSS configuration
├── next.config.ts            # Next.js configuration
└── components.json           # shadcn/ui configuration
```

## Build and Development Commands

**Always run commands from the `front-end/` directory:**

```bash
cd front-end
```

### Install Dependencies
```bash
npm install
```
This must be run before any other command. Takes approximately 15 seconds.

### Development Server
```bash
npm run dev
```
Starts the Next.js development server on http://localhost:3000.

### Production Build
```bash
npm run build
```
Builds the application for production. Takes approximately 30-60 seconds.

**Known Issue:** The build currently has a TypeScript error in `src/features/editor/edges/AnimatedEdge.tsx` related to the `EdgeProps<ConditionalEdgeData>` type. The type `ConditionalEdgeData` should only be used as the data parameter, not as the generic type for `EdgeProps`.

### Linting
```bash
npm run lint        # Check for linting errors
npm run lint:fix    # Auto-fix linting errors
```

**Known Issue:** The ESLint configuration has a circular structure error when running `npm run lint`. This is due to incompatibility between ESLint 9 flat config and the FlatCompat helper.

### Code Formatting
```bash
npm run format:check  # Check Prettier formatting
npm run format        # Fix Prettier formatting
```
Always run `npm run format` before committing changes.

## Key Conventions

### Path Aliases
Use `@/` path alias for imports (configured in `tsconfig.json`):
```typescript
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/stores";
import type { WorkflowNode } from "@/types/node";
```

### Component Structure
- UI primitives in `src/components/ui/` (shadcn/ui components)
- Feature components in `src/features/[feature]/components/`
- Client components must include `"use client";` directive

### Styling
- Use Tailwind CSS classes
- Use `cn()` utility for conditional class names
- CSS variables defined in `src/app/globals.css`
- Prettier sorts Tailwind classes automatically via `prettier-plugin-tailwindcss`

### State Management
- Editor state (nodes, edges) in `useEditorStore`
- Execution state in `useExecutionStore`
- Use selector functions to optimize re-renders

### Node Types
Four workflow node types: `start`, `task`, `condition`, `end`
- Defined in `src/types/node.ts`
- Components in `src/features/editor/nodes/`
- Registered in `nodeTypes` object

## Pre-Commit Checklist

1. Run `npm run format` to fix formatting
2. Run `npm run build` to check for TypeScript errors
3. Ensure all new components use proper TypeScript types
4. Add `"use client";` for components using hooks or browser APIs

## Notes

- No test suite is currently configured
- No CI/CD workflows configured (only Copilot coding agent workflow)
- The project uses React Flow v12 with custom node and edge components
- shadcn/ui components can be added using `npx shadcn@latest add [component]`