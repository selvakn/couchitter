$(document).ready(function(){
  var loggedInUser = null;
  
  var refreshMyCoucheets = function(){
    $.jcouch.getDocument({path:"_design/couchitter/_view/byUser?key=\"admin\""},
    function(data){
      var list_html = "";
      sortedByDate = data.rows.sort(function(a,b){
          return(new Date(b.value.createdAt) - new Date(a.value.createdAt));
      });
      
      $(sortedByDate).each(function(index, coucheet){
        date = new Date(coucheet.value.createdAt);
        list_html += "<li>" + coucheet.value.value + " - " + date.toLocaleDateString() + " " + date.toLocaleTimeString()  + "</li>";
      });
      $("#coucheets").html(list_html);
    })
  }
  
  var afterLogin = function(){
    $.jcouch.getLoggedInUser(function(name){
      loggedInUser = name;
      $("#login").fadeOut(function(){
        $("#login").html("Welcome " + name + " !!");
        $("#login").fadeIn();
      });
      
      refreshMyCoucheets();
    });
  }

  $("#login_form").submit(function(){
    $.jcouch.login(
      $("#username").attr("value"),
      $("#password").attr("value"), 
      afterLogin,
      function(){
        var error_message = $("#login_form #error_message")
        error_message.text("Your are not authorized!!");
        error_message.show();
        setTimeout(function(){
          error_message.fadeOut(function(){
            $("#unauthorized_message").text("");
          });
          }, 3000);
        }
      );

      return false;
    });

    var showPleaseLoginMessage = function(){
      alert("Please login to do this.")
    };

    $("#coucheet").click(function(){
      $.jcouch.getUUID(function(uuid){
        $.jcouch.putDocument({
          data:{
            type : "Coucheet",
            value : $("#happening_message").attr("value"),
            user : loggedInUser,
            createdAt : new Date().toString()
          },
          path : uuid
        },
        refreshMyCoucheets,
        showPleaseLoginMessage
      );
    });
  });

  $.jcouch.init({db : "couchitter"});

  afterLogin();
});