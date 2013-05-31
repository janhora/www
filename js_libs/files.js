 var files = files || {};

(function(o){
  
  var debug = false;
  var data_dir = null;
  var file_sys = null;
  o.prac_adresar = null;
  //fs = LocalFileSystem.TEMPORARY;//
  var fs = LocalFileSystem.PERSISTENT;
  
//   o.fs_nastav = function(kde){
//     fs = kde == "APP" ? LocalFileSystem.PERSISTENT : window.PERSISTENT
//   
//   }
  
//   o.init = function(){
//     fs = LocalFileSystem.PERSISTENT;
//     //LocalFileSystem.PERSISTENT
//   }
  
  o.adresar_vytvor = function() {
    //vytvoření adresáře pokud neexistuje
    //if(data_dir != null)return;//už existuje
    window.requestFileSystem(fs, 0, fs_ok,fs_ko);
    function fs_ok(fs)
    {
      //alert("FS OK vytvořím " + o.prac_adresar);
      file_sys = fs
      fs.root.getDirectory(o.prac_adresar, {create: true},adr_ok,adr_ko);
      function adr_ok(dir_entry)
      {
        //alert("adresar hotov");
        data_dir = dir_entry;
      }
      function adr_ko(dir_entry){
        alert("ADR se nepodarilo vytvorit");  
      }
    }
    function fs_ko(err){
      alert("FS KO ve fci adresar_vytvor");  
    }
  }
  
  o.file_nacti = function(uri,callback,callback_params){
    //fce dostane uri souboru a callback funkci
    //té předá objekt file
    var debug = false
    uri = String(uri).replace("file://","");
    //window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, file_system_ok,file_system_ko);
    //function file_system_ok(file_system){ file_system.root.getFile(uri, {create: false}, file_entry_ok, file_entry_ko); }
    //alert("file_nacti uri " + uri)
    file_sys.root.getFile(uri, {create: false}, file_entry_ok, file_entry_ko); 
    function file_entry_ok(file_entry){ 
      //alert("file_entry_ok");
      var ff = file_entry.file(file_ok,file_ko); 
    }
    function file_entry_ko(err){
     if(debug)alert("file_entry_KO " + uri);
     if(callback)callback(callback_params,null); 
    } 
    function file_ko(err){ 
      if(debug)alert("file_KO " + uri);
      if(callback)callback(callback_params,null); 
    }
    function file_ok(file){ nacti(file); }
    function nacti(file) {
        //alert("nacti");
        var reader = new FileReader();
        reader.onloadend = function(evt) {
            //console.log("Read as text");
            //alert("nacteno " + evt.target.result)
            callback(callback_params,evt.target.result);
        };
        reader.readAsText(file);
    }
  }
  
  o.file_info = function(uri,callback,callback_param){
    //fce dostane uri souboru a callback funkci
    //té předá objekt file
    uri = String(uri).replace("file://","");
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, file_system_ok,file_system_ko);
    function file_system_ok(file_system){ file_system.root.getFile(uri, {create: false}, file_entry_ok, file_entry_ko); }
    function file_entry_ok(file_entry){
      if(debug)alert("file_entry_ok")
      var ff = file_entry.file(file_ok,file_ko); }
    function file_entry_ko(){
      if(debug)alert("file_entry_KO")
      callback(null,callback_param); 
    }
    function file_ok(file){ 
      if(debug)alert("file_OK");
      callback(file,callback_param); }
    function file_ko(){
      if(debug)alert("file_KO");
      callback(null,callback_param); 
    }
  }
  
  function file_system_ko(err){ alert("FS KO"); }//chyba při requestFileSystem
  function file_entry_ko()
  {
   //alert("file_entry_KO");
   fce(null); 
  }//chyba při file_system.getFile
  function file_ko(file){ 
    alert("file_ko"); 
    fce(null);
  } //chyba při file_entry.file()
  

  
  o.soubor_uloz = function(nazev,data,callback,callback_params){
    //alert("soubor_uloz " + nazev)
    data_dir.getFile(nazev, {create: true, exclusive: false},soubor_ok);
    function soubor_ok(file_entry){
        //soubor vytvořen začnu zapisovat
        file_entry.createWriter(wr_ok, wr_ko);
        //console.log("SOUBOR ZDARNE ZALOZEN !!!!!");                 
    }
    function wr_ok(writer) {
      //zápis do souboru
      if(callback != null)writer.onwrite = wr_finito;//pokud je def. callback, zavolej ji až skončí zápis
      writer.write(data);
    };
    
    function wr_finito(){
      //alert("wr_finito")
      callback(callback_params)             
    }
    
    function wr_ko(error) {
      alert("WRITE KO");
      console.log(error.code);
    };
  }  
  
  o.soubor_smaz = function(uri,callback){
    //smazání souboru
    //window.resolveLocalFileSystemURI(url, smaz_ho, chyba);
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, file_system_ok,file_system_ko);
    function file_system_ok(file_system){ file_system.root.getFile(uri, {create: false}, file_entry_ok, file_entry_ko); }
    function file_entry_ok(fileEntry) {
       //if(debug)alert("file_entry_ok")
       fileEntry.remove(remove_ok,remove_ko);
    } 
    function file_entry_ko(){
      //if(debug)alert("file_entry_KO pro uri " + uri)
      if(callback != null)callback(false);         
    }  
    function chyba(){
      //alert("smazání se nezdařilo;")
      if(callback != null)callback(false);         
    }
    function remove_ok(){
      //alert("smazáno");
      if(callback != null)callback(true);             
    }
    function remove_ko(){
      //alert("remove_ko");
      if(callback != null)callback(false);            
    }
  }
  

})(files);