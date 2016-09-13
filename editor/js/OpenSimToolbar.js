/**
 * @author mrdoob / http://mrdoob.com/
 */

var OpenSimToolbar = function ( editor ) {

	var signals = editor.signals;

	var container = new UI.Panel();
	container.setId( 'toolbar' );

	var buttons = new UI.Panel();
	container.add( buttons );

	var camera = editor.camera;
    // -X
	var viewminx = new UI.Button('-X').onClick(function () {
		viewfromMinusX();
	});
	buttons.add(viewminx);
	function viewfromMinusX() {
	    var bbox = computeModelBbox();
	    var center = new THREE.Vector3();
	    bbox.center(center);
	    var newpos = new THREE.Vector3().copy(center);
	    var fov = editor.camera.fov * (Math.PI / 180);
	    // Calculate the camera distance
	    var objectSize = Math.max(bbox.max.y - bbox.min.y, bbox.max.z - bbox.min.z) / 2;
	    var distance = Math.abs(objectSize / Math.sin(fov / 2));
	    newpos.x = bbox.min.x - distance;
	    editor.updateCamera(newpos, center);
	    editor.signals.defaultCameraApplied.dispatch(center);
    };
    // +X
	var viewx = new UI.Button('+X').onClick(function () {

	    viewfromPlusX();

	});
	buttons.add(viewx);

	function viewfromPlusX() {
	    var bbox = computeModelBbox();
	    var center = new THREE.Vector3();
	    bbox.center(center);
	    //var helper = new THREE.BoundingBoxHelper(modelObject, 0xff0000);
	    //helper.update();
	    // If you want a visible bounding box
	    //editor.scene.add(helper);
	    // create a sphere at new CameraPos
	    var newpos = new THREE.Vector3().copy(center);
	    var fov = editor.camera.fov * (Math.PI / 180);
	    // Calculate the camera distance
	    var objectSize = Math.max(bbox.max.y - bbox.min.y, bbox.max.z - bbox.min.z) / 2;
	    var distance = Math.abs(objectSize / Math.sin(fov / 2));
	    newpos.x = bbox.max.x + distance;
	    editor.updateCamera(newpos, center);
	    editor.signals.defaultCameraApplied.dispatch(center);
    };
    // -Y
	var viewminy = new UI.Button('-Y').onClick(function () {
	    viewfromMinusY();
	});
	buttons.add(viewminy);
	function viewfromMinusY() {
	    var bbox = computeModelBbox();
	    var center = new THREE.Vector3();
	    bbox.center(center);
	    var newpos = new THREE.Vector3().copy(center);
	    var fov = editor.camera.fov * (Math.PI / 180);
	    // Calculate the camera distance
	    var objectSize = Math.max(bbox.max.x - bbox.min.x, bbox.max.z - bbox.min.z) / 2;
	    var distance = Math.abs(objectSize / Math.sin(fov / 2));
	    newpos.y = bbox.min.y - distance;
	    editor.updateCamera(newpos, center);
	    editor.signals.defaultCameraApplied.dispatch(center);
    };
    // +Y
	var viewplusy = new UI.Button('+Y').onClick(function () {
	    viewfromPlusY();
	});
	buttons.add(viewplusy);
	function viewfromPlusY() {
	    var bbox = computeModelBbox();
	    var center = new THREE.Vector3();
	    bbox.center(center);
	    var newpos = new THREE.Vector3().copy(center);
	    var fov = editor.camera.fov * (Math.PI / 180);
	    // Calculate the camera distance
	    var objectSize = Math.max(bbox.max.x - bbox.min.x, bbox.max.z - bbox.min.z) / 2;
	    var distance = Math.abs(objectSize / Math.sin(fov / 2));
	    newpos.y = bbox.max.y + distance;
	    editor.updateCamera(newpos, center);
	    editor.signals.defaultCameraApplied.dispatch(center);
    };
    // -Z
	var viewminz = new UI.Button('-Z').onClick(function () {
	    viewfromMinusZ();
	});
	buttons.add(viewminz);
	function viewfromMinusZ() {

	    var bbox = computeModelBbox();
	    var center = new THREE.Vector3();
	    bbox.center(center);
	    var newpos = new THREE.Vector3().copy(center);
	    var fov = editor.camera.fov * (Math.PI / 180);
	    // Calculate the camera distance
	    var objectSize = Math.max(bbox.max.x - bbox.min.x, bbox.max.y - bbox.min.y)/2;
	    var distance = Math.abs(objectSize / Math.sin(fov / 2));
	    newpos.z = bbox.min.z - distance;
	    editor.updateCamera(newpos, center);
	    editor.signals.defaultCameraApplied.dispatch(center);
	};
    // +Z
	var viewplusz = new UI.Button('+Z').onClick(function () {
	    viewfromPlusZ();
	});
	buttons.add(viewplusz);
	function viewfromPlusZ() {

	    var bbox = computeModelBbox();
	    var center = new THREE.Vector3();
	    bbox.center(center);
	    var newpos = new THREE.Vector3().copy(center);
	    var fov = editor.camera.fov * (Math.PI / 180);
	    // Calculate the camera distance
	    var objectSize = Math.max(bbox.max.x - bbox.min.x, bbox.max.y - bbox.min.y)/2;
	    var distance = Math.abs(objectSize / Math.sin(fov / 2));
	    newpos.z = bbox.max.z + distance;
	    editor.updateCamera(newpos, center);
	    editor.signals.defaultCameraApplied.dispatch(center);
    };

	var view_zoomin = new UI.Button('+').onClick(function () {
	    editor.viewZoom(+100);
	});
	buttons.add(view_zoomin);
	var view_zoomout = new UI.Button('-').onClick(function () {
	    editor.viewZoom(-100);
	});
	buttons.add(view_zoomout);
	var view_refit = new UI.Button('R').onClick(function () {
	    //var modelObject = editor.scene.getObjectByName('OpenSimModel');
	    var bbox = computeModelBbox();
	    var center = new THREE.Vector3();
	    bbox.center(center);
	    //var newpos = new THREE.Vector3().copy(camera.location);
	    var fov = camera.fov * (Math.PI / 180);
	    var objectSize = Math.max(bbox.max.x - bbox.min.x, bbox.max.y - bbox.min.y, bbox.max.z - bbox.min.z);
	    var distance = Math.abs(objectSize / Math.sin(fov / 2));
	    //var helper = new THREE.BoundingBoxHelper(modelObject, 0xff0000);
	    //helper.update();
	    //editor.scene.add(helper);
	    // Zoom out only if model is outside view, also zoom in if too small
	    var curDistance = center.distanceTo(camera.position);
	    editor.viewZoom(curDistance-distance);

	});
	buttons.add(view_refit);

	var snapshot = new UI.Button('Snap').onClick(function () {
            saveAsImage();
	});
	buttons.add(snapshot);

	function computeModelBbox() {
	    var modelObject = editor.scene.getObjectByName('OpenSimModel');
	    return (new THREE.Box3().setFromObject(modelObject));
	};
        function saveAsImage() {
            var canvas = document.getElementById("viewport");
            getImageData = true;
            //canvas.children[1].render();
	    var img    = canvas.children[1].toDataURL("image/jpeg");
	    saveFile(img, "opensim_snapshot.jpg");
	};
        // Support saving image to file
        var saveFile = function (strData, filename) {
            var link = document.createElement('a');
            if (typeof link.download === 'string') {
                document.body.appendChild(link); //Firefox requires the link to be in the body
                link.download = filename;
                link.href = strData;
                link.click();
                document.body.removeChild(link); //remove the link when done
            } else {
                location.replace(uri);
            }
        };

	return container;

}
