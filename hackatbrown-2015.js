if (Meteor.isClient) {
  // counter starts at 0

  function initialize(){
    
    var mapOptions = {
      center: new google.maps.LatLng(42.3581, -71.0636),
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
    var map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
  }

  Session.setDefault('counter', 0);

  Template.hello.helpers({
    counter: function () {
      return Session.get('counter');
    }
  });

  Template.hello.events({
    'click button': function () {
      // increment the counter when button is clicked
      Session.set('counter', Session.get('counter') + 1);
    }
  });


  Template.map.helpers({
    init : function() {
      google.maps.event.addDomListener(window, 'load', initialize);
      return '';
    }
  })
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}
