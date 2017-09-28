/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var wsUri = "ws://" + document.location.host + "/visEndpoint";
var websocket = new WebSocket(wsUri);

var processing = false;
var totalTime = 0.0;
var numFrames = 0;
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

	switch(msg.Op){
	case "Select":
		editor.selectByUuid( msg.UUID);
		break;
	case "Frame":  
		if (processing)
			return;//alert("uuid: " + msg.name);
		processing = true;
		var t0 = performance.now();
		// Make sure nothing is selected before applying Frame
		editor.select( null);
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
		var t1 = performance.now() - t0;
		totalTime +=t1;
		numFrames++;
		processing = false;
		break;
	case "CloseModel":
		modeluuid = msg.UUID;
		editor.closeModel(modeluuid);
		editor.refresh();
		break;
	case "OpenModel":
		modeluuid = msg.UUID;
		editor.loadModel(modeluuid.substring(0,8)+'.json');
		editor.refresh();
		break;
	case "SetCurrentModel":
		modeluuid = msg.UUID;
		editor.setCurrentModel(modeluuid);
		editor.refresh();
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
		editor.refresh();
		break;
	 case "PathOperation":
		editor.processPathEdit(msg);
		break;
	case "startAnimation":
		totalTime=0.0;
		numFrames = 0;
		break;
	case "endAnimation":
		var json = JSON.stringify({
			"type": "info",
			"numFrames": numFrames,
			"totalTime": totalTime
		});
		sendText(json);
		break;
   }
   processing = false; // Defensive in case render never finishes/errors
}
// End test functions
