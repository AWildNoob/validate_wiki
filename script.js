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

        // Detect changes in move order
        let transposeChains = []
        for (let i = 1; i <= 4; i++) {
            if (oldEntry.has(`move${i}`)) {
                let chain = []
                let ptr = i;
                do {
                    /*
                    for (let j = 1; j <= 4; j++) {
                        if (ptr !== j && 
                            newEntry.has(`move${j}`) && 
                            newEntry.get(`move${j}`) === oldEntry.get(`move${ptr}`) &&
                            newEntry.get(`move${j}type`) === oldEntry.get(`move${ptr}type`) &&
                            newEntry.get(`move${j}cat`) === oldEntry.get(`move${ptr}cat`)
                        ) {
                            chain.push(ptr);
                            ptr = j;
                            break;
                        }
                    }
                    if (chain.length === 0 || chain[chain.length - 1] === ptr) {
                        chain = [];
                        break;
                    }
                    */
                   let nextIdx = [1, 2, 3, 4].find((nextPtr) => (
                        ptr !== nextPtr && 
                        newEntry.has(`move${nextPtr}`) && 
                        newEntry.get(`move${nextPtr}`) === oldEntry.get(`move${ptr}`) &&
                        newEntry.get(`move${nextPtr}type`) === oldEntry.get(`move${ptr}type`) &&
                        newEntry.get(`move${nextPtr}cat`) === oldEntry.get(`move${ptr}cat`)
                    ));
                    if (nextIdx !== undefined) {
                        chain.push(ptr);
                        ptr = nextIdx;
                    }
                    else {
                        chain = [];
                        break;
                    }
                } while (ptr !== i && chain.length < 4);
                if (chain.length > 0) {
                    transposeChains.push(chain.map((cIdx, i) => { return { move: oldEntry.get(`move${cIdx}`), oldIdx: cIdx, newIdx: chain[(i + 1) % chain.length] };}));
                    chain.forEach((cIdx) => {
                        oldEntry.delete(`move${cIdx}`);
                        newEntry.delete(`move${cIdx}`);
                        oldEntry.delete(`move${cIdx}type`);
                        newEntry.delete(`move${cIdx}type`);
                        oldEntry.delete(`move${cIdx}cat`);
                        newEntry.delete(`move${cIdx}cat`);
                    });
                }
            }
        }

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
        if (modifiedKeys.length > 0 || transposeChains.length > 0) {
            const pkmnDisplay = document.createElement("b");
            pkmnDisplay.appendChild(document.createTextNode(`${pkmnName}: `));
            modifiedOutput.push(pkmnDisplay);

            let transposeEntry = document.createElement("li");
            if (transposeChains.length > 0) {
                const transposeMsg = transposeChains.map((c) => c.map((entry) => `${entry.move} (${entry.oldIdx} -> ${entry.newIdx})`).join(", ")).join(", ");
                transposeEntry.appendChild(document.createTextNode(`Move order changed: ${transposeMsg}`));
                modifiedOutput.push(transposeEntry);
            }
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