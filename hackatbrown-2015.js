ShareStuffDB = new Mongo.Collection("stuff");
LentStuffDB = new Mongo.Collection("lent");

if (Meteor.isClient) {
  Meteor.subscribe("stuff");
  Meteor.subscribe("lent");
  var itemKey = {};

  pos = 41.8263;
  var curMarkers = [];
  var lat;
  var lng;
  var image;
  var pos;
  var itemAddress;
  var nearbyThings = [];
  Session.setDefault("uploading", false);
  Session.setDefault("gotPos", false);
  Session.setDefault('uploading-image', false);
  Session.setDefault('borrow-confirmation', false);
  Session.setDefault('borrow-item', null);
  Session.setDefault("returnActive", false);
  Session.setDefault("returnItem", null);
  function getAllInfo(itemInfo){
    var address = "N/A";
    if(itemInfo.address !="" && itemInfo.address!=null){
      address=itemInfo.address;
    }
    var duration = "N/A";
    if(itemInfo.duration !="" && itemInfo.duration!=null){
      duration=itemInfo.duration+" days";
    }
    var deposit = "N/A";
    if(itemInfo.deposit !="" && itemInfo.deposit!=null){
      deposit="$"+ itemInfo.deposit;
    }
    var username = "N/A";
    if(itemInfo.username !="" && itemInfo.username!=null){
      username=itemInfo.username;
    }
    var description = "N/A";
    if(itemInfo.description!="" && itemInfo.description!=null){
      description=itemInfo.description;
    }
    return {'address':address,'duration':duration,'deposit':deposit,'username':username,'description': description}
  }
  function findUserBorrowed() {
    results = LentStuffDB.find({/*userId: Meteor.userId()*/});
    resultsArray = [];
    results.collection._docs.forEach(function(elt) {
      resultsArray.push(elt);
    });
    resultsArray2 = [];
    for (var i = 0; i < resultsArray.length; i+= 1) {
      var item = resultsArray[i];

      if (item.borrowingUser == Meteor.userId()) {
        resultsArray2.push(item);
      }
    }
    return resultsArray2;
  }
  function findUserShared(){
    results = LentStuffDB.find({owner: Meteor.userId()});
    resultsArray = [];
    results.collection._docs.forEach(function(elt){
      resultsArray.push(elt);
    });
    resultsArray2=[];
    for(var i=0; i<resultsArray.length; i++){
      var item = resultsArray[i];
      console.log("item");
      console.log(item);
      if(item.username == Meteor.user().emails[0].address){
        resultsArray2.push(item);
      }
    }
    console.log("sharedList: ");
    console.log(resultsArray2);
    return resultsArray2;
  }
  function clearInnerHTML(id){
    document.getElementById(id).innerHTML = "";
  }
  function nearbyListings(target_lat, target_lng) {
    var lat_error = .1;
    var lng_error = .1;
    console.log("we're in listings");
    console.log(target_lat - lat_error);
    results = ShareStuffDB.find(/*{name: "Noah"}*/
          /*{ $and: [
            {lat: {$gt: target_lat - lat_error}}, 
            {lat: {$lt: target_lat + lat_error}},
            {lng: {$gt: target_lng - lng_error}}, 
            {lng: {$lt: target_lng + lng_error}},
            {name: "Noah"}
            ]}*/
          );
    console.log("did results");
    
    resultsArray = [];
    results.collection._docs.forEach(function(elt) {
      resultsArray.push(elt);
    });
    console.log(resultsArray);
    resultsArray2 = [];
    for (var i = 0; i < resultsArray.length; i+= 1) {
      item = resultsArray[i];
      console.log(item.lat);
      if (item.lat > target_lat - lat_error && item.lat < target_lat + lat_error &&
        item.lng > target_lng - lng_error && item.lng < target_lng + lng_error) {
        resultsArray2.push(item);
      }
    }
    console.log(resultsArray2);
    return resultsArray2;
  }

  function makeSidePanels(parentHTML, divClass, shareDBbool, sharedBool){
    console.log("id: " + Meteor.userId());
    console.log("going");
    if(pos != null && pos != undefined){
      console.log("pos is good");
      var itemList;
        if(shareDBbool){
          console.log("listings!");
          itemList = nearbyListings(pos.lat(), pos.lng());
        }else{
          if(sharedBool){
            console.log("shared!");
            itemList=findUserShared();
          }else{
            console.log("borrowed!");
            itemList = findUserBorrowed();
          }
        }//add else statement to put item list for different database
        var list = document.getElementById(parentHTML);
        clearInnerHTML(parentHTML);
        for(var i=0; i<itemList.length; i++){
          var item = itemList[i];
          if(shareDBbool){
            createItemMarker(item);
          }
          
          if(!(item in itemKey)){
            itemKey[item._id] = item;
          }
          console.log("item");
          console.log(item);
          var allInfo = getAllInfo(item);
          var dataImage = item.img;
          var src = "data:image/png;base64," + dataImage;
          list.insertAdjacentHTML('beforeend',
            '<div class=' +  divClass+' id='+item._id+' style="background:url(\''+ src + '\') no-repeat;background-size:100%"><strong>'+item.name+'</strong><br>Address: ' +allInfo['address']+'<br>Duration: ' +allInfo['duration']+
            '<br>Deposit: ' + allInfo['deposit'] + '<br>Description: ' + allInfo['description']+'<br>Owner: '+ allInfo['username']+'</div>');
          sidePanelToMarkerListener(item._id);
      }
    }else{
      //
    }
  }
  function sidePanelToMarkerListener(itemID){
    document.getElementById(itemID).addEventListener("click", function(){
      var markerMatch;
      allMarkersStill();
      for(var i=0; i<curMarkers.length; i++){
        if(curMarkers[i].data == this.id){
          markerMatch = curMarkers[i];
        }
      }
      if(markerMatch != null && markerMatch != undefined){
        markerMatch.setAnimation(google.maps.Animation.BOUNCE);
        infowindow.setContent(getWindowInfo(itemKey[this.id]));
        infowindow.open(map, markerMatch);
      }
    })
  }

  function getWindowInfo(itemInfo){
    var address = "";
    if(itemInfo.address!="" && itemInfo.address!=null && itemInfo.address!=undefined){
      address = " at " + itemInfo.address;
    }
    var name = itemInfo.name;
    return name + address;

  }
  function allMarkersStill(){
    for(var i=0; i<curMarkers.length; i++){
      curMarkers[i].setAnimation(null);
    }
  }
  function sleep(delay) {
      var start = new Date().getTime();
      while (new Date().getTime() < start + delay);
    }

  function initialize(){
    infowindow = new google.maps.InfoWindow();
    curMarkers = [];
    console.log("inside initialize");
    
    var mapOptions = {
      center: new google.maps.LatLng(41.82681380, -71.40298949),
      zoom: 8,
      streetViewControl: false,
      panControl: true,
      panControlOptions: {
        position: google.maps.ControlPosition.BOTTOM_CENTER
      },
      mapTypeControlOptions: {
          style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: google.maps.ControlPosition.BOTTOM_CENTER
      },
      zoomControlOptions: {
          position: google.maps.ControlPosition.BOTTOM_CENTER,
          style: google.maps.ZoomControlStyle.SMALL
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
      /*function nearbyListings(target_lat, target_lng) {
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
        //console.log("results are cool");
        //console.log(results);
        resultsArray = [];
        results.collection._docs.forEach(function(elt) {
          resultsArray.push(elt);
        });
        return resultsArray;
      }*/
      itemArray = nearbyListings(pos.lat(), pos.lng());
      makeSidePanels("itemList","itemListing", true, false);
        
      itemArray = findUserBorrowed();
      makeSidePanels("borrowed-items-list","itemBorrowed", false, false);
      makeSidePanels("shared-items-list","itemShared", false, true);
        
      if (Meteor.userId()) {
        makeSidePanels("shared-items-list","itemShared", false, true);
        function findUserBorrowed() {
          console.log("we're in borrowed");
          results = LentStuffDB.find({borrowingUser: Meteor.userId()});
          console.log("got some results");
          console.log(results);
          resultsArray = [];
          results.collection._docs.forEach(function(elt) {
            resultsArray.push(elt);
          });
          console.log("and my array:");
          console.log(resultsArray)
          return resultsArray;
        }
        var borrowThings = findUserBorrowed();
        console.log(borrowThings);
        var list = document.getElementById('borrowed-items-list');
        clearInnerHTML('borrowed-items-list');
        for(var i=0; i<borrowThings.length; i++){
          var item = borrowThings[i];
          createItemMarker(item);
          if(!(item in itemKey)) {
            itemKey[item._id] = item;
          }
          console.log("item");
          console.log(item);
          var dataImage = item.img;
          var src = "data:image/png;base64," + dataImage;
          list.insertAdjacentHTML('beforeend',
            '<div class="itemBorrowed" id='+item._id+' style="background:url(\''+ src + '\') no-repeat;background-size:100%">'+item.name+' address: ' +item.address+' duration: ' +item.duration+
            ' deposit: ' + item.deposit+ ' descrip: ' + item.description+ '</div>');
        }
      }

      var marker = new google.maps.Marker({
        map: map,
        position: pos,
        title: "Current location"
      });
      
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
    console.log("creating item marker");
    var des = itemInfo.description;
    var name = itemInfo.name;
    var deposit = itemInfo.deposit;
    var img = itemInfo.img;
    var duration= itemInfo.duration;
    var address = itemInfo.address;
    var loc = new google.maps.LatLng(itemInfo.lat, itemInfo.lng);

    var marker = new google.maps.Marker({
      position:loc,
      data:itemInfo._id
    });
    marker.setMap(map);
    curMarkers.push(marker);
    google.maps.event.addListener(marker, 'click', function(){
      infowindow.setContent(getWindowInfo(itemInfo));
      infowindow.open(map, this);
    })

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
    canvas.width = 200;
    canvas.height = 200;

    // Copy the image contents to the canvas
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Get the data-URL formatted image
    var dataURL = canvas.toDataURL("image/png");

    return dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
  }

  Template.bodyTemplate.helpers ({
    login: function() {
      return !Meteor.userId();
    },

    borrowActive: function() {
      return Session.get("borrow-confirmation");
    },

    returnActive: function() {
      return Session.get("returnActive");
    }
  })
  Template.splashTemplate.helpers ({
    startClick: function() {  
      setTimeout(function(){
        document.getElementById("login-buttons").click();
      }, 150);
      return "";
    }
  })

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
    },
    login: function() {
      return !Meteor.userId();
    },
    user: function(){
      return Meteor.user();
    },
    username: function(){
      return Meteor.user().username;
    },
    userId: function(){
      return Meteor.userId();
    },
    populatedBorrowed: function()  {
      itemArray = findUserBorrowed();
      makeSidePanels("borrowed-items-list","itemBorrowed", false, false);
      return "";
    },
    populatedShared: function(){
      makeSidePanels("shared-items-list","itemShared", false, true);
      return "";
    }
  })

  Template.searchSidebar.helpers({
    login: function() {
      return !Meteor.userId();
    }

  })


  Template.map.helpers({
    init : function() {
      google.maps.event.addDomListener(window, 'load', initialize);
      return '';
    },
    login: function() {
      return !Meteor.userId();
    }
  })

  Template.searchSidebar.events({
    "click #searchSidebarToggle" : function() {
      console.log("click");

      var bar = document.getElementById('searchSidebar');
      var barMargin = bar.style.marginRight.replace("px","");

      if (barMargin == "-200" || barMargin == "") {
        bar.style.marginRight = "0px";
        document.getElementById('rightIntro').style.right = "-400px";
      } else {
        bar.style.marginRight = "-200px";
        document.getElementById('rightIntro').style.right = "40px";
      }
    },
    "click #do-the-thing": function() {
      var searchString = document.getElementById('name-to-search').value;
      if(pos != null && pos != undefined){
      var itemList;
      itemList = nearbyListings(pos.lat(), pos.lng());
      resultsArray2 = [];
      for (var i = 0; i < resultsArray.length; i+= 1) {
        item = resultsArray[i];
        console.log(item.lat);
        if ((item.name.toLowerCase().indexOf(searchString.toLowerCase())> -1) || (item.description.toLowerCase().indexOf(searchString.toLowerCase()) > -1)) {
          resultsArray2.push(item);
        }
      }
      console.log(resultsArray2);
      var list = document.getElementById("itemList");
        clearInnerHTML("itemList");
        for(var i=0; i<resultsArray2.length; i++){
          var item = resultsArray2[i];
          createItemMarker(item);
          
          if(!(item in itemKey)){
            itemKey[item._id] = item;
          }
          console.log("item");
          console.log(item);
          var allInfo = getAllInfo(item);
          var dataImage = item.img;
          var src = "data:image/png;base64," + dataImage;
          list.insertAdjacentHTML('beforeend',
            '<div class=' +  "itemListing"+' id='+item._id+' style="background:url(\''+ src + '\') no-repeat;background-size:100%"><strong>'+item.name+'</strong><br>Address: ' +allInfo['address']+'<br>Duration: ' +allInfo['duration']+
            '<br>Deposit: ' + allInfo['deposit'] + '<br>Description: ' + allInfo['description']+'<br>Owner: '+ allInfo['username']+'</div>');
          sidePanelToMarkerListener(item._id);
      }
    }
    return "";
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

    "click #sidebarToggle" : function() {
      console.log("click");
      var bar = document.getElementById('sidebar');
      var barMargin = bar.style.marginLeft.replace("px","");
      if (barMargin == "-200" || barMargin == "") {
        bar.style.marginLeft = "0px";
        document.getElementById('leftIntro').style.left = "-400px";
      } else {
        bar.style.marginLeft = "-200px";
        document.getElementById('leftIntro').style.left = "40px";
      }
    },
    "click #borrowed-items-button": function() {
      document.getElementById("borrowed-tab").style.display = "block";
      document.getElementById("shared-tab").style.display = "none";
    },
    "click #shared-items-button": function() {
      document.getElementById("borrowed-tab").style.display = "none";
      document.getElementById("shared-tab").style.display = "block";
      makeSidePanels("shared-items-list", "itemShared", false, true);
    },

    "click .itemBorrowed": function(event) {
      console.log(event.target);
      var item = itemKey[event.target.id];
      Session.set("returnActive", true);
      Session.set("returnItem", item);

    }
  })

  Template.searchSidebar.events({
    "click #do-the-thing" : function() {
        console.log("doing the thing");
        function searchListings(searchString) {
          return ShareStuffDB.find({description: {$regex: searchString }});
        }
        var searchTerm = document.getElementById("name-to-search").value;
        searchTermReg = new RegExp(searchTerm, 'i');
        console.log("search term");
        console.log(searchTermReg);
        searchResults = searchListings(searchTermReg);
        var searchArray = [];
        searchResults.collection._docs.forEach(function(elt) {
          searchArray.push(elt);
        });
        console.log(searchArray);
        return searchArray;
    },

    "click .itemListing" : function(event) {
      id = event.target.id;
      console.log(id);
      item = itemKey[id];
      Session.set("borrow-confirmation", true);
      Session.set("borrow-item", item)
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
        curMarkers = [];
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
      itemArray = nearbyListings(pos.lat(), pos.lng());
      makeSidePanels("itemList","itemListing",  true, false);

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
        console.log("results are chill");
        console.log(results);
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

  Template.borrowConfirmation.helpers({
    itemName: function() {
      var item = Session.get("borrow-item");
      return item.name;
    },

    description: function() {
      var item = Session.get("borrow-item");
      return item.description
    },

    ownerName: function() {
      var item = Session.get("borrow-item");
      return item.username;
    },

    imgData : function() {
      var item = Session.get("borrow-item");
      return "data:image/png;base64," + item.img;
    }
  })

  Template.borrowConfirmation.events({
    "click #confirm-borrow" : function() {
      Session.set("borrow-confirmation", false);
      var item = Session.get("borrow-item");
      Meteor.call("borrowItem", item);
      for(var i=0; i<curMarkers.length;i++){
        if(curMarkers[i].data == item._id){
          curMarkers[i].setMap(null);
          curMarkers.splice(i, 1);
        }
      }

      makeSidePanels("itemList","itemListing",true, false);
      makeSidePanels("borrowed-items-list","itemBorrowed", false, false);
      makeSidePanels("shared-items-list","itemShared", false, true);

      Session.set("borrow-item", null);
    },

    "click #cancel-borrow":function() {
      Session.set("borrow-confirmation", false);
      Session.set("borrow-item", null);
    }
  })

  Template.returnItem.helpers({
    ownerEmail: function() {
      item = Session.get("returnItem");
      return item.username;
    },

    itemName: function() {
      item = Session.get("returnItem");
      return item.name;
    },
  })

  Template.returnItem.events({
    "click #success": function(event) {
      item = Session.get("returnItem");
      console.log("returned item");
      console.log(item);
      Meteor.call("returnItem", item._id);
      makeSidePanels("borrowed-items-list","itemBorrowed", false, false);
      Session.set("returnActive", false);
      Session.set("returnItem", null);

    },

    "click #cancel" : function(event) {
      Session.set("returnActive", false);
      Session.set("returnItem", null);

    }
  })

}

if (Meteor.isServer) {
  Meteor.publish("stuff", function() {
    return ShareStuffDB.find({});
  })

  Meteor.publish("lent", function() {
    return LentStuffDB.find({borrowingUser : this.userId})
  })

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
      username: Meteor.user().emails[0].address,
    });
  },

  borrowItem: function(item) {
    LentStuffDB.insert({
        description: item.description,
        name: item.name,
        latitude: item.latitude,
        longitude: item.longitude,
        address: item.address,
        duration: item.duration,
        deposit: item.deposit,
        createdAt: item.createdAt,
        owner: item.owner,
        img: item.img,
        username: item.username,
        borrowingUser: Meteor.userId()
      })

      ShareStuffDB.remove(item._id);
  },

  returnItem: function(id) {
    console.log(id);
    LentStuffDB.remove(id);
  },

  getUsersListings: function(name) {
    return ShareStuffDB.find({
      username: name
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
