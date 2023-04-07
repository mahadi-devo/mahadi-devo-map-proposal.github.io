/**
 * Calculates and displays a car route from the Brandenburg Gate in the centre of Berlin
 * to Friedrichstraße Railway Station.
 *
 * A full list of available request parameters can be found in the Routing API documentation.
 * see: http://developer.here.com/rest-apis/documentation/routing/topics/resource-calculate-route.html
 *
 * @param {H.service.Platform} platform A stub class to access HERE services
 */
function calculateRouteFromAtoB(platform) {
  var router = platform.getRoutingService(null, 8),
    routeRequestParams = {
      routingMode: 'fast',
      transportMode: 'car',
      origin: '52.5160,13.3779', // Brandenburg Gate
      destination: '52.5206,13.3862', // Friedrichstraße Railway Station
      return: 'polyline,turnByTurnActions,actions,instructions,travelSummary',
    };

  router.calculateRoute(routeRequestParams, onSuccess, onError);
}

/**
 * This function will be called once the Routing REST API provides a response
 * @param {Object} result A JSONP object representing the calculated route
 *
 * see: http://developer.here.com/rest-apis/documentation/routing/topics/resource-type-calculate-route.html
 */
function onSuccess(result) {
  var route = result.routes[0];

  /*
   * The styling of the route response on the map is entirely under the developer's control.
   * A representative styling can be found the full JS + HTML code of this example
   * in the functions below:
   */
  addRouteShapeToMap(route);
  addManueversToMap(route);
  addWaypointsToPanel(route);
  addManueversToPanel(route);
  addSummaryToPanel(route);
}

/**
 * This function will be called if a communication error occurs during the JSON-P request
 * @param {Object} error The error message received.
 */
function onError(error) {
  alert("Can't reach the remote server");
}

/**
 * Boilerplate map initialization code starts below:
 */

// set up containers for the map + panel
var mapContainer = document.getElementById('map'),
  routeInstructionsContainer = document.getElementById('panel');

// Step 1: initialize communication with the platform
// In your own code, replace variable window.apikey with your own apikey
var platform = new H.service.Platform({
  apikey: window.apikey,
});

var defaultLayers = platform.createDefaultLayers();

// Step 2: initialize a map - this map is centered over Berlin
var map = new H.Map(mapContainer, defaultLayers.vector.normal.map, {
  center: { lat: 52.516, lng: 13.3779 },
  zoom: 15,
  pixelRatio: window.devicePixelRatio || 1,
});

// add a resize listener to make sure that the map occupies the whole container
window.addEventListener('resize', () => map.getViewPort().resize());

// Step 3: make the map interactive
// MapEvents enables the event system
// Behavior implements default interactions for pan/zoom (also on mobile touch environments)
var behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));

// Create the default UI components
var ui = H.ui.UI.createDefault(map, defaultLayers);

// Hold a reference to any infobubble opened
var bubble;

/**
 * Opens/Closes a infobubble
 * @param {H.geo.Point} position The location on the map.
 * @param {String} text          The contents of the infobubble.
 */
function openBubble(position, text) {
  if (!bubble) {
    bubble = new H.ui.InfoBubble(
      position,
      // The FO property holds the province name.
      { content: text }
    );
    ui.addBubble(bubble);
  } else {
    bubble.setPosition(position);
    bubble.setContent(text);
    bubble.open();
  }
}

/**
 * Creates a H.map.Polyline from the shape of the route and adds it to the map.
 * @param {Object} route A route as received from the H.service.RoutingService
 */
function addRouteShapeToMap(route) {
  route.sections.forEach((section) => {
    // decode LineString from the flexible polyline
    let linestring = H.geo.LineString.fromFlexiblePolyline(section.polyline);

    // Create a polyline to display the route:
    let polyline = new H.map.Polyline(linestring, {
      style: {
        lineWidth: 4,
        strokeColor: 'rgba(0, 128, 255, 0.7)',
      },
    });

    // Add the polyline to the map
    map.addObject(polyline);

    // And zoom to its bounding rectangle
    map.getViewModel().setLookAtData({
      bounds: polyline.getBoundingBox(),
      zoom: map.getZoom() + 2,
    });

    // Define the start point of the polyline
    let startPoint = polyline.getGeometry().extractPoint(0);

    // Define the DomMarker at the start point
    let marker = new H.map.DomMarker(startPoint);

    // Add the marker to the map
    map.addObject(marker);

    // randomly update all markers positions in intervals
    setTimeout(updateMarkerPositions, 2000);
    setInterval(updateMarkerPositions, 2000);

    /**
     * update all markers' positions with animation using the ease function
     */

    let initialPositions = [
      [52.516233, 13.378311],
      [52.51628, 13.37953],
      [52.51637, 13.38085],
      [52.518080000000005, 13.38045],
      [52.51893, 13.380300000000002],
      [52.52065999999998, 13.386108000000002],
    ];

    let counter = 0;

    function updateMarkerPositions() {
      console.log(counter);
      // get new position based on index to create a moving path
      let newPosition = initialPositions[counter];
      console.log(newPosition);
      // update marker's position within ease function callback
      ease(
        marker.getGeometry(),
        { lat: newPosition[0], lng: newPosition[1] },
        400,
        function (coord) {
          marker.setGeometry(coord);
        }
      );
      if (counter === initialPositions.length - 1) {
        counter = 0;
      } else {
        counter++;
      }
    }
  });

  function ease(
    startCoord = { lat: 0, lng: 0 },
    endCoord = { lat: 1, lng: 1 },
    durationMs = 200,
    onStep = console.log,
    onComplete = function () {}
  ) {
    var raf =
        window.requestAnimationFrame ||
        function (f) {
          window.setTimeout(f, 16);
        },
      stepCount = durationMs / 16,
      valueIncrementLat = (endCoord.lat - startCoord.lat) / stepCount,
      valueIncrementLng = (endCoord.lng - startCoord.lng) / stepCount,
      sinValueIncrement = Math.PI / stepCount,
      currentValueLat = startCoord.lat,
      currentValueLng = startCoord.lng,
      currentSinValue = 0;

    function step() {
      currentSinValue += sinValueIncrement;
      currentValueLat += valueIncrementLat * Math.sin(currentSinValue) ** 2 * 2;
      currentValueLng += valueIncrementLng * Math.sin(currentSinValue) ** 2 * 2;

      if (currentSinValue < Math.PI) {
        onStep({ lat: currentValueLat, lng: currentValueLng });
        raf(step);
      } else {
        onStep(endCoord);
        onComplete();
      }
    }

    raf(step);
  }
}

