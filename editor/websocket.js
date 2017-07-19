/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var wsUri = "ws://" + document.location.host + "/visEndpoint";
var websocket = new WebSocket(wsUri);

var processing = false;
websocket.onerror = function(evt) { onError(evt) };

function onError(evt) {

}

websocket.onopen = function(evt) { onOpen(evt) };

function writeToScreen(message) {

};

function onOpen() {

}
websocket.onmessage = function(evt) { onMessage(evt) };

function sendText(json) {
    //console.log("sending text: " + json);
    websocket.send(json);
}
                
function onMessage(evt) {
    //console.log("received: " + evt.data);
    msg = JSON.parse(evt.data);
    processing = true;
    switch(msg.Op){
	case "Select":
	    editor.selectByUuid( msg.UUID, true );
	    break;
	case "Frame":        //alert("uuid: " + msg.name);
	    var transforms = msg.Transforms;
	    for (var i = 0; i < transforms.length; i ++ ) {
			var oneBodyTransform = transforms[i];
		    var o = editor.objectByUuid( oneBodyTransform.uuid);
		    //alert("mat before: " + o.matrix);
		    if (o != undefined) {
		        o.matrixAutoUpdate = false;
		        o.matrix.fromArray(oneBodyTransform.matrix);
		    }
	    }
            var paths = msg.paths;
            if (paths !== undefined){
                for (var p=0; p < paths.length; p++ ) {
                    editor.updatePath(paths[p]);
                }
            }
	    editor.refresh();
	    break;
	case "CloseModel":
	    modeluuid = msg.UUID;
	    editor.closeModel(modeluuid);
	    onWindowResize();
	    break;
	case "OpenModel":
	    modeluuid = msg.UUID;
	    editor.loadModel(modeluuid.substring(0,8)+'.json');
	    onWindowResize();
	    break;
	case "SetCurrentModel":
	    modeluuid = msg.UUID;
	    editor.setCurrentModel(modeluuid);
	    onWindowResize();
	    break;
        case "execute":
	    //msg.command.object = editor.objectByUuid(msg.UUID);
	    cmd = new window[msg.command.type]();
	    cmd.fromJSON(msg.command);
            editor.execute(cmd);
            editor.refresh();
            break; 
        case "addModelObject":
            cmd = new window[msg.command.type]();
	    cmd.fromJSON(msg.command);
            parentUuid = msg.command.object.object.parent;
            editor.execute(cmd);
            newUuid = cmd.object.uuid;
            editor.moveObject(editor.objectByUuid(newUuid), editor.objectByUuid(parentUuid));
            break;
        /*
        var paths = msg.paths;
        for (var i = 0; i < paths.length; i ++ ) {
            var onePathUpdate = paths[i];
            var o = editor.scene.getObjectByProperty( 'uuid', onePathUpdate.uuid);
            var pathobj = o.geometry.attributes.position;
            pathobj[0] = onePathUpdate.positions[0];
            pathobj[1] = onePathUpdate.positions[1];
            pathobj[2] = onePathUpdate.positions[2];
            pathobj[3] = onePathUpdate.positions[3];
            pathobj[4] = onePathUpdate.positions[4];
            pathobj[5] = onePathUpdate.positions[5];
            //o.geometry.attributes.position.needsUpdate = true;
            //alert("mat before: " + o.matrix);
            o.matrixAutoUpdate = false;
            o.geometry.verticesNeedUpdate = true;
            o.updateMatrix();
        } */
		    
        processing = false;

   }

}
// End test functions
