import { Link } from 'react-router-dom'
import type { ProjectWorkflowStatus } from '../lib/workflow'
import { WORKFLOW_PHASES, workflowPhasePath, type WorkflowPhaseId } from '../lib/workflow'

interface ProjectWorkflowStepperProps {
  projectId: string
  quoteId?: string | null
  currentPhase: WorkflowPhaseId
  status: ProjectWorkflowStatus
}

export default function ProjectWorkflowStepper({
  projectId,
  quoteId,
  currentPhase,
  status,
}: ProjectWorkflowStepperProps) {
  const activeQuoteId = quoteId ?? status.quoteId

  return (
    <nav className="workflow-stepper card" aria-label="Estimate workflow">
      <div className="workflow-stepper-header">
        <div>
          <p className="workflow-kicker">Estimate workflow</p>
          <h2 className="workflow-title">{status.projectName}</h2>
          {status.quoteNumber && (
            <p className="muted workflow-quote">Quote #{status.quoteNumber}</p>
          )}
        </div>
        <p className="workflow-suggested muted">
          Suggested next: <strong>{WORKFLOW_PHASES.find((p) => p.id === status.suggestedPhase)?.label}</strong>
        </p>
      </div>

      <ol className="workflow-steps">
        {WORKFLOW_PHASES.map((phase, index) => {
          const phaseStatus = status.phases[phase.id]
          const isCurrent = phase.id === currentPhase
          const isComplete = phaseStatus.complete
          const needsQuote = phase.id !== 'setup' && !activeQuoteId
          const href = workflowPhasePath(phase.id, projectId, activeQuoteId)

          return (
            <li
              key={phase.id}
              className={[
                'workflow-step',
                isCurrent ? 'workflow-step-current' : '',
                isComplete ? 'workflow-step-complete' : '',
                needsQuote ? 'workflow-step-disabled' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="workflow-step-index">{index + 1}</span>
              {needsQuote ? (
                <span className="workflow-step-body">
                  <span className="workflow-step-label">{phase.label}</span>
                  <span className="workflow-step-detail muted">{phase.description}</span>
                </span>
              ) : (
                <Link to={href} className="workflow-step-body">
                  <span className="workflow-step-label">{phase.label}</span>
                  <span className="workflow-step-detail muted">{phaseStatus.detail}</span>
                </Link>
              )}
              {isComplete && <span className="workflow-step-check" aria-hidden>✓</span>}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
