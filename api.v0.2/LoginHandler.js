var fs = require('fs');
const uuidv1 = require('uuid/v1');

module.exports['LoginHandler'] = function () {
    // var roomData = fs.readFileSync('./game_rooms/rooms.json');
    // var Rooms = JSON.parse(roomData);
    let adminUID = null;

    let passData = fs.readFileSync('./admin/pass.json');
    let password = JSON.parse(passData).password;

    let wifiPassData = fs.readFileSync('./admin/wifiPass.json');
    let wifiPass = JSON.parse(wifiPassData);

    let wifiNameData = fs.readFileSync('./admin/wifiName.json');
    let wifiName = JSON.parse(wifiNameData);

    function generateUID(){
        return uuidv1();
    }

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
        "validateKey": function (key) {
            return key === adminUID;
        },
        "loginAdmin": function (pass) {
            if(pass == password) {
                adminUID = generateUID();
                return adminUID
            }
            else
                return null;

        },
        "setAdminPassword": function (newPass) {
            password = newPass;
            synchronize("adminPass");
            return true;
        },
        "setWifiPassword": function (newPass) {
            wifiPass = newPass;
            synchronize("wifiPass");
            // TODO: Run shell script
            return true;
        },
        "setWifiName": function (newName) {
            wifiName = newName;
            synchronize("wifiName");
            // TODO: Run shell script
            return true;
        },
        "resetAdminUID": function () {
            // Storing adminUID as null in the process
            adminUID = null;
            return adminUID;
        }


    }
}();
