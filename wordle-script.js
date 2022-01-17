'use strict';

let setAttribute = (elem, attr, value) => {
    elem.setAttribute(attr, value);
}

let shadowQuery = (elem, query) => {
    let root = elem.shadowRoot;
    if (!root)
	return null;
    return root.querySelector(query);
};

let shadowQueryAll = (elem, query) => {
    let root = elem.shadowRoot;
    if (!root)
	return [];
    return root.querySelectorAll(query);
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
            setAttribute(elem, 'aria-modal', true);
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
		let switchChild = shadowQuery(elem, 'div.switch');
		if (switchChild) {
		    switchChild.click();
		} else {
                    elem.click();
		}
            }
        }, false);
    }
}

let fixTile = tile => {
    console.log('Fixing tile:');
    console.log(tile);
    let newLabel = (tile.getAttribute('letter') || '') + ' ' +
        (tile.getAttribute('evaluation') || '');
    if (newLabel != tile.getAttribute('aria-label')) {
	setAttribute(tile, 'aria-label', newLabel);
    }
}

let tileObserver = new MutationObserver((mutationsList, observer) => {
    for (let mutation of mutationsList) {
        fixTile(mutation.target);
    }
});

let watchTile = (tile) => {
    fix(tile, false, 'tile', 'Empty');
    setAttribute(tile, 'aria-live', 'polite');
    tileObserver.observe(tile, { attributes: true, childList: false, subtree: false });
}

let fixKey = (key) => {
    console.log('Fixing key:');
    console.log(key);
    let newLabel = (key.getAttribute('data-key') || '') + ' ' +
        (key.getAttribute('data-state') || '');
    if (newLabel != key.getAttribute('aria-label')) {
	setAttribute(key, 'aria-label', newLabel);
    }
}

let keyObserver = new MutationObserver((mutationsList, observer) => {
    for (let mutation of mutationsList) {
        fixKey(mutation.target);
    }
});

let watchKey = (key) => {
    keyObserver.observe(key, { attributes: true, childList: false, subtree: false });
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
    checkboxObserver.observe(checkbox, { attributes: true, childList: false, subtree: false });
}

let app;
let previousModalState;
let firstKey;

let modalObserver = new MutationObserver((mutationsList, observer) => {
    let modal = mutationsList[0].target;
    console.log('Modal changed.');
    console.log(modal);
    let state = modal.hasAttribute('open');
    if (previousModalState !== undefined && state != previousModalState) {
	setTimeout(() => {
	    if (state) {
		// Modal is opening, focus inside
		let stats = shadowQuery(app, 'game-stats');
		console.log('Modal stats: ' + stats);
		if (stats) {
		    let button = shadowQuery(stats, 'button');
		    console.log('Modal button: ' + button);
		    if (button) {
			button.focus();
		    }
		}
	    } else {
		console.log('First key');
		if (firstKey)
		    firstKey.focus();
	    }
	}, 1000);
    }
    previousModalState = state;
});

let watchModal = (modal) => {
    previousModalState = modal.hasAttribute('open');
    modalObserver.observe(modal,  { attributes: true, childList: false, subtree: false });
}

let previousGamePageState;

