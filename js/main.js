var map;
var marks = [];
var placeMarks = [];
var markr;
var locs = [
    { id: 0, title: 'Shimla', location: { lat: 31.104605, lng: 77.173424 } },
    { id: 1, title: 'Kullu', location: { lat: 31.957851, lng: 77.109459 } },
    { id: 2, title: 'Manali', location: { lat: 32.2396, lng: 77.1887 } },
    { id: 3, title: 'Dharamsala', location: { lat: 32.22006, lng: 76.32013 } },
    { id: 4, title: 'Palampur', location: { lat: 32.1109, lng: 76.5363 } },
    { id: 5, title: 'Kangra', location: { lat: 32.0998, lng: 76.2691 } }
];

function getMarkerIcon(markercolor) {
    var markImage = new google.maps.MarkerImage('https://chart.googleapis.com/chart?chst=d_map_xpin_icon&chld=pin_star|home|' + markercolor + '|#000000',
        new google.maps.Size(21, 34),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(21, 34)

    );
    return markImage;
}



//initializing the map
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 13,
        center: {
            lat: 31.1048,
            lng: 77.1734
        }
    });
    setMarkers(map);
}

function setMarkers(map) {
    var lInfowindow = new google.maps.InfoWindow();
    var dIcon = getMarkerIcon('#FF0000');
    var highIcon = getMarkerIcon('#ffffff');
    var latlang = new google.maps.LatLngBounds();
    for (var k = 0; k < locs.length; k++) {
        var pos = locs[k].location;
        var title = locs[k].title;
        var markr = new google.maps.Marker({
            map: map,
            title: title,
            position: pos,
            id: k,
            animation: google.maps.Animation.DROP
        });
        marks.push(markr);
        markr.addListener('click', markClick);
        markr.addListener('mouseover', markin);
        markr.addListener('mouseout', markout);
        latlang.extend(marks[k].position);
    }
    map.fitBounds(latlang);
    var sbox = new google.maps.places.SearchBox(document.getElementById('places-find'));
    sbox.setBounds(map.getBounds());
    sbox.addListener('places_changed', function() {
        sBoxPlaces(this);
    });
    //when marker is clicked
    function markClick() {
        console.log("Hello");
        popInfoWindow(this, lInfowindow);
        this.setAnimation(google.maps.Animation.BOUNCE);
        var p = this;
        setTimeout(function() {
            p.setAnimation(null);
        }, 3000);
    }
    //highlighted icon
    function markin() {
        this.setIcon(highIcon);
    }
    //hide marker
    function markout() {
        this.setIcon(null);
    }

}

//Create markers for places
function createMarks(places) {
    var latlang = new google.maps.LatLngBounds();
    for (var k = 0; k < places.length; k++) {
        var plac = places[k];
        var icon = {
            url: plac.icon,
            size: new google.maps.Size(35, 35),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(15, 34),
            scaledSize: new google.maps.Size(25, 25)
        };
        var markr = new google.maps.Marker({
            title: plac.name,
            icon: icon,
            map: map,
            id: plac.id,
            position: plac.geometry.location
        });
        placeMarks.push(markr);
        if (plac.geometry.viewport) {
            latlang.union(plac.geometry.viewport);
        } else {
            latlang.extend(plac.geometry.location);
        }
    }
    map.fitBounds(latlang);

}

//function to hide markers
function hideMarks(marks) {
    for (var i = 0; i < marks.length; i++) {
        marks[i].setMap(null);
    }
}

//error handling
function displayError() {
    window.alert("Oops Somethings Wrong");
}

//searchbox
function sBoxPlaces(sbox) {
    hideMarks(placeMarks);
    var places = sbox.getPlaces();
    createMarks(places);
    //error handling
    if (places.length === 0) {
        window.alert("Query not Found ...");
    }
}

//when a search is made by the client
function sboxMethod(value) {
    console.log(value);
    var latlang = map.getBounds();
    hideMarks(placeMarks);
    var pService = new google.maps.places.PlacesService(map);
    pService.textSearch({
            query: value,
            bounds: latlang
        },
        function(results, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                createMarks(results);
            } else {
                window.alert("Sorry try again");
            }
        }
    );
}


