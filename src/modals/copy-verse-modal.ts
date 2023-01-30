import { App, ButtonComponent, Modal, Setting } from "obsidian";
import { PluginSettings } from "../main";
import { getTextOfVerses } from "../logic/copy-command";

/**
 * Async function for fetching preview 
 */
async function setPreviewText(previewEl: HTMLTextAreaElement, userInput: string, pluginSettings: PluginSettings, translationPath: string, linkOnlyOptions: LinkOnlyOptions) {
    try {
        const res = await getTextOfVerses(this.app, userInput, pluginSettings, translationPath, linkOnlyOptions, false);
        previewEl.setText(res);
    }
    catch {
        previewEl.setText("");
        return;
    }
}

export enum LinkType {
    First = "First verse",
    FirstOtherInvis = "First verse + other invisible",
    FirstLast = "First and last verse",
    FirstLastOtherInvis = "First and last + other invisible",
    All = "All verses",
    AllInvis = "All verses, invisible",
}

export interface LinkOnlyOptions {
    linkOnly: boolean;
    linkType: LinkType;
}

/**
 * Modal that lets you insert bible reference by copying text of given verses
 */
export default class CopyVerseModal extends Modal {
    userInput: string
    onSubmit: (result: string) => void
    pluginSettings: PluginSettings;
    translationPath: string;
    linkOnlyOptions: LinkOnlyOptions = {
        linkOnly: false, // todo change to settings
        linkType: LinkType.First // todo change to settings
    };

    handleInput = async () => {
        try {
            const res = await getTextOfVerses(this.app, this.userInput, this.pluginSettings, this.translationPath, this.linkOnlyOptions);
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
                setPreviewText(previewEl, this.userInput, this.pluginSettings, this.translationPath, this.linkOnlyOptions);
            })
                .inputEl.focus()); // Sets focus to input field

        // Add translation picker
        if (this.pluginSettings.enableMultipleTranslations && this.pluginSettings.translationsPaths !== "") {
            const transationPicker = new Setting(contentEl)
                .setName("Pick translation")

            let buttons: ButtonComponent[] = [];
            let buttonPathMap = new Map<ButtonComponent, string>();


            this.pluginSettings.parsedTranslationPaths.forEach((path) => { // display translation buttons
                transationPicker
                    .addButton((btn) => {
                        buttons.push(btn);
                        buttonPathMap.set(btn, path);
                        let splittedPath = path.split("/");
                        btn.setButtonText(splittedPath[splittedPath.length - 2]);
                    })

                buttons.forEach((btn) => { // make sure that only one is selected at a time
                    btn.onClick(() => {
                        buttons.forEach((b) => b.removeCta()); // remove CTA from all buttons
                        btn.setCta(); // set CTA to this button
                        this.translationPath = buttonPathMap.get(btn);
                        setPreviewText(previewEl, this.userInput, this.pluginSettings, this.translationPath);
                    })
                })

                // preselect the first button/trnaslation
                buttons.first().setCta();
                this.translationPath = buttonPathMap.get(buttons.first());
            }
            )
        }

        // add link-only options
        var linkTypeDropdown: HTMLSelectElement;
        new Setting(contentEl)
            .setName("Link only")
            .addDropdown((dropdown) => {
                linkTypeDropdown = dropdown.selectEl;
                if (!this.pluginSettings.copyCommandLinkOnlyPreset) // hide/show by default based on the preset setting
                    dropdown.selectEl.hide()
                dropdown.addOption(LinkType.First, LinkType.First)
                dropdown.addOption(LinkType.FirstOtherInvis, LinkType.FirstOtherInvis)
                dropdown.addOption(LinkType.FirstLast, LinkType.FirstLast)
                dropdown.addOption(LinkType.FirstLastOtherInvis, LinkType.FirstLastOtherInvis)
                dropdown.addOption(LinkType.All, LinkType.All)
                dropdown.addOption(LinkType.AllInvis, LinkType.AllInvis)
                dropdown.onChange((value) => this.linkOnlyOptions.linkType = value as LinkType)
                dropdown.setValue(this.pluginSettings.copyCommandLinkTypePreset)
            })
            .addToggle((tgl) => {
                tgl.setValue(this.pluginSettings.copyCommandLinkOnlyPreset)
                tgl.onChange(val => {
                    if (val) {
                        linkTypeDropdown.show();
                    }
                    else {
                        linkTypeDropdown.hide();
                    }
                    this.linkOnlyOptions.linkOnly = val;
                })
            })

        // Add preview
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

