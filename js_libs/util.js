var util = util || {};

(function(o){
  
    var spinner = null
    var spinner_options = {
      lines: 10, // The number of lines to draw
      length: 7, // The length of each line
      width: 2, // The line thickness
      radius: 3, // The radius of the inner circle
      corners: 1, // Corner roundness (0..1)
      rotate: 0, // The rotation offset
      color: '#666666', // #rgb or #rrggbb
      speed: 1, // Rounds per second
      trail: 60, // Afterglow percentage
      shadow: false, // Whether to render a shadow
      hwaccel: false, // Whether to use hardware acceleration
      className: 'spinner', // The CSS class to assign to the spinner
      zIndex: 2e9, // The z-index (defaults to 2000000000)
      top: 'auto', // Top position relative to parent in px
      left: 'auto' // Left position relative to parent in px
    };


  
  o.validate_email = function(id) {
    //ověří jestli user zadal e-mail a jestli je platný     
    var email = $(id).val();                             
    if(email == $(id).attr("title") || email == "")//title kontroluju, protože někde používám labelify a to vpisuje do políčka jeho title
    {
      alert("Zadejte e-mailovou adresu.");
      $(id).focus();
      return false;
    }
    var reg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
    if(reg.test(email) == false) {
      alert('Neplatná e-mailová adresa');
      $(id).focus();
      return false;
    }
    return true;
  }
    
  o.dilek = function(neco,ktery,splitter)
  {
    //rozdělí text podle zadaného znaku a vrátí zadaný dílek 
    if(splitter == undefined)splitter = "_";
    var d = neco.split(splitter);
    return d[ktery];
  }

  o.input_kladny = function(id){
    //fce vrací true, když je input kladné číslo. prázdný 0 nebo záporný vyhodí hlášku a pak vrátí false 
    //Když má pole attr title, ukáže ho jako alert 
    var pocet = parseInt($(id).val());
    if(pocet == 0 || isNaN(pocet))
    {
      var title = $(id).attr("title");
      if(title != undefined && title != "")alert(title);
      $(id).focus();
      return false; 
    }else{
      return true;
    }
  };

  o.vycentruj = function(id){
    //vycentruje panel na střed obrazovky
    var w = $(id).width();
    var h = $(id).height();
    var left = $(window).width()/2 - w/2;
    var top = $(window).height()/2 - h/2 + $("body").scrollTop();
    $(id).css({"left": left ,"top": top});
  }

  o.jen_des_cisla = function(e)
  {
    //alert("jen_des_cisla");
    try{var kl = e.keyCode;}
    catch(e){return true; }
    //if(kl != 16)alert(kl);
    //return true;
    //alert(kl)
    if(kl == 67 && e.ctrlKey)return true;//crtl-C
    if(kl == 86 && e.ctrlKey)return true;//crtl-V
    if(kl == 190 && e.shiftKey)return true;//dvojtečka (se shiftem)
    if(kl > 95 && kl < 106)return true;//čísla na num klávesnici
  	if(kl == 9 || kl == 8 || kl == 46 || kl == 35 || kl == 36 || kl == 37 || kl == 39 || kl == 188 )return true;//188 je čárka
    if(kl<48 || kl>57)return false;
    return true;
  } 
  
  o.jen_cisla = function (e)
  {
    //alert("jen_cisla");
    try{var kl = e.keyCode;}
    catch(e){return true; }
    //$("#kos_pocet").text(kl );
    if(kl == 67 && e.ctrlKey)return true;//crtl-C
    if(kl == 86 && e.ctrlKey)return true;//crtl-V
  	if(kl > 95 && kl < 106)return true;//čísla na num klávesnici
    if(kl == 9 || kl == 8 || kl == 46 || kl == 35 || kl == 36 || kl == 37 || kl == 39 )return true;
    if(kl<48 || kl>57)return false;
    
    return true;
  }  

  o.enter = function (e,fce)
  {
    if(e.keyCode == 13)fce()
  }

  o.val_zjisti = function(maska)
  {
    //pro zjisteni hodnot skupiny policek
    //alert(1);
    var data = {};
    $(maska).each(function (i)
    {
      if($(this).attr("type") == "radio")//radio beru jen pokud je zaškrtlé
      {
        //alert(this.id + " checked " + $(this).attr("checked"));
        if($(this).attr("checked"))data[this.name] = $(this).val();
      }else{
        if($(this).attr('type') != 'button')data[this.id] = $(this).val();//buttony neberu
      }
    });
    return data;
  }

  o.val_nastav = function(maska,data)
  {
    //pro nastaveni dat do skupiny policek
    //pokud budou data nulova policka se vycisti a comba prepnou na Vyberte
    //maska pro jquery data - asoc. pole kde index je nazev pole
    $(maska).each(function (i) {        
        //if(this.id == "nazev")alert("id " + this.id + " data " + data[this.id])
        //if(data[this.id] != undefined)
        o.nastav_hodnotu(data[this.id],this);
    });
  }

  

  o.nastav_hodnotu = function(data,el){
  
    //nastaví hodnotu do políčka
    if(data == undefined)data = '';//data nejsou, vyčisti pole
    switch($(el)[0].nodeName) 
    {
      case"INPUT":
        if($(el).attr('type') != 'button')$(el).val(data);//jinak bych smazal text na tlačítkách
      break;
      case"TD":
        //alert("id=" + el.id )
        $(el).text(data);//
      break;
      default:
       $(el).val(data);
      break;
    }         
  }
    
  o.kontrola_povin = function(maska)
  {
    //fce najde povinna pole a pokud neobsahuji text, upozorni na to
    //alert("maska " + maska);
    var s = $(maska);//vsechna povinna pole
    //alert("Počet polí " + s.length);
    if(s.length > 0)
    {
      var i = 0;
      do {
        var p = s[i];
       
        var hodnota = $(p).val();//$(p)[0].nodeName == "INPUT" ? $(p).val() : $(p).text();
         //alert("id "   + $(p).attr("id") + " nodeName " + $(p)[0].nodeName + "  hodnota:" + hodnota + ":");;
        if(hodnota == '')
        {
          var nazev = $(p).attr("title");//do title napisu nazev pole
          if(nazev != undefined)alert("Vyplňte prosím povinné pole: " + nazev);
          else alert("Vyplňte prosím povinné pole");
          $(p).focus();
          var ok = false; 
        }else{
          var ok = true;
        }    
        i ++;
      }
      //while(i < s.length);
      while(i < s.length && ok == true);
    }
    return ok;
  }

  o.set_cookie = function(key, value, days) {
    value = encodeURIComponent(value); // hodnota value by měla být minimálně escapována pomocí funkce escape()
    if(days == undefined)days = 10;
    //value+='; domain='+domain;
    //value+='; path=/';
    //if(key == "mapa_zoom")alert("ukládám zoom " + value);
    var date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    value+='; expires=' + date.toGMTString();
    //alert("set cookies " + key + '=' + value);
    try {
		  document.cookie = key + '=' + value;
		}
			catch (event) {
				alert("CHYBA");
			}
    
  }
  
  o.parse_cookies = function(){ 
    var cookieList=document.cookie.split("; "); 
    var cookieArray = new Array(); 
    for (var i=0; i < cookieList.length; i++)
    { 
      var name = cookieList[i].split("="); 
      cookieArray[unescape(name[0])] = unescape(name[1]); 
    } 
    //for(var i in cookieArray) alert( i  + " = " + cookieArray[i]);
    return cookieArray; 
  }; 

  o.disable = function(cemu,disab)
  {
    //fce pro odemykání a zamykání polí, buttonů atd
    var el = typeof(cemu) == 'object' ? cemu : $(cemu);
    if($(el).hasClass("vzdy_disab"))return;//pole která nesmí jít odemknout
    if($(el).hasClass("nikdy_disab"))return;//pole která nesmí jít zamknout
    if(disab)
    {
      $(el).attr("disabled", "disabled");
      $(el).addClass("disabled");
    }else{
      $(el).removeAttr("disabled");
      if($(el).hasClass("disabled"))$(el).removeClass("disabled");
    }
  }

  o.ukaz_pole = function(arr){
    var t = "";
    for(var i in arr) t += i + " = " + arr[i] + "\n"
    alert(t);
  }

  o.min = function(arr){
    //fce vrací minimální hodnotu z pole arr
    arr.sort(function(a,b){return a-b});
    return arr[0];
  }

    o.max = function(arr){
    //fce vrací maximální hodnotu z pole arr
    arr.sort(function(a,b){return b-a});
    return arr[0];
  }

    
  
  o.spinner_start = function(id){
    var target = document.getElementById(id);
    spinner = new Spinner(spinner_options).spin(target);
  }
  
  o.spinner_stop = function(){ spinner.stop(); }

})(util);