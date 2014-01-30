/**
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 *
 */
var deep = require("deepjs");

var translators = exports.translators = {};

exports.middleware = function(initialiser){
	return function (req, res, next)
	{
		var splitted = req.url.split("/");
		if(splitted[0] != "tranlsate")
			return next();


		var lang = deep.context.language;
		splitted.shift();
		// console.log("translate middleware")
		var translator = splitted.shift();
		var path = splitted.join("/");


		var roles = deep.context.modes.roles, isTranslator = false;
		if(roles.foreach)
		{
			if(deep.utils.inArray("translator", roles))
				isTranslator = true;
		}
		else
		{
			if(roles == "translator")
				isTranslator = true;
		}

		if(translators[translator])
		{
			translator = translators[translator];
			var action = null;

			switch(req.method)
			{
				case "get":
					action= translator.get(path,lang);
					break;
				case "patch":
					if(isTranslator)
						action = translator.patch(path,lang);
					else
						action = deep.errors.Forbidden("you need to be translator to perform this operation.");
					break;
			}
			deep.when(action)
			.done(function (success) {
				res.writeHead(200, {'Content-Type': 'application/json;charset=utf-8', "Location":req.url});
				res.end(JSON.stringify(success));
			})
			.fail(function(e){
				console.log("translation error : ", e.toString());
				res.writeHead(e.status || 400, {'Content-Type': 'text/html'});
				res.end("error : "+JSON.stringify(e));
			});
		}
		else
		{
			console.log("translation error : Nothing found with translator : ", translator);
				res.writeHead(e.status || 400, {'Content-Type': 'text/html'});
				res.end("error : "+JSON.stringify(e));
		}
		
	};
};
var Translator = exports.Translator = function (folderPath) {
	this.stores = {};
};

Translator.prototype = {
	get:function (path, lang) {
		if(!this.stores[lang])
			this.stores[lang] = deep.store.node.fs.Object.create(null, this.folderPath + lang + ".json");
		
		return this.stores[lang].get(path);
	}
};
