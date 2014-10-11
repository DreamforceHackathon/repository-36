@isTest
private class Test_ThreeVotApiController {

    static testMethod void test_is_api_operation() {
        boolean result = ThreeVotApiController.isApiOperation('query');
        system.assertEquals(result,true);
    }

    static testMethod void test_api_operation() {
        Account account = new Account();
        account.Name = 'Test Account Do Rest';
        insert  account;

        Contact contact = new Contact();
        contact.FirstName = 'Test Account Do Rest';
		contact.LastName = 'Test Account Do Rest';
        contact.AccountId = account.id;
        insert  contact;
        
        map<string,string> queryReference = new map<string,string>();
        queryReference.put('query','select id,name from account where name = \'Test Account Do Rest\'');
        string result = ThreeVotApiController.doApiOperation('get','query','',queryReference);  
        system.assert(result.indexof('Do Rest')  > -1 );
    }


    static testMethod void test_handleRest() {
        Account account = new Account();
        account.Name = 'Test Account Do Rest 2';
        insert  account;
        string id = account.id;

        Account account2 = new Account();
        account2.Name = 'Test Account Do Rest 3';
        insert  account2;
        
        Contact contact = new Contact();
        contact.FirstName = 'Test Contact Do Rest';
		contact.LastName = 'Test Contact Do Rest';
        contact.AccountId = account2.id;
        insert  contact;
        system.assert(contact.id != null);
        
        string result_rest_get = ThreeVotApiController.handleRest('get', '/account/' + account.id, 'id,name' );
        string result_rest_put = ThreeVotApiController.handleRest('put', '/account/' + account.id, '{"name": "name changed"}' );
        string result_rest_del = ThreeVotApiController.handleRest('del', '/account/' + account.id, '' );
        string result_rest_post = ThreeVotApiController.handleRest('post', '/account', '{"name": "created account in test rest"}' );    
        string result_rest_post_account = ThreeVotApiController.handleRest('post', '/contact', '{"firstname": "created contact in test rest","lastname":"lastname","accountid":"'+account2.id+'"}' );    


        string result_rest_query = ThreeVotApiController.handleRest('get', '/query?query=select id, name from account', '' );
        string result_rest_queryRelation = ThreeVotApiController.handleRest('get', '/query?query=select id,FirstName,account.name from contact', '' );

        string result_rest_apex = ThreeVotApiController.handleRest('get', '/apex?class=ExampleClass&arguments={"result":true}', '');

        string result_rest_error = ThreeVotApiController.handleRest('get', '/otherAction/' + account.id, 'id,name' );

    
        system.assert(result_rest_error.indexOf('INVALID_OPERATION') > -1);
        system.assertEquals(result_rest_put, null);
        system.assertEquals(result_rest_del, null);
        
        system.assert(result_rest_query.indexOf('created account in test rest') > -1);
        system.assert(result_rest_post_account.indexOf('"success":true')>-1);
        system.assert(result_rest_post.indexOf('"success":true')>-1);
        system.assert(result_rest_queryRelation.indexOf('Test Contact Do Rest') > -1);
        
        system.assertEquals(result_rest_apex, '{"result": true}' );

    }

    static testMethod void test_doRest() {
        Account account = new Account();
        account.Name = 'Test Account 0';
        insert  account;
        string id = account.id;
        
        string jsonResult_get = ThreeVotApiController.doRest('get', 'account', account.id, 'id,name,type');
        string jsonResult_put = ThreeVotApiController.doRest('put', 'account', account.id, '{"name": "test account 0 changed"}');
        
        string jsonResult_post = ThreeVotApiController.doRest('post', 'account', '', '{"name": "test account 1"}');
        string jsonResult_del = ThreeVotApiController.doRest('del', 'account', account.id, '');
        string jsonResult_error = ThreeVotApiController.doRest('otherVerb', '', '', '');

        list<account> accounts = [select id, name from account where name = 'test account 1'];
        system.assertEquals(accounts.size(), 1);

        accounts = [select id, name from account where name = 'test account 0 changed'];
        system.assertEquals(accounts.size(), 0);
        
        system.assert(jsonResult_error.indexOf('ERR-3VOT-1') > -1);
        system.assertEquals(jsonResult_put, null);

        system.assertEquals(jsonResult_del, null);
        system.assert(jsonResult_get.indexOf('"Id":"' + id + '"') > -1);

    }

    static testMethod void test_UrlParts() {
        Account account = new Account();
        account.Name = 'Test Account 0';
        insert  account;

        string url_operation = '/query?query=ok';
        string url_id = '/account/' + account.id;
        string url_object = '/account/aynything';
     
        Map<String,String> url_operation_parts = ThreeVotApiController.getUrlParts(url_operation);
        Map<String,String> url_id_parts =  ThreeVotApiController.getUrlParts(url_id);
        Map<String,String> url_object_parts = ThreeVotApiController.getUrlParts(url_object);

    
    	System.assertEquals( url_operation_parts.get('operation'), 'query' );
		System.assertEquals( url_id_parts.get('type'), 'account' );
		System.assertEquals( url_id_parts.get('id'), account.id );
		System.assertEquals( url_object_parts.get('type'), 'account' );
    }

    static testMethod void test_isValid() {
        Account account = new Account();
        account.Name = 'Test Account';
        insert account;
        
        boolean resultTrue = ThreeVotApiController.isIdValid(account.id) ;
        boolean resultFalse = ThreeVotApiController.isIdValid('abcderg');
        
        System.assertEquals(true, resultTrue);
        System.assertEquals(false, resultFalse);
    }

    static testMethod void test_isRest() {
        boolean resultTrue = ThreeVotApiController.isRest('Account');
        System.assertEquals(true, resultTrue);
        boolean resultFalse = ThreeVotApiController.isRest('notAnObject');
        System.assertEquals(false, resultFalse);
    }

    static testMethod void test_isApiOperation() {
 		System.assertEquals(true, ThreeVotApiController.isApiOperation('query'));
        
        System.assertEquals(true, ThreeVotApiController.isApiOperation('apex') );
        
        System.assertEquals(false, ThreeVotApiController.isApiOperation('other'));
        
    }

}