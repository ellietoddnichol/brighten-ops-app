import type { EstimateLine, EstimateVersion } from '../types/database'

export interface ProposalLineRow {
  lineNumber: number
  partNumber: string | null
  description: string
  quantity: number
  unit: string
  materialAmount: number
  installationAmount: number
  lineTotal: number
}

export interface ProposalDocumentData {
  title: string
  preparedDate: string
  validThroughDate: string
  customerName: string | null
  projectName: string
  location: string | null
  quoteNumber: string | null
  vendorName: string | null
  estimateVersionName: string
  lines: ProposalLineRow[]
  materialTotal: number
  installationTotal: number
  markupTotal: number
  proposalTotal: number
  showPartNumbers: boolean
  scopeNotes: string
}

export function buildProposalLines(
  lines: EstimateLine[],
  showPartNumbers: boolean,
): ProposalLineRow[] {
  return lines.map((line, index) => {
    const materialAmount = line.material_cost
    const installationAmount = line.labor_cost
    return {
      lineNumber: index + 1,
      partNumber: showPartNumbers ? (line.quote_items?.part_number ?? null) : null,
      description: line.quote_items?.description ?? 'Scope item',
      quantity: line.quantity,
      unit: line.quote_items?.unit ?? 'EA',
      materialAmount,
      installationAmount,
      lineTotal: materialAmount + installationAmount,
    }
  })
}

export function buildProposalDocument(input: {
  projectName: string
  customerName: string | null
  location: string | null
  quoteNumber: string | null
  vendorName: string | null
  estimate: EstimateVersion
  lines: EstimateLine[]
  title: string
  preparedDate: string
  validThroughDate: string
  showPartNumbers: boolean
  scopeNotes: string
}): ProposalDocumentData {
  const proposalLines = buildProposalLines(input.lines, input.showPartNumbers)

  return {
    title: input.title,
    preparedDate: input.preparedDate,
    validThroughDate: input.validThroughDate,
    customerName: input.customerName,
    projectName: input.projectName,
    location: input.location,
    quoteNumber: input.quoteNumber,
    vendorName: input.vendorName,
    estimateVersionName: input.estimate.version_name,
    lines: proposalLines,
    materialTotal: input.estimate.material_total,
    installationTotal: input.estimate.labor_cost_total,
    markupTotal: input.estimate.markup_total,
    proposalTotal: input.estimate.estimate_total,
    showPartNumbers: input.showPartNumbers,
    scopeNotes: input.scopeNotes,
  }
}

export const DEFAULT_PROPOSAL_TERMS = `This proposal covers Division 10 toilet accessories and related installation as described above. Pricing is based on the vendor quote and Brighten labor standards in effect at the time of estimate. Final contract amount may be adjusted if scope, quantities, or site conditions change.`
