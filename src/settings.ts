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

        containerEl.createEl("h2", { text: "Copy and Link Bible verses command" });
        containerEl.createEl("h4", { text: "Functional" });

        new Setting(containerEl)
            .setName("Verse offset")
            .setDesc('Change this if wrong verses are being linked, e.g. you want "Gen 1,1-3" but output is text from verses 2-4 → set this to -1')
            .setClass("important-setting")
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
            .setName("Verse heading level")
            .setDesc('If set, only headings of specified level are considered verses (if first heading of this level is always a verse, also set "Verse offset" to -1)')
            .addDropdown((dropdown) => {
                dropdown.addOption("any", "any")
                dropdown.addOption("6", "######")
                dropdown.addOption("5", "#####")
                dropdown.addOption("4", "####")
                dropdown.addOption("3", "###")
                dropdown.addOption("2", "##")
                dropdown.addOption("1", "#")
                dropdown.setValue(this.plugin.settings.verseHeadingLevel?.toString() ?? "any")
                dropdown.onChange(async (value) => {
                    this.plugin.settings.verseHeadingLevel = value === "any" ? undefined : Number(value);
                    await this.plugin.saveSettings();
                })
            })

        containerEl.createEl("h4", { text: "Inserted prefixes/postfixes" });

        new Setting(containerEl)
            .setName("Line prefix")
            .setDesc("String inserted in front of every line, for example '>' for quote. Note: If you set 'Put each verse on a new line?' to true, the prefix will be inserted in front of every line.")
            .setClass("important-setting")
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
            .setName("Link postfix")
            .setDesc("String inserted after biblical link, you can use \\n to insert newline.")
            .addText((inputBox) =>
                inputBox
                    .setPlaceholder("Insert postfix here")
                    .setValue(this.plugin.settings.postfix)
                    .onChange(async (value) => {
                        this.plugin.settings.postfix = value;
                        await this.plugin.saveSettings();
                    })
            )

        new Setting(containerEl)
            .setName("Each verse prefix")
            .setDesc("String inserted in front of every copied verse. You can use \"{n}\" where you want number of given verse inserted, for example \"**{n}** \" will make each verse start with bold verse number. You can also use \"{f}\" to insert name of the corresponding file (for example to create obsidian links). Leave empty for no prefix.")
            .addText((inputBox) =>
                inputBox
                    .setPlaceholder("Insert prefix here")
                    .setValue(this.plugin.settings.eachVersePrefix)
                    .onChange(async (value) => {
                        this.plugin.settings.eachVersePrefix = value;
                        await this.plugin.saveSettings();
                    })
            )


        containerEl.createEl("h4", { text: "Links" });

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
            .setDesc("Invisible links are added to each verse used (so you can find the connections later), they are only visible in source mode.")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.useInvisibleLinks)
                    .onChange(async (value) => {
                        this.plugin.settings.useInvisibleLinks = value;
                        await this.plugin.saveSettings();
                    })
            )

        containerEl.createEl("h4", { text: "Output format" });

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
            .setName("Insert space between verses?")
            .setDesc("Should space be inserted between verses? (Only applied when Put each verse on a new line? is se to false. Useful for languages such as Chinese.)")
            .setDisabled(!this.plugin.settings.newLines)
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.insertSpace)
                    .onChange(async (value) => {
                        this.plugin.settings.insertSpace = value;
                        await this.plugin.saveSettings();
                    })
            )


        containerEl.createEl("h4", { text: "Notation" });

        new Setting(containerEl)
            .setName("One verse notation")
            .setDesc("This is the symbol that will be used between chapter number and verse number when copying one verse. For example \".\" → Gen 1.1.")
            .addText((inputBox) =>
                inputBox
                    .setPlaceholder("Insert notation symbol here")
                    .setValue(this.plugin.settings.oneVerseNotation)
                    .onChange(async (value) => {
                        this.plugin.settings.oneVerseNotation = value;
                        await this.plugin.saveSettings();
                    })
            )

        new Setting(containerEl)
            .setName("Multiple verses notation")
            .setDesc("This is the symbol that will be used between chapter number and verse number when copying multiple verses. For example \",\" → Gen 1,1-3.")
            .addText((inputBox) =>
                inputBox
                    .setPlaceholder("Insert notation symbol here")
                    .setValue(this.plugin.settings.multipleVersesNotation)
                    .onChange(async (value) => {
                        this.plugin.settings.multipleVersesNotation = value;
                        await this.plugin.saveSettings();
                    })
            )

        containerEl.createEl("h4", { text: "Multiple translations" });
        containerEl.createEl("p", {
            text: "As of right now this is an experimental feature. If you encounter any bugs or you can not figure things out create issue on the GitHub page of this plugin."
        });


        new Setting(containerEl)
            .setName("Enable multiple translations")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.enableMultipleTranslations)
                    .onChange(async (value) => {
                        this.plugin.settings.enableMultipleTranslations = value;
                        await this.plugin.saveSettings();
                        this.display();
                    })
            )


        if (this.plugin.settings.enableMultipleTranslations) {
            new Setting(containerEl)
                .setName("Paths to translations with their names")
                .setDesc("Input full paths to folders containing Bible translations, each trnaslation on separate line. An example of one entry: \"Bible/NIV\". The plugin will search for corresponding Bible files using given paths as starting points. Make sure there are no duplicate files in given paths, otherwise it is hard to tell what the output will be.")
                .addTextArea((inputBox) =>
                    inputBox
                        .setPlaceholder("Bible/NIV\nBible/ESV")
                        .setValue(this.plugin.settings.translationsPaths)
                        .onChange(async (value) => {
                            this.plugin.settings.translationsPaths = value;
                            await this.plugin.saveSettings();
                            console.log(this.plugin.settings.translationsPaths)
                        })
                )
        }


        // LINK -------------------------------------------------------------------------------------------------------------

        containerEl.createEl("h2", { text: "Link Bible verses command" });

        containerEl.createEl("h4", { text: "File format" });
        new Setting(containerEl)
            .setName("Link separator")
            .setDesc("This is the separator that will be used when linking, e.g. if you enter '#' here, output will be [[Gen 1#1]]. If you are using headings to mark verses, use '#'. If you are using block references, use '^'.")
            .setClass("important-setting")
            .addText((inputBox) =>
                inputBox
                    .setPlaceholder("Insert separator here")
                    .setValue(this.plugin.settings.linkSeparator)
                    .onChange(async (value) => {
                        this.plugin.settings.linkSeparator = value;
                        await this.plugin.saveSettings();
                    })
            )


        new Setting(containerEl)
            .setName("Verse prefix")
            .setDesc('Fill this if you are using verse prefixes in your bible files, e.g. you have "v1" in your file → set to "v".')
            .setClass("important-setting")
            .addText((inputBox) =>
                inputBox
                    .setPlaceholder("Insert prefix here")
                    .setValue(this.plugin.settings.versePrefix)
                    .onChange(async (value) => {
                        this.plugin.settings.versePrefix = value;
                        await this.plugin.saveSettings();
                    })
            )


        containerEl.createEl("h4", { text: "Defaults" });

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
                    await this.plugin.saveSettings();
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

        containerEl.createEl("h4", { text: "Misc" });

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


    }
}
