var screen_w = window.innerWidth;;
var screen_h = window.innerHeight;


var dbase = dbase || {};

(function(o){

  var db = null;
  var db_name = "tiles2";//různý název DB pro localhost a web - jinak na PC nechodí
  var db_version = "1.0"
  var db_d_name = "Tiles"
  var db_size = 4000000
  
  var map = null;
  var prum_vel_obr = 25000;//průměrná velikost jednoho obrázku - ve skut cca 10000 - pro založení DB
  var zoom_min;
  var zoom_max;
  var id_mesta;//id mesta ktere stahuju
  var lng_min;
  var lng_max;
  var lat_min;
  var lat_max;
  var lat_stred//střed mapy
  var lng_stred
  var pocet_dlazdic = 0;
  var zoom_download = zoom_min;
  var arr_stahnout = [];
  var stahuju = 0;//kolik dlaždic právě stahuju
  var citac = 0 
  var fce_ok = null;
  var fce_prubeh = null; 
  var id_mapy;
  
  o.stahuj = function(params,fceok,fceprubeh){
    //var v = lng2tile(14.1113603,18);
    //id_mapy = params.id;//pro zpětná zprávy o průběhu downloadu
    fce_ok = fceok
    fce_prubeh = fceprubeh
    lat_min = params.lat_min;
    lat_max = params.lat_max;
    lng_min = params.lng_min;
    lng_max = params.lng_max;
    zoom_min = parseInt(params.zoom_min);
    zoom_max = parseInt(params.zoom_max);  
    id_mesta = params.id;
    lat_stred = (lat_min + lat_max)/2;//střed mapy
    lng_stred = (lng_min + lng_max)/2;
    //alert(lng_min)
    //window.localStorage.clear();//vydus aby se mapa stahovala znova
    //alert("start screen_w " + screen_w);
    //$(".full_s").css({"width":screen_w,"height":screen_h});//roztáhni přes celou obrazovku
    //console.log("zoom_min " + zoom_min + " zoom_max " + zoom_max);
    //spocti_dlazdice();
    //console.log("počet dlaždic " + arr_stahnout.length);
    
  }

  o.startuj = function(callback)
  {
    o.db_open();
    db.transaction(db_zaloz_tabulky, db_error,callback);
  }  

  o.db_vycisti = function(){
    o.db_open();
    db.transaction(db_vycisti_tabulky, db_error,null_fce);
  }


  function null_fce(){
    //prázdná fce 
    alert("smazano")           
  }

  function delete_ko(err){
      console.log('Chyba ve fci delete_ko '+err)//+' (Code '+err.code+')')             
  }

  o.execute_query = function(string, args, callback, callbackparams) {
      if(db == null)o.db_open()
      //console.log('db execute: '+string);
      db.transaction(function(tx) {
//           alert(string)
//           var v = ""
//           for(var i in args)v += args[i]+ "\n"
//           alert(v);
          tx.executeSql(string, args, function(tx, result) {
              var retval = [];
              //alert("query OK")
              for (var i = 0; i < result.rows.length; ++i) {
                  retval.push(result.rows.item(i));
              }
              if (callback) {
                  callback(retval, result, callbackparams);
              }
  
          }, dbase.query_error);
      });
  }

  o.query_error = function(err){
  //for(var i in err)alert(err[i])
  alert("DB chyba "+ err.code)
  //console.log('error: '+err);
  }



  function db_zaloz_tabulky(tx) 
  {
    //zrušení a založení tabulky
    //tx.executeSql('DROP TABLE IF EXISTS tiles');
    tx.executeSql('CREATE TABLE IF NOT EXISTS tiles ([id] VARCHAR(10),[z] INTEGER KEY, [x] INTEGER  KEY,[y] INTEGER  KEY,[size] INTEGER NULL)');
    //tx.executeSql('CREATE INDEX IF NOT EXISTS [dlazdice] ON [tiles]([x]  ASC,[y]  ASC,[z] ASC)');
    //tx.executeSql('DROP TABLE IF EXISTS obrazky');
    tx.executeSql('CREATE TABLE IF NOT EXISTS obrazky ([id_obrazku] INTEGER KEY, [nazev] varchar(100)  NULL,[pripona] varchar(10) NULL,[data] blob)');
  } 

  function db_vycisti_tabulky(tx){
    tx.executeSql('delete from tiles');         
  }
  
  
  function ulozeno_ko(error)
  {
     //chyba při ukládání
     console.log("ulozeno_ko");
     alert('Chyba ve fci ulozeno_ko '+error.message+' (Code '+error.code+')');
  }




  
  
  
  function dopln_stavby(){
    var arr = ["vsech_svatych_stin","vsech_svatych"];
    for(var i in arr)
    {
      nacti_json(arr[i])
    }           
  }
  
  function nacti_json(nazev){
    
    var json_url =  "geo/" + nazev + ".json";
    var img_url =  "geo/" + nazev + ".png";
    //alert(json_url)
    $.ajax({
      url: json_url,
      data: {},
      success: json_nacten,
      dataType: "json"
    });

    function json_nacten(data){
      var bounds = zjisti_bounds(data);
      //var bounds = [[50.5335956, 14.1329292], [50.5332997, 14.1336472]];
      var cara_styl = {"opacity": 0};
      //alert(bounds);
      L.geoJson(data, {style: cara_styl}).addTo(map); 
      //var img_url =  "geo/vsech_svatych_stin.png";
      L.imageOverlay(img_url, bounds).addTo(map);
      //var imageUrl = 'http://www.lib.utexas.edu/maps/historical/newark_nj_1922.jpg',
      //imageBounds = [[50.5335956, 14.1329292], [50.5332997, 14.1336472]];
  
      //L.imageOverlay(imageUrl, imageBounds).addTo(map);            
    }       
  }


  
  function zjisti_bounds(data){
    var f = data.features[0]["geometry"]["coordinates"];
    var lat ; var lng;
    var lat_min = 999;
    var lat_max = 0;
    var lng_min = 999;
    var lng_max = 0;
    //alert("zjisti_bounds DB")
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
    return [[lng_max, lat_min], [lng_min, lat_max]];           
  }
  
  o.stranka_nacti = function (z,x,y,tile){
    //načtení stránky z DB a zobrazení
    
    db.transaction(
    function (transaction) {
        var sql = "SELECT * from tiles where z='" + z + "' AND x='" + x + "' AND y='" + y + "';";
        //console.log(sql);
        transaction.executeSql(sql,[],nacteno, errorHandler);
    });
    function nacteno(transaction, results)
    {
      try{
        var row = results.rows.item(0);
        var tile_src = row["data"]  ;
      }
      catch(err){ //dlaždice neexistuje - vrátím prázdný string - mapu tam stejně nelze posunout
       tile_src = mapa.prazdna_dlazdice
      }
      tile.src = tile_src ;
    }
  }



  o.db_open = function()
  {
    try {
      if (!window.openDatabase) {
          alert('Toto zařízení nepodporuje Databázi.');
      } else {
          var dbo = openDatabase(db_name, db_version, db_d_name, db_size);
      }
  } catch(e) {
      // Error handling code goes here.
      if (e == 2) {
          // Version number mismatch.
          clog("db_open Špatná verze databáze.");
      } else {
          clog("db_open Neznámá chyba ");
      }
      return;
  }
  db = dbo;
  }

  function db_error(tx,err)
  {
    var chyba = "FCE db_error " + tx.code + " err " + tx.message;
    alert("db_error " + chyba);         
  }
  
  function errorHandler(transaction, error)
  {
    //nahlášení chyby při SQL dotazu
    alert('Chyba '+error.message+' (kód chyby '+error.code+')');
    var we_think_this_error_is_fatal = true;
    if (we_think_this_error_is_fatal) return true;
    return false;
  }
  
//   o.data_nacti = function(nazev){
//     //volá se po startu - načte data z localStorage a nastaví podle nich aplikaci
//     //window.localStorage.clear();//smazání všech dat
//     var setup = localStorage.getItem(nazev);
//     if(setup != null)return = JSON.parse(sml);
//     return null;
//   }
//   
//   o.data_uloz = function(nazev,data)
//   {
//     //uloží předaná data pod jménem nazev, data čeká v json tvaru, proto převádí na řetězec
//     localStorage.setItem(nazev, JSON.stringify(data));
//   }

})(dbase);