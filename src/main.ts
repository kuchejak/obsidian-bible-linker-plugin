import { MarkdownView, Plugin } from 'obsidian';
import CopyVerseModal, { LinkType as CopyLinkType } from 'src/modals/copy-verse-modal';
import LinkVerseModal, { LinkType } from './modals/link-verse-modal';
import { SettingsTab } from './settings';

export interface PluginSettings {
    // COPY
    // Functional
    verseOffset: number;
    verseHeadingLevel?: number;

    // Inserted prefixes/postfixes
    prefix: string;
    postfix: string;
    eachVersePrefix: string;

    // Links
    linkEndVerse: boolean;
    useInvisibleLinks: boolean;
    linkOnly: boolean;

    // Output format
    newLines: boolean;
    insertSpace: boolean;

    // Notation
    oneVerseNotation: string;
    multipleVersesNotation: string;

    // Multiple translations
    enableMultipleTranslations: boolean;
    translationsPaths: string;
    parsedTranslationPaths: string[]; // callculated from translations paths, not shown to the user
    translationLinkingType: string;

    // LINK
    // File format
    linkSeparator: string;
    versePrefix: string;

    // Defaults
    linkTypePreset: LinkType;
    newLinePreset: boolean;

    // Misc
    verifyFilesWhenLinking: boolean;
}

const DEFAULT_SETTINGS: Partial<PluginSettings> = {
    // COPY
    // Functional
    verseOffset: 0,
    verseHeadingLevel: undefined,

    // Inserted prefixes/postfixes
    prefix: "",
    postfix: "",
    eachVersePrefix: "",

    // Links
    linkEndVerse: false,
    useInvisibleLinks: true,
    linkOnly: false,

    // Output format
    newLines: false,
    insertSpace: true,

    // Notation
    oneVerseNotation: ".",
    multipleVersesNotation: ",",

    // Multiple translations
    enableMultipleTranslations: false,
    translationsPaths: "",
    parsedTranslationPaths: [],
    translationLinkingType: "all",

    // LINK
    // File format
    linkSeparator: "#",
    versePrefix: "",

    // Defaults
    linkTypePreset: LinkType.Basic,
    newLinePreset: true,

    // Misc
    verifyFilesWhenLinking: false,
}

export default class BibleLinkerPlugin extends Plugin {
    settings: PluginSettings;

    // Opens modal for text copying
    openCopyModal = () => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (view) {
            new CopyVerseModal(this.app, this.settings,
                (str) => view.editor.replaceRange(str, view.editor.getCursor())).open();
        }
    }

    // Opens modal for creating obsidian links
    openObsidianLinkModal = () => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (view) {
            new LinkVerseModal(this.app, this.settings,
                (str) => view.editor.replaceRange(str, view.editor.getCursor())).open();
        }
    }


    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
    }

    async saveSettings() {
        await this.saveData(this.settings)
    }

    // Run once when plugin is loaded
    async onload() {
        // Handle settings
        await this.loadSettings();
        this.addSettingTab(new SettingsTab(this.app, this))

        // Add icon to insert link 
        // this.addRibbonIcon("link", "Insert bible link", (evt: MouseEvent) => this.openCopyModal());

        // Command to insert link (only available in editor mode)
        this.addCommand({
            id: 'insert-bible-link', // ID left to preserve user's key mappings
            name: "Copy and Link Bible verses",
            editorCallback: this.openCopyModal
        })

        // Command to insert link (only available in editor mode)
        this.addCommand({
            id: 'insert-bible-link-obsidian-link',
            name: "Link Bible verses",
            editorCallback: this.openObsidianLinkModal
        })
    }
}
