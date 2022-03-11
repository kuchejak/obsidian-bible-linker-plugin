# Obsidian Bible Linker
Plugin for easier linking of multiple bible verses in Obsdian.md note taking app.

## Usage
1. Use command "Add biblical link" or click the link icon in the left panel. 
2. Insert bible link, for example "Gen 1,1-3 or Gen 1.1". Note: Links across more chapters are not supported (yet?).
3. Watch the magic.

## Output format
Verses are **not** linked using `![[link]]` syntax - instead text of given verses is copied. Linking is done using "invisible" links after the verses (those links are visible only in source mode).

### Example output (input: `Gen 1,1-3`)
```md
>[[Gen-01#v1|Gen 1,1-3]] In the beginning, God created the heavens and the earth. The earth was formless and empty. Darkness was on the surface of the deep and God's Spirit was hovering over the surface of the waters. God said, "Let there be light," and there was light. [[Gen-01#v1|]][[Gen-01#v2|]][[Gen-01#v3|]]
```

### Pros of this approach
- More verses can be displayed as one block of text, which is more visually pleasing than multiple link blocks after each other. 
- You can edit the text if you want (for example add some in-line notes, bold important part...)

### Other output formats
Other output formats may be added later, but I don't have enough time to do it now. Feel free to create issue describing what output format would you like and why (or even better create PR).

## Requirements 
This plugin requires you to have bible in markdown in your vault, with similar structure to [Obsidian bible study kit](https://forum.obsidian.md/t/bible-study-in-obsidian-kit-including-the-bible-in-markdown/12503) - that is:
- 1 file = 1 chapter
- Verse is marked with heading (any level), verse text is on the next line after said heading 

### Example File
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

## Link format
- File names are deduced from the link you enter:
  - if your file is named "Gen 1", you will have to enter "Gen 1,1-4"   
  - if your file is named "Genesis 1", you will have to enter "Genesis 1,1-4"
  - *exception*: if your file is named "Gen-01", you can type either "Gen-01,1-4" or "Gen 1,1-4" 

## Wrong verses are linked?
- Go to Plugin settings and change "Verse offset" accordingly.

## Installing 
Available through Obsidian Community plugins (Settings/Comumnity plugins) 

### Manual install
Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/your-plugin-id/`
