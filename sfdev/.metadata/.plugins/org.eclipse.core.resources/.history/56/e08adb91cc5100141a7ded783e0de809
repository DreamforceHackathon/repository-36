/*
 * Copyright (c) 2014, 3VOT Corporation.
 * All rights reserved.
*/

/*
	ThreeVotApiController acts like a Interface to the Salesforce API and operates inside Visualforce, 
	this way Javascript applications can use traditional open source components to send/receive SF Data 
	
	This simple class uses the Force.com Open Source RemoteTKController to encode and decode JSON 
	
*/

global with sharing class  ThreeVotApiController {
    
    //handleRest receives an REST Operation['get,post,put,del'] a url and a JSON

	/*
		Class Entry Point for Visualforce Remoting
		It requires: 
			An HTTP VERB that defines what operation to perform ['get,post,put,del']
			An Url that defines the targeted object or custom operation to be performaned
			An optional Fields argument for upsert and query operations
	*/
    @RemoteAction
    global static String handleRest(string verb, String url, string fields) {
        //Get any query string parameters
        Map<String,String> queryReference  = new PageReference(url).getParameters();
        Map<String, String> urlReference = getUrlParts(url);
            if( isApiOperation(urlReference.get('operation') ) ){ 
                return ThreeVotApiController.doApiOperation(verb, urlReference.get('operation'), fields, queryReference); 
            }
            else if( isRest( urlReference.get('type') ) ){
                return ThreeVotApiController.doRest(verb, urlReference.get('type'), urlReference.get('id'), fields);
            }
           
            return RemoteTKController.makeError('Operation not found, request url and/or options are not valid', 'INVALID_OPERATION');
    }
    
    
    /*
		This function get's called when we determined it's a REST Operation
	*/
    public static string doRest(string verb, string objtype, string id, string fields){
        string result = RemoteTKController.makeError('Operation Not Found', 'ERR-3VOT-1');
        if(verb == 'post'){ result = RemoteTKController.create(objtype, fields); }
        else if(verb == 'get'){ result = RemoteTKController.retrieve(objtype, id, fields ); }
        else if(verb == 'del'){ result = RemoteTKController.del(objtype, id); }
        else if(verb == 'put'){ result = RemoteTKController.updat(objtype, id, fields); }
        return result;
    }
    
    /*
		This function get's called when we determined it's a Custom Operation
	*/
    public static string doApiOperation(string verb, string type, string fields, map<string,string> queryReference){
        string result = '';
        //if(verb == 'post'){
        	//queryReference = (Map<String,String>)JSON.deserializeUntyped(fields);
        //}
        
        if( type == 'query'&& queryReference.get('query') != null ){ 
        	result = RemoteTKController.query( queryReference.get('query') ); 
        }
         else if( type == 'apex' && queryReference.get('arguments') != null && queryReference.get('class') != null ){ 
        	result = ThreeVotApiOperations.apex(queryReference.get('arguments') ,queryReference.get('class'));
        }
        else{
        	result = RemoteTKController.makeError('Query or Body Arguments do not match API Operations','MALFORMED_QUERY');
        }

        return result;
    }
    
 	/*
		Helper function to split URL in Object, Id and Custom Parts
	*/
 	public static Map<String,String> getUrlParts(string url){
	    Map<string,string> result = new Map<String,String>();
	    List<string> queryParts = url.split('\\?');
	    List<string> urlParts = queryParts[0].split('/');
	    
	    if( ThreeVotApiController.isApiOperation(urlParts.get(1)) ){
	    	result.put('operation', urlParts.get(1));                       
	    }
	    else{ 
	    	result.put('type', urlParts.get(1));                       
	        if( urlparts.size() > 2  && ThreeVotApiController.isIdValid(urlParts.get(2)) ){
	           result.put('id', urlParts.get(2) );
	        }
	    }
	
	    return result;
	}
    
    /*
		Helper function to figure if URL Part is an ID or another element
	*/
    public static boolean isIdValid(string MyTestString){
        ID MyTestID = null;
        try {
            MyTestID = MyTestString; 
            return true;
        }
        catch(Exception ex) { return false; }
    }

	/*
		Helper function to figure if URL Part is a Salesforce Object
	*/
    public static boolean isRest(string type){
        boolean result = false;
        if (Schema.getGlobalDescribe().get(type) != null) { result = true; }
        return result;
    }

	/*
		Helper function to figure if URL Part is a Custom Operation
	*/
    public static boolean isApiOperation(string type){
        boolean result = false;
        if (type == 'query') { result = true; }
        else if(type== 'apex'){ result= true; }
        else if(type== 'analytics'){ result= true; }
        return result;
    }
 
}