function compare(oldText, newText) {
    // Split wikitext into Pokemon entries
    const pkmnRegex = /\{\{Pokémon\/6\n[^\}]*\}\}/g;
    const oldPkmnText = [...oldText.matchAll(pkmnRegex)];
    const newPkmnText = [...newText.matchAll(pkmnRegex)];
    const oldPkmnEntries = new Map();
    const newPkmnEntries = new Map();
    oldPkmnText.forEach((e) => {
        let keyStrings = e[0].substring(13, e[0].length - 2).split("|").map((s) => s.trim());
        let dataMap = new Map();
        keyStrings.forEach((s) => {
            const partition = s.split("=")
            dataMap.set(partition[0], partition[1])
        })
        oldPkmnEntries.set(dataMap.get("pokemon"), dataMap);
    });
    newPkmnText.forEach((e) => {
        let keyStrings = e[0].substring(13, e[0].length - 2).split("|").map((s) => s.trim());
        let dataMap = new Map();
        keyStrings.forEach((s) => {
            const partition = s.split("=")
            dataMap.set(partition[0], partition[1])
        })
        newPkmnEntries.set(dataMap.get("pokemon"), dataMap);
    });

    // Perform Pokemon-by-Pokemon comparison
    let addedOutput = []
    let removedOutput = []
    let modifiedOutput = []
    let errorOutput = []
    oldPkmnEntries.values().forEach((oldEntry) => {
        // Find matching Pokemon entry
        const pkmnName = oldEntry.get("pokemon");
        if (!newPkmnEntries.has(pkmnName)) {
            errorOutput.push(`Old wikitext has ${pkmnName} but new wikitext does not`);
            return;
        }
        const newEntry = newPkmnEntries.get(pkmnName);

        // Compare key-value pairs
        let addedKeys = []
        let removedKeys = []
        let modifiedKeys = []
        oldEntry.keys().forEach((k) => {
            const oldVal = oldEntry.get(k);
            const newVal = newEntry.get(k);
            if (!newVal) {
                removedKeys.push(`${k}=${oldVal}`);
                return;
            }
            if (oldVal !== newVal) {
                modifiedKeys.push(`${k}=${oldVal} -> ${k}=${newVal}`);
            }
        });
        newEntry.keys().forEach((k) => {
            if (!oldEntry.has(k)) {
                addedKeys.push(`${k}=${newEntry.get(k)}`);
            }
        });

        // Format output
        if (addedKeys.length > 0) {
            const pkmnDisplay = document.createElement("b");
            pkmnDisplay.appendChild(document.createTextNode(`${pkmnName}: `));
    
            const addedEntry = document.createElement("li");
            addedEntry.appendChild(pkmnDisplay);
            addedEntry.appendChild(document.createTextNode(addedKeys.join(" | ")));
            addedOutput.push(addedEntry);
        }
        if (removedKeys.length > 0) {
            const pkmnDisplay = document.createElement("b");
            pkmnDisplay.appendChild(document.createTextNode(`${pkmnName}: `));
    
            const removedEntry = document.createElement("li");
            removedEntry.appendChild(pkmnDisplay);
            removedEntry.appendChild(document.createTextNode(removedKeys.join(" | ")));
            removedOutput.push(removedEntry);
        }

        if (modifiedKeys.length > 0) {
            const pkmnDisplay = document.createElement("b");
            pkmnDisplay.appendChild(document.createTextNode(`${pkmnName}: `));
    
            modifiedOutput.push(pkmnDisplay);
            modifiedKeys.forEach((s) => {
                const modifiedEntry = document.createElement("li");
                modifiedEntry.appendChild(document.createTextNode(s));
                modifiedOutput.push(modifiedEntry);
            });
        }
    });

    return {
        added: addedOutput,
        removed: removedOutput,
        modified: modifiedOutput,
        error: errorOutput
    }
}