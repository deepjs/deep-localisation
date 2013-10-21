if(typeof define !== 'function')
	var define = require('amdefine')(module);

define(["require","deep/deep"],function (require, deep)
{
	var deep = require("deep/deep");
	//__________________________________________________
	deep.protocoles.translate = new deep.Store();

	deep.protocoles.translate.map = {
	};

	var filter = function (root, language, wrap, originPath) {
		// console.log("filter trans : ", root, language, wrap, originPath);
		var res = {};
		var current = null;
		var stack = [{ value:root, cur:res, path:"/" }];
		while(stack.length > 0)
		{
			current = stack.pop();
			currentRes = current.cur;
			var v = current.value;
			var r = [];

			if(v.forEach)
			{
				var len = v.length;
				for(var i = 0; i < len; ++i)
				{
					var va = v[i];
					if(typeof va === 'object')
					{
						if(va.push)
							currentRes[i] = [];
						else
							currentRes[i] = {};
						r.unshift({ value:va, cur:currentRes[i], path:current.path+i+"/" });
					}
				}
			}
			else
				for(var i in v)
				{
					if(i == "_deep_entry")
						continue;

					var va = v[i];
					if(typeof va[language] === 'string')
					{
						//console.log("Do we have Wrap() ?????????? ", wrap);
						currentRes[i] = wrap?wrap(va[language], current.path+i, originPath ):va[language];
					}
					else if(typeof va == "object")
					{
						if(va.push)
							currentRes[i] = [];
						else
							currentRes[i] = {};
						r.unshift({ value:va, cur:currentRes[i], path:current.path+i+"/"  });
					}
				}

			if(r.length > 0)
				stack = stack.concat(r);
				//console.log("stack : ", stack)
		}

		return res;
	};

	deep.protocoles.translate.options = null;
	deep.protocoles.translate.stock = {};

	deep.protocoles.translate.get = function (id, opt)
	{
		var options = deep.protocoles.translate.options || {};

		if(options && options._deep_ocm_)
			options = options();

		var lang = null;
		if(options)
		{
			if(options.language)
				lang = options.language();
			else if (options && options.defaultLanguage)
				lang = options.defaultLanguage;
		}
		if(!lang)
			return deep.errors.Protocole("No language available for translate protocole (get)");

		var parsedPath = id.split(" ");
		var key = null;
		id = parsedPath.shift();
		if(parsedPath.length == 1)
		key = parsedPath.shift();

		var cacheName = "translate-" + lang + "::" +id;
		if(options.cache !== false && deep.mediaCache.cache[cacheName])
		{
			var cached = deep.mediaCache.cache[cacheName];
			return cached.then(function(success){
			if(key)
				deep.protocoles.translate.stock[key] = success;
			});
		}
		var self = this;
		var d = deep.when(deep.get("json::" + id))
		.done(function (data) {
			var ok = deep.Querier.firstObjectWithProperty(data, lang);
			if(!ok)
				console.error( "current language not found in translation file : "+id+". Please update it for : ", lang );

			var resi = filter(data, lang, options.wrap, id);
			if(key)
				deep.protocoles.translate.stock[key] = resi;
			// console.log("translation resi : ", resi);
			return resi;
		});
		if((options && options.cache !== false)  || (options && options.cache !== false))
			deep.mediaCache.manage(d, cacheName);
		return d;
	};
	/*
	deep.protocoles.translate.patch = function (value, options) {
		//TODO
	};
	*/

	return function (opt) {
		//console.log("Options in tranlsate protocole = ", opt);
		deep.protocoles.translate.options = opt || {};
	};
});