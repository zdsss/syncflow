import api from './api';

// ── Full Dashboard ──────────────────────────────────────────────────

export async function getDashboard() {
  return api.get('/dashboard');
}

export async function getDashboardSummary() {
  return api.get('/dashboard/summary');
}

export async function getWarnings() {
  return api.get('/dashboard/warnings');
}

export async function getRisks() {
  return api.get('/dashboard/risks');
}

export async function getSuggestions() {
  return api.get('/dashboard/suggestions');
}

// ── Enhanced Dashboard (v3) ─────────────────────────────────────────

export async function getDashboardOverview() {
  return api.get('/dashboard/overview');
}

export async function getDashboardProjectProgress() {
  return api.get('/dashboard/project-progress');
}

export async function getDashboardUpcomingMilestones() {
  return api.get('/dashboard/upcoming-milestones');
}

export async function getDashboardPendingApprovals() {
  return api.get('/dashboard/pending-approvals');
}
