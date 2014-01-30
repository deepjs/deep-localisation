/**
 * @author Gilles Coomans <gilles.coomans@gmail.com>
 *
 */
var deep = require("deepjs/deep");
require("deep-mongo");

var store = deep.store.Mongo.create("translate", "mongodb://127.0.0.1:27017/smart-localisation", "translate",{
	properties:{
		id:{ type:"string", required:false, indexed:true },
		language:{ type:"string", required:true},
		module:{ type:"string", required:true, minLength:3},
		translations:{ type:"object", required:true}
	}
});

exports.middleware = function(initialiser){
	return function (req, res, next)
	{
		//console.log("Translate middleware : req url = ", req.url);
		var lang = deep.context.language;
		lang = "nl";
		var splitted = req.url.split("/");
		splitted.shift(); //drop the first empty element
		//console.log("Translate middleware : splitted url = ", lang, splitted);

		if(splitted[0] != "translate")
			return next();
		
		splitted.shift();

		var roles = deep.context.modes.roles, isTranslator = false;
		if(roles && roles.foreach)
		{
			if(deep.utils.inArray("translator", roles))
				isTranslator = true;
		}
		else
		{
			if(roles == "translator")
				isTranslator = true;
		}
		isTranslator = true;

		var moduleName = splitted.shift();
		var path = splitted.join("/");

		switch(req.method.toLowerCase())
		{
			case "get":
				break;
			case "patch":
				var action = null;
				if(isTranslator)
					action = deep.store(store).get("?language=" + smart.country + "-" + lang + "&module=" + moduleName)
					.done(function(results){
						if(results.length === 0)
							return deep.errors.NotFound();
						var datas = results.shift();
						this.patch(req.body,{ id:"/"+datas.id+"/translations/"+path });
					});
				else
					action = deep.errors.Forbidden("you need to be translator to perform this operation.");
				deep.when(action)
				.done(function (success) {
					res.writeHead(200, {'Content-Type': 'application/json;charset=utf-8', "Location":req.url});
					res.end(JSON.stringify(success.translations));
				})
				.fail(function(e){
					console.log("translation error : ", e.toString());
					res.writeHead(e.status || 400, {'Content-Type': 'text/html'});
					res.end("error : "+JSON.stringify(e));
				});
				return;
			default: throw deep.errors.MethodNotAllowed();
		}

		var query = "translate::?language=" + smart.country + "-" + lang + "&module=" + moduleName;
		//console.log("Translation Query = ", query);
		deep(query)
		.done(function (success) {

			if(success.length === 0)
			{
				//the file didnt exist create it if translator
				if(isTranslator)
				{
					if(lang != "en")
					{//make a copy of en and create the new one
						return deep("translate::?language=" + smart.country + "-en" +  "&module=" + moduleName)
						//.log("------Getting Default EN translations for creating " + lang)
						.done(function (success) {
							if(success.length === 0)
								return deep.errors.NotFound(); // the module didnt exist yet
							else
							{
								success = success.shift();
								deep.store("translate").post({
									language:smart.country + "-" + lang,
									module:moduleName,
									translations:success.translations
								}).done(function (success) {
									//console.log("creating default SUCCESS");
									var rez = null;
									if(path === "")
										rez = success.translations;
									else
										rez = deep.query(success.translations,  path);
									res.writeHead(200, {'Content-Type': 'application/json;charset=utf-8', "Location":req.url});
									res.end(JSON.stringify(rez));
								}).fail(function (e) {
									console.log("creating default ERROR");
									res.writeHead(e.status || 400, {'Content-Type': 'text/html'});
									res.end("error when creating the default translation file : "+JSON.stringify(e));
								});
							}
							
						});
					}
				}
				else
				{
					return deep.errors.NotFound();
				}
			}
			else
			{
				success = success.shift();
				//console.log("Path for translation : ", path);
				var rez = null;
				if(path === "")
					rez = success.translations;
				else
					rez = deep.query(success.translations,  path);
				// console.log("results for translation : ", rez);
				res.writeHead(200, {'Content-Type': 'application/json;charset=utf-8', "Location":req.url});
				res.end(JSON.stringify(rez));
			}
		}).fail(function (e) {
			console.log("Fail to catch a translation");
			res.writeHead(e.status || 400, {'Content-Type': 'text/html'});
			res.end("error : "+JSON.stringify(e));
		});

		
	};
};




