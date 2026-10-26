const searchForm = document.getElementById("search-form")
const wordInput = document.getElementById("word-input")
const statusMessage = document.getElementById("status-message")

const wordTitle = document.getElementById("word-title")
const pronunciation = document.getElementById("pronunciation")
const audioButton = document.getElementById("audio-button")
const favoriteButton = document.getElementById("favorite-button")

const definitionsContainer = document.getElementById("definitions-container");

const favoritesList = document.getElementById("favorites-list")

let audioUrl = "";
let favoriteWords = JSON.parse(localStorage.getItem("favoriteWords")) || [];


async function fetchWord(word) {
    statusMessage.textContent = "Searching for word...";
    statusMessage.style.color = "#333";
    definitionsContainer.replaceChildren();
    wordTitle.textContent = "";
    pronunciation.textContent = "";
    audioButton.hidden = true;
    favoriteButton.hidden = true;
    audioUrl = "";

    try {
        const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(
                response.status === 404
                    ? "Word not found. Please try another word."
                    : `Dictionary request failed. Status: ${response.status}`
            );
        }

        const data = await response.json();

        displayWord(data);
        statusMessage.textContent = "";
    } catch (error) {
        console.error("Dictionary search error:", error);

        displayError(
            error.message === "Failed to fetch"
                ? "Could not connect to the dictionary. Check your internet connection."
                : error.message || "Something went wrong. Please try again."
        );
    }
}

function displayWord(data) {
    // Get the first dictionary entry.
    const entry = data[0];

    // Display the word.
    wordTitle.textContent = entry.word;
    favoriteButton.hidden = false;

favoriteButton.textContent = favoriteWords.some(function (savedWord) {
    return savedWord.toLowerCase() === entry.word.toLowerCase();
})
    ? "Remove from favorites"
    : "Save to favorites";

    // Display the pronunciation.
    const phonetic = entry.phonetic ||
        entry.phonetics?.find(item => item.text)?.text ||
        "Pronunciation unavailable";

    pronunciation.textContent = phonetic;

    // Find an available audio recording.
    const audioEntry = entry.phonetics?.find(function (item) {
    return item.audio && item.audio.trim() !== "";
});

if (audioEntry) {
    audioUrl = audioEntry.audio.startsWith("//")
        ? `https:${audioEntry.audio}`
        : audioEntry.audio;

    audioButton.hidden = false;
} else {
    audioUrl = "";
    audioButton.hidden = true;
}

    // Display definitions for every meaning.
    entry.meanings.forEach(meaning => {
        const heading = document.createElement("h3");

        heading.textContent = meaning.partOfSpeech;

        definitionsContainer.appendChild(heading);

        meaning.definitions.forEach(item => {
            const card = document.createElement("div");

            card.className = "definition-card";

            const definitionText = document.createElement("p");

            definitionText.textContent = item.definition;

            card.appendChild(definitionText);

            // Display an example if one exists.
            if (item.example) {
                const example = document.createElement("p");

                example.textContent = `Example: ${item.example}`;

                card.appendChild(example);
            }

            // Display synonyms if available.
            if (item.synonyms?.length) {
                const synonyms = document.createElement("p");

                synonyms.className = "synonyms";

                synonyms.textContent =
                    `Synonyms: ${item.synonyms.join(", ")}`;

                card.appendChild(synonyms);
            }

            definitionsContainer.appendChild(card);
        });
    });
}

function displayError(message) {
    statusMessage.textContent = message;
    statusMessage.style.color = "#b42318";
}   

function playPronunciation() {
    if (!audioUrl) {
        displayError("Audio pronunciation is unavailable for this word.");
        return;
    }

    const audio = new Audio(audioUrl);

    audio.addEventListener("error", () => {
        displayError("This pronunciation audio is unavailable. Try another word.");
    });

    audio.play().catch((error) => {
        console.error("Audio playback error:", error);
        displayError("Unable to play this audio. Please try again.");
    });
}

searchForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const word = wordInput.value.trim();

    if (word === "") {
        displayError("Please enter a word to search.");
        return;
    }

    fetchWord(word);    
});

audioButton.addEventListener("click", playPronunciation); 

statusMessage.textContent = "Enter a word above to discover its meaning.";

function renderFavorites() {
    favoritesList.replaceChildren();

    favoriteWords.forEach(function (word) {
        const listItem = document.createElement("li");

        const wordButton = document.createElement("button");
        wordButton.type = "button";
        wordButton.textContent = word;

        wordButton.addEventListener("click", function () {
            wordInput.value = word;
            fetchWord(word);
        });

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.textContent = "Remove";

        removeButton.addEventListener("click", function () {
            favoriteWords = favoriteWords.filter(function (savedWord) {
                return savedWord !== word;
            });

            localStorage.setItem(
                "favoriteWords",
                JSON.stringify(favoriteWords)
            );

            renderFavorites();

            if (wordTitle.textContent.toLowerCase() === word.toLowerCase()) {
                favoriteButton.textContent = "♡ Save to favorites";
            }
        });

        listItem.append(wordButton, removeButton);
        favoritesList.appendChild(listItem);
    });
}

function toggleFavorite() {
    const word = wordTitle.textContent.trim();

    if (word === "") {
        return;
    }

    const alreadyFavorite = favoriteWords.some(function (savedWord) {
        return savedWord.toLowerCase() === word.toLowerCase();
    });

    if (alreadyFavorite) {
        favoriteWords = favoriteWords.filter(function (savedWord) {
            return savedWord.toLowerCase() !== word.toLowerCase();
        });

        favoriteButton.textContent = "♡ Save to favorites";
    } else {
        favoriteWords.push(word);

        favoriteButton.textContent = "♥ Remove from favorites";
    }

    localStorage.setItem("favoriteWords", JSON.stringify(favoriteWords));

    renderFavorites();
}

favoriteButton.addEventListener("click", toggleFavorite);
renderFavorites();