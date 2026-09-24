---
weight: 2231
title: Showing the (previously) hidden HTML events in notes
description: An obsidian CSS snippet so that HTML events are still visible in Reading or Live Preview modes. 
icon: palette
draft: false
toc: false
---

<br></br>

Timeline span and div entries (`.ob-timelines` class) are hidden by default. The plugin always adds two generated
attributes to rendered HTML events:

- `data-timeline-event-label`: formatted start/end date and title
- `data-timeline-description-label`: description when the element has no body text

Date labels honor the formatting attributes on each event, including `data-year-scale`, `data-year-unit`,
`data-year-locale`, `data-year-precision`, and `data-year-absolute`.

Use an Obsidian CSS snippet to display the events and their generated attributes:

```css
.ob-timelines {
  display: block !important;
  margin: 0.75em 0;
  padding: 0.5em 0.75em;
  border-left: 3px solid var(--text-accent);
  background: var(--background-secondary);
}

.ob-timelines::before {
  content: attr(data-timeline-event-label);
  display: block;
  color: var(--text-accent);
  font-weight: 600;
}

.ob-timelines::after {
  content: attr(data-timeline-description-label);
  display: block;
  color: var(--text-normal);
}
```

Using the above snippet, a span like this: 

```html
<div
  class='ob-timelines'
  data-start-date='1499-03-28-00'
  data-title="An example">
</div>
```

The generated labels are available in Reading and Live Preview modes after the event has been processed by the plugin.

> **Note:** It is *highly* recommended to use `div` elements for HTML events rather than `span` elements.

I've noticed that using a `span` in Reading Mode or when viewing a `span` event in an Popover tends to render incorrectly. If proper rendering is a must-have, I recommend using a `div` for your events.
