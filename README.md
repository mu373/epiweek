# epiweek

Epidemiological week conversion tool for TypeScript/JavaScript. Supports both MMWR (CDC) and ISO week systems.

Forked from [reichlab/mmwr-week](https://github.com/reichlab/mmwr-week), originally based on [jarad/MMWRWeek](https://github.com/jarad/MMWRweek) (R package).

## Installation

```shell
pnpm install epiweek
```

## Usage

```ts
// ESM
import { EpiWeek } from 'epiweek'

// CommonJS
const { EpiWeek } = require('epiweek')
```

### Basic Usage (MMWR - default)

```ts
// Create EpiWeek object
const week = new EpiWeek(2025, 48)
// EpiWeek { year: 2025, week: 48, day: 1, system: 'mmwr' }

// With day specified (legacy API)
new EpiWeek(2025, 48, 3)

// With options object
new EpiWeek(2025, 48, { day: 3 })
new EpiWeek(2025, 48, { system: 'mmwr', day: 3 })

// First day of epi year
week.startDate
// 2024-12-29

// Convert to JS Date
week.toJSDate()
// 2025-11-23

// Set from JS Date
week.fromJSDate(new Date(2025, 11, 27)) // Dec 27, 2025
// mutates week to { year: 2025, week: 52, day: 7 }

// Convert to epiweek format (yyyyww)
week.toEpiweek()
// 202552

// Set from epiweek
week.fromEpiweek(202532)
// mutates week to { year: 2025, week: 32, day: 1 }

// Number of weeks in epi year
week.nWeeks
// 53

// Week difference (this - other)
const other = new EpiWeek(2025, 3)
week.diffWeek(other)
// 29

// Apply week difference
week.applyWeekDiff(10)
// mutates week to { year: 2025, week: 42, day: 1 }
```

### ISO Week System

```ts
// Create with ISO system
const isoWeek = new EpiWeek(2025, 10, { system: 'iso' })
const isoWeekWithDay = new EpiWeek(2025, 10, { system: 'iso', day: 5 })

// ISO weeks start on Monday (day 1) and end on Sunday (day 7)
// MMWR weeks start on Sunday (day 1) and end on Saturday (day 7)
```

### Comparison Methods

```ts
const a = new EpiWeek(2025, 10)
const b = new EpiWeek(2025, 20)

a.equals(b)   // false
a.isBefore(b) // true
a.isAfter(b)  // false

// Cross-system comparison uses actual calendar dates
const mmwr = new EpiWeek(2024, 1, { system: 'mmwr' })
const iso = new EpiWeek(2024, 1, { system: 'iso' })
mmwr.isBefore(iso) // compares actual JS dates
```

### Date Iteration

```ts
const week = new EpiWeek(2025, 10)

// Iterate over all 7 days
for (const date of week.iterDates()) {
  console.log(date) // JS Date objects
}

// Collect as array
const dates = [...week.iterDates()]
// For MMWR: Sun, Mon, Tue, Wed, Thu, Fri, Sat
// For ISO: Mon, Tue, Wed, Thu, Fri, Sat, Sun
```

## MMWR vs ISO Week Systems

| Aspect | MMWR (CDC) | ISO |
|--------|------------|-----|
| Week starts | Sunday | Monday |
| Day numbering | Sun=1, Mon=2, ..., Sat=7 | Mon=1, Tue=2, ..., Sun=7 |
| Week 1 definition | First week with >=4 days in new year | Week containing Jan 4 |

## API

### `EpiWeek`

#### Constructor

```ts
new EpiWeek(year: number, week?: number, options?: EpiWeekOptions | number)
```

- `year` - Epidemiological year
- `week` - Week number (1-53), defaults to 1
- `options` - Either a number (legacy day parameter) or options object:
  - `system?: 'mmwr' | 'iso'` - Week system, defaults to `'mmwr'`
  - `day?: number` - Day of week (1-7), defaults to 1

#### Properties

- `year: number` - Epi year
- `week: number` - Epi week
- `day: number` - Day of week
- `system: WeekSystem` - Week system (`'mmwr'` or `'iso'`, readonly)
- `startDate: Date` - First day of epi year (getter)
- `nWeeks: number` - Number of weeks in this epi year (getter)

#### Methods

- `toJSDate(): Date` - Convert to JavaScript Date
- `fromJSDate(date?: Date): void` - Set from JavaScript Date (defaults to now)
- `toEpiweek(): number` - Convert to epiweek format (yyyyww)
- `fromEpiweek(epiweek: number): void` - Set from epiweek
- `diffWeek(other: EpiWeek): number` - Get week difference (this - other)
- `applyWeekDiff(delta: number): void` - Add/subtract weeks
- `equals(other: EpiWeek): boolean` - Check equality (same system, year, week, day)
- `isBefore(other: EpiWeek): boolean` - Check if before another EpiWeek
- `isAfter(other: EpiWeek): boolean` - Check if after another EpiWeek
- `iterDates(): Generator<Date>` - Iterate over all dates in the week

### Types

```ts
type WeekSystem = 'mmwr' | 'iso'

interface EpiWeekOptions {
  system?: WeekSystem
  day?: number
}

type Epiweek = number // format: yyyyww
```

## License

[MIT License](https://github.com/mu373/epiweek/blob/main/LICENSE)
