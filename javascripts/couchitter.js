$(document).ready(function(){
  var Couchitter = {
    loggedInUser: null,
    
    login : function(username, password){
      $.jcouch.login( $("#username").attr("value"), $("#password").attr("value"), Couchitter.afterLogin, Couchitter.handleFailureLogin);
    },
    
    handleFailureLogin : function() {
      var error_message = $("#login_form #error_message");
      error_message.text("Your are not authorized!!");
      error_message.show();
      setTimeout(function(){ error_message.fadeOut( function(){ $("#unauthorized_message").text(""); }); }, 3000);
    },
    
    showCoucheets : function(coucheets){
        var list_html = "";
        
        var sortedByDate = coucheets.sort(function(a,b){
          return(new Date(b.value.createdAt) - new Date(a.value.createdAt));
        });

        $(sortedByDate).each(function(index, coucheet){
          var date = new Date(coucheet.value.createdAt);
          list_html += "<li>" + coucheet.value.value + " - " + date.toLocaleDateString() + " " + date.toLocaleTimeString()  + "</li>";
        });
        
        $("#coucheets").html(list_html);
    },
    
    showPleaseLoginMessage : function(){
      alert("Please login to do this.");
    },
    
    refreshMyCoucheets : function(){
      $.jcouch.getDocument({path : "_design/couchitter/_view/byUser?key=\""+ Couchitter.loggedInUser + "\""}, 
      function(data){
        Couchitter.showCoucheets(data.rows)
      });
    },
    
    afterLogin : function(){
      $.jcouch.getLoggedInUser(function(name){
        Couchitter.loggedInUser = name;
        $("#login").fadeOut(function(){ $("#login").html("Welcome " + name + " !!"); $("#login").fadeIn(); });
        Couchitter.refreshMyCoucheets();
      });
    },
    
    ensureLoggedIn : function(){
      if(null === Couchitter.loggedInUser){
        Couchitter.showPleaseLoginMessage();
      }else{
        var args = $.makeArray(arguments);
        args.shift().apply(this, args);
      }
    },
    
    pushCoucheet : function(message){
      Couchitter.ensureLoggedIn(function(){
        $.jcouch.getUUID(function(uuid){
          $.jcouch.putDocument(Couchitter._constructCoucheetData(message, uuid), Couchitter.refreshMyCoucheets, Couchitter.showPleaseLoginMessage);
        });
      });
    },
    
    _constructCoucheetData : function(message, uuid) {
      return {
        data: { type : "Coucheet", value : message, user : Couchitter.loggedInUser, createdAt : new Date().toString() },
        path : uuid
      }
    },
    
    
    init : function(){
      $.jcouch.init({db : "couchitter"});
      
      $("#login_form").submit(function(){
        Couchitter.login();
        return false;
      });
      
      $("#coucheet").click(function(){
          Couchitter.pushCoucheet($("#happening_message").attr("value"));
      });
      
      this.afterLogin();
    }
    
    
  }
  
  Couchitter.init();
  
});