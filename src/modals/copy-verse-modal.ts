import { App, Modal, Setting } from "obsidian";
import { getTextOfVerses } from "../utils/convert-link";
import { PluginSettings } from "../main";

/**
 * Async function for fetching preview 
 */
async function setPreviewText(previewEl: HTMLTextAreaElement, userInput: string, pluginSettings: PluginSettings) {
    try {
        const res = await getTextOfVerses(this.app, userInput, pluginSettings, false);
        previewEl.setText(res);
    }
    catch {
        previewEl.setText("");
        return;
    }
}

/**
 * Modal that lets you insert bible reference by copying text of given verses
 */
export default class CopyVerseModal extends Modal {
    userInput: string
    onSubmit: (result: string) => void
    pluginSettings: PluginSettings;

    handleInput = async () => {
        try {
            const res = await getTextOfVerses(this.app, this.userInput, this.pluginSettings);
            this.close();
            this.onSubmit(res);
        }
        catch (err) {
            return;
        }
    }

    constructor(app: App, settings: PluginSettings, onSubmit: (result: string) => void) {
        super(app);
        this.onSubmit = onSubmit;
        this.pluginSettings = settings;
    }


    onOpen() {
        const { contentEl } = this;
        let previewEl: HTMLTextAreaElement;

        // Add heading 
        contentEl.createEl("h3", { text: "Copy verse by bible reference" });

        // Add Textbox for reference
        new Setting(contentEl)
            .setName("Insert reference")
            .addText((text) => text.onChange((value) => {
                this.userInput = value;
                setPreviewText(previewEl, this.userInput, this.pluginSettings);
            })
                .inputEl.focus()); // Sets focus to input field

        contentEl.createEl("label", { text: "Preview" });
        previewEl = contentEl.createEl("textarea", { cls: 'copy-preview', attr: { readonly: true } });


        // Add button for submit/exit
        new Setting(contentEl)
            .addButton((btn) => {
                btn
                    .setButtonText("Link")
                    .setCta()
                    .onClick(this.handleInput)
            });

        // Allow user to exit using Enter key
        contentEl.onkeydown = (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                this.handleInput();
            }
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

