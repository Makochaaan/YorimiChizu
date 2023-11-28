var myMap;
var directionsRenderer;
var directionsService = new google.maps.DirectionsService();
var departure = [];
var destination = [];
var relaypoint = [];
var infowindow = [];
var types = [];
var genres;
var dep_lat;
var dep_lon;
var des_lat;
var des_lon;
var search_count = 0;
const search_limit = 5;
// const SERVER_URL = "https://yorimitizu.herokuapp.com";
const SERVER_URL = "http://127.0.0.1:8000";

//ルートの計算
async function reRender() {
  search_count += 1;
  if (infowindow.length >= 1) {
    infowindow.shift().close();
  }
  if (departure.length != 1 || destination.length != 1) {
      alert("出発地・目的地を適切に入力してください");
      return;
  }
  document.getElementById("load_scene").style.display = "block";
  
  var pos1 = departure[0].getPosition();
  var pos2 = destination[0].getPosition();
  dep_lat = pos1.lat();
  dep_lon = pos1.lng();
  des_lat = pos2.lat();
  des_lon = pos2.lng();

  var typesURL = "";
  for (let n = 0; n < types.length; n++) {
    typesURL += types[n]; 
    if (n != types.length-1) {typesURL += ","}
  }
  sessionStorage.setItem("ids","restaurant,cafe,store,spa,book_store,art_gallery,museum,bar,clothing_store,convenience_store,drugstore,pharmacy,gym,home_goods_store,movie_theater,post_office,zoo");
  sessionStorage.setItem("types",typesURL);

  var res = await fetch(
    new URL(
      `${SERVER_URL}/relaypoint/${dep_lat}/${dep_lon}/${des_lat}/${des_lon}/types=${typesURL}`
    )
  );
  var data = await res.json();
  var rel_lat = data.rel_lat;
  var rel_lon = data.rel_lon;
  var rel_place = data.rel_place;
  var rel_type = data.rel_type;
  var myTravelMode;
  switch (document.getElementById("TravelMode").value){
    case "DRIVING":
      myTravelMode = google.maps.DirectionsTravelMode.DRIVING;
    case "WALKING":
      myTravelMode = google.maps.DirectionsTravelMode.WALKING;
    case "TRANSIT":
      myTravelMode = google.maps.DirectionsTravelMode.TRANSIT;
    case "BICYCLING":
      myTravelMode = google.maps.DirectionsTravelMode.BICYCLING;
  }
  directionsService.route(
    {
      origin: departure[0].getPosition(),
      destination: destination[0].getPosition(),
      waypoints: [
        {
          location: new google.maps.LatLng(rel_lat, rel_lon),
          stopover: false,
        },
      ],
      travelMode: myTravelMode,
    },
    function (result, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        search_count = 0;
        directionsRenderer.setDirections(result);
        document.getElementById("journey").value =
          result.routes[0].legs[0].distance.value >= 1000
            ? result.routes[0].legs[0].distance.value / 1000 + "km"
            : result.routes[0].legs[0].distance.value + "m";
        if (relaypoint.length == 1) {
          relaypoint.shift().setMap(null);
        }
        var neoMarker = new google.maps.Marker({
          position: new google.maps.LatLng(rel_lat, rel_lon),
          map: myMap,
          draggable: false,
        });
        neoMarker.setMap(myMap);
        myMap.setCenter(new google.maps.LatLng(rel_lat, rel_lon));
        relaypoint.push(neoMarker);
        if (rel_place != "") {
          var url = `https://www.google.co.jp/maps/place?ll=${rel_lat},${rel_lon}&q=${encodeURI(
            rel_place
          )}&z=15`;
          // var contentStr =
          //   `<h2> ${rel_place} </h2>` + "<br>" +
          //   "<p>" +
          //   `<a href=${url} target="_blank" rel="noopener noreferrer">Googleマップで詳細を見る</a>` +
          //   "</p>";

          var contentStr = '<div id="content">' +
          '<div id="siteNotice">' +
          "</div>" +
          `<h3 id="firstHeading" class="firstHeading">${rel_place}</h3>` +
          '<div id="bodyContent">' +
          `<p><b>ジャンル: ${rel_type}</b></p>` +
          `<p><b><a href=${url} target="_blank" rel="noopener noreferrer">Googleマップで詳細を見る</a></b>`
          "Heritage Site.</p>" +
          '<p>Attribution: Uluru, <a href="https://en.wikipedia.org/w/index.php?title=Uluru&oldid=297882194">' +
          "https://en.wikipedia.org/w/index.php?title=Uluru</a> " +
          "(last visited June 22, 2009).</p>" +
          "</div>" +
          "</div>";
          var info = new google.maps.InfoWindow({
            content: contentStr,
            position: new google.maps.LatLng(rel_lat, rel_lon),
          });
          infowindow.push(info);
          info.open({ anchor: relaypoint[0], myMap, shouldFocus: false });
        }
      } else if (search_count < search_limit) {
        reRender();
      }
      // 結果は返ってくるがルートの検索ができない場合 
      else if (status == google.maps.DirectionsStatus.ZERO_RESULTS) {
        try{
          search_count = 0;
          // document.getElementById("journey").value =
          //   result.routes[0].legs[0].distance.value >= 1000
          //     ? result.routes[0].legs[0].distance.value / 1000 + "km"
          //     : result.routes[0].legs[0].distance.value + "m";
          if (relaypoint.length == 1) {
            relaypoint.shift().setMap(null);
          }
          var neoMarker = new google.maps.Marker({
            position: new google.maps.LatLng(rel_lat, rel_lon),
            map: myMap,
            draggable: false,
          });
          neoMarker.setMap(myMap);
          myMap.setCenter(new google.maps.LatLng(rel_lat, rel_lon));
          relaypoint.push(neoMarker);
          if (rel_place != "") {
            var url = `https://www.google.co.jp/maps/place?ll=${rel_lat},${rel_lon}&q=${encodeURI(
              rel_place
            )}&z=15`;
            var contentStr =
              `${rel_place}` +
              "<p>" +
              `<a href=${url} target="_blank" rel="noopener noreferrer">Googleマップで見る</a>` +
              "</p>";
            var info = new google.maps.InfoWindow({
              content: contentStr,
              position: new google.maps.LatLng(rel_lat, rel_lon),
            });
            infowindow.push(info);
            info.open({ anchor: relaypoint[0], myMap, shouldFocus: false });
          }
        } catch {
          search_count = 0;
          alert("ルート検索できませんでした");
        }
      } 
      // 結果も返ってこない場合
      else {
        search_count = 0;
        alert("ルート検索できませんでした");
      }
      document.getElementById("load_scene").style.display = "none";
      
    }
  );
  var d = Math.round(
    google.maps.geometry.spherical.computeDistanceBetween(
      departure[0].getPosition(),
      destination[0].getPosition()
    )
  );

  document.getElementById("distance").value =
    d >= 1000 ? d / 1000 + "km" : d + "m";
}

