ShareStuffDB = new Mongo.Collection("stuff");

if (Meteor.isClient) {
  // counter starts at 0
  pos = 41.8263;
  var lat;
  var lng;
  var image;
  var pos;
  Session.setDefault("uploading", false);
  Session.set('uploading-image', false);

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
    
    if(navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      pos = new google.maps.LatLng(position.coords.latitude,
                                       position.coords.longitude);

      var marker = new google.maps.Marker({
        map: map,
        position: pos,
        title: "Current location"
      });
      infowindow = new google.maps.InfoWindow();
      google.maps.event.addListener(marker, 'click', function(){
        infowindow.setContent("Current location");
        infowindow.open(map, this);
      });
      setTimeout(function(){infowindow.setContent("Current location");
      infowindow.open(map, marker);}, 200);


      map.setCenter(pos);
    }, function() {
      handleNoGeolocation(true);
    });
  } else {
    // Browser doesn't support Geolocation
    handleNoGeolocation(false);
  }
}

function handleNoGeolocation(errorFlag) {
  if (errorFlag) {
    var content = 'Error: The Geolocation service failed.';
  } else {
    var content = 'Error: Your browser doesn\'t support geolocation.';
  }

  var options = {
    map: map,
    position: new google.maps.LatLng(60, 105),
    content: content
  };

  var infowindow = new google.maps.InfoWindow(options);
  map.setCenter(options.position);

  }

  function createMarkerPlace(place){
    var marker = new google.maps.Marker({
      position:place
    });
    marker.setMap(map);
  }



  function createUploadItem() {
    console.log("inside createUploadItem");
    var description = document.getElementById("description-of-item").value;
    var name = document.getElementById("name-of-item").value;
    var output = document.getElementById('output');
    var deposit = document.getElementById('deposit-for-item').value;
    var duration = document.getElementById('duration').value;
    var imgData = getBase64Image(output);
    var item  = {
        description: description, 
        name:  name,
        img: imgData,
        deposit: deposit,
        duration:duration,
        latitude: lat,
        longitude: lng
      }
    return item;

  }

  // Handling Image Upload and Storage
  function getBase64Image(img) {
    console.log("inside getImage");
    // Create an empty canvas element
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    // Copy the image contents to the canvas
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    // Get the data-URL formatted image
    var dataURL = canvas.toDataURL("image/png");

    return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
  }

  // Detects image change and displays the given image
  Template.uploadItem.events({
    "change #image-of-item" : function(event) {

      Session.set('uploading-image', true);

      var input = event.target;
      reader = new FileReader();
      reader.onload = function() {

        var dataURL = reader.result;
        var output = document.getElementById('output');
        output.src = dataURL

        //image = reader.result;
        //bannerImage = document.getElementById('bannerImg');

        /*
        var output = document.getElementById('output');
        imgData = getBase64Image(output);
        localStorage.setItem("imgData", imgData);
        */
        /*
        var dataImage = localStorage.getItem('imgData');
        bannerImg = document.getElementById('tableBanner');
        bannerImg.src = "data:image/png;base64," + dataImage;
        */

        Session.set('uploading-image', false);

      }
      reader.readAsDataURL(event.target.files[0]);
    }
  }) 


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
      document.getElementById('upload-new-item').style.display='none';
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
      Session.set('uploading', false);
      var newListing = createUploadItem();
      console.log("calling uploadItem");
      Meteor.call("uploadItem", newListing);
      Meteor.flush();

      return false;
    },
    "click #cancel-item" : function(){
      Session.set("uploading", false);
      document.getElementById("upload-new-item").style.display='inline';
    }
  })

  Template.nearby.events({
    "click #explore" : function(){
      if(pos != null && pos != undefined){
        console.log("pos_lat");
        console.log(pos.lat());
        var nearbyThings = Meteor.call("nearbyListings", pos.lat(), pos.lng());
        console.log(nearbyThings);
      }else{
        //error message saying location services disabled
      }
      
    }
  })
}

if (Meteor.isServer) {
  Meteor.startup(function () {

  });
}


Meteor.methods({
  uploadItem: function(item) {
    if (! Meteor.userId()) {
      throw new Meteor.Error("not-authorize");
    }
    if (item.name == '' || !item.latitude || !item.longitude) {
      throw new Meteor.Error("invalid-data");
    }
    ShareStuffDB.insert({
      description: item.description,
      name: item.name,
      lat: item.latitude,
      lng: item.longitude,
      img: item.img,
      duration:item.duration,
      deposit: item.deposit,
      createdAt: new Date(),
      owner: Meteor.userId(),
      username: Meteor.user().username,
    });

  },


  getUsersListings: function(username) {
    return ShareStuffDB.find({
      username: username
    });
  },

  nearbyListings: function(target_lat, target_lng) {
    console.log("target_lat");
    console.log(target_lat);
    console.log("target_lng");
    console.log(target_lng);
    var lat_error = .01;
    var lng_error = .01;
    return ShareStuffDB.find({ 
      $and: [
          { $and: [
            {lat: {$gt: target_lat - lat_error}}, 
            {lat: {$lt: target_lat + lat_error}}
            ]},
          { $and: [
              {lng: {$gt: target_lng - lng_error}}, 
              {lng: {$lt: target_lng + lng_error}}
              ]}
          ]
      });
  },

  textSearchListings: function(searchString) {
    return ShareStuffDB.runCommand("text", { search: searchString});
  }

})
