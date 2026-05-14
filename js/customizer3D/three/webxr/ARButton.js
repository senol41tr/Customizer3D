class ARButton {

	static createButton( sessionInit = {}, c3d ) {

		const button = document.querySelector(c3d.props.container + ' > div.webXR > img.button');

		function showStartAR( /*device*/ ) {
			
			if ( sessionInit.domOverlay === undefined ) {

				const overlay = document.createElement( 'div' );
				overlay.style.display = 'none';
				document.body.appendChild( overlay );

				const svg = document.createElementNS( 'http://www.w3.org/2000/svg', 'svg' );
				svg.setAttribute( 'width', 38 );
				svg.setAttribute( 'height', 38 );
				svg.style.position = 'absolute';
				svg.style.right = '30px';
				svg.style.top = '30px';
				svg.addEventListener( 'click', function () {

					currentSession.end();

				} );
				overlay.appendChild( svg );

				const path = document.createElementNS( 'http://www.w3.org/2000/svg', 'path' );
				path.setAttribute( 'd', 'M 12,12 L 28,28 M 28,12 12,28' );
				path.setAttribute( 'stroke', '#fff' );
				path.setAttribute( 'stroke-width', 2 );
				svg.appendChild( path );


				const noticeDiv = document.createElement('div');
				noticeDiv.style.position = 'absolute';
				noticeDiv.style.left = '15px';
				noticeDiv.style.top = '30px';
				noticeDiv.style.color = '#fff';
				noticeDiv.style.backgroundColor = '#0073ff';
				noticeDiv.style.padding = '0.75rem';
				noticeDiv.style.fontFamily = 'var(--customizerFontFamily)';
				noticeDiv.style.fontSize = '0.75rem';
				noticeDiv.style.width = '200px';
				noticeDiv.style.borderRadius = '6px';
				noticeDiv.innerText = c3d.lang['webxr-notice'];
				overlay.appendChild(noticeDiv);
				setTimeout(() => { noticeDiv.style.display = 'none'; }, 30 * 1000);


				if ( sessionInit.optionalFeatures === undefined ) {

					sessionInit.optionalFeatures = [];

				}

				sessionInit.optionalFeatures.push( 'dom-overlay' );
				sessionInit.domOverlay = { root: overlay };

			}

			//

			let currentSession = null;

			async function onSessionStarted( session ) {

				session.addEventListener( 'end', onSessionEnded );

				c3d.webXR.three.renderer.xr.setReferenceSpaceType( 'local' );

				await c3d.webXR.three.renderer.xr.setSession( session );

				sessionInit.domOverlay.root.style.display = '';

				currentSession = session;

			}

			function onSessionEnded( /*event*/ ) {


				currentSession.removeEventListener( 'end', onSessionEnded );

				sessionInit.domOverlay.root.style.display = 'none';

				currentSession = null;
				c3d.webXR.stop();
			}

			button.style.display = 'flex';
			button.addEventListener('click', () => {

				c3d.webXR.start();

				if ( currentSession === null ) {

					navigator.xr.requestSession( 'immersive-ar', sessionInit ).then( onSessionStarted );

				} else {

					currentSession.end();

					if ( navigator.xr.offerSession !== undefined ) {

						navigator.xr.offerSession( 'immersive-ar', sessionInit )
							.then( onSessionStarted )
							.catch( ( err ) => {

								console.warn( err );

							} );

					}

				}

			});

			if ( navigator.xr.offerSession !== undefined ) {

				navigator.xr.offerSession( 'immersive-ar', sessionInit )
					.then( onSessionStarted )
					.catch( ( err ) => {

						console.warn( err );

					} );

			}

		}

		function disableButton() {

			document.querySelector(c3d.props.container + ' > div.webXR').style.display = 'none';
			button.onclick = null;

		}

		function showARNotSupported() {

			disableButton();
			// console.warn('AR NOT SUPPORTED');

		}

		function showARNotAllowed( exception ) {

			disableButton();

			console.warn( 'Exception when trying to call xr.isSessionSupported', exception );
		}

		function stylizeElement( element ) {

			element.style.position = 'absolute';
			element.style.bottom = '20px';
			element.style.padding = '12px 6px';
			element.style.border = '1px solid #fff';
			element.style.borderRadius = '4px';
			element.style.background = 'rgba(0,0,0,0.1)';
			element.style.color = '#fff';
			element.style.font = 'normal 13px sans-serif';
			element.style.textAlign = 'center';
			element.style.opacity = '0.5';
			element.style.outline = 'none';
			element.style.zIndex = '999';

		}

		if ( 'xr' in navigator ) {

			// button.id = 'C3D_ARButton';

			// stylizeElement( button );

			navigator.xr.isSessionSupported( 'immersive-ar' ).then( function ( supported ) {

				supported ? showStartAR() : showARNotSupported();

			} ).catch( showARNotAllowed );

			return button;

		} else {

			const message = document.createElement( 'a' );

			if ( window.isSecureContext === false ) {

				message.href = document.location.href.replace( /^http:/, 'https:' );
				message.innerHTML = 'WEBXR NEEDS HTTPS'; // TODO Improve message
				console.warn('WEBXR NEEDS HTTPS');
				disableButton();

			} else {

				message.href = 'https://immersiveweb.dev/';
				message.innerHTML = 'WEBXR NOT AVAILABLE';
			}

			message.style.left = 'calc(50% - 90px)';
			message.style.width = '180px';
			message.style.textDecoration = 'none';

			stylizeElement( message );

			return message;

		}

	}

}

export { ARButton };
