const WORD_LENGTH = 5;
const FLIP_ANIMATION_DURATION = 200;
const DANCE_ANIMATION_DURATION = 200;
const keyboard = document.querySelector("[data-keyboard]");
const alertContainer = document.querySelector("[data-alert-container]");
const guessGrid = document.querySelector("[data-guess-grid]");
start_interaction();
let remaining_words = target_words.slice();
const all_states = prepare_all_states();
function start_interaction() {
    document.addEventListener("click", handle_mouse_click);
    document.addEventListener("keydown", handle_key_press);
}
function stop_interaction() {
    document.removeEventListener("click", handle_mouse_click);
    document.removeEventListener("keydown", handle_key_press);
}
function handle_mouse_click(event) {
    if (event.target.matches("[data-key]")) {
        press_key(event.target.dataset.key);
        return;
    }
    if (event.target.matches("[data-enter]")) {
        submit_guess();
        return;
    }
    if (event.target.matches("[data-delete]")) {
        delete_key();
        return;
    }
}
function handle_key_press(event) {
    if (event.key === "Enter") {
        submit_guess();
        return;
    }
    if (event.key === "Backspace" || event.key === "Delete") {
        delete_key();
        return;
    }
    if (event.key.match(/^[a-z]$/)) {
        press_key(event.key);
        return;
    }
}
function press_key(key) {
    const activeTiles = get_active_tiles();
    if (activeTiles.length >= WORD_LENGTH) return;
    const nextTile = guessGrid.querySelector(":not([data-letter])");
    nextTile.dataset.letter = key.toLowerCase();
    nextTile.textContent = key;
    nextTile.dataset.state = "active";
}
function delete_key() {
    const activeTiles = get_active_tiles();
    const lastTile = activeTiles[activeTiles.length - 1];
    if (lastTile == null) return;
    lastTile.textContent = "";
    delete lastTile.dataset.state;
    delete lastTile.dataset.letter;
}
function submit_guess() {
    const activeTiles = [...get_active_tiles()];
    if (activeTiles.length !== WORD_LENGTH) {
        show_alert("Guess has to have five letters");
        shake_tiles(activeTiles);
        return;
    }
    const guess = activeTiles.reduce((word, tile) => {
        return word + tile.dataset.letter;
    }, "");
    if (!guess_words.includes(guess)) {
        show_alert(`Not in word list`);
        shake_tiles(activeTiles);
        return;
    }
    stop_interaction();
    const state = calculate_best_state(guess);
    activeTiles.forEach((...params) => flip_tile(...params, state));
}
function prepare_all_states() {
    position_states = ["false", "wrong_position", "correct"];
    states = [];
    for (let position1 of position_states) {
        for (let position2 of position_states) {
            for (let position3 of position_states) {
                for (let position4 of position_states) {
                    for (let position5 of position_states) {
                        states.push([position1, position2, position3, position4, position5]);
                    }
                }
            }
        }
    }
    return states;
}
function is_word_valid(guess, word, state) {
    let how_often_wrong_position_left = {};
    for (let index = 0; index < WORD_LENGTH; index++) {
        let state_position = state[index];
        let word_character = word[index];
        if (word_character in how_often_wrong_position_left) {
            how_often_wrong_position_left[word_character] += 1;
        } else {
            how_often_wrong_position_left[word_character] = 1;
        }
        if (state_position == "correct") {
            let guess_character = guess[index];
            if (guess_character == word_character) {
                how_often_wrong_position_left[guess_character] -= 1;
                continue;
            } else {
                return false;
            }
        }
    }
    for (let index = 0; index < WORD_LENGTH; index++) {
        let state_position = state[index];
        if (state_position == "wrong_position") {
            let guess_character = guess[index];
            let word_character = word[index];
            if (guess_character == word_character) {
                return false;
            } else if (!word.includes(guess_character)) {
                return false;
            } else if (how_often_wrong_position_left[guess_character] > 0) {
                how_often_wrong_position_left[guess_character] -= 1;
                continue;
            } else {
                return false;
            }
        }
    }
    for (let index = 0; index < WORD_LENGTH; index++) {
        let state_position = state[index];
        if (state_position == "false") {
            let guess_character = guess[index];
            let word_character = word[index];
            if (guess_character == word_character) {
                return false;
            } else if (!word.includes(guess_character)) {
                continue;
            } else if (how_often_wrong_position_left[guess_character] > 0) {
                return false;
            } else {
                continue;
            }
        }
    }
    return true;
}
function find_words_under_state(guess, possible_words, state) {
    let words = [];
    for (let word of possible_words) {
        if (is_word_valid(guess, word, state)) {
            words.push(word);
        }
    }
    return words;
}
function calculate_best_state(guess) {
    let best_states = [];
    let best_state_len_words = 0;
    for (let state of all_states) {
        const words_under_state = find_words_under_state(guess, remaining_words, state);
        const state_len_words = words_under_state.length;
        if (state_len_words > best_state_len_words) {
            best_states = [];
            best_states.push([state, words_under_state]);
            best_state_len_words = state_len_words;
        } else if (state_len_words == best_state_len_words) {
            if (state.every(element => element == "correct")) {
                continue;
            }
            best_states.push([state, words_under_state]);
        }
    }
    const random_best_entry = best_states[Math.floor(Math.random() * best_states.length)];
    const random_best_state = random_best_entry[0];
    remaining_words = random_best_entry[1];
    return random_best_state;
}
function flip_tile(tile, index, tiles, state) {
    const letter = tile.dataset.letter;
    const key = keyboard.querySelector(`[data-key="${letter}"i]`);
    setTimeout(() => {
        tile.classList.add("flip");
    }, (index * FLIP_ANIMATION_DURATION) / WORD_LENGTH);
    tile.addEventListener(
        "transitionend",
        () => {
            tile.classList.remove("flip");
            if (state[index] == "correct") {
                tile.dataset.state = "correct";
                key.classList.add("correct");
            } else if (state[index] == "wrong_position") {
                tile.dataset.state = "wrong-location";
                key.classList.add("wrong-location");
            } else {
                tile.dataset.state = "wrong";
                key.classList.add("wrong");
            }
            if (index === tiles.length - 1) {
                tile.addEventListener(
                    "transitionend",
                    () => {
                        start_interaction();
                        check_win_lose(state, tiles);
                    },
                    { once: true }
                );
            }
        },
        { once: true }
    );
}
function get_active_tiles() {
    return guessGrid.querySelectorAll('[data-state="active"]');
}
function show_alert(message, duration = 1500) {
    const alert = document.createElement("div");
    alertContainer.innerHTML = "";
    alert.innerHTML = message;
    alert.classList.add("alert");
    alertContainer.prepend(alert);
    if (duration == null) return;
    setTimeout(() => {
        alert.classList.add("hide");
        alert.addEventListener("transitionend", () => {
            alert.remove();
        });
    }, duration);
}
function shake_tiles(tiles) {
    tiles.forEach((tile) => {
        tile.classList.add("shake");
        tile.addEventListener(
            "animationend",
            () => {
                tile.classList.remove("shake");
            },
            { once: true }
        );
    });
}
function check_win_lose(state, tiles) {
    if (state.every(element => element == "correct")) {
        show_alert("Well done!", null);
        dance_tiles(tiles);
        stop_interaction();
        return;
    }
    const revealed_word = remaining_words[Math.floor(Math.random() * remaining_words.length)];
    const remainingTiles = guessGrid.querySelectorAll(":not([data-letter])");
    if (remainingTiles.length === 0) {
        show_alert(`${revealed_word.toUpperCase()}`, null);
        stop_interaction();
    }
}
function dance_tiles(tiles) {
    tiles.forEach((tile, index) => {
        setTimeout(() => {
            tile.classList.add("dance");
            tile.addEventListener(
                "animationend",
                () => {
                    tile.classList.remove("dance");
                },
                { once: true }
            );
        }, (index * DANCE_ANIMATION_DURATION) / WORD_LENGTH);
    });
}
