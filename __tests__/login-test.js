
jest.autoMockOff();
//jest.dontMock('../js/components/Login.js');

describe('Login', function(){
	var React = require('react/addons');
	var TestUtils = React.addons.TestUtils;
	var Login = require('../js/components/Login');
	
	it('should exists', function() {
    	var login = TestUtils.renderIntoDocument( <Login /> );
      	expect(TestUtils.isCompositeComponent(login)).toBeTruthy();
  	});
});