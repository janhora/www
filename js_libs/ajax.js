var ajax = ajax || {};

(function(o){

  
  o.server_path = null;
  o.wait_fce = null;
  o.send = function(metoda,data,wait_fce,fce)
  {
    if(wait_fce != null)//pokud došla fce, zapamatuj si ji
    {
      o.wait_fce = wait_fce;
      o.wait_fce(true);//nastav čekejte
    }
    var url = o.server_path + "json.php/" + metoda + "/";
    //$("#ajax_url").val(url);
    //alert(url);
    $.ajax({ url:  url,
    type: 'POST',
    dataType: 'json',
    complete: ajax_complete,
    data: data,
    success: function (data, textStatus, XMLHttpRequest){
      if(o.wait_fce != null)o.wait_fce(false);
      //if(data.stav == true && data.alert != undefined && data.chyba == undefined)alert(data.alert);//když stav OK a došla hláška, ukaž ji (např. Uloženo) někdy nedopadlo dobře, pak nastavím na serveru data.chyba aby se hláška neukázala, 
      if(data['stav'] != true)vypis_chybu(metoda,data);
      else fce(data);
    }});
  }
  
  
  function ajax_complete(XMLHttpRequest, textStatus)
  {
    //alert("ajax_complete");
    if(o.wait_fce != null)o.wait_fce(false);
    if(textStatus == "error")
    {
      alert('Nemohu se spojit se serverem. Zkontrojujte zda jste připojeni k internetu.');
      //vypis_pole(XMLHttpRequest);
    }
    if(textStatus == "parsererror")
    {
      //alert('Chyba PARSER ERROR.');
      vypis_chybu('Chyba PARSER ERROR.',XMLHttpRequest);
    }
    if(textStatus == "timeout")alert('Server neodpovídá.');
  
  }

  function vypis_chybu(metoda,data)
  {
    //alert("vypis_chybu");
    //alert(data);
    //return;
    //alert(data);
    var v = '';
    for(var i in data)v += i + "=" + data[i] + "\n";
    //alert(v);
    $("#panel_ajax_error").text(v);
    return;
    $("#panel_ajax_error").attr("title","Výpis chyby");
    $("#panel_ajax_error").html(v);
    //$("#panel_ajax_error").css("width",500);
    $("#panel_ajax_error").dialog();
    
  }

})(ajax);