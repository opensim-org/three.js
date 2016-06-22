/**
 * @author Ayman Habib 
 */

THREE.SkinnedMuscle = function(points) {
    // Create bones for uuids in geometryPath
    this.pathpoints = points;
    var geom = new THREE.CylinderGeometry(5, 5, 1, 4, 1, true);
    geom.bones = [];
    for (var i=0; i<points.length; i++) {
        var bone = new THREE.Bone();
        bone.pos = [0, 0, 0];
        bone.rotq = [0, 0, 0, 1];
        bone.ppt = this.pathpoints[i];
        geom.bones.push(bone);
    }
    for ( var i = 0; i < geom.vertices.length; i ++ ) {
        var skinIndex = (i >4)?1:0;
        geom.skinIndices.push( new THREE.Vector4( 0, 1, 0, 1 ) );
        geom.skinWeights.push( new THREE.Vector4( skinIndex/2, (1-skinIndex)/2, skinIndex/2, (1-skinIndex)/2 ) );
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
        ppt = this.pathpoints[b];
        pptObject = editor.scene.getObjectByProperty('uuid', ppt);
        this.children[b].position.setFromMatrixPosition(pptObject.matrixWorld);
        //bones[b].pos.setFromMatrixPosition(pptObject.matrixWorld);
        //console.warn('bone '+b+' pos ='+bones[b].position.x, bones[b].position.y, bones[b].position.z);
        //this.geometry.vertices[b] =  pptObject.matrixWorld.getPosition();
        //bone.quaternion.fromArray( gbone.rotq );
        this.children[b].updateMatrixWorld();
    }
    this.skeleton.update();

    THREE.SkinnedMesh.prototype.updateMatrixWorld.call( this, true );
};
