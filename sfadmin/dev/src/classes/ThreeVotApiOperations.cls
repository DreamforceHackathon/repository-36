public with sharing class ThreeVotApiOperations {

	public static string apex(string rawJSON, string className){
		try{
			string originalClassName = className;
			List<string> classParts = className.split('\\.');
			string namespace = '';

			if( classParts.size() > 1 ){
				namespace = classParts.get(0);
				className = classParts.get(1);
			}
				
			Type t = Type.forName(className);
	        if(t == null && className != null) {
	            // Attempt to get the type again with the namespace explicitly set
	            t = Type.forName(namespace, className);
	        }
	        if(t == null && className != null) {
	            // Attempt to get the type again with the namespace explicitly set to blank
	            t = Type.forName('', className);
	        }
	        if(t == null) {
	            return RemoteTKController.makeError('Could not find class: ' + originalClassName , 'NOT_FOUND');
	        }
		
			IApexController controller = (IApexController)t.newInstance();
			return controller.execute(rawJSON);
		}catch(exception ex){
			return RemoteTKController.makeError(ex.getMessage(), 'APEX_EXCEPTION');
		}
	}

}