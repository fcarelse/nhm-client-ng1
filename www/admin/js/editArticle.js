app.controller('EditArticle', ['$scope', '$location', function ($scope, $location) {

	const Util = nhm.Util;

	const Articles = nhm.Data('articles');

	sys.editArticle = {
		init: () => {
			return (async()=>{
				let [,page,tag] = $location.path().match(/\/([^\/]+)\/?([^\/]+)?/);
				await Articles.read({tag});
				$location.path(`/editArticle/${tag}`);
				let ready = false;
				setTimeout(()=>ready = true,100);
				sys.editor = new tui.Editor({
					el: document.querySelector('#edart'),
					previewStyle: 'vertical',
					height: '300px',
					initialEditType: 'markdown',
					initialValue: data.article.content,
					events: {
						change: ()=>{
							if(!ready) return;
							data.article.content = sys.editor.getMarkdown();
							Articles.change({field:'content', id: data.article.id, value: data.article.content});
							nhm.Notify.add('Changed')
						},
					},
				});
				sys.safeApply();
			})().catch(nhm.Log.genFailer('sys.editArticle.init'));
		},
		changed: field=>{
			if(field=='content') data.editArticle.content = Util.stripSlashes(data.editArticle.content)
			if(data.editArticle && data.editArticle.id)
				Articles.change({field, id: data.editArticle.id, value: data.editArticle[field]});
		},
	}


}]);

