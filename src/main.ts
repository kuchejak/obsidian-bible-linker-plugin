import { MarkdownView, Plugin } from 'obsidian';
import CopyVerseModal from 'src/modals/copy-verse-modal';
import LinkVerseModal, { LinkType } from './modals/link-verse-modal';
import { SettingsTab } from './settings';

export interface PluginSettings {
	// Copy
	prefix: string;
	postfix: string;
	linkEndVerse: boolean;
	verseOffset: number;
	verseHeadingLevel?: number;
	useInvisibleLinks: boolean;
	newLines: boolean;
	eachVersePrefix: string;
	oneVerseNotation: string,
	multipleVersesNotation: string;

	// Link
	verifyFilesWhenLinking: boolean;
	versePrefix: string;
	linkTypePreset: LinkType;
	newLinePreset: boolean;
	linkSeparator: string;
}

const DEFAULT_SETTINGS: Partial<PluginSettings> = {
	// Copy
	prefix: "",
	postfix: "",
	linkEndVerse: false,
	verseOffset: 0,
	verseHeadingLevel: undefined,
	useInvisibleLinks: true,
	newLines: false,
	eachVersePrefix: "",
	oneVerseNotation: ".",
	multipleVersesNotation: ",",

	// Link
	verifyFilesWhenLinking: false,
	versePrefix: "",
	linkTypePreset: LinkType.Basic,
	newLinePreset: true,
	linkSeparator: "#"
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
			name: "Copy Bible verses",
			icon: "book",
			editorCallback: this.openCopyModal
		})

		// Command to insert link (only available in editor mode)
		this.addCommand({
			id: 'insert-bible-link-obsidian-link',
			name: "Create Obsidian links to Bible verses",
			icon: "book",
			editorCallback: this.openObsidianLinkModal
		})
	}
}
