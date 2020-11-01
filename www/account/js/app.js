'use strict';

var data = {}; // Global data
var sys = {}; // Global system

var app = angular.module('app', ['ngResource','ngRoute','ckeditor']);

/**
 * When the app is fully loaded
 */
angular.element(document).ready(function() {
	//Fixing facebook bug with redirect
	if (window.location.hash === '#_=_') window.location.hash = '#';

	// Booting up the Angular Web App docs to the scope of the entire document
	angular.bootstrap(document, ['app']);

	// Set up ckeditor
	sys.ckeditorOptions={
		forcePasteAsPlainText: true,
		language: 'en',
		allowedContent: true,
		entities: false,
		height: '90vh',
	};
	if(window.CKEDITOR != null){
		nhm.Global.editor = CKEDITOR;
		CKEDITOR.editorConfig = function(config)
		{
			config.height = '500px';
			config.protectedSource.push( /\n/g );
			Object.assign(config, sys.ckeditorOptions);
		};
	}
});

//Setting HTML5 Location Mode
app.config(['$locationProvider','$routeProvider',
	function($locationProvider, $routeProvider) {
		$locationProvider
			.hashPrefix('!')
			.html5Mode(true);

		$routeProvider
			.when('/:page', {
				controller: 'Main',
				templateUrl: function(params){
					if(data.pages) sys.goto(params.page);
					return '/layout/footer.html';
				}
			})
			.when('/edit/:page', {
				controller: 'Main',
				templateUrl: function(params){
					sys.edit(params.page)
					return '/layout/footer.html';
				}
			})

			.otherwise({
				redirectTo: '/welcome'
			});
	}
]);

app.filter('html', ['$sce', $sce => input => $sce.trustAsHtml(input || '')]);
