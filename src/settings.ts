import {App, Notice, PluginSettingTab, Setting} from "obsidian";
import BibleLinkerPlugin from "./main";
import {LinkType} from "./modals/link-verse-modal";

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

        containerEl.createEl("h1", { text: "Copy and Link Bible verses command" });
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
            .setDesc("String inserted after biblical link, you can use \\n to insert newline. If you are using multiple translations \"{t}\" will insert the name of the one used.")
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
            .setDesc("String inserted in front of every copied verse. You can use \"{n}\" where you want number of given verse inserted, for example \"**{n}** \" will make each verse start with bold verse number. You can also use \"{f}\" to insert name of the corresponding file (for example to create obsidian links). If you are using multiple translations \"{t}\" will insert the name of the one used. \"{u}\" will insert the number of the verse as unicode superscript. Leave empty for no prefix.")
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

        new Setting(containerEl)
            .setName("Link only default")
            .setDesc("What the link only option should be set to by default")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.linkOnly)
                    .onChange(async (value) => {
                        this.plugin.settings.linkOnly = value;
                        await this.plugin.saveSettings();
                    })
            )


        containerEl.createEl("h4", { text: "Output format" });

        new Setting(containerEl)
            .setName("Put each verse on a new line?")
			.setClass("important-setting")
            .setDesc("Each verse is inserted on a new line (with Link prefix).")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.newLines)
                    .onChange(async (value) => {
                        this.plugin.settings.newLines = value;
                        await this.plugin.saveSettings();
						this.display();
                    })
            )

		if (this.plugin.settings.newLines) {
			new Setting(containerEl)
				.setName("First line prefix")
				.setDesc("Special prefix that will be inserted in front of the first line only, right after the \"Line prefix\". Handy for callouts. (Only applied when Put each verse on a new line? is set to true)")
				.addText((inputBox) =>
					inputBox
						.setPlaceholder("First line prefix")
						.setValue(this.plugin.settings.firstLinePrefix)
						.onChange(async (value) => {
							this.plugin.settings.firstLinePrefix = value;
							await this.plugin.saveSettings();
						})
				)
		}
		else {
			new Setting(containerEl)
				.setName("Insert space between verses?")
				.setDesc("Should space be inserted between verses? (Only applied when Put each verse on a new line? is set to false. Useful for languages such as Chinese.)")
				.setDisabled(!this.plugin.settings.newLines)
				.addToggle((toggle) =>
					toggle
						.setValue(this.plugin.settings.insertSpace)
						.onChange(async (value) => {
							this.plugin.settings.insertSpace = value;
							await this.plugin.saveSettings();
						})
				)
		}



        containerEl.createEl("h4", { text: "Notation" });
		containerEl.createEl("p", { text: "Also used in the link command when the \"Show First & Last\" link type is used." });

        new Setting(containerEl)
            .setName("One verse notation")
            .setDesc("This is the symbol that will be used between chapter number and verse number when copying one verse. For example \".\" → Gen 1.1." )
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
                .setDesc("Input full paths from the root vault folder to folders containing Bible translations, each translation on separate line. An example of one entry: \"Bible/NIV/\". The plugin will search for corresponding Bible files using given paths as starting points. Make sure there are no duplicate files in given paths, otherwise it is hard to tell what the output will be. The first translation will be considered your main translation.").addTextArea((inputBox) =>
                    inputBox
                        .setPlaceholder("Bible/NIV/\nBible/ESV/")
                        .setValue(this.plugin.settings.translationsPaths)
                        .onChange(async (value) => {
                            const inputPaths = value.split(/\r?\n|\r/); // split user input by lines (regex takes into account all possible line endings)
                            const paths: string[] = [];
                            inputPaths.forEach((path) => { // parse user input for later use
                                if (path.at(-1) !== "/") { // Add potentially missing '/' to path
                                    paths.push(path + "/");
                                }
                                else {
                                    paths.push(path)
                                }
                            })
                            this.plugin.settings.translationsPaths = value;
                            this.plugin.settings.parsedTranslationPaths = paths;
                            await this.plugin.saveSettings();
                        })
                )


            new Setting(containerEl)
                .setName("What to link")
                .setDesc("Choose what translations should be linked when copying a verse.")
                .addDropdown((dropdown) => {
                    dropdown.addOption("all", "Link to all translations")
                    dropdown.addOption("used", "Link only to used translation")
                    dropdown.addOption("usedAndMain", "Link to used and main translation")
                    dropdown.addOption("main", "Link only to main translation")
                    dropdown.setValue(this.plugin.settings.translationLinkingType)
                    dropdown.onChange(async (value) => {
                        this.plugin.settings.translationLinkingType = value;
                        await this.plugin.saveSettings();
                    })
                })
		}

		containerEl.createEl("h4", { text: "Comments" });
		containerEl.createEl("p", { text: "Use this if you have comments right in the Biblical text that you want to ignore when copying verses." });
		new Setting(containerEl)
			.setName("Comment beginning")
			.setDesc("String that is used to mark the beginning of a comment, won't be used if it is set to an empty string.")
			.addText((inputBox) =>
				inputBox
					.setPlaceholder("/*")
					.setValue(this.plugin.settings.commentStart)
					.onChange(async (value) => {
						this.plugin.settings.commentStart = value;
						await this.plugin.saveSettings();
					})
			)

		new Setting(containerEl)
			.setName("Comment ending")
			.setDesc("String that is used to mark the end of a comment, won't be used if it is set to an empty string.")
			.addText((inputBox) =>
				inputBox
					.setPlaceholder("*/")
					.setValue(this.plugin.settings.commentEnd)
					.onChange(async (value) => {
						this.plugin.settings.commentEnd = value;
						await this.plugin.saveSettings();
					})
			)

		containerEl.createEl("h4", { text: "Convertors" });
		function parseStringToDictionary(input: string): { [key: string]: string } {
			const dictionary: { [key: string]: string } = {};

			// Normalize the line endings to \n
			const normalizedInput = input.replace(/\r\n|\r/g, '\n');

			// Split the input string by line breaks
			const lines = normalizedInput.split('\n');

			// Process each line to fill the dictionary
			lines.forEach(line => {
				// Check if the line contains a colon
				if (line.includes(':')) {
					const [key, value] = line.split(':');
					if (key && value) {
						dictionary[key.toLowerCase()] = value;
					}
				}
			});

			return dictionary;
		}

		new Setting(containerEl)
			.setName("Output book name convertor")
			.setDesc("You can specify conversions that will be applied to the visible book name alias. For example, if you put in \"3J:3 John\", the output will be changed from \"[[3 John-01#v1|3J 1.1]]\" to \"[[3 John-01#v1|3 John 1.1]]\". The format used is \"From:To\", each entry on it's own line. TIP: ChatGPT (or similar AI tool) will probably be able to help you when creating the input.")
			.setClass("big-text-area")
			.addTextArea((inputBox) =>
				inputBox
					.setPlaceholder("Gn:Genesis\nEx:Exodus\n...")
					.setValue(this.plugin.settings.outputBookMapString)
					.onChange(async (value) => {
						this.plugin.settings.outputBookMapString = value;
						this.plugin.settings.outputBookMap = parseStringToDictionary(value);
						await this.plugin.saveSettings();
					})
			)

		new Setting(containerEl)
			.setName("Input book name convertor")
			.setDesc("You can specify conversions that will be applied to the used book name when searching for text of a verse. For example, if you put in \"Gn:Gen\", the input \"Gn 1,1\" will work even when the file is called \"Gen 1,1\". The format used is again \"From:To\", each entry on it's own line, and will be used by the plugin when the search fails using the unchanged input. Multiple entries can have same result mapping, for example you can use \"G:Gen\" and \"Gn:Gen\".")
			.setClass("big-text-area")
			.addTextArea((inputBox) =>
				inputBox
					.setPlaceholder("G:Gen\nGn:Gen\nL:Lk\n...")
					.setValue(this.plugin.settings.inputBookMapString)
					.onChange(async (value) => {
						this.plugin.settings.inputBookMapString = value;
						this.plugin.settings.inputBookMap = parseStringToDictionary(value);
						await this.plugin.saveSettings();
					})
			)
        // LINK -------------------------------------------------------------------------------------------------------------

        containerEl.createEl("h1", { text: "Link Bible verses command" });

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
				dropdown.addOption(LinkType.FirstAndLast, "Show First & Last");
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
			);

		containerEl.createEl("h4", { text: "Format" });
		new Setting(containerEl)
			.setName("Capitalize book names?")
			.setDesc(
				'Should book names be automatically capitalized? For example "1cOr" will be turned into "1Cor".'
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.shouldCapitalizeBookNames)
					.onChange(async (value) => {
						this.plugin.settings.shouldCapitalizeBookNames = value;
						await this.plugin.saveSettings();
					})
			);

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
