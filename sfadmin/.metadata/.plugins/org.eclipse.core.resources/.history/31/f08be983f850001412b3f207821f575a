@isTest
private class Test_ThreevotApiOperations {

    static testMethod void testApexWithNamespace() {
        string result = ThreeVotApiOperations.apex('{"result":true}','threevot.ExampleClass');
        System.assertEquals(result,'{"result": true}');
    }
    
    static testMethod void testApexWithoutNamespace() {
        string result = ThreeVotApiOperations.apex('{"result":true}','ExampleClass');
        System.assertEquals(result,'{"result": true}');
    }

    static testMethod void testApexNotFound() {
        string result = ThreeVotApiOperations.apex('{"result":true}','ExampleClassWrong');
        System.assert( result.indexOf('NOT_FOUND') > -1 );
    }

    static testMethod void testApexException() {
        string result = ThreeVotApiOperations.apex('{"BADJSON}','ExampleClass');
        System.assert( result.indexOf('APEX_EXCEPTION') > -1 );
    }
    
}