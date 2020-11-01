app.controller('EditArticle', ['$scope', '$location', function ($scope, $location) {

	const Util = nhm.Util;

	const Articles = nhm.Data('articles');

	sys.edArt = {
		init: () => {
			return (async()=>{
				let [,page,tag] = $location.path().match(/\/([^\/]+)\/?([^\/]+)?/);
				data.edArt = await Articles.read({tag});
				$location.path(`/editArticle/${tag}`);
				sys.editor = new tui.Editor({
					el: document.querySelector('#edart'),
					previewStyle: 'vertical',
					height: '300px',
					initialEditType: 'markdown',
					initialValue: data.edArt.content
				});
				sys.editor.on('change',()=>{
					Articles.change({field:'content', id:data.edArt.id, value: sys.editor.getValue()})
				})
				sys.safeApply();
			})().catch(nhm.Log.genFailer('sys.edArt.init'));
		},
		changed: field=>{
			if(field=='content') data.edArt.content = Util.stripSlashes(data.edArt.content)
			if(data.edArt && data.edArt.id)
				Articles.change({field, id: data.edArt.id, value: data.edArt[field]});
		},
	}


}]);

