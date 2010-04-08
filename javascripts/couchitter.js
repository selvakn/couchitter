$(document).ready(function(){
  var Couchitter = {
    loggedInUser: null,
    
    _docTypes : {
      coucheet : "Coucheet",
      followee : "Followee"
    },
    
    _constructData : function(message, type, uuid){
      return {
        data: { type : type, value : message, user : Couchitter.loggedInUser, createdAt : new Date().toString() },
        path : uuid
      }
    },
    
    _constructCoucheetData : function(message, uuid) {
      return this._constructData(message, this._docTypes.coucheet, uuid);
    },
    
    _constructFolloweeDate : function(followee, uuid){
      return this._constructData(followee, this._docTypes.followee, uuid);
    },
    
    login : function(username, password){
      $.jcouch.login( $("#username").attr("value"), $("#password").attr("value"), Couchitter.afterLogin, Couchitter.handleFailureLogin);
    },
    
    handleFailureLogin : function() {
      var error_message = $("#login_form #error_message");
      error_message.text("Your are not authorized!!");
      error_message.show();
      setTimeout(function(){ error_message.fadeOut( function(){ $("#unauthorized_message").text(""); }); }, 3000);
    },
    
    sortByCreatedAt : function(data){
      return data.sort(function(a,b){
        return(new Date(b.value.createdAt) - new Date(a.value.createdAt));
      });
    },
    
    showCoucheets : function(coucheets){
        $(Couchitter.sortByCreatedAt(coucheets)).each(function(index, coucheet){
          Couchitter.showCoucheet(coucheet);
        });
    },
    
    showCoucheet : function(coucheet){
      var date = new Date(coucheet.value.createdAt);
      $("#coucheets").prepend("<li><b>" + coucheet.value.user + ":</b> " + coucheet.value.value + " - " + date.toLocaleDateString() + " " + date.toLocaleTimeString()  + "</li>");
    },
    
    showPleaseLoginMessage : function(){
      alert("Please login to do this.");
    },
    
    // refreshMyCoucheets : function(){
    //   $.jcouch.getDocument({path : "_design/couchitter/_view/byDocType?key=\"" + Couchitter._docTypes.coucheet + "\""}, 
    //   function(data){
    //     Couchitter.showCoucheets(data.rows)
    //   });
    // },

    refreshMyCoucheets : function(since){
      console.log("refere");
      $.jcouch.changes({
        since : since,
        type : Couchitter._docTypes.coucheet,
        filter : "couchitter/byDocType"
      },
      function(data){
        var next_since = data.last_seq;
        $(data.results).each(function(seq){
          $.jcouch.getDocument({path : seq.id}, function(data){
            console.log(data);
          });
        });
      });
    },
    
    refreshMyFollowees : function(){
      $.jcouch.getDocument({path : "_design/couchitter/_view/byDocType?key=\"" + Couchitter._docTypes.followee +"\""}, 
      function(data){
        var followees = Couchitter.sortByCreatedAt(data.rows);
        var list_html = "";
        $(followees).each(function(index, followee){
          list_html += "<li>" + followee.value.value + "</li>"
        });
        $("#followees").html(list_html);
      });
    },
    
    afterLogin : function(){
      $.jcouch.getLoggedInUser(function(name){
        Couchitter.loggedInUser = window.location.hostname;
        $("#login").fadeOut(function(){ $("#login").html("Welcome " + name + " !!"); $("#login").fadeIn(); });
        Couchitter.refreshMyFollowees();
        Couchitter.updateMyReplications();
        console.log("test");
        
        Couchitter.refreshMyCoucheets(1);
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
          // $.jcouch.putDocument(Couchitter._constructCoucheetData(message, uuid), Couchitter.refreshMyCoucheets, Couchitter.showPleaseLoginMessage);
          $.jcouch.putDocument(Couchitter._constructCoucheetData(message, uuid));
        });
      });
    },
    
    follow : function(database_url){
      Couchitter.ensureLoggedIn(function(){
        Couchitter.addToMyFollowee(database_url);
        Couchitter.updateMyReplications();
        // Couchitter.refreshMyCoucheets();
      });
    },
    
    addToMyFollowee : function(database_url){
      $.jcouch.getUUID(function(uuid){
        $.jcouch.putDocument(Couchitter._constructFolloweeDate(database_url, uuid), Couchitter.refreshMyFollowees, Couchitter.showPleaseLoginMessage);
      });
    },
    
    updateMyReplications : function(){
      $.jcouch.getDocument({path : "_design/couchitter/_view/byDocType?key=\"" + Couchitter._docTypes.followee +"\""},
      function(data){
        var followees = $.map(data.rows, function(followee_doc, i){ return followee_doc.value;});
        $(followees).each(function(index, followee){ Couchitter._replicateFrom(followee); });
      });
    },
    
    _replicateFrom : function(followee){
      $.jcouch.replicate({
        "source":"http://" + followee.value + ":5984/couchitter",
        "target": "couchitter", 
        "continuous":true, 
        "filter" : "couchitter/byUser", 
        "query_params" : {
          "name": followee.value
        }
      });
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
      
      $("#follow").click(function(){
        Couchitter.follow($("#follow_username").attr("value"));
      });
      
      this.afterLogin();
    }
    
  }
  
  Couchitter.init();
  
});