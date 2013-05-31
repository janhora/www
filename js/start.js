//var files = null;//abych věděl, že nemám používat - v aplikaci se přepíše načtením files.js
var main = {};//objekt na data
var fs_ready = false;//jestli je připravený file systém - pro čtení dlaždic z adresáře, nastavím po načtení files.js
var kde_bezi = "WEB";//"WEB" - v prohlížeči APP - aplikace (ukládání dlaždic do adresáře)
var s3_path = null;
var download = [];//pro vypisování průběhu downloadu
var player = null;
var arr_texty;
var server_path; 
var libs_path;
var json_path;//cesta k json souborům s daty - buď na serveru, nebo v adresáři u aplikace
var config = null;//{verze: "PC"};
var arr_stitky = [];
var arr_zobrazit = {};
var arr_layers = [];//pole pro všechny značky, které doplním na mapu - na základě pole pak zas mapu čistím
var arr_setup = {"akt_jazyk": "cz","gps_ja": "1","mapa_ja": "0","mapa_online": "0","zoom_map":"1"};
var akt_lang;// = "cz"
var akt_misto;//asoc pole s údaji aktuálně vybraného místa
var screen_w;// = screen.width;//window.innerWidth - 20
var screen_h;// = screen.height;//window.innerHeight - 20
var ikona = L.icon({iconUrl:'markers/bublina_2.png',iconSize:[60, 52],iconAnchor: [60, 52],popupAnchor:[-3, -76]});
var ikona_video = L.icon({iconUrl:'markers/bublina_video_2.png',iconSize:[60, 52],iconAnchor: [60, 52],popupAnchor:[-3, -76]});
var prac_adresar = "kamna"

//window.onload = on_load//po načtení zavolej


// function device_ready(){
//   //volá se po device ready
//   clog("FCE device_ready")
//   menu.files_nacti()  
// }


function vypis(txt){
  $("#panel_ajax_error").append(txt + "<br>");         
}

function on_load(){
  //volá se po načtení okna 
  //document.addEventListener("deviceready", device_ready, false);//až bude připravený phonegap 
  $('body').on('device_ready_event', menu.files_nacti);//hlídej událost - pošle se po device ready
  clog("FCE on_load()");  
  $.mobile.page.prototype.options.backBtnText = "Zpět";//text pro automaticky doplňované tl. Zpět
  $("#page_mapa").page({ domCache: true });//jinak se ztrácejí dlaždice z mapy při odskoku na jinou stránku a návratu zpět 
  
  var ulozeno = localStorage.getItem("setup");
  //window.localStorage.clear();
  if(ulozeno != null)arr_setup = JSON.parse(ulozeno);
  akt_lang = arr_setup["akt_jazyk"]
  //alert("arr_setup.mapa_online " + arr_setup.mapa_online)

  //načti konfig soubor podle něj se pak pokračuje dál
  var pr_conf = jQuery.getJSON("config/config.json?par=" + Math.random(),config_start);
  //var pr_conf = jQuery.getJSON("config/test.json?par=" + Math.random(),test_start);
  //ale("konec fce on_load") 
} 

function test_start(data){
  clog("=============")
  clog(data.s3_path)
  for(var i in data)
  {
    //clog(data[i])
  }         
}

function config_start(data){
  //return
  //konfigurace která se pustí po načtení konfiguračního souboru
  //alert("config_start data " + data.mapa)
  config = data;
  //alert("Mobil? " + jQuery.browser.mobile)
  config.verze = jQuery.browser.mobile ? "MOB" : "PC"
  config.verze = "MOB"
  sablony_nacti()//načte šablonu a vloží ji do panelu
  if(config.verze == "PC")
  //if(jQuery.browser.mobile == false)
  {
    //mapa.new_player();//u PC player vytvořím hned u mobilu až před spuštěním videa
    $("#div_gps").empty();//na PC neukazuju pozici na mapě
    //na PC neukazuju co zobrazit na samostatné stránce ale ve výsuvném panelu
    var panel_html = $("#div_panel_content").html();
    clog(panel_html);
    $("#panel").html(panel_html);
    $("#div_panel_content").empty();
    $("#div_menu").remove();//empty().css({height:0,border:"1px solid red"});//spodní menu nebude
    $("#panel_pc").css({"visibility":"visible"});//horní panel ukaž
    
  }else{
    $("#panel_pc").remove();//panel pro PC vyhoď
  } 
  nastav_server_path(config.online);//nastavím cestu na server podle aktuální situace notebook - web nebo PhoneGap app
  clog("nastav_server_path HOTOVO")
  //alert("čtu bind.js z " + libs_path)//gps_ja
//  var pr_down = $.getScript(libs_path + "down.js");
  var pr_ajax = $.getScript(libs_path + "ajax.js");
  var pr_bind = $.getScript(libs_path + "bind.js");
  var pr_util = $.getScript(libs_path + "util.js");//pr_youtube
  $.when(pr_ajax,pr_bind, pr_util).done( function(){ 
    ajax.server_path = server_path;
    //alert("===================");
    //alert("arr_setup.mapa_online " + arr_setup.mapa_online);
    if(kde_bezi == "WEB")
    {
      arr_setup.mapa_online = 1//u webu vždycky online, natvrdo přepnu
      $(".div_app_only").empty();//vydus části, které mají smysl jen u aplikace
      menu.start()//mapa_start()
    }else{//v aplikaci musím počkat až se mi po device_ready načte files.js 
      menu.start()//mapa_start()      
    }
  }).fail( function(){alert("PROMIS AJAX.JS ATD KO");});
}