//目的地のマーカーをつける
function desMarker() {
  var neoMarker = new google.maps.Marker({
    position: arguments[0],
    map: myMap,
    draggable: true,
  });
  neoMarker.setMap(myMap);
  google.maps.event.addListener(neoMarker, "dragend", function (mouseEvent) {
    // reRender();
  });
  destination.push(neoMarker);
  if (destination.length == 0) {
    return;
  } else if (destination.length == 2) {
    destination.shift().setMap(null);
  }
  // reRender();
}
//出発地点のマーカーをつける
function depMarker() {
  var neoMarker = new google.maps.Marker({
    position: arguments[0],
    map: myMap,
    draggable: true,
  });
  neoMarker.setMap(myMap);
  google.maps.event.addListener(neoMarker, "dragend", function (mouseEvent) {
    // reRender();
  });
  departure.push(neoMarker);
  if (departure.length == 0) {
    return;
  } else if (departure.length == 2) {
    myMap.setCenter(new google.maps.LatLng(arguments[0]));
    departure.shift().setMap(null);
  }
  // reRender();
}
//出発地点の入力
function initialize() {
  var inputDeparture = document.getElementById("departure");
  var autocompleteDeparture = new google.maps.places.Autocomplete(
    inputDeparture
  );
  google.maps.event.addListener(
    autocompleteDeparture,
    "place_changed",
    function () {
      var placeDeparture = autocompleteDeparture.getPlace();
      document.getElementById("departure").value = placeDeparture.name;
      depMarker(placeDeparture.geometry.location);
      
    }
  );
}
google.maps.event.addDomListener(window, "load", initialize);

