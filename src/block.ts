import type { MetadataCache, TFile, Vault } from 'obsidian'

import { buildHorizontalTimeline, buildVerticalTimeline, showEmptyTimelineMessage } from './timelines'
import {
  AllNotesData,
  CardContainer,
  EventDataObject,
  HorizontalTimelineInput,
  InternalTimelineArgs,
  TimelinesSettings,
  YearDisplayOptions,
} from './types'
import {
  buildTimelineDate,
  cleanDate,
  convertEntryToMilliseconds,
  createTagList,
  filterMdFiles,
  getEventData,
  getEventYearDisplayOptions,
  getEventsInFile,
  getImgUrl,
  getNumEventsInFile,
  isHTMLElementType,
  logger,
  setDefaultArgs,
  sortTimelineDates,
} from './utils'

export class TimelineBlockProcessor {
  appVault: Vault
  args: InternalTimelineArgs
  currentFileList: TFile[]
  files: TFile[]
  metadataCache: MetadataCache
  settings: TimelinesSettings

  constructor( settings: TimelinesSettings, metadataCache: MetadataCache, appVault: Vault ) {
    this.appVault = appVault
    this.metadataCache = metadataCache
    this.settings = settings
    this.setup()
  }

  setup() {
    this.args = setDefaultArgs( this.settings )
    this.files = this.appVault.getMarkdownFiles()
  }

  /**
   * Read the arguments from the codeblock
   *
   * @param visTimeline - whether or not we're rendering a vis-timeline
   * @param source - the codeblock source string
   */
  async readArguments( source: string ) {
    source.split( '\n' ).map(( entry ) => {
      if ( !entry ) return

      entry = entry.trim()
      const [ tag, rawValue ] = entry.split( '=' )
      const value = rawValue.trim()

      if ( tag.includes( 'Date' )) {
        // startDate, endDate, minDate, maxDate
        const result = buildTimelineDate( value, parseInt( this.settings.maxDigits ))
        this.args[tag] = result
        return
      }

      switch ( tag ) {
      case 'tags':
        this.args[tag] = createTagList( value, this.settings.timelineTag )
        break
      case 'zoomInLimit':
        this.args[tag] = convertEntryToMilliseconds( value )
        break
      case 'zoomOutLimit':
      case 'divHeight':
        this.args[tag] = parseInt( value )
        break
      case 'yearScale':
        if ( Number.isFinite( Number( value )) && Number( value ) > 0 ) {
          this.args[tag] = Number( value )
        } else {
          console.warn( `Invalid yearScale '${value}'. Expected a positive number.` )
        }
        break
      case 'yearPrecision':
        if ( Number.isFinite( Number( value )) && Number( value ) >= 0 ) {
          this.args[tag] = Number( value )
        } else {
          console.warn( `Invalid yearPrecision '${value}'. Expected zero or a positive number.` )
        }
        break
      case 'yearAbsolute':
        this.args[tag] = value.toLowerCase() === 'true'
        break
      default:
        this.args[tag] = value
        break
      }
    })
  }

  private getMergedYearDisplayOptions( eventOptions: YearDisplayOptions ): YearDisplayOptions {
    return {
      absolute: eventOptions.absolute ?? this.args.yearAbsolute,
      locale: eventOptions.locale ?? this.args.yearLocale,
      precision: eventOptions.precision ?? this.args.yearPrecision,
      scale: eventOptions.scale ?? this.args.yearScale,
      unit: eventOptions.unit ?? this.args.yearUnit,
    }
  }

