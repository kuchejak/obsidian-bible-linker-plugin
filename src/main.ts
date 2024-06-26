import {Editor, Plugin} from 'obsidian';
import CopyVerseModal from 'src/modals/copy-verse-modal';
import LinkVerseModal, {LinkType} from './modals/link-verse-modal';
import {SettingsTab} from './settings';

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
	firstLinePrefix: string;
    insertSpace: boolean;

    // Notation
    oneVerseNotation: string;
    multipleVersesNotation: string;

    // Multiple translations
    enableMultipleTranslations: boolean;
    translationsPaths: string;
    parsedTranslationPaths: string[]; // callculated from translations paths, not shown to the user
    translationLinkingType: string;

	// Comments
	commentStart: string,
	commentEnd: string,

	// Convertors
	outputBookMapString: string,
	outputBookMap: { [key: string]: string }
	inputBookMapString: string,
	inputBookMap: { [key: string]: string }

    // LINK
    // File format
    linkSeparator: string;
    versePrefix: string;

    // Defaults
    linkTypePreset: LinkType;
    newLinePreset: boolean;

	// Format
	shouldCapitalizeBookNames: boolean;

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
	firstLinePrefix: "",
    insertSpace: true,

    // Notation
    oneVerseNotation: ".",
    multipleVersesNotation: ",",

    // Multiple translations
    enableMultipleTranslations: false,
    translationsPaths: "",
    parsedTranslationPaths: [],
    translationLinkingType: "all",

	// Comments
	commentStart: "",
	commentEnd: "",

	// Convertors
	outputBookMapString: "",
	outputBookMap: {},
	inputBookMapString: "",
	inputBookMap: {},

    // LINK
    // File format
    linkSeparator: "#",
    versePrefix: "",

    // Defaults
    linkTypePreset: LinkType.Basic,
    newLinePreset: true,

	// Format
	shouldCapitalizeBookNames: true,

	// Misc
	verifyFilesWhenLinking: false,
};


function replaceRangeAndMoveCursor(str: string, editor: Editor) {
	editor.replaceRange(str, editor.getCursor());
	let offset = editor.posToOffset(editor.getCursor())
	offset += str.length;
	editor.setCursor(editor.offsetToPos(offset));
}

export default class BibleLinkerPlugin extends Plugin {
    settings: PluginSettings;

    // Opens modal for text copying
    openCopyModal = () => {
		const editor = this.app.workspace.activeEditor?.editor
        if (editor) {
            new CopyVerseModal(this.app, this.settings,
                (str) => replaceRangeAndMoveCursor(str, editor)
			).open();
        }
    }

    // Opens modal for creating obsidian links
    openObsidianLinkModal = () => {
		const editor = this.app.workspace.activeEditor?.editor
        if (editor) {
            new LinkVerseModal(this.app, this.settings,
                (str) => replaceRangeAndMoveCursor(str, editor)
			).open();
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
            icon: "copy",
            editorCallback: this.openCopyModal
        })

        // Command to insert link (only available in editor mode)
        this.addCommand({
            id: 'insert-bible-link-obsidian-link',
            name: "Link Bible verses",
            icon: "link",
            editorCallback: this.openObsidianLinkModal
        })
    }
}
