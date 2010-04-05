(function($){
  
  var CouchDatabase = function(db_name){
    this.connectionString = function(){
      return "/" + db_name;
    }
  };
  
  $.jcouch = {
    login : function(name, password, callback, failure_callback){
      jQuery.ajax({
        url : "/_session",
        data :{
          name : name,
          password : password
        },
        type : "POST",
        success : callback,
        error : failure_callback,
      });
    },
    
    getLoggedInUser : function(callback, failure_callback){
      jQuery.ajax({
        url : "/_session",
        type : "GET",
        dataType : "json",
        success : function(data){
          userName = data["userCtx"]["name"]
          if(userName != null) { callback(userName) };
        },
        error : failure_callback
      });
    },
    
    getUUID : function(callback, failure_callback){
      return jQuery.ajax({
        url : "/_uuids",
        dataType : "json",
        success : function(data){
          callback(data["uuids"][0]);
        },
        error : failure_callback
      });
    },
    
    createDatabase : function(name, callback, failure_callback){
      jQuery.ajax({
        url : _constructUrl(name),
        type : "POST",
        success : callback,
        error : failure_callback
      });
    },

    getDocument : function(doc_options, callback, failure_callback){
      jQuery.ajax({
        url : this._constructUrl(doc_options.path),
        type : "GET",
        dataType : "json",
        success : callback,
        error : failure_callback
      });
    },

    putDocument : function(doc_options, callback, failure_callback){
      jQuery.ajax({
        url : this._constructUrl(doc_options.path),
        data : JSON.stringify(doc_options.data),
        type : "PUT",
        dataType : "json",
        success : callback,
        error : failure_callback
      });
    },
    
    _constructUrl : function(){
        var str = this.couchDatabase.connectionString();
        $(arguments).each(function(index, arg){
           str += "/" + arg;
        });
        return str;
    },
    
    init: function(options){
      this.couchDatabase = new CouchDatabase(options.db);
      var username = options.username;
      var password = options.password;
      if(username != null && password != null){ this.login(username, password); }
    }
  }
})(jQuery);