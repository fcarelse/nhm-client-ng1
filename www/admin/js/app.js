'use strict';

var data = {}; // Global data
var sys = {}; // Global system

var app = angular.module('app', ['ngResource','ngRoute','ckeditor','xeditable']);

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
		height: '50vh',
		contenteditable: true
	};
	if(window.CKEDITOR != null){
		nhm.Global.editor = CKEDITOR;
		// CKEDITOR.editorConfig = function(config)
		// {
		// 	config.height = '50vh';
		// 	config.protectedSource.push( /\n/g );
		// 	Object.assign(config, sys.ckeditorOptions);
		// };
	}
	nhm.Select.adminPages.push(
		{tag: 'tasks', name: 'Tasks Manager', url: '/admin/views/tasks.html', redirect: '/admin/tasks', menu: 'admin', viewport: 'admin'},
		{tag: 'task', name: 'Task Editor', url: '/admin/views/task.html', redirect: '/admin/task', menu: 'admin', viewport: 'admin', hide: true},
	)
});

//Setting HTML5 Location Mode
app.config(['$locationProvider','$routeProvider',
	function($locationProvider, $routeProvider) {
		$locationProvider
			.hashPrefix('!')
			.html5Mode(true);

		$routeProvider
			.when('/task/:id', {
				controller: 'Main',
				templateUrl: function(params){
					return '/layout/footer.html';
				}
			})
			.when('/editPage/:page', {
				controller: 'Main',
				templateUrl: function(params){
					// if(sys.edit) sys.edit(params.page);
					return '/layout/footer.html';
				}
			})
			.when('/editArticle/:article', {
				controller: 'Main',
				templateUrl: function(params){
					// if(sys.edArt && sys.edArt.init) sys.edArt.init(params.article);
					return '/layout/footer.html';
				}
			})
			.when('/:page', {
				controller: 'Main',
				templateUrl: function(params){
					if(data.pages && sys.goto) sys.goto(params.page);
					return '/layout/footer.html';
				}
			})
			.otherwise({
				redirectTo: '/welcome'
			});
	}
]);

app.run(['editableOptions', function(editableOptions) {
  editableOptions.theme = 'bs4'; // bootstrap3 theme. Can be also 'bs4', 'bs2', 'default'
}]);

app.filter('html', ['$sce', $sce => input => $sce.trustAsHtml(input || '')]);

