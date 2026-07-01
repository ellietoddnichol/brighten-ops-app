import { Link } from 'react-router-dom'
import {
  nextWorkflowPhase,
  previousWorkflowPhase,
  workflowPhaseLabel,
  workflowPhasePath,
  type WorkflowPhaseId,
} from '../lib/workflow'

interface WorkflowPhaseNavProps {
  projectId: string
  quoteId?: string | null
  currentPhase: WorkflowPhaseId
  nextDisabled?: boolean
  nextLabel?: string
}

export default function WorkflowPhaseNav({
  projectId,
  quoteId,
  currentPhase,
  nextDisabled = false,
  nextLabel,
}: WorkflowPhaseNavProps) {
  const previous = previousWorkflowPhase(currentPhase)
  const next = nextWorkflowPhase(currentPhase)

  return (
    <div className="workflow-phase-nav card">
      <div className="workflow-phase-nav-inner">
        {previous ? (
          <Link
            className="workflow-nav-button workflow-nav-back"
            to={workflowPhasePath(previous, projectId, quoteId)}
          >
            ← {workflowPhaseLabel(previous)}
          </Link>
        ) : (
          <span />
        )}

        {next && (
          nextDisabled || (next !== 'setup' && !quoteId) ? (
            <span className="workflow-nav-button workflow-nav-next workflow-nav-disabled">
              {nextLabel ?? `${workflowPhaseLabel(next)} →`}
            </span>
          ) : (
            <Link
              className="workflow-nav-button workflow-nav-next button-link"
              to={workflowPhasePath(next, projectId, quoteId)}
            >
              {nextLabel ?? `${workflowPhaseLabel(next)} →`}
            </Link>
          )
        )}
      </div>
    </div>
  )
}