function sablony_nacti(){
  //načte šablony a doplní je kam patří
  var row;
  var arr = [
    {nazev:"setup.html",id:"#panel_setup",verze:"PC"},
    {nazev:"setup.html",id:"#div_setup_mobil",verze:"MOB"},
    {nazev:"setup_gps.html",id:"#div_setup_mobil",verze:"MOB"}
  ];
  
  for(var i in arr)
  {
    row = arr[i]
    if(row.verze == "")//šablonu nahrávám vždycky
    {
      sablona_nacti(row)
    }else{//nahrávám jen když je určena pro aktuální verzi
      if(row.verze == config.verze)sablona_nacti(row)
    }
  }
  
}

function sablona_nacti(obj){
  //fce načte jednu šablonu doplní ji kam patří a aktualizuje její vzhled
  
  //alert(akt_lang )
  //akt_lang = "cz"
  var nazev = "templates/" + akt_lang + "/" + obj.nazev
  
  $.when($.get(nazev,"html")).done( function(data){ 
    //clog("=================" + data)
    $(obj.id).append(data) 
    refresh(obj.id)
    
  }).fail( function(){clog("Nenalezena šablona " + obj.nazev);});         
}

function refresh(id){
  
  $(id + " [data-role=slider]").slider().slider("refresh");
  $(id + " [data-role=button]").button();
  $(id + " [data-role=collapsible-set]").collapsibleset().collapsibleset( "refresh" ); //;collapsibleset()
  $(id + " [data-role=collapsible]").collapsible()//.collapsible( "refresh" );
  $(id + " [data-role=popup]").popup()
  $(id + " [type=radio]").checkboxradio().checkboxradio('refresh')
  $(id + " [data-role=controlgroup]").controlgroup();
  //alert(id)         
}
                                                                             

function nastav_server_path(online)
{
  //nastavím server_path pro lokální provoz na notebooku a nebo pro web
  //parametr online je true v případě online verzí a false pro phonegap app. která nemá přístup k netu
  //ale(window.location,"window.location")
  if(String(window.location).search("localhost") != -1)//na notebooku
  {
    server_path = "http://localhost/kamna_server/";
    libs_path = "http://localhost/js_libs/";
    libs_path = "js_libs/";
  }else if(String(window.location).search("android_asset") != -1 || String(window.location).search(".app/") != -1){//PhoneGap aplikace - 1. je Android 2. IOS
    server_path = "http://webredaktor.cz/test/dostal_mobily_2/";
    libs_path = online ? "http://webredaktor.cz/test/dostal_mobily_2/js/" : "js_libs/";
    //libs_path = "js_libs/";
    kde_bezi = "APP"
  }else{//webová verze
    var d = String(window.location).split("/");
    d.splice(-1,1);
    server_path = d.join("/") + "/";
    libs_path = server_path + "js_libs/";
  }
  //kde_bezi = "APP";//natvrdo pro testy
  //json_path = online ? server_path + "mapa_json/" : "mapa_json/";
  var np = navigator.platform
  if(np == "iPod" || np == "iPad" || np == "iPhone") config.device_os = "IOS";
  //alert(np + "  config.device_os " + config.device_os)
  json_path = "mapa_json/";
  clog("server_path " + server_path);
  clog("json_path " + json_path);
  clog("libs_path " + libs_path);
  clog("kde_bezi " + kde_bezi)
  //ale("nastav_server_path");
}

    
    
function vp(data){
  console.log("========")
  for(var i in data)
  {
    console.log(i + " = " + data[i])
  }         
  console.log("======== END")
}

function clog(txt){
  console.log(txt)
  if(arguments[1] == true)$("#div_clog").empty()
  $("#div_clog").append(txt + "<br>")
           
}

function ale(message, title) {
    if (navigator.notification) {
        navigator.notification.alert(message, null, title, 'OK');
    } else {
        alert(title ? (title + ": " + message) : message);
    }
}