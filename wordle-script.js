'use strict';

let s = () => {

let setAttribute = (elem, attr, value) => {
    elem.setAttribute(attr, value);
}

let myQueryHelper = (elem, query, results) => {
    if (elem.className.toString().indexOf(query) >= 0) {
        results.push(elem);
    }
    for (let child = elem.firstElementChild; child; child = child.nextElementSibling) {
        myQueryHelper(child, query, results);
    }
};

let myQuery = (elem, query) => {
    let results = [];
    myQueryHelper(elem, query, results);
    return results[0] || null;
};

let myQueryAll = (elem, query) => {
    let results = [];
    myQueryHelper(elem, query, results);
    return results;
};

let fix = (elem, makeClickable, role, label) => {
    if (role) {
        if (role == 'tile') {
            setAttribute(elem, 'role', 'img');
            setAttribute(elem, 'aria-roledescription', 'tile');
        } else {
            setAttribute(elem, 'role', role);
        }
        if (role == 'dialog') {
            setAttribute(elem, 'aria-modal', false);
        }
    }

    if (label) {
        setAttribute(elem, 'aria-label', label);
    }
    
    if (makeClickable) {
        if (elem.tabIndex == 0)
            return;

        elem.tabIndex = 0;
        elem.addEventListener('keydown', (e) => {
            if (e.code == 'Enter' || e.code == 'Space') {
                e.stopPropagation();
                e.preventDefault();
                let switchChild = myQuery(elem, 'div.switch');
                if (switchChild) {
                    switchChild.click();
                } else {
                    elem.click();
                }
            }
        }, false);
    }
}

let masterFixer = (elem) => {
    let newLabel = '';
    ['letter', 'evaluation', 'data-key', 'data-state'].forEach(attr => {
        let value = elem.getAttribute(attr);
        if (value && value != '←' && value != 'tbd') {
            newLabel += ' ' + value;
        }
    });
    newLabel = elem.textContent + newLabel;
    if (newLabel != '' && newLabel != elem.getAttribute('aria-label')) {
        console.log('Setting ' + elem.getAttribute('role') + ' to ' + newLabel);
        setAttribute(elem, 'aria-label', newLabel);
    }
};

let fixAllTiles = (root) => {
    let tiles = myQueryAll(root, 'Tile-module');
    console.log('Tiles: ' + tiles.length);
    for (let j = 0; j < tiles.length; j++) {
        fix(tiles[j], true, 'tile', 'Tile');
        masterFixer(tiles[j]);
    }
};

let masterObserver = new MutationObserver((mutationsList, observer) => {
    for (let mutation of mutationsList) {
        masterFixer(mutation.target);
    }
});

let watchTile = (tile) => {
    fix(tile, false, 'tile', 'Empty');
    masterFixer(tile);
    masterObserver.observe(tile, { attributes: true });
    setTimeout(() => {
        setAttribute(tile, 'aria-live', 'polite');
    }, 1000);
}

let watchKey = (key) => {
    masterObserver.observe(key, { attributes: true });
}

let checkboxObserver = new MutationObserver((mutationsList, observer) => {
    for (let mutation of mutationsList) {
        let checkbox = mutation.target;
        let newAttr = '' + checkbox.hasAttribute('checked');
        if (newAttr != checkbox.getAttribute('aria-checked')) {
            setAttribute(checkbox, 'aria-checked', newAttr);
        }
    }
});

let watchCheckbox = (checkbox) => {
    if (!checkbox.hasAttribute('aria-checked')) {
        fix(checkbox, true, 'checkbox', checkbox.getAttribute('name'));
        setAttribute(checkbox, 'aria-checked',
                              checkbox.hasAttribute('checked'));
    }
    checkboxObserver.observe(checkbox, { attributes: true });
}

let app;
let previousModalState;
let firstKey;

let fixDialog = (dialog) => {
    fix(dialog, false, 'dialog', 'Game Modal');
    setTimeout(() => {
        console.log('Fixing dialog');

        let close = myQuery(dialog, 'close');
	if (close) {
            fix(close, true, 'button', 'Close');
	}

        // Inside game page could be either settings or help.
        let gameSettings = myQuery(app, 'Settings-module_setting');
        if (gameSettings) {
            gameSettings = gameSettings.parentElement;
            setAttribute(dialog, 'aria-label', 'Settings Modal');
            let checkboxes = myQueryAll(gameSettings, 'Settings-module_setting');
            for (let i = 0; i < checkboxes.length; i++)
                watchCheckbox(checkboxes[i]);

            let checkbox = myQuery(gameSettings, 'Settings-module_setting');
            if (checkbox) {
                checkbox.focus();
		return;
            }
        }

        let help = myQuery(app, 'Help-module_instructions');
        if (help) {
            setAttribute(dialog, 'aria-label', 'Help Modal');

            fixAllTiles(help);
        }

        if (close) {
	    close.focus();
        }

    }, 500);
}

let dialogObserver = new MutationObserver((mutationsList, observer) => {
    let target = mutationsList[0].target;

    setTimeout(() => {
	let dialog = myQuery(target, 'Page-module_page');
	if (dialog) {
	    fixDialog(dialog);
	    return;
	}
	dialog = myQuery(target, 'Modal-module_modalOverlay');
	if (dialog) {
	    fixDialog(dialog);
	    return;
	}

        if (firstKey) {
            firstKey.focus();
	}
    }, 500);
});

let watchForDialogs = (app) => {
    dialogObserver.observe(app, { childList: true });
};

let applyFixes = () => {
    app = myQuery(document.body, 'App-module_game');
    console.log('App: ' + app);
    if (app) {
        let header = myQuery(document.body, 'AppHeader-module_appHeader');
        if (header) {
            var buttons = header.querySelectorAll('[tabindex]');
            buttons.forEach(button => button.setAttribute('tabIndex', 0));
        }

        watchForDialogs(app);

        let dialog = myQuery(app, 'Modal-module_modalOverlay');
	if (dialog) {
	    fixDialog(dialog);
	}

        let help = myQuery(app, 'Help-module_page');
        if (help) {
            fixAllTiles(help);
        }

        let toasters = myQueryAll(app, 'ToastContainer-module_toaster');
        for (let i = 0; i < toasters.length; i++) {
            setAttribute(toasters[i], 'aria-live', 'polite');
        }

        let keyboard = myQuery(app, 'Keyboard-module_keyboard');
        console.log('Keyboard: ' + keyboard);
        fix(keyboard, false, 'group', 'Keyboard');

        let keys = myQueryAll(keyboard, 'Key-module_key');
        console.log('Keys: ' + keys.length);
        for (let i = 0; i < keys.length; i++) {
            if (!firstKey) {
                firstKey = keys[i];
            }
            watchKey(keys[i]);
        }

        for (var i = 0; i < keys.length; i++) {
            if (keys[i].getAttribute('data-key') == '←') {
                fix(keys[i], false, null, 'backspace');
            }
        }

        let rows = myQueryAll(app, 'Row-module_row');
        console.log('Rows: ' + rows.length);
        for (let i = 0; i < rows.length; i++) {
            fix(rows[i], false, 'group', 'Row ' + (i + 1));

            let tiles = myQueryAll(rows[i], 'Tile-module_tile');
            for (let j = 0; j < tiles.length; j++) {
                watchTile(tiles[j]);
            }
        }

        let extensionCredit = document.createElement('p');
        extensionCredit.style.color = 'var(--color-tone-1)';
        extensionCredit.innerHTML = 'Wordle screen reader accessibility extension running.';
        rows[rows.length - 1].parentElement.appendChild(extensionCredit);
    }
};

setTimeout(() => {
    applyFixes();
}, 1000);

};
s();

