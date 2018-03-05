module.exports['ErrorHandler'] = function () {
    return {
        "checkInput": function(/*body input*/) {
          for(var i=0; i<arguments.length; i++){
            if(arguments[i] === undefined){
              return true;
            }
          }
          return false;
        }

    }
}();
