let mqtt;
let mqtt_connected = false;
let mqtt_host = "192.168.1.111";
let mqtt_username = "escape";
let mqtt_password = "HouseOfHorror";
let site = "GBG";
let client_id = "BOMB_TOUCHSCREEN_"+parseInt(new Date().getTime());
let mqtt_port = 9001;
let mqtt_connect_interval;
let mqtt_device_status_interval;

function onConnect(){
    console.log("Connected to MQTT with id:"+client_id);
    mqtt.subscribe(`${site}/rooms/bomb/trigger`);
    mqtt_connected = true;
    clearInterval(mqtt_connect_interval);

    // Update devices state
    mqtt_device_status_interval = setInterval(() => {
        send_generic('devices/bomb/bomb', {"connection": true});
    }, 10000);

    if(typeof code == "undefined")
        send_generic('moments/bomb/text/keypad_code', "Keypad: ");
    else
        send_generic('moments/bomb/text/keypad_code', "Keypad: "+code);

    if(typeof state == "undefined")
        send_generic('moments/bomb/text/bomb_state', "initial");
    else
        send_generic('moments/bomb/text/bomb_state', state);
}

function onConnectionLost(responseObject) {
    clearInterval(mqtt_device_status_interval);
    try{
        if (responseObject.errorCode !== 0) {
            console.log("Connection lost:" + responseObject.errorMessage);
        }
    }catch(e){
        console.log("Connection lost error ", e);
        tryConnect();
    }
    mqtt_connected = false;
}

function onMessage(msg){
    console.log("MQTT Message recieved");
    try{
        let decoded_msg = JSON.parse(msg.payloadString);
        if("command" in decoded_msg){
            if(decoded_msg["command"] == "reset"){
                // Tell python script to reset
                trySend("reset");
                
                // Wait five seconds to let the reset message send
                setTimeout(() => {
                    location.reload();
                }, 5000);
            }
            else if(decoded_msg["command"] == "screen_message"){
                if(state == "easy_mode"){
                    addMessage(decoded_msg["msg"], "easy", false, false); 
                }
                else if(state == "hard_mode"){
                    addMessage(decoded_msg["msg"], "hard", false, false); 
                }
            }
            else if(decoded_msg["command"] == "lockdown"){
                // Reset time for next lockdown
                if(warnings_activated){
                    stopLockdownTimer();
                    startLockdownTimer();
                }

                lockdown();
            }
                
            
            // Respond with ACK
            send_generic(`moments/bomb/trigger/${decoded_msg["command"]}`, JSON.stringify(true));
        }
    }
    catch(e){
        console.log("Couldn't parse message", msg.payloadString);
    }
    
}

function mqtt_connect(){
    console.log("Connecting to host: "+ mqtt_host + " port: " + mqtt_port);
    mqtt = new Paho.MQTT.Client(mqtt_host, mqtt_port, client_id);

    last_will = new Paho.MQTT.Message(JSON.stringify({"connection": false}));
    last_will.destinationName = `${site}/rooms/devices/bomb/bomb`;;

    let options = {
        timeout: 3,
        onSuccess: onConnect,
        userName: mqtt_username,
        password: mqtt_password,
        willMessage: last_will
    };

    mqtt.onMessageArrived = onMessage;
    mqtt.onConnectionLost = onConnectionLost;
    
    try{
        mqtt.connect(options);
    }catch(e){
        console.log("Error connecting to MQTT: ", e);
    }
}

function send_generic(topic, payload){
    if(mqtt_connected){
        let msg = new Paho.MQTT.Message(JSON.stringify(payload));
        msg.destinationName = `${site}/rooms/${topic}`;
        console.log("Sending generic")
        mqtt.send(msg);
    }
}

function trigger_moment(destination, trigger_id){
    // Make button look like its waiting for a response
    let button =  document.querySelector(`#${destination.split('/')[0]}_trigger_button_${trigger_id}`);
    let button_attributes = button.getAttribute('class');
    button_attributes += " trigger_button_clicked";
    button.setAttribute('class', button_attributes);
    
    let msg = new Paho.MQTT.Message(JSON.stringify({"command": trigger_id}));
    msg.destinationName = `${site}/rooms/${destination}`;
    console.log("Sending trigger")
    mqtt.send(msg);
}

function tryConnect(){
    mqtt_connect();
    if(!mqtt_connected){
        mqtt_connect_interval = setInterval(() => {
            console.log("Trying to connect to mqtt");
            if(!mqtt_connected){
                mqtt_connect();
            }
            else{
                clearInterval(mqtt_connect_interval);
            }
        }, 10000);
    }
}
tryConnect();

