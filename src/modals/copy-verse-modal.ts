import { App, Modal, Setting } from "obsidian";
import { getTextOfVerses } from "../utils/convert-link";
import { PluginSettings } from "../main";

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

        // Add heading 
        contentEl.createEl("h3", { text: "Copy verse by bible reference" });

        // Add Textbox for reference
        new Setting(contentEl)
            .setName("Insert reference")
            .addText((text) => text.onChange((value) => { this.userInput = value })
            .inputEl.focus()); // Sets focus to input field

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

