
var mapa = mapa || {};

(function(o){

  o.prazdna_dlazdice = "";//sem načtu base64 zakodovaný obrázek prázdné dlaždice - budu ukazovat tam kde nebudu mít data v DB
  o.map_ready = false;//nastavím na true až všechno doběhne
  var mesto = "LTM_STRED"
  var map = null;
  var tile_layer = null;
  var div_video = "player";
  var zoom_min = 10;
  var zoom_max = 16;
  
  //terezín malá pevnost
  $lat_left = 50.51691;
  $lng_left = 14.15864;

  if(mesto == "LTM")
  {
   //Litoměřice
    var lng_min = 14.1113603;//14.1193603;
    var lng_max = 14.1484075;//14.1434075;
    var lat_min = 50.5198964;
    var lat_max = 50.5520908;

  }else if(mesto == "TER"){
    var lng_min = 14.15864;//14.159789085388184;//14.1113603;//14.1193603;
    var lng_max = 14.170485734939575;//14.1484075;//14.1434075;
    var lat_min = 50.51;//50.51043138071205;
    var lat_max = 50.516455591969105;
    zoom_max = 19;
  }else if(mesto == "LTM_STRED"){
    var lat_min = 50.53238227663156;
    var lat_max = 50.53556696854723;
    var lng_min = 14.127731323242188;
    var lng_max = 14.135059118270874;
  }


 

  var timer = null;//timer pro zjišťování GPS
  var lat_stred = (lat_min + lat_max)/2;//střed mapy
  var lng_stred = (lng_min + lng_max)/2;
  var ja_circle = null;
  //var pocet_dlazdic = 0;
  var zoom_download = zoom_min;
  var arr_mista = []; 
  var arr_oblibena = [];
  var akt_misto_id = null;//id aktuálně prohlíženého dokumentu - pro přidání do oblíbených 
  var cara_body = [];
  var polyline = null;
  var arr_osm_trasy = [];//seznam všech OSM tras 
  var osm_obrazky = [];//údaje obrázků patřících k OSM trasám 
  var s3_path = null;
  var obr_path_th = null;
  var obr_path = null;
  var orientace = null;//orientace zařízení
  var arr_trasy = []; 
  var arr_mista_rt = [];
  var mark_cluster = null;//skupina značek - pro sdružování více značek do jedné
  
  o.arr_mista_set = function(data){
    arr_mista = data
  }

  o.arr_trasy_set = function(arr){
  
    arr_trasy = arr
    //alert(1)
  }//nastavení tras načtených v menu.js


//   o.is_map_ = function()
//   {
//     //vrací true nebo false podle toho jestli už je mapa vytvořená nebo ne
//     return map == null ? false : true;
//   }

  o.arr_mista_rt_set = function(data){
    arr_mista_rt = data
  }
  
  o.start = function(){
    clog("FCE mapa.start()")
    if(config.online)//online verze obrázky beru přímo z S3
    {
      obr_path_th = "http://kamna.cz.s3.amazonaws.com/160_120/"//cesta k obrázkům a náhledům
      obr_path = "http://kamna.cz.s3.amazonaws.com/"
    }else{
      obr_path_th = config.obrazky == "DOWN" ? prac_adresar + "/" : "mapa_img/th/";//cesta k obrázkům a náhledům u přibalených a stažených obrázků se liší
      obr_path = config.obrazky == "DOWN" ? prac_adresar + "/" : "mapa_img/";
    }
    
    
    rozmery_nastav();//rozměry mapy
    if(config.device_os == "IOS")
    {
      window.onorientationchange = rozmery_nastav
    }else{
      window.onorientationchange = function(){ 
        //clog("EVENT window.onorientationchange")
        setTimeout(rozmery_nastav,100);//při otočení mobilu musím přepočítat
      }
    }
    
    
//     window.onresize = function(){ 
//       //clog("EVENT window.onresize")
//       setTimeout(rozmery_nastav,300);//při otočení mobilu musím přepočítat
//     }
    //když se vracím na mapu musím zjistit jestli user telefon neotočil. Pokud jo, nastavím podle akt. stavu
    $(document).on('pageshow', '#page_mapa', function() { rozmery_nastav()});
    //$(document).on('pageshow', '#page_mapa', function() { alert("na mapu")});
    //alert("kde_bezi " + kde_bezi);
    //if(kde_bezi != "APP")
    //alert("json_path " + json_path)
    o.zaloz_mapu();
    zn_options = {icon: ikona};
    mapa.kde_jsem_zjisti()
    osm_trasy_nacti()
    $.get("img/data_nejsou.b64",prazdna_dl_ok)
    //vypis("mapa start HOTOV")
    //$.get("test_osm/zelena_mapa_hriste_a_sportoviste_01.osm",{},vykresli_ramy);//vykreslení markerů na mapu 

    $.getScript("http://www.youtube.com/iframe_api",function(){
      //alert("OK get youtube API")
      setTimeout(o.new_player,5000);
      $( "#video_popup" ).bind({ popupafterclose: function(){player.stopVideo()} });
    });



    function prazdna_dl_ok(data){
      o.prazdna_dlazdice = data         
    }
  }


  function obrazky_all_ok(data){
    main.arr_obrazky_all = data
    //clog("obrazky_all_ok")           
  }

  function osm_trasy_nacti(){
    //načtení OSM tras a k nim patřících obrázků
    //var osm_url = json_path + "osm_trasy.json?par=" + Math.random()
    //return
    //alert(osm_url);
    jQuery.getJSON(json_path + "osm_trasy.json?par=" + Math.random(),osm_trasy_ok);
    jQuery.getJSON(json_path + "osm_obrazky.json?par=" + Math.random(),osm_obrazky_ok);
    jQuery.getJSON(json_path + "obrazky_all.json?par=" + Math.random(),obrazky_all_ok);

    function osm_obrazky_ok(data){
      //načteny obrázky pro OSM trasy
      //for(var i in data)console.log(i + " = " + data[i])
      //vp(data)
      osm_obrazky = data
      //alert("osm_obrazky_ok počet " + osm_obrazky.length)     
    }
    
    function osm_trasy_ok(data){
      //načteny všechny OSM trasy
      arr_osm_trasy = data
    }

  }

  o.obr_download = function()
  {
    var arr_obr = main.arr_obrazky_all
    var arr = [];
    var tmp; var url;
    for(var i=0;i<arr_obr.length;i++)
    {
      name = main.arr_obrazky_all[i]["name"];
      url = server_path + "mapa_img/" + name 
      tmp = {"name":name,"url": url }
      arr.push(tmp)    
    }
    var params = {db_save:false,typ:"obr"}
    down.start(arr,menu.download_obr_ok,mapa.down_obr_stav,params)
  }

  o.download_obr_ok = function(){
    ale("HOTOVO obrázky staženy");
  
  }
  
  o.down_obr_stav = function(text,zbyva,stahuju){
    $("#panel_ajax_error").text(text + " %")
  }
  

  //vymazání mapy - jen pro testy
  o.mapa_clear = function(){mapu_vycisti()}

  o.osm_trasa_ukaz = function(id_dokumentu)
  {
    //zobrazení OSM trasy a k ní patřících obrázků
    //alert("osm_trasa_ukaz chci trasu " + id_dokumentu)
    mapa_ukazuju();//vyčisti mapu
    console.log("id_dokumentu " + id_dokumentu )
    //alert("arr_osm_trasy " + arr_osm_trasy.length)
    for(var i in arr_osm_trasy)
    {
      var row = arr_osm_trasy[i];
      //alert(i + " row id_dok " + row["id_dokumentu"] + "   " + id_dokumentu + " typ  " + row["typ"]);
      if(row["id_dokumentu"] == id_dokumentu)osm_trasa_kresleni(row)
    } 
  }
  
  function osm_trasa_kresleni(row){
    //vlastní vykreslení osm trasy - zavolám fce na obrázky body i vlastní čáru trasy
    //if(row["typ"] == "points")vykresli_body(row["xml"])
    if(row["typ"] == "frames")
    {
      body_trasy_vykresli(row["stitky_trasa"]);//vykresli body které mají stejný šítek jako trasa
      setTimeout(obrazky,300)//někdy se neyvkreslily značky ale jen obrázky - když pozdržím tak to zdá se funguje
      function obrazky(){ vykresli_frames(row["xml"],osm_obrazky) }
    }
    if(row["typ"] == "path")vykresli_trasu(row["xml"])           
  }
  
  
//   function zaloz_mapu_2(){
//     //založení mapy - pokusy s kreslenou mapou památníku Terezín
//     //zlobí to jak svině
//     var map_attr = '';
//     var opt = {
//     zoom: 20,
//     center: [0, 0], 
//     maxZoom: 20,
//     minZoom: 17,
//     crs: L.CRS.Simple
//     };
//     map = L.map('map', opt).setView([0, 0], 20,true);
//     L.tileLayer('pevnost/{z}/{x}_{y}.png', {attribution: 'Map data &copy; ???',}).addTo(map); //http://localhost/kamna_dlazdice/
//     var southWest = map.unproject([0, 5457], map.getMaxZoom());
//     var northEast = map.unproject([6500, 0], map.getMaxZoom());
//     alert(southWest);
//     map.setMaxBounds(new L.LatLngBounds(southWest, northEast));
//   }
//   
  





  function data_nacti(fce){
    //načtení dat z json souboru nebo lok úložiště
    //po získání dat zavolá předanou fci
    alert(111)
    var json = true;
    try{JSON.stringify("")}
    catch(e){json = false;}
    //alert(json)
    if(localStorage.getItem("ulozeno") != "A" || !json)//nemám v úložišti nebo neumí json (IE) 
    {
      $.get(ajax.server_path + "json/mista.json", function nacteno(data){
        if(json)
        {
          localStorage.setItem('mista', JSON.stringify(data));
          localStorage.setItem("ulozeno","A");
        }
        arr_mista = data;
        //alert("stazeno")
        fce();         
      });
        //alert(localStorage.getItem("mista"));
    }else{
      //alert("z localStorage");
      arr_mista = JSON.parse(localStorage.getItem("mista"));           
      fce();
    
    }
    
  }

            
  o.mista_ukaz = function(smazat){
    //používal jsem u varianty, kdy se na mapě dalo zobrazit několik kategorií
    return
    //zobrazení míst na mapu
    //smazat - true - stávající značky z mapy smažu, false - jen doplním značky
    if(smazat)mapu_vycisti()
    //alert("pocet " + arr_mista.length)
    var cit = 0;
    for(var i in arr_mista)
    {
      var m = arr_mista[i]
      var druh = arr_mista[i]["stitky_druh"]
      if(druh != undefined)//beru jen místa, která mají štítek  určující druh místa
      {
        //alert(druh + "  " + arr_zobrazit[druh])
        if(arr_zobrazit[druh])
        {
          znacku_ukaz(i,m)//značku vypíšu jen pokud se její druh má vypisovat - dáno polem arr_zobrazit
          cit ++
        }
      }
    }
    //alert("zobrazeno " + cit + " znacek")
  } 

//   o.znacky_trasy_zobraz = function(id){
//     //zobrazí značky patřící k trase
//     //použije se u osm tras
//     mapu_vycisti()
//     var arr = [];
//     var icon = ikona;
//     var klik_fce = misto_ukaz
//     var cit = 0;
//     for(var i in arr_mista)
//     {
//       var m = arr_mista[i]
//       //var druh = arr_mista[i]["stitky_druh"]
//       if(m["stitky_druh"] == id)
//       {
//         //var typ = m["dokument_typ"];
//         var lat_lng = [m["latitude"],m["longitude"]];
//         arr.push(lat_lng);
//         marker = L.marker(lat_lng,{icon: icon,clickable: true, name: i,title:m["nazev"]}).on('click',klik_fce)
//         marker.addTo(map)         
//         arr_layers.push({druh: "marker",objekt: marker});
//         cit ++
//       }
//     }
//     //alert("zobrazeno " + cit + " znacek")
//     $.mobile.changePage("#page_mapa");
//     setTimeout(posun,400)
//     function posun(){
//       map.invalidateSize(true);//doplní nové dlaždice a posune aby střed zůstal kde je         
//     }
//     
//     //mapa_bound(arr);
//   }

  function stitek_najdi_id(nazev,druh,nazev_pole){
    //fce projde pole štítků a hledá štítek, který má český popis shodný s nazev
    var row;
    for(var i in arr_stitky)
    {
      row = arr_stitky[i]
      //clog(row["typ"] + " " + druh + " " + row["popis_cz"] + "  " + nazev + "   " + nazev_pole)
      if(row["typ"] == druh && row[nazev_pole] == nazev)return row["id"]
    }
    return 0;           
  }
  
  o.ukaz_kategorii = function(nazev){
    //ukáže na mapě značky s konkrétním štítkem
    mapa_ukazuju();//vyčistí mapu, přepne se na ni nebo zavře panel
    var id_stitku = stitek_najdi_id(nazev,"druh","nazev_cz")
    //alert("id_stitku " + id_stitku)
    kategorie_ukaz_znacky(id_stitku)
  }
  
  function dokument_najdi_id(id_trasy){
    var row;
    for(var i in arr_osm_trasy)
    {
      var row = arr_osm_trasy[i];
      //alert(i + " row id_dok " + row["id_dokumentu"] + "   " + id_dokumentu + " typ  " + row["typ"]);
      if(row["stitky_trasa"] == id_trasy)return row["id_dokumentu"]
    }
    return 0;          
  }
  
  o.ukaz_trasu = function(nazev){
    //ukáže na mapě OSM trasu s dokumenty - zavolá na to fci osm_trasa_ukaz - ta ale očekává ID dokumentu
    //tady potřebuju OSM trasu vykreslit podle jejího názvu
    //alert("chci trasu " + nazev)
    mapa_ukazuju();//vyčistí mapu, přepne se na ni nebo zavře panel
    var id_trasy = stitek_najdi_id(nazev,"trasa","nazev_cz")//najdu jaké id stítku trasa má
    var id_dok = dokument_najdi_id(id_trasy)//v seznamu OSM tras najdi tu která má tohle id štítku
    mapa.osm_trasa_ukaz(id_dok)
  }
  
  function ma_stitek(stitky,id_stitku){
    //vrací true nebo false podle toho jestli se v řetězci stitky vyskytuje id_stitku
    //stitky - může být jen číslo nebo několik čísel spojených #
    if(String(stitky).search("#") == -1)//jen jedno číslo
    {
      if(stitky == id_stitku)return true
      else return false
    }else{
      var arr = String(stitky).split("#")
      for(var i in arr)
      {
        if(arr[i] == id_stitku)return true
      }
      return false
    }
  }
  
  function kategorie_ukaz_znacky(id_stitku){
    //vypíše na mapu značky u kterých stitky_druh je rovno nebo obsahuje id_stitku (stitky_druh může být např 33#12)
    var arr = [];
    var icon = ikona;
    var klik_fce = misto_ukaz
    var cit = 0;
    mark_cluster = marker_group()//pro sdružování hodně blízkých značek do jedné
    for(var i in arr_mista)
    {
      var m = arr_mista[i]
      //var druh = arr_mista[i]["stitky_druh"]
      //clog(m["nazev"] + "  " + m["stitky_druh"])
      if(ma_stitek(m["stitky_druh"],id_stitku))
      {
        var lat_lng = [m["latitude"],m["longitude"]];
        arr.push(lat_lng);
        marker = L.marker(lat_lng,{icon: icon,clickable: true, name: i,title:m["nazev"]}).on('click',klik_fce)
        mark_cluster.addLayer(marker);         
        arr_layers.push({druh: "marker",objekt: marker});
        cit ++
      }
    }
    map.addLayer(mark_cluster);
    if(config.verze == "PC")map.fitBounds(new L.LatLngBounds(arr))//zmenši mapu aby se na ní všechny body vlezly
    setTimeout(posun,400)
    function posun(){
      //map.invalidateSize(true);//doplní nové dlaždice a posune aby střed zůstal kde je         
    }
  }
  
  function marker_group(){
     var group = new L.MarkerClusterGroup({
			maxClusterRadius: 80,
			iconCreateFunction: function (cluster) {
				return new L.DivIcon({ html: '<div class="cluster_pocet">' + cluster.getChildCount() + '</div>', className: 'cluster', iconSize: new L.Point(60, 52) });
			},
			//Disable all of the defaults:
			spiderfyOnMaxZoom: true, showCoverageOnHover: false, zoomToBoundsOnClick: true,
			disableClusteringAtZoom:16
		});
    return group         
  }
  
  o.kategorie_zobraz = function(id){
    //zobrazí značky vybrané kategorie a přepne na stránku s mapou
    //použije se u varianty kdy na mapě mám vždy jen jednu katagorii značek
    //alert("kategorie_zobraz " + id)
    mapa_ukazuju();//vyčistí mapu, přepne se na ni nebo zavře panel
    kategorie_ukaz_znacky(id)
    
  }
  
  function mapa_bound(arr){
    //plánováno pro nazoomování mapy aby byly vidět všechny aktuálně zobrazené značky
    //pokud jsou značky daleko nedá se použít - zmenšilo by mapu na úroveň okresu
    var arr_lat = [];
    var arr_lng = [];
    for(var i in arr)
    {
      arr_lat.push(arr[i][0])
      arr_lng.push(arr[i][1])
    }
    var lb = new L.LatLng(util.max(arr_lat),util.min(arr_lng))
    var rt = new L.LatLng(util.min(arr_lat),util.max(arr_lng)) 
    var bounds = new L.LatLngBounds(lb,rt)
    map.fitBounds(bounds);
  }
  
  function mapu_vycisti(){
    //smaže z mapy všechny značky, které má uložené v poli arr_layers 
    if(mark_cluster != null)
    {
      if(map.hasLayer(mark_cluster))map.removeLayer(mark_cluster)
    }
    if(arr_layers.length == 0)return
    //alert("pocet " + arr_layers.length)
    for(var i in arr_layers)
    {
      if(map.hasLayer(arr_layers[i].objekt))map.removeLayer(arr_layers[i].objekt)
    }
    arr_layers = [];       
  }
  
  function znacku_ukaz(i,m){
    //umístí značku na mapu
    var icon;
    var marker;
    var klik_fce
    //var arr_znacky = [];
    if(m["dokument_typ"] == "video")
    {
      icon = ikona_video;
      klik_fce = config.verze == "MOB" ? video_ukaz : video_ukaz_pc;
    }else{
      icon = ikona;
      klik_fce = misto_ukaz
    }
    var typ = m["dokument_typ"];
    if(arr_zobrazit[m["stitky_druh"]])//tenhle druh se má zobrazit
    {
      marker = L.marker([m["latitude"],m["longitude"]],{icon: icon,clickable: true, name: i,title:m["nazev"]}).on('click',klik_fce)
      marker.addTo(map)         
      //arr_layers.push(marker);
      //alert(klik_fce)
      arr_layers.push({druh: "marker",objekt: marker});
    }
  }
  

  function misto_ukaz(e){
    //fci volá klik na běžnou značku místa na mapě - zobrazí texty, obrázky patřící k místu 
    var znacka = e.target;//
    clog("misto ukaz " + znacka.options.name + "   config.verze " + config.verze)
    akt_misto = arr_mista[znacka.options.name];
    //alert(1)
    if(config.verze == "PC")bublina_ukaz(znacka,akt_misto);
    else stranka_ukaz(akt_misto);
  }   

  function reportaz_z_mapy_ukaz(e){
    //fci volá klik na značku s reportáží RT na mapě - zobrazí video s reportáží
    //možná se nepoužije - když je víc reportáží na jednom místě nedá se vybrat jedna z nich 
    var znacka = e.target;//
    console.log("NAME " + znacka.options.name)
    akt_misto = arr_mista_rt[znacka.options.name];
    //alert(config.verze)
    if(config.verze == "PC")video_player_pc(akt_misto)
    else o.video_spust(akt_misto);
    //video_player_pc(akt_misto)         
  }


  function bublina_ukaz(znacka,misto){
    //zobrazení textu ve verzi pro PC - buď na panel nebo do bubliny
    var popup_width = 550
    $("#div_help_hl").text(misto["nazev"]); //název dej do hlavičky
    var html = misto["popis_cz"] + misto["nahledy"];//text a náhledy
    
    //clog(misto["popis_cz"])
    $("#div_help_over").html(html).css({"height":screen_h *0.8});//vlož html
    //v náhledech nemám cestu k obrázkům - tu doplňuju podle verze - online/offline - PC je vždy online
    //var w = $("#popup_help").width();
    //clog("W = " + w )
    $("#div_help_over .nahled").each(function(){
      var obr_name = $(this).attr("src");
      $(this).attr("src",obr_path + obr_name).css({width: popup_width - 30});
      $(this).parent().attr("href","#")//velký obrázek nebude - ukazuju ho rovnou
    });
    //$("#div_help_2 a").bind("vclick",obr_detail_pc);//malý obrázek je obalený odkazem s url velkého obrázku 
    $(".overthrow-enabled #div_help_over").css({"width": popup_width}); //"height": window.innerHeight * 0.6,
    $("#popup_help").popup("open");   
  }

  function stranka_ukaz(misto){
    //zobrazení textu ve verzi pro mobily - zobrazuje se na samostatné stránce 
    akt_misto_id = misto["id_dokumentu"]
    var file
    //ale(misto["nahledy"])
    var html = misto["popis_cz"] + misto["nahledy"];
    if(misto["youtube"] != undefined) html += '<br><a href="#"  onclick="mapa.video_spust()" id="but_video" data-role="button" data-theme="c"  data-inline="true" >Video</a>';
    
    $("#content_texty").html(html).css({height: screen_h});//nastavím výšku aby se aktivoval scrolling pokud přelejzá
    //obrázky došly jen název, bez cesty - doplním ji podle toho jestli jde o online nebo offline verzi
    $("#content_texty .nahled").each(function(){
      var obr_name = $(this).attr("src");
      if(config.online)//online verze - obrázky čtu z webu
      {
        $(this).attr("src",obr_path_th + obr_name);
        $(this).parent().attr("href",obr_path + obr_name)
      }else{//obrázky musím mít předem stažené v base64 kodovani nebo přibalené k aplikaci
        //alert("config.obrazky " + config.obrazky)
        if(config.obrazky == "DOWN")//obrázky si aplikace stáhla v podobě base64 a uložila do adresáře
        {
          file = obr_path + String(obr_name).replace(".jpg",".txt")
          //$(this).parent().attr("href","#").bind("click",function(){});
          files.file_nacti(file,mapa.nahled_nacten,this)
        }else{//obrázky jsou přibalené k aplikaci
          file = "mapa_img/" + obr_name//String(obr_name).replace(".jpg",".txt")
          clog("OBR src = " + file)
          $(this).attr("src",file).css({width:200});
          $(this).parent().attr("href",file)
        }
      }
    });
    $("#content_texty #but_video").buttonMarkup( "refresh" )
    $("#content_texty .nahled").unbind().bind("vclick",obr_detail);//malý obrázek je obalený odkazem s url velkého obrázku po kliku na malý ukážu velký 
    $.mobile.changePage("#page_texty");
  }

  o.nahled_nacten = function(obr,src){
    //ale("nahled_nacten ")
    var w = screen_w > screen_h ? screen_w/2 : screen_w * 0.9
    $(obr).css("width",w);
    obr.src = src
    $(obr).parent().attr("src",src)//
  }
  

  function obr_detail_pc(e){
    //detail obrázku na PC - nahradím text samotným obrázkem
    e.preventDefault();
    var w = $("#popup_help").width();
    //alert(w)
    $(".overthrow-enabled #div_help_over").css({"height": window.innerHeight * 0.6,"width": w-30});
    var href = $(e.target).parent().attr("href");
    //$("#div_help_over").html(misto["popis_cz"]);
    $("#div_help_over").html('<img id="pic_detail" src="' + href + '">');
    $( "#pic_detail" ).draggable();       
  }

  function obr_detail(e){
    //detail obrázku na mobilu - na samostatné stránce
    e.preventDefault();
    if(!config.online && config.obrazky == "DOWN")//offline aplikace a obrázky nejsou přibalené ale stažené 
    {
      $("#div_zoom").empty();
      //ale("detail");
      var img = document.createElement("img")
      img.src = e.target.src
      $("#div_zoom").append(img)       
    }else{
      var href = $(e.target).parent().attr("href");
      $("#div_zoom").html('<img src="' + href + '">');
      $("#div_zoom").css({width:screen_w,height: screen_h});
    }
    $.mobile.changePage("#page_zoom");
  }


  function video_ukaz(e){
    //zobrazení videa po kliknutí na značku - verze pro mobily
    var znacka = e.target;//
    akt_misto = arr_mista[znacka.options.name];
    o.video_spust(akt_misto);
  }

  o.video_spust = function(misto){
    //spuštění videa - aktuální místo mám uložené v akt_misto
    $("#nadpis_video").text(misto["nazev"]);
    $.mobile.changePage("#page_video");
    if(player == null)
    {
      //alert("zalozim player")
      mapa.new_player()
    }else{
      //alert("spustim " + misto["youtube"]);
      player.loadVideoById(misto["youtube"]);
      player.playVideo();
    }
  }

  function player_ready(){
    //alert("player_ready");
    //volá se po vytvoření YT playeru
    if(akt_misto == undefined)return
    if(akt_misto["youtube"] == undefined)return
    player.loadVideoById(akt_misto["youtube"]);
    player.playVideo();
  }
  

  o.new_player = function(){
      //založení nového YT playeru
      //alert("FCE new_player");
      //u mobilu se volá na hlavní stránce a div je na jiné - tj v DOMu neexistuje - pak skončí s chybou - nějak ošetřit
      var options = {
          height: '270',
          width: '400',
          videoId: '',
          enablejsapi:1,
          playerVars: { 'autoplay': 1},
          
          events: {
            'onReady': player_ready,
            'onStateChange': player_zmena
          }
        };
      var div = config.verze == "MOB" ? "div_player" : "div_player_pc";//podle verze player nastartuju v příslušném divu
      //if("#" + div)[0]
      try{
        player = new YT.Player(div, options);
        //if(callback != undefined)callback();
      }
      catch(err)
      {
        clog("new_player chyba : " + err.message);
      }
  }
  
  function player_zmena(){
           
  }
  
  o.video_stop = function()
  {
    if(player == null || player == undefined)return
    player.stopVideo()
  }

  function video_ukaz_pc(e){
    //zobrazení videa po kliknutí na značku - pro PC - otevře v popup okně
    var znacka = e.target;//
    var misto = arr_mista[znacka.options.name];
    video_player_pc(misto)
  }
  
  function video_player_pc(misto){
    //alert(misto["nazev"]);
    //alert("player " + player)
    //misto["nazev"] = "xxx"
    $("#div_video_hl").text(misto["nazev"]);
    //var html = misto["popis_cz"] + misto["nahledy"];
    $("#video_popup").popup("close");
    player.loadVideoById(misto["youtube"]);
    player.playVideo();
    setTimeout(otevri,300);
    function otevri(){
      $("#video_popup").popup("open");         
    }
  
  }


  o.download = function(){
    //FCE SLOUŽÍ PRO OFOCENÍ MAPY - PAK SE ROZSEKÁ NA DLAŽDICE
    //zobrazení mapy - data se načítají přes proxy.php - slouží pro ofocení mapy
    //proxy předávám min a max lat a lng. Podle nich pozná, jestli je už dlaždice mimo mapu a pokud jo pošle bílou dlaždici
    // Mapu si pak popotáhnu abych viděl bílý okraj, ofotím, domaluju na ní co je potřeba a rozsekám zas na dlaždice
    rozmery_nastav();
    var latlng = new L.LatLng(lat_stred, lng_stred);

    var map_opt = {zoom: zoom_min ,minZoom: zoom_min, maxZoom: zoom_max,maxBounds: [[lat_min, lng_min],[lat_max, lng_max]] }; 
    map = L.map('map',map_opt).setView(latlng, zoom_max);//Litoměřice
    L.tileLayer('http://localhost/kamna/assets/www/proxy.php?z={z}&x={x}&y={y}&lat_min=' + lat_min + '&lat_max=' + lat_max + '&lng_min=' + lng_min + '&lng_max=' + lng_max ,
     {}).addTo(map);
  }


  o.kde_jsem_zjisti = function(){
    //zkusí zjistit pozici a zavolá fci, která vycentruje mapu 
    //alert("fce kde jsem " + gps.lat)
    if(config.verze == "PC")return//na PC pozici nezjišťuju
    if(arr_setup.gps_ja == 1)gps.start(5000,o.kde_jsem_ukaz,arr_setup.gps_ja)//spustím jen když chci pozici znát
  }
  
  o.kde_jsem_smaz = function(){
    //fce smaže z mapy puntík, kde se se vyskytuju - pokud puntík existuje
    if(ja_circle != null)
    {
      if(map.hasLayer(ja_circle))
      {
        map.removeLayer(ja_circle)
        ja_circle = null
      }
    }
  }
  
  o.kde_jsem_ukaz = function(gps){
    //fce ukáže moji pozici na mapě, pokud se GPS souřadnice našly
    //asi by mělo dělat průměr z několika měření aby bod moc neposkakoval
    //pokud na delší dobu ztratím GPS měl bych asi kruh kde jsem z mapy odstranit
    //alert("kde_jsem_ukaz " + gps.lat + "  " + gps.lng);
    //clog("KDE_JSEM_UKAZ gps_ja " + arr_setup.gps_ja)
    if(gps["lat"] == null)//neznám souřadnice
    {
      clog("GPS KO nemám souřadnice");
      if(ja_circle != null)o.kde_jsem_smaz()//na mapě mám značku a GPS neznám - odstraním ji
      return
    }else{
      //$("#menu").html(gps["lat"] + "<br>" + gps["lng"]);
      if(arr_setup.mapa_ja == 1)map.panTo([gps["lat"], gps["lng"]]);
    }
    //if(arr_setup.mapa_ja == )
    if(ja_circle == null)
    {
      //alert("kde_jsem_ukaz " + gps["lat"] + "  " +  gps["lng"]);
      ja_circle = L.circle([gps["lat"], gps["lng"]], 5).addTo(map);
    }else{
      ja_circle.setLatLng([gps["lat"], gps["lng"]])
    }
  }

  function rotace(){
    //alert("ROTACE window.innerWidth " + window.innerWidth)           
  }

  function rozmery_nastav(){
    //clog("rozmery_nastav innerWidth " + window.innerWidth)
    //zjistí rozměry okna a přenastaví rozměry mapy aby byla přes celou obrazovku
    //volá se po startu, při resizu okna a na mobilu při otočení mobilu
    if(kde_bezi != "APP")window.scrollTo(0, 1);
    if($.mobile.activePage[0].id != "page_mapa")return//jen u mapy nastavuju rozměry skriptem
    screen_w = window.innerWidth; //screen.width;
    screen_h = window.innerHeight ; //screen.height; 
    //clog("screen_w = " + screen_w + "  screen_h = " + screen_h);
    var akt_or = screen_w > screen_h ? "L" : "P";//jak momentálně telefon drží?
    //clog("window.orientation = " + window.orientation)
    //clog("akt_or  " + akt_or  + "  orientace " + orientace)
    if(akt_or == orientace && orientace != null)
    {
      //clog("drží ho pořád stejně, nic neměním")
    }else{
      var ofset = $("#div_menu").offset();
      orientace =  screen_w > screen_h ? "L" : "P";//zjistím jak user telefon drží, při otočení musím změnit rozměry mapy
      //var header_h = 0;//$("#header_mapa").height()
      //ale("menu h " + $("#div_menu").height())
      //alert("ofset.top " + ofset.top)
      var footer_h = $("#div_menu").height()
      var mapa_h = screen_h - footer_h
      //var w = $("#div_menu_navbar").width();
      $("#map").css({"width":screen_w,"height":mapa_h})
      $(".full_s").css({"width":screen_w,"height":mapa_h});//roztáhni přes celou obrazovku
      $(".full_w").css({"width":screen_w});//roztáhni přes celou obrazovku
      $("#div_menu").css({"bottom":0,"left": 0,"visibility":"visible"});
//       $("#panel_ajax_error").html("screen_w = " + screen_w + "<br>screen_h = " + screen_h)
//       $("#panel_ajax_error").append("<br>screen.width = " + screen.width)  
//       $("#panel_ajax_error").append("<br>screen.height = " + screen.height)
//       $("#panel_ajax_error").append("<br>config.device_os = " + config.device_os)
//       $("#panel_ajax_error").append("<br>navigator.platform = " + navigator.platform)
    }
    
    if(map != null)map.invalidateSize(true);//doplní nové dlaždice a posune aby střed zůstal kde je
  }

  function onMapClick(e){
    vypis("zoom="+ map.getZoom() + " " +  e.latlng)
    //$("#panel_ajax_error").append("zoom="+ map.getZoom() + " " +  e.latlng + "<br>");           
  }

  function zoom_ukaz(){
    //$("#panel_ajax_error").text(map.getZoom())           
  }
  
  o.zaloz_mapu = function(){
    //založení mapy - data bere z webu nebo z lokálního adresáře
    clog("FCE zaloz_mapu");
    var map_attr = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>';
    var latlng = new L.LatLng(lat_stred, lng_stred);
    //var latlng = new L.LatLng( lat_min,lng_min);
    
    //var map_opt = {zoom: zoom_min ,minZoom: zoom_min, maxZoom: zoom_max,maxBounds: [[lat_min, lng_min],[lat_max, lng_max]] }; 
    //var most_znacka = new L.LatLng(50.51462,14.16449);//TEREZIN TEST ZNACKA vzatá přímo z hotové mapy
    //var most_znacka = new L.LatLng(50.513832459700986,14.164756536483763);//TEREZIN TEST ZNACKA
    map = L.map('map').setView(latlng, zoom_max);//Litoměřice
    map.on('zoomend', zoom_ukaz);//jen pro testy
    if(arr_setup.mapa_online == 1)//online mapu pustím hned
    {
      clog("MAPA ONLINE")
      o.tile_layer()//zapni dlaždice podle akt. nastavení
    }else{
      clog("Off LINE fs_ready " + fs_ready)
      if(fs_ready)o.tile_layer();//file systém už mám připravený?
    }
    o.map_ready = true//příznak, že mapa je hotová a případně se může volat tile_layer tahající dlaždice ze stažených souborů
  }


  o.tile_layer = function(){
    //založí mapovou vrstvu mapy - buď online dlaždice, z adresáře přibaleného v aplikaci, nebo adr. kam si app. dlaždice sama stáhla
    //alert("fs_ready " + fs_ready)
    //return
    var map_opt = {minZoom: zoom_min , maxZoom: zoom_max , zoom: zoom_max};
    if(tile_layer != null)//jestli už vrstvu má musím ji vydusit (děje se při přepínání online offline)
    {
      if(map.hasLayer(tile_layer))map.removeLayer(tile_layer)
    }
    //alert("arr_setup.mapa_online " + arr_setup.mapa_online)
    
    if(arr_setup.mapa_online == 1)//online mapy
      {
        if(config.mapa == "OSM")
        {
          //první varianta posílá ulice silnější a s většími názvy ulic
          //L.tileLayer('http://a.tile.cloudmade.com/666693c8bc354f6aac37194321c571e6/80488@2x/256/{z}/{x}/{y}.png', {attribution:map_attr }).addTo(map);
          //L.tileLayer('tiles/{z}_{x}_{y}.png', {attribution:map_attr }).addTo(map);
          //L.tileLayer('http://a.tile.cloudmade.com/666693c8bc354f6aac37194321c571e6/87731/256/{z}/{x}/{y}.png', {attribution:map_attr }).addTo(map);
          //L.tileLayer('http://localhost/kamna_server/proxy.php?z={z}&x={x}&y={y}&lat_min=' + lat_min + '&lat_max=' + lat_max + '&lng_min=' + lng_min + '&lng_max=' + lng_max ,{continuousWorld:true}).addTo(map);
          //alert("OSM mapa kde_bezi " + kde_bezi);
          //tile_layer = new L.TileLayer.cloudTiles({}).addTo(map);
          //mapa.cloud_tile_layer();
          //tile_layer = new L.TileLayer.CloudTiles({}).addTo(map);
          var cloudmade_id = kde_bezi == "APP" ? "bd234a8f476f4f8389dbdc99553b305e" : "666693c8bc354f6aac37194321c571e6"
          tile_layer = L.tileLayer('http://a.tile.cloudmade.com/' + cloudmade_id + '/' + config.map_styl_id + '/256/{z}/{x}/{y}.png', map_opt).addTo(map);
        }else{
          tile_layer = new L.Google("ROADMAP");
          map.addLayer(ggl);
        }
        
         
      }else{//offline verze bere data z adresáře, do DB se vejde jen 5MB
        if(config.tiles == "ADR")//dlaždice jsou v adresáři přibalené už ve zdrojáku aplikace
        {
          tile_layer = L.tileLayer('tiles/{z}_{x}_{y}.png',map_opt).addTo(map);      
        }else{//dlaždice mám stažené a uložené v adresáři
          mapa.file_tile_layer();
          tile_layer = new L.TileLayer.DownTiles({}).addTo(map);
        }
      }
  }

  //testoval jsem, nebude asi potřeba
//   o.cloud_tile_layer = function(){
//     L.TileLayer.CloudTiles = L.TileLayer.extend({
//     
//     	initialize: function(options) {
//     		//alert(db);
//         //this.mbTilesDB = dbase.db_open()
//     		L.Util.setOptions(this, options);
//     	},
//     	getTileUrl: function (tilePoint, z, tile) {
//     		var x = tilePoint.x;
//     		var y = tilePoint.y;
//         dlazdice_nacti_cloud(z,x,y,tile);
//     	},
//     	_loadTile: function (tile, tilePoint) {
//         var zoom = map.getZoom();
//         tile._layer = this;
//     		tile.onload = this._tileOnLoad;
//     		tile.onerror = this._tileOnError;
//     		this.getTileUrl(tilePoint, zoom, tile);
//     	}
//     });
//   }

  o.db_tile_layer = function(){
    L.TileLayer.MBTiles = L.TileLayer.extend({
      	//db: SQLitePlugin
      	mbTilesDB: null,
      
      	initialize: function(url, options, db_name) {
      		//alert(db);
          this.mbTilesDB = dbase.db_open()
      		L.Util.setOptions(this, options);
      	},
      	getTileUrl: function (tilePoint, z, tile) {
      		var x = tilePoint.x;
      		var y = tilePoint.y;
          db_stranka_nacti(z,x,y,tile);
      	},
      	_loadTile: function (tile, tilePoint) {
          var zoom = map.getZoom();
          tile._layer = this;
      		tile.onload = this._tileOnLoad;
      		tile.onerror = this._tileOnError;
      		this.getTileUrl(tilePoint, zoom, tile);
      	}
      });
  }


  o.file_tile_layer = function(){
    //tile layer pro soubory stažené do adresáře
    L.TileLayer.DownTiles = L.TileLayer.extend({
      	//mbTilesDB: null,
      
      	initialize: function(options) {
      		//alert(db);
          //this.mbTilesDB = dbase.db_open()
      		L.Util.setOptions(this, options);
      	},
      	getTileUrl: function (tilePoint, z, tile) {
      		var x = tilePoint.x;
      		var y = tilePoint.y;
          dlazdice_nacti(z,x,y,tile);
      	},
      	_loadTile: function (tile, tilePoint) {
          var zoom = map.getZoom();
          tile._layer = this;
      		tile.onload = this._tileOnLoad;
      		tile.onerror = this._tileOnError;
      		this.getTileUrl(tilePoint, zoom, tile);
      	}
      });
  }

//   function dlazdice_nacti_cloud(z,x,y,tile){
//     //
//     //vypis(z + " " + x + " " + y);
//     var url = 'http://a.tile.cloudmade.com/666693c8bc354f6aac37194321c571e6/1/256/'+z+'/'+x+'/'+y+'.png'
//     //alert(url)
//     var promise = $.get(url);//
//     
//     $.when(promise).done( function(data){ 
//       //alert("tile OK")
//       tile.src = data;
//     })
//     .fail( function(){
//       vypis(url)
//     });         
//   }

  function dlazdice_nacti(z,x,y,tile){
    //načte soubor z adresáře - dodává dlaždice stažené z netu 
    var url = menu.dlazdice_uri(z,x,y)
    //alert(url)
    files.file_nacti(url,mapa.dlazdice_nactena,tile)
  }
  
  o.dlazdice_nactena = function(tile,data){
    //if(data == null)alert("dlazdice_nactena načetl prd");
    tile.src = data == null ? mapa.prazdna_dlazdice : data
  }

  function vykresli_body(xml){
    //fce dostane načtený osm soubor (xml) se seznamem bodů
    //v tagu <tag je atribut k který obsahuje jméno png obrázku, který mám na dané souřadnice  
    var marker; var nazev; var lat_lng;
    
    $("node",xml).each(function(i){//.find("nd")
      lat_lng = [$(this).attr("lat"),$(this).attr("lon")];
      nazev = $(this).find("tag").attr("k");//název bodu - podle něj vytáhnu jeho texty
      marker = L.marker(lat_lng,{icon: ikona,clickable: true, name: nazev}).addTo(map).on('click',text_ukaz);
      arr_layers.push({druh: "marker",objekt: marker});
    });   
  }
  
  function text_ukaz(e){
      //fci volá klik na značku na mapě - zobrazí k ní patřící text  - načtu ajaxem nebo vylovím z db, nebo local store
      //jméno značky mám uložené v name značky
      var znacka = e.target.options.name
      //alert(znacka);
      $(".overthrow-enabled #div_help_over").css({"height": window.innerHeight * 0.6,"width": screen_w/2});
      $("#popup_help").popup("open");   //.css({"width": screen_w/2,"height": screen_h/2})
  }
  


  function vykresli_trasu(xml){
    //vykreslení trasy - dostane XML vyrobený JOSM
    var arr_trasa = [];
    $("node",xml).each(function(i){
      arr_trasa[arr_trasa.length] = new L.LatLng($(this).attr("lat"), $(this).attr("lon"));
    });
    poly_bounds = poly_vykresli(arr_trasa,"S")//vykreslí čáru a vrátí její bounds abych mohl mapu správně posunout
    poly_bounds = poly_vykresli(arr_trasa,"T")
    setTimeout(centruj,600);//při okamžitém volání někdy skončí s chybou
    function centruj(){ map.fitBounds(poly_bounds);   }  
  }
  
  function vykresli_frames(xml,obrazky){
    //fce dostane XML se souřadnicemi jednotlivých budov.
    //projede všechny elementy a volá fci na jejich vykreslení
    //alert("obrazky.length " + obrazky)
    var arr_lat_lng = osm_lat_lng(xml);//souřadnice si zpracuj do pole
    $("way",xml).each(function(i){//pro všechny budovy zavolej vykreslení
      vykresli_frame(this,arr_lat_lng,obrazky)//vykreslení jedné budovy
    });   
  }
  
  function vykresli_frame(xml,arr_lat_lng,nazvy){
    //vykreslení jednoho framu - budovy
    var lat; var lng;
    var lat_min = null; var lat_max = null;
    var lng_min = null; var lng_max = null;
    var nazev = String($(xml).find("tag").attr("k")).toLowerCase() + ".png";//název framu - podle něj najdu obrázek
    var obr_name = obr_path + nazvy[nazev];//obr_path ukazuje buď na S3 nebo adresář v případě offline appky
    //console.log("vykresli_frame XML " + String(xml))
    
    //alert(nazev + "\n" + nazvy[nazev])
    //projedu všechny uzly a hledám rohy - levý dolní a pravý horní - na ně napasuju obrázek
    $("nd",xml).each(function(i){//.find("nd")
      var id = $(this).attr("ref");//id uzlu
      lat = arr_lat_lng[id][0];//z pole vylovím jeho lat a lng
      lng = arr_lat_lng[id][1];
      lat_min = lat_min == null ? lat : Math.min(lat,lat_min);
      lat_max = lat_max == null ? lat : Math.max(lat,lat_max);
      lng_min = lng_min == null ? lng : Math.min(lng,lng_min);
      lng_max = lng_max == null ? lng : Math.max(lng,lng_max);
    }); 
    ukaz_obrazek(obr_name,[[lat_min, lng_min], [ lat_max,lng_max]]);//napasuj obrázek na tyhle souřadnice         
  }
  
  function vykresli_ramy(xml){
    //jen pro vykreslení rámečků na mapu aby Tom mohl napasovat obrázky
    var arr_lat_lng = osm_lat_lng(xml);//souřadnice si zpracuj do pole
    $("way",xml).each(function(i){//pro všechny budovy zavolej vykreslení
      vykresli_ram(this,arr_lat_lng)//vykreslení obdélníku pro usazení jedné budovy
    });        
  }
  
  
  function vykresli_ram(xml,arr_lat_lng){
    //vykreslení jednoho framu - budovy - jen pro testy - napasování budovy na místo
    var lat; var lng;
    var lat_min = null; var lat_max = null;
    var lng_min = null; var lng_max = null;
    //var nazev = String($(xml).find("tag").attr("k")).toLowerCase() + ".png";//název framu - podle něj najdu obrázek
    //var obr_name = obr_path + nazvy[nazev];//obr_path ukazuje buď na S3 nebo adresář v případě offline appky
    //alert(nazev + "\n" + nazvy[nazev])
    //projedu všechny uzly a hledám rohy - levý dolní a pravý horní - na ně napasuju obrázek
    $("nd",xml).each(function(i){//.find("nd")
      var id = $(this).attr("ref");//id uzlu
      lat = arr_lat_lng[id][0];//z pole vylovím jeho lat a lng
      lng = arr_lat_lng[id][1];
      lat_min = lat_min == null ? lat : Math.min(lat,lat_min);
      lat_max = lat_max == null ? lat : Math.max(lat,lat_max);
      lng_min = lng_min == null ? lng : Math.min(lng,lng_min);
      lng_max = lng_max == null ? lng : Math.max(lng,lng_max);
      
    }); 
    var bounds = [[lat_min, lng_min], [ lat_max,lng_max]];
    L.rectangle(bounds, {color: "#ff0000", weight: 1,fill:false}).addTo(map);
    //ukaz_obrazek(obr_name,[[lat_min, lng_min], [ lat_max,lng_max]]);//napasuj obrázek na tyhle souřadnice         
  }
  
  function ukaz_obrazek(nazev,bounds)
  {
    //přidání obrázku na mapu, fce dostane název obrázku - url
    //asi bude varianta, že dostane obrázek jako base64 řetězec - z DB 
    var url
    //alert(nazev)
    //url = server_path + nazev
    if(config.online == false)url = json_path + nazev//při offline beru z adresáře - sem ale obr. musím nakopčit růčo a přibalit do app - pokud si je app stáhne budou jinde
    else url = nazev//online verze má v názvu rovnou cestu na S3
    //console.log(url)
    var im_over = L.imageOverlay(url, bounds).addTo(map);
    arr_layers.push({druh: "image",objekt: im_over});
  }
  
  
  function osm_lat_lng(xml)
  {
    //zpracování OSM XML souboru pro umístění budov na mapu 
    //projde xml a z uzlů "node" vytahá atributy lat a lng
    //vrátí asoc pole, kde index je id uzlu a hodnota pole s lat a lng
    var arr_lat_lng = [];
    $("node",xml).each(function(i){
      arr_lat_lng[$(this).attr("id")] = [$(this).attr("lat"),$(this).attr("lon")];
    });                   
    return arr_lat_lng
  }
  
  
  o.qr_vyfot = function()
  {
    //pokusy s focením QR kodu a podle nej navigace na mape
  
  }
  
  o.aktualizuj_mapu = function()
  {
    //fce se volá když se vrátím na mapu - provede aktualizaci mapy
    
    map.setView(map.getCenter(), map.getZoom(),true);
    for(var i in arr_layers)//na Samsungu se mi značky ztrácí - pomůže je obnovit?
    {
      var la = arr_layers[i]
      if(la.druh == "marker")la.objekt.update();
    }
  }
  
  
  function trasa_vykresli(trasa){
    //vykreslení trasy naklikané v redaktoru
    var poly_bounds;
    var arr_body = [];
    var bod;
    var arr_trasa = trasa.split("#");
    //alert("bodu " + arr_trasa)
    for(var i in arr_trasa)
    {
      bod = String(arr_trasa[i]).split("_");
      arr_body.push(new L.LatLng(bod[0],bod[1]));
    }
    poly_bounds = poly_vykresli(arr_body,"S")//vykreslí čáru a vrátí její bounds abych mohl mapu správně posunout
    poly_bounds = poly_vykresli(arr_body,"T")
    setTimeout(centruj,600);//při okamžitém volání někdy skončí s chybou
    function centruj(){ map.fitBounds(poly_bounds);   }
  }
  
  function poly_vykresli(arr_body,typ){
    //vykreslení polylajny a přidání do arr_layers
    //vrací bounds čáry pro vycentrování trasy na displej
    //typ je T - tenká nebo S - silná
    var opt = typ == "T" ? {color: 'red',weight:2,opacity:1} : {color: 'black',weight:6}
    poly = L.polyline(arr_body, opt).addTo(map); 
    arr_layers.push({druh: "poly",objekt: poly});
    return poly.getBounds()
  }
  
  function con(arr){
    for(var i in arr)console.log(i + " = " + arr[i])       
  }
  
  o.trasa_ukaz = function(i)
  {
    //zobrazení trasy a k ní patřících bodů na mapu a přepnutí zpět na mapu
    mapa_ukazuju();
    trasa_vykresli(arr_trasy[i]["trasa"])
    body_trasy_vykresli(arr_trasy[i]["stitky_trasa"]);
    
  }
  
  function mapa_ukazuju(){
    //příprava mapy než na ní začnu něco vykreslovat - trasu, body apod
    //obstará přepnutí zpět na stránku s mapou (MOB verze), zavření panelu (PC verze) a vyčištění mapy
    //alert(1)
    if(config.verze == "PC")
    {
      $("div[data-role='panel']").panel("close");     
    }else{
      $.mobile.changePage("#page_mapa");
    }
    mapu_vycisti()
  }

  function body_trasy_vykresli(id)
  {
    //alert("bodů " + arr_mista.length)
    
    for(var i in arr_mista)
    {
      var m = arr_mista[i]
      //if(m["stitky_trasa"] != undefined)alert("stitky_trasa" + m["stitky_trasa"])
      //m["stitky_trasa"] může být jen číslo ale i 65#32#11 pokud bude místo patřit ke třem různým trasám - proto zjiˇštuju funkcí 
      //if(m["stitky_trasa"] != undefined)alert(m["stitky_trasa"] + "  id je " + id)
      if(patri_k_trase(m["stitky_trasa"],id))//beru jen místa, která patří k trase
      {
        marker = L.marker([m["latitude"],m["longitude"]],{icon: ikona,clickable: true, name: i,title:m["nazev"]}).on('click',misto_ukaz)
        marker.addTo(map)         
        //arr_layers.push(marker);
        arr_layers.push({druh: "marker",objekt: marker});
        //znacku_ukaz(i,m)
      }
    }
  }

  function patri_k_trase(m,id){
    //zjistí jestli místo patří k trase
    //m je číslo štítku jedné nebo více tras, čili buď jen číslo nebo víc čísel spojených #  např. 65#32#11
    if(m == undefined)return false
    //alert("m = " + m + "  id " + id)
    var d = String(m).split("#");
    if(d.length == 1)return m == id
    for(var i=0;i<d.length;i++)
    {
      if(d[i] == id)return true;
    }
    return false;
  }

  o.oblibene_pridej = function(){
    //přidání právě prohlíženého místa do oblíbených
    arr_oblibena[akt_misto_id] = akt_misto_id
    $("#pop_oblibene").html("<p>" + arr_texty[akt_lang]["add_oblibene"] + "</p>").popup("open")
    $.timer(function(){$("#pop_oblibene").popup("close")},2000,true);
    oblibene_vypis()
  }
  
  function oblibene_vypis()
  {
    //vypsání seznamu všech oblíbených položek na stránku page_oblibene
    var html = "";
    for(var i in arr_oblibena)
    {
      var m = misto_najdi(i)
      html += '<li><a href="#" taphold="mapa.oblibene_misto_smazat(' + m["id_dokumentu"]+')" onclick="mapa.oblibene_misto_ukaz(' + m["id_dokumentu"]+')">' + m["nazev"] + '</a>';
      html += '<a href="#purchase" data-rel="popup" data-position-to="window" data-transition="pop">Purchase album</a></li>';
    }
    $("#lv_oblibene").html(html).listview("refresh");
    //$("#lv_oblibene").listview("refresh");
  }
  
  o.oblibene_misto_smazat = function(id){
    alert("oblibene_misto_smazat " + id)         
  }
  
  o.oblibene_misto_ukaz = function(id){
    //alert("oblibene_misto_ukaz " + id)         
  }
  
  function misto_najdi(id){
    for(var i in arr_mista){
      if(arr_mista[i]["id_dokumentu"] == id)return arr_mista[i]     
    }
    return null;
  }


  o.videa_rt_zobraz = function(){
    //zobrazí na mapu ikony reportáží RT
    //fce bere určitý počet nejnovějších reportáží - reportáže mám seřazené od nejnovejší
    mapu_vycisti()
    var cit = 0;
    var klik_fce = reportaz_z_mapy_ukaz
    var max_pocet = 5;
    //var ukaz = [];
    for(var i in arr_mista_rt)
    {
      var m = arr_mista_rt[i]
      
      if(je_na_mape(m["latitude"],m["longitude"]))//leží reportáž na území aktuálního města nebo mapy tak jak ji mám nazoomovanou?
      {
        //var lat_lng = [m["latitude"],m["longitude"]];
        //vp(m);
        marker = L.marker([m["latitude"],m["longitude"]],{icon: ikona_video,clickable: true, name: i,title:m["nazev"]}).on('click',klik_fce)
        marker.addTo(map)         
        arr_layers.push({druh: "marker",objekt: marker});
        cit ++
        //console.log(cit + "  " + m["nazev"] )
        if(cit > max_pocet)break
      }
    }
    //alert("zobrazeno " + cit + " RT reportáží")
    $.mobile.changePage("#page_mapa");
    setTimeout(posun,400)
    function posun(){
      map.invalidateSize(true);//doplní nové dlaždice a posune aby střed zůstal kde je         
    }    
  }
  
  function je_na_mape(lat,lng){
    //fce vrací true nebo false podle toho jestli spadá na mapu default města, případně na aktuálně nazoomovanou mapu, pokud je větší než default město
    var m = menu.config_vrat_mapu(config.default_mapa)
    var bounds = map.getBounds() 
    var lat_min = Math.min(m.lat_min,bounds.getSouth())//spodek mapy 
    var lat_max = Math.max(m.lat_max,bounds.getNorth())//vršek
    var lng_min = Math.min(m.lng_min,bounds.getWest())//západ
    var lng_max = Math.max(m.lng_max,bounds.getEast())//východ
    if(lat < lat_min || lat > lat_max)return false
    if(lng < lng_min || lng > lng_max)return false
    return true    
    
           
  }

  
//   function nacti_json(nazev,co,prip){
//     //co O-obrázek C-cesta
//     //u obrázku nevložím json, ale jen obrázek
//     //u C obrázek nenxistuje a vkládám jen vlastní cestu
//     var json_url =  "geo/" + nazev + ".json";
//     var img_url =  "geo/" + nazev + prip;//".jpg";
//     //alert(json_url)
//     $.ajax({
//       url: json_url,
//       data: {},
//       success: json_nacten,
//       dataType: "json"
//     });
// 
//     function json_nacten(data){
//       var bounds = zjisti_bounds(data);
//       var prvni = [data.features[0]["geometry"]["coordinates"][0][1],data.features[0]["geometry"]["coordinates"][0][0]];
//       alert("lat " + data.features[0]["geometry"]["coordinates"][0][0]);
//       zn_options = {icon: ikona};
//       L.marker(prvni,zn_options).addTo(map);
//       if(co == "O")
//       {
//          var cara_black = {"opacity": 1,"weight": 1,"color":"#000000"};
//       }else{
//         var w_tlusta = 1;
//         var w_tenka = 1;
//         var cara_black = {"opacity": 1,"weight": w_tlusta,"color":"#000000"};
//         L.geoJson(data, {style: cara_black}).addTo(map);
//         var cara_red = {"opacity": 1,"weight": w_tenka,"color":"#ff0000"};
//         L.geoJson(data, {style: cara_red}).addTo(map);
//       }
//     }       
//   }




})(mapa);