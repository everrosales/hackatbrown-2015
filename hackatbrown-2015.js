ShareStuffDB = new Mongo.Collection("stuff");

if (Meteor.isClient) {
  // counter starts at 0
  pos = 41.8263;
  var lat;
  var lng;
  var image;
  var pos;
  var itemAddress;
  var nearbyThings = [];
  Session.setDefault("uploading", false);
  Session.setDefault("gotPos", false);
  Session.set('uploading-image', false);

  function clearInnerHTML(id){
    document.getElementById(id).innerHTML = "";
  }
  function sleep(delay) {
      var start = new Date().getTime();
      while (new Date().getTime() < start + delay);
    }
  function nearbyListings(target_lat, target_lng) {
    var lat_error = .1;
    var lng_error = .1;
    results = ShareStuffDB.find({ 
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
    //console.log(results);
    resultsArray = [];
    results.collection._docs.forEach(function(elt) {
      resultsArray.push(elt);
    });
    return resultsArray;
  }

  function initialize(){
    console.log("inside initialize");
    
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
      Session.set("gotPos", true);
      Meteor.flush();
      console.log("set gotPos to true");

      console.log("inside items")
      function nearbyListings(target_lat, target_lng) {
        var lat_error = .1;
        var lng_error = .1;
        results = ShareStuffDB.find({ 
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
        //console.log(results);
        resultsArray = [];
        results.collection._docs.forEach(function(elt) {
          resultsArray.push(elt);
        });
        return resultsArray;
      }

      if(pos != null && pos != undefined){
        
        nearbyThings = nearbyListings(pos.lat(), pos.lng());
        var list = document.getElementById('itemList');
        clearInnerHTML('itemList');
        for(var i=0; i<nearbyThings.length; i++){
          var item = nearbyThings[i];
          console.log("item");
          console.log(item);
          list.insertAdjacentHTML('beforeend','<div>name: '+item.name+' address: ' +item.address+' duration: ' +item.duration+
            ' deposit: ' + item.deposit+ ' descrip: ' + item.description+ '</div>')

        }
        
      }else{
        //error message saying location services disabled
      }
      
    

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

  function createItemMarker(itemInfo){
    var des = itemInfo.description;
    var name = itemInfo.name;
    var deposit = itemInfo.deposit;
    var img = itemInfo.img;
    var duration= itemInfo.duration;
    var address = itemInfo.address;
    var loc = google.maps.LatLng(itemInfo.latitude, itemInfo.longitude);

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
        address:itemAddress,
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

  Template.searchSidebar.events({
    "click #searchSidebar" : function() {
      console.log("click");
      var bar = document.getElementById('searchSidebar');
      var barMargin = bar.style.marginRight.replace("px","");

      if (barMargin == "-200" || barMargin == "") {
        bar.style.marginRight = "0px";
      } else {
        bar.style.marginRight = "-200px";
      }
    }
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
        itemAddress = newPlace.value;
        console.log("itemAddress: " + itemAddress);
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
    },

    "click #sidebar" : function() {
      console.log("click");
      var bar = document.getElementById('sidebar');
      var barMargin = bar.style.marginLeft.replace("px","");
      if (barMargin == "-200" || barMargin == "") {
        bar.style.marginLeft = "0px";
      } else {
        bar.style.marginLeft = "-200px";
      }
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
      console.log("newListing");
      console.log(newListing);
      
      console.log("calling uploadItem");
      Meteor.call("uploadItem", newListing);
      Meteor.flush();
      setTimeout(function(){
        function nearbyListings(target_lat, target_lng) {
        var lat_error = .1;
        var lng_error = .1;
        results = ShareStuffDB.find({ 
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
        //console.log(results);
        resultsArray = [];
        results.collection._docs.forEach(function(elt) {
          resultsArray.push(elt);
        });
        return resultsArray;
      }

      if(pos != null && pos != undefined){
        
        nearbyThings = nearbyListings(pos.lat(), pos.lng());
        var list = document.getElementById('itemList');
        clearInnerHTML('itemList');
        for(var i=0; i<nearbyThings.length; i++){
          var item = nearbyThings[i];
          console.log("item");
          console.log(item);
          list.insertAdjacentHTML('beforeend','<div>name: '+item.name+' address: ' +item.address+' duration: ' +item.duration+
            ' deposit: ' + item.deposit+ ' descrip: ' + item.description+ '</div>')

        }
        
      }else{
        //error message saying location services disabled
      }
    }, 100);

      return false;
    },
    "click #cancel-item" : function(){
      Session.set("uploading", false);
      document.getElementById("upload-new-item").style.display='inline';
    }
  })

  Template.nearby.events({


    "click #explore" : function(){
      Session.set("exploring", true);
      function nearbyListings(target_lat, target_lng) {
        var lat_error = .1;
        var lng_error = .1;
        results = ShareStuffDB.find({ 
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
        //console.log(results);
        resultsArray = [];
        results.collection._docs.forEach(function(elt) {
          resultsArray.push(elt);
        });
        return resultsArray;
      }

      if(pos != null && pos != undefined){
        
        nearbyThings = nearbyListings( pos.lat(), pos.lng());
        console.log(nearbyThings);
        var list = document.getElementById('nearbyThings');
        /*for(var i=0; i<nearbyThings.length; i++){
          var item = nearbyThings[i];
          list.insertAdjacentHTML('beforeend','<div>name: '+item.name+ ' duration: ' +item.duration+
            ' deposit: ' + item.deposit+ ' descrip: ' + item.description+ '</div>')

        }*/
        Session.set("nearbyThings", nearbyThings);
        console.log("new nearbythings");
        console.log(Session.get("nearbyThings"));
        Meteor.flush();


      }else{
        //error message saying location services disabled
      }
      
    },
    
  })
  Template.nearby.helpers({
    items: 
      Session.get("nearbyThings")

    
  })

  Template.searchSidebar.helpers({
    items: function(){
      console.log("inside items")
      function nearbyListings(target_lat, target_lng) {
        var lat_error = .1;
        var lng_error = .1;
        results = ShareStuffDB.find({ 
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
        //console.log(results);
        resultsArray = [];
        results.collection._docs.forEach(function(elt) {
          resultsArray.push(elt);
        });
        return resultsArray;
      }

      if(pos != null && pos != undefined){
        
        nearbyThings = nearbyListings(pos.lat(), pos.lng());
        return nearbyThings;
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
      address:item.address,
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

  



/*
find({ 
      $and: [
          { $and: [
            {lat: {$gt: 41.8262211 - .1}}, 
            {lat: {$lt: 41.8262211 + .1}}
            ]},
          { $and: [
              {lng: {$gt: -71.40254190000002 - .1}}, 
              {lng: {$lt: -71.40254190000002 + .1}}
              ]}
          ]
      })
*/

  textSearchListings: function(searchString) {
    return ShareStuffDB.runCommand("text", { search: searchString});
  }

})
