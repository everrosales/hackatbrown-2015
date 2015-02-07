if (Meteor.isClient) {
  // counter starts at 0

  function initialize(){
    
    var mapOptions = {
      center: new google.maps.LatLng(41.82681380, -71.40298949),
      zoom: 8,
      streetViewControl: false,
      panControl: true,
      panControlOptions: {
        position: google.maps.ControlPosition.LEFT_CENTER
      },
      mapTypeControlOptions: {
          style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: google.maps.ControlPosition.BOTTOM_CENTER
      },
      zoomControlOptions: {
          position: google.maps.ControlPosition.LEFT_CENTER
      },
    };
    
    map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    
    var newPlace = document.getElementById("newPlace");
    var autocomplete = new google.maps.places.Autocomplete(newPlace);
    var autowindow = new google.maps.InfoWindow();
    google.maps.event.addListener(autocomplete, 'place_changed', function(){
      autowindow.close();
      var place = autocomplete.getPlace();
      if(!place.geometry){
        return;
      }
      createMarkerPlace(place.geometry.location);
      if(place.geometry.viewport){
        map.fitBounds(place.geometry.viewport);
      }else{
        map.setCenter(place.geometry.location);
        map.setZoom(17);
      }
      var address = '';
      if (place.address_components) {
        address = [
          (place.address_components[0] && place.address_components[0].short_name || ''),
          (place.address_components[1] && place.address_components[1].short_name || ''),
          (place.address_components[2] && place.address_components[2].short_name || '')
          ].join(' ');
      }
      autowindow.setContent('<div><strong>' + place.name + '</strong><br>' + address);
    })
  }

  function createMarkerPlace(place){
    var marker = new google.maps.Marker({
      position:place
    });
    marker.setMap(map);
  }


  Template.map.helpers({
    init : function() {
      google.maps.event.addDomListener(window, 'load', initialize);
      return '';
    }
  })

  Template.create.events({

  })
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
