var bind = bind || {};

(function(o){
  
  var hotov 
  o.require_ko_class = "req_prazdny";//class, který nastavím nevyplněným prvkům při kontrole
  o.bind_seznam = [];//
  o.bind_seznam_fce = [];//
  o.init = function(){
    //najde všechny prvky s attributem data-bind a inputům textarea a selectům nastaví reakci na změnu
    $("*[data-bind]").each(function (i) {        
        //odstraním navěšené události jinak se událost volá několikrát, když opakovaně volám init.
        //Některé události navěšuje jquerymobile - třeba Hlavičky collapsible setů mají navěšené události ty odstranit nesmím.
        //Přitom bind můžu využívat abych v collapsible setu měnil v hlavičkách texty
        var nn = $(this)[0].nodeName;
        hotov = $(this).attr("data-bindinit") != undefined ? true : false;//inicializovaným prvkům nastavím stribut abych je příště nechal na pokoji - události se pak volají vícekrát 
        //console.log($(this).attr("data-bindinit"))
        //if($(this).attr("data-bindinit" == "A")) console.log($(this).attr("data-bind"))
        //else  console.log(nn + "    NEEE")
        //if(nn == "TEXTAREA" || nn == "INPUT" || nn == "SELECT")$(this).unbind();
        if(!hotov)
        {
          $(this).attr("data-bindinit","A");//označím jako vyřízený
          if(nn == "INPUT")
          {
            var typ = $(this).attr('type');//typ input pole
            var akce = (typ == "checkbox" || typ == "radio") ? "change" : "keyup";
            $(this).bind(akce,bind_zmena);
          }
          if(nn == "TEXTAREA")$(this).bind("keyup",bind_zmena);
          if(nn == "SELECT")
          {
            if($(this).attr("data-role") == "slider") $(this).bind("slidestop",bind_zmena);
            else $(this).bind("change",bind_zmena);
          }
          
                 
        }
        
      });  
  }

  o.promitni = function(nazev,data)
  {
      //promítnutí hodnot do HTML. Pokud bindované pole v datech neexistuje pole vyčistím aby tam nezůstala minulá hodnota
      
      //nazev - název, který hledám v atrib data-bind např pro data-bind="users.jmeno" nazev by bylo users
      //data - asoc. pole s hodnotami, které chci promítnout
      //alert("BINDD PROMITNI NAZEV " + nazev)
      //vypis_pole(data);
      o.bind_seznam[nazev] = data;//datové pole si uložím a při změnách dat budu změny ukládat do něj
      if(arguments[2] != null)o.bind_seznam_fce[nazev] = arguments[2]
      var maska = "*[data-bind*='" + nazev + ".']";
        var cit = 0;
        //clog("==========================================")
        $(maska).each(function (i) {        
          cit ++
          var nn = $(this)[0].nodeName;
          var db = $(this).attr("data-bind");
          //clog("DATA-BIND " + db)
          
          var param = parse_databind_all(db,nazev)//vrací objekt  např {nazev: "prihlaseny",typ: "value"}
          //for(var i in param)alert(i + " = " + param[i]);
          var hodnota = data[param["nazev"]];//z dat vezmu pole které mám bindovat
          //if(db == "texty.gps_ja")alert("nastavím text " + hodnota)
          if(hodnota != undefined)//hodnota v datech je, nastav ji do pole
          {
            //alert("nastav " + hodnota);
            //alert(main.dokument.trasa)
            if(param["typ"] == "")
            {
              //alert("DATA-BIND " + db)
              
              nastav_dle_elementu(param,nn,nazev,this,hodnota)
            }else{
              nastav_dle_typu(param["typ"],this,hodnota)//přímo mám nadefinované co mám nastavit
            }
          }else{//hodnota v datech není pole musím vyčistit od minulé hodnoty
            //alert("neni " + db);
            hodnotu_vycisti(db,nn,nazev,this,hodnota)
          }
       });
       //alert("pocet poli je " + cit);
  }  

  function nastav_dle_elementu(param,nn,nazev,obj,hodnota){
    //fce nastavuje hodnotu nebo stav pole, ale neví co má nastavit, snaží se to poznat z typu elementu
    //alert(nazev)
    switch(nn)
    {
      case "TEXTAREA":
        $(obj).val(hodnota);
      break;
      case "SELECT":
        $(obj).val(hodnota);
        if($(obj).attr("data-role") == "slider")$(obj).slider("refresh")
      break;
      case "DIV":
        $(obj).html(hodnota);//divu html, pokud dojde jen text nic se neděje 
      break;
      case "A":
        //alert("xx " + hodnota)
        $(obj).attr("title",hodnota);// 
      break;
      case "OPTION":
        //alert(hodnota)
        $(obj).text(hodnota);// 
      break;
      case "INPUT":
        var typ = $(obj).attr("type");
        if(typ == "checkbox")
        {
          if(hodnota == 1)$(obj).attr("checked","checked");
          else $(obj).removeAttr("checked");
          try{$(obj).checkboxradio("refresh")}//refresh je potřeba pokud použiju bind knihovnu s jquerymobile ale bez jquerymobile hlásí chybu proto je v TRY
          catch(err){}
        }else if(typ == "radio"){
          if($(obj).attr("id") == hodnota)
          {
            //alert("zaškrtnu")
            $(obj).attr("checked","checked");
            //alert("zaškrtnuto")
            try{$(obj).checkboxradio("refresh")}//refresh je potřeba pokud použiju bind knihovnu s jquerymobile ale bez jquerymobile hlásí chybu proto je v TRY
            catch(err){}
          }
          
          //alert(hodnota)
        }else{
          $(obj).val(hodnota);
        }
      break;
      
      default://vše ostatní jen holý text
      $(obj).text(hodnota);
    }
    
//     if(nn == "TEXTAREA")$(obj).val(hodnota);//spanu a textarea se dá nastavit jen holý text
//     if(nn == "SPAN" || nn == "LABEL")$(obj).text(hodnota);//spanu a textarea se dá nastavit jen holý text
//     if(nn == "DIV")$(obj).html(hodnota);//divu html, pokud dojde jen text nic se neděje 
//     if(nn == "SELECT")$(obj).val(hodnota);
//     if(nn == "INPUT"){
//       if($(obj).attr("type") == "checkbox")
//       {
//         if(hodnota == 1)$(obj).attr("checked","checked");
//         else $(obj).removeAttr("checked");
//         try{$(obj).checkboxradio("refresh")}//refresh je potřeba pokud použiju bind knihovnu s jquerymobile ale bez jquerymobile hlásí chybu proto je v TRY
//         catch(err){}
//         
//       }else{
//         $(obj).val(hodnota);
//       }
//     } 
  }

  function nastav_dle_typu(typ,obj,hodnota){
    //fce nastaví hodnotu nebo stav pole, neřeší co je pole zač v typ má dáno co má nastavit
    var html;
    if(typ == "size_kb")//pro zobrazení velikosti souboru v KB - (hodnota je v bytech)
    {
      html = Math.round(hodnota/1024) + "&nbsp;KB";
      $(obj).html(html);
    }
    
    if(typ == "value")$(obj).val(hodnota);
    if(typ == "text")$(obj).text(hodnota);
    if(typ == "html")$(obj).html(hodnota);
    if(typ == "display")
    {
      if(hodnota)$(obj).show();
      else $(obj).hide(); 
    }
    if(typ == "visibility")
    {
      var stav = hodnota ? "visible" : "hidden";
      $(obj).css("visibility",stav);        
    }              
  }

//   function hodnotu_nastav(param,nn,nazev,obj,hodnota){
//     //fce nastaví hodnotu příslušnému elementu v DOM
//     //if(nazev == "hotovy")alert(hodnota);
//     if(param["typ"] == "")//typ není daný - musím ho určit podle typu elementu
//     {
//     
//     }else{
// 
//     }
//     if(nn == "SPAN")$(obj).text(hodnota);//spanu se dá nastavit jen holý text
//     if(nn == "DIV")$(obj).html(hodnota); 
//     if((nn == "INPUT" || nn == "TEXTAREA") && (db.search("value:" + nazev) != -1)){
//       if($(obj).attr("type") == "checkbox")
//       {
//         if(hodnota == 1)$(obj).attr("checked","checked");
//         else $(obj).removeAttr("checked");
//       }else{
//         $(obj).val(hodnota);
//       }
//     } 
//     if(nn == "SELECT"  && (db.search("value:" + nazev) != -1))$(obj).val(hodnota);
//     if(db.search("display:" + nazev) != -1)
//     {
//       if(hodnota)$(obj).show();
//       else $(obj).hide(); 
//     }
//     if(db.search("visibility:" + nazev) != -1)
//     {
//       var stav = hodnota ? "visible" : "hidden";
//       $(obj).css("visibility",stav);        
//     }           
//   }
  
  function hodnotu_vycisti(db,nn,nazev,obj,hodnota){
    if(nn == "INPUT" || nn == "TEXTAREA")$(obj).val("");
    if(db.search("text:" + nazev) != -1)$(obj).text("");
    if(db.search("html:" + nazev) != -1)$(obj).html("");           
  }

  function parse_databind_value(obj,co_chci){
    //fce rozparsuje atribut data-bind a vrátí hodnotu jeho zadané části 
    //data-bind má tvar např. value:user.popis,html:neco.nazev
    //value část nemusí být, například u divů není value ale text nebo html
    var data = $(obj).attr("data-bind");// 
    var obj = parse_databind(data);
    return obj[co_chci];           
  }

  function parse_databind(string)
  {
    //fce rozdělí data-bind řetězec a vyrobí z něj asoc. pole, které vrátí
    //data-bind může mít třeba pro select tvar value:user.prihlaseny,html:users.seznam
    //význam je value - vybraná hodnota se nastaví z dat user.prihlaseny
    //a html - čili seznam všech optionů mám v users.seznam
    //jednodušší tvar může mít jen jednu část, pro div třeba html:vyrobek.popis (nacpe do divu html kód) nebo text:vyrobek.popis - doplní jen holý text
    //nebo vždy cpát HTML? když bude holý text nic se nestane
    //případně stačí u divu data-bind="vyrobek.popis"   
    var properties = string.split(',');
    var obj = {};
    properties.forEach(function(property) {
      var prop = jQuery.trim(property);
      var tup = prop.split(':');
      obj[tup[0]] = tup[1];
    });
    return obj;
  }

  function parse_databind_all(attr,nazev){
    //attr - hodnota atributu data-bind 
    //může mít tvar třeba value:user.prihlaseny,html:users.seznam
    //fce rozdělí řetězec podle čárky a pokud jednotlivé části obsahují nazev pak je zařadí do výst pole
    //např attr = value:user.prihlaseny,html:users.seznam
    //nazev = user
    //vezme jen 1. část (2. neobsahuje pole user ale users)
    //výsledkem bude {nazev: "prihlaseny",typ: "value"} - tenhle objekt fce vrátí - použije se pro nastavení hodnoty
    //když není value: nebo html: část definovaná bude typ "" a hodnotu pak nastavím podle toho o jaký element se jedná
    var arr_vyst = null;//výstupní objekt
    var attr_casti = attr.split(',');//rozděl na dílky (většinou bude jen 1, občas 2)
    for(var i in attr_casti)
    {
      var cast = attr_casti[i]
      if(cast.search(nazev + ".") != -1)//hledám název včetně tečky
      {
        var kousky = cast.split(':');
        var typ = ""
        var dat_cast;
        if(kousky.length > 1)
        {
          typ = kousky[0];//co je před dvojtečkou je typ (value, html, text atd)
          dat_cast = kousky[1];//část s názvem pole a indexu v něm, třeba user.jmeno
        }else{
          dat_cast = kousky[0];//část před dvojtečkou není - datová část je ten první kus  
        }
        var drobky = dat_cast.split(".");//rozděl - 1. část je nazev - parametr fce, 2 část je název indexu v poli, kterou chci nabindovat
        //var typ = kousky.length == 1 ? "" : kousky[0];
        arr_vyst = {nazev: drobky[1],typ: typ} ;
      }
    } 
    return arr_vyst;        
  }

  function bind_zmena(event){
    //fce se volá při změně bindovaných polí a promítá novou hodnotu do datového modelu
    //jde o inputy, selecty a textarea. Všechny budou mít data-bind jen jednoduchý, 
    //např. data-bind="user.jmeno" případně data-bind="value:user.jmeno" - ale value už je zbytečné
    //vše se promítá do objektu který je předaný do bind knihovny
    //takže vlastnosti dokumentu jsou v main.dokument.... atd 
    var hodnota;
    var el = event.currentTarget;
    var nn = $(el)[0].nodeName;
    var db = $(el).attr("data-bind");
    var dily = db.split(":");//kdyby náhodou část value byla
    var param = dily.length == 1 ? dily[0] : dily[1];
    var typ = $(el).attr('type');
    //if(db == "dokument.trasa")alert($(el).val())
    //alert("param " + param)
    //var param = parse_databind_all(db,nazev)//vrací objekt  např {nazev: "prihlaseny",typ: "value"}
    //alert($(el).attr('type'))
    if(typ == "checkbox")
    {
      hodnota = $(this).attr("checked") == undefined ? 0 : 1;
    }else if(typ == "radio"){
      hodnota =  $(el).attr("id");
      //alert(hodnota)
    }else{
      hodnota =  $(el).val();
    }
    zapis_data(param,hodnota,el);
  }
  
  function zapis_data(param,hodnota,el){
    //fce provede vlastní zápis dat do objektu pole s daty
    //případně zavolá fci, která se má při změnách volat
    var d = param.split(".");//vždy musí být s tečkou nazevpole.index
    var nazev = d[0];//nazev pole s daty
    var index = d[1];//název indexu v asoc poli
    var pp = o.bind_seznam[nazev][index] = hodnota;
    var fce = o.bind_seznam_fce[nazev];//pokud jsem při promítání poslal i fci, která se má při změně zavolat, zavolám ji
    //alert(fce)
    if(fce != undefined)fce(nazev,index,hodnota,el)
  }
  
  o.zapis_a_promitni = function(nazev,data){
    //všechny údaje z asoc pole data přesype do bidnovacího pole a pak data aktualizuje v DOMu
    var k = "";
    for(var i in data)
    {
      k += i + " = " + data[i] + "\n"; 
      bind.bind_seznam[nazev][i] = data[i]//hodnoty přesypu do bind pole (tím i do skut. pole)
    }
    //alert(k);
    bind.promitni(nazev,bind.bind_seznam[nazev])//aktuální data musím promítnout do formuláře
  }

  o.kontrola_povin = function(nazev)
  {
    //fce najde povinna pole class="req" a pokud jsou prázdná nastaví jim class req_prazdny
    //nazev - je název bindovacího pole, pro které vstupy hlídám
    var ok = true;//stav který vracím - true vše vyplněno, false - chyby
    var maska = ".req[data-bind*='" + nazev + ".']";//vsechna povinna pole
    $(maska).each(function (i) {
      //alert($(this).attr("data-bind") + " val " + $(this).val())
      var nn = $(this)[0].nodeName;
      var hodnota = (nn == "INPUT" || nn == "SELECT" || nn == "TEXTAREA") ? $(this).val() : $(this).text();
      //alert("=" + hodnota + "=")
      if(hodnota == "")
      {
        ok = false
        $(this).addClass(o.require_ko_class);
      }else{
        if($(this).hasClass(o.require_ko_class))$(this).removeClass(o.require_ko_class);        
      }
    });
    return ok
  }

})(bind);