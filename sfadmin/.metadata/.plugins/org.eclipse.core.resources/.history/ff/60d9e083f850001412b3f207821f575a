public class ExampleClass implements IApexController  {
    
    public string execute(string arguments) {
        Map<string, object> parsedJson = (Map<String, Object>)JSON.deserializeUntyped(arguments);
        boolean test = (boolean)parsedJson.get('result');
   		return '{"result": '+test+'}';
        
    }
}