// 出発地の入力(現在地)
function initialize1_1() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        document.getElementById("departure").value = "現在地";
        depMarker(pos);
      },
      () => {
        handleLocationError(true, infoWindow, myMap.getCenter());
      }
    );
  } else {
    // Browser doesn't support Geolocation
    handleLocationError(false, infoWindow, myMap.getCenter());
  }
}

//目的地の入力
function initialize2() {
  var inputArrival = document.getElementById("arrival");
  var autocompleteArrival = new google.maps.places.Autocomplete(inputArrival);
  google.maps.event.addListener(
    autocompleteArrival,
    "place_changed",
    function () {
      var placeArrival = autocompleteArrival.getPlace();
      desMarker(placeArrival.geometry.location);
      document.getElementById("arrival").value = placeArrival.name;
    }
  );
}

google.maps.event.addDomListener(window, "load", initialize2);

// チェックボックス入力情報の保持
window.addEventListener('load', function () {
  if (sessionStorage.getItem("types")!=null) {
    if (sessionStorage.getItem("types").length ==0) {}
    else {
      ids = sessionStorage.getItem("ids").split(",");
      temp = sessionStorage.getItem("types").split(",");
      nonChecked = ids.filter(i => temp.indexOf(i) == -1)
      console.log(nonChecked);
      for (let n; n<nonChecked.length; n++) {
        document.getElementById(`${nonChecked[n]}`).checked = "";
      }
    }
  }
});


//ページ表示後に行なわれるやつ
$(document).ready(function () {

  // Typesの初期化
  genres = document.getElementsByClassName('genres');
  for (i=0; i<genres.length; i++) {
    types.push(genres[i].value);
  }

  var param = new Array();
  var a = window.location.search.substring(1);
  var b = a.split("&");
  var mm = new Array();
  for (var i in b) {
    var vals = new Array(2);
    vals = b[i].split("=", 2);
    if (vals[0] == "m") {
      if (vals[1].match(/^(-?\d+\.?\d*),(-?\d+\.?\d*)$/)) {
        mm.push(new google.maps.LatLng(RegExp.$1, RegExp.$2, true));
      }
    }
    param[vals[0]] = vals[1];
  }
  delete b;
  delete a;
  var opts = {
    zoom: "z" in param && parseInt(param["z"]) >= 0 ? parseInt(param["z"]) : 15,
    center:
      "c" in param && param["c"].match(/^(-?\d+\.?\d*),(-?\d+\.?\d*)$/)
        ? (mapCenter = new google.maps.LatLng(RegExp.$1, RegExp.$2, true))
        : new google.maps.LatLng(35.68, 139.7),
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    mapTypeControl: true,
    scaleControl: true,
    navigationControlOptions: true,
    gestureHandling: "greedy",
    disableDoubleClickZoom: true,
    scrollwheel: false,
    zIndex: 0,
  };
  myMap = new google.maps.Map(document.getElementById("map_canvas"), opts);
  infoWindow = new google.maps.InfoWindow();
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        infoWindow.open(myMap);
        myMap.setCenter(pos);

        depMarker(pos);
      },
      () => {
        handleLocationError(true, infoWindow, myMap.getCenter());
      }
    );
  } else {
    // Browser doesn't support Geolocation
    handleLocationError(false, infoWindow, myMap.getCenter());
  }

  for (var i in mm) {
    desMarker(mm[i]);
  }
  delete mm;
  // クリックでマーカー設置
  google.maps.event.addListener(myMap, "click", function (mouseEvent) {
    desMarker(mouseEvent.latLng);
  });
  directionsRenderer = new google.maps.DirectionsRenderer({
    map: myMap,
    suppressMarkers: true,
  });
  document.getElementById("journey").disabled = true;
  document.getElementById("distance").disabled = true;

});

// 詳細設定の取得
window.onload = function() {

  var id = [];
  for (i=0; i<genres.length; i++){
    id.push(genres[i].id);
  }
  id.forEach(function(id) {
    document.getElementById(id).addEventListener("change", function() {
      
      if (document.getElementById(id).checked) {
        types.push(document.getElementById(id).value);
        
      } else {
        if (types.includes(document.getElementById(id).value)) {
          types.splice(types.indexOf(document.getElementById(id).value),1);
        }
      }
    });
  });
}  



function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(
    browserHasGeolocation
      ? "Error: The Geolocation service failed."
      : "Error: Your browser doesn't support geolocation."
  );
  infoWindow.open(myMap);
}