  private formatSingleEventElementAttributes( eventElement: HTMLElement ): void {
    const { startDate, endDate, era, title, description } = eventElement.dataset
    const descriptionLabel = eventElement.textContent?.trim() ? '' : description ?? ''
    if ( !startDate ) {
      eventElement.dataset.timelineEventLabel = title ?? ''
      eventElement.dataset.timelineDescriptionLabel = descriptionLabel
      return
    }

    const maxDigits = parseInt( this.settings.maxDigits )
    const yearDisplayOptions = getEventYearDisplayOptions( eventElement )
    const cleanedStartDate = cleanDate(
      startDate, maxDigits, this.settings.verticalTimelineDateDisplayFormat, yearDisplayOptions
    )
    const cleanedEndDate = endDate
      ? cleanDate( endDate, maxDigits, this.settings.verticalTimelineDateDisplayFormat, yearDisplayOptions )
      : null

    if ( !cleanedStartDate ) {
      eventElement.dataset.timelineEventLabel = title ? `${startDate}: ${title}` : startDate
      eventElement.dataset.timelineDescriptionLabel = descriptionLabel
      return
    }

    const eraSuffix = era ? ` ${era}` : ''
    const formattedStartDate = cleanedStartDate.readableDateString + eraSuffix
    const hasDistinctEndDate = cleanedEndDate
      && cleanedEndDate.normalizedDateString !== cleanedStartDate.normalizedDateString
    const formattedDate = hasDistinctEndDate
      ? `${formattedStartDate} – ${cleanedEndDate.readableDateString}${eraSuffix}`
      : formattedStartDate
    const eventLabel = title ? `${formattedDate}: ${title}` : formattedDate

    eventElement.dataset.timelineEventLabel = eventLabel
    eventElement.dataset.timelineDescriptionLabel = descriptionLabel
  }

  formatEventElementAttributes( el: HTMLElement ): void {
    const eventElements: HTMLElement[] = []
    if ( el.matches( '.ob-timelines' )) {
      eventElements.push( el )
    }

    eventElements.push( ...Array.from( el.querySelectorAll<HTMLElement>( '.ob-timelines' )))
    eventElements.forEach(( eventElement ) => {
      try {
        this.formatSingleEventElementAttributes( eventElement )
      } catch ( error ) {
        console.warn( 'Could not format timeline event attributes.', { eventElement, error })
      }
    })
  }

  /**
   * Parse the list of files from the vault and extract the timeline data
   *
   * @param timelineNotes - notes which have our timeline tags
   * @param timelineDates - dates we parse from event data
   */
  async parseFiles(
    timelineNotes: AllNotesData,
    timelineDates: string[]
  ): Promise<void> {
    for ( const file of this.currentFileList ) {
      const combinedEventsAndFrontMatter = await getEventsInFile( file, this.appVault, this.metadataCache )
      const { numEvents } = await getNumEventsInFile( null, combinedEventsAndFrontMatter )

      if ( !combinedEventsAndFrontMatter ) {
        // skip this loop
        continue
      }

      combinedEventsAndFrontMatter.forEach(( event ) => {
        if ( !event ) {
          // skip this loop
          return
        }

        let eventData: EventDataObject | null = null

        if ( !isHTMLElementType( event ) && !Object.keys( event ).includes( 'showOnTimeline' )) {
          console.warn(
            "parseFiles | frontmatter event does not contain 'showOnTimeline'. Skipping",
          )

          return
        }

        eventData = getEventData( event, file, this.settings.frontMatterKeys )
        if ( !eventData ) {
          console.warn( `parseFiles | malformed eventData, skipping event in file: ${file.name}`, { event, eventData })
          return
        }

        logger( 'parseFiles | eventData', eventData )

        if ( numEvents && !isHTMLElementType( event ) && eventData?.showOnTimeline !== true ) {
          console.warn(
            `parseFiles | Both HTML and Frontmatter exist in file: ${file.name}.
            The key showOnTimeline is not true, skipping frontmatter event`
          )
          return
        }

        const {
          classes,
          color: initialColor,
          endDate: initialEndDate,
          era,
          eventImg,
          group,
          noteBody,
          notePath,
          noteTitle,
          pointsTo,
          startDate,
          tags,
          type,
          yearAbsolute,
          yearLocale,
          yearPrecision,
          yearScale,
          yearUnit,
        } = eventData

        const color = initialColor === 'grey' ? 'gray' : initialColor
        const endDate = initialEndDate !== '' ? initialEndDate : startDate

        if ( tags ) {
          logger( 'parseFiles | this note contains override tags' )
          // frontmatter tags come through as an array,
          // HTML override tags are a semi-colon separated string
          const noteTags = typeof tags === 'string' ? tags?.split( ';' ) : tags

          logger( 'parseFiles | noteTags:', noteTags )
          logger( 'parseFiles | this.args.tags:', this.args.tags )

          let overrideTagsAreContainedInTagList = false
          for ( const rawTag of noteTags ) {
            const tag = rawTag.trim().replace( '#', '' )
            logger( 'parseFiles | examining tag:', tag )
            // loop over all the override tags and if any of them are in the tag list, add it
            if ( this.args.tags.tagList.includes( tag ) || this.args.tags.optionalTags.includes( tag )) {
              logger( 'parseFiles | Override tags overlap with tag list, adding note' )
              overrideTagsAreContainedInTagList = true
              continue
            }
          }

          // if the override tags do not overlap with the tag list, do not display this note
          if ( !overrideTagsAreContainedInTagList ) {
            logger( 'parseFiles | Override tags do not overlap with tag list, skipping note' )
            return
          }
        }

        const imgUrl = getImgUrl( this.appVault, eventImg )
        const maxDigits = parseInt( this.settings.maxDigits )
        const yearDisplayOptions = this.getMergedYearDisplayOptions({
          absolute: yearAbsolute,
          locale: yearLocale,
          precision: yearPrecision,
          scale: yearScale,
          unit: yearUnit,
        })
        const cleanedStartDateObject = cleanDate(
          startDate, maxDigits, this.args.dateFormat, yearDisplayOptions
        )
        const cleanedEndDateObject = cleanDate(
          endDate, maxDigits, this.args.dateFormat, yearDisplayOptions
        )

        if ( !cleanedStartDateObject || !cleanedEndDateObject ) {
          throw new Error( 'either the start or end date object is missing' )
        }

        const { normalizedDateString: noteId } = cleanedStartDateObject
        if ( !noteId ) {
          console.error( "Cannot normalize the event's start date! Skipping" )
          return
        }

        logger( 'parseFiles | noteId', noteId )

        const note: CardContainer = {
          id: noteId,
          classes,
          color,
          endDate: cleanedEndDateObject,
          era,
          group,
          img: imgUrl,
          body: noteBody,
          path: notePath,
          pointsTo,
          startDate: cleanedStartDateObject,
          title: noteTitle,
          type,
        }

        if ( !timelineNotes[noteId] ) {
          timelineNotes[noteId] = [note]
          timelineDates.push( noteId )
        } else {
          // if note_id already present prepend or append to it
          timelineNotes[noteId][this.settings.sortDirection ? 'unshift' : 'push']( note )

          logger( 'parseFiles | Repeat date: %o', timelineNotes[noteId] )
        }
      })
    }
  }