//funtion to fill infowindow with street view and wikipedia articles
function popInfoWindow(markr, infowindow) {
    var flag = true;
    //check the status if ok then get the streetview and set the panorama
    function getStreetView(data, status) {
        if (status == google.maps.StreetViewStatus.OK) {
            var nearStreetLoc = data.location.latLng;
            var head = google.maps.geometry.spherical.computeHeading(nearStreetLoc, markr.position);

            //handling the error
            var errorTout = setTimeout(function() {
                alert("Something went wrong");
            }, 9000);
            clearTimeout(errorTout);

            var panOptions = {
                position: nearStreetLoc,
                pov: {
                    heading: head,
                    // changes the angle of camera whether to look up or down
                    pitch: 15
                }
            };
            var pano = new google.maps.StreetViewPanorama(
                document.getElementById('pano'), panOptions
            );
        } else {
            flag = false;
        }
    }

    // ensure that  the infowindow is not already opened on this marker.
    if (infowindow.markr != markr) {
        // Clear  infowindow content to give the streetview time to load.
        infowindow.setContent('');
        infowindow.markr = markr;
        // check the marker property is cleared if the infowindow is closed.
        infowindow.addListener('closeclick', function() {
            if (infowindow.markr !== null)
                infowindow.markr.setAnimation(null);
            infowindow.markr = null;
        });

        var streetViewService = new google.maps.StreetViewService();
        var radii = 40;

        infowindow.open(map, markr);
        var wikiFlag = false;

        var wikiElem = '';

        // Use streetview service to fetch the streetview image withe the 40m radius of marker position
        streetViewService.getPanoramaByLocation(markr.position, radii, getStreetView);
        // open the infowindow on marker
        infowindow.open(map, markr);
        var wikiTout = setTimeout(function() {
            wikiElem = 'failed to get wikipedia resources';
        }, 8000);

        var wikiUrl = 'https://en.wikipedia.org/w/api.php?origin=*&action=opensearch&search=' +
            markr.title + '&format=json';

        $.ajax({
            url: wikiUrl,
            dataType: "jsonp",
            success: function(data) {
                wikiFlag = true;
                for (var i = 1; i < data.length; i++) {
                    var artList = data[i];
                    for (var j = 0; j < artList.length; j++) {
                        articlestr = artList[j];
                        if (articlestr.length > wikiElem.length) {
                            wikiElem = articlestr;
                        }
                    }
                }
                console.log(wikiElem);
                if (flag === false) {
                    infowindow.setContent(
                        '<div><h5 class=".h5" id="Title">' +
                        markr.title +
                        '</h5></div><div id="wiki-links" class="text-left text-info">' + wikiElem + '<p>' +
                        '</p></div><div id="pano"><span class="text-danger">No Street View Found</span></div>'
                    );
                } else {
                    infowindow.setContent(
                        '<div><h5 class=".h5" id="Title">' +
                        markr.title +
                        '</h5></div><div id="wiki-links" class="text-left text-info">' + wikiElem + '<p>' +
                        '</p></div><div id="pano">' + streetViewService.getPanoramaByLocation(markr.position, radii, getStreetView) +
                        '</div>'
                    );

                }
                clearTimeout(wikiTout);
            }
        }).fail(function(jqXHR, textStatus) {
            if (jqXHR.status === 0) {
                alert('No Internet Connection Detected!');
            } else if (jqXHR.status == 404) {
                alert('CALLBACK Error in Html Detected');
            } else alert("Failed to Resolve Request:" + textStatus + "\n");
        });
    }
}


//app model
//It will start executing when rest of our code is executed
var appViewModel = function() {
    function timeout(markr) {
        markr.setAnimation(null);
    }
    var self = this;
    this.placeList = ko.observableArray([]);
    for (var j = 0; j < locs.length; j++) {
        self.placeList.push(locs[j]);
    }
    for (var i = 0; i < locs.length; i++) {
        console.log(i);
        self.placeList()[i].markr = marks[i];
    }
    this.CurrentPlace = function(LocClicked) {
        var markr;
        for (var i = 0; i < self.placeList().length; i++) {
            var id = self.placeList()[i].id;
            if (LocClicked.id == id) {
                this.currentLocation = self.placeList()[i];
                markr = marks[self.placeList()[i].id];
            }
        }
        if (!markr) alert('Something went wrong!');
        else {
            markr.setAnimation(google.maps.Animation.BOUNCE);
            // when either the marker or location is selected open up the info window
            google.maps.event.trigger(markr, 'click');
        }
    };
    this.find = ko.observable('');
    this.TSearch = function(value) {
        console.log(value);
        sboxMethod(value);
    };

    this.foundLocation = ko.observable('');
    this.Filtr = function(value) {
        self.placeList.removeAll();
        for (var i = 0; i < locs.length; i++) {
            var searchQuery = locs[i].title.toLowerCase();
            // find the starting match in every location
            if (searchQuery.indexOf(value.toLowerCase()) >= 0) {
                self.placeList.push(locs[i]);
            }
        }
    };

    this.FilterMarkers = function(value) {
        for (var i in locs) {
            var temp = marks[i];
            if (temp.setMap(this.map) !== null) {
                temp.setMap(null);
            }
            var searchQuery = temp.title.toLowerCase();
            if (searchQuery.indexOf(value.toLowerCase()) >= 0) {
                temp.setMap(map);
            }
        }
    };
    this.foundLocation.subscribe(this.Filtr);
    this.foundLocation.subscribe(this.FilterMarkers);
    this.find.subscribe(this.TSearch);
};
//binding viewmodel
var m = new appViewModel();
ko.applyBindings(m);