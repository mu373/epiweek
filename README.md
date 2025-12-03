# mmwr-week

MMWR (Morbidity and Mortality Weekly Report) week conversion tool for TypeScript/JavaScript.

Forked from [reichlab/mmwr-week](https://github.com/reichlab/mmwr-week), originally based on [jarad/MMWRWeek](https://github.com/jarad/MMWRweek) (R package).

## Installation

```shell
pnpm install mmwr-week
```

## Usage

```ts
// ESM
import { MMWRDate } from 'mmwr-week'

// CommonJS
const { MMWRDate } = require('mmwr-week')
```

```ts
// Create MMWRDate object
const mdate = new MMWRDate(2025, 48)
// MMWRDate { year: 2025, week: 48, day: 1 }

// First day of MMWR year
mdate.startDate
// 2024-12-29

// Convert to JS Date
mdate.toJSDate()
// 2025-11-23

// Set from JS Date
mdate.fromJSDate(new Date(2025, 11, 27)) // Dec 27, 2025
// mutates mdate to { year: 2025, week: 52, day: 7 }

// Convert to epiweek format (yyyyww)
mdate.toEpiweek()
// 202552

// Set from epiweek
mdate.fromEpiweek(202532)
// mutates mdate to { year: 2025, week: 32, day: 1 }

// Number of MMWR weeks in a year
mdate.nWeeks
// 53

// Week difference (this - other)
const odate = new MMWRDate(2025, 3)
mdate.diffWeek(odate)
// 29

// Apply week difference
mdate.applyWeekDiff(10)
// mutates mdate to { year: 2025, week: 42, day: 1 }
```

## API

### `MMWRDate`

#### Constructor

```ts
new MMWRDate(year: number, week?: number, day?: number)
```

- `year` - MMWR year
- `week` - MMWR week (1-53), defaults to 1
- `day` - MMWR day (1-7, Sunday=1), defaults to 1

#### Properties

- `year: number` - MMWR year
- `week: number` - MMWR week
- `day: number` - MMWR day (Sunday=1, Saturday=7)
- `startDate: Date` - First day of MMWR year (getter)
- `nWeeks: number` - Number of weeks in this MMWR year (getter)

#### Methods

- `toJSDate(): Date` - Convert to JavaScript Date
- `fromJSDate(date?: Date): void` - Set from JavaScript Date (defaults to now)
- `toEpiweek(): number` - Convert to epiweek format (yyyyww)
- `fromEpiweek(epiweek: number): void` - Set from epiweek
- `diffWeek(other: MMWRDate): number` - Get week difference (this - other)
- `applyWeekDiff(delta: number): void` - Add/subtract weeks

### `Epiweek`

Type alias for `number` representing epiweek in yyyyww format.

## License

[MIT License](https://github.com/mu373/mmwr-week/blob/main/LICENSE)
