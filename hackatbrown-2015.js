ShareStuffDB = new Mongo.Collection("stuff");

if (Meteor.isClient) {
  // counter starts at 0
  var lat;
  var lng;
  var image;
  Session.setDefault("uploading", false);
  Session.set('uploading-image', true);

  function initialize(){
    
    var mapOptions = {
      center: new google.maps.LatLng(41.82681380, -71.40298949),
      zoom: 8,
      streetViewControl: false,
      panControl: true,
      panControlOptions: {
        position: google.maps.ControlPosition.RIGHT_CENTER
      },
      mapTypeControlOptions: {
          style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: google.maps.ControlPosition.BOTTOM_CENTER
      },
      zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_CENTER
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
    var description = document.getElementById("description-of-item");
    var item  = {
        description: description, 
        image: image,
        name:  name,
        latitude: lat,
        longitude: lng
      }
    var name = document.getElementById("name-of-item");

    return item;
  }

  function readFile(event) {
      Session.set('uploading-image', false);
      reader = new FileReader();
      reader.onload = function() {
        image = reader.result;
        Session.set('uploading-image', true);
      }
      reader.readAsDataURL(event.target.files[0]);
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
        lat = place.geometry.location.lat();
        lng = place.geometry.location.lng();
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

  Template.uploadItem.helpers({
    uploadingImage: function() {
      return Session.get('uploading-image');
    },

  })

  Template.uploadItem.events({
    "click #upload-item" : function() {
      //Session.set('uploading', false);

      console.log(document.getElementById("image-of-item").value);
      var newListing = createUploadItem();
      Meteor.call("uploadItem", newListing);

      return false;
    },

    /*"submit form" : function(event, template){
      var file = template.find('input type=["file"]').files[0];
      var reader = new FileReader();
      reader.onload = function(e) {
        model.update(id, {$set : {src: e.target.result}})
      }
    }*/
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
    if (item.name == '' || !item.lat || !item.lng) {
      throw new Meteor.Error("invalid-data");
    }
    ShareStuffDB.insert({
      description: item.description,
      image: item.image,
      name: item.name,
      lat: item.latitude,
      lng: item.longitude,
      createdAt: new Date(),
      owner: Meteor.userId(),
      username: Meteor.user().username,
    });
  },


  getUsersListings: function(username) {
    return ShareStuffDB.find({
      username: username
    });
  }



})
