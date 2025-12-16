(function () {
    'use strict';

    // --- Helper Functions ---

    /**
     * Gets a random element from an array.
     * @param {Array<T>} arr - The input array.
     * @returns {T} A random element from the array.
     * @template T
     */
    function getRandomImage(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    /**
     * Clears background images (source and img src) from all containers.
     */
    function clearBackgroundImages() {
        document.querySelectorAll('.background-image-container').forEach(container => {
            const source = container.querySelector('source');
            const img = container.querySelector('img');
            if (source) source.src = "";
            if (img) img.src = "";
        });
    }

    /**
     * Extracts the performer ID from the current URL path.
     * @returns {string | null} The performer ID or null if not found.
     */
    function getPerformerIdFromPath() {
        const regex = /performers\/(\d+)/;
        const match = window.location.pathname.match(regex);
        return match ? match[1] : null;
    }

    // --- Data Fetching ---

    /**
     * Fetches random images associated with a performer ID using a GraphQL query.
     * @param {string} performerID - The ID of the performer.
     * @returns {Promise<Object | undefined>} The image data or undefined on error.
     */
    const fetchPerformerImages = async (performerID) => {
        const query = `
            query {
                findImages(
                    image_filter: {galleries_filter: {performers: {value: ["${performerID}"], modifier: INCLUDES_ALL}}}
                    , filter: {sort: "random"} 
                ) {
                    images {
                        id
                        visual_files {
                            ... on ImageFile { width height }
                            ... on VideoFile { width height }
                        }
                    }
                }
            }
        `;
        try {
            const response = await fetch('/graphql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });

            if (!response.ok) {
                throw new Error('GraphQL response was not ok: ' + response.statusText);
            }

            const json = await response.json();
            return json.data.findImages;
        } catch (error) {
            console.error('Error fetching performer images:', error);
        }
    };

    // --- DOM Update Functions ---

    /**
     * Updates the main background image containers and ensures a single background-transition element exists.
     * @param {string[]} wideImages - Array of URLs for wide images.
     */
    function updateBackgroundImages(wideImages) {
        if (wideImages.length === 0) return;

        const randomImage = getRandomImage(wideImages);

        // FIX: Ensure only one '.background-transition' is added, and it follows the first container.
        if (!document.querySelector('.background-transition')) {
            const firstContainer = document.querySelector('.background-image-container');
            if (firstContainer) {
                firstContainer.insertAdjacentHTML('afterend', '<div class="background-transition"></div>');
            }
        }
        
        // Update all background containers
        document.querySelectorAll('.background-image-container').forEach(container => {
            const img = container.querySelector('img');
            if (img) img.src = randomImage;

            // Set styles for visibility/opacity
            container.style.visibility = 'visible';
            container.style.opacity = '1';
        });
    }

    /**
     * Updates the detail header images.
     * @param {string[]} tallImages - Array of URLs for tall images.
     */
    function updateDetailHeaderImages(tallImages) {
        if (tallImages.length === 0) return;

        const randomImage = getRandomImage(tallImages);

        document.querySelectorAll('.detail-header-image').forEach(container => {
            const img = container.querySelector('img');
            if (img) img.src = randomImage;
        });
    }

    /**
     * Main logic to fetch data, categorize images, and update the DOM.
     */
    async function updateDOM() {
        const performerID = getPerformerIdFromPath();
        if (!performerID) return;

        const imagesArray = await fetchPerformerImages(performerID);

        if (!imagesArray || !imagesArray.images) return;

        const tallImages = [];
        const wideImages = [];

        imagesArray.images.forEach(image => {
            const imgUrl = `image/${image.id}/image`;
            const { width, height } = image.visual_files[0];

            // Categorize images based on their dimensions
            (height > width ? tallImages : wideImages).push(imgUrl);
        });

        // Clear existing images before setting new ones (moved here from the old waitForElement)
        clearBackgroundImages(); 
        
        // Update DOM elements
        updateBackgroundImages(wideImages);
        updateDetailHeaderImages(tallImages);
    }

    // --- Navigation Handlers ---

    /**
     * Checks the current path and triggers DOM update if on a performer page.
     */
    function handlePathChange() {
        if (window.location.pathname.startsWith("/performers/")) {
            updateDOM();
        }
    }

    // Override history methods to detect SPA navigation
    const originalPushState = history.pushState;
    history.pushState = function (state, title, url) {
        originalPushState.apply(this, arguments);
        handlePathChange();
    };

    const originalReplaceState = history.replaceState;
    history.replaceState = function (state, title, url) {
        originalReplaceState.apply(this, arguments);
        handlePathChange();
    };

    // --- Initialization ---

    handlePathChange(); // Initial load check
    window.addEventListener('popstate', handlePathChange); // Browser back/forward button check

})();
