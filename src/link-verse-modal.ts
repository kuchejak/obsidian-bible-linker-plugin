import { App, Modal, Setting } from "obsidian";
import convertLinkToQuote from "./convert-link";
import { PluginSettings } from "./main";

/**
 * Modal that lets you insert bible reference
 */
export default class LinkVerseModal extends Modal {
    userInput: string
    onSubmit: (result: string) => void
    pluginSettings: PluginSettings;

    handleInput = async () => {
        const res = await convertLinkToQuote(this.app, this.userInput, this.pluginSettings)
        if (res == "") return // invalid link
        this.close();
        this.onSubmit(res);
    }

    constructor(app: App, settings: PluginSettings, onSubmit: (result: string) => void) {
        super(app);
        this.onSubmit = onSubmit;
        this.pluginSettings = settings;
    }

    onOpen() {
        const { contentEl } = this;

        // Add heading 
        contentEl.createEl("h3", { text: "Bible linker" });

        // Add Textbox for reference
        new Setting(contentEl)
            .setName("Insert link")
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

