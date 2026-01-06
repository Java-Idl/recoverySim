# Attendance Recovery Planner (Viz Planner)

This document outlines the technical logic and mathematical models used in the Attendance Recovery Planner. It is designed to provide developers with a clear understanding of how "Safe Skips", "Bunk Budgets", and "Risk Levels" are calculated.

## Core Concepts

The application revolves around four key variables for each subject:
- **P**: Present classes (attended so far)
- **T**: Total classes (conducted so far)
- **F**: Future classes (remaining in the semester)
- **Target**: The minimum required attendance percentage (e.g., 75%)

These variables drive all derived metrics displayed in the UI.

## Calculations

### 1. Current Average
The simple weighted average of attendance right now.

> Current% = (P / T) * 100

*Note: If T=0, the result is 0.*

### 2. Optimistic Max (The "ceiling")
The maximum possible attendance percentage achievable if the student attends **every single future class**.

> Max% = ((P + F) / (T + F)) * 100

*Logic: If this value falls below the Target, it is mathematically impossible to recover without administrative intervention (triggers "Impossible" state).*

### 3. Bunk Budget (Consecutive Safe Skips)
This metric answers: "How many *next* classes can I skip *right now* before my current average drops below the target?"

> Buffer = floor( (P - (Target * T)) / Target )

*Constraint: Buffer >= 0*

### 4. Recovery Load (No Skips Requirement)
If the student is currently below the target, this metric calculates how many *consecutive* classes they must attend to reach the target.

> Needed = ceiling( ((Target * T) - P) / (1 - Target) )

### 5. Total Safe Skips (Projected)
This is a long-term metric. It answers: "How many total classes can I afford to miss over the *entire remainder of the semester* and still end up exactly on the target?"

Unlike "Bunk Budget" (which is immediate), this accounts for the expanded denominator of the full semester.

> SafeSkips = floor( (P + F) - (Target * (T + F)) )

*Note: If SafeSkips < 0, it is clamped to 0.*

## Logic Implementation
These calculations are centralized in `js/logic.js` within the `Logic.calc(p, t, future, target)` function. This ensures that the UI (`js/ui.js`) and any other consumers always receive consistent derived state.

## Configuration
The "Future Classes" (**F**) are determined by iterating through dates from `now` until `semEndDate` (defined in `config.json`), checking against holidays.
