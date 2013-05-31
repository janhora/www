    
    function start(){
      //mapa.start();
      //mapa.download();//zobrazení mapy a zároveò ukládá obrázky na disk
    return
      //                            50.5343828N, 14.1323575E
     
     var latlng = new L.LatLng(50.5335956, 14.1329292);
     //var latlng = new L.LatLng( 50.5343828,14.1323575);
      var map = L.map('map').setView(latlng, 17);//Litomìøice
      //var map = L.map('map').setView([-77.0396,38.9127,11], 12);
      //var map = L.map('map').setView([-96.3353,33.6734], 1);//road trip
      
      //L.TileLayer.MBTiles("a");

		L.tileLayer('http://localhost/kamna/assets/www/proxy.php?z={z}&x={x}&y={y}', {maxZoom: 18	}).addTo(map);

    return;
        

		//L.tileLayer('http://localhost/kamna/assets/www/proxy.php?z={z}&x={x}&y={y}&d=a', {}).addTo(map);

    return;    

    //map.addLayer(new R.Marker(latlng));
    $.ajax({
      url: "geo/vsech_svatych.json",
      data: {},
      success: nacteno,
      dataType: "json"
    });
    
    function nacteno(data){
      nacti_png(data);
      var cara_styl = {"opacity": 0};
      L.geoJson(data, {style: cara_styl}).addTo(map);
      
      //alert(1);
             
    }    
    return;

    function nacti_png(data){
      //vložení obrázku do mapy - potøebuju souøadnice levého horního a pravého spodního bodu
      var f = data.features[0]["geometry"]["coordinates"];
      var lat ; var lng;
      var lat_min = 999;
      var lat_max = 0;
      var lng_min = 999;
      var lng_max = 0;

      for(var i in f)
      {
        lat = f[i][0];
        lng = f[i][1];
        lat_min = Math.min(lat_min,lat);
        lat_max = Math.max(lat_max,lat);
        lng_min = Math.min(lng_min,lng);
        lng_max = Math.max(lng_max,lng);
       //alert(sour);
      }
      //$("#log").append("<br>" + i + " = " + f[i]);
      //alert()
      
      var imageUrl = 'img/kostel2.png',
      imageBounds = [[lng_max, lat_min], [lng_min, lat_max]];
      //imageBounds = [[50.5335956, 14.1329292], [50.5332997, 14.1336472]];
      //alert(11);
      L.imageOverlay(imageUrl, imageBounds).addTo(map);

             
    }

    var canvasTiles = L.tileLayer.canvas();
    //canvg(canvasTiles, 'lion.svg');
    canvasTiles.drawTile = function(canvas, tilePoint, zoom) {
        //alert(map.getZoom());
        canvg(canvas, 'lion.svg');
        var ctx = canvas.getContext('2d');
        
        ctx.fillStyle = "rgb(200,0,0)";
         ctx.fillRect (10, 10, 55, 50);
         
         ctx.fillStyle = "rgba(0, 0, 200, 0.5)";
         ctx.fillRect (130, 30, 55, 50);
        //alert("zoom " + zoom);
        
    }

    //canvasTiles.addTo(map);


 
 		L.circle([50.5343828, 14.1323575], 5, {
			color: 'blue',
			//id: "xx",
			fillColor: 'blue',
			fillOpacity: 0.3
		}).addTo(map).addEventListener("click",poly);//.bind("click",poly);;//.bindPopup("I am a circle.");   
    
    
      
// 		L.tileLayer('http://{s}.tile.cloudmade.com/BC9A493B41014CAABB98F0471D759707/997/256/{z}/{x}/{y}.png', {
// 			maxZoom: 18,
// 			attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>'
// 		}).addTo(map);
    ;
    //return
    return 
		L.marker([50.5378, 14.1379]).addTo(map)
			.bindPopup("<b>Hello world!</b><br />I am a popup.").openPopup();


    //$("#xx").bind("click",poly);
    return
		L.polygon([
			[51.509, -0.08],
			[51.503, -0.06],
			[51.51, -0.047]
		]).addTo(map).bind("click",poly);


		var popup = L.popup();

		function onMapClick(e) {
			popup
				.setLatLng(e.latlng)
				.setContent("You clicked the map at " + e.latlng.toString())
				.openOn(map);
		}

		map.on('click', onMapClick);

        
     }
    function poly(){
       alert("poly");      
    } 