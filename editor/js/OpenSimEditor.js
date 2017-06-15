/**
 * @author mrdoob / http://mrdoob.com/
 */

var OpenSimEditor = function () {

	this.DEFAULT_CAMERA = new THREE.PerspectiveCamera( 50, 1, 0.1, 10000 );
	this.DEFAULT_CAMERA.name = 'Camera';
	this.DEFAULT_CAMERA.position.set( 20, 10, 20 );
	this.DEFAULT_CAMERA.lookAt( new THREE.Vector3() );
	this.dolly_camera = new THREE.PerspectiveCamera(50, 1, 0.1, 10000);
	this.dolly_camera.name = 'DollyCamera';
	this.dolly_camera.position.set(0, 0, 0);
	this.dolly_camera.lookAt(new THREE.Vector3());

	this.dolly_object = new THREE.Object3D();
	this.dolly_object.name = 'Dolly';
	this.dolly_object.position.y = 0;

	this.models = [];
	this.currentModel = undefined; //uuid of current model call getCurrentModel for actualobject
	this.currentModelColor = new THREE.Color(0xffffff);
	this.nonCurrentModelColor = new THREE.Color(0x888888);
	this.sceneBoundingBox = undefined;
	this.sceneLight = undefined;
	// types of objects that are graphically movable
	var supportedOpenSimTypes = ["PathPoint", "Marker"];
	//this.cameraEye = new THREE.Mesh(new THREE.SphereGeometry(50), new THREE.MeshBasicMaterial({ color: 0xdddddd }));
	//this.cameraEye.name = 'CameraEye';

	var Signal = signals.Signal;

	this.signals = {

		// script

		editScript: new Signal(),

		// player

		startPlayer: new Signal(),
		stopPlayer: new Signal(),

		// actions

		showModal: new Signal(),

		// notifications

		editorCleared: new Signal(),

		savingStarted: new Signal(),
		savingFinished: new Signal(),

		themeChanged: new Signal(),
		backgroundColorChanged: new Signal(),
		transformModeChanged: new Signal(),
		snapChanged: new Signal(),
		spaceChanged: new Signal(),
		rendererChanged: new Signal(),

		sceneGraphChanged: new Signal(),

		cameraChanged: new Signal(),

		geometryChanged: new Signal(),

		objectSelected: new Signal(),
		objectFocused: new Signal(),

		objectAdded: new Signal(),
		objectChanged: new Signal(),
		objectRemoved: new Signal(),

		helperAdded: new Signal(),
		helperRemoved: new Signal(),

		materialChanged: new Signal(),

		scriptAdded: new Signal(),
		scriptChanged: new Signal(),
		scriptRemoved: new Signal(),

		fogTypeChanged: new Signal(),
		fogColorChanged: new Signal(),
		fogParametersChanged: new Signal(),
		windowResize: new Signal(),

		showGridChanged: new Signal(),
		refreshSidebarObject3D: new Signal(),
		historyChanged: new Signal(),
		refreshScriptEditor: new Signal(),

		renderDebugChanged: new Signal(),
	    animationStarted: new Signal(),
	    animationStopped: new Signal(),
	    defaultCameraApplied: new Signal(),
	    recordingStarted: new Signal(),
        recordingStopped: new Signal()
	};

	this.config = new Config( 'threejs-editor' );
	this.history = new History( this );
	this.storage = new Storage();
	this.loader = new THREE.OpenSimLoader(this);

	this.camera = this.DEFAULT_CAMERA.clone();
	this.dollyPath = new THREE.ClosedSplineCurve3([
			new THREE.Vector3(0, 0, 2000),
			new THREE.Vector3(-1400, 0, 1400),
			new THREE.Vector3(-2000, 0, 0),
			new THREE.Vector3(-1400, 0, -1400),
			new THREE.Vector3(0, 0, -2000),
			new THREE.Vector3(1400, 0, -1400),
			new THREE.Vector3(2000, 0, 0),
			new THREE.Vector3(1400, 0, 1400),
	]);

	this.dollyPath.type = 'catmullrom';
	this.scene = new THREE.Scene();
        // Ortho Scene and Camera for Logo and text
        this.sceneOrtho = new THREE.Scene();
        this.sceneOrthoCam = new THREE.OrthographicCamera( 0, window.innerWidth, window.innerHeight, 0, - 10, 10 );

	this.scene.userData = "NonEditable";

	this.scene.name = 'Scene';

	this.sceneHelpers = new THREE.Scene();

	this.object = {};
	this.geometries = {};
	this.materials = {};
	this.textures = {};
	this.scripts = {};

	this.selected = null;
	this.helpers = {};
	
	this.groundPlane = null;
	this.groundMaterial = null;
	this.modelsGroup = undefined;
	
	this.createLights();
	this.createBackground(this.config.getKey('skybox'));
	this.createGroundPlane(this.config.getKey('floor'));
	this.createDollyPath();
	this.createModelsGroup();
	this.createLogoSprite();

};

