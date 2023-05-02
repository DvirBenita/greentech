/**
 * @file
 * Behaviors and functionality for the locations overlay.
 */

((Drupal, drupalSettings, mdc, google) => {
  /**
   * @namespace
   */
  Drupal.csLocationsOverlay = Drupal.csLocationsOverlay || {
    /**
     * The locations map object.
     *
     * An instance of the google.maps.Map class.  Initilized and set only once
     * the map is opened to avoid unnecessary API usage and charges.
     *
     * @type {Object}
     */
    map: null,

    /**
     * The mdc tab bar object.
     *
     * An instance of the mdc.MDCTabBar class.  Initilized and set only once
     * the map-overlay is opened.
     *
     * @type {Object}
     */
    tabBar: null,

    /**
     * The locations overlay HTML element.
     *
     * @type {HTMLElement}
     */
    overlayElement: document.getElementById("locations-overlay"),

    /**
     * The locations map HTML element.
     *
     * @type {HTMLElement}
     */
    mapElement: document.getElementById("locations-map"),

    /**
     * The locations list HTML element.
     *
     * @type {HTMLElement}
     */
    listElement: document.getElementById("locations-list"),

    /**
     * Get the map object.
     *
     * @return {Object}
     *   The locations map object.
     */
    getMap() {
      if (!this.map) {
        // Use screen width to determine appropriate zoom level.
        let zoom = 3;
        if (window.screen.width >= 800) {
          zoom = 4;
        }

        // Create the map object.
        this.map = new google.maps.Map(this.getMapElement(), {
          center: { lat: 39.8283, lng: -98.5795 },
          zoom,
          gestureHandling: "greedy",
        });

        // Load in location data.
        this.map.data.loadGeoJson(
          `${drupalSettings.path.baseUrl}locations/GeoJSON`
        );

        // Set marker style.
        this.map.data.setStyle((feature) => {
          let iconName = "location-pin.svg";
          if (feature.getProperty("status") === "coming_soon") {
            iconName = "location-pin-coming-soon.svg";
          }

          return {
            icon: `${drupalSettings.path.baseUrl}modules/custom/cs_locations/images/${iconName}`,
            title: feature.getProperty("name"),
          };
        });

        // Show the information for a location when its marker is clicked.
        const infoWindow = new google.maps.InfoWindow();
        this.map.data.addListener("click", (event) => {
          infoWindow.setContent(event.feature.getProperty("content"));
          infoWindow.setPosition(event.feature.getGeometry().get());
          infoWindow.setOptions({ pixelOffset: new google.maps.Size(0, -24) });
          infoWindow.open(Drupal.csLocationsOverlay.map);
        });
      }
      return this.map;
    },

    /**
     * Get the overlay element.
     *
     * @return {element}
     *   The locations overlay element.
     */
    getOverlayElement() {
      if (!this.overlayElement) {
        // Create the overlay element.
        this.overlayElement = document.createElement("div");
        this.overlayElement.setAttribute("id", "locations-overlay");
        this.overlayElement.classList.add("locations-overlay");
        this.overlayElement.innerHTML = `
          <div class="mdc-tab-bar" role="tablist">
            <div class="mdc-tab-scroller">
              <div class="mdc-tab-scroller__scroll-area">
                <div class="mdc-tab-scroller__scroll-content">
                  <button class="mdc-tab mdc-tab--active" role="tab" aria-selected="true" tabindex="0">
                    <span class="mdc-tab__content">
                      <span class="mdc-tab__icon material-icons" aria-hidden="true">place</span>
                      <span class="mdc-tab__text-label">Map</span>
                    </span>
                    <span class="mdc-tab-indicator mdc-tab-indicator--active">
                      <span class="mdc-tab-indicator__content mdc-tab-indicator__content--underline"></span>
                    </span>
                    <span class="mdc-tab__ripple"></span>
                  </button>
                  <button class="mdc-tab" role="tab" aria-selected="false" tabindex="-1">
                    <span class="mdc-tab__content">
                      <span class="mdc-tab__icon material-icons" aria-hidden="true">list</span>
                      <span class="mdc-tab__text-label">List</span>
                    </span>
                    <span class="mdc-tab-indicator">
                      <span class="mdc-tab-indicator__content mdc-tab-indicator__content--underline"></span>
                    </span>
                    <span class="mdc-tab__ripple"></span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;

        // Initialize the tab bar.
        const tabBarElement = this.overlayElement.querySelector(".mdc-tab-bar");
        this.tabBar = new mdc.tabBar.MDCTabBar(tabBarElement);

        // React to tab activation.
        tabBarElement.addEventListener("MDCTabBar:activated", (event) => {
          this.getOverlayElement()
            .querySelectorAll(".tab-content")
            .forEach((element) => {
              element.classList.remove("open");
            });
          this.getOverlayElement()
            .querySelector(`.tab-content-${event.detail.index}`)
            .classList.add("open");
        });

        // Append the overlay element to the page body.
        document
          .getElementsByTagName("body")[0]
          .appendChild(this.overlayElement);

        // Initialize tab content.
        this.getMap();
        this.getListElement();
      }
      return this.overlayElement;
    },

    /**
     * Get the map element.
     *
     * @return {element}
     *   The locations map element.
     */
    getMapElement() {
      if (!this.mapElement) {
        // Create the map element.
        this.mapElement = document.createElement("div");
        this.mapElement.setAttribute("id", "locations-map");
        this.mapElement.classList.add(
          "locations-map",
          "tab-content",
          "tab-content-0",
          "open"
        );

        // Append the map element to the overlay element.
        this.getOverlayElement().appendChild(this.mapElement);
      }
      return this.mapElement;
    },

    /**
     * Get the list element.
     *
     * @return {element}
     *   The locations list element.
     */
    getListElement() {
      if (!this.listElement) {
        // Create the list element.
        this.listElement = document.createElement("div");
        this.listElement.setAttribute("id", "locations-list");
        this.listElement.classList.add(
          "locations-list",
          "tab-content",
          "tab-content-1"
        );

        // Add a placeholder for the view.
        const viewDomId = "locations-overlay-view";
        this.listElement.innerHTML = `
          <div class="js-view-dom-id-${viewDomId}"></div>
        `;

        // Append the list element to the overlay element.
        this.getOverlayElement().appendChild(this.listElement);

        // Fill placeholder with the locations list view.
        const ajaxSettings = {
          submit: {
            view_name: "cs_locations_list",
            view_display_id: "overlay_block",
            view_dom_id: viewDomId,
          },
          url: `${drupalSettings.path.baseUrl}views/ajax`,
        };
        Drupal.ajax(ajaxSettings).execute();
      }
      return this.listElement;
    },

    /**
     * Open the overlay.
     */
    openOverlay() {
      document.body.classList.add("locations-overlay-open");
      this.getOverlayElement().classList.add("open");
    },

    /**
     * Close the overlay.
     */
    closeOverlay() {
      document.body.classList.remove("locations-overlay-open");
      this.getOverlayElement().classList.remove("open");
    },

    /**
     * Toggle the overlay.
     */
    toggleOverlay() {
      if (!this.getOverlayElement().classList.contains("open")) {
        this.openOverlay();
      } else {
        this.closeOverlay();
      }
    },

    /**
     * Initialize an overlay-toggling element.
     *
     * @param {element} toggleElement
     *   An overlay-toggling DOM element.
     */
    initToggle(toggleElement) {
      // Toggle the overlay on click.
      toggleElement.addEventListener("click", (e) => {
        // Do not actually follow the link.
        e.preventDefault();
        // Toggle the map.
        Drupal.csLocationsOverlay.toggleOverlay();
        // Toggle the active class on the toggle element.
        e.target.classList.toggle("active");
      });

      // Tag this element as processed.
      toggleElement.classList.add("activated");
    },

    /**
     * Initialize all overlay-toggling elements in the given context.
     *
     * Any element with the "locations-overlay-toggle" class is treated as a
     * toggle.  The "locations-map-toggle" class is still supported but
     * deprecated.
     *
     * @param {HTMLDocument|HTMLElement} context
     *   An element to initialize overlay-toggles within.
     */
    initAllToggles(context) {
      context
        .querySelectorAll(
          ".locations-overlay-toggle:not(.activated), .locations-map-toggle:not(.activated)"
        )
        .forEach(this.initToggle);
    },
  };

  /**
   * Set up the locations overlay.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *  Attaches the csLocationsOverlay behavior to the right context.
   */
  Drupal.behaviors.csLocationsOverlay = {
    attach(context) {
      // Initilize all overlay-toggling triggers.
      Drupal.csLocationsOverlay.initAllToggles(context);
    },
  };
})(Drupal, drupalSettings, window.mdc, window.google);
