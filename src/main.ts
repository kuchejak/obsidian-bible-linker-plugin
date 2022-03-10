import { MarkdownView, Plugin } from 'obsidian';
import LinkVerseModal from 'src/link-verse-modal';
import { SettingsTab } from './settings';

export interface PluginSettings {
	prefix: string;
	linkEndVerse: boolean;
	verseOffset: number;
	useInvisibleLinks: boolean;
}

const DEFAULT_SETTINGS: Partial<PluginSettings> = {
	prefix: "",
	linkEndVerse: false,
	verseOffset: 0,
	useInvisibleLinks: true
}

export default class BibleLinkerPlugin extends Plugin {
	settings: PluginSettings;

	openRefModal = () => {
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
		this.addRibbonIcon("link", "Insert bible link", (evt: MouseEvent) => this.openRefModal());

		// Command to insert link (only available in editor mode)
		this.addCommand({
			id: 'insert-bible-link',
			name: "Insert bible link",
			editorCallback: this.openRefModal
		})
	}
}