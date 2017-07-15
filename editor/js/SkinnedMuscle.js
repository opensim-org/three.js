/**
 * @author Ayman Habib
 */
THREE.SkinnedMuscle = function(geom, points, material) {
    // Create bones for uuids in geometryPath
    this.pathpoints = points;
    this.pathpointObjects = [];
    geom.bones = [];
    this.DEBUG = true;
    for (var i=0; i< 2*points.length; i++) {
        var bone = new THREE.Bone();
        bone.pos = [0, 0, 0];
        bone.rotq = [0, 0, 0, 1];
        //bone.rotq = [0.70711, 0, 0, 0.70711]; //[0, 0, 0, 1];
        bone.ppt = this.pathpoints[Math.floor(i/2)];
        geom.bones.push(bone);
    }

    console.warn("Num bones:" + geom.bones.length);

    var numVerticesPerLevel = geom.vertices.length / points.length;
    for ( var i = 0; i < geom.vertices.length; i ++ ) {
        var skinIndex = Math.floor(i / numVerticesPerLevel);
        geom.skinIndices.push(new THREE.Vector4(skinIndex, 0, 0, 0));
        geom.skinWeights.push( new THREE.Vector4( 1, 0, 0, 0 ) );
    }
    geom.dynamic = true;
    THREE.SkinnedMesh.call( this, geom );
    this.material = material;
    this.material.skinning = true;
};

THREE.SkinnedMuscle.prototype = Object.create( THREE.SkinnedMesh.prototype );
THREE.SkinnedMuscle.prototype.constructor = THREE.SkinnedMuscle;

THREE.SkinnedMuscle.prototype.updateMatrixWorld = function( force ) {
// if has pathpoints attribute then it's a muscle
// Cycle through pathpoints, update their matrixworld
// then set the position of the Bones from that
    if (this.skeleton === undefined)
        return;
    var bones = this.skeleton.bones;
    if (this.pathpointObjects.length != this.pathpoints.length){
        for ( var b=0; b < this.pathpoints.length; b++) {
            var ppt = this.pathpoints[b];
            var pptObject = editor.objectByUuid(ppt);
            if (pptObject !== undefined) {
                this.pathpointObjects.push(pptObject);
                bones[b].geometry = pptObject.geometry;
            }
        }
    }
    // Compute reverse transform from Ground to Scene (usually this's inverse translation)
    // This is necessary since the blending to compute vertices adds offset twice
    var mat = new THREE.Matrix4().getInverse(this.parent.matrixWorld);
    var vec = new THREE.Vector3(0, 0.02, 0.05); //.setFromMatrixPosition(mat);

    // clycle through each PathPoint and add two "bones" for each point
    // one aligned with the currect parent and the second to the next
    for (var p = 0; p < this.pathpoints.length; p++) {
        var thisPathpointObject = this.pathpointObjects[p];
        if (thisPathpointObject !== undefined) {
            this.children[2*p].position.setFromMatrixPosition(thisPathpointObject.matrixWorld);
            this.children[2*p].position.add(vec);
            this.children[2*p].quaternion.setFromRotationMatrix(thisPathpointObject.matrixWorld);

            var nextPathpointObject = this.pathpointObjects[p+1];
            if(nextPathpointObject !== undefined) {
              this.children[2*p+1].position.setFromMatrixPosition(nextPathpointObject.matrixWorld);
              this.children[2*p+1].position.add(vec);
              this.children[2*p+1].quaternion.setFromRotationMatrix(nextPathpointObject.matrixWorld);
            }
            else{

              this.children[2*p+1].position.setFromMatrixPosition(thisPathpointObject.matrixWorld);
              this.children[2*p+1].position.add(vec);
              this.children[2*p+1].quaternion.setFromRotationMatrix(thisPathpointObject.matrixWorld);
            }

            if (this.DEBUG) {
                console.warn("Path point name: " + thisPathpointObject.name);
                console.warn("Num pathpoints = " + this.pathpoints.length);
                console.warn("Num bones = " + this.children.length);
                console.warn("This is vec:" + vec.toArray());
                console.dir(this.children[2*p+1]);
                this.DEBUG = false;
            }
            //bones[b].pos.setFromMatrixPosition(pptObject.matrixWorld);
            //console.warn('bone '+b+' pos ='+bones[b].position.x, bones[b].position.y, bones[b].position.z);
            this.children[2*p].updateMatrixWorld();
            this.children[2*p+1].updateMatrixWorld();
        }
    }
    this.skeleton.update();
    THREE.SkinnedMesh.prototype.updateMatrixWorld.call( this, true );
};
