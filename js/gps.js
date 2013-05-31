var gps = gps || {};


(function(o){


  o.lat = null
  o.lng = null
  var gps_timer = null

  var arr_lat = [];//pole s posledními souøadnicemi - budu ukazovat prùmìr z nìkolika mìøení
  var arr_lng = [];
  var callback = null;
  var stav_sledovani = null;
  
  o.start = function(interval, fce,stav){
    //alert("GPS modul start");
    callback = fce
    stav_sledovani = stav
    gps_timer = window.setInterval(o.gps_souradnice,interval);
  }

  o.konec = function(){//zastavení sledování GPS souøadnic
    if(gps_timer != null)
    {
      window.clearInterval(gps_timer)
      gps_timer = null
    }
  }

  o.gps_souradnice = function(){
    //zjisteni gps souradnic
    //po zjisteni zavola fci ktere souradnice preda
    //clog("XXXXX " + stav_sledovani)
    var tmp;
    var sum_lat; var sum_lng;
    //alert("navigator.geolocation "+ navigator.geolocation);
    navigator.geolocation.getCurrentPosition(gps_ok, gps_ko,{ maximumAge: 3000, timeout: 5000, enableHighAccuracy: true });           
    function gps_ok(position){
      //alert("gps_ok " + position.coords.latitude)
      arr_lat.push(position.coords.latitude)
      arr_lng.push(position.coords.longitude)
      if(arr_lat.length > 3)
      {
        tmp = arr_lat.shift()
        tmp = arr_lng.shift()
      }
      sum_lat = 0;
      sum_lng = 0;
      for(var i=0; i<arr_lat.length;i++)
      {
        sum_lat += arr_lat[i];
        sum_lng += arr_lng[i];
      } 
      //alert("lat " + position.coords.longitude)
      var params = {"lat": sum_lat/arr_lat.length , "lng": sum_lng/arr_lng.length };
      callback(params);
    }
    function gps_ko(error){
      //alert("GPS KO ");// + error.message)// + error.message);
      callback({"lat": null , "lng": null});
    }  
  }




})(gps);
