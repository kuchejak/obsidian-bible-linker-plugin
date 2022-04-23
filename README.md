# Obsidian Bible Linker
Plugin for easier linking of multiple bible verses in Obsdian.md note taking app.

## Usage
1. Use command "Copy bible verses" or "Create obsidian links to bible verses" (described bellow)
2. Insert bible link, for example "Gen 1,1-3 or Gen 1.1". Note: Links across more chapters are not supported (yet?).
3. Watch the magic.

## Copy bible verses command
Copies given verses from your bible files and inserts obsidian links to them. 

### Example output (input: `Gen 1,1-3`)
```md
>[[Gen-01#v1|Gen 1,1-3]] In the beginning, God created the heavens and the earth. The earth was formless and empty. Darkness was on the surface of the deep and God's Spirit was hovering over the surface of the waters. God said, "Let there be light," and there was light. [[Gen-01#v1|]][[Gen-01#v2|]][[Gen-01#v3|]]
```
Note that linking is done using "invisible" links after the verses (those links are visible only in source mode) - this can be turned off in the settings.

### Pros of this approach
- More verses can be displayed as one block of text, which is more visually pleasing than multiple link blocks after each other. 
- You can edit the text if you want (for example add some in-line notes, bold important part...) without effecting the original.


## Create obsidian links to bible verses command
Simpler command that only creates obsidian links based on input. You can choose if you want standard links (e.g. `[[Gen-01#v1]]`), embedded links (e.g. `![[Gen-01#v1]]`) or links invisible in the preview mode (e.g. `[[Gen-01#v1|]]`). This command is less powerful, but it also has looser requirements for your bible files, so you can use it even when the copy command does not work.  

![obrazek](https://user-images.githubusercontent.com/94016085/160867853-5bff3b17-d8a7-4ec9-8672-eb1fa3acc88c.png)


## Requirements 
### Link command
Basically no requirements, it just parses your input and creates links based on it. If it does not do what you want, look into the settings.

### Copy command 
Requires you to have bible in markdown in your vault, with similar structure to [Obsidian bible study kit](https://forum.obsidian.md/t/bible-study-in-obsidian-kit-including-the-bible-in-markdown/12503) - that is:
- 1 file = 1 chapter
- All verses of given chapter are present
- Verse is marked with heading (any level), verse text is on the next line after said heading

#### Example File
```md
# Name of chapter (or some other text)

... 

# v1
1st verse text

###### 2
2nd verse text

### verse 3
3rd verse text
```

## Input format
- File names are deduced from the link you enter:
  - if your file is named "Gen 1", you will have to enter "Gen 1,1-4"   
  - if your file is named "Genesis 1", you will have to enter "Genesis 1,1-4"
  - *exception*: if your file is named "Gen-01", you can type either "Gen-01,1-4" or "Gen 1,1-4" 

## Wrong verses are linked? Or linking doesn't work and you have files with right format?
- Go to Plugin settings and try changing "Verse offset" or "Verse heading level" accordingly.

## Installing 
Available through Obsidian Community plugins (Settings/Comumnity plugins) 

### Manual install
Copy over `main.js`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/your-plugin-id/`
