// npm run build (dev pro kontinuální rebuildy)

import { MarkdownView, Plugin } from 'obsidian';
import LinkVerseModal from 'src/link-verse-modal';

export default class BibleLinkerPlugin extends Plugin {

	openRefModal = () => {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (view) {
			new LinkVerseModal(this.app, (str) => view.editor.replaceRange(str, view.editor.getCursor())).open();
		}
	}

	// Run once when plugin is loaded
	async onload() {

		// Add icon to insert ref
		this.addRibbonIcon("link", "Insert bible link", (evt: MouseEvent) => this.openRefModal());

		// Command to insert ref (only available in editor mode)
		this.addCommand({
			id: 'insert-bible-link',
			name: "Insert bible link",
			editorCallback: this.openRefModal
		})

	}
}