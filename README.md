# Attendance Recovery Planner (Viz Planner)

This document outlines the technical logic and mathematical models used in the Attendance Recovery Planner. It is designed to provide developers with a clear understanding of how "Safe Skips", "Bunk Budgets", and "Risk Levels" are calculated.

## Core Concepts

The application revolves around four key variables for each subject:
- $P$: Present classes (attended so far)
- $T$: Total classes (conducted so far)
- $F$: Future classes (remaining in the semester)
- $Target$: The minimum required attendance percentage (e.g., 75%)

These variables drive all derived metrics displayed in the UI.

## Calculations

### 1. Current Average
The simple weighted average of attendance right now.

$$
Current\% = \frac{P}{T} \times 100
$$

- **Technical Note**: If $T=0$, the result is forced to $0$ to avoid division by zero errors.

### 2. Optimistic Max (The "ceiling")
The maximum possible attendance percentage achievable if the student attends **every single future class**.

$$
Max\% = \frac{P + F}{T + F} \times 100
$$

- **Logic**: If this value falls below the $Target$, it is mathematically impossible to recover without administrative intervention.
- **UI State**: Triggers the `isImpossible` flag (Red "Max X% Possible" badge).

### 3. Bunk Budget (Consecutive Safe Skips)
This metric answers: "How many *next* classes can I skip *right now* before my current average drops below the target?"

$$
Buffer = \lfloor \frac{P - (Target \times T)}{Target} \rfloor
$$
*Simplified derivation:*
We want to find maximum $k$ such that:
$$
\frac{P}{T + k} \ge Target
$$
Solving for $k$:
$$
P \ge Target \times (T + k) \\
P - (Target \times T) \ge Target \times k \\
k \le \frac{P - (Target \times T)}{Target}
$$

- **Constraint**: $\text{Buffer} \ge 0$.
- **UI State**: Displayed as "Bunk Budget: X".

### 4. Recovery Load (No Skips Requirement)
If the student is currently below the target, this metric calculates how many *consecutive* classes they must attend to reach the target.

$$
Needed = \lceil \frac{(Target \times T) - P}{1 - Target} \rceil
$$
*Simplified derivation:*
We want minimum $n$ such that:
$$
\frac{P + n}{T + n} \ge Target
$$
Solving for $n$:
$$
P + n \ge Target \times (T + n) \\
P + n \ge (Target \times T) + (Target \times n) \\
n - (Target \times n) \ge (Target \times T) - P \\
n(1 - Target) \ge (Target \times T) - P \\
n \ge \frac{(Target \times T) - P}{1 - Target}
$$

- **UI State**: Displayed as "Requirement: X (No Skips)".

### 5. Total Safe Skips (Projected)
This is a long-term metric. It answers: "How many total classes can I afford to miss over the *entire remainder of the semester* and still end up exactly on the target?"

Unlike "Bunk Budget" (which is immediate), this accounts for the expanded denominator of the full semester.

$$
SafeSkips = \lfloor (P + F) - (Target \times (T + F)) \rfloor
$$

*Derivation:*
Let $S$ be the number of skips. The final attendance will be:
$$
\frac{P + (F - S)}{T + F} \ge Target
$$
Solving for $S$:
$$
P + F - S \ge Target \times (T + F) \\
P + F - (Target \times (T + F)) \ge S
$$

- **UI State**: Displayed as "Total Safe: X".
- **Note**: If $SafeSkips < 0$, it is clamped to 0.

## Logic Implementation
These calculations are centralized in `js/logic.js` within the `Logic.calc(p, t, future, target)` function. This ensures that the UI (`js/ui.js`) and any other consumers always receive consistent derived state.

## Configuration
The "Future Classes" ($F$) are determined by iterating through dates from `now` until `semEndDate`, checking against holidays and the weekly schedule defined in `config.json`.
