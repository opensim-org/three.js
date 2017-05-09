/**
 * @author Ayman Habib 
 */
THREE.SkinnedMuscle = function(geom, points) {
    // Create bones for uuids in geometryPath
    this.pathpoints = points;
    geom.bones = [];
    for (var i=0; i<points.length; i++) {
        var bone = new THREE.Bone();
        bone.pos = [0, 0, 0];
        bone.rotq = [0, 0, 0, 1];
        bone.ppt = this.pathpoints[i];
        geom.bones.push(bone);
    }
    var numVerticesPerLevel = geom.vertices.length / points.length;
    for ( var i = 0; i < geom.vertices.length; i ++ ) {
        var skinIndex = Math.floor(i / numVerticesPerLevel);
        geom.skinIndices.push(new THREE.Vector4(skinIndex, 0, 0, 0));
        geom.skinWeights.push( new THREE.Vector4( 1, 0, 0, 0 ) );
    }
    geom.dynamic = true;
    THREE.SkinnedMesh.call( this, geom );
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
    for ( var b=0; b < this.pathpoints.length; b++) {
        var ppt = this.pathpoints[b];
        var pptObject = editor.objectByUuid(ppt);
        if (pptObject !== undefined) {
            this.children[b].position.setFromMatrixPosition(pptObject.matrixWorld);

            //bones[b].pos.setFromMatrixPosition(pptObject.matrixWorld);
            //console.warn('bone '+b+' pos ='+bones[b].position.x, bones[b].position.y, bones[b].position.z);
            this.children[b].updateMatrixWorld();
        }
    }
    this.skeleton.update();
    THREE.SkinnedMesh.prototype.updateMatrixWorld.call( this, true );
};
