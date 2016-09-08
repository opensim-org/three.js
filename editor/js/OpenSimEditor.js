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

	this.cameraEye = new THREE.Mesh(new THREE.SphereGeometry(50), new THREE.MeshBasicMaterial({ color: 0xdddddd }));
	this.cameraEye.name = 'CameraEye';

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

	    animationStarted: new Signal(),
	    animationStopped: new Signal()
	};

	this.config = new Config( 'threejs-editor' );
	this.history = new History( this );
	this.storage = new Storage();
	this.loader = new Loader( this );

	this.camera = this.DEFAULT_CAMERA.clone();
	this.dollyPath = new THREE.ClosedSplineCurve3([
			new THREE.Vector3(-700, 0, -700),
			new THREE.Vector3(0, 0, -1000),
			new THREE.Vector3(700, 0, -700),
			new THREE.Vector3(1000, 0, 0),
			new THREE.Vector3(700, 0, 700),
			new THREE.Vector3(0, 0, 1000),
			new THREE.Vector3(-700, 0, 700),
			new THREE.Vector3(-1000, 0, 0),
	]);

	this.dollyPath.type = 'catmullrom';
	this.scene = new THREE.Scene();
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
	
	this.createLights();
	this.createBackground('sky');
	this.createGroundPlane('redbricks');
	this.createDollyPath();

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

		this.config.setKey( 'selected', uuid );
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

		var loader = new THREE.ObjectLoader();
                this.signals.sceneGraphChanged.active = false;
		model = loader.parse( json );
		//this.scene.add( model );
		this.addObject( model );
		//this.scripts = json.scripts;
		this.signals.sceneGraphChanged.active = true;
		this.signals.sceneGraphChanged.dispatch();
		this.viewFitAll();
		this.signals.windowResize.dispatch();
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

	createLights: function () {

		amb = new THREE.AmbientLight(0x000000);
		amb.name = 'AmbientLight';
		this.addObject(amb);
		directionalLight =  new THREE.DirectionalLight( {color: 16777215});
		directionalLight.castShadow = true;
		directionalLight.name = 'DirectionalLight';
		directionalLight.shadow.camera.bottom = -1000;
		directionalLight.shadow.camera.far = 2000;
		directionalLight.shadow.camera.left = -1000;
		directionalLight.shadow.camera.right = 1000;
		directionalLight.shadow.camera.top = 1000;
		
		this.addObject(directionalLight);
	},

	updateBackground: function (choice) {

		if (choice == 'nobackground') {
		    //this.skyboxMesh.visible = false;
		    this.scene.background = null;
		    this.signals.objectChanged.dispatch( this.scene.background );
		    return;
		}
		this.createBackground(choice);
	},

	updateGroundPlane: function (choice) {

		if (choice == 'nofloor') {
		    this.groundPlane.visible = false;
		    this.signals.objectChanged.dispatch( groundPlane );
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

	createDollyPath: function () {

	    this.scene.add(this.dolly_object);
	    tube = new THREE.TubeGeometry(this.dollyPath, 8, 5, 8, true);
	    tubemat = new THREE.MeshLambertMaterial({
	        color: 0xff00ff
	    });
	    tubeMesh = new THREE.Mesh(tube, tubemat);
	    tubeMesh.name = "DollyPath";
	    // evaluate dollyPath at t=0 and use that to place dolly_camera
	    this.dolly_camera.position = this.dollyPath.getPoint(0);
	    this.dolly_object.add(this.dolly_camera);
	    this.dolly_object.add(tubeMesh);
	    this.dolly_object.add(this.cameraEye);
	    dcameraHelper = new THREE.CameraHelper(this.dolly_camera);
	    this.scene.add(dcameraHelper);

	},

	getModel: function () {
	    return this.scene.getObjectByName('OpenSimModel');
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
	    //console.log(viewCenter);
	    //this.control.target = viewCenter;
	    //this.control.update();
	    var changeEvent = { type: 'change' };
	    this.control.dispatchEvent( changeEvent );
        //this.addMarkerAtPosition(newposition);
        //this.signals.cameraChanged.dispatch( this.camera );
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
	    var modelbbox = new THREE.Box3().setFromObject(modelObject);
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
	    //this.control.target = new THREE.Vector3(aabbCenter);
	    //this.control.update();
	}
};
