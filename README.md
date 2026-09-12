# Deadlines

> See the pressure coming.

Deadlines is a mobile-first workload management app designed for university students who are overwhelmed not by one major task, but by many commitments piling up at the same time.

Traditional task managers tell users **what they need to do**.

Deadlines focuses on a different question:

**How much are you carrying, and when will it become too much?**

Instead of presenting another task list or productivity dashboard, Deadlines turns commitments into a visual workload timeline. Students can see future pressure building, understand why a period is becoming overloaded, and rebalance their commitments before burnout happens.

---

## The Problem

University students manage responsibilities across many different areas:

- Assignments and exams
- Part-time jobs
- Group projects
- Meetings
- Personal errands
- Social commitments
- Rest and recovery

The problem is rarely one individual task.

The problem is that these commitments exist across different platforms and different parts of life, making the **combined workload difficult to see**.

A calendar may show when events happen.
A to-do list may show what needs to be completed.

Neither necessarily tells a student:

> "Three difficult commitments are converging on Thursday, and your workload is about to become unsustainable."

By the time students recognise the overload, they may already be exhausted.

---

## Our Solution

Deadlines makes future workload visible before it becomes overwhelming.

The application combines commitments into a single workload timeline and converts them into an intuitive visual representation of pressure.

The core experience follows three steps:

### 1. See

Commitments appear as timelines extending toward their deadlines.

Future commitments remain visible, while active commitments become visually prominent.

Each active commitment is represented by a runner — a visual metaphor for the user being divided across multiple simultaneous responsibilities.

As workload increases, the runners become increasingly fatigued.

Predicted periods of excessive workload appear directly on the timeline as **pressure zones**.

### 2. Understand

Users can select a pressure zone to understand what is causing it.

For example:

> **Thursday — High Pressure**
>
> Database Assignment — Hard  
> Networking Test — Hard  
> Part-Time Shift — Fixed  
>
> 3 major commitments converge within 48 hours.

Instead of showing an unexplained score, Deadlines explains the factors contributing to the workload.

### 3. Adjust

Users can rebalance flexible commitments and immediately preview how the change affects their future workload.

For example:

> Move "Database Research" from Thursday to Tuesday

The timeline recalculates:

> **Overloaded → Busy**

The pressure zone shrinks and the visual state of the runners improves.

This turns Deadlines from a passive workload tracker into a simple decision-support tool.

---

## Key Features

### Visual Workload Timeline

Deadlines visualises commitments across time rather than reducing them to another task list.

The timeline communicates:

- Commitment duration
- Start and deadline
- Difficulty
- Simultaneous commitments
- Deadline convergence
- Predicted workload pressure

Users can switch between Day, Week and Month views.

### Workload Runners

Each active commitment is represented through a running character.

The runner is not a game mechanic. It is an ambient visual indicator of workload.

As responsibilities accumulate:

- More runners appear
- The user appears increasingly fragmented
- Runner movement becomes slower
- Fatigue becomes more visible

This allows workload to be understood at a glance without requiring users to interpret analytics or numerical dashboards.

### Pressure Forecasting

Deadlines analyses upcoming commitments and identifies periods where workload is likely to converge.

Instead of only warning users when a deadline is close, the system asks:

**When will several responsibilities become difficult to carry together?**

These periods are represented as pressure zones directly on the timeline.

### Priority-Based Planning

Urgency and importance are treated separately.

Deadlines can estimate urgency based on factors such as:

- Deadline proximity
- Difficulty
- Duration
- Current workload
- Whether the commitment can be moved

Users remain in control of personal importance.

They can organise their own life modules, for example:

- University
- Work
- Health
- Hackathons
- Family
- Personal
- Social

Modules can be reordered and assigned different priority levels.

This allows Deadlines to understand not only what is urgent, but what matters most to the individual user.

### Flexible Rebalancing

Commitments can be classified as:

- Fixed
- Flexible
- Droppable

Deadlines therefore avoids suggesting unrealistic changes to commitments that cannot be moved.

Flexible commitments can instead be repositioned to reduce future workload.

Users can preview the effect before applying the change.

### Connected Timeline

Student workload often exists across multiple platforms.

Deadlines is designed to support integrations with services such as:

- Outlook Calendar
- Microsoft Teams
- Other calendar services
- Manually entered commitments

Imported commitments are normalised into the same workload system.

Instead of repeatedly switching between platforms, users can preview relevant information directly inside Deadlines and open the original source only when necessary.

### Low-Attention Experience

A workload-management application should not become another responsibility the user has to manage.

Deadlines is therefore designed around a low-attention interaction model.

Users should not need to repeatedly open the application simply to check whether something requires attention.

Future extensions include:

- Home Screen widgets
- Lock Screen information
- Selective workload notifications
- Quick actions

Notifications are intended for meaningful workload changes rather than repetitive deadline reminders.

For example:

> **Pressure rising Friday**
>
> A new commitment now overlaps with three existing responsibilities.

If nothing important has changed, Deadlines stays quiet.

---

## What Makes Deadlines Different?

Most productivity tools represent work as information:

- Lists
- Calendar blocks
- Progress bars
- Percentages
- Dashboards

Deadlines represents workload as **lived strain**.

A conventional productivity application may tell a student:

> "You have 7 tasks."

Deadlines instead communicates:

> "These responsibilities converge in three days, and this is where your workload becomes difficult to sustain."

The objective is not to increase the amount of time students spend managing productivity software.

The objective is to help them recognise pressure early enough to act.

> **Deadlines stays out of your way until your workload needs your attention.**

---

## Workload Engine

Deadlines uses a deterministic workload engine rather than relying on an opaque AI-generated score.

Each commitment contributes to workload according to factors such as:

- Difficulty
- Duration
- Deadline proximity
- Simultaneous active commitments
- Deadline convergence

A simplified MVP model uses:

| Difficulty | Weight |
|---|---:|
| Easy | 1 |
| Medium | 2 |
| Hard | 3 |

The daily workload is calculated from the combined difficulty of active commitments, with additional pressure when multiple deadlines converge within the same period.

The resulting workload state can be classified as:

| Score | State |
|---|---|
| 0–3 | Manageable |
| 4–6 | Busy |
| 7–9 | Strained |
| 10+ | Overloaded |

These states drive the visual system, including pressure zones and runner fatigue.

---

## Product Flow

```text
Outlook / Teams / Calendar / Manual Input
                    │
                    ▼
          Unified Commitments
                    │
                    ▼
             Workload Engine
                    │
          ┌─────────┴─────────┐
          ▼                   ▼
   Pressure Forecast     Priority Engine
          │                   │
          └─────────┬─────────┘
                    ▼
          Visual Workload Timeline
                    │
                    ▼
         Pressure / Runner State
                    │
                    ▼
        Preview & Rebalance Work