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
  }

  function createMarker(lat, lng){
    var marker = new google.maps.Marker({
      position: {lat:lat, lng:lng},
      map: map
    })
  }


  Template.map.helpers({
    init : function() {
      google.maps.event.addDomListener(window, 'load', initialize);
      return '';
    }
  })

  Template.create.events({
    "click #addMarker" : function(event){
      var lat = document.getElementById("lat").value;
      var lng = document.getElementById("lng").value;
    }
  })
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
