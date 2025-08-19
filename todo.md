# Stuff to do

## Font

Schibsted Grotesk

@import url('https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:ital,wght@0,400..900;1,400..900&display=swap');

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet">

.schibsted-grotesk-<uniquifier> {
font-family: "Schibsted Grotesk", sans-serif;
font-optical-sizing: auto;
font-weight: <weight>; - 400 - 900
font-style: normal;
}

## UI

### Graphs

svg animated images to display how close the humidity and windspeed are to the maximum desired reading for safty.

### Button

Trying to decide on just using a button to grab the users location and use that info for the rest of the API calls. Would be simple and make it so no one had to type. Or use two options so people can check an alternate location and not be forced into checking for their current location.

## Processes

### Get location - Geolocation API

Requires permissions but works for mobile

`navigator.geolocation.getCurrentPosition(
  (position) => {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    // Use the coordinates
  },
  (error) => {
    // Handle permission denied or other errors
  }
);`

Free options(no permissions required but less accurate - city-level at best) - ipapi.co, ipgeolocation.io, ip-api.com

### Considerations

1. Privacy: Always be transparent about location usage
2. Fallbacks: Handle cases where geolocation fails or is denied
3. Caching: Store location data appropriately to avoid repeated requests
4. HTTPS: Geolocation API requires secure connection
5. Performance: IP geolocation is faster for initial page loads

### Show Location - OpenStreetMap Nominatim

Free with no API key required

Send an HTTP request to the API with the latitude and longitude, and get back structured location data including:
`{
  "city": "San Francisco",
  "state": "California",
  "country": "United States",
  "address": "123 Main St",
  "postal_code": "94102"
}`
