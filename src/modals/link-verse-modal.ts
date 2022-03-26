
import { App, Modal, Setting } from "obsidian";
import {getLinksToVerses} from "../utils/convert-link";
import { PluginSettings } from "../main";

export enum LinkType {
    Basic = "Basic",
    Embedded = "Embedded",
    Invisible = "Invisible",
}

/**
 * Modal that lets you insert bible reference by using Obsidian links 
 */
export default class LinkVerseModal extends Modal {
    userInput: string;
    linkType: LinkType;
    useNewLine: boolean;
    onSubmit: (result: string) => void;
    pluginSettings: PluginSettings;

    handleInput = async () => {
        try {
            const res = await getLinksToVerses(this.app, this.userInput, this.linkType, this.useNewLine, this.pluginSettings)
            this.close();
            this.onSubmit(res);
        }
        catch (err) {
            return 
        }
    }

    constructor(app: App, settings: PluginSettings, onSubmit: (result: string) => void) {
        super(app);
        this.onSubmit = onSubmit;
        this.pluginSettings = settings;
        this.linkType = this.pluginSettings.linkTypePreset;
        this.useNewLine = this.pluginSettings.newLinePreset;
    }

    onOpen() {
        const { contentEl } = this;

        // Add heading 
        contentEl.createEl("h3", { text: "Create obsidian links from bible reference" });

        // Add Textbox for reference
        new Setting(contentEl)
            .setName("Insert reference")
            .addText((text) => text.onChange((value) => { this.userInput = value })
            .inputEl.focus()); // Sets focus to input field

        
        new Setting(contentEl)
            .setName("Link type")
            .addDropdown((dropdown) => {
                dropdown.addOption(LinkType.Basic, LinkType.Basic)
                dropdown.addOption(LinkType.Embedded, LinkType.Embedded)
                dropdown.addOption(LinkType.Invisible, LinkType.Invisible)
                dropdown.onChange((value) => this.linkType = value as LinkType)
                dropdown.setValue(this.pluginSettings.linkTypePreset)
            })

        new Setting(contentEl)
            .setName("Each link on new line?")
            .addToggle((tgl) => {
                    tgl.setValue(this.pluginSettings.newLinePreset)
                    tgl.onChange(val => this.useNewLine = val);
                }
            )


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

