// Create WebSocket connection.
// Interval that connects every five seconds until success
// Has to be tested
let ws = undefined;
let ws_status = "disconnected";

let ws_connection_interval = setInterval(() => {
    ws = new WebSocket('ws://localhost:8766');
    // Connection opened
    ws.addEventListener('open', function (event) {
        console.log("Connected to websockets");
        
        // Cancel the connection attempts
        clearInterval(ws_connection_interval);
        ws_status = "connected";

        // Poll for updates
        setInterval(() => {
            ws.send("update");
            //console.log("[WS] UPDATE SENT ----------------------");
        }, 500);
    });

    // Listen for messages
    ws.addEventListener('message', function (event) {
        //console.log('[WS] ', event.data);
        switch(event.data){
            case 'usb_inserted':
                usbInserted();
                break;
            case 'usb_detached':
                usbDetached();
                break;
            case 'intrusion':
                intrusionDetected();
                break;
            case 'intrusion_reset':
                intrusionReset();
                break;
            case 'key_1_inserted':
                setKey("a", true);
                break;
            case 'key_1_detached':
                setKey("a", false);
                break;
            case 'key_2_inserted':
                setKey("b", true);
                break;
            case 'key_2_detached':
                setKey("b", false);
                break;
            case 'set_power_off':
                if(state == "easy_correct")
                    statePowerOff();
                break;
            case 'power_on':
                powerOn();
                break;
            case 'hdd_power_on':
                trySend("hdd_power_on")
                break;
            case 'hdd_power_off':
                trySend("hdd_power_off");
                break;
            case 'set_hdd_power_on':
                hddPowerOn();
                break;
            case 'set_hdd_power_off':
                hddPowerOff();
                break;
            case 'lockdown_code_0':
                checkCard(0);
                break;
            case 'lockdown_code_1':
                checkCard(1);
                break;
            case 'lockdown_code_2':
                checkCard(2);
                break;
            case 'set_done':
                console.log("Done Completed");
                break;
            case 'failed':
                bombFailed();
                break;
            case 'reset':
                location.reload();
                break;
            default:
                console.log("[WS] Unhandled data");
                console.log(event.data);
                break;
        }
    });
}, 5000);

function trySend(data){
    let tryInterval = setInterval(() => {
        if(ws_status == "connected"){
            ws.send(data);
            clearInterval(tryInterval);
        }
        else{
            console.log(`[WS] Sending ${data} failed.`);
        }
    }, 100);
}

function sendPowerOff(){
    trySend("power_off");
}