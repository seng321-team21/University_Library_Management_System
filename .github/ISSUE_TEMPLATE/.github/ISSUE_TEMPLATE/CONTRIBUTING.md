# Contributing Guide

This project follows a Git-Flow based workflow.

## Branches
- `main`: stable, release-ready code. Only updated via PR from `develop` at the end of a sprint.
- `develop`: integration branch. All feature work is merged here.
- `feature/<short-name>`: new features or documents (e.g. `feature/loan-module`).
- `bugfix/<short-name>`: bug fixes (e.g. `bugfix/fine-calculation`).

Direct pushes to `main` and `develop` are blocked by branch protection rules.

## Workflow
1. Pick or create a GitHub Issue and assign yourself.
2. Create a branch from `develop` using the naming convention above.
3. Commit your work in small, meaningful commits.
4. Open a Pull Request into `develop` and fill in the PR template.
5. Link the issue in the PR description (e.g. `Closes #12`).
6. Request a review from at least one teammate.
7. After 1 approval, merge the PR. Delete the feature branch afterwards.

## Commit Message Format
Use the format `type: short description`.
- `feat:` a new feature
- `fix:` a bug fix
- `docs:` documentation changes
- `chore:` maintenance, configuration, tooling
- `refactor:` code change without behavior change
- `test:` adding or updating tests

Example: `docs: add system vision section`

## Pull Request Review Rules
- At least 1 approval is required before merging.
- You cannot approve your own PR.
- Reviewers check correctness, consistency with the Sprint requirements, and clarity.

## Releases
At the end of each sprint, a PR is opened from `develop` to `main` and a release tag is created (e.g. `v0.1.0` for Sprint 1).

## Use Your Own Account
Always commit with your own GitHub account so individual contributions stay traceable.