OpenSimEditor.prototype = {

	setTheme: function ( value ) {

		document.getElementById( 'theme' ).href = value;

		this.signals.themeChanged.dispatch( value );

	},

	//

	setScene: function ( scene ) {

		this.scene.uuid = scene.uuid;
		this.scene.name = scene.name;
		this.scene.userData = JSON.parse( JSON.stringify( scene.userData ) );

		// avoid render per object

		this.signals.sceneGraphChanged.active = false;

		while ( scene.children.length > 0 ) {

			this.addObject( scene.children[ 0 ] );

		}

		this.signals.sceneGraphChanged.active = true;
		this.signals.sceneGraphChanged.dispatch();

	},

	//

	addObject: function ( object ) {

		var scope = this;

		object.traverse( function ( child ) {

			if ( child.geometry !== undefined ) scope.addGeometry( child.geometry );
			if ( child.material !== undefined ) scope.addMaterial( child.material );

			scope.addHelper( child );

		} );

		this.scene.add( object );

		this.signals.objectAdded.dispatch( object );
		this.signals.sceneGraphChanged.dispatch();

	},

	moveObject: function ( object, parent, before ) {

		if ( parent === undefined ) {

			parent = this.scene;

		}

		parent.add( object );

		// sort children array

		if ( before !== undefined ) {

			var index = parent.children.indexOf( before );
			parent.children.splice( index, 0, object );
			parent.children.pop();

		}

		this.signals.sceneGraphChanged.dispatch();

	},

	nameObject: function ( object, name ) {

		object.name = name;
		this.signals.sceneGraphChanged.dispatch();

	},

	removeObject: function ( object ) {

		if ( object.parent === null ) return; // avoid deleting the camera or scene

		var scope = this;

		object.traverse( function ( child ) {

			scope.removeHelper( child );

		} );

		object.parent.remove( object );

		this.signals.objectRemoved.dispatch( object );
		this.signals.sceneGraphChanged.dispatch();

	},

	addGeometry: function ( geometry ) {

		this.geometries[ geometry.uuid ] = geometry;

	},

	setGeometryName: function ( geometry, name ) {

		geometry.name = name;
		this.signals.sceneGraphChanged.dispatch();

	},

	addMaterial: function ( material ) {

		this.materials[ material.uuid ] = material;

	},

	setMaterialName: function ( material, name ) {

		material.name = name;
		this.signals.sceneGraphChanged.dispatch();

	},

	addTexture: function ( texture ) {

		this.textures[ texture.uuid ] = texture;

	},

	//

	addHelper: function () {

		var geometry = new THREE.SphereBufferGeometry( 2, 4, 2 );
		var material = new THREE.MeshBasicMaterial( { color: 0xff0000, visible: false } );

		return function ( object ) {

			var helper;

			if ( object instanceof THREE.Camera ) {

				helper = new THREE.CameraHelper( object, 1 );

			} else if ( object instanceof THREE.PointLight ) {

				helper = new THREE.PointLightHelper( object, 1 );

			} else if ( object instanceof THREE.DirectionalLight ) {

				helper = new THREE.DirectionalLightHelper( object, 1 );

			} else if ( object instanceof THREE.SpotLight ) {

				helper = new THREE.SpotLightHelper( object, 1 );

			} else if ( object instanceof THREE.HemisphereLight ) {

				helper = new THREE.HemisphereLightHelper( object, 1 );

			} else if ( object instanceof THREE.SkinnedMesh ) {

				helper = new THREE.SkeletonHelper( object );

			} else {

				// no helper for this object type
				return;

			}

			var picker = new THREE.Mesh( geometry, material );
			picker.name = 'picker';
			picker.userData.object = object;
			helper.add( picker );

			this.sceneHelpers.add( helper );
			this.helpers[ object.id ] = helper;

			this.signals.helperAdded.dispatch( helper );

		};

	}(),

	removeHelper: function ( object ) {

		if ( this.helpers[ object.id ] !== undefined ) {

			var helper = this.helpers[ object.id ];
			helper.parent.remove( helper );

			delete this.helpers[ object.id ];

			this.signals.helperRemoved.dispatch( helper );

		}

	},

	//

	addScript: function ( object, script ) {

		if ( this.scripts[ object.uuid ] === undefined ) {

			this.scripts[ object.uuid ] = [];

		}

		this.scripts[ object.uuid ].push( script );

		this.signals.scriptAdded.dispatch( script );

	},

	removeScript: function ( object, script ) {

		if ( this.scripts[ object.uuid ] === undefined ) return;

		var index = this.scripts[ object.uuid ].indexOf( script );

		if ( index !== - 1 ) {

			this.scripts[ object.uuid ].splice( index, 1 );

		}

		this.signals.scriptRemoved.dispatch( script );

	},

	//

	select: function ( object ) {

		if ( this.selected === object ) return;

		var uuid = null;

		if ( object !== null ) {

			uuid = object.uuid;

		}

		this.selected = object;

		//this.config.setKey( 'selected', uuid );
		this.signals.objectSelected.dispatch( object );
                if ( object !== null ) {
                    // Send uuid of selected object across socket
                    var json = JSON.stringify({
                        "event": "select",
                        "uuid": uuid,
                        "name": object.name});
                    sendText(json);
                }
	},

	selectById: function ( id ) {

		if ( id === this.camera.id ) {

			this.select( this.camera );
			return;

		}

		this.select( this.scene.getObjectById( id, true ) );

	},

	selectByUuid: function ( uuid ) {

		var scope = this;

		this.scene.traverse( function ( child ) {

			if ( child.uuid === uuid ) {

				scope.select( child );

			}

		} );

	},

	deselect: function () {

		this.select( null );

	},

	focus: function ( object ) {

		this.signals.objectFocused.dispatch( object );

	},

	focusById: function ( id ) {

		this.focus( this.scene.getObjectById( id, true ) );

	},

	clear: function () {

		this.history.clear();
		this.storage.clear();

		this.camera.copy( this.DEFAULT_CAMERA );
		this.dolly_camera.copy(this.DEFAULT_CAMERA);

		var objects = this.scene.children;

		while ( objects.length > 0 ) {

			this.removeObject( objects[ 0 ] );

		}

		this.geometries = {};
		this.materials = {};
		this.textures = {};
		this.scripts = {};

		this.deselect();

		this.signals.editorCleared.dispatch();

	},

	//

	fromJSON: function ( json ) {

		var loader = new THREE.ObjectLoader();

		// backwards

		if ( json.scene === undefined ) {

			this.setScene( loader.parse( json ) );
			return;

		}

		var camera = loader.parse( json.camera );

		this.camera.copy( camera );
		this.camera.aspect = this.DEFAULT_CAMERA.aspect;
		this.camera.updateProjectionMatrix();

		this.history.fromJSON( json.history );
		this.scripts = json.scripts;

		this.setScene( loader.parse( json.scene ) );

	},

	addfromJSON: function ( json ) {

		var loader = new THREE.OpenSimLoader();
		this.signals.sceneGraphChanged.active = false;
		model = loader.parse( json );
		model.parent = this.modelsGroup;
		var exist = this.models.indexOf(model.uuid);
		if (exist == -1){
		    //this.scene.add( model );
		    this.currentModel=model;
		    this.addModelLight(model);
		    this.addObject(model);
		    this.models.push(model.uuid);
		    this.setCurrentModel(model.uuid);
		    this.adjustSceneAfterModelLoading();
		    //this.scripts = json.scripts;
		    // The next 2 line has to be made after helper was added to scene to fix helper display
		    var modelLight = model.getObjectByName('ModelLight');
		    this.helpers[modelLight.id].update();
		    this.signals.sceneGraphChanged.active = true;
		    this.signals.sceneGraphChanged.dispatch();
		    this.viewFitAll();
		    this.signals.windowResize.dispatch();
	    }
	},
	
	loadModel: function ( modelJsonFileName) {
		var loader = new THREE.XHRLoader();
		loader.crossOrigin = '';
		loader.load( modelJsonFileName, function ( text ) {
		    var json = JSON.parse( text );
		    //editor.clear();
		    editor.addfromJSON( json );
		    editor.signals.sceneGraphChanged.dispatch();
		} );	
	},
	enableShadows: function (modeluuid, newSetting) {
	    modelobject = editor.objectByUuid(modeluuid);
	    if (modelobject != undefined){
		modelobject.traverse( function ( child ) {
		    if (child instanceof THREE.Mesh)
			child.castShadow = newSetting;
			child.receiveShadow = newSetting;
		});
	    }
	},
	closeModel: function (modeluuid) {
	    if (this.models.indexOf(modeluuid)!=-1){
		ndx = this.models.indexOf(modeluuid);
		this.models.splice(ndx, 1);
		modelObject = editor.objectByUuid(modeluuid);
		editor.removeObject(modelObject);
	    }
	    this.signals.sceneGraphChanged.dispatch();
	},
	setCurrentModel: function ( modeluuid ) {
	    if (this.currentModel == modeluuid) 
		return; // Nothing to do
	    this.currentModel = modeluuid;
	    if (this.currentModel == undefined)
		return;
	    newCurrentModel = editor.objectByUuid(modeluuid);
	    // Dim light for all other models and make the model have shadows, 
	    // Specififc light
	    for ( var modindex = 0; modindex < this.models.length; modindex++ ) {
		if (this.models[modindex] == modeluuid){
		    modelLight = newCurrentModel.getObjectByName('ModelLight');
		    modelLight.color = this.currentModelColor;
		    modelLight.visible = true;
		    this.enableShadows(modeluuid, true);
		}
		else{
		    other_uuid = this.models[modindex];
		    nonCurrentModel = editor.objectByUuid(other_uuid);
		    modelLight = nonCurrentModel.getObjectByName('ModelLight');
		    modelLight.color = this.nonCurrentModelColor;
		    modelLight.visible = false;
		    this.enableShadows(other_uuid, false);
		}
	    }
	    this.signals.sceneGraphChanged.dispatch();
	},
	toJSON: function () {

		// scripts clean up

		var scene = this.scene;
		var scripts = this.scripts;

		for ( var key in scripts ) {

			var script = scripts[ key ];

			if ( script.length === 0 || scene.getObjectByProperty( 'uuid', key ) === undefined ) {

				delete scripts[ key ];

			}

		}

		//

		return {

			metadata: {},
			project: {
				shadows: this.config.getKey( 'project/renderer/shadows' ),
				editable: this.config.getKey( 'project/editable' ),
				vr: this.config.getKey( 'project/vr' )
			},
			camera: this.camera.toJSON(),
			scene: this.scene.toJSON(),
			scripts: this.scripts,
			history: this.history.toJSON()

		};

	},

	objectByUuid: function ( uuid ) {

		return this.scene.getObjectByProperty( 'uuid', uuid, true );

	},

	execute: function ( cmd, optionalName ) {

		this.history.execute( cmd, optionalName );

	},

	undo: function () {

		this.history.undo();

	},

	redo: function () {

		this.history.redo();

	},

	createBackground: function(choice) {
	    if (choice == 'nobackground') {
	        this.scene.background = new THREE.Color(0xff0000);
	        this.signals.backgroundColorChanged.dispatch(this.scene.background.getHex());
	        return;
	    }
	    // load the cube textures
	    // you need to create an instance of the loader...
	    var textureloader = new THREE.CubeTextureLoader();
	    var path = 'images/'+choice+'/';
	    textureloader.setPath(path);
	    // and then set your CORS config
	    var textureCube = textureloader.load( ["px.jpg",
		"nx.jpg", "py.jpg", "ny.jpg", 
		"pz.jpg", "nz.jpg"] );
	    textureCube.format = THREE.RGBFormat;
	    textureloader.mapping = THREE.CubeRefactionMapping;
	    this.scene.background = textureCube;
	},
	
	createGroundPlane: function(choice) {
	    if (choice == 'nofloor')
	        return;
		var textureLoader = new THREE.TextureLoader();
		var texture1 = textureLoader.load( "textures/"+choice+".jpg" );
		var material1 = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture1 } );
		texture1.wrapS = texture1.wrapT = THREE.RepeatWrapping;
		texture1.repeat.set( 128, 128 );
		var geometry = new THREE.PlaneBufferGeometry( 100, 100 );
		groundPlane = new THREE.Mesh( geometry, material1 );
		groundPlane.name = 'GroundPlane';
		groundPlane.rotation.x = - Math.PI / 2;
		groundPlane.position.y = -.01;
		groundPlane.scale.set( 500, 500, 500 );
		groundPlane.receiveShadow = true;
		this.addObject(groundPlane);
		this.groundPlane = groundPlane;
	},
	createModelsGroup: function () {
	    if (this.modelsGroup == undefined) {
		modelsGroup = new THREE.Group();
		modelsGroup.name = "Models";
		this.addObject(modelsGroup);
		this.modelsGroup = modelsGroup;
	    }
	},
	createLights: function () {

		amb = new THREE.AmbientLight(0x000000);
		amb.name = 'AmbientLight';
		amb.intensity = 0.2;
		this.addObject(amb);
		sceneLightColor = new THREE.Color().setHex(12040119);
		directionalLight =  new THREE.DirectionalLight( sceneLightColor);
		directionalLight.castShadow = true;
		directionalLight.name = 'SceneLight';
		directionalLight.shadow.camera.bottom = -1000;
		directionalLight.shadow.camera.far = 2000;
		directionalLight.shadow.camera.left = -1000;
		directionalLight.shadow.camera.right = 1000;
		directionalLight.shadow.camera.top = 1000;
		directionalLight.visible = true;
		this.sceneLight = directionalLight;
		this.addObject(directionalLight);
        // HemisphericalLight 
		hemiSphereLight = new THREE.HemisphereLight(10724259, 0, 1);
		hemiSphereLight.name = 'GlobalLight';
		this.addObject(hemiSphereLight);
	},

	updateBackground: function (choice) {
	    this.config.setKey('skybox', choice);
		if (choice == 'nobackground') {
		    //this.skyboxMesh.visible = false;
		    this.scene.background = new THREE.Color(0xff0000);
		    //this.signals.objectChanged.dispatch( this.scene.background );
		    return;
		}
		this.createBackground(choice);
	},

	updateGroundPlane: function (choice) {
	    this.config.setKey('floor', choice);
	    if (choice == 'nofloor') {
	        if (this.groundPlane !== null) {
	            this.groundPlane.visible = false;
	            this.signals.objectChanged.dispatch(groundPlane);
	        }
		    return;
	    }
	    if (this.groundPlane == null) {
	        this.createGroundPlane(choice);
	        return;
	    }
		this.groundPlane.visible = true;
		var textureLoader = new THREE.TextureLoader();
		var texture1 = textureLoader.load("textures/"+choice+".jpg");
		texture1.wrapS = texture1.wrapT = THREE.RepeatWrapping;
		texture1.repeat.set(128, 128);
		this.groundMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, map: texture1 });
		this.groundPlane.material = this.groundMaterial;
		this.signals.materialChanged.dispatch( this.groundPlane );
	},
	updateBackgroundColor: function (newColor) {
	    this.scene.background = new THREE.Color(newColor);
	    this.signals.backgroundColorChanged.dispatch(this.scene.background.getHex());
	},
	getGroundSelection: function () {
	    return this.config.getKey('floor');
	},
	createDollyPath: function () {

	    ///this.scene.add(this.dolly_object);
	    tube = new THREE.TubeGeometry(this.dollyPath, 100, 5, 8, true);
	    tubemat = new THREE.MeshLambertMaterial({
	        color: 0xff00ff
	    });
	    tubeMesh = new THREE.Mesh(tube, tubemat);
	    tubeMesh.name = "DollyPath";
	    // evaluate dollyPath at t=0 and use that to place dolly_camera
	    this.dolly_camera.position = this.dollyPath.getPoint(0);
	    this.dolly_object.add(this.dolly_camera);
	    this.dolly_object.add(tubeMesh);
	    //this.dolly_object.add(this.cameraEye);
	    dcameraHelper = new THREE.CameraHelper(this.dolly_camera);
	    ///this.sceneHelpers.add(dcameraHelper);

	},
		createLogoSprite: function() {
			var getLogoTexture = function () {
				var texture = new THREE.ImageUtils.loadTexture("OpenSimLogoSmall.PNG");
				return texture;
			};
			var spriteMaterial = new THREE.SpriteMaterial({
						opacity: 0.5,
						color: 0xffffff,
						transparent: false,
						// useScreenCoordinates: true,
						map: getLogoTexture()}
			);

			spriteMaterial.scaleByViewport = false;
			spriteMaterial.blending = THREE.AdditiveBlending;

			var sprite = new THREE.Sprite(spriteMaterial);
			sprite.scale.set(100, 100, 100);
			sprite.position.set(100, 100, 0);

			this.sceneOrtho.add(sprite);
		},
	getModel: function () {
	    return editor.objectByUuid(this.currentModel);
	},

	addMarkerAtPosition: function (testPosition) {

	    var sphere = new THREE.SphereGeometry(20, 20, 20);
	    var sphereMesh = new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ color: 0xff0040 }));
	    sphereMesh.position.copy(testPosition);
	    this.scene.add(sphereMesh);
	},

	updateCamera: function (newposition, viewCenter) {

	    this.camera.position.set(newposition.x, newposition.y, newposition.z);
	    this.camera.lookAt(viewCenter);
	    this.sceneLight.position.copy(this.camera.position);
	    var changeEvent = { type: 'change' };
	    this.control.dispatchEvent( changeEvent );
	    this.signals.defaultCameraApplied.dispatch(viewCenter);
	},

	viewZoom: function(in_out) {
	    // Debug	    
	    var vector = new THREE.Vector3(0, 0, -1 * in_out);
	    vector.applyQuaternion(this.camera.quaternion);
	    var newPos = this.camera.position.add(vector);
	    this.camera.position.copy(newPos);
	    
	    this.signals.cameraChanged.dispatch(this.camera);
	},

	viewFitAll: function () {

	    var modelObject = this.getModel();
	    var modelbbox = new THREE.Box3();
	    if (modelObject != undefined)
		modelbbox.setFromObject(modelObject);
	    var radius = Math.max(modelbbox.max.x - modelbbox.min.x, modelbbox.max.y - modelbbox.min.y, modelbbox.max.z - modelbbox.min.z) / 2;
	    var aabbCenter = new THREE.Vector3();
	    modelbbox.center(aabbCenter);

	    // Compute offset needed to move the camera back that much needed to center AABB (approx: better if from BB front face)
	    var offset = radius / Math.tan(Math.PI / 180.0 * 25 * 0.5);

	    // Compute new camera direction and position
	    var dir = new THREE.Vector3(0.0, 0.0, 1.0);
	    if (this.camera != undefined){
	        dir.x = this.camera.matrix.elements[8];
	        dir.y = this.camera.matrix.elements[9];
	        dir.z = this.camera.matrix.elements[10];
        }
	    dir.multiplyScalar(offset);
	    var newPos = new THREE.Vector3();
	    newPos.addVectors(aabbCenter, dir);
	    this.camera.position.set(newPos.x, newPos.y, newPos.z);
	    this.camera.lookAt(aabbCenter);
	    this.signals.defaultCameraApplied.dispatch(aabbCenter);

	},
    // Fix scene after loading a model by placing directional light at the corner
    // of bounding box and dolly at half hight.
	adjustSceneAfterModelLoading: function () {
	    var modelObject = this.getModel();
	    var modelbbox = new THREE.Box3().setFromObject(modelObject);
	    /*
	    var helper = new THREE.BoundingBoxHelper(modelObject, 0xff0000);
	    helper.name = 'boundingbox';
	    helper.update();
	    if (modelObject != undefined)
		modelObject.add(helper);
	    */
	    builtinLight = this.scene.getObjectByName('SceneLight');
	    builtinLight.position.copy(new THREE.Vector3(modelbbox.max.x, modelbbox.max.y+100, modelbbox.min.z));
	    // Move dolly to middle hight of bbox and make it invisible
	    this.dolly_object.position.y = (modelbbox.max.y + modelbbox.min.y) / 2;
	    path = this.scene.getObjectByName('DollyPath');
	    ///path.visible = false;
	    // Compute Offset so that models don't overlap
	    if (this.models.length==1)
		return; // No need for offset
	    // Multiple models, compute box bounding all previous models and use to offset
	    nextModel = editor.objectByUuid(this.models[0]);
	    sceneBox = new THREE.Box3().setFromObject(nextModel);
	    for ( var modindex = 1; modindex < this.models.length-1; modindex++ ) {
		nextModel = editor.objectByUuid(this.models[modindex]);
		nextModelBox = new THREE.Box3().setFromObject(nextModel);
		sceneBox.union(nextModelBox);
	    }
	    modelObject.position.z = sceneBox.max.z+modelbbox.max.z-modelbbox.min.z;
	    modelObject.getObjectByName('ModelLight').target.updateMatrixWorld();
	},
	addModelLight: function(model) {
	    var modelbbox = new THREE.Box3().setFromObject(model);
	    var modelCenter = new THREE.Vector3();
	    modelbbox.center(modelCenter);
	    modelCenterGroup = new THREE.Group();
	    modelCenterGroup.name = "ModelCenter";
	    modelCenterGroup.position.copy(new THREE.Vector3(modelCenter.x, modelCenter.y, modelCenter.z));
	    model.add(modelCenterGroup);
	    modelLight =  new THREE.SpotLight( {color: this.currentModelColor});
	    modelLight.castShadow = true;
	    modelLight.angle = 0.5;
	    modelLight.name = 'ModelLight';
	    modelLight.shadow.camera.bottom = -1000;
	    modelLight.shadow.camera.far = 2000;
	    modelLight.shadow.camera.left = -1000;
	    modelLight.shadow.camera.right = 1000;
	    modelLight.shadow.camera.top = 1000;
	    modelLight.position.copy(new THREE.Vector3((modelbbox.max.x+modelbbox.min.x)/2, 
		modelbbox.max.y+100, (modelbbox.min.z+modelbbox.max.z)/2));
	    modelLight.target = modelCenterGroup;
	    model.add(modelLight);
	},
	setFloorHeight: function(newHeight) {
	    if (this.groundPlane !== undefined){
		this.groundPlane.position.y = newHeight*1000;
	    }
	},
	getSceneLightPosition: function(coord) {
	    sceneLightpos = this.sceneLight.position;
	    if (coord === 'x')
		return sceneLightpos.x/1000.0;
	    else if (coord === 'y')
		return sceneLightpos.y/1000.0;
	    else
		return sceneLightpos.z/1000.0;
	},
	updateSceneLight: function(param, val){
	    if (param==='color'){
		this.sceneLight.color = new THREE.Color(val);
		return;
	    }
	    sceneLightpos = this.sceneLight.position;
	    if (param === 'x')
		sceneLightpos.x += val*1000;
	    else if (param === 'y')
		sceneLightpos.y += val*1000;
	    else
		sceneLightpos.z += val*1000;
	},
	toggleMarkup: function () {
	    oldValue = this.config.getKey('render/debug');
	    newValue = !oldValue;
	    this.config.setKey('render/debug', newValue);
	    this.signals.renderDebugChanged.dispatch(newValue);
	},
        selectCurrentModelLight: function () {
            if (this.currentModel === undefined) return;
            var modelObject = this.getModel();
            var modelLight = modelObject.getObjectByName('ModelLight');
            this.select(modelLight);
	},
	updatePath: function (pathUpdateJson) {
	    var pathObject = this.objectByUuid(pathUpdateJson.uuid);
        /*
            pathpoints = pathObject.pathpoints;
            for (var i = 0; i < pathpoints.length; i++) {
                var nextpathpoint = this.objectByUuid(pathpoints[i]);
                nextpathpoint.updateMatrixWorld();
                pathObject.geometry.vertices[i].setFromMatrixPosition(nextpathpoint.matrixWorld);
            }
            pathObject.geometry.verticesNeedUpdate = true;*/
            pathObject.material.color.setHex(pathUpdateJson.color);
        }

};
