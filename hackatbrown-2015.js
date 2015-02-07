ShareStuffDB = new Mongo.Collection("stuff");

if (Meteor.isClient) {
  // counter starts at 0
  Session.setDefault("uploading", false);

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

  function createMarkerPlace(place){
    var marker = new google.maps.Marker({
      position:place
    });
    marker.setMap(map);
  }

  function createUploadItem() {
    var description;
    var image;
    var name;
    var location;
    var item  = {
      description: description, 
      image: image,
      name:  name,
      loc: location,
    }
    return item;
  }

  Template.sidebar.helpers({
    uploading : function() {
      console.log(Session.get('uploading'));
      return Session.get('uploading');
    }
  })


  Template.map.helpers({
    init : function() {
      google.maps.event.addDomListener(window, 'load', initialize);
      return '';
    },
  })

  Template.sidebar.events({
    "click #upload-new-item" : function() {
      Session.set('uploading', true);
      Meteor.flush();
      var newPlace = document.getElementById("location-of-item");
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
      return false;
    }
  })

  Template.create.events({

  })

  Template.uploadItem.helpers({

  })

  Template.uploadItem.events({
    "click #upload-item" : function() {
      Session.set('uploading', false);

      console.log(document.getElementById("image-of-item").value);

      var newListing = createUploadItem();
      Meteor.call("uploadItem", newListing);

      return false;
    },
    "submit form" : function(event, template){
      var file = template.find('input type=["file"]').files[0];
      var reader = new FileReader();
      reader.onload = function(e) {
        model.update(id, {$set : {src: e.target.result}})
      }
    }
  })
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
}


Meteor.methods({
  uploadItem: function(item) {
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorize");
    }
    return false;
    ShareStuffDB.insert({
      description: item.description,
      image: item.image,
      name: item.name,
      location: item.loc,
      createdAt: new Data(),
      owner: Meteor.userId(),
      username: Meteor.user().username,
    });
  },


})
