function compare(oldText, newText) {
    // Split wikitext into Pokemon entries
    const pkmnRegex = /\{\{Pokémon\/6\n[^\}]*\}\}/g;
    const oldPkmnText = [...oldText.matchAll(pkmnRegex)];
    const newPkmnText = [...newText.matchAll(pkmnRegex)];
    const oldPkmnEntries = new Map();
    const newPkmnEntries = new Map();
    oldPkmnText.forEach((e, idx) => {
        let keyStrings = e[0].substring(13, e[0].length - 2).split("|").map((s) => s.trim());
        let dataMap = new Map();
        keyStrings.forEach((s) => {
            const partition = s.split("=")
            dataMap.set(partition[0], partition[1])
        })

        const pkmnName = dataMap.get("pokemon");
        if (oldPkmnEntries.has(pkmnName)) {
            oldPkmnEntries.set(`${pkmnName} (${dataMap.get("ndex")}, ${idx})`, dataMap);
        }
        else {
            oldPkmnEntries.set(pkmnName, dataMap);
        }
    });
    newPkmnText.forEach((e, idx) => {
        let keyStrings = e[0].substring(13, e[0].length - 2).split("|").map((s) => s.trim());
        let dataMap = new Map();
        keyStrings.forEach((s) => {
            const partition = s.split("=")
            dataMap.set(partition[0], partition[1])
        })

        const pkmnName = dataMap.get("pokemon");
        if (newPkmnEntries.has(pkmnName)) {
            newPkmnEntries.set(`${pkmnName} (${dataMap.get("ndex")}, ${idx})`, dataMap);
        }
        else {
            newPkmnEntries.set(pkmnName, dataMap);
        }
    });

    // Perform Pokemon-by-Pokemon comparison
    let addedOutput = []
    let removedOutput = []
    let modifiedOutput = []
    let errorOutput = []
    if (oldPkmnEntries.size !== 6) {
        const errorEntry = document.createElement("li");
        errorEntry.appendChild(document.createTextNode(`Old wikitext has ${oldPkmnEntries.size} Pokemon, most teams have 6. Make sure you copied the text correctly.`))
        errorOutput.push(errorEntry)
    }
    if (newPkmnEntries.size !== 6) {
        const errorEntry = document.createElement("li");
        errorEntry.appendChild(document.createTextNode(`Generated wikitext has ${newPkmnEntries.size} Pokemon, most teams have 6. Make sure you copied the text correctly.`))
        errorOutput.push(errorEntry)
    }
    oldPkmnEntries.keys().forEach((pkmnName) => {
        // Find matching Pokemon entry
        const oldEntry = oldPkmnEntries.get(pkmnName);
        if (!newPkmnEntries.has(pkmnName)) {
            const errorEntry = document.createElement("li");
            errorEntry.appendChild(document.createTextNode(`Old wikitext has ${pkmnName} but new wikitext does not.`))
            errorOutput.push(errorEntry);
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
                modifiedKeys.push(`${k}=${oldVal}`.padEnd(25, " ") + " -> " + `${k}=${newVal}`);
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
            pkmnDisplay.appendChild(document.createTextNode(`${pkmnName}:`.padEnd(25, " ")));
    
            const addedEntry = document.createElement("li");
            addedEntry.appendChild(pkmnDisplay);
            addedEntry.appendChild(document.createElement("br"));
            addedEntry.appendChild(document.createTextNode(addedKeys.map(s => s.padEnd(20, " ")).join(" ")));
            addedOutput.push(addedEntry);
        }
        if (removedKeys.length > 0) {
            const pkmnDisplay = document.createElement("b");
            pkmnDisplay.appendChild(document.createTextNode(`${pkmnName}:`.padEnd(25, " ")));
    
            const removedEntry = document.createElement("li");
            removedEntry.appendChild(pkmnDisplay);
            removedEntry.appendChild(document.createElement("br"));
            removedEntry.appendChild(document.createTextNode(removedKeys.map(s => s.padEnd(20, " ")).join(" ")));
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