  async run(
    source: string,
    el: HTMLElement,
  ): Promise<void> {
    this.setup()

    // read arguments
    await this.readArguments( source )
    logger( 'run | this.args', this.args )

    logger( 'run | # of files and tags', { fileCount: this.files.length, tags: this.args.tags })

    // filter to all files that have any of the optional tags
    const filesWithOptionalTags = this.files.filter(( file ) => {
      return filterMdFiles( file, this.args.tags.optionalTags, this.metadataCache, true )
    })

    // filter through the files with the correct optional tags
    // to those that also have the required tags
    const filesWithRequiredTags = filesWithOptionalTags.filter(( file ) => {
      return filterMdFiles( file, this.args.tags.tagList, this.metadataCache, false )
    })

    this.currentFileList = filesWithRequiredTags

    logger( 'run | tagged file objects', {
      filesWithOptionalTags,
      filesWithRequiredTags,
      current: this.currentFileList
    })

    if ( !this.currentFileList || this.currentFileList.length === 0 ) {
      logger( 'run | No files found for the timeline' )
      await showEmptyTimelineMessage( el, Array.from( [...this.args.tags.tagList, ...this.args.tags.optionalTags] ))
      return
    }

    // Keep only the files that have the time info
    const timelineNotes: AllNotesData = []
    const timelineDates: string[] = []

    await this.parseFiles( timelineNotes, timelineDates )

    // Sort events based on setting
    const sortedTimelineDates = sortTimelineDates( timelineDates, this.settings.sortDirection )

    const timelineDiv = document.createElement( 'div' )
    timelineDiv.setAttribute( 'class', 'timeline' )

    switch ( this.args.type ) {
    case 'flat': {
      const requiredData: HorizontalTimelineInput = {
        args: this.args,
        dates: sortedTimelineDates,
        div: timelineDiv,
        el,
        notes: timelineNotes,
        settings: this.settings,
      }

      await buildHorizontalTimeline( requiredData )
      return
    }
    default:
      await buildVerticalTimeline( timelineDiv, timelineNotes, sortedTimelineDates, el )
      return
    }
  }
}
