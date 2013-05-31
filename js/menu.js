var menu = menu || {};

(function(o){

  var arr_mapy = null;//seznam map, které se dají stáhnout pro práci offline
  var arr_down = {};//objekt se seznamem map, u každé mám uloženo jestli ji mám staženou
  
  o.start = function()
  {
    clog("json_path " + json_path)
    //if(json_path == undefined)nastav_server_path(config.online)
    clog("FCE menu.start() jdu číst texty ");
    var file = json_path + "texty.json?par=" + Math.random()
    //alert("Načtu " + file)
    jQuery.getJSON( file,texty_nacteny).fail(function() { alert( "KO čtení " + file ); })
  }
  
  
  
  
  function texty_nacteny(data){
    //volá se po načtení textů z config souboru
    //alert(" FCE texty_nacteny");
    //alert(data.cz.gps_ja)
    //alert("akt_lang " + akt_lang)
    //localStorage.clear();
    arr_texty = data 
    if(config.verze == "MOB")switche_vypis(akt_lang)//vytvoř přepínače ve vybraném jazyce
    //switche_vypis(akt_lang)//vytvoř přepínače ve vybraném jazyce
    vypis_jazyky("#cg_jazyky",data.jazyky,akt_lang);//vypiš radiopřepínač pro všechny jazyky v seznamu
    //alert("prvni_start " + localStorage.getItem("prvni_start"))
    if(localStorage.getItem("prvni_start") == null && config.vic_jazyku == true)
    {
      vypis_jazyky("#cg_jazyky_2",data.jazyky,akt_lang);//vypsání jazyků do popup okna které se otevře hned po startu
      $("#popup_lang").css({"min-width": 300}).popup("open");
      localStorage.setItem("prvni_start","N")//uložím aby příště popup s volbou jazyka neotravoval
    }
    //alert(11)
    bind.promitni("texty",arr_texty[akt_lang]);//promítni texty v aktuálním jazyce
    //bind.init(); 
    data_nacti();    
    arr_mapy = config.mapy
    menu.mapy_vypis()//vypiš seznam map - ty jdou stáhnout offline
    switch_on_off()//vypiš přepínač pro přepínání mapy online - offline
    bind.promitni("arr_setup",arr_setup,menu.setup_uloz);//přepni přepínače do stavu, který měl user uložen a při změnách zavolej fci setup_uloz abych na změny reagoval
    bind.init();//znovu jsem vytvořil switche, musím zavolat bind abych je aktivoval
    //vypis("texty_nacteny STOP");
    
    mapa.start()
    
    //
  }

  o.files_nacti = function(){
    //načtení knihoven potřebných pro práci offline - stahování a ukládání souborů    
    //čtení volám až po deviceready abych mohl rovnou se soubory pracovat - ukázat uloženou mapu apod.
    //clog("FCE menu.files_nacti() už je device READY")
    
    var pr_down = $.getScript(libs_path + "down.js");
    var pr_files = $.getScript(libs_path + "files.js");
    $.when(pr_files,pr_down).done( function(){ 
      files.prac_adresar = prac_adresar;
      files.adresar_vytvor();
      clog("OK down.js a files.js načteno")
      fs_ready = true;
      if(arr_setup.mapa_online == 0)//mapa má být offline 
      {
        if(mapa.map_ready)
        {
          clog("MAPA READY VOLAM mapa.tile_layer()")
          mapa.tile_layer()//pokud už se mapa vytvořila vytvoř mapovou vrstvu, pokud ještě mapa není, vytvoří si ji sama až zjistí, že je fs ready
        }else{
          var start_timer = setInterval(function(){mapa_test()},500);
          clog("MAPA ZATIM NENI READY start timeru")
          function mapa_test(){
            if(mapa.map_ready){
              clearInterval(down_timer)
              clog("TIMER TEST už je mapa ready")
              mapa.tile_layer()
            }else{
              clog("MAPA FURT NENI READY timer")
            }     
          }
        }
      }else{
        clog("MAPA MA BYT ONLINE")
      }
    })
    .fail( function(){clog("##### KO nanacetl se files.js nebo down.js  adresar " + libs_path);});
  }

  function switch_on_off(){
    
    var html = '<select data-bind="arr_setup.mapa_online" id="switch_mapa_on_off" data-role="slider">';
    html += '<option value="0">' + arr_texty[akt_lang]["offline"] + '</option><option value="1">' + arr_texty[akt_lang]["online"] + '</option></select>'; 
    //alert(html)
    $("#div_on_off").html(html);
    $("#div_on_off select").slider();
  }

  function data_nacti(){
    //načtení dat pro zobrazení na mapě
    //clog("JSON_PATH " + json_path)
    jQuery.getJSON(json_path + "stitky.json?par=" + Math.random(),stitky_json_nacti_ok);
    jQuery.getJSON(json_path + "mista.json?par=" + Math.random(),mista_json_nacti_ok);
    jQuery.getJSON(json_path + "trasy.json?par=" + Math.random(),trasy_json_nacti_ok);
    jQuery.getJSON(json_path + "rt_zpravy.json?par=" + Math.random(),rt_zpravy_nacti_ok);
  }

  
  function rt_zpravy_nacti_ok(data){
    //fce se volá po ajaxovém načtení reportáží RT
    //console.log("rt_zpravy_nacti_ok")
    mapa.arr_mista_rt_set(data)
    main.arr_mista_rt = data
    //console.log(data)
    //alert(data)
    jQuery.getJSON(json_path + "rt_kategorie.json?par=" + Math.random(),rt_kat_nacti_ok);
    function rt_kat_nacti_ok(kat){
      //console.log("rt_kat_nacti_ok")
      main.arr_kat_rt = kat
      videa_menu_vytvor(kat,data)           
    }
  }

  function videa_menu_vytvor(kat,data){
    var row;
    var html = '<ul data-role="listview" data-inset="true">';
    //console.log(data)
    for(var i in data)
    {
      row = data[i]
      //console.log(i + " = " + data[i]["datum"])
      html += '<li><a href="#" onclick="menu.reportaz_z_menu_ukaz('+ row["id"] +')"><h2>' + row.nazev + '</h2>';//'  <ul data-role="listview" data-inset="true">
      html += '<p>'+ row.datum +'</p></a></li>';
    }
    //console.log(html)
    html += '</ul>';
    $("#div_videa_seznam").html(html);
    //vp(main)         
  }

  function main_data_radek_najdi(arr_nazev,id_nazev,id){
    var data = main[arr_nazev]
    for(var i in data)
    {
      if(data[i][id_nazev] == id)return data[i]
    }       
    return {}
  }

  o.reportaz_z_menu_ukaz = function(id){
    //fci volá klik na RT reportáž v seznamu reportáží - zobrazí video s reportáží 
    var row = main_data_radek_najdi("arr_mista_rt","id",id)
    vp(row)
    //console.log("NAME " + znacka.options.name)
    //akt_misto = arr_mista_rt[znacka.options.name];
    //alert(config.verze)
    if(config.verze == "PC")video_player_pc(row)
    else mapa.video_spust(row);
    //video_player_pc(akt_misto)         
  }


  function mista_json_nacti_ok(data){
    //fce se volá po úspěšném načtení míst přes json
    //vypis("mista_json_nacti_ok")
    mapa.arr_mista_set(data)
    //mapa.mista_ukaz(false)
    for(var i in data)
    {
      //if(data[i]["stitky_trasa"] != undefined)alert(data[i]["nazev"] + " " + data[i]["stitky_trasa"]);
    }          
  }

  function stitky_json_nacti_ok(data){
    //vypis("stitky_json_nacti_ok")
    arr_stitky = data
    //naplním si asoc pole arr_zobrazit - index je id štítku v DB, hodnotu nastavím všem na true - při startu vypíšu všechny štítky
    //pokud pak v menu něco vypnu - nastaví se tím v arr_zobrazit na false a z mapy se smaže
    //alert("stitky_json_nacti_ok")
    
    stitky_vypis_2();//vypiš checkboxy s kategoriemi - v aktuálně nastaveném jazyce         
  }

  function trasy_json_nacti_ok(data){
    //seznam tras načten - vyrobím z něj nabídku
    //alert("trasy_json_nacti_ok")
    var html = "";
    var klik = "";
    arr_trasy = data
    for(var i in arr_trasy)
    {
      var row = arr_trasy[i]
      var nazev = row["nazev"]
      var popis = row["popis_" + akt_lang]
      if(row["dokument_typ"] == "trasa")
      {
        klik = 'mapa.trasa_ukaz(' + i + ')';
      }else{
        klik = 'mapa.osm_trasa_ukaz(' + row["id_dokumentu"] + ')';
      }
      //klik = row["dokument_typ"] == "trasa" ? 'mapa.trasa_ukaz(' : 'mapa.osm_trasa_ukaz(';
      //clog(nazev);
      html += '<li><a href="#" onclick="' + klik + '"><h2>' + nazev + '</h2><p>' + popis + '</p></a></li>';
      //html += '<li><a href="#" onclick="' + klik + '"><h2>' + nazev + '</h2></a></li>';
    }
    mapa.arr_trasy_set(arr_trasy)
    if(config.verze == "PC")
    {
      $("#lv_trasy_panel").html(html).css({"max-height": screen_h * 0.9,"max-width": "300px"}).listview().listview("refresh");
    }else{
      //alert(html)
      $("#lv_trasy").css({"max-height": screen_h * 0.9}).html(html);
      $("#lv_trasy ul").listview().listview("refresh");//,"max-width": screen_w * 0.8
    }
    //var cil = config.verze == "PC" ? "#lv_trasy_panel" : "#lv_trasy";//kam mám seznam vypsat
    
    
    //$(cil + " ul")
    //$("#lv_trasy").html(html);//.listview().listview("refresh");           
  }

  o.trasy_seznam_ukaz = function(){
  }

  function switche_vypis(lang)
  {
    //vytvoření switchů pro nastavení chování GPS
    switch_vypis("mapa_ja",lang)
    switch_vypis("gps_ja",lang)
    bind.promitni("arr_setup",arr_setup,menu.setup_uloz);//přepni přepínače do stavu, který měl user uložen a při změnách zavolej fci setup_uloz abych na změny reagoval
    bind.init();//znovu jsem vytvořil switche, musím zavolat bind abych je aktivoval
  }
  
  function switch_vypis(id,lang){
    //vytvoří jeden přepínač ANO-NE
    //přepnutí se bude promítat do pole arr_setup
    //alert(id)
    var sl_id = "sl_" + id;
    var html = '<select data-bind="arr_setup.' + id + '" id="' + sl_id + '" data-role="slider">';
    html += '<option value="0">' + arr_texty[lang]["ne"] + '</option><option value="1">' + arr_texty[lang]["ano"] + '</option></select>'; 
    //alert(html)
    $("#switch_" + id).html(html); 
    $("#" + sl_id).slider();   
  }

  function vypis_jazyky(id,arr,akt){
    //fce vytvoří skupinu checkboxů pro všechny exist. jazyky a vybere aktuálně vybraný jazyk
    return
    //alert(id)
    var html = "";
    var selected;
    for(var i in arr)
    {
        ch_name =  arr[i]["id"];//"ch_" +
        clog("CH NAME " + ch_name) 
        selected = akt == ch_name ? "checked"  : "";
        html += '<input ' + selected + ' type="radio" data-bind="arr_setup.akt_jazyk" name="akt_jazyk" id="' + ch_name + '"><label for="' + ch_name + '">' + arr[i]["nazev"] + '</label>';
    }  
    $(id).html(html);
    $(id + " input").checkboxradio();
    $(id).controlgroup({ corners: true });         
  }
  
  o.setup_uloz = function(arr,index,hodnota){
    //fce se volá kdykoliv user změní něco v nastavení v poli arr_setup - volání zařídí bind.js
    //uloží aktuální nastavení a pokud došlo k změně jazyka vymění v programu texty
    //alert("setup_uloz index " + index)
    localStorage.setItem("setup", JSON.stringify(arr_setup));
    console.log("setup_uloz index " + index + " hodnota " +  hodnota) 
    //alert("posouvat mapu " + arr_setup.mapa_ja)
    if(index == "gps_ja")//změna zobrazování mojí pozice na mapě
    {
      if(hodnota == 1)
      {
        mapa.kde_jsem_zjisti()//nahoď  sledování      
      }else{
        mapa.kde_jsem_smaz();//smaž puntík
        gps.konec()//zastav sledování
      } 
    }
    if(index  == "mapa_online")//user přepnul mapu na online nebo offline
    {
      setTimeout(mapa.tile_layer,500);
    }
    
    if(index == "akt_jazyk")//změna jazyka
    {
      //alert(hodnota)
      akt_lang = hodnota
      switche_vypis(hodnota)//switche neumím změnit, jen smazat a znova vytvořit s novými texty
      //alert("=" + arr_texty[hodnota]["sel_vse"] + "="); //= "AAA"
      bind.promitni("texty",arr_texty[hodnota]);//nasyp nové texty
      
      stitky_vypis_2();//vypiš checkboxy s kategoriemi - v aktuálně nastaveném jazyce
      $.mobile.page.prototype.options.backBtnText = arr_texty[hodnota]["zpet"];//text pro aut. tl. zpět
    }
    $("#popup_lang").popup("close")//fce se volá i z popup okna po startu appky a tam musím popup zavřít
  }
  
//   o.stitky_nacti_ok = function(data){
//     //načetly se štítky - naplním seznam na přepínání co chci ukázat
//     //alert(11)
//     arr_stitky = data.stitky
//     //naplním si asoc pole arr_zobrazit - index je id štítku v DB, hodnotu nastavím všem na true - při startu vypíšu všechny štítky
//     //pokud pak v menu něco vypnu - nastaví se tím v arr_zobrazit na false a z mapy se smaže
//     for(var i in arr_stitky)
//     {
//       if(arr_stitky[i]["typ"] == "druh")arr_zobrazit[arr_stitky[i]["id"]] = false;
//     }
//     
//     stitky_vypis_2();//vypiš checkboxy s kategoriemi - v aktuálně nastaveném jazyce
//   }
  
  
  
  o.zaskrtni  = function(e){
    //fci volá checkbox vyber Vše/Nic
    //do pole arr_zobrazit nastaví aktuální stav a zaškrtne nebo odškrtne všechny checkboxy
    var vybrat = $(e.target).attr("checked") == "checked" ? true : false;
    $("#cg_druh .chb").each(function (i){
      var id = $(this).attr("id")
      arr_zobrazit[id] = vybrat;
      if(vybrat)
      {
        $(this).attr("checked","checked").checkboxradio('refresh');
      }else{
        $(this).removeAttr("checked").checkboxradio('refresh');//.attr("checked","")
      }
      //$(this)
    });
  }

  function stitky_vypis_2(){
    //vypíše seznam kategorií které lze na mapě zobrazit ve formě listview
    //po kliknutí na položku se okamžitě přepínám zpět na mapu
    var html = '<ul data-role="listview" data-inset="true">';
    var label;
    var row;
    //var nazev = "nazev_" + akt_lang;
    var citac = 0;
    for(var i in arr_stitky)
    {
      label = arr_stitky[i]["nazev_" + akt_lang]
      row = arr_stitky[i]
      var hh = ""
      //for(var ii in row) alert(row[ii])//hh += ii + " = " row[ii] + "\n"
      //alert(hh)
      if(arr_stitky[i]["typ"] == "druh" && label != "")
      {
        //alert(arr_stitky[i]["id"]);
        html += '<li><a href="#" onclick="mapa.kategorie_zobraz(' + arr_stitky[i]["id"] + ')">' + label + '</a></li>';
        //html += '<li><a href="#" onclick="mapa.kategorie_zobraz(' + arr_stitky[i]["stitky_druh"] + ')">' + label + '</a></li>';
        citac ++
      }
    }
    html += '</ul>';
    //alert("počet je " + citac)
    var cil = config.verze == "PC" ? "#div_kategorie" : "#div_panel_content";//kam mám seznam vypsat
    $(cil).html(html).css({"max-height": screen_h * 0.9});
    if(config.verze == "PC")$(cil + " ul").listview().listview("refresh");
    //alert("stitky_vypis_2 OK")
  }
  
  
  
//   function stitky_vypis(){
//     //vypíše seznam checkboxů - kategorií které lze na mapě zobrazit
//     //user může vybrat více kategorií, které chce na mapě najednou vidět
//     //jako 1. checkbox pro výběr všechno/nic
//     var html_all = '<input class="chb" onchange="menu.zaskrtni(event)" type="checkbox" name="ch_all" id="ch_all"><label for="ch_all">' + arr_texty[akt_lang]["sel_vse_nic"] + '</label>';
//     var html = "";
//     var label;
//     var checked;
//     
//     //var nazev = "nazev_" + akt_lang;
//     //alert(nazev)
//     for(var i in arr_stitky)
//     {
//       label = arr_stitky[i]["nazev_" + akt_lang]
//       if(arr_stitky[i]["typ"] == "druh" && label != "")
//       {
//         var id = arr_stitky[i]["id"]
//         ch_name = id//"ch_" + id
//         checked = arr_zobrazit[id] ? "checked" : "";//když je v arr_zobrazit true - bude zaškrtlý jinak ne
//         html += '<input class="chb" ' + checked + ' onchange="menu.zobrazeni_zmena(event)" type="checkbox" name="' + ch_name + '" id="' + ch_name + '"><label for="' + ch_name + '">' + label + '</label>';
//       }
//     }
//     //alert(html)
//     $("#div_sel_all").html(html_all);
//     $("#div_sel_all .chb").checkboxradio();
//     $("#cg_druh").html(html);
//     
//     $("#cg_druh .chb").checkboxradio();
//     $("#cg_druh").controlgroup({ corners: true });
//     //var h = screen_h/2
//     $("#cg_druh_over").css({"height": screen_h*0.6});
//     //$("#div_menu_open").bind("vclick",panel_vysun);           
//   }

  o.zobrazeni_zmena = function(e){
    //fci volají změny checkboxů v seznamu co chce user mít na mapě zobrazené
    //aktuální stav si uložím do arr_zobrazit - po návratu na mapu podle toho vypíšu značky
    //var stav = $(e.target).attr("checked") == "checked" ? true : false;
    var id = $(e.target).attr("id")
    arr_zobrazit[id] = $(e.target).attr("checked") == "checked" ? true : false;
   //alert(id + "stav " + stav);
  
  }

  o.vyber_co_zobrazit = function()
  {
    //ukážu výběr všech štítků - user zaškrtne co chce na mapě zobrazit
    //na mobilu je to samostatná stránka na PC postranní panel
    //alert("config.verze " + config.verze)
    if(config.verze == "PC")
    {
      $("#panel_kategorie").css({"height":screen_h}).trigger( "updatelayout" ).panel( "toggle" );
    }else{
      $.mobile.changePage("#page_setup1");
    }
  
  }
  
  o.panel_trasy_ukaz = function()
  {
    //ukáže seznam tras - na samostatné stránce nebo panelu
    if(config.verze == "PC")
    {
      $("#panel_trasy").css({"height":screen_h}).trigger( "updatelayout" ).panel( "toggle" );
    }else{
      //alert("refresh")
      //$("#lv_trasy").text("ahoj")//.listview().listview("refresh");
      //alert("prepnu stranku")
      $.mobile.changePage("#page_trasy"); 
    }
  }

  o.panel_jazyky_ukaz = function()
  {
    //ukážu panel s vlaječkami
    //na mobilu je to samostatná stránka (volím přímo přes #) na PC postranní panel
    $("#panel_setup").css({"height":screen_h}).trigger( "updatelayout" ).panel( "toggle" );
  }

  o.jazyk_zmena = function(jazyk){
    //fci volá klik na vlaječku - přepnutí jazyka u PC verze
    akt_lang = jazyk  
    bind.promitni("texty",arr_texty[akt_lang]);//nasyp nové texty
    stitky_vypis_2();//vypiš checkboxy s kategoriemi - v aktuálně nastaveném jazyce
    $.mobile.page.prototype.options.backBtnText = arr_texty[akt_lang]["zpet"];//text pro aut. tl. zpět
    $("#panel_setup").panel("close");
  }

  o.pop_test = function(){
    //pokus nacpat celý setup do popup okna
    //$('#pop_collapse [data-role=collapsible]').trigger( 'updatelayout' );
    //$('#pop_collapse').find('div[data-role=collapsible]').collapsible({refresh:true});
    //$('div[data-role=collapsible]').trigger("create");//.collapsible().collapsible({refresh:true});
    //$('#pop_collapse').find('div[data-role=collapsible-set]').collapsibleset("refresh")//.trigger("create");//.collapsible({refresh:true});
    //$("#page_mapa").page();
    //$("#cs_jazyk").trigger('create');//.listview().listview("refresh");
    $("#page_mapa").trigger("create");
    setTimeout(otevri,600);
    function otevri(){
      $("#popup_setup").popup({ positionTo: "origin" }).popup("open",{y:0}); //.css({"height": screen_h*0.8})         
    }
    
    
    //$("#popup_setup").css({"height": screen_h*0.8}).popup("open"); //,"height": screen_h*0.8    {"width": screen_w/3}
  
  }
  
  o.panel_vysun = function(){
    //$("#cg_druh input").checkboxradio( "refresh" );
     //alert(config.verze)
     if(config.verze == "PC")
     {
      
      $("#panel").css({"height":screen_h}).trigger( "updatelayout" ).panel( "toggle" );
     }else{
      $.mobile.changePage("#page_setup");
     }
    
    //$( "#panel" ).css({"height":screen_h}).trigger( "updatelayout" ).panel( "toggle" );
           
  }
  
  o.oblibena_mista = function()
  {
    
  
  }
                          
  function download_stav_zjisti(){
    
    if(localStorage.getItem("mapy_off") == null)//nic uloženého nemám
    {
      for(var i in arr_mapy)arr_down[arr_mapy[i]["id"]] = 0;
    }else{
      arr_down = JSON.parse(localStorage.getItem("mapy_off"));//localStorage.setItem('mapy_off', JSON.stringify(data));
    }
    //var arr_down = {"ltm":"0", "lovo":"0", "tere":"1"};           
  }                          
                          

  o.mapy_vypis = function()
  {
    //vypsání seznamu všech map/měst které půjdou stáhnout pro offline
    download_stav_zjisti()//zjistí jaké mapy mám už uložené
    var m;
    var html = "";
    var down;
    for(var i in arr_mapy)
    {
      m = arr_mapy[i]
      html += '<div class="ui-grid-a">';
      html += '<div class="ui-block-a"><h3>' + m["mesto"] + '</h3></div>';
      html += '<div class="ui-block-b" id="dw_' + i + '">'+ down_switch(i,m) + '</div>';
      html += '</div>';
      //if(m["zoom_max"] == "")html += select_max_zoom(i,m)
    }
    
    $("#div_mapy").html(html)
    $("#div_mapy .ui-block-b select").slider()
    //$("#div_mapy .ui-block-b select").selectmenu('refresh')
    bind.promitni("down_setup",arr_down,menu.down_switch_zmena);//přepni přepínače do stavu, který měl user uložen a při změnách zavolej fci setup_uloz abych na změny reagoval
    bind.init();//znovu jsem vytvořil switche, musím zavolat bind abych je aktivoval
  }


//   o.mapy_vypis = function()
//   {
//     
//    //verze kde se dá vybrat v jakém rozlišení chci mapu stáhnout      
      //vypsání seznamu všech map/měst které půjdou stáhnout pro offline
//     download_stav_zjisti()//zjistí jaké mapy mám už uložené
//     var m;
//     var html = "";
//     var down;
//     for(var i in arr_mapy)
//     {
//       m = arr_mapy[i]
//       html += '<div class="ui-grid-b"><div class="ui-block-a"><h3>' + m["mesto"] + '</h3></div>';
//      
//       down = m["zoom_max"] == "" ? down_select(i,m) : "";
//       html += '<div class="ui-block-b" id="dwtext_' + i + '">'+ down + '</div>';
//       html += '<div class="ui-block-c" id="dw_' + i + '">'+ down_switch(i,m) + '</div>';
//       html += '</div>';
//       //if(m["zoom_max"] == "")html += select_max_zoom(i,m)
//     }
//     
//     $("#div_mapy").html(html)
//     $("#div_mapy .ui-block-c select").slider()
//     //$("#div_mapy .ui-block-b select").selectmenu('refresh')
//     bind.promitni("down_setup",arr_down,menu.down_switch_zmena);//přepni přepínače do stavu, který měl user uložen a při změnách zavolej fci setup_uloz abych na změny reagoval
//     bind.init();//znovu jsem vytvořil switche, musím zavolat bind abych je aktivoval
//   }

  function down_select(i,m){
    //zatím nepoužito - výběr v jakém rozlišení chci mapu stáhnout - plánoval jsem použít pro celý kraj 
    var txt = arr_texty[akt_lang]
    var html = '<select  id="sel_down_zoom" data-inline="true" data-bind="arr_setup.down_zoom">'
    html += '<option value="11">'+ txt["zoom_min"] + '</option>'
    html += '<option value="15">'+ txt["zoom_stred"] + '</option>'
    html += '<option value="18">'+ txt["zoom_max"] + '</option>'
    html += '</select>'
    //html += '<a href="#" data-role="button" data-icon="info" data-iconpos="notext" data-theme="c" data-inline="true">Info</a>'
    //alert(html)
    return html         
  }

  function select_max_zoom(i,m){
    //vyrobí táhlo pro nastavení maximálního zoomu
    //var html = '<input type="range" id="max_zoom_'+ m["id"] +'"  min="'+ m["zoom_min"] +'" max="18" value="'+ m["zoom_min"] +'">';
    var zoom_min_2 = parseInt(m["zoom_min"]) + 1
    var html = '<div data-role="rangeslider">'
    html += '<input type="range" name="range-10a" id="range-10a" min="'+ m["zoom_min"] +'" max="17" step="1" value="'+ m["zoom_min"] +'">'
    html += '<input type="range" name="range-10b" id="range-10b" min="'+ zoom_min_2 +'" max="18" step="1" value="15">'
    html += '</div>'
    //alert(html)
    return html;           
  }

  function down_switch(id,m){
    //vypsání jednoho switche pro download mapy jednoho města
    //console.log("switch id downs_" + id);
    var html = '<select class="down_switch" data-bind="down_setup.' + m["id"] + '" id="' + id + '" data-role="slider">';
    html += '<option  value="0">' + arr_texty[akt_lang]["stahnout"] + '</option><option value="1">' + arr_texty[akt_lang]["stazeno"] + '</option></select>'; 
    html += '<div class="prubeh" id="prubeh_' + id + '"></div>';
    return html;            
  }


  //var akt_down_but = null;
  var akt_down_switch = null;
  var akt_down_switch_id = null;
  var switch_locked = false;
  
  o.config_vrat_mapu = function(index){
    //projede seznam map v config.json a vrátí tu s hledaným indexem 
    for(var i in config.mapy)
    {
      if(config.mapy[i]["id"] == index)return config.mapy[i]
    }
    return null
  }
 
 
  o.down_switch_zmena = function(arr,index,hodnota,el){
    //fci volá změna switchů pro download map (fce se zavolá díky bindu)- podle stavu mapu stáhnu nebo smažu z DB
    //console.log("  index " + index)
    if(switch_locked)return //probíhá nějaká akce, nereaguj
    switch_locked = true
    akt_down_switch = el
    //setTimeout(odemkni,3000);
    $("#xxx").text("down_switch_zmena " + hodnota);

    akt_down_switch_id = $(el).attr("id");//switche mají jen čísla 0 - podle počtu map
    var mapa = menu.config_vrat_mapu(index)//z map vyberu tu jejíž switch user přepnul (index - id mapy)
    //console.log(i + "  = " + arr[i])
    arr_down[index] = hodnota//zapamatuju si momentální stav přepínače



    if(hodnota == 1)//zapnuto - download
    {
      //console.log("mapa lat_min " + mapa["lat_min"] );
      setTimeout(mapa_stahuj,200)//zlobí, kdy se pustí hned
    }else{//vypnuto - smazání uložených map
      setTimeout(fakt_smazat,200)//dotaz jestli fakt chce smazat
    }
    function fakt_smazat(){
      //když user nepotvrdí smazání přepnu switch zpět na zapnuto
      if(!confirm("Opravdu smazat mapu?"))
      {
        $(el).val(1).slider("refresh");
        arr_down[index] = 1//zase změň zpátky       
      }else{
        download_stav_uloz()//ulož co máš staženo
        $(".down_switch").slider("disable");//po dobu operace switche zamkni
        switch_locked = false//po ukončení zas může switch reagovat
        smaz_dlazdice(index)//smaž soubory dlaždic
      }
    }
    

    
    function mapa_stahuj()
    {
      //spustím stažení mapy
      $(".down_switch").slider("disable");
      switch_locked = false//po ukončení zas může switch reagovat
      if(dbase.db == null)dbase.db_open();
      var arr_down = spocti_dlazdice(mapa);
      clog("jdu stahovat pocet " + arr_down.length,true)
      var params = {db_save:true,typ:"tiles"}
      $("#prubeh_" + akt_down_switch_id).text("0 %")
      down.start(arr_down,menu.download_ok,menu.download_stav,params)
    }
  }
  
  function spocti_dlazdice(par){
    //fce vypočte počet dlaždic (pro všechny stupně zoomu), zjistí jejich čísla a všechno uloží do pole
    //pak budu postupně číst dlaždice ze serveru dokud nebude pole prázdné
    //vrací pole s údaji dlaždic které je potřeba stáhnout
    var arr_stahnout = [];//
    var zoom_min = parseInt(par.zoom_min);
    var zoom_max = parseInt(par.zoom_max);  

    var zoom; var url; var name;
    var domeny = ["a","b","c"];
    var domena;
    var citac = 0;
    var pocet = 0;
    var x_min; var x_max; var y_min; var y_max;
    
    for(zoom=zoom_min;zoom<=zoom_max;zoom++){
      //alert("zoom " + zoom)
      x_min = lng2tile(par.lng_min,zoom);
      x_max = lng2tile(par.lng_max,zoom);
      y_max = lat2tile(par.lat_min,zoom);
      y_min = lat2tile(par.lat_max,zoom);
      pocet = pocet + (x_max - x_min + 1) * (y_max - y_min + 1);
      //console.log("x_min " + x_min + " x_max " + x_max + " y_min " + y_min + " y_max " + y_max);
      //alert("ZOOM "+ zoom +" x_min " + x_min + " x_max " + x_max + "\n" + " y_min " + y_min + " y_max " + y_max)
      for(var i=x_min;i<=x_max;i++){
        for(var j=y_min;j<=y_max;j++){
          domena = domeny[citac];
          citac++
          if(citac > 2)citac = 0;
          url =  server_path  + 'tile_download.php?z=' + zoom + '&x=' + i + '&y=' + j + '&d=' + domena + '&typ=b64';
          name = zoom + '_' + i + '_' + j + '.txt';
          arr_stahnout.push({id: par.id, z: zoom, x: i, y: j,d: domena,pokusu:0,url:url,name:name});//pokusu - kolikrát se program pokusil dl. stáhnout
        }
      }
    }
    return arr_stahnout
  }

  //převody GPS souřadnic na číslo dlaždice
  function lng2tile(lon,zoom) {lon = parseFloat(lon); return (Math.floor((lon+180)/360*Math.pow(2,zoom))); }
  function lat2tile(lat,zoom)  {lat = parseFloat(lat); return (Math.floor((1-Math.log(Math.tan(lat*Math.PI/180) + 1/Math.cos(lat*Math.PI/180))/Math.PI)/2 *Math.pow(2,zoom))); }

  
  function smaz_dlazdice(id){
    //z DB načte seznam dlaždic patřících k mapě, které se mají smazat
    //výsledky dostane fce, která zjistí jestli dlaždice nepatří ještě k jiné mapě
    id_mazu = id//id mapy, kterou mažu
    citac_smazano = 0//vynuluju, může být nastavený od minulého mazání
    var sql = "select * from tiles where id=? order by z, x, y";
    dbase.execute_query(sql, [id], menu.soubory_pocty_zjisti,id_mazu)
  }
  
  var arr_smazat = [];
  var citac_smazano = 0;
  var id_mazu;//id mapy z config.json, kterou momentálně mažu ltm, tere apod
  
  o.soubory_pocty_zjisti = function(arr,res,id){
    //fce dostane pole načtené z DB s dlaždicemi ke smazání
    //projede pole pro každý záznam zjistí jestli se soubor s dlaždicí má smazat a případně ho smaže 
    
    var sql; var row; var last = false;
    arr_smazat = arr
    if(arr_smazat.length == 0)
    {
      smazano() //nevím proč, ale není co mazat
    }else{
      //alert("mam smazat celkem " + arr_smazat.length);
      o.mazeme()
    }
  }
  
  o.mazeme = function(){
    //fce se volá dokud není pole arr_smazat prázdné
    if(arr_smazat.length == 0)
    {
      smazano()
      return
    }
    
    row = arr_smazat.pop()
    //nejdřív v DB zjistím jestli dlaždice nepatří ještě k jiné mapě, pak ji nemůžu smazat
    //$("#xxx").text(row["id"] + " " + row["x"] + " " + row["y"] + " " + row["z"] + " zbyva " + arr_smazat.length);
    sql = "select count(*) as pocet from tiles where id<>? and x=? and y=? and z=?";
    dbase.execute_query(sql, [row["id"],row["x"],row["y"],row["z"]], menu.soubory_smazat,row)
  }
  
  o.soubory_smazat = function(arr,result,row){
    //fce smaže soubor s dlaždicí pokud tato nepatří k jiné mapě
    //alert("pocet je " + arr[0]["pocet"])
    //citac_smazano ++;//i dlaždice co nemažu započítávám do smazaných kvůli ukazateli průběhu
    if(arr[0]["pocet"] > 0)
    {
      //alert("nemažu patří i k jiné mapě " + row["id"] + " " + row["x"] + " " + row["y"] + " " + row["z"])
      o.mazeme();//jedu na další dlaždice
      return //nemažu patří i k jiné mapě
    }
    
    //dlaždice nepatří k žádné jiné mapě, můžu ji vydusit
    //var row = params["row"]
    //console.log("mažu dl " + row.x + "_" + row.y + "_" + row.z)
    var url = o.dlazdice_uri(row.z,row.x,row.y)//files.prac_adresar + "/" + row.z + "_" + row.x + "_" + row.y + ".txt" 
    //alert("file uri " + url);
    //alert("id mapy je " + row.id);
    citac_smazano ++;
    files.soubor_smaz(url,menu.soubor_smazan)
    //menu.soubor_smazan(true)
  
  }
  
  function smazano(){
    //mazání hotovo
    //alert("Vše smazáno id_mazu je " + id_mazu);            
    $(".down_switch").slider("enable")
    $("#prubeh_" + akt_down_switch_id).text("");
    //teď už můžu vydusit z DB i záznam o jednotlivých dlaždicích
    dbase.execute_query("delete from tiles where id=?",[id_mazu])
    
  }
  
  o.soubor_smazan = function(stav){
    //volá se po smazání souboru
    //alert("soubor_smazan stav = " + stav)
    //alert("info nazev " + stav.name)
    var proc = Math.round(100 * citac_smazano/arr_smazat.length)
    proc = Math.min(95,proc)
    $("#prubeh_" + akt_down_switch_id).text("Smazáno " + proc + " %");
    //setTimeout(o.mazeme,500)
    o.mazeme()
  }
  
  function download_stav_uloz(){
    console.log(JSON.stringify(arr_down));
    localStorage.setItem('mapy_off', JSON.stringify(arr_down));           
  }
  
  o.download_ok = function()
  {
    //volá se po ukončení downloadu - odemkne switche a schová text s %    
    download_stav_uloz()//ulož co máš staženo
    $(".down_switch").slider("enable")
    $("#prubeh_" + akt_down_switch_id).text("");
    //alert(arr_texty[akt_lang]["stazeno"]);
  }

  o.download_stav = function(text,zbyva,stahuju)
  {
    //volá se po stažení deseti dlaždic - vypíše akt stav v %
    $("#prubeh_" + akt_down_switch_id).text(text + " %")//" zbyva " + zbyva + " stahuju " + stahuju);
  }

  o.dlazdice_uri = function(z,x,y){
    //fce vrací název souboru do kterého je uložena dlaždice v base64 kódování
    var uri = files.prac_adresar + "/" + z + "_" + x + "_" + y + ".txt"
    return uri
  }

  o.panel_vysun = function(nazev){
    //vysunutí panelu podle předaného názvu
    $("#panel_" + nazev).panel("open");
  }


})(menu);