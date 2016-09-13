/**
 * @author mrdoob / http://mrdoob.com/
 */

Sidebar.Geometry.Geometry = function ( editor ) {

	var signals = editor.signals;

	var container = new UI.Row();

	// vertices

	var verticesRow = new UI.Row();
	var vertices = new UI.Text();

	verticesRow.add( new UI.Text( 'Vertices' ).setWidth( '90px' ) );
	verticesRow.add( vertices );

	container.add( verticesRow );

	// faces

	var facesRow = new UI.Row();
	var faces = new UI.Text();

	facesRow.add( new UI.Text( 'Faces' ).setWidth( '90px' ) );
	facesRow.add( faces );

	container.add( facesRow );

	//

	function update( object ) {

		if ( object === null ) return; // objectSelected.dispatch( null )
		if ( object === undefined ) return;

		var geometry = object.geometry;
                if ( geometry instanceof THREE.TubeGeometry ) {
                    container.add( new UI.Text( 'Control Points:' ).setWidth( '90px' ) );
                    var path = geometry.parameters.path;
                    var points = path.points;
                    for ( var index = 0; index < points.length; index ++ ){
                        var nextPoint = points[index];
                        var nextPointPositionRow = new UI.Row();
                        var nextPointPositionX = new UI.Number(nextPoint.x).setWidth( '50px' ).onChange( update );
                        var nextPointPositionY = new UI.Number(nextPoint.y).setWidth( '50px' ).onChange( update );
                        var nextPointPositionZ = new UI.Number(nextPoint.z).setWidth( '50px' ).onChange( update );
                        nextPointPositionRow.add( nextPointPositionX, nextPointPositionY, nextPointPositionZ );
                        container.add(nextPointPositionRow);
                    }
                }
                else if ( geometry instanceof THREE.Geometry ) {

			container.setDisplay( 'block' );

			vertices.setValue( ( geometry.vertices.length ).format() );
			faces.setValue( ( geometry.faces.length ).format() );

		} else {

			container.setDisplay( 'none' );

		}

	}

	signals.objectSelected.add( update );
	signals.geometryChanged.add( update );

	return container;

};
