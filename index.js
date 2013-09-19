if(typeof define !== 'function')
	var define = require('amdefine')(module);

define(["require","deep/deep"],function (require, deep)
{
	var deep = require("deep/deep");
	//__________________________________________________
	deep.protocoles.translate = new deep.Store();

	var filter = function (root, language, wrap) {
	
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
                        currentRes[i] = wrap?wrap(va[language], current.path+i):va[language];
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
   }
	deep.protocoles.translate.options = null;

	
	deep.protocoles.translate.get = function (id, opt) {
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
			return deep.errors.Protocole("No language available for translate protocole");
		//console.log("swig store : ", id, options)
    console.log("tranlate options : ", options.language());
		if(options.cache !== false && deep.mediaCache.cache["translate-" + lang + "::" +id])
			return deep(deep.mediaCache.cache["translate-" + lang + "::" +id]).store(this);
		var self = this;
		var d = deep("json::" + id)
		.done(function (data) {
			//prendre la langue
			var resi = filter(data, lang, options.wrap);
			//console.log("translate store : resi ", resi);
			delete deep.mediaCache.cache["translate-" + lang + "::"+id];
			if((options && options.cache !== false)  || (self.options && self.options.cache !== false))
				deep.mediaCache.manage(resi, "translate-" + lang + "::" +id);
			return resi;
		})
		.store(this);
		if((options && options.cache !== false)  || (self.options && self.options.cache !== false))
			deep.mediaCache.manage(d, "translate-" + lang + "::" +id);
		return d;
	};
	
	return function (opt) {
		console.log("Options in tranlsate protocole = ", opt);
		deep.protocoles.translate.options = opt || {};
	}
});