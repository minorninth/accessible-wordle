// Quick fixes to make Wordle accessible to screen reader users.

function fix(elem, makeClickable, role, label) {
    if (role) {
	if (role == 'tile') {
            elem.setAttribute('role', 'img');
            elem.setAttribute('aria-roledescription', 'tile');
	} else {
            elem.setAttribute('role', role);
	}
        if (role == 'dialog') {
            elem.setAttribute('aria-modal', true);
        }
    }

    if (label) {
        elem.setAttribute('aria-label', label);
    }
    
    if (makeClickable) {
        if (elem.tabIndex == 0)
            return;

        elem.tabIndex = 0;
        elem.addEventListener('keydown', (e) => {
            if (e.code == 'Enter' || e.code == 'Space') {
                e.stopPropagation();
                e.preventDefault();
		if (elem.shadowRoot &&
		    elem.shadowRoot.querySelector('div.switch')) {
		    elem.shadowRoot.querySelector('div.switch').click();
		} else {
                    elem.click();
		}
            }
        }, false);
    }
}

function fixTile(tile) {
    console.log('Fixing tile:');
    console.log(tile);
    newLabel = (tile.getAttribute('letter') || '') + ' ' +
        (tile.getAttribute('evaluation') || '');
    if (newLabel != tile.getAttribute('aria-label')) {
	tile.setAttribute('aria-label', newLabel);
    }
}

let tileObserver = new MutationObserver((mutationsList, observer) => {
    for (let mutation of mutationsList) {
        fixTile(mutation.target);
    }
});

function watchTile(tile) {
    fix(tile, false, 'tile', 'Empty');
    tile.setAttribute('aria-live', 'polite');
    tileObserver.observe(tile, { attributes: true, childList: false, subtree: false });
}

function fixKey(key) {
    console.log('Fixing key:');
    console.log(key);
    newLabel = (key.getAttribute('data-key') || '') + ' ' +
        (key.getAttribute('data-state') || '');
    if (newLabel != key.getAttribute('aria-label')) {
	key.setAttribute('aria-label', newLabel);
    }
}

let keyObserver = new MutationObserver((mutationsList, observer) => {
    for (let mutation of mutationsList) {
        fixKey(mutation.target);
    }
});

function watchKey(key) {
    keyObserver.observe(key, { attributes: true, childList: false, subtree: false });
}

let checkboxObserver = new MutationObserver((mutationsList, observer) => {
    for (let mutation of mutationsList) {
	let checkbox = mutation.target;
	let newAttr = '' + checkbox.hasAttribute('checked');
	if (newAttr != checkbox.getAttribute('aria-checked')) {
	    checkbox.setAttribute('aria-checked', newAttr);
	}
    }
});

function watchCheckbox(checkbox) {
    if (!checkbox.hasAttribute('aria-checked')) {
	fix(checkbox, true, 'checkbox', checkbox.getAttribute('name'));
	checkbox.setAttribute('aria-checked',
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
		let stats = app.shadowRoot.querySelector('game-stats');
		console.log('Modal stats: ' + stats);
		if (stats) {
		    let button = stats.shadowRoot.querySelector('button');
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

function watchModal(modal) {
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
		let close = gamePage.shadowRoot.querySelector('game-icon[icon=close]');
		console.log('Close: ' + close);
		if (close) {
                    fix(close, true, 'button', 'Close');
		}

		// Inside game page could be either settings or help.
		let gameSettings = app.shadowRoot.querySelector('game-settings');
		console.log('Game settings: ' + gameSettings);
		if (gameSettings) {
		    gamePage.setAttribute('aria-label', 'Settings Modal');
		    let checkboxes = gameSettings.shadowRoot.querySelectorAll('game-switch');
		    console.log('Checkboxes: ' + checkboxes.length);
		    for (let i = 0; i < checkboxes.length; i++)
			watchCheckbox(checkboxes[i]);

		    let checkbox = gameSettings.shadowRoot.querySelector('game-switch');
		    console.log('Checkbox: ' + checkbox);
		    if (checkbox) {
			checkbox.focus();
		    }
		}

		let help = app.shadowRoot.querySelector('game-help');
		console.log('Game helps: ' + help);
		if (help) {
		    gamePage.setAttribute('aria-label', 'Help Modal');
		    
		    let tiles = help.shadowRoot.querySelectorAll('game-tile');
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

function watchGamePage(gamePage) {
    previousGamePageState = gamePage.hasAttribute('open');
    gamePageObserver.observe(gamePage,  { attributes: true, childList: false, subtree: false });
}

function applyFixes() {
    app = document.querySelector('game-app');
    console.log('App: ' + app);
    if (app) {
        let modal = app.shadowRoot.querySelector('game-modal');
        console.log('Modal: ' + modal);
        if (modal) {
            fix(modal, false, 'dialog', 'Pop-up Modal');

            let close = modal.shadowRoot.querySelector('game-icon[icon=close]');
            console.log('Close: ' + close);
            if (close) {
                fix(close, true, 'button', 'Close');
                setTimeout(() => {
                    close.focus();
                }, 1000);
            }
        }

	watchModal(modal);
	
        let help = app.shadowRoot.querySelector('game-help');
	console.log('Help: ' + help);
	if (help) {
	    let tiles = help.shadowRoot.querySelectorAll('game-tile');
	    console.log('Tiles: ' + tiles.length);
	    for (let j = 0; j < tiles.length; j++) {
		fix(tiles[j], true, 'tile', 'Tile');
                fixTile(tiles[j]);
	    }
	}

	let toasters = app.shadowRoot.querySelectorAll('.toaster');
	console.log('Toasters: ' + toasters.length);
	for (let i = 0; i < toasters.length; i++) {
	    toasters[i].setAttribute('aria-live', 'polite');
	}

        let gamePage = app.shadowRoot.querySelector('game-page');
        console.log('Game page: ' + gamePage);
	watchGamePage(gamePage);

        let keyboard = app.shadowRoot.querySelector('game-keyboard');
        console.log('Keyboard: ' + keyboard);
	fix(keyboard, false, 'group', 'Keyboard');

	let keys = keyboard.shadowRoot.querySelectorAll('button[data-key]');
        console.log('Keys: ' + keys.length);
	for (let i = 0; i < keys.length; i++) {
	    if (!firstKey) {
		firstKey = keys[i];
	    }
	    watchKey(keys[i]);
	}

        let backspace = keyboard.shadowRoot.querySelector('button[data-key=←]');
        console.log('Backspace: ' + backspace);
        fix(backspace, false, null, 'backspace');

        let rows = app.shadowRoot.querySelectorAll('game-row');
        console.log('Rows: ' + rows.length);
        for (let i = 0; i < rows.length; i++) {
	    fix(rows[i], false, 'group', 'Row ' + (i + 1));

            let tiles = rows[i].shadowRoot.querySelectorAll('game-tile');
            console.log('Tiles: ' + tiles.length);
            for (let j = 0; j < tiles.length; j++) {
                watchTile(tiles[j]);
            }
        }

	let extensionCredit = document.createElement('div');
	extensionCredit.innerHTML = 'Wordle screen reader accessibility extension running.';
	rows[rows.length - 1].parentElement.appendChild(extensionCredit);
    }
}

setTimeout(() => {
    applyFixes();
}, 1000);