let gamePageObserver = new MutationObserver((mutationsList, observer) => {
    let gamePage = mutationsList[0].target;
    console.log('GamePage changed.');
    console.log(gamePage);
    let state = gamePage.hasAttribute('open');
    if (previousGamePageState !== undefined &&
	state != previousGamePageState) {

	if (state) {
	    fix(gamePage, false, 'dialog', 'Game Modal');
	}

	setTimeout(() => {
	    if (state) {
		let close = shadowQuery(gamePage, 'game-icon[icon=close]');
		console.log('Close: ' + close);
		if (close) {
                    fix(close, true, 'button', 'Close');
		}

		// Inside game page could be either settings or help.
		let gameSettings = shadowQuery(app, 'game-settings');
		console.log('Game settings: ' + gameSettings);
		if (gameSettings) {
		    setAttribute(gamePage, 'aria-label', 'Settings Modal');
		    let checkboxes = shadowQueryAll(gameSettings, 'game-switch');
		    console.log('Checkboxes: ' + checkboxes.length);
		    for (let i = 0; i < checkboxes.length; i++)
			watchCheckbox(checkboxes[i]);

		    let checkbox = shadowQuery(gameSettings, 'game-switch');
		    console.log('Checkbox: ' + checkbox);
		    if (checkbox) {
			checkbox.focus();
		    }
		}

		let help = shadowQuery(app, 'game-help');
		console.log('Game helps: ' + help);
		if (help) {
		    setAttribute(gamePage, 'aria-label', 'Help Modal');
		    
		    let tiles = shadowQueryAll(help, 'game-tile');
		    console.log('Tiles: ' + tiles.length);
		    for (let j = 0; j < tiles.length; j++) {
			fix(tiles[j], true, 'tile', 'Tile');
			fixTile(tiles[j]);
		    }

		    close.focus();
		}
	    } else {
		console.log('First key');
		if (firstKey)
		    firstKey.focus();
	    }
	}, 500);
    }
    previousGamePageState = state;
});

let watchGamePage = (gamePage) => {
    previousGamePageState = gamePage.hasAttribute('open');
    gamePageObserver.observe(gamePage,  { attributes: true, childList: false, subtree: false });
};

let applyFixes = () => {
    app = document.querySelector('game-app');
    console.log('App: ' + app);
    if (app) {
        let modal = shadowQuery(app, 'game-modal');
        console.log('Modal: ' + modal);
        if (modal) {
            fix(modal, false, 'dialog', 'Pop-up Modal');

            let close = shadowQuery(modal, 'game-icon[icon=close]');
            console.log('Close: ' + close);
            if (close) {
                fix(close, true, 'button', 'Close');
                setTimeout(() => {
                    close.focus();
                }, 1000);
            }
        }

	watchModal(modal);
	
        let help = shadowQuery(app, 'game-help');
	console.log('Help: ' + help);
	if (help) {
	    let tiles = shadowQueryAll(help, 'game-tile');
	    console.log('Tiles: ' + tiles.length);
	    for (let j = 0; j < tiles.length; j++) {
		fix(tiles[j], true, 'tile', 'Tile');
                fixTile(tiles[j]);
	    }
	}

	let toasters = shadowQueryAll(app, '.toaster');
	console.log('Toasters: ' + toasters.length);
	for (let i = 0; i < toasters.length; i++) {
	    setAttribute(toasters[i], 'aria-live', 'polite');
	}

        let gamePage = shadowQuery(app, 'game-page');
        console.log('Game page: ' + gamePage);
	watchGamePage(gamePage);

        let keyboard = shadowQuery(app, 'game-keyboard');
        console.log('Keyboard: ' + keyboard);
	fix(keyboard, false, 'group', 'Keyboard');

	let keys = shadowQueryAll(keyboard, 'button[data-key]');
        console.log('Keys: ' + keys.length);
	for (let i = 0; i < keys.length; i++) {
	    if (!firstKey) {
		firstKey = keys[i];
	    }
	    watchKey(keys[i]);
	}

        let backspace = shadowQuery(keyboard, 'button[data-key=←]');
        console.log('Backspace: ' + backspace);
        fix(backspace, false, null, 'backspace');

        let rows = shadowQueryAll(app, 'game-row');
        console.log('Rows: ' + rows.length);
        for (let i = 0; i < rows.length; i++) {
	    fix(rows[i], false, 'group', 'Row ' + (i + 1));

            let tiles = shadowQueryAll(rows[i], 'game-tile');
            console.log('Tiles: ' + tiles.length);
            for (let j = 0; j < tiles.length; j++) {
                watchTile(tiles[j]);
            }
        }

	let extensionCredit = document.createElement('div');
	extensionCredit.innerHTML = 'Wordle screen reader accessibility extension running.';
	rows[rows.length - 1].parentElement.appendChild(extensionCredit);
    }
};

setTimeout(() => {
    applyFixes();
}, 1000);
