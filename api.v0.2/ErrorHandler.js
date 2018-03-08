module.exports['ErrorHandler'] = function () {
    return {
        "assert": function(/*body input*/) {
            for(let i=0; i<arguments.length; i++)
                console.assert(arguments[i] !== null);
        }

    }
}();
