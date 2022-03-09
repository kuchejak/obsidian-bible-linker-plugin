import { App, PluginSettingTab, Setting } from "obsidian";
import BibleLinkerPlugin from "./main";

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
        let { containerEl } = this;

        containerEl.empty();
        
        new Setting(containerEl)
            .setName("Link prefix")
            .setDesc("String inserted in front of linked verses, for example '>' for quote. Leave empty for no prefix.")
            .addText((text) =>
                text    
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
    }
}