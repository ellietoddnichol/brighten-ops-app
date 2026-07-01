# Install Calculator – Functional Specification

## Purpose

The Install Calculator is a tool that estimates the labour hours, material cost, and total project cost for a solar installation based on job parameters entered by a dispatcher or estimator. Estimates are saved as `CalculatorRun` records and can be linked to an existing `Job`.

---

## Inputs

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `systemSizeKw` | number | Yes | Total system size in kilowatts (e.g. `7.2`) |
| `panelCount` | integer | Yes | Number of panels to be installed |
| `roofType` | enum | Yes | `composition` \| `tile` \| `metal` \| `flat` |
| `hasBattery` | boolean | No | Whether battery storage is included |
| `hasEvCharger` | boolean | No | Whether EV charger installation is included |
| `hasMonitoring` | boolean | No | Whether monitoring system is included |
| `jobId` | string | No | Link to an existing job record |

---

## Calculation Logic

### 1. Base Labour Hours

Base labour hours are derived from system size using a tiered multiplier:

| System Size | Hours per kW |
|-------------|-------------|
| ≤ 5 kW | 4.5 h/kW |
| 5.01 – 10 kW | 4.0 h/kW |
| > 10 kW | 3.5 h/kW |

```
baseHours = systemSizeKw × hoursPerKw(systemSizeKw)
```

### 2. Roof-Type Adjustment

Roof type adds a labour multiplier:

| Roof Type | Multiplier |
|-----------|-----------|
| `composition` | 1.0× (baseline) |
| `metal` | 1.1× |
| `tile` | 1.3× |
| `flat` | 1.2× |

```
adjustedHours = baseHours × roofMultiplier(roofType)
```

### 3. Add-On Labour Hours

| Add-On | Additional Hours |
|--------|----------------|
| Battery | +8 h |
| EV Charger | +4 h |
| Monitoring | +2 h |

```
totalLaborHours = adjustedHours + batteryHours + evChargerHours + monitoringHours
```

### 4. Material Cost

Material cost is estimated at a flat rate per kW plus per-panel cost, plus add-on material costs:

| Component | Rate |
|-----------|------|
| Per-kW base material | $350 / kW |
| Per-panel racking & hardware | $45 / panel |
| Battery add-on | $8,500 flat |
| EV charger add-on | $1,200 flat |
| Monitoring add-on | $350 flat |

```
materialCost = (systemSizeKw × 350)
             + (panelCount × 45)
             + (hasBattery ? 8500 : 0)
             + (hasEvCharger ? 1200 : 0)
             + (hasMonitoring ? 350 : 0)
```

### 5. Labour Cost

Labour cost uses the active `FIELD_TECH` rate from the `Rate` table:

```
laborCost = totalLaborHours × activeFieldTechRate
```

### 6. Total Estimated Cost

```
totalCost = materialCost + laborCost
```

---

## Outputs

| Field | Type | Notes |
|-------|------|-------|
| `estimatedLaborHours` | number | Rounded to two decimal places |
| `estimatedMaterialCost` | number | USD, rounded to two decimal places |
| `estimatedLaborCost` | number | USD, rounded to two decimal places |
| `estimatedTotalCost` | number | USD, rounded to two decimal places |

---

## API Endpoint

```
POST /api/calculator/estimate
```

**Request body** (JSON):

```json
{
  "systemSizeKw": 7.5,
  "panelCount": 20,
  "roofType": "composition",
  "hasBattery": true,
  "hasEvCharger": false,
  "hasMonitoring": true,
  "jobId": "clxyz123"
}
```

**Response** (JSON):

```json
{
  "id": "clrun456",
  "estimatedLaborHours": 38.0,
  "estimatedMaterialCost": 13475.00,
  "estimatedLaborCost": 2280.00,
  "estimatedTotalCost": 15755.00
}
```

---

## Edge Cases & Validation

- `systemSizeKw` must be > 0 and ≤ 1000
- `panelCount` must be a positive integer
- `roofType` must be one of the four allowed values
- If `jobId` is provided it must reference an existing `Job` record
- If no active `FIELD_TECH` rate exists in `Rate`, return a `422 Unprocessable Entity` error with message `"No active FIELD_TECH rate found"`
