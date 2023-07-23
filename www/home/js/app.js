'use strict';

var data = {}; // Global data
var sys = {}; // Global system

var app = angular.module('app', ['ngResource','ngRoute']);

/**
 * When the app is fully loaded
 */
angular.element(document).ready(function() {
	//Fixing facebook bug with redirect
	if (window.location.hash === '#_=_') window.location.hash = '#';

	// Booting up the Angular Web App docs to the scope of the entire document
	angular.bootstrap(document, ['app']);
});

//Setting HTML5 Location Mode
app.config(['$locationProvider','$routeProvider',
	function($locationProvider, $routeProvider) {
		$locationProvider
			.hashPrefix('!')
			.html5Mode(true);

		$routeProvider
			.when('/:page/:section?', {
				controller: 'Main',
				templateUrl: function(params){
					sys.goto(params.page, params.section).then(()=>{
						if(sys.genTOC) sys.genTOC()
					});
					return 'views/page.html';
				}
			})

			.when('/:page', {
				controller: 'Main',
				templateUrl: function(params){
					sys.goto(params.page);
					return 'views/page.html';
				}
			})

			.otherwise({
				redirectTo: '/welcome'
			});
	}
]);

app.filter('html', ['$sce', $sce => input => $sce.trustAsHtml(input || '')]);
