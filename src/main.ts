import type { TimelinesSettings } from './types'

import { TimelineBlockProcessor } from './block'
import { DEFAULT_SETTINGS } from './constants'
import { Plugin, MarkdownView } from 'obsidian'
import { TimelinesSettingTab } from './settings'
import { TimelineCommandProcessor } from './commands'
import { logger } from './utils'

export default class TimelinesPlugin extends Plugin {
  pluginName: string = this.manifest.name
  settings: TimelinesSettings
  statusBarItem: HTMLElement
  blocks: TimelineBlockProcessor
  commands: TimelineCommandProcessor
  eventAttributeObserver: MutationObserver | null = null
  pendingEventElements = new Set<HTMLElement>()
  eventAttributeFrame: number | null = null

  private queueEventElementAttributes = ( root: HTMLElement ) => {
    if ( root.matches( '.ob-timelines' )) {
      this.pendingEventElements.add( root )
    }

    root.querySelectorAll<HTMLElement>( '.ob-timelines' ).forEach(( eventElement ) => {
      this.pendingEventElements.add( eventElement )
    })

    if ( this.pendingEventElements.size === 0 || this.eventAttributeFrame !== null ) return

    this.eventAttributeFrame = window.requestAnimationFrame(() => {
      this.eventAttributeFrame = null
      const eventElements = Array.from( this.pendingEventElements )
      this.pendingEventElements.clear()

      eventElements.forEach(( eventElement ) => {
        if ( eventElement.isConnected ) {
          this.blocks.formatEventElementAttributes( eventElement )
        }
      })
    })
  }

  private observeEventElementAttributes = () => {
    const workspaceContainer = this.app.workspace.containerEl

    this.eventAttributeObserver = new MutationObserver(( mutations ) => {
      mutations.forEach(( mutation ) => {
        if ( mutation.type === 'attributes' && mutation.target instanceof HTMLElement ) {
          this.queueEventElementAttributes( mutation.target )
          return
        }

        mutation.addedNodes.forEach(( node ) => {
          if ( node instanceof HTMLElement ) {
            this.queueEventElementAttributes( node )
          }
        })
      })
    })

    this.eventAttributeObserver.observe( workspaceContainer, {
      attributes: true,
      attributeFilter: [
        'class',
        'data-description',
        'data-end-date',
        'data-era',
        'data-start-date',
        'data-title',
        'data-year-absolute',
        'data-year-locale',
        'data-year-precision',
        'data-year-scale',
        'data-year-unit',
      ],
      childList: true,
      subtree: true,
    })

    this.queueEventElementAttributes( workspaceContainer )

    this.register(() => {
      this.eventAttributeObserver?.disconnect()
      this.eventAttributeObserver = null
      this.pendingEventElements.clear()

      if ( this.eventAttributeFrame !== null ) {
        window.cancelAnimationFrame( this.eventAttributeFrame )
        this.eventAttributeFrame = null
      }
    })
  }

  initialize = async () => {
    console.log( `Initializing Plugin: ${this.pluginName}` )

    const loaded = await this.loadData()
    this.settings = { ...DEFAULT_SETTINGS, ...loaded }
    this.blocks = new TimelineBlockProcessor( this.settings, this.app.metadataCache, this.app.vault )
    this.commands = new TimelineCommandProcessor( this, this.blocks.run.bind( this.blocks ))
  }

  onload = async () => {
    await this.initialize()
    console.log( `Loaded Plugin: ${this.pluginName}` )

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    this.registerMarkdownCodeBlockProcessor( 'ob-timeline', async ( source, el, ctx ) => {
      await this.blocks.run( source, el )
    })

    this.registerMarkdownPostProcessor(( el ) => {
      this.blocks.formatEventElementAttributes( el )
    })

    this.observeEventElementAttributes()

    this.addCommand({
      id: 'render-static-timeline',
      name: 'Render static timeline',
      checkCallback: ( checking: boolean ) => {
        const markdownView = this.app.workspace.getActiveViewOfType( MarkdownView )
        if ( markdownView ) {
          // If checking is true, we're simply "checking" if the command can be run.
          // If checking is false, then we want to actually perform the operation.
          if ( !checking ) {
            this.commands.insertTimelineIntoCurrentNote( markdownView )
          }

          return true
        }
      }
    })

    this.addCommand({
      id: 'insert-timeline-event',
      name: 'Insert timeline event',
      checkCallback: ( checking: boolean ) => {
        const markdownView = this.app.workspace.getActiveViewOfType( MarkdownView )
        if ( markdownView ) {
          if ( !checking ) {
            this.commands.createTimelineEventInCurrentNote()
          }

          return true
        }
      }
    })

    this.addCommand({
      id: 'insert-timeline-event-frontmatter',
      name: 'Insert timeline event (frontmatter)',
      checkCallback: ( checking: boolean ) => {
        const markdownView = this.app.workspace.getActiveViewOfType( MarkdownView )
        if ( markdownView ) {
          if ( !checking ) {
            this.commands.createTimelineEventFrontMatterInCurrentNote()
          }

          return true
        }
      }
    })

    this.addCommand({
      id: 'reload-open-note',
      name: 'Reload current note',
      checkCallback: ( checking: boolean ) => {
        const markdownView = this.app.workspace.getActiveViewOfType( MarkdownView )
        if ( markdownView ) {
          if ( !checking ) {
            this.commands.reloadNote( markdownView )
          }

          return true
        }
      },
    })

    this.addSettingTab( new TimelinesSettingTab( this.app, this ))

    this.addRibbonIcon( 'code-2', 'Insert Timeline Event', async () => {
      await this.commands.createTimelineEventInCurrentNote()
    })

    this.addRibbonIcon( 'list-plus', 'Insert Timeline Event (Frontmatter)', async () => {
      await this.commands.createTimelineEventFrontMatterInCurrentNote()
    })

    if ( this.settings.showEventCounter ) {
      this.commands.createStatusBar( this )
    }
  }

  onFileOpen = async () => {
    if ( !this.commands ) {
      logger( 'main | Command processor was not initialized' )

      await this.initialize()
    }

    this.commands.handleStatusBarUpdates( this )
  }

  onunload = () => {
    console.log( `Unloaded Plugin: ${this.pluginName}` )
  }

  saveSettings = async () => {
    this.commands.handleStatusBarUpdates( this )

    await this.saveData( this.settings )
  }
}
