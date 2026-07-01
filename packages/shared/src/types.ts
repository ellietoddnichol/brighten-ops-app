// ─── Enums ────────────────────────────────────────────────────────────────────

export type EmployeeRole = 'ADMIN' | 'DISPATCHER' | 'FIELD_TECH';

export type JobStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETE' | 'CANCELLED';

export type RoofType = 'composition' | 'tile' | 'metal' | 'flat';

export type InverterType = 'string' | 'micro' | 'hybrid';

// ─── Employee ─────────────────────────────────────────────────────────────────

export interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  role: EmployeeRole;
  certifications: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateEmployeeInput = Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateEmployeeInput = Partial<CreateEmployeeInput>;

// ─── Job ──────────────────────────────────────────────────────────────────────

export interface Job {
  id: string;
  jobNumber: string;
  customerName: string;
  siteAddress: string;
  city: string;
  state: string;
  zip: string;
  status: JobStatus;
  systemSizeKw: number;
  panelCount: number;
  inverterType: InverterType;
  roofType: RoofType;
  hasBattery: boolean;
  hasEvCharger: boolean;
  hasMonitoring: boolean;
  scheduledDate?: Date | null;
  completedDate?: Date | null;
  budgetedHours?: number | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateJobInput = Omit<Job, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateJobInput = Partial<CreateJobInput>;

// ─── JobAssignment ────────────────────────────────────────────────────────────

export interface JobAssignment {
  id: string;
  jobId: string;
  employeeId: string;
  role?: string | null;
  assignedAt: Date;
}

export type CreateJobAssignmentInput = Omit<JobAssignment, 'id' | 'assignedAt'>;

// ─── Rate ─────────────────────────────────────────────────────────────────────

export interface Rate {
  id: string;
  role: string;
  ratePerHour: number;
  overtimeMultiplier: number;
  effectiveFrom: Date;
  effectiveTo?: Date | null;
  createdAt: Date;
}

export type CreateRateInput = Omit<Rate, 'id' | 'createdAt'>;

// ─── LabourEntry ──────────────────────────────────────────────────────────────

export interface LabourEntry {
  id: string;
  jobId: string;
  employeeId: string;
  clockIn: Date;
  clockOut?: Date | null;
  hoursWorked?: number | null;
  rateId: string;
  notes?: string | null;
  createdAt: Date;
}

export type ClockInInput = {
  employeeId: string;
  jobId: string;
  clockIn: Date;
  notes?: string;
};

export type ClockOutInput = {
  clockOut: Date;
};

// ─── CalculatorRun ────────────────────────────────────────────────────────────

export interface CalculatorRun {
  id: string;
  jobId?: string | null;
  systemSizeKw: number;
  panelCount: number;
  roofType: RoofType;
  hasBattery: boolean;
  hasEvCharger: boolean;
  hasMonitoring: boolean;
  estimatedLaborHours: number;
  estimatedMaterialCost: number;
  estimatedLaborCost: number;
  estimatedTotalCost: number;
  createdAt: Date;
}

// ─── API response envelope ────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  data: T;
}

export interface ApiError {
  error: {
    message: string;
    code?: string;
  };
}
