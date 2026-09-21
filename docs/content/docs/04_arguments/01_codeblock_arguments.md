---
weight: 4001
title: Codeblock Arguments
icon: data_object
draft: false
toc: false
---

<br></br>

The only (currently) **required** argument for Timeline Codeblocks is `tags`.

Breaking down the filters:
- `tags`: the tags you want displayed on your timeline
- `startDate`: where you want your timeline to initially start displaying
- `endDate`: where you initially want your timeline to end
- `dateFormat`: a string with the format you want your dates to be displayed in. See below for acceptable values
- `yearScale`: an optional positive number by which displayed years are divided
- `yearUnit`: optional text appended to a scaled year, for example `Tsd`, `Mio`, or `Mrd`
- `yearLocale`: optional locale used for decimal and thousands separators, for example `de-DE`
- `yearPrecision`: maximum number of decimal places used for a scaled year (default: `3`)
- `yearAbsolute`: set to `true` to display negative years without the minus sign
- `divHeight`: how tall you would like the timeline to be
- `minDate`: minimum end-cap to prevent scrolling or viewing before this date
- `maxDate`: maximum end-cap to prevent scrolling or viewing after this date
- `zoomInLimit`: the furthest in you will be able to zoom. See below for acceptable values
- `zoomOutLimit`: the furthest out you will be able to zoom
- `type`: horizontal-specific key. Pass `flat` in order to render a horizontal timeline

Acceptable values for filters:
- `dateFormat`:
  - set to an empty string `""` by default
  - years:
    - `YYYY`: **unfiltered**, display as however you pass it
    - `YY`: last 2 digits of year, example, pass in 2019 and it will display as `19`
  - months:
    - `MM`: **unfiltered**, display as however you pass it
    - `M`: abbr month, display as `Jan`
    - `MMM`: full month, display as `January`
  - days:
    - `DD`: **unfiltered**, display as however you pass it
    - `D`: 1st, 2nd, 3rd, etc., display as `1st`
    - `DDD`: Sun, Mon, Tue, etc., display as `Sun`
    - `DDDD`: Sunday, Monday, Tuesday, etc., display as `Sunday`
  - hours:
    - `HH`: **unfiltered**, display as however you pass it
    - `H`: hours, display as `00`
- large year values:
  - These arguments only change the displayed `YYYY` value. Sorting continues to use the original year.
  - `yearScale` accepts any positive number, not only powers of one thousand.
  - Set **Maximum padding on dates** in the plugin settings to at least the number of digits in the largest year
    (for example, `10` for `4560000000`) so differently sized years continue to sort correctly.
  - Example for an event in year `-4560000000`:
    - `yearScale=1000000000`, `yearUnit=Mrd`, `yearLocale=de-DE`, and `yearAbsolute=true` display `4,56 Mrd`
    - `yearScale=1000`, `yearUnit=Tsd`, `yearLocale=de-DE`, and `yearAbsolute=true` display `4.560.000 Tsd`
    - `yearScale=1`, `yearLocale=de-DE`, and `yearAbsolute=true` display `4.560.000.000`
  - All five values can be overridden on individual events.
- `startDate`, `endDate`, `minDate`, `maxDate`: use the same format (`YYYY-MM-DD-HH`) as event date parameters
- `zoomInLimit`:
  - You can either use the built-in timescales, or you can provide a value (in milliseconds) manually. Acceptable values are `day`, `week`, `month-detail`, `month-vague`, and `year`. Do not include to have no restrictions on zooming in (default behaviour).
    - `day` zooms down to one day, but still shows hours
    - `week` zooms down to about a week and shows the days of that week
    - `month-detail` zooms down to about a month and shows each of the days
    - `month-vague` zooms down to about a month but does not show the days
    - `year` zooms down to about a year and shows each of the months
- `zoomOutLimit`:
  - requires a time, in milliseconds. One year is around `32140800000`, the default value is `315360000000000`, which is about 10,000 years
