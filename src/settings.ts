import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import BibleLinkerPlugin from "./main";
import { LinkType } from "./modals/link-verse-modal";

/**
 * Settings for plugin
 */
export class SettingsTab extends PluginSettingTab {
    plugin: BibleLinkerPlugin;

    constructor(app: App, plugin: BibleLinkerPlugin) {
        super(app, plugin);
        this.plugin = plugin;  
    }

    display() {
        const { containerEl } = this;

        containerEl.empty();
        
        new Setting(containerEl)
            .setHeading()
            .setName("Copy bible verses settings")
            
        
        new Setting(containerEl)
            .setName("Verse offset")
            .setDesc('Change this if wrong verses are being linked, e.g. you want "Gen 1,1-3" but output is text from verses 2-4 → set this to -1')
            .addText((inputBox) => 
                inputBox
                    .setValue(this.plugin.settings.verseOffset.toString())
                    .onChange(async (value) => {
                        const number = Number.parseInt(value);
                        if (value === "-") return;
                        if (Number.isNaN(number)) {
                            new Notice("Invalid input, please insert valid integer");
                            inputBox.setValue("");
                            return;
                        }
                        this.plugin.settings.verseOffset = number;
                        await this.plugin.saveSettings();
                    })
            )

        new Setting(containerEl)
            .setName("Link prefix")
            .setDesc("String inserted in front of linked verses, for example '>' for quote. Leave empty for no prefix.")
            .addText((inputBox) =>
                inputBox    
                    .setPlaceholder("Insert prefix here")
                    .setValue(this.plugin.settings.prefix)
                    .onChange(async (value) => {
                        this.plugin.settings.prefix = value;
                        await this.plugin.saveSettings();
                    })
            )

        new Setting(containerEl)
            .setName("Link to last verse?")
            .setDesc("Should last verse be linked in the visible link before text of verses?")
            .addToggle((toggle) => 
                toggle
                    .setValue(this.plugin.settings.linkEndVerse)
                    .onChange(async (value) => {
                        this.plugin.settings.linkEndVerse = value;
                        await this.plugin.saveSettings();
                    })
            )

        new Setting(containerEl)
            .setName("Add invisible links?")
            .setDesc("Ivisible links are added to each verse used (so you can find the connections later), they are only visible in source mode.")
            .addToggle((toggle) => 
                toggle
                    .setValue(this.plugin.settings.useInvisibleLinks)
                    .onChange(async (value) => {
                        this.plugin.settings.useInvisibleLinks = value;
                        await this.plugin.saveSettings();
                    })
            )

        new Setting(containerEl)
            .setName("Put each verse on a new line?")
            .setDesc("Each verse is inserted on a new line (with Link prefix).")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.newLines)
                    .onChange(async (value) => {
                        this.plugin.settings.newLines = value;
                        await this.plugin.saveSettings();
                    })
            )

        new Setting(containerEl)
            .setHeading()
            .setName("Create obsidian links to bible verses settings")

        new Setting(containerEl)
            .setName("Verify files?")
            .setDesc("Verify existence of files you are trying to link, so that you are not inserting wrong references by mistake.")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.verifyFilesWhenLinking)
                    .onChange(async (value) => {
                        this.plugin.settings.verifyFilesWhenLinking = value;
                        await this.plugin.saveSettings();
                    })
            )

        new Setting(containerEl)
            .setName("Verse prefix")
            .setDesc('Fill this if you are using verse prefixes in your bible files, e.g. you have "v1" in your file → set to "v".')
            .addText((inputBox) =>
                inputBox    
                    .setPlaceholder("Insert prefix here")
                    .setValue(this.plugin.settings.versePrefix)
                    .onChange(async (value) => {
                        this.plugin.settings.versePrefix = value;
                        await this.plugin.saveSettings();
                    })
            )

        new Setting(containerEl)
            .setName("Link type default value")
            .setDesc("Value that will be selected by default in link modal.")
            .addDropdown((dropdown) => {
                dropdown.addOption(LinkType.Basic, LinkType.Basic)
                dropdown.addOption(LinkType.Embedded, LinkType.Embedded)
                dropdown.addOption(LinkType.Invisible, LinkType.Invisible)
                dropdown.setValue(this.plugin.settings.linkTypePreset)
                dropdown.onChange(async (value) => {
                    this.plugin.settings.linkTypePreset = value as LinkType;
                    await this.plugin.saveSettings;
                })
            })

        new Setting(containerEl)
            .setName("Use new lines default value")
            .setDesc("Value that will be selected by default in link modal.")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.newLinePreset)
                    .onChange(async (value) => {
                        this.plugin.settings.newLinePreset = value;
                        await this.plugin.saveSettings();
                    })
            )
    }
}
