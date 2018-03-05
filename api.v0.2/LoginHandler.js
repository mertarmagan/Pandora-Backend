var fs = require('fs');

module.exports['LoginHandler'] = function () {
    // var roomData = fs.readFileSync('./game_rooms/rooms.json');
    // var Rooms = JSON.parse(roomData);
    var passData = fs.readFileSync('./admin/pass.json');
    var password = JSON.parse(passData);

    var wifiPassData = fs.readFileSync('./admin/wifiPass.json');
    var wifiPass = JSON.parse(wifiPassData);

    var wifiNameData = fs.readFileSync('./admin/wifiName.json');
    var wifiName = JSON.parse(wifiNameData);

    function synchronize(type){
        if(type === "adminPass")
            fs.writeFileSync('./admin/pass.json', JSON.stringify({ "password": password }, null, 2));
        else if(type === "wifiPass")
            fs.writeFileSync('./admin/wifiPass.json', JSON.stringify({ "wifiPass": wifiPass }, null, 2));
        else if(type === "wifiName"){
            fs.writeFileSync('./admin/wifiName.json', JSON.stringify({ "wifiName": wifiName }, null, 2));
        }
    }

    return {
        "password": password,
        "wifiName": wifiName,
        "wifiPass": wifiPass,
        "loginAdmin": function (pass) {
            if(pass === password)
                return true;
            else
                return false;
        }
        "setAdminPassword": function (newPass) {
            password = newPass;
            synchronize("adminPass");
            return true;
        },
        "setWifiPassword": function (newPass) {
            wifiPass = newPass;
            synchronize("wifiPass");
            return true;
        },
        "setWifiName": function (newName) {
            wifiName = newName;
            synchronize("wifiName");
            return true;
        }


    }
}();
