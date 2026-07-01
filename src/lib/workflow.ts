export const WORKFLOW_PHASES = [
  {
    id: 'setup',
    label: 'Setup',
    description: 'Project, vendor & quote',
  },
  {
    id: 'review',
    label: 'Review Lines',
    description: 'Material pricing & labor assignment',
  },
  {
    id: 'labor',
    label: 'Labor Rules',
    description: 'Base hours & modifiers',
  },
  {
    id: 'estimate',
    label: 'Estimate',
    description: 'Build pricing',
  },
] as const

export type WorkflowPhaseId = (typeof WORKFLOW_PHASES)[number]['id']

export interface WorkflowPhaseStatus {
  complete: boolean
  detail: string
}

export interface ProjectWorkflowStatus {
  projectId: string
  projectName: string
  quoteId: string | null
  quoteNumber: string | null
  phases: Record<WorkflowPhaseId, WorkflowPhaseStatus>
  suggestedPhase: WorkflowPhaseId
}

export interface ProjectWorkflowSummary {
  projectId: string
  quoteId: string | null
  quoteNumber: string | null
  lineCount: number
  hasEstimate: boolean
  suggestedPhase: WorkflowPhaseId
  phaseLabel: string
}

export function workflowPhaseLabel(phaseId: WorkflowPhaseId): string {
  return WORKFLOW_PHASES.find((phase) => phase.id === phaseId)?.label ?? phaseId
}

export function workflowPhasePath(
  phaseId: WorkflowPhaseId,
  projectId: string,
  quoteId?: string | null,
): string {
  switch (phaseId) {
    case 'setup':
      return `/projects/${projectId}`
    case 'review':
      return quoteId ? `/quotes/${quoteId}` : `/projects/${projectId}`
    case 'labor':
      return quoteId
        ? `/labor-rules?projectId=${projectId}&quoteId=${quoteId}`
        : '/labor-rules'
    case 'estimate':
      return quoteId
        ? `/projects/${projectId}/estimate?quoteId=${quoteId}`
        : `/projects/${projectId}/estimate`
  }
}

export function nextWorkflowPhase(
  current: WorkflowPhaseId,
): WorkflowPhaseId | null {
  const index = WORKFLOW_PHASES.findIndex((phase) => phase.id === current)
  if (index < 0 || index >= WORKFLOW_PHASES.length - 1) return null
  return WORKFLOW_PHASES[index + 1].id
}

export function previousWorkflowPhase(
  current: WorkflowPhaseId,
): WorkflowPhaseId | null {
  const index = WORKFLOW_PHASES.findIndex((phase) => phase.id === current)
  if (index <= 0) return null
  return WORKFLOW_PHASES[index - 1].id
}

export function summaryPhaseLabel(summary: ProjectWorkflowSummary): string {
  switch (summary.suggestedPhase) {
    case 'setup':
      return 'Setup — add vendor quote'
    case 'review':
      return summary.lineCount > 0 ? 'Review lines' : 'Review lines — add items'
    case 'labor':
      return 'Tune labor rules'
    case 'estimate':
      return summary.hasEstimate ? 'Estimate ready' : 'Build estimate'
  }
}