/**
 * Creates a series of H.map.Marker points from the route and adds them to the map.
 * @param {Object} route A route as received from the H.service.RoutingService
 */
function addManueversToMap(route) {
  var svgMarkup =
      '<svg width="18" height="18" ' +
      'xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="8" cy="8" r="8" ' +
      'fill="#1b468d" stroke="white" stroke-width="1" />' +
      '</svg>',
    dotIcon = new H.map.Icon(svgMarkup, { anchor: { x: 8, y: 8 } }),
    group = new H.map.Group(),
    i,
    j;

  route.sections.forEach((section) => {
    let poly = H.geo.LineString.fromFlexiblePolyline(
      section.polyline
    ).getLatLngAltArray();

    let actions = section.actions;
    // Add a marker for each maneuver
    for (i = 0; i < actions.length; i += 1) {
      let action = actions[i];
      var marker = new H.map.Marker(
        {
          lat: poly[action.offset * 3],
          lng: poly[action.offset * 3 + 1],
        },
        { icon: dotIcon }
      );
      marker.instruction = action.instruction;
      group.addObject(marker);
    }

    group.addEventListener(
      'tap',
      function (evt) {
        map.setCenter(evt.target.getGeometry());
        console.log(evt.target.getGeometry());
        openBubble(evt.target.getGeometry(), evt.target.instruction);
      },
      false
    );

    // Add the maneuvers group to the map
    map.addObject(group);
  });
}

/**
 * Creates a series of H.map.Marker points from the route and adds them to the map.
 * @param {Object} route A route as received from the H.service.RoutingService
 */
function addWaypointsToPanel(route) {
  var nodeH3 = document.createElement('h3'),
    labels = [];

  route.sections.forEach((section) => {
    labels.push(section.turnByTurnActions[0].nextRoad.name[0].value);
    labels.push(
      section.turnByTurnActions[section.turnByTurnActions.length - 1]
        .currentRoad.name[0].value
    );
  });

  nodeH3.textContent = labels.join(' - ');
  routeInstructionsContainer.innerHTML = '';
  routeInstructionsContainer.appendChild(nodeH3);
}

/**
 * Creates a series of H.map.Marker points from the route and adds them to the map.
 * @param {Object} route A route as received from the H.service.RoutingService
 */
function addSummaryToPanel(route) {
  let duration = 0,
    distance = 0;

  route.sections.forEach((section) => {
    distance += section.travelSummary.length;
    duration += section.travelSummary.duration;
  });

  var summaryDiv = document.createElement('div'),
    content =
      '<b>Total distance</b>: ' +
      distance +
      'm. <br />' +
      '<b>Travel Time</b>: ' +
      toMMSS(duration) +
      ' (in current traffic)';

  summaryDiv.style.fontSize = 'small';
  summaryDiv.style.marginLeft = '5%';
  summaryDiv.style.marginRight = '5%';
  summaryDiv.innerHTML = content;
  routeInstructionsContainer.appendChild(summaryDiv);
}

/**
 * Creates a series of H.map.Marker points from the route and adds them to the map.
 * @param {Object} route A route as received from the H.service.RoutingService
 */
function addManueversToPanel(route) {
  var nodeOL = document.createElement('ol');

  nodeOL.style.fontSize = 'small';
  nodeOL.style.marginLeft = '5%';
  nodeOL.style.marginRight = '5%';
  nodeOL.className = 'directions';

  route.sections.forEach((section) => {
    section.actions.forEach((action, idx) => {
      var li = document.createElement('li'),
        spanArrow = document.createElement('span'),
        spanInstruction = document.createElement('span');

      spanArrow.className = 'arrow ' + (action.direction || '') + action.action;
      spanInstruction.innerHTML = section.actions[idx].instruction;
      li.appendChild(spanArrow);
      li.appendChild(spanInstruction);

      nodeOL.appendChild(li);
    });
  });

  routeInstructionsContainer.appendChild(nodeOL);
}

function toMMSS(duration) {
  return (
    Math.floor(duration / 60) + ' minutes ' + (duration % 60) + ' seconds.'
  );
}

// Now use the map as required...
calculateRouteFromAtoB(platform);
