var down = down || {};

(function(o){
  
  var pocet_dlazdic = 0;
  var arr_stahnout = [];
  var stahuju = 0;//kolik dlaždic právě stahuju
  var citac = 0; 
  var fce_ok = null;
  var fce_prubeh = null; 
  var dl_najednou = 30;//počet dlaždic, které stahuju souběžně
  var dl_pokracuj = 20;//při kolika souběžných staženích spouštím další download?
  var dl_timeout = 1000;//pauza než zavolám další download 
  var down_timer  = null//pro hlídání aby se ukončil zakouslý download
  var minuly_stav = null;
  var stahujem
  var down_params//jestli se soubory ukládají do DB a další podrobnosti o downloadu
  
  o.start = function(arr_down,fceok,fceprubeh,params){
    //alert("down.start ")
    down_params = params
    stahujem = true;//shozením na false zarazím stahování - třeba timerem
    
    fce_ok = fceok
    fce_prubeh = fceprubeh
    arr_stahnout = arr_down;
    pocet_dlazdic = arr_down.length
    //console.log("počet souborů " + pocet_dlazdic);
    //alert("down.start počet " + arr_stahnout.length)
    dbase.startuj(down.db_ready);//po skončení začni stahovat
    
  }
  
  o.db_ready = function(){
    //volá se po otevření databáze
    stahuj();
  }
  
  function download_kously(){
    //volá se po 5 vteřinách a kontroluje jestli download není zaseklý na poslední dlaždici
    var zbyva = arr_stahnout.length;
    //    $("#xxx").html("zbyva stahnout " + zbyva + "<br>současně stahuju " + stahuju +  "<br>stazeno %  " + proc);
    $("#xxx").text("minuly_stav " + minuly_stav + "  zbyva " + zbyva);
    if(minuly_stav == null)//první volání - jen nastavím 
    {
      minuly_stav = zbyva
      return
    }
    
    if(minuly_stav == zbyva && zbyva < 3 && stahuju < 10)
    {
      clearInterval(down_timer)
      ale("Končím na timer");
      $("#xxx").text("Končím na timer");
      stahujem = false
      fce_ok()
    }
    minuly_stav = zbyva
  }
  
  
  function stahuj(){
    //fce řídí vlastní download dlaždic 
    if(navigator.connection.type == Connection.NONE)
    {
      alert(arr_texty[akt_lang]["jsem_offline"]);
      setTimeout(stahuj,6000);
      return
    }

    
    
    var pocet = Math.min(arr_stahnout.length,dl_najednou);//10 nebo míň když už 10 nemám
    var dl; var uri;
    for(var i=0;i<=pocet;i++){
      dl = arr_stahnout.pop();
      
      //pokus hlídat jestli soubor neexistuje a případně ho nestahovat
      if(dl != undefined){
        if(down_params.typ == "tiles")
        {
          uri = menu.dlazdice_uri(dl.z,dl.x,dl.y)
        }else{
          uri = files.prac_adresar + "/" + dl.nazev;
        }
          
        //alert("stahuju dl " + uri);
        files.file_info(uri,down.file_exist,dl);//zjistí jestli už mám soubor stažený, dlaždici posílám jako parametr
      }
    }
  }

  o.file_exist = function(file,dl)
  {
    //alert("fce file_exist file= " + file)
    if(file == null)
    {
      //alert("file nemám  " + dl.url)
      nacti_dlazdici(dl);//soubor nemám uložený, načtu dlaždici
    }else{
      stahuju ++;//protože po úspěšném uložení počet snižuju, musím ho teď zvýšit i když se vlastně nic nestahuje 
      o.dlazdice_ulozena();//jako kdybych ji legálně stáhl a uložil
      //alert("file mám "  + dl.url)
    }
    
    //else 
  }

  function nacti_dlazdici(dl){
    //načtení jedné dlaždice - zavolá proxy skript a předá mu číslo dlaždice, zoom a doménu
    if(dl == undefined)return;//občas sem zabloudilo s undefined
    
    //if(down_params.typ != "tiles")dl.url = 
    //console.log(dl.url)
    //$("#panel_ajax_error").text(dl.url);
    stahuju ++;//sleduju počet současně stahovaných obr.
    //jQuery.get(url,{},dlazdice_uloz);
     var pr_tile = $.get(dl.url);//
    $.when(pr_tile).done( function(data){ 
      dlazdice_uloz(data)
    })
    .fail( function(){
      clog("PROMIS dlazdice KO url " + dl.url);
      dl["pokusu"] = dl["pokusu"] + 1//u dlaždice si zaznamenávám kolikrát se ji program pokusil stáhnout, pokud se opakovaně nedaří, kašlu na ni 
      if(dl["pokusu"] < 2 && down_params.typ == "tiles")//zkusím celkem 2x (jen dlaždice na obrázky kašlu), pak uložím prádnou dl. Jinak by zůstalo viset a user by se nedočkal konce stahování,
      {
        arr_stahnout.unshift(dl)
        //alert("DLAZDICE KO " + url)
        stahuju--;//odečtu staženou dlaždici jako kdyby se normálně uložila - jinak by se nesputilo stahování další sady
        return
      }else{
        var prazdna = down_params.typ == "tiles" ? mapa.prazdna_dlazdice : "";//na prázdné dlaždici mám text, u obrázků ukládám prázdný řetezec
        dlazdice_uloz(prazdna)
      }
    });
    
    //dlazdice_uloz("DLAZDICE " + url);


    function dlazdice_uloz(data)
    {
      if(!stahujem)return //stahování skončilo na timer, případně stopnul user (snad časem dodělám)
      if(data == "")//dlaždici se nepodařilo stáhnout, doplním ji zase na začátek pole
      {
        
        dl["pokusu"] = dl["pokusu"] + 1//u dlaždice si zaznamenávám kolikrát se ji program pokusil stáhnout, pokud se opakovaně nedaří, kašlu na ni 
        if(dl["pokusu"] < 2)//zkusím celkem 2x, pak uložím prádnou dl. Jinak by zůstalo viset a user by se nedočkal konce stahování
        {
          arr_stahnout.unshift(dl)
          //alert("DLAZDICE KO " + url)
          stahuju--;//odečtu staženou dlaždici jako kdyby se normálně uložila - jinak by se nesputilo stahování další sady
          return
        }
      }
      //alert("file uloz " + dl.name)
      var callback_fce = down_params.db_save ? down.dlazdice_uloz_db : down.dlazdice_ulozena//podle toho jestli se údaje o souboru se mají zapsat do DB nebo ne se volá příslušná callback fce 
      files.soubor_uloz(dl.name,data,callback_fce,dl)
    }
  }

  o.dlazdice_uloz_db = function(dl){
    //alert("uložen soubor uložím do DB");
    //uložení údajú o dlaždici do DB - zatím mám SQL natvrdo
    var sql = "insert into tiles (id, z, x, y) VALUES (?,?,?,?);";
    dbase.execute_query(sql,[dl["id"],dl["z"],dl["x"],dl["y"]],o.dlazdice_ulozena)
  }

  o.dlazdice_ulozena = function(){
    
    stahuju--;//odečtu staženou dl.
    var zbyva = arr_stahnout.length;
    var proc = 100 - Math.round(zbyva * 100/pocet_dlazdic);//stažená procenta
    proc = Math.min(proc,95)//poslední ukážu 95, jinak dlouho visí na 100% dokud se nestáhnou poslední dlaždice
    //alert("dlazdice_ulozena zbyva jich " + zbyva)
    if(proc > 90 && down_timer == null)
    {
      ale("start timeru")
      down_timer = setInterval(function(){download_kously()},10000);
    }
    
    citac ++
    if(citac >5)
    {
      fce_prubeh(proc,zbyva,stahuju);
      clog("ZBYVA " + zbyva + " dlazdic");
      citac = 0
    }

    $("#xxx").html("zbyva stahnout " + zbyva + "<br>současně stahuju " + stahuju +  "<br>stazeno %  " + proc);
    if(zbyva == 0)//všechny požadavky odeslány na server
    {
        if(stahuju == 0)
        {
          //ale("vše staženo")
          clearInterval(down_timer)//zruš timer
          fce_ok()//vse_stazeno()//a všechny dlaždice už uloženy
        }
        
    }else{
        if(stahuju < dl_pokracuj)stahuj()//setTimeout(stahuj,dl_timeout);//přihoď další várku    //setTimeout(stahuj,1000)//
    }
  }
  
  
 

})(down);
