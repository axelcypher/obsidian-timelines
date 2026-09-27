# Timelines (Revamped)

> **Private revamp.** This is a personal rewrite of [Timelines (Revamped)](https://github.com/seanlowe/obsidian-timelines) by
> [Sean Lowe](https://github.com/seanlowe), which itself continues [Timelines](https://github.com/Darakah/obsidian-timelines) by [Darakah](https://github.com/Darakah), maintained by [axelcypher](https://github.com/axelcypher)
> for my own use. It is not published in the Obsidian community plugin directory.
> All credit for the original plugin goes to its author. Please report issues with this
> version here, not upstream.

![Release](https://img.shields.io/github/v/release/axelcypher/obsidian-timelines)

## What's different in this revamp

- **Year display options** for very large or negative years: `yearScale`, `yearUnit`, `yearLocale`, `yearPrecision` and `yearAbsolute` – as codeblock arguments and per event (frontmatter and HTML events). Example: `-4560000000` → `4,56 Mrd`. Sorting still uses the original year.
- **`showEvents` codeblock option extended:** with `showEvents=true`, the source HTML event elements are shown in the note with their formatted date, title and description; per-event year options override the codeblock ones.
- **Formatted event attributes** are generated globally, and also render correctly in Live Preview.
- **Fix:** date range comparisons with negative years.
- **Plugin identity:** own plugin ID `axlc-timelines-revamped` and name *Timelines (Revamped)*.
- **Release workflow:** streamlined build & release workflow shared with my other revamps (the docs site deployment was removed).

Generate a chronological timeline in which all "events" are notes that include a specific tag or set of tags.

See the changelog from the last major update to view any breaking changes [here](./changelog.md#v200).

> First time users may find this [video tutorial](https://www.youtube.com/watch?v=4SQWnjniQAE) helpful.

The general documentation is the one of the upstream project: [seanlowe.github.io/obsidian-timelines](https://seanlowe.github.io/obsidian-timelines). Options added in this revamp are documented in [`docs/`](./docs/content/docs) of this repository.

![new timespans in vertical timelines!](./docs/assets/images/vertical-time-spans.png)

![horizontal timeline](./docs/assets/images/horizontal_example.png)

## Installation

### Manual

1. Download `main.js`, `manifest.json` and `styles.css` from the [latest release](https://github.com/axelcypher/obsidian-timelines/releases/latest).
2. Copy them into `.obsidian/plugins/axlc-timelines-revamped/` inside your vault.
3. Enable **Timelines (Revamped)** in **Settings → Community plugins**.

### BRAT

Add `axelcypher/obsidian-timelines` as a beta plugin in [BRAT](https://github.com/TfTHacker/obsidian42-brat).

### Switching from the original plugin

This revamp uses its own plugin ID (`axlc-timelines-revamped`), so it installs next to the original instead of replacing it.
Disable the original, copy its `data.json` into `.obsidian/plugins/axlc-timelines-revamped/` if you want to keep your settings, then enable this version.

## Upstream Release Notes

### v2.4.0

Implement Issues:
- `[Feature - Vertical] Allow custom date formatting` [#87](https://github.com/seanlowe/obsidian-timelines/issues/87)
- `[Feature - Horizontal] Implement Timeline-arrow as a way of connecting events` [#44](https://github.com/seanlowe/obsidian-timelines/issues/44)
- `[Feature - Horizontal] Implement timeline groups / subgroups` [#62](https://github.com/seanlowe/obsidian-timelines/issues/62)

**Changes:**
- custom date formatting:
  - added a new setting to allow users to specify a custom date format for the vertical timeline
  - wrote new function `formatDate` to handle the custom date format
  - updated the docs to reflect the new functionality
- timeline-arrow integration:
  - added a new event property `pointsTo` (`data-points-to`) to allow users to specify a target event to link to
  - wrote new function `makeArrowsArray` to handle finding links and creating the array of arrows to attach to the timeline
  - updated Insert commands to add the new property
  - updated the docs to reflect the new functionality
- Timeline groups / subgroups:
  - added a new event property `group` (`data-group`) to allow users to specify a group for the event ([docs](https://seanlowe.github.io/obsidian-timelines/docs/04_arguments/02_html_arguments/#group-data-group))
  - added functionality to allow users to reorder groups
  - edited logic to handle the new event property
  - updated Insert commands to add the new property
  - updated the docs to reflect the new functionality

See the [changelog](./changelog.md) for more details on previous releases.

## Contributors

Thanks to all contributors of the upstream project and the original plugin:

<a href="https://github.com/seanlowe/obsidian-timelines/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=seanlowe/obsidian-timelines" />
</a>

## License

Licensed under the MIT License. Original work © Sean Lowe, modifications © axelcypher.

## Support

This is a private revamp. Issues with this version belong in [axelcypher/obsidian-timelines](https://github.com/axelcypher/obsidian-timelines/issues), not upstream.
