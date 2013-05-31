window.onload = zaloz_mapu//po načtení zavolej

var max_zoom = 20;
var min_zoom = 17;

L.CRS.Simple = L.Util.extend({}, L.CRS, {
    projection: L.Projection.LonLat,
    transformation: new L.Transformation(1, 0, 1, 0)
});

function zaloz_mapu(){
    //založení mapy - pokusy s kreslenou mapou památníku Terezín
    //zlobí to jak svině
    var map_attr = '';
    var opt = {
    
    crs: L.CRS.Simple
    };
    map = L.map('map', opt).setView([0, 0], max_zoom,true);
    L.tileLayer('pevnost/{z}/{x}_{y}.png', {maxZoom: max_zoom,minZoom: min_zoom}).addTo(map); //http://localhost/kamna_dlazdice/
    var southWest = map.unproject([0, 5457], map.getMaxZoom());
    var northEast = map.unproject([6500, 0], map.getMaxZoom());
    map.on("zoomend",vypis)
    //alert(southWest);
    map.setMaxBounds(new L.LatLngBounds(southWest, northEast));
    $("#log").html("current zoom " + map.getZoom() + "<br>");
}


function vypis(){
  $("#log").text("current zoom " + map.getZoom());         
